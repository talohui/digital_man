package com.lingshan.analytics.dto;

import java.util.List;

public record DecisionResponse(
        String summary,
        List<DecisionCard> cards,
        List<String> actionTodos,
        List<String> dataSources,
        boolean demoFallback
) {
}
