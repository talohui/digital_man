package com.lingshan.analytics.service;

import com.lingshan.analytics.config.GorseProperties;
import com.lingshan.analytics.config.TencentWeatherProperties;
import com.lingshan.analytics.dto.GuideRecommendationRequest;
import com.lingshan.analytics.dto.GuideRecommendationResponse;
import com.lingshan.analytics.dto.EmergencyEventDto;
import com.lingshan.analytics.dto.ScenicWeatherDto;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import com.lingshan.analytics.repository.EmergencyEventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class GuideRecommendationServiceTest {

    @Test
    void returnsLocalRecommendationsWhenGorseIsDisabled() {
        EventRepository repository = repository(List.of());
        GuideRecommendationService service = new GuideRecommendationService(
                new GorseClient(new GorseProperties(false, "http://127.0.0.1:8087", "")),
                new LocalScoreEngine(repository)
        );

        GuideRecommendationResponse response = service.recommend(
                new GuideRecommendationRequest("u1", List.of("亲子游", "拍照打卡"), Map.of("duration", "quick"))
        );

        assertThat(response.engine()).isEqualTo("local-score-v1");
        assertThat(response.requestId()).startsWith("rec_");
        assertThat(response.routes()).hasSize(3);
        assertThat(response.recommendedRouteId()).isEqualTo("family");
        assertThat(response.routes().get(0).reason()).contains("亲子游").doesNotContain("兜底");
        assertThat(response.routes().get(0).debug()).containsEntry("engine", "local-score-v1");
    }

    @Test
    void appliesActiveEmergencyAndRecentVisitorHeatAfterRanking() {
        LocalDateTime now = LocalDateTime.now();
        List<AnalyticsEvent> events = List.of(
                spotEnter("jiulong_guanyu", now.minusMinutes(1)),
                spotEnter("jiulong_guanyu", now.minusMinutes(2)),
                spotEnter("jiulong_guanyu", now.minusMinutes(3)),
                spotEnter("jiulong_guanyu", now.minusMinutes(4))
        );
        EventRepository repository = repository(events);
        EmergencyEventService emergencies = new EmergencyEventService(emergencyRepository()) {
            @Override
            public List<EmergencyEventDto> active(LocalDateTime ignored) {
                return List.of(emergency("fan_gong"));
            }
        };
        GuideRecommendationService service = new GuideRecommendationService(
                new GorseClient(new GorseProperties(false, "http://127.0.0.1:8087", "")),
                new LocalScoreEngine(repository),
                new RouteConstraintEvaluator(),
                emergencies,
                repository
        );

        GuideRecommendationResponse response = service.recommend(
                new GuideRecommendationRequest("u1", List.of("亲子游"), Map.of())
        );

        assertThat(response.routes()).allSatisfy(route -> assertThat(route.stopIds()).doesNotContain("fan_gong"));
        assertThat(response.adjustmentReasons()).anyMatch(reason -> reason.contains("应急事件"));
        assertThat(response.dataFreshness()).containsEntry("heatSource", "游客端访问热度");
        assertThat(response.fallbackUsed()).isFalse();
    }

    @Test
    void usesCatalogDefaultsWhenPersonalizationIsDisabled() {
        EventRepository repository = repository(List.of());
        VisitorPrivacyService privacy = new VisitorPrivacyService(null, null, null, null) {
            @Override
            public boolean personalizationEnabled(String ignored) { return false; }
        };
        GuideRecommendationService service = new GuideRecommendationService(
                new GorseClient(new GorseProperties(false, "http://127.0.0.1:8087", "")),
                new LocalScoreEngine(repository), new RouteConstraintEvaluator(), null, repository, privacy
        );

        GuideRecommendationResponse response = service.recommend(
                new GuideRecommendationRequest(
                        "guest-550e8400-e29b-41d4-a716-446655440000",
                        List.of("亲子游"), Map.of("duration", "quick")
                )
        );

        assertThat(response.recommendedRouteId()).isEqualTo("historical_culture");
        assertThat(response.recommendationSource()).isEqualTo("default-no-personalization");
    }

    @Test
    void recordsWeatherGuidanceAfterSafetyAndCrowdConstraints() {
        EventRepository repository = repository(List.of());
        TencentWeatherService weatherService = new TencentWeatherService(
                new TencentWeatherProperties("test", "https://example.invalid/", 31.4268, 120.1008, 600)
        ) {
            @Override
            public Optional<ScenicWeatherDto> current() {
                return Optional.of(new ScenicWeatherDto(
                        "晴", 32, 58, "东南风", "2-3级", 1001,
                        "2026-07-14 10:00", "滨湖区", "tencent", false, null, null
                ));
            }
        };
        GuideRecommendationService service = new GuideRecommendationService(
                new GorseClient(new GorseProperties(false, "http://127.0.0.1:8087", "")),
                new LocalScoreEngine(repository), new RouteConstraintEvaluator(), null, repository, null,
                weatherService, new WeatherRouteAdvisor()
        );

        GuideRecommendationResponse response = service.recommend(
                new GuideRecommendationRequest("u1", List.of("拍照打卡"), Map.of())
        );

        assertThat(response.adjustmentReasons()).contains("晴热天气，优先推荐树荫较多的路线");
        assertThat(response.dataFreshness()).containsEntry("weatherSource", "tencent");
        assertThat(response.dataFreshness()).containsEntry("weatherStrategy", "shade-preferred");
    }

    private EventRepository repository(List<AnalyticsEvent> events) {
        return (EventRepository) Proxy.newProxyInstance(
                EventRepository.class.getClassLoader(),
                new Class<?>[]{EventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByTsAfter" -> events.stream()
                            .filter(e -> e.getTs().isAfter((LocalDateTime) args[0]))
                            .toList();
                    case "findByEventAndTsAfter" -> events.stream()
                            .filter(e -> args[0].equals(e.getEvent()))
                            .filter(e -> e.getTs().isAfter((LocalDateTime) args[1]))
                            .toList();
                    case "toString" -> "GuideRecommendationServiceTestRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private EmergencyEventRepository emergencyRepository() {
        return (EmergencyEventRepository) Proxy.newProxyInstance(
                EmergencyEventRepository.class.getClassLoader(),
                new Class<?>[]{EmergencyEventRepository.class},
                (proxy, method, args) -> {
                    if ("toString".equals(method.getName())) return "GuideRecommendationEmergencyRepository";
                    throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private AnalyticsEvent spotEnter(String spotId, LocalDateTime ts) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEvent("spot_enter");
        event.setTargetId(spotId);
        event.setTs(ts);
        event.setProperties("{}");
        return event;
    }

    private EmergencyEventDto emergency(String spotId) {
        LocalDateTime now = LocalDateTime.now();
        return new EmergencyEventDto(
                "emergency-1", "CROWDING", "梵宫临时管控", "请绕行", "WARNING", "ACTIVE",
                List.of(spotId), List.of(), now.minusHours(1), now.plusHours(1), "EXCLUDE",
                null, null, null, "PENDING", now, now, null
        );
    }
}
