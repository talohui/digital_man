package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.config.LingshanPathsProperties;
import com.lingshan.analytics.config.MarketingDecisionProperties;
import com.lingshan.analytics.dto.ServiceHealthComponent;
import com.lingshan.analytics.dto.ServiceHealthResponse;
import com.lingshan.analytics.dto.ServiceHealthStatus;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

@Service
public class ServiceHealthService {
    private static final Duration CACHE_TTL = Duration.ofSeconds(30);
    private static final Duration PROBE_TIMEOUT = Duration.ofMillis(800);
    private static final Duration HTTP_CONNECT_TIMEOUT = Duration.ofMillis(300);
    private static final Duration HTTP_REQUEST_TIMEOUT = Duration.ofMillis(650);
    private static final int MAX_MODEL_RESPONSE_BYTES = 64 * 1024;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final List<ProbeDefinition> probes;
    private final Clock clock;
    private final Duration cacheTtl;
    private final Duration probeTimeout;
    private final ThreadPoolExecutor probeExecutor;
    private final Object cacheLock = new Object();
    private final Map<String, Instant> lastSuccessAt = new HashMap<>();
    private final Set<String> probesInFlight = ConcurrentHashMap.newKeySet();
    private volatile CacheEntry cache;

    @Autowired
    public ServiceHealthService(
            JdbcTemplate jdbcTemplate,
            MarketingDecisionProperties fayProperties,
            WeatherServiceSettingsService weatherSettingsService,
            LingshanPathsProperties pathsProperties,
            @Value("${lingshan.kb.base-url:}") String ragBaseUrl
    ) {
        this(
                productionProbes(
                        jdbcTemplate,
                        fayProperties.normalizedFayBaseUrl(),
                        ragBaseUrl,
                        weatherSettingsService,
                        pathsProperties.getFay().getConfigPath()
                ),
                Clock.systemUTC(),
                CACHE_TTL,
                PROBE_TIMEOUT
        );
    }

    ServiceHealthService(
            List<ProbeDefinition> probes,
            Clock clock,
            Duration cacheTtl,
            Duration probeTimeout
    ) {
        this.probes = List.copyOf(probes);
        this.clock = clock;
        this.cacheTtl = cacheTtl;
        this.probeTimeout = probeTimeout;
        this.probeExecutor = probeExecutor();
    }

    public ServiceHealthResponse check() {
        Instant now = clock.instant();
        CacheEntry current = cache;
        if (current != null && now.isBefore(current.expiresAt())) {
            return current.response();
        }

        synchronized (cacheLock) {
            now = clock.instant();
            current = cache;
            if (current != null && now.isBefore(current.expiresAt())) {
                return current.response();
            }
            ServiceHealthResponse response = refresh(now);
            cache = new CacheEntry(response, now.plus(cacheTtl));
            return response;
        }
    }

    private ServiceHealthResponse refresh(Instant checkedAt) {
        List<Future<TimedProbeResult>> futures = new ArrayList<>(probes.size());
        for (ProbeDefinition probe : probes) {
            futures.add(submit(probe));
        }

        long deadline = System.nanoTime() + probeTimeout.toNanos();
        List<TimedProbeResult> results = new ArrayList<>(probes.size());
        boolean restoreInterrupt = false;
        for (int index = 0; index < probes.size(); index++) {
            ProbeDefinition probe = probes.get(index);
            Future<TimedProbeResult> future = futures.get(index);
            if (future == null) {
                results.add(offline(probe, "探测繁忙", 0));
                continue;
            }
            try {
                long remaining = deadline - System.nanoTime();
                if (remaining <= 0 && !future.isDone()) {
                    throw new TimeoutException();
                }
                results.add(future.get(Math.max(0, remaining), TimeUnit.NANOSECONDS));
            } catch (TimeoutException exception) {
                future.cancel(true);
                results.add(offline(probe, "探测超时", probeTimeout.toMillis()));
            } catch (InterruptedException exception) {
                future.cancel(true);
                restoreInterrupt = true;
                results.add(offline(probe, "探测中断", 0));
            } catch (CancellationException | ExecutionException exception) {
                results.add(offline(probe, "暂不可用", 0));
            }
        }
        for (Future<TimedProbeResult> future : futures) {
            if (future != null && !future.isDone()) {
                future.cancel(true);
            }
        }
        if (restoreInterrupt) {
            Thread.currentThread().interrupt();
        }

        List<ServiceHealthComponent> components = new ArrayList<>(probes.size());
        for (int index = 0; index < probes.size(); index++) {
            ProbeDefinition probe = probes.get(index);
            TimedProbeResult timed = results.get(index);
            ProbeResult raw = timed.result();
            ServiceHealthStatus status = raw.status();
            String message = raw.message();
            Instant previousSuccess = lastSuccessAt.get(probe.key());

            if (status == ServiceHealthStatus.NORMAL) {
                previousSuccess = checkedAt;
                lastSuccessAt.put(probe.key(), checkedAt);
            } else if (status == ServiceHealthStatus.OFFLINE && previousSuccess != null) {
                status = ServiceHealthStatus.STALE;
                message = probe.label() + "最近一次成功状态已过期";
            }

            components.add(new ServiceHealthComponent(
                    probe.key(),
                    probe.label(),
                    status,
                    message,
                    checkedAt,
                    previousSuccess,
                    timed.latencyMs(),
                    probe.recoveryPath()
            ));
        }

        ServiceHealthStatus overall = components.stream()
                .map(ServiceHealthComponent::status)
                .max(java.util.Comparator.comparingInt(ServiceHealthService::severity))
                .orElse(ServiceHealthStatus.NORMAL);
        return new ServiceHealthResponse(overall, checkedAt, List.copyOf(components));
    }

    private Future<TimedProbeResult> submit(ProbeDefinition probe) {
        if (!probesInFlight.add(probe.key())) {
            return null;
        }
        FutureTask<TimedProbeResult> task = new FutureTask<>(() -> run(probe)) {
            @Override
            public void run() {
                try {
                    super.run();
                } finally {
                    probesInFlight.remove(probe.key());
                }
            }
        };
        try {
            probeExecutor.execute(task);
            return task;
        } catch (RejectedExecutionException exception) {
            probesInFlight.remove(probe.key());
            return null;
        }
    }

    private TimedProbeResult offline(ProbeDefinition probe, String reason, long latencyMs) {
        return new TimedProbeResult(
                new ProbeResult(ServiceHealthStatus.OFFLINE, probe.label() + reason),
                latencyMs
        );
    }

    private TimedProbeResult run(ProbeDefinition probe) {
        long startedAt = System.nanoTime();
        try {
            ProbeResult result = probe.action().get();
            if (result == null || result.status() == null || result.message() == null) {
                result = new ProbeResult(ServiceHealthStatus.OFFLINE, probe.label() + "暂不可用");
            }
            return new TimedProbeResult(result, elapsedMillis(startedAt));
        } catch (RuntimeException exception) {
            return new TimedProbeResult(
                    new ProbeResult(ServiceHealthStatus.OFFLINE, probe.label() + "探测失败"),
                    elapsedMillis(startedAt)
            );
        }
    }

    private long elapsedMillis(long startedAt) {
        return Math.max(0, Duration.ofNanos(System.nanoTime() - startedAt).toMillis());
    }

    private static List<ProbeDefinition> productionProbes(
            JdbcTemplate jdbcTemplate,
            String fayBaseUrl,
            String ragBaseUrl,
            WeatherServiceSettingsService weatherSettingsService,
            String fayConfigPath
    ) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(HTTP_CONNECT_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        return List.of(
                new ProbeDefinition(
                        "analytics", "分析服务", "/admin/config",
                        () -> probeAnalytics(jdbcTemplate)
                ),
                new ProbeDefinition(
                        "fay", "数字人服务", "/admin/config",
                        () -> probeLocalHttp(
                                httpClient,
                                fayBaseUrl,
                                "/api/get-system-status",
                                "Fay 服务运行正常",
                                "Fay 服务响应异常"
                        )
                ),
                new ProbeDefinition(
                        "rag", "知识库服务", "/admin/kb",
                        () -> probeLocalHttp(
                                httpClient,
                                ragBaseUrl,
                                "/kb/health",
                                "知识库服务运行正常",
                                "知识库服务响应异常"
                        )
                ),
                new ProbeDefinition(
                        "weather", "天气服务", "/admin/config",
                        () -> probeWeather(weatherSettingsService)
                ),
                new ProbeDefinition(
                        "model", "模型服务", "/admin/config",
                        () -> probeModel(httpClient, fayConfigPath)
                )
        );
    }

    private static ProbeResult probeAnalytics(JdbcTemplate jdbcTemplate) {
        Integer value = jdbcTemplate.query(
                "SELECT 1",
                statement -> statement.setQueryTimeout(1),
                resultSet -> resultSet.next() ? resultSet.getInt(1) : null
        );
        if (value != null && value == 1) {
            return new ProbeResult(ServiceHealthStatus.NORMAL, "分析数据库连接正常");
        }
        return new ProbeResult(ServiceHealthStatus.DEGRADED, "分析数据库响应异常");
    }

    private static ProbeResult probeLocalHttp(
            HttpClient httpClient,
            String baseUrl,
            String endpointPath,
            String normalMessage,
            String degradedMessage
    ) {
        if (blank(baseUrl)) {
            return new ProbeResult(ServiceHealthStatus.UNCONFIGURED, "服务地址尚未配置");
        }
        URI base = parseHttpUri(baseUrl);
        if (base == null) {
            return new ProbeResult(ServiceHealthStatus.DEGRADED, "服务地址配置待检查");
        }
        if (!isLoopback(base)) {
            return new ProbeResult(ServiceHealthStatus.DEGRADED, "服务已配置，未执行外网探测");
        }
        URI endpoint = endpoint(base, endpointPath);
        int statusCode = send(httpClient, endpoint, null);
        return statusCode >= 200 && statusCode < 300
                ? new ProbeResult(ServiceHealthStatus.NORMAL, normalMessage)
                : new ProbeResult(ServiceHealthStatus.DEGRADED, degradedMessage);
    }

    private static ProbeResult probeWeather(WeatherServiceSettingsService settingsService) {
        try {
            if (!settingsService.current().configured()) {
                return new ProbeResult(ServiceHealthStatus.UNCONFIGURED, "天气 Key 尚未配置");
            }
            return new ProbeResult(ServiceHealthStatus.NORMAL, "天气 Key 已配置，数据按业务请求实时验证");
        } catch (RuntimeException exception) {
            return new ProbeResult(ServiceHealthStatus.DEGRADED, "天气配置暂不可用");
        }
    }

    private static ProbeResult probeModel(HttpClient httpClient, String fayConfigPath) {
        Path systemConfig = resolveSystemConfig(fayConfigPath);
        if (systemConfig == null) {
            return new ProbeResult(ServiceHealthStatus.UNCONFIGURED, "模型服务尚未配置");
        }

        Map<String, String> config;
        try {
            config = readKeySection(systemConfig);
        } catch (IOException exception) {
            return new ProbeResult(ServiceHealthStatus.DEGRADED, "模型配置暂不可用");
        }
        ModelConfig modelConfig = selectModelConfig(config);
        if (modelConfig == null) {
            return new ProbeResult(ServiceHealthStatus.UNCONFIGURED, "模型服务尚未配置");
        }

        URI base = parseHttpUri(modelConfig.baseUrl());
        if (base == null) {
            return new ProbeResult(ServiceHealthStatus.DEGRADED, "模型配置待检查");
        }
        if (!isLoopback(base)) {
            return new ProbeResult(ServiceHealthStatus.NORMAL, "模型已配置，请求按业务链路实时验证");
        }

        ModelHttpResponse response = sendForBody(
                httpClient,
                modelsEndpoint(base),
                modelConfig.apiKey()
        );
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return new ProbeResult(ServiceHealthStatus.DEGRADED, "模型上游响应异常");
        }
        if (!containsModel(response.body(), modelConfig.model())) {
            return new ProbeResult(ServiceHealthStatus.DEGRADED, "模型上游未提供已配置模型");
        }
        return new ProbeResult(ServiceHealthStatus.NORMAL, "模型上游连接正常");
    }

    private static ModelConfig selectModelConfig(Map<String, String> config) {
        ModelConfig big = new ModelConfig(
                config.get("big_model_engine"),
                firstConfigured(config.get("big_model_base_url"), config.get("gpt_base_url")),
                firstConfigured(config.get("big_model_api_key"), config.get("gpt_api_key"))
        );
        if (big.configured()) {
            return big.normalized();
        }
        ModelConfig small = new ModelConfig(
                config.get("gpt_model_engine"),
                config.get("gpt_base_url"),
                config.get("gpt_api_key")
        );
        return small.configured() ? small.normalized() : null;
    }

    private static String firstConfigured(String preferred, String fallback) {
        return blank(preferred) ? fallback : preferred;
    }

    private static URI modelsEndpoint(URI base) {
        String path = base.getPath() == null ? "" : base.getPath();
        while (path.endsWith("/") && !path.isEmpty()) {
            path = path.substring(0, path.length() - 1);
        }
        if (path.endsWith("/chat/completions")) {
            path = path.substring(0, path.length() - "/chat/completions".length());
        }
        path = path.endsWith("/v1") ? path + "/models" : path + "/v1/models";
        try {
            return new URI(base.getScheme(), null, base.getHost(), base.getPort(), path, null, null);
        } catch (URISyntaxException exception) {
            throw new IllegalStateException("模型服务地址无效");
        }
    }

    private static ModelHttpResponse sendForBody(HttpClient httpClient, URI uri, String apiKey) {
        HttpRequest.Builder request = request(uri, apiKey);
        try {
            HttpResponse<InputStream> response = httpClient.send(
                    request.build(),
                    HttpResponse.BodyHandlers.ofInputStream()
            );
            try (InputStream body = response.body()) {
                byte[] payload = body.readNBytes(MAX_MODEL_RESPONSE_BYTES + 1);
                if (payload.length > MAX_MODEL_RESPONSE_BYTES) {
                    return new ModelHttpResponse(response.statusCode(), new byte[0]);
                }
                return new ModelHttpResponse(response.statusCode(), payload);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("本机模型探测失败");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("本机模型探测中断");
        }
    }

    private static boolean containsModel(byte[] payload, String expectedModel) {
        if (payload == null || payload.length == 0) {
            return false;
        }
        try {
            JsonNode data = OBJECT_MAPPER.readTree(payload).path("data");
            if (!data.isArray()) {
                return false;
            }
            for (JsonNode model : data) {
                if (expectedModel.equals(model.path("id").asText())) {
                    return true;
                }
            }
            return false;
        } catch (IOException exception) {
            return false;
        }
    }

    private static int send(HttpClient httpClient, URI uri, String apiKey) {
        HttpRequest.Builder request = request(uri, apiKey);
        try {
            return httpClient.send(request.build(), HttpResponse.BodyHandlers.discarding()).statusCode();
        } catch (IOException exception) {
            throw new IllegalStateException("本机服务探测失败");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("本机服务探测中断");
        }
    }

    private static HttpRequest.Builder request(URI uri, String apiKey) {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri)
                .timeout(HTTP_REQUEST_TIMEOUT)
                .GET();
        if (!blank(apiKey)) {
            request.header("Authorization", "Bearer " + apiKey.trim());
        }
        return request;
    }

    private static URI parseHttpUri(String value) {
        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme();
            if (scheme == null || uri.getHost() == null || uri.getUserInfo() != null
                    || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                return null;
            }
            return uri;
        } catch (URISyntaxException exception) {
            return null;
        }
    }

    private static boolean isLoopback(URI uri) {
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (host.startsWith("[") && host.endsWith("]")) {
            host = host.substring(1, host.length() - 1);
        }
        if (host.equals("localhost") || host.equals("::1") || host.equals("0:0:0:0:0:0:0:1")) {
            return true;
        }
        String[] octets = host.split("\\.", -1);
        if (octets.length != 4 || !octets[0].equals("127")) {
            return false;
        }
        for (String octet : octets) {
            try {
                int value = Integer.parseInt(octet);
                if (value < 0 || value > 255) {
                    return false;
                }
            } catch (NumberFormatException exception) {
                return false;
            }
        }
        return true;
    }

    private static URI endpoint(URI base, String suffix) {
        String path = base.getPath() == null ? "" : base.getPath();
        if (path.endsWith("/") && suffix.startsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        try {
            return new URI(base.getScheme(), null, base.getHost(), base.getPort(), path + suffix, null, null);
        } catch (URISyntaxException exception) {
            throw new IllegalStateException("本机服务地址无效");
        }
    }

    private static Path resolveSystemConfig(String configuredFayPath) {
        if (blank(configuredFayPath)) {
            return null;
        }
        try {
            Path configured = Path.of(configuredFayPath.trim());
            Path cwd = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
            List<Path> candidates = new ArrayList<>();
            if (configured.isAbsolute()) {
                candidates.add(configured);
            } else {
                candidates.add(cwd.resolve(configured).normalize());
                candidates.add(cwd.resolve("analytics-server").resolve(configured).normalize());
            }
            return candidates.stream()
                    .map(path -> path.resolveSibling("system.conf"))
                    .filter(Files::isRegularFile)
                    .findFirst()
                    .orElse(null);
        } catch (InvalidPathException exception) {
            return null;
        }
    }

    private static Map<String, String> readKeySection(Path path) throws IOException {
        Map<String, String> values = new LinkedHashMap<>();
        boolean inKeySection = false;
        for (String line : Files.readAllLines(path)) {
            String trimmed = line.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                inKeySection = trimmed.equalsIgnoreCase("[key]");
                continue;
            }
            if (!inKeySection || trimmed.isEmpty() || trimmed.startsWith("#") || trimmed.startsWith(";")) {
                continue;
            }
            int equals = trimmed.indexOf('=');
            int colon = trimmed.indexOf(':');
            int delimiter = equals < 0 ? colon : colon < 0 ? equals : Math.min(equals, colon);
            if (delimiter > 0) {
                values.put(
                        trimmed.substring(0, delimiter).trim().toLowerCase(Locale.ROOT),
                        trimmed.substring(delimiter + 1).trim()
                );
            }
        }
        return values;
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static int severity(ServiceHealthStatus status) {
        return switch (status) {
            case NORMAL -> 0;
            case DEGRADED -> 1;
            case UNCONFIGURED -> 2;
            case STALE -> 3;
            case OFFLINE -> 4;
        };
    }

    private static ThreadPoolExecutor probeExecutor() {
        return new ThreadPoolExecutor(
                0,
                5,
                1,
                TimeUnit.SECONDS,
                new SynchronousQueue<>(),
                runnable -> {
                    Thread thread = new Thread(runnable, "service-health-probe");
                    thread.setDaemon(true);
                    return thread;
                },
                new ThreadPoolExecutor.AbortPolicy()
        );
    }

    @PreDestroy
    void shutdownProbeExecutor() {
        probeExecutor.shutdownNow();
    }

    record ProbeDefinition(
            String key,
            String label,
            String recoveryPath,
            Supplier<ProbeResult> action
    ) {
    }

    record ProbeResult(ServiceHealthStatus status, String message) {
    }

    private record TimedProbeResult(ProbeResult result, long latencyMs) {
    }

    private record CacheEntry(ServiceHealthResponse response, Instant expiresAt) {
    }

    private record ModelConfig(String model, String baseUrl, String apiKey) {
        private boolean configured() {
            return !blank(model) && !blank(baseUrl) && !blank(apiKey);
        }

        private ModelConfig normalized() {
            return new ModelConfig(model.trim(), baseUrl.trim(), apiKey.trim());
        }
    }

    private record ModelHttpResponse(int statusCode, byte[] body) {
    }
}
