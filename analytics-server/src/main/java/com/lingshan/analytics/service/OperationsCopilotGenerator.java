package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.OperationsCopilotModelResponse;

import java.util.Map;

@FunctionalInterface
public interface OperationsCopilotGenerator {
    OperationsCopilotModelResponse generate(Map<String, Object> input);
}
