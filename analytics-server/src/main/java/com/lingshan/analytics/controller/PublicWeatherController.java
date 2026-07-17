package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.ScenicWeatherDto;
import com.lingshan.analytics.service.TencentWeatherService;
import com.lingshan.analytics.service.WeatherRouteAdvisor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/weather")
public class PublicWeatherController {
    private final TencentWeatherService weatherService;
    private final WeatherRouteAdvisor weatherRouteAdvisor;

    public PublicWeatherController(TencentWeatherService weatherService, WeatherRouteAdvisor weatherRouteAdvisor) {
        this.weatherService = weatherService;
        this.weatherRouteAdvisor = weatherRouteAdvisor;
    }

    @GetMapping
    public ResponseEntity<ScenicWeatherDto> currentWeather() {
        return weatherService.current()
                .map(weatherRouteAdvisor::guide)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }
}
