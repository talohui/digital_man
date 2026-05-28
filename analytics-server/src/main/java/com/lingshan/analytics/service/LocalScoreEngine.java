package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class LocalScoreEngine {

    public static final String ENGINE = "local-score-v1";
    private static final int WINDOW_HOURS = 24;
    private static final double DEFAULT_HEAT_SCORE = 40.0;
    private static final double DEFAULT_SATISFACTION_SCORE = 70.0;

    private final EventRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    public LocalScoreEngine(EventRepository repository) {
        this.repository = repository;
    }

    public List<ScoredRoute> rank(String userId, List<String> selectedTags, int limit) {
        List<String> tags = normalizeTags(selectedTags);
        List<AnalyticsEvent> events = repository.findByTsAfter(LocalDateTime.now().minusHours(WINDOW_HOURS));
        RouteStats stats = collectStats(events, userId == null ? "" : userId.trim());
        double maxHeat = Math.max(1.0, stats.heat.values().stream().mapToDouble(Double::doubleValue).max().orElse(0.0));

        return GuideRouteCatalog.ROUTES.stream()
                .map(route -> scoreRoute(route, tags, stats, maxHeat))
                .sorted(Comparator.comparingDouble(ScoredRoute::score).reversed()
                        .thenComparing(route -> GuideRouteCatalog.ROUTES.indexOf(route.route())))
                .limit(Math.max(1, limit))
                .toList();
    }

    private ScoredRoute scoreRoute(GuideRouteCatalog.RouteProfile route, List<String> selectedTags, RouteStats stats, double maxHeat) {
        String routeId = route.routeId();
        List<String> matchedTags = route.labels().stream().filter(selectedTags::contains).toList();
        double tagScore = selectedTags.isEmpty() ? 0.0 : 100.0 * matchedTags.size() / Math.max(1, route.labels().size());
        double behaviorScore = Math.min(100.0, stats.userBehavior.getOrDefault(routeId, 0.0));
        double heatScore = stats.heat.isEmpty() ? DEFAULT_HEAT_SCORE : 100.0 * stats.heat.getOrDefault(routeId, 0.0) / maxHeat;
        double satisfactionScore = satisfaction(routeId, stats);
        double negativePenalty = stats.userNegative.getOrDefault(routeId, 0.0);
        double finalScore = clip(0.45 * tagScore + 0.25 * behaviorScore + 0.15 * heatScore + 0.15 * satisfactionScore - negativePenalty);

        List<String> reasonCodes = new ArrayList<>();
        List<String> reasons = new ArrayList<>();
        if (!matchedTags.isEmpty()) {
            reasonCodes.add("TAG_MATCH");
            reasons.add("你选择了“" + String.join("、", matchedTags) + "”，这条路线主题最贴近。");
        }
        if (behaviorScore > 0) {
            reasonCodes.add("BEHAVIOR_SIGNAL");
            reasons.add("结合你近期的路线点击或评分反馈，这条路线更值得优先考虑。");
        }
        if (heatScore >= 60.0 && stats.heat.containsKey(routeId)) {
            reasonCodes.add("HOT_ROUTE");
            reasons.add("这条路线近期互动热度较高，适合先体验。");
        }
        if (satisfactionScore >= 75.0) {
            reasonCodes.add("HIGH_SATISFACTION");
            reasons.add("这条路线近期评分表现更稳。");
        }
        if (negativePenalty > 0) {
            reasonCodes.add("NEGATIVE_FEEDBACK");
        }
        if (reasons.isEmpty()) {
            reasonCodes.add("CLASSIC_ROUTE");
            reasons.add("按景区经典游览动线为你推荐，适合首次体验。");
        }

        Map<String, Object> debug = new LinkedHashMap<>();
        debug.put("engine", ENGINE);
        debug.put("tagScore", round1(tagScore));
        debug.put("behaviorScore", round1(behaviorScore));
        debug.put("heatScore", round1(heatScore));
        debug.put("satisfactionScore", round1(satisfactionScore));
        debug.put("negativePenalty", round1(negativePenalty));

        return new ScoredRoute(route, round1(finalScore), round4(finalScore / 100.0), reasons.get(0), reasons, matchedTags, reasonCodes, debug);
    }

    private RouteStats collectStats(List<AnalyticsEvent> events, String userId) {
        RouteStats stats = new RouteStats();
        for (AnalyticsEvent event : events) {
            String routeId = routeId(event);
            if (routeId == null) continue;

            switch (event.getEvent()) {
                case "route_click" -> {
                    stats.heat.merge(routeId, 1.0, Double::sum);
                    if (sameUser(event, userId)) stats.userBehavior.merge(routeId, 25.0, Double::sum);
                }
                case "recommend_exposure" -> stats.heat.merge(routeId, 0.4, Double::sum);
                case "recommend_click" -> {
                    stats.heat.merge(routeId, 1.4, Double::sum);
                    if (sameUser(event, userId)) stats.userBehavior.merge(routeId, 35.0, Double::sum);
                }
                case "rate_route" -> {
                    if (event.getRatingValue() != null) {
                        stats.ratingSum.merge(routeId, event.getRatingValue(), Double::sum);
                        stats.ratingCount.merge(routeId, 1, Integer::sum);
                        if (sameUser(event, userId)) {
                            if (event.getRatingValue() >= 4.0) stats.userBehavior.merge(routeId, 30.0, Double::sum);
                            if (event.getRatingValue() <= 2.0) stats.userNegative.merge(routeId, 65.0, Double::sum);
                        }
                    }
                }
                case "spot_enter" -> {
                    if (sameUser(event, userId)) stats.userBehavior.merge(routeId, 5.0, Double::sum);
                }
                case "spot_leave" -> {
                    if (sameUser(event, userId)) {
                        double dwellMs = numberProp(event, "dwell_ms");
                        if (dwellMs > 0) {
                            double dwellScore = Math.min(15.0, Math.log1p(dwellMs / 1000.0) / Math.log1p(180.0) * 15.0);
                            stats.userBehavior.merge(routeId, dwellScore, Double::sum);
                        }
                    }
                }
                default -> { }
            }
        }
        return stats;
    }

    private double satisfaction(String routeId, RouteStats stats) {
        int count = stats.ratingCount.getOrDefault(routeId, 0);
        if (count == 0) return DEFAULT_SATISFACTION_SCORE;
        double avg = stats.ratingSum.getOrDefault(routeId, 0.0) / count;
        double normalized = Math.max(0.0, Math.min(100.0, (avg / 5.0) * 100.0));
        return ((normalized * count) + (DEFAULT_SATISFACTION_SCORE * 3.0)) / (count + 3.0);
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) return List.of();
        return tags.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(GuideRouteCatalog.CANONICAL_TAGS::contains)
                .distinct()
                .toList();
    }

    private boolean sameUser(AnalyticsEvent event, String userId) {
        return userId != null && !userId.isBlank() && userId.equals(event.getUserId());
    }

    private String routeId(AnalyticsEvent event) {
        if (event.getTargetId() != null && GuideRouteCatalog.findRoute(event.getTargetId()) != null) {
            return event.getTargetId();
        }
        String routeId = stringProp(event, "route_id");
        return routeId != null && GuideRouteCatalog.findRoute(routeId) != null ? routeId : null;
    }

    private String stringProp(AnalyticsEvent event, String key) {
        Object value = prop(event, key);
        return value instanceof String s && !s.isBlank() ? s : null;
    }

    private double numberProp(AnalyticsEvent event, String key) {
        Object value = prop(event, key);
        return value instanceof Number n ? n.doubleValue() : 0.0;
    }

    private Object prop(AnalyticsEvent event, String key) {
        try {
            Map<String, Object> props = mapper.readValue(event.getProperties() == null ? "{}" : event.getProperties(), new TypeReference<>() {});
            return props.get(key);
        } catch (Exception ignored) {
            return null;
        }
    }

    private double clip(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private double round4(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }

    public record ScoredRoute(
            GuideRouteCatalog.RouteProfile route,
            double score,
            double matchScore,
            String reason,
            List<String> reasons,
            List<String> matchedTags,
            List<String> reasonCodes,
            Map<String, Object> debug
    ) {
    }

    private static class RouteStats {
        private final Map<String, Double> heat = new HashMap<>();
        private final Map<String, Double> userBehavior = new HashMap<>();
        private final Map<String, Double> userNegative = new HashMap<>();
        private final Map<String, Double> ratingSum = new HashMap<>();
        private final Map<String, Integer> ratingCount = new HashMap<>();
    }
}
