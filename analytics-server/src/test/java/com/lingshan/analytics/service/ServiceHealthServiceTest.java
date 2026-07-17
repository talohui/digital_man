package com.lingshan.analytics.service;

import com.lingshan.analytics.config.LingshanPathsProperties;
import com.lingshan.analytics.config.MarketingDecisionProperties;
import com.lingshan.analytics.controller.DashboardController;
import com.lingshan.analytics.dto.ServiceHealthComponent;
import com.lingshan.analytics.dto.ServiceHealthResponse;
import com.lingshan.analytics.dto.ServiceHealthStatus;
import com.lingshan.analytics.dto.WeatherServiceSettingsResponse;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ServiceHealthServiceTest {
    private static final Instant NOW = Instant.parse("2026-07-16T06:00:00Z");
    private static final Duration CACHE_TTL = Duration.ofSeconds(30);
    private static final Duration PROBE_TIMEOUT = Duration.ofMillis(100);

    @Test
    void returnsAllComponentsInOrderWhenEveryProbeIsNormal() {
        MutableClock clock = new MutableClock(NOW);
        ServiceHealthResponse response = service(clock, Map.of()).check();

        assertThat(response.overall()).isEqualTo(ServiceHealthStatus.NORMAL);
        assertThat(response.checkedAt()).isEqualTo(NOW);
        assertThat(response.components())
                .extracting(ServiceHealthComponent::key)
                .containsExactly("analytics", "fay", "rag", "weather", "model");
        assertThat(response.components())
                .allSatisfy(component -> {
                    assertThat(component.status()).isEqualTo(ServiceHealthStatus.NORMAL);
                    assertThat(component.checkedAt()).isEqualTo(NOW);
                    assertThat(component.lastSuccessAt()).isEqualTo(NOW);
                    assertThat(component.latencyMs()).isNotNegative();
                    assertThat(component.recoveryPath()).startsWith("/admin/");
                    assertThat(component.recoveryPath()).doesNotContain("://");
                });
    }

    @Test
    void reportsSingleDegradedComponentWithoutHidingHealthyComponents() {
        ServiceHealthResponse response = service(
                new MutableClock(NOW),
                Map.of("rag", () -> result(ServiceHealthStatus.DEGRADED, "知识库响应异常"))
        ).check();

        assertThat(response.overall()).isEqualTo(ServiceHealthStatus.DEGRADED);
        assertThat(component(response, "rag").status()).isEqualTo(ServiceHealthStatus.DEGRADED);
        assertThat(component(response, "analytics").status()).isEqualTo(ServiceHealthStatus.NORMAL);
    }

    @Test
    void reportsMissingWeatherAndModelConfigurationAsUnconfigured() {
        ServiceHealthResponse response = service(
                new MutableClock(NOW),
                Map.of(
                        "weather", () -> result(ServiceHealthStatus.UNCONFIGURED, "天气 Key 尚未配置"),
                        "model", () -> result(ServiceHealthStatus.UNCONFIGURED, "模型服务尚未配置")
                )
        ).check();

        assertThat(response.overall()).isEqualTo(ServiceHealthStatus.UNCONFIGURED);
        assertThat(component(response, "weather").status()).isEqualTo(ServiceHealthStatus.UNCONFIGURED);
        assertThat(component(response, "weather").lastSuccessAt()).isNull();
        assertThat(component(response, "model").status()).isEqualTo(ServiceHealthStatus.UNCONFIGURED);
    }

    @Test
    void boundsCancelsAndReportsSlowOrFailedProbesOffline() throws Exception {
        AtomicInteger interruptedProbes = new AtomicInteger();
        CountDownLatch slowProbesFinished = new CountDownLatch(4);
        Supplier<ServiceHealthService.ProbeResult> slowProbe = () -> {
            try {
                Thread.sleep(5_000);
            } catch (InterruptedException exception) {
                interruptedProbes.incrementAndGet();
                Thread.currentThread().interrupt();
            } finally {
                slowProbesFinished.countDown();
            }
            return result(ServiceHealthStatus.NORMAL, "服务运行正常");
        };
        Supplier<ServiceHealthService.ProbeResult> failedProbe = () -> {
            throw new IllegalStateException("连接失败");
        };
        ServiceHealthService service = service(
                new MutableClock(NOW),
                Map.of(
                        "analytics", slowProbe,
                        "fay", slowProbe,
                        "rag", failedProbe,
                        "weather", slowProbe,
                        "model", slowProbe
                ),
                Duration.ofMillis(100),
                new AtomicInteger()
        );

        long startedAt = System.nanoTime();
        ServiceHealthResponse response = service.check();
        long elapsedMs = Duration.ofNanos(System.nanoTime() - startedAt).toMillis();

        assertThat(elapsedMs).isLessThan(250);
        assertThat(response.overall()).isEqualTo(ServiceHealthStatus.OFFLINE);
        assertThat(component(response, "analytics").status()).isEqualTo(ServiceHealthStatus.OFFLINE);
        assertThat(component(response, "fay").status()).isEqualTo(ServiceHealthStatus.OFFLINE);
        assertThat(component(response, "rag").status()).isEqualTo(ServiceHealthStatus.OFFLINE);
        assertThat(component(response, "weather").status()).isEqualTo(ServiceHealthStatus.OFFLINE);
        assertThat(component(response, "model").status()).isEqualTo(ServiceHealthStatus.OFFLINE);
        assertThat(slowProbesFinished.await(300, TimeUnit.MILLISECONDS)).isTrue();
        assertThat(interruptedProbes).hasValue(4);
        service.shutdownProbeExecutor();
    }

    @Test
    void marksAFormerlyHealthyComponentStaleAndKeepsItsLastSuccessTime() {
        MutableClock clock = new MutableClock(NOW);
        AtomicReference<ServiceHealthService.ProbeResult> fayResult = new AtomicReference<>(
                result(ServiceHealthStatus.NORMAL, "Fay 运行正常")
        );
        ServiceHealthService service = service(clock, Map.of("fay", fayResult::get));

        service.check();
        clock.advance(Duration.ofSeconds(31));
        fayResult.set(result(ServiceHealthStatus.OFFLINE, "Fay 未响应"));
        ServiceHealthResponse refreshed = service.check();

        assertThat(refreshed.overall()).isEqualTo(ServiceHealthStatus.STALE);
        assertThat(component(refreshed, "fay").status()).isEqualTo(ServiceHealthStatus.STALE);
        assertThat(component(refreshed, "fay").lastSuccessAt()).isEqualTo(NOW);
        assertThat(component(refreshed, "fay").checkedAt()).isEqualTo(NOW.plusSeconds(31));
    }

    @Test
    void cachesOneThreadSafeSnapshotForThirtySeconds() throws Exception {
        MutableClock clock = new MutableClock(NOW);
        AtomicInteger probeCalls = new AtomicInteger();
        CountDownLatch callersReady = new CountDownLatch(8);
        CountDownLatch releaseFirstProbe = new CountDownLatch(1);
        ServiceHealthService service = service(
                clock,
                Map.of("analytics", () -> {
                    try {
                        if (!releaseFirstProbe.await(1, TimeUnit.SECONDS)) {
                            throw new IllegalStateException("测试 gate 未释放");
                        }
                    } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("测试 gate 被中断");
                    }
                    return result(ServiceHealthStatus.NORMAL, "分析服务运行正常");
                }),
                PROBE_TIMEOUT,
                probeCalls
        );
        ExecutorService callers = Executors.newFixedThreadPool(8);

        try {
            List<Future<ServiceHealthResponse>> futures = java.util.stream.IntStream.range(0, 8)
                    .mapToObj(ignored -> callers.submit(() -> {
                        callersReady.countDown();
                        return service.check();
                    }))
                    .toList();
            assertThat(callersReady.await(1, TimeUnit.SECONDS)).isTrue();
            releaseFirstProbe.countDown();
            List<ServiceHealthResponse> responses = futures.stream().map(this::await).toList();

            assertThat(probeCalls).hasValue(5);
            assertThat(responses).allSatisfy(response -> assertThat(response).isSameAs(responses.get(0)));

            clock.advance(Duration.ofSeconds(29));
            assertThat(service.check()).isSameAs(responses.get(0));
            assertThat(probeCalls).hasValue(5);

            clock.advance(Duration.ofSeconds(2));
            assertThat(service.check()).isNotSameAs(responses.get(0));
            assertThat(probeCalls).hasValue(10);
        } finally {
            releaseFirstProbe.countDown();
            callers.shutdownNow();
            service.shutdownProbeExecutor();
        }
    }

    @Test
    void doesNotResubmitTheSameProbeWhileAnInterruptedActionIsStillRunning() throws Exception {
        MutableClock clock = new MutableClock(NOW);
        AtomicInteger fayCalls = new AtomicInteger();
        AtomicInteger analyticsCalls = new AtomicInteger();
        CountDownLatch releaseFay = new CountDownLatch(1);
        CountDownLatch fayExited = new CountDownLatch(1);
        Supplier<ServiceHealthService.ProbeResult> stubbornFay = () -> {
            fayCalls.incrementAndGet();
            try {
                while (true) {
                    try {
                        releaseFay.await();
                        return result(ServiceHealthStatus.NORMAL, "Fay 运行正常");
                    } catch (InterruptedException ignored) {
                        // 模拟不配合中断的 JDBC/第三方阻塞调用。
                    }
                }
            } finally {
                fayExited.countDown();
            }
        };
        ServiceHealthService service = service(
                clock,
                Map.of(
                        "analytics", () -> {
                            analyticsCalls.incrementAndGet();
                            return result(ServiceHealthStatus.NORMAL, "分析服务运行正常");
                        },
                        "fay", stubbornFay
                ),
                Duration.ofMillis(25),
                new AtomicInteger()
        );

        try {
            service.check();
            clock.advance(Duration.ofSeconds(31));
            service.check();

            assertThat(fayCalls).hasValue(1);
            assertThat(analyticsCalls).hasValue(2);

            releaseFay.countDown();
            assertThat(fayExited.await(300, TimeUnit.MILLISECONDS)).isTrue();
            clock.advance(Duration.ofSeconds(31));
            service.check();
            assertThat(fayCalls).hasValue(2);
            assertThat(analyticsCalls).hasValue(3);
        } finally {
            releaseFay.countDown();
            service.shutdownProbeExecutor();
        }
    }

    @Test
    void neverLeaksUrlsKeysTokensOrExceptionDetails() {
        Supplier<ServiceHealthService.ProbeResult> leakingFailure = () -> {
            throw new IllegalStateException(
                    "https://upstream.example/v1 api_key=actual-secret Authorization: Bearer actual-token"
            );
        };
        ServiceHealthResponse response = service(
                new MutableClock(NOW),
                Map.of("model", leakingFailure)
        ).check();

        assertThat(response.toString())
                .doesNotContain("http://", "https://", "api_key", "actual-secret", "Bearer ", "actual-token")
                .doesNotContain(IllegalStateException.class.getName());
        assertThat(response.components()).allSatisfy(component ->
                assertThat(component.message()).containsPattern("[\\u4e00-\\u9fff]"));
    }

    @Test
    void allowsOnlyLiteralLoopbackHostsForNetworkProbes() throws Exception {
        Method predicate = ServiceHealthService.class.getDeclaredMethod("isLoopback", URI.class);
        predicate.setAccessible(true);

        assertThat((boolean) predicate.invoke(null, URI.create("http://localhost:5000"))).isTrue();
        assertThat((boolean) predicate.invoke(null, URI.create("http://127.0.0.1:5000"))).isTrue();
        assertThat((boolean) predicate.invoke(null, URI.create("http://[::1]:5000"))).isTrue();
        assertThat((boolean) predicate.invoke(null, URI.create("http://127.example.invalid"))).isFalse();
        assertThat((boolean) predicate.invoke(null, URI.create("https://example.invalid"))).isFalse();
    }

    @Test
    void doesNotReportModelNormalWhenModelsEndpointOmitsConfiguredModel(@TempDir Path tempDir) throws Exception {
        HttpServer server = modelServer("{\"data\":[{\"id\":\"fay\"},{\"id\":\"llm\"}]}");
        String baseUrl = serverBaseUrl(server);
        ServiceHealthService service = productionService(tempDir, baseUrl, baseUrl + "/v1");

        try {
            ServiceHealthComponent model = component(service.check(), "model");

            assertThat(model.status()).isEqualTo(ServiceHealthStatus.DEGRADED);
            assertThat(model.message()).isEqualTo("模型上游未提供已配置模型");
        } finally {
            service.shutdownProbeExecutor();
            server.stop(0);
        }
    }

    @Test
    void probesV1ModelsFromARootModelBaseAndRequiresConfiguredModel(@TempDir Path tempDir) throws Exception {
        HttpServer server = modelServer("{\"data\":[{\"id\":\"configured-model\"}]}");
        String baseUrl = serverBaseUrl(server);
        ServiceHealthService service = productionService(tempDir, baseUrl, baseUrl);

        try {
            assertThat(component(service.check(), "model").status()).isEqualTo(ServiceHealthStatus.NORMAL);
        } finally {
            service.shutdownProbeExecutor();
            server.stop(0);
        }
    }

    @Test
    void reportsModelUnconfiguredWhenApiKeyIsMissing(@TempDir Path tempDir) throws Exception {
        HttpServer server = modelServer("{\"data\":[{\"id\":\"configured-model\"}]}");
        String baseUrl = serverBaseUrl(server);
        ServiceHealthService service = productionServiceWithConfig(tempDir, baseUrl, """
                [key]
                gpt_model_engine = configured-model
                gpt_base_url = %s/v1
                gpt_api_key =
                """.formatted(baseUrl));

        try {
            assertThat(component(service.check(), "model").status())
                    .isEqualTo(ServiceHealthStatus.UNCONFIGURED);
        } finally {
            service.shutdownProbeExecutor();
            server.stop(0);
        }
    }

    @Test
    void prefersACompleteBigModelConfiguration(@TempDir Path tempDir) throws Exception {
        HttpServer server = modelServer("{\"data\":[{\"id\":\"configured-big-model\"}]}");
        String baseUrl = serverBaseUrl(server);
        ServiceHealthService service = productionServiceWithConfig(tempDir, baseUrl, """
                [key]
                gpt_model_engine =
                gpt_base_url =
                gpt_api_key =
                big_model_engine = configured-big-model
                big_model_base_url = %s/v1/chat/completions
                big_model_api_key = local-big-key
                """.formatted(baseUrl));

        try {
            assertThat(component(service.check(), "model").status()).isEqualTo(ServiceHealthStatus.NORMAL);
        } finally {
            service.shutdownProbeExecutor();
            server.stop(0);
        }
    }

    @Test
    void dashboardRouteStillReturnsHttp200WhenEveryDependencyFails() throws Exception {
        Supplier<ServiceHealthService.ProbeResult> failure = () -> {
            throw new IllegalStateException("依赖不可用");
        };
        ServiceHealthService service = service(
                new MutableClock(NOW),
                Map.of(
                        "analytics", failure,
                        "fay", failure,
                        "rag", failure,
                        "weather", failure,
                        "model", failure
                )
        );
        DashboardController controller = new DashboardController(null, null, null, null, service);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/api/dashboard/service-health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overall").value("OFFLINE"))
                .andExpect(jsonPath("$.components.length()").value(5));
    }

    private ServiceHealthService service(
            MutableClock clock,
            Map<String, Supplier<ServiceHealthService.ProbeResult>> overrides
    ) {
        return service(clock, overrides, PROBE_TIMEOUT, new AtomicInteger());
    }

    private ServiceHealthService service(
            MutableClock clock,
            Map<String, Supplier<ServiceHealthService.ProbeResult>> overrides,
            Duration probeTimeout,
            AtomicInteger probeCalls
    ) {
        List<ServiceHealthService.ProbeDefinition> probes = List.of(
                probe("analytics", "分析服务", "/admin/config", overrides, probeCalls),
                probe("fay", "数字人服务", "/admin/config", overrides, probeCalls),
                probe("rag", "知识库服务", "/admin/kb", overrides, probeCalls),
                probe("weather", "天气服务", "/admin/config", overrides, probeCalls),
                probe("model", "模型服务", "/admin/config", overrides, probeCalls)
        );
        return new ServiceHealthService(probes, clock, CACHE_TTL, probeTimeout);
    }

    private ServiceHealthService productionService(Path tempDir, String serviceBaseUrl, String modelBaseUrl)
            throws IOException {
        return productionServiceWithConfig(tempDir, serviceBaseUrl, """
                [key]
                gpt_model_engine = configured-model
                gpt_base_url = %s
                gpt_api_key = local-test-key
                """.formatted(modelBaseUrl));
    }

    private ServiceHealthService productionServiceWithConfig(
            Path tempDir,
            String serviceBaseUrl,
            String config
    ) throws IOException {
        Files.writeString(tempDir.resolve("system.conf"), config, StandardCharsets.UTF_8);
        LingshanPathsProperties paths = new LingshanPathsProperties();
        paths.getFay().setConfigPath(tempDir.resolve("config.json").toString());

        WeatherServiceSettingsService weatherSettings = new WeatherServiceSettingsService(null, null, null) {
            @Override
            public WeatherServiceSettingsResponse current() {
                return new WeatherServiceSettingsResponse(false, null, "none");
            }
        };

        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:service-health-" + System.nanoTime() + ";DB_CLOSE_DELAY=-1",
                "sa",
                ""
        );
        return new ServiceHealthService(
                new JdbcTemplate(dataSource),
                new MarketingDecisionProperties(serviceBaseUrl, 300, 300),
                weatherSettings,
                paths,
                serviceBaseUrl
        );
    }

    private HttpServer modelServer(String modelsResponse) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/get-system-status", exchange -> respond(exchange, "{}"));
        server.createContext("/kb/health", exchange -> respond(exchange, "{\"status\":\"ok\"}"));
        server.createContext("/v1/models", exchange -> respond(exchange, modelsResponse));
        server.start();
        return server;
    }

    private String serverBaseUrl(HttpServer server) {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private void respond(HttpExchange exchange, String body) throws IOException {
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, payload.length);
        try (var response = exchange.getResponseBody()) {
            response.write(payload);
        }
    }

    private ServiceHealthService.ProbeDefinition probe(
            String key,
            String label,
            String recoveryPath,
            Map<String, Supplier<ServiceHealthService.ProbeResult>> overrides,
            AtomicInteger calls
    ) {
        Supplier<ServiceHealthService.ProbeResult> delegate = overrides.getOrDefault(
                key,
                () -> result(ServiceHealthStatus.NORMAL, label + "运行正常")
        );
        return new ServiceHealthService.ProbeDefinition(
                key,
                label,
                recoveryPath,
                () -> {
                    calls.incrementAndGet();
                    return delegate.get();
                }
        );
    }

    private ServiceHealthService.ProbeResult result(ServiceHealthStatus status, String message) {
        return new ServiceHealthService.ProbeResult(status, message);
    }

    private ServiceHealthComponent component(ServiceHealthResponse response, String key) {
        return response.components().stream()
                .filter(component -> component.key().equals(key))
                .findFirst()
                .orElseThrow();
    }

    private ServiceHealthResponse await(Future<ServiceHealthResponse> future) {
        try {
            return future.get();
        } catch (Exception exception) {
            throw new AssertionError(exception);
        }
    }

    private static final class MutableClock extends Clock {
        private final AtomicReference<Instant> current;

        private MutableClock(Instant current) {
            this.current = new AtomicReference<>(current);
        }

        private void advance(Duration duration) {
            current.updateAndGet(instant -> instant.plus(duration));
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return current.get();
        }
    }
}
