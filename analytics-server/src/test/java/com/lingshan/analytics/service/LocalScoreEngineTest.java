package com.lingshan.analytics.service;

import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LocalScoreEngineTest {

    @Test
    void familyAndPhotoTagsRankFamilyRouteFirstWithReadableReason() {
        LocalScoreEngine engine = new LocalScoreEngine(repository(List.of()));

        List<LocalScoreEngine.ScoredRoute> routes = engine.rank("u1", List.of("亲子游", "拍照打卡"), 3);

        assertThat(routes).hasSize(3);
        LocalScoreEngine.ScoredRoute top = routes.get(0);
        assertThat(top.route().routeId()).isEqualTo("family");
        assertThat(top.reason()).contains("亲子游", "拍照打卡").doesNotContain("兜底");
        assertThat(top.reasonCodes()).contains("TAG_MATCH");
        assertThat(top.debug().get("engine")).isEqualTo("local-score-v1");
        assertThat((Double) top.debug().get("tagScore")).isGreaterThan(0.0);
    }

    @Test
    void cultureAndRitualTagsRankHistoricalCultureFirst() {
        LocalScoreEngine engine = new LocalScoreEngine(repository(List.of()));

        List<LocalScoreEngine.ScoredRoute> routes = engine.rank("u1", List.of("文化探秘", "祈福静心"), 3);

        assertThat(routes.get(0).route().routeId()).isEqualTo("historical_culture");
        assertThat(routes.get(0).matchedTags()).containsExactly("文化探秘", "祈福静心");
    }

    @Test
    void lowRouteRatingPenalizesThatRouteForSameUser() {
        List<AnalyticsEvent> events = List.of(
                event("rate_route", "u1", "family", 1.0, "{}"),
                event("recommend_click", "u1", "natural_scenery", null, "{\"route_id\":\"natural_scenery\"}")
        );
        LocalScoreEngine engine = new LocalScoreEngine(repository(events));

        List<LocalScoreEngine.ScoredRoute> routes = engine.rank("u1", List.of("亲子游", "拍照打卡"), 3);

        assertThat(routes.get(0).route().routeId()).isNotEqualTo("family");
        LocalScoreEngine.ScoredRoute family = routes.stream()
                .filter(route -> route.route().routeId().equals("family"))
                .findFirst()
                .orElseThrow();
        assertThat((Double) family.debug().get("negativePenalty")).isGreaterThan(0.0);
        assertThat(family.reasonCodes()).contains("NEGATIVE_FEEDBACK");
    }

    private EventRepository repository(List<AnalyticsEvent> events) {
        return (EventRepository) Proxy.newProxyInstance(
                EventRepository.class.getClassLoader(),
                new Class<?>[]{EventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByTsAfter" -> events.stream()
                            .filter(e -> e.getTs().isAfter((LocalDateTime) args[0]))
                            .toList();
                    case "toString" -> "LocalScoreEngineTestRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private AnalyticsEvent event(String name, String userId, String targetId, Double rating, String props) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEvent(name);
        event.setUserId(userId);
        event.setTargetId(targetId);
        event.setRatingValue(rating);
        event.setProperties(props);
        event.setTs(LocalDateTime.now().minusMinutes(2));
        return event;
    }
}
