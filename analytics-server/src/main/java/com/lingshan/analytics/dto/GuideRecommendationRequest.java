package com.lingshan.analytics.dto;

import java.util.List;

public record GuideRecommendationRequest(
        String userId,
        List<String> selectedTags
) {
}
