package com.lingshan.analytics.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tencent.weather")
public record TencentWeatherProperties(
        String key,
        String baseUrl,
        double latitude,
        double longitude,
        int cacheTtlSeconds
) {
    public boolean configured() {
        return key != null && !key.isBlank();
    }

    public int effectiveCacheTtlSeconds() {
        return cacheTtlSeconds > 0 ? cacheTtlSeconds : 600;
    }
}
