package com.lingshan.analytics.dto;

public record ScenicWeatherDto(
        String weather,
        int temperature,
        int humidity,
        String windDirection,
        String windPower,
        int airPressure,
        String updateTime,
        String district,
        String source,
        boolean cached,
        String strategy,
        String routeAdvice,
        String weatherRiskKey,
        String safetyNotice
) {
    public ScenicWeatherDto(
            String weather,
            int temperature,
            int humidity,
            String windDirection,
            String windPower,
            int airPressure,
            String updateTime,
            String district,
            String source,
            boolean cached,
            String strategy,
            String routeAdvice
    ) {
        this(weather, temperature, humidity, windDirection, windPower, airPressure, updateTime,
                district, source, cached, strategy, routeAdvice, null, null);
    }

    public ScenicWeatherDto asCached() {
        return new ScenicWeatherDto(
                weather, temperature, humidity, windDirection, windPower,
                airPressure, updateTime, district, source, true, strategy, routeAdvice,
                weatherRiskKey, safetyNotice
        );
    }

    public ScenicWeatherDto withGuidance(String strategy, String routeAdvice) {
        return withGuidance(strategy, routeAdvice, weatherRiskKey, safetyNotice);
    }

    public ScenicWeatherDto withGuidance(
            String strategy,
            String routeAdvice,
            String weatherRiskKey,
            String safetyNotice
    ) {
        return new ScenicWeatherDto(
                weather, temperature, humidity, windDirection, windPower,
                airPressure, updateTime, district, source, cached, strategy, routeAdvice,
                weatherRiskKey, safetyNotice
        );
    }
}
