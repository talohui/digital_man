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
        return rank(userId, selectedTags, Map.of(), limit);
    }

    public List<ScoredRoute> rank(String userId, List<String> selectedTags, Map<String, String> preferences, int limit) {
        List<String> tags = normalizeTags(selectedTags);
        Map<String, String> safePreferences = preferences == null ? Map.of() : preferences;
        List<AnalyticsEvent> events = repository.findByTsAfter(LocalDateTime.now().minusHours(WINDOW_HOURS));
        RouteStats stats = collectStats(events, userId == null ? "" : userId.trim());
        double maxHeat = Math.max(1.0, stats.heat.values().stream().mapToDouble(Double::doubleValue).max().orElse(0.0));

        return GuideRouteCatalog.ROUTES.stream()
                .map(route -> scoreRoute(route, tags, safePreferences, stats, maxHeat))
                .sorted(Comparator.comparingDouble(ScoredRoute::score).reversed()
                        .thenComparing(route -> GuideRouteCatalog.ROUTES.indexOf(route.route())))
                .limit(Math.max(1, limit))
                .toList();
    }

    private ScoredRoute scoreRoute(
            GuideRouteCatalog.RouteProfile route,
            List<String> selectedTags,
            Map<String, String> preferences,
            RouteStats stats,
            double maxHeat
    ) {
        String routeId = route.routeId();
        List<String> matchedTags = route.labels().stream().filter(selectedTags::contains).toList();
        double tagScore = selectedTags.isEmpty() ? 0.0 : 100.0 * matchedTags.size() / Math.max(1, route.labels().size());
        double preferenceScore = preferenceScore(route, preferences);
        double behaviorScore = Math.min(100.0, stats.userBehavior.getOrDefault(routeId, 0.0));
        double heatScore = stats.heat.isEmpty() ? DEFAULT_HEAT_SCORE : 100.0 * stats.heat.getOrDefault(routeId, 0.0) / maxHeat;
        double satisfactionScore = satisfaction(routeId, stats);
        double negativePenalty = stats.userNegative.getOrDefault(routeId, 0.0);
        double finalScore = clip(
                0.42 * tagScore
                        + 0.24 * preferenceScore
                        + 0.19 * behaviorScore
                        + 0.08 * heatScore
                        + 0.07 * satisfactionScore
                        - negativePenalty
        );

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
        List<String> preferenceReasons = preferenceReasons(route, preferences);
        if (!preferenceReasons.isEmpty()) {
            reasonCodes.add("PREFERENCE_CONTEXT");
            reasons.addAll(preferenceReasons);
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
        debug.put("preferenceScore", round1(preferenceScore));
        debug.put("preferences", preferences);
        debug.put("behaviorScore", round1(behaviorScore));
        debug.put("heatScore", round1(heatScore));
        debug.put("satisfactionScore", round1(satisfactionScore));
        debug.put("negativePenalty", round1(negativePenalty));

        return new ScoredRoute(route, round1(finalScore), round4(finalScore / 100.0), reasons.get(0), reasons, matchedTags, reasonCodes, debug);
    }

    private double preferenceScore(GuideRouteCatalog.RouteProfile route, Map<String, String> preferences) {
        if (preferences == null || preferences.isEmpty()) {
            return 0.0;
        }

        List<Double> scores = new ArrayList<>();
        String routeId = route.routeId();
        String walk = routeWalkClass(routeId);

        switch (preferences.getOrDefault("duration", "")) {
            case "quick" -> scores.add(scoreByRoute(routeId, 30.0, 70.0, 100.0));
            case "half_day" -> scores.add(scoreByRoute(routeId, 55.0, 85.0, 80.0));
            case "deep" -> scores.add(scoreByRoute(routeId, 100.0, 70.0, 45.0));
            default -> { }
        }

        switch (preferences.getOrDefault("arrival", "")) {
            case "morning" -> scores.add(scoreByRoute(routeId, 90.0, 75.0, 70.0));
            case "noon" -> scores.add(scoreByRoute(routeId, 62.0, 80.0, 78.0));
            case "afternoon" -> scores.add(scoreByRoute(routeId, 45.0, 82.0, 85.0));
            default -> { }
        }

        switch (preferences.getOrDefault("companion", "")) {
            case "solo" -> scores.add(scoreByRoute(routeId, 85.0, 80.0, 55.0));
            case "friends" -> scores.add(scoreByRoute(routeId, 72.0, 88.0, 68.0));
            case "family" -> scores.add(scoreByRoute(routeId, 45.0, 65.0, 100.0));
            case "elder" -> scores.add(scoreByRoute(routeId, 35.0, 85.0, 82.0));
            default -> { }
        }

        switch (preferences.getOrDefault("walk", "")) {
            case "light" -> scores.add("light".equals(walk) ? 100.0 : "normal".equals(walk) ? 72.0 : 25.0);
            case "normal" -> scores.add("normal".equals(walk) ? 95.0 : "light".equals(walk) ? 80.0 : 70.0);
            case "deep" -> scores.add("deep".equals(walk) ? 100.0 : "normal".equals(walk) ? 78.0 : 48.0);
            default -> { }
        }

        switch (preferences.getOrDefault("show", "")) {
            case "must" -> scores.add(scoreByRoute(routeId, 92.0, 65.0, 72.0));
            case "flexible" -> scores.add(70.0);
            case "skip" -> scores.add(scoreByRoute(routeId, 45.0, 85.0, 82.0));
            default -> { }
        }

        if (scores.isEmpty()) {
            return 0.0;
        }

        return scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private List<String> preferenceReasons(GuideRouteCatalog.RouteProfile route, Map<String, String> preferences) {
        if (preferences == null || preferences.isEmpty()) {
            return List.of();
        }

        List<String> reasons = new ArrayList<>();
        String routeId = route.routeId();
        if ("quick".equals(preferences.get("duration")) && "family".equals(routeId)) {
            reasons.add("你选择短时游览，这条路线站点更集中、节奏更轻。");
        }
        if ("deep".equals(preferences.get("duration")) && "historical_culture".equals(routeId)) {
            reasons.add("你选择深度游览，这条路线更适合慢慢理解灵山文化。");
        }
        if ("family".equals(preferences.get("companion")) && "family".equals(routeId)) {
            reasons.add("你选择亲子同行，这条路线步行压力低、互动点更友好。");
        }
        if ("elder".equals(preferences.get("companion")) && !"deep".equals(routeWalkClass(routeId))) {
            reasons.add("你选择带老人同行，优先推荐步行负担更低的路线。");
        }
        if ("light".equals(preferences.get("walk")) && "light".equals(routeWalkClass(routeId))) {
            reasons.add("你选择少走路，这条路线更轻松，适合慢游。");
        }
        if ("must".equals(preferences.get("show")) && "historical_culture".equals(routeId)) {
            reasons.add("你希望观看演出，路线会更靠近文化演艺体验。");
        }

        return reasons.stream().limit(2).toList();
    }

    private double scoreByRoute(String routeId, double historical, double nature, double family) {
        return switch (routeId) {
            case "historical_culture" -> historical;
            case "natural_scenery" -> nature;
            case "family" -> family;
            default -> 0.0;
        };
    }

    private String routeWalkClass(String routeId) {
        return switch (routeId) {
            case "family" -> "light";
            case "natural_scenery" -> "normal";
            case "historical_culture" -> "deep";
            default -> "normal";
        };
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
