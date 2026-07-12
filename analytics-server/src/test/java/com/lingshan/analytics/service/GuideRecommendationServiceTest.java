package com.lingshan.analytics.service;

import com.lingshan.analytics.config.GorseProperties;
import com.lingshan.analytics.dto.GuideRecommendationRequest;
import com.lingshan.analytics.dto.GuideRecommendationResponse;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GuideRecommendationServiceTest {

    @Test
    void returnsLocalRecommendationsWhenGorseIsDisabled() {
        GuideRecommendationService service = new GuideRecommendationService(
                new GorseClient(new GorseProperties(false, "http://127.0.0.1:8087", "")),
                new LocalScoreEngine(repository())
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

    private EventRepository repository() {
        return (EventRepository) Proxy.newProxyInstance(
                EventRepository.class.getClassLoader(),
                new Class<?>[]{EventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByTsAfter" -> List.<AnalyticsEvent>of().stream()
                            .filter(e -> e.getTs().isAfter((LocalDateTime) args[0]))
                            .toList();
                    case "toString" -> "GuideRecommendationServiceTestRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
