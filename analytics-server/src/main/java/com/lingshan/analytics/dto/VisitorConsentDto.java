package com.lingshan.analytics.dto;

import java.time.LocalDateTime;

public record VisitorConsentDto(
        String userId,
        boolean personalizationEnabled,
        boolean analyticsEnabled,
        LocalDateTime updatedAt
) {
}
