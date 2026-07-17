package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.OperationsCopilotProposalDraft;

import java.util.Map;

@FunctionalInterface
public interface OperationsCopilotActionExecutor {
    Map<String, Object> execute(String operationId, OperationsCopilotProposalDraft proposal);
}
