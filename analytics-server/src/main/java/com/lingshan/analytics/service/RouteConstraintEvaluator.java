package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EmergencyEventDto;
import com.lingshan.analytics.dto.GuideRouteCard;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class RouteConstraintEvaluator {

    private static final double EMERGENCY_PENALTY = 25.0;
    private static final double MAX_HEAT_PENALTY = 12.0;

    public Result apply(
            List<GuideRouteCard> rankedRoutes,
            List<EmergencyEventDto> emergencies,
            Map<String, Long> recentSpotVisits,
            LocalDateTime now
    ) {
        List<GuideRouteCard> source = rankedRoutes == null ? List.of() : rankedRoutes;
        List<EmergencyEventDto> active = activeEmergencies(emergencies, now);
        Map<String, Long> heat = recentSpotVisits == null ? Map.of() : recentSpotVisits;

        Set<String> excludedSpots = new LinkedHashSet<>();
        Set<String> excludedRoutes = new LinkedHashSet<>();
        Set<String> penalizedSpots = new LinkedHashSet<>();
        Set<String> penalizedRoutes = new LinkedHashSet<>();
        for (EmergencyEventDto emergency : active) {
            if ("EXCLUDE".equals(emergency.routePolicy())) {
                excludedSpots.addAll(safe(emergency.affectedSpotIds()));
                excludedRoutes.addAll(safe(emergency.affectedRouteIds()));
            } else if ("PENALIZE".equals(emergency.routePolicy())) {
                penalizedSpots.addAll(safe(emergency.affectedSpotIds()));
                penalizedRoutes.addAll(safe(emergency.affectedRouteIds()));
            }
        }

        LinkedHashSet<String> globalReasons = new LinkedHashSet<>();
        List<GuideRouteCard> adjusted = new ArrayList<>();
        for (GuideRouteCard route : source) {
            if (excludedRoutes.contains(route.id())) {
                globalReasons.add("应急事件要求暂停路线「" + route.name() + "」");
                continue;
            }

            List<String> originalStops = safe(route.stopIds());
            List<String> remainingStops = originalStops.stream()
                    .filter(stopId -> !excludedSpots.contains(stopId))
                    .toList();
            List<String> routeReasons = new ArrayList<>(safe(route.adjustmentReasons()));
            if (remainingStops.size() < originalStops.size()) {
                String reason = "应急事件已移除 " + (originalStops.size() - remainingStops.size()) + " 个受影响站点";
                routeReasons.add(reason);
                globalReasons.add(reason);
            }
            if (!originalStops.isEmpty() && remainingStops.isEmpty()) {
                globalReasons.add("路线「" + route.name() + "」的站点当前均受影响");
                continue;
            }

            double penalty = 0.0;
            if (penalizedRoutes.contains(route.id()) || intersects(originalStops, penalizedSpots)) {
                penalty += EMERGENCY_PENALTY;
                String reason = "应急事件影响该路线，已降低推荐优先级";
                routeReasons.add(reason);
                globalReasons.add(reason);
            }

            long visitCount = remainingStops.stream().mapToLong(stop -> heat.getOrDefault(stop, 0L)).sum();
            if (visitCount >= 3) {
                penalty += Math.min(MAX_HEAT_PENALTY, visitCount * 1.5);
                String reason = "近 5 分钟游客端访问热度较高，已适度降低优先级";
                routeReasons.add(reason);
                globalReasons.add(reason);
            }

            adjusted.add(copy(route, remainingStops, routeReasons, penalty));
        }

        adjusted.sort(Comparator.comparingDouble((GuideRouteCard route) -> value(route.score())).reversed());
        boolean fallbackUsed = !source.isEmpty() && adjusted.isEmpty();
        if (fallbackUsed) {
            globalReasons.add("暂无安全可用路线，请以现场工作人员指引为准");
        }

        Map<String, String> freshness = new LinkedHashMap<>();
        freshness.put("heatSource", "游客端访问热度");
        freshness.put("heatWindow", "近5分钟");
        freshness.put("evaluatedAt", now == null ? "" : now.toString());
        freshness.put("activeEmergencyCount", String.valueOf(active.size()));
        return new Result(adjusted, List.copyOf(globalReasons), freshness, fallbackUsed);
    }

    private GuideRouteCard copy(GuideRouteCard route, List<String> stops, List<String> reasons, double penalty) {
        return new GuideRouteCard(
                route.id(), route.name(), route.description(), route.durationLabel(), route.tags(),
                route.reason(), round(Math.max(0.0, value(route.score()) - penalty)), route.matchScore(),
                route.routePersona(), route.whyRecommended(), route.lightAlternativeId(), route.reasons(),
                route.matchedTags(), route.reasonCodes(), stops, List.copyOf(reasons), route.debug()
        );
    }

    private List<EmergencyEventDto> activeEmergencies(List<EmergencyEventDto> emergencies, LocalDateTime now) {
        if (emergencies == null || emergencies.isEmpty()) return List.of();
        if (now == null) return emergencies;
        return emergencies.stream()
                .filter(event -> "ACTIVE".equals(event.status()))
                .filter(event -> event.validFrom() == null || !now.isBefore(event.validFrom()))
                .filter(event -> event.validUntil() == null || now.isBefore(event.validUntil()))
                .toList();
    }

    private boolean intersects(List<String> values, Set<String> targets) {
        return values.stream().anyMatch(targets::contains);
    }

    private List<String> safe(List<String> values) {
        return values == null ? List.of() : values;
    }

    private double value(Double value) {
        return value == null ? 0.0 : value;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    public record Result(
            List<GuideRouteCard> routes,
            List<String> adjustmentReasons,
            Map<String, String> dataFreshness,
            boolean fallbackUsed
    ) {
    }
}
