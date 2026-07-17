package com.lingshan.analytics.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "email-report.smtp")
public record EmailReportProperties(
        String host,
        int port,
        String username,
        String authCode,
        boolean ssl
) {
    public boolean configured() {
        return username != null && !username.isBlank()
                && authCode != null && !authCode.isBlank();
    }

    public String maskedUsername() {
        if (username == null || username.isBlank()) return null;
        int at = username.indexOf('@');
        String local = at > 0 ? username.substring(0, at) : username;
        String suffix = at > 0 ? username.substring(at) : "";
        if (local.length() <= 2) return "**" + suffix;
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + suffix;
    }
}
