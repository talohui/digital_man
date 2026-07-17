package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.UpdateWeatherServiceSettingsRequest;
import com.lingshan.analytics.dto.WeatherServiceSettingsResponse;
import com.lingshan.analytics.service.AdminSessionVerifier;
import com.lingshan.analytics.service.TencentWeatherService;
import com.lingshan.analytics.service.WeatherServiceSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/weather-settings")
public class AdminWeatherSettingsController {
    private final WeatherServiceSettingsService settingsService;
    private final TencentWeatherService weatherService;
    private final AdminSessionVerifier adminSessionVerifier;

    public AdminWeatherSettingsController(
            WeatherServiceSettingsService settingsService,
            TencentWeatherService weatherService,
            AdminSessionVerifier adminSessionVerifier
    ) {
        this.settingsService = settingsService;
        this.weatherService = weatherService;
        this.adminSessionVerifier = adminSessionVerifier;
    }

    @GetMapping
    public WeatherServiceSettingsResponse settings(
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken
    ) {
        requireAdmin(fayAdminSessionToken);
        return settingsService.current();
    }

    @PutMapping
    public WeatherServiceSettingsResponse update(
            @RequestBody UpdateWeatherServiceSettingsRequest request,
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken
    ) {
        requireAdmin(fayAdminSessionToken);
        WeatherServiceSettingsResponse response = settingsService.update(request);
        weatherService.clearCache();
        return response;
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> unauthorized(SecurityException error) {
        return error(401, error.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException error) {
        return error(400, error.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> unavailable(IllegalStateException error) {
        return error(409, error.getMessage());
    }

    private void requireAdmin(String fayAdminSessionToken) {
        if (!adminSessionVerifier.verify(fayAdminSessionToken)) {
            throw new SecurityException("需要重新输入管理员密码后才能管理天气服务");
        }
    }

    private ResponseEntity<Map<String, Object>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("ok", false, "message", message));
    }
}
