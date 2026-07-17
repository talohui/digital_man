package com.lingshan.analytics.dto;

import java.util.Map;

public record VisitorPrivacySummary(
        String userId,
        VisitorConsentDto consent,
        Map<String, Long> savedDataCounts
) {
}
