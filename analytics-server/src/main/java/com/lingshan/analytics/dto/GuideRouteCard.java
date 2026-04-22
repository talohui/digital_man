package com.lingshan.analytics.dto;

import java.util.List;

public record GuideRouteCard(
        String id,
        String name,
        String description,
        String durationLabel,
        List<String> tags,
        String reason
) {
}
