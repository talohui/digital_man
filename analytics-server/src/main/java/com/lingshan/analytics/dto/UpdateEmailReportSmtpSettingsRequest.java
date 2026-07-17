package com.lingshan.analytics.dto;

public record UpdateEmailReportSmtpSettingsRequest(
        String smtpUsername,
        String smtpAuthCode
) {
}
