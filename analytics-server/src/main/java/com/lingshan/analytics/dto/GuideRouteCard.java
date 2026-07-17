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
        List<String> stopIds,
        List<String> adjustmentReasons,
        Map<String, Object> debug
) {
    public GuideRouteCard(
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
        this(id, name, description, durationLabel, tags, reason, score, matchScore,
                routePersona, whyRecommended, lightAlternativeId, reasons, matchedTags,
                reasonCodes, List.of(), List.of(), debug);
    }
}
