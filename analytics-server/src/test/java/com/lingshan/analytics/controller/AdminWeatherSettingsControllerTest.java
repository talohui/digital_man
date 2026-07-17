package com.lingshan.analytics.controller;

import com.lingshan.analytics.config.AnalyticsConfigEncryptionProperties;
import com.lingshan.analytics.config.TencentWeatherProperties;
import com.lingshan.analytics.dto.UpdateWeatherServiceSettingsRequest;
import com.lingshan.analytics.entity.WeatherServiceSettings;
import com.lingshan.analytics.repository.WeatherServiceSettingsRepository;
import com.lingshan.analytics.service.AdminSessionVerifier;
import com.lingshan.analytics.service.TencentWeatherService;
import com.lingshan.analytics.service.WeatherServiceSettingsService;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminWeatherSettingsControllerTest {
    @Test
    void savesWeatherKeyOnlyForVerifiedFayAdminSession() {
        WeatherServiceSettingsService settingsService = settingsService();
        TencentWeatherService weatherService = new TencentWeatherService(
                new TencentWeatherProperties("", "https://example.invalid/", 31.4268, 120.1008, 600),
                settingsService
        );
        AdminWeatherSettingsController controller = new AdminWeatherSettingsController(
                settingsService,
                weatherService,
                (AdminSessionVerifier) token -> "verified".equals(token)
        );

        assertThatThrownBy(() -> controller.settings("invalid"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("管理员");

        var saved = controller.update(new UpdateWeatherServiceSettingsRequest("saved-weather-key"), "verified");

        assertThat(saved.configured()).isTrue();
        assertThat(saved.maskedKey()).doesNotContain("saved-weather-key");
        assertThat(saved.source()).isEqualTo("admin");
    }

    private WeatherServiceSettingsService settingsService() {
        AtomicReference<WeatherServiceSettings> stored = new AtomicReference<>();
        WeatherServiceSettingsRepository repository = (WeatherServiceSettingsRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{WeatherServiceSettingsRepository.class},
                (proxy, method, arguments) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(stored.get());
                    case "save" -> {
                        WeatherServiceSettings value = (WeatherServiceSettings) arguments[0];
                        stored.set(value);
                        yield value;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
        return new WeatherServiceSettingsService(
                repository,
                new TencentWeatherProperties("", "https://example.invalid/", 31.4268, 120.1008, 600),
                new AnalyticsConfigEncryptionProperties("test-master-key")
        );
    }
}
