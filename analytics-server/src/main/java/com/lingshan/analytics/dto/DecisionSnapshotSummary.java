package com.lingshan.analytics.dto;

import java.time.LocalDateTime;

public record DecisionSnapshotSummary(
        String id,
        String summary,
        String generationSource,
        LocalDateTime generatedAt,
        String fallbackReason
) {
}
