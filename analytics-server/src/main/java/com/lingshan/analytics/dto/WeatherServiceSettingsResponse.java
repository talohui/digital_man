package com.lingshan.analytics.dto;

public record WeatherServiceSettingsResponse(
        boolean configured,
        String maskedKey,
        String source
) {
}
