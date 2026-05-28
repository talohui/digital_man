package com.lingshan.analytics.dto;

import java.util.List;
import java.util.Map;

public record GuideRouteCard(
        String id,
        String name,
        String description,
        String durationLabel,
        List<String> tags,
        String reason,
        Double score,
        Double matchScore,
        String routePersona,
        String whyRecommended,
        String lightAlternativeId,
        List<String> reasons,
        List<String> matchedTags,
        List<String> reasonCodes,
        Map<String, Object> debug
) {
}
