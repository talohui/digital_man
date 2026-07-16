package com.lingshan.analytics.dto;

import java.util.List;

public record OperationsCopilotModelResponse(
        String answer,
        List<String> evidence,
        List<String> recommendedActions,
        List<String> risks,
        List<String> sources,
        String generationSource,
        String fallbackReason,
        OperationsCopilotProposalDraft proposal
) {
    public OperationsCopilotModelResponse(
            String answer,
            List<String> sources,
            String generationSource,
            OperationsCopilotProposalDraft proposal
    ) {
        this(answer, List.of(), List.of(), List.of(), sources, generationSource, null, proposal);
    }
}
