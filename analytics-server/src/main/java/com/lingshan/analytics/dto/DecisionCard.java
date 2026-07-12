package com.lingshan.analytics.dto;

import java.util.List;

public record DecisionCard(
        String title,
        String type,
        String priority,
        List<String> evidence,
        String reason,
        List<String> actions,
        List<String> relatedTopics,
        List<String> relatedSpots,
        boolean demoFallback
) {
}
