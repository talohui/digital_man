package com.lingshan.analytics.dto;

import java.time.Instant;

public record ServiceHealthComponent(
        String key,
        String label,
        ServiceHealthStatus status,
        String message,
        Instant checkedAt,
        Instant lastSuccessAt,
        long latencyMs,
        String recoveryPath
) {
}
