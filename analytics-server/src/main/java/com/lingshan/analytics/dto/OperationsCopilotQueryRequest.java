package com.lingshan.analytics.dto;

import java.util.List;

public record OperationsCopilotQueryRequest(
        String question,
        String sessionId,
        List<OperationsCopilotMessage> history,
        OperationsCopilotPageContext pageContext
) {
    public OperationsCopilotQueryRequest(String question) {
        this(question, null, List.of(), null);
    }
}
