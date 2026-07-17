package com.lingshan.analytics.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record VisitorPrivacyExport(
        String userId,
        LocalDateTime exportedAt,
        VisitorConsentDto consent,
        Map<String, Object> profile,
        List<Map<String, Object>> footprint,
        List<Map<String, Object>> analyticsEvents
) {
}
