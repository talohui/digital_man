package com.lingshan.analytics.dto;

import java.util.List;
import java.util.Map;

public record OperationsCopilotResponse(
        String id,
        String answer,
        List<String> evidence,
        List<String> recommendedActions,
        List<String> risks,
        List<String> sources,
        String generationSource,
        String fallbackReason,
        OperationsCopilotProposalDraft proposal,
        String sessionId,
        String contextUpdatedAt,
        String proposalStatus,
        Map<String, Object> executionResult
) {
    public OperationsCopilotResponse(
            String id,
            String answer,
            List<String> sources,
            String generationSource,
            OperationsCopilotProposalDraft proposal,
            String proposalStatus,
            Map<String, Object> executionResult
    ) {
        this(
                id,
                answer,
                List.of(),
                List.of(),
                List.of(),
                sources,
                generationSource,
                null,
                proposal,
                null,
                null,
                proposalStatus,
                executionResult
        );
    }
}
