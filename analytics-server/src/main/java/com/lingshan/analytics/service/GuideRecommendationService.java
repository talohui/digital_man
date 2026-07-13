package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.GuideFeedbackRequest;
import com.lingshan.analytics.dto.GuideRecommendationRequest;
import com.lingshan.analytics.dto.GuideRecommendationResponse;
import com.lingshan.analytics.dto.GuideRouteCard;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GuideRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(GuideRecommendationService.class);
    private static final int RECOMMENDATION_SIZE = 3;

    private final GorseClient gorseClient;
    private final LocalScoreEngine localScoreEngine;

    public GuideRecommendationService(GorseClient gorseClient, LocalScoreEngine localScoreEngine) {
        this.gorseClient = gorseClient;
        this.localScoreEngine = localScoreEngine;
    }

    @PostConstruct
    public void seedRoutes() {
        if (!gorseClient.isEnabled()) {
            log.info("Gorse seeding skipped because gorse.enabled=false");
            return;
        }

        try {
            gorseClient.upsertItems(GuideRouteCatalog.ROUTES);

            List<SeedUser> seedUsers = List.of(
                    new SeedUser("seed-culture-1", List.of("文化探秘", "祈福静心"), "historical_culture"),
                    new SeedUser("seed-culture-2", List.of("文化探秘"), "historical_culture"),
                    new SeedUser("seed-nature-1", List.of("轻松漫步", "拍照打卡"), "natural_scenery"),
                    new SeedUser("seed-photo-1", List.of("拍照打卡"), "natural_scenery"),
                    new SeedUser("seed-family-1", List.of("亲子游", "拍照打卡"), "family"),
                    new SeedUser("seed-family-2", List.of("亲子游"), "family")
            );

            List<GorseClient.GorseFeedback> feedbacks = new ArrayList<>();

            for (int index = 0; index < seedUsers.size(); index += 1) {
                SeedUser user = seedUsers.get(index);
                gorseClient.upsertUser(user.userId(), user.labels());

                String baseTime = Instant.now().minus(4L + index, ChronoUnit.DAYS).toString();
                feedbacks.add(new GorseClient.GorseFeedback("impression_route", user.userId(), user.selectedRouteId(), baseTime, "seed-impression"));
                feedbacks.add(new GorseClient.GorseFeedback("select_route", user.userId(), user.selectedRouteId(), Instant.now().minus(4L + index, ChronoUnit.DAYS).plus(10, ChronoUnit.MINUTES).toString(), "seed-select"));
            }

            gorseClient.writeFeedback(feedbacks);
            log.info("Seeded Gorse with {} routes, {} seed users and {} feedback rows.",
                    GuideRouteCatalog.ROUTES.size(), seedUsers.size(), feedbacks.size());
        } catch (Exception error) {
            log.warn("Gorse seed failed, local score engine will still work: {}", error.getMessage());
        }
    }

    public GuideRecommendationResponse recommend(GuideRecommendationRequest request) {
        String userId = sanitizeUserId(request.userId());
        List<String> selectedTags = normalizeTags(request.selectedTags());
        Map<String, String> preferences = normalizePreferences(request.preferences());
        String requestId = "rec_" + Instant.now().toEpochMilli();

        List<LocalScoreEngine.ScoredRoute> scoredRoutes = localScoreEngine.rank(userId, selectedTags, preferences, RECOMMENDATION_SIZE);
        List<GuideRouteCard> routes = scoredRoutes.stream()
                .map(route -> toRouteCard(route, requestId))
                .toList();

        String topRouteId = routes.isEmpty() ? "" : routes.get(0).id();
        return new GuideRecommendationResponse(userId, topRouteId, routes, requestId, LocalScoreEngine.ENGINE);
    }

    public void recordFeedback(GuideFeedbackRequest request) {
        String userId = sanitizeUserId(request.userId());
        String routeId = request.routeId() == null ? "" : request.routeId().trim();
        String action = request.action() == null ? "" : request.action().trim().toLowerCase(Locale.ROOT);

        if (!"select_route".equals(action)) {
            throw new IllegalArgumentException("Only select_route is supported.");
        }

        if (GuideRouteCatalog.findRoute(routeId) == null) {
            throw new IllegalArgumentException("Unknown routeId: " + routeId);
        }

        if (!gorseClient.isEnabled()) {
            return;
        }

        try {
            gorseClient.writeFeedback(List.of(
                    new GorseClient.GorseFeedback(
                            action,
                            userId,
                            routeId,
                            Instant.now().toString(),
                            "guide-select"
                    )
            ));
        } catch (Exception error) {
            log.warn("Failed to write route feedback for user {}: {}", userId, error.getMessage());
        }
    }

    private GuideRouteCard toRouteCard(LocalScoreEngine.ScoredRoute scoredRoute, String requestId) {
        GuideRouteCatalog.RouteProfile route = scoredRoute.route();
        return new GuideRouteCard(
                route.routeId(),
                route.routeName(),
                route.description(),
                route.durationLabel(),
                route.labels(),
                scoredRoute.reason(),
                scoredRoute.score(),
                scoredRoute.matchScore(),
                route.primaryPersona(),
                scoredRoute.reason(),
                lightAlternativeId(route.routeId()),
                scoredRoute.reasons(),
                scoredRoute.matchedTags(),
                scoredRoute.reasonCodes(),
                withRequestMetadata(scoredRoute.debug(), requestId)
        );
    }

    private String lightAlternativeId(String routeId) {
        return "historical_culture".equals(routeId) ? "family" : null;
    }

    private java.util.Map<String, Object> withRequestMetadata(java.util.Map<String, Object> debug, String requestId) {
        java.util.Map<String, Object> copy = new java.util.LinkedHashMap<>(debug);
        copy.put("requestId", requestId);
        return copy;
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }

        return tags.stream()
                .filter(tag -> tag != null && !tag.isBlank())
                .map(String::trim)
                .filter(GuideRouteCatalog.CANONICAL_TAGS::contains)
                .distinct()
                .collect(Collectors.toList());
    }

    private Map<String, String> normalizePreferences(Map<String, String> preferences) {
        if (preferences == null || preferences.isEmpty()) {
            return Map.of();
        }

        Map<String, Set<String>> allowed = Map.of(
                "duration", Set.of("quick", "half_day", "deep"),
                "arrival", Set.of("morning", "noon", "afternoon"),
                "companion", Set.of("solo", "friends", "family", "elder"),
                "walk", Set.of("light", "normal", "deep"),
                "show", Set.of("must", "flexible", "skip")
        );

        return preferences.entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getValue() != null)
                .map(entry -> Map.entry(entry.getKey().trim(), entry.getValue().trim()))
                .filter(entry -> allowed.containsKey(entry.getKey()))
                .filter(entry -> allowed.get(entry.getKey()).contains(entry.getValue()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (left, right) -> right));
    }

    private String sanitizeUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return "guest-" + Instant.now().toEpochMilli();
        }
        return userId.trim();
    }

    private record SeedUser(String userId, List<String> labels, String selectedRouteId) {
    }
}
