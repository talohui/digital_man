package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EmergencyEventDto;
import com.lingshan.analytics.dto.GuideRouteCard;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RouteConstraintEvaluatorTest {

    private final RouteConstraintEvaluator evaluator = new RouteConstraintEvaluator();

    @Test
    void excludesAffectedStopsAndExplainsTheAdjustment() {
        RouteConstraintEvaluator.Result result = evaluator.apply(
                List.of(route("historical_culture", 92, "giant_buddha", "fan_gong")),
                List.of(emergency("EXCLUDE", List.of("fan_gong"), List.of())),
                Map.of(),
                LocalDateTime.of(2026, 7, 13, 10, 0)
        );

        assertThat(result.routes()).singleElement().satisfies(route -> {
            assertThat(route.stopIds()).containsExactly("giant_buddha");
            assertThat(route.adjustmentReasons()).anyMatch(reason -> reason.contains("应急事件"));
        });
        assertThat(result.fallbackUsed()).isFalse();
    }

    @Test
    void penalizesAffectedRouteAfterExistingRanking() {
        RouteConstraintEvaluator.Result result = evaluator.apply(
                List.of(
                        route("family", 95, "jiulong_guanyu", "fan_gong"),
                        route("prayer_meditation", 80, "puti_avenue", "giant_buddha")
                ),
                List.of(emergency("PENALIZE", List.of(), List.of("family"))),
                Map.of(),
                LocalDateTime.of(2026, 7, 13, 10, 0)
        );

        assertThat(result.routes()).extracting(GuideRouteCard::id)
                .containsExactly("prayer_meditation", "family");
        assertThat(result.routes().get(1).score()).isLessThan(95);
    }

    @Test
    void labelsRecentVisitsAsVisitorHeatAndUsesSafeFallbackWhenNoStopsRemain() {
        RouteConstraintEvaluator.Result result = evaluator.apply(
                List.of(route("family", 90, "only-stop")),
                List.of(emergency("EXCLUDE", List.of("only-stop"), List.of())),
                Map.of("only-stop", 8L),
                LocalDateTime.of(2026, 7, 13, 10, 0)
        );

        assertThat(result.routes()).isEmpty();
        assertThat(result.fallbackUsed()).isTrue();
        assertThat(result.adjustmentReasons()).anyMatch(reason -> reason.contains("暂无安全可用路线"));
        assertThat(result.dataFreshness()).containsEntry("heatSource", "游客端访问热度");
    }

    private GuideRouteCard route(String id, double score, String... stops) {
        return new GuideRouteCard(
                id, id, "description", "4 小时", List.of(), "reason", score, score,
                "persona", "why", null, List.of(), List.of(), List.of(),
                List.of(stops), List.of(), Map.of()
        );
    }

    private EmergencyEventDto emergency(String policy, List<String> spots, List<String> routes) {
        LocalDateTime from = LocalDateTime.of(2026, 7, 13, 9, 0);
        return new EmergencyEventDto(
                "emergency-1", "CROWDING", "临时事件", "请绕行", "WARNING", "ACTIVE",
                spots, routes, from, from.plusHours(2), policy, null, null,
                null, "PENDING", from, from, null
        );
    }
}
