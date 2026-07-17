package com.lingshan.analytics.dto;

import java.util.List;

public record DecisionResponse(
        String summary,
        List<DecisionCard> cards,
        List<String> actionTodos,
        List<String> dataSources,
        boolean demoFallback,
        String generationSource,
        String generatedAt,
        boolean cacheHit,
        String fallbackReason,
        String snapshotId
) {
    public DecisionResponse(
            String summary,
            List<DecisionCard> cards,
            List<String> actionTodos,
            List<String> dataSources,
            boolean demoFallback
    ) {
        this(summary, cards, actionTodos, dataSources, demoFallback, null, null, false, null, null);
    }

    public DecisionResponse(
            String summary,
            List<DecisionCard> cards,
            List<String> actionTodos,
            List<String> dataSources,
            boolean demoFallback,
            String generationSource,
            String generatedAt,
            boolean cacheHit,
            String fallbackReason
    ) {
        this(summary, cards, actionTodos, dataSources, demoFallback, generationSource,
                generatedAt, cacheHit, fallbackReason, null);
    }
}
