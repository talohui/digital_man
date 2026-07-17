package com.lingshan.analytics.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * The only data shape allowed to leave analytics-server for report generation.
 * It deliberately contains aggregate metrics and approved operational summaries only.
 */
public record EmailReportInput(
        String reportType,
        String periodKey,
        LocalDateTime periodStart,
        LocalDateTime periodEnd,
        Map<String, Object> metrics,
        List<Map<String, Object>> activeEmergencies,
        Map<String, Object> weather,
        Map<String, Object> decisionSummary,
        List<String> dataSources
) {
}
