package com.lingshan.analytics.dto;

import java.time.Instant;
import java.util.List;

public record ServiceHealthResponse(
        ServiceHealthStatus overall,
        Instant checkedAt,
        List<ServiceHealthComponent> components
) {
}
