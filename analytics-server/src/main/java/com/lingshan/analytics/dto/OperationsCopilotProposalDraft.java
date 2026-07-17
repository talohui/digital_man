package com.lingshan.analytics.dto;

import java.util.Map;

public record OperationsCopilotProposalDraft(
        String type,
        String title,
        String summary,
        Map<String, Object> payload
) {
}
