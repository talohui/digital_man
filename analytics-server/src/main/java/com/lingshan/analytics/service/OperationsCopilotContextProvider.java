package com.lingshan.analytics.service;

import java.util.Map;

@FunctionalInterface
public interface OperationsCopilotContextProvider {
    Map<String, Object> build();
}
