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
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GuideRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(GuideRecommendationService.class);
    private static final int RECOMMENDATION_SIZE = 3;

    private final GorseClient gorseClient;

    public GuideRecommendationService(GorseClient gorseClient) {
        this.gorseClient = gorseClient;
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
            log.warn("Gorse seed failed, fallback mode will still work: {}", error.getMessage());
        }
    }

    public GuideRecommendationResponse recommend(GuideRecommendationRequest request) {
        String userId = sanitizeUserId(request.userId());
        List<String> selectedTags = normalizeTags(request.selectedTags());

        List<String> recommendedIds = new ArrayList<>();

        if (gorseClient.isEnabled()) {
            try {
                gorseClient.upsertUser(userId, selectedTags);
                recommendedIds.addAll(gorseClient.recommend(userId, RECOMMENDATION_SIZE));
            } catch (Exception error) {
                log.warn("Gorse recommendation failed for user {}: {}", userId, error.getMessage());
            }
        }

        List<GuideRouteCard> routes = buildRouteCards(selectedTags, recommendedIds);

        if (gorseClient.isEnabled()) {
            try {
                List<GorseClient.GorseFeedback> impressions = routes.stream()
                        .map(route -> new GorseClient.GorseFeedback(
                                "impression_route",
                                userId,
                                route.id(),
                                Instant.now().toString(),
                                "guide-impression"
                        ))
                        .toList();
                gorseClient.writeFeedback(impressions);
            } catch (Exception error) {
                log.warn("Failed to write Gorse impressions for user {}: {}", userId, error.getMessage());
            }
        }

        String topRouteId = routes.isEmpty() ? "" : routes.get(0).id();
        return new GuideRecommendationResponse(userId, topRouteId, routes);
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

    private List<GuideRouteCard> buildRouteCards(List<String> selectedTags, List<String> gorseIds) {
        Set<String> finalIds = new LinkedHashSet<>();
        gorseIds.stream()
                .filter(routeId -> GuideRouteCatalog.findRoute(routeId) != null)
                .forEach(finalIds::add);

        fallbackRank(selectedTags).stream()
                .map(GuideRouteCatalog.RouteProfile::routeId)
                .forEach(finalIds::add);

        return finalIds.stream()
                .limit(RECOMMENDATION_SIZE)
                .map(routeId -> toRouteCard(GuideRouteCatalog.findRoute(routeId), selectedTags, gorseIds.contains(routeId)))
                .toList();
    }

    private List<GuideRouteCatalog.RouteProfile> fallbackRank(List<String> selectedTags) {
        return GuideRouteCatalog.ROUTES.stream()
                .sorted(Comparator
                        .comparingInt((GuideRouteCatalog.RouteProfile route) -> overlapCount(route.labels(), selectedTags)).reversed()
                        .thenComparingInt(route -> GuideRouteCatalog.ROUTES.indexOf(route)))
                .toList();
    }

    private GuideRouteCard toRouteCard(GuideRouteCatalog.RouteProfile route, List<String> selectedTags, boolean fromGorse) {
        List<String> matchedTags = route.labels().stream()
                .filter(selectedTags::contains)
                .toList();

        String reason;
        if (fromGorse && !matchedTags.isEmpty()) {
            reason = "Gorse 推荐，命中标签：" + String.join(" / ", matchedTags);
        } else if (fromGorse) {
            reason = "Gorse 根据相似游客偏好为你补齐了这条路线。";
        } else if (!matchedTags.isEmpty()) {
            reason = "本地兜底命中标签：" + String.join(" / ", matchedTags);
        } else {
            reason = "当前按默认热门路线为你补齐推荐。";
        }

        return new GuideRouteCard(
                route.routeId(),
                route.routeName(),
                route.description(),
                route.durationLabel(),
                route.labels(),
                reason
        );
    }

    private int overlapCount(List<String> routeTags, List<String> selectedTags) {
        int count = 0;
        for (String tag : routeTags) {
            if (selectedTags.contains(tag)) {
                count += 1;
            }
        }
        return count;
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

    private String sanitizeUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return "guest-" + Instant.now().toEpochMilli();
        }
        return userId.trim();
    }

    private record SeedUser(String userId, List<String> labels, String selectedRouteId) {
    }
}
