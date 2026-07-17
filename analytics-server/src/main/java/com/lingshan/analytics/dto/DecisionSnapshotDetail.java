package com.lingshan.analytics.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record DecisionSnapshotDetail(
        String id,
        String summary,
        String generationSource,
        LocalDateTime generatedAt,
        String fallbackReason,
        LocalDateTime inputWindowStart,
        LocalDateTime inputWindowEnd,
        Map<String, Object> inputSummary,
        List<String> dataSources,
        List<DecisionCard> cards
) {
}
