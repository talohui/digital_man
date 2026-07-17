package com.lingshan.analytics.service;

import com.lingshan.analytics.config.AnalyticsConfigEncryptionProperties;
import com.lingshan.analytics.config.TencentWeatherProperties;
import com.lingshan.analytics.dto.UpdateWeatherServiceSettingsRequest;
import com.lingshan.analytics.entity.WeatherServiceSettings;
import com.lingshan.analytics.repository.WeatherServiceSettingsRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class WeatherServiceSettingsServiceTest {
    @Test
    void encryptsPersistedKeyAndUsesItBeforeEnvironmentFallback() {
        AtomicReference<WeatherServiceSettings> stored = new AtomicReference<>();
        WeatherServiceSettingsRepository repository = repository(stored);
        WeatherServiceSettingsService service = new WeatherServiceSettingsService(
                repository,
                new TencentWeatherProperties("environment-key", "https://example.invalid/", 31.4268, 120.1008, 600),
                new AnalyticsConfigEncryptionProperties("test-master-key")
        );

        var response = service.update(new UpdateWeatherServiceSettingsRequest("saved-weather-key"));

        assertThat(response.configured()).isTrue();
        assertThat(response.maskedKey()).doesNotContain("saved-weather-key");
        assertThat(response.source()).isEqualTo("admin");
        assertThat(stored.get().getEncryptedApiKey()).doesNotContain("saved-weather-key");
        assertThat(service.activeKey()).contains("saved-weather-key");
    }

    @Test
    void keepsExistingKeyWhenRequestLeavesInputBlank() {
        WeatherServiceSettings existing = new WeatherServiceSettings();
        existing.setId(WeatherServiceSettingsService.SETTINGS_ID);
        existing.setEncryptedApiKey(new WeatherKeyCipher("test-master-key").encrypt("existing-key"));
        AtomicReference<WeatherServiceSettings> stored = new AtomicReference<>(existing);
        WeatherServiceSettingsRepository repository = repository(stored);
        WeatherServiceSettingsService service = new WeatherServiceSettingsService(
                repository,
                new TencentWeatherProperties("environment-key", "https://example.invalid/", 31.4268, 120.1008, 600),
                new AnalyticsConfigEncryptionProperties("test-master-key")
        );

        service.update(new UpdateWeatherServiceSettingsRequest("   "));

        assertThat(service.activeKey()).contains("existing-key");
    }

    @Test
    void fallsBackToEnvironmentWhenPersistedKeyUsesAnOldMasterKey() {
        WeatherServiceSettings existing = new WeatherServiceSettings();
        existing.setId(WeatherServiceSettingsService.SETTINGS_ID);
        existing.setEncryptedApiKey(new WeatherKeyCipher("old-master-key").encrypt("old-weather-key"));
        AtomicReference<WeatherServiceSettings> stored = new AtomicReference<>(existing);
        WeatherServiceSettingsService service = new WeatherServiceSettingsService(
                repository(stored),
                new TencentWeatherProperties("environment-key", "https://example.invalid/", 31.4268, 120.1008, 600),
                new AnalyticsConfigEncryptionProperties("new-master-key")
        );

        assertThat(service.activeKey()).contains("environment-key");
        assertThat(service.current().configured()).isTrue();
        assertThat(service.current().source()).isEqualTo("environment");
    }

    private WeatherServiceSettingsRepository repository(AtomicReference<WeatherServiceSettings> stored) {
        return (WeatherServiceSettingsRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[]{WeatherServiceSettingsRepository.class},
                (proxy, method, arguments) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(stored.get());
                    case "save" -> {
                        WeatherServiceSettings value = (WeatherServiceSettings) arguments[0];
                        stored.set(value);
                        yield value;
                    }
                    case "toString" -> "in-memory-weather-settings-repository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
