package com.lingshan.analytics.dto;

import java.util.List;
import java.util.Map;

public record GuideRecommendationRequest(
        String userId,
        List<String> selectedTags,
        Map<String, String> preferences
) {
}
