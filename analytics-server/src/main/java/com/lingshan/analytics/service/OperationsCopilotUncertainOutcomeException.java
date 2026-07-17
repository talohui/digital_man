package com.lingshan.analytics.service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Signals that a remote write may have succeeded even though no authoritative
 * result was returned. Callers must reconcile by operationId instead of
 * treating the action as safely retryable.
 */
public class OperationsCopilotUncertainOutcomeException extends RuntimeException {
    private final Map<String, Object> target;

    public OperationsCopilotUncertainOutcomeException(Map<String, Object> target) {
        super("Copilot target write outcome is uncertain");
        this.target = Collections.unmodifiableMap(new LinkedHashMap<>(
                target == null ? Map.of() : target));
    }

    public Map<String, Object> target() {
        return target;
    }
}
