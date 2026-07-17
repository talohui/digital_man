package com.lingshan.analytics.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "analytics.config.encryption")
public record AnalyticsConfigEncryptionProperties(String masterKey) {
    public boolean configured() {
        return masterKey != null && !masterKey.isBlank();
    }
}
