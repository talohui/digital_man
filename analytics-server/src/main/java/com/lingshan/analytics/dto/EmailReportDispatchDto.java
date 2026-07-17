package com.lingshan.analytics.dto;

import java.time.LocalDateTime;

public record EmailReportDispatchDto(
        String id,
        String reportType,
        String periodKey,
        String subject,
        String generationSource,
        String status,
        String safeErrorCode,
        int recipientCount,
        LocalDateTime sentAt,
        LocalDateTime createdAt
) {
}
