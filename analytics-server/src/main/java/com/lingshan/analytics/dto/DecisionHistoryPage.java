package com.lingshan.analytics.dto;

import java.util.List;

public record DecisionHistoryPage(
        List<DecisionSnapshotSummary> items,
        int page,
        int size,
        long total
) {
}
