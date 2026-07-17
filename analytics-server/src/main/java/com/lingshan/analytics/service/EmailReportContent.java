package com.lingshan.analytics.service;

import java.util.List;
import java.util.Map;

public record EmailReportContent(
        String subject,
        String headline,
        Map<String, String> sections,
        List<String> dataSources,
        String generationSource,
        String fallbackReason
) {
}
