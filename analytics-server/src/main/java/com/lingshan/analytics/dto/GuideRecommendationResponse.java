package com.lingshan.analytics.dto;

import java.util.List;
import java.util.Map;

public record GuideRecommendationResponse(
        String userId,
        String recommendedRouteId,
        List<GuideRouteCard> routes,
        String requestId,
        String engine,
        List<String> adjustmentReasons,
        Map<String, String> dataFreshness,
        Boolean fallbackUsed,
        String recommendationSource
) {
    public GuideRecommendationResponse(
            String userId,
            String recommendedRouteId,
            List<GuideRouteCard> routes,
            String requestId,
            String engine
    ) {
        this(userId, recommendedRouteId, routes, requestId, engine, List.of(), Map.of(), false, "personalized-local-score");
    }

    public GuideRecommendationResponse(
            String userId,
            String recommendedRouteId,
            List<GuideRouteCard> routes,
            String requestId,
            String engine,
            List<String> adjustmentReasons,
            Map<String, String> dataFreshness,
            Boolean fallbackUsed
    ) {
        this(userId, recommendedRouteId, routes, requestId, engine, adjustmentReasons,
                dataFreshness, fallbackUsed, "personalized-local-score");
    }
}
