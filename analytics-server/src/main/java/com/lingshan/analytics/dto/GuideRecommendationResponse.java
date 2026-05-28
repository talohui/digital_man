package com.lingshan.analytics.dto;

import java.util.List;

public record GuideRecommendationResponse(
        String userId,
        String recommendedRouteId,
        List<GuideRouteCard> routes,
        String requestId,
        String engine
) {
}
