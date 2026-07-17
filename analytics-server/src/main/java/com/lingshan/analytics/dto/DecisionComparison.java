package com.lingshan.analytics.dto;

import java.util.List;

public record DecisionComparison(
        List<DecisionCard> added,
        List<DecisionCard> removed,
        List<PriorityChange> priorityChanged
) {
    public record PriorityChange(
            String stableKey,
            String title,
            String oldPriority,
            String newPriority
    ) {
    }
}
