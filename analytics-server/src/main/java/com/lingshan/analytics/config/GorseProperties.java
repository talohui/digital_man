package com.lingshan.analytics.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gorse")
public record GorseProperties(
        boolean enabled,
        String baseUrl,
        String apiKey
) {
    public String normalizedBaseUrl() {
        if (baseUrl == null) {
            return "";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
