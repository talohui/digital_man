package com.lingshan.analytics.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "marketing-decision")
public record MarketingDecisionProperties(
        String fayBaseUrl,
        int connectTimeoutMs,
        int readTimeoutMs
) {
    public String normalizedFayBaseUrl() {
        if (fayBaseUrl == null) return "";
        return fayBaseUrl.endsWith("/")
                ? fayBaseUrl.substring(0, fayBaseUrl.length() - 1)
                : fayBaseUrl;
    }
}
