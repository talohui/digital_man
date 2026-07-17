package com.lingshan.analytics.service;

import com.lingshan.analytics.config.AnalyticsConfigEncryptionProperties;
import com.lingshan.analytics.config.TencentWeatherProperties;
import com.lingshan.analytics.dto.UpdateWeatherServiceSettingsRequest;
import com.lingshan.analytics.dto.WeatherServiceSettingsResponse;
import com.lingshan.analytics.entity.WeatherServiceSettings;
import com.lingshan.analytics.repository.WeatherServiceSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class WeatherServiceSettingsService {
    private static final Logger log = LoggerFactory.getLogger(WeatherServiceSettingsService.class);
    public static final String SETTINGS_ID = "default";
    private static final int MAX_KEY_LENGTH = 256;

    private final WeatherServiceSettingsRepository repository;
    private final TencentWeatherProperties environmentProperties;
    private final AnalyticsConfigEncryptionProperties encryptionProperties;
    private volatile boolean persistedKeyUnavailableWarned;

    public WeatherServiceSettingsService(
            WeatherServiceSettingsRepository repository,
            TencentWeatherProperties environmentProperties,
            AnalyticsConfigEncryptionProperties encryptionProperties
    ) {
        this.repository = repository;
        this.environmentProperties = environmentProperties;
        this.encryptionProperties = encryptionProperties;
    }

    public Optional<String> activeKey() {
        return decryptedPersistedKey().or(() -> environmentKey());
    }

    public WeatherServiceSettingsResponse current() {
        Optional<String> savedKey = decryptedPersistedKey();
        if (savedKey.isPresent()) {
            return response(savedKey.get(), "admin");
        }
        Optional<String> fallback = environmentKey();
        return response(fallback.orElse(""), fallback.isPresent() ? "environment" : "none");
    }

    @Transactional
    public WeatherServiceSettingsResponse update(UpdateWeatherServiceSettingsRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("天气设置不能为空");
        }
        String apiKey = normalizeKey(request.apiKey());
        if (apiKey.isBlank()) {
            return current();
        }

        WeatherServiceSettings settings = repository.findById(SETTINGS_ID).orElseGet(this::newSettings);
        settings.setEncryptedApiKey(cipher().encrypt(apiKey));
        settings.setUpdatedAt(LocalDateTime.now());
        repository.save(settings);
        persistedKeyUnavailableWarned = false;
        return response(apiKey, "admin");
    }

    private Optional<String> decryptedPersistedKey() {
        Optional<WeatherServiceSettings> saved = repository.findById(SETTINGS_ID);
        if (saved.isEmpty() || !hasEncryptedKey(saved.get())) {
            return Optional.empty();
        }
        try {
            String key = cipher().decrypt(saved.get().getEncryptedApiKey());
            persistedKeyUnavailableWarned = false;
            return optional(key);
        } catch (IllegalStateException | IllegalArgumentException exception) {
            if (!persistedKeyUnavailableWarned) {
                log.warn("Stored weather key cannot be decrypted; falling back to deployment configuration");
                persistedKeyUnavailableWarned = true;
            }
            return Optional.empty();
        }
    }

    private Optional<String> environmentKey() {
        return environmentProperties == null ? Optional.empty() : optional(environmentProperties.key());
    }

    private WeatherServiceSettings newSettings() {
        WeatherServiceSettings settings = new WeatherServiceSettings();
        settings.setId(SETTINGS_ID);
        return settings;
    }

    private WeatherKeyCipher cipher() {
        if (!encryptionProperties.configured()) {
            throw new IllegalStateException("天气配置加密主密钥尚未配置");
        }
        return new WeatherKeyCipher(encryptionProperties.masterKey());
    }

    private String normalizeKey(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.length() > MAX_KEY_LENGTH) {
            throw new IllegalArgumentException("天气 Key 长度不正确");
        }
        return normalized;
    }

    private boolean hasEncryptedKey(WeatherServiceSettings settings) {
        return settings.getEncryptedApiKey() != null && !settings.getEncryptedApiKey().isBlank();
    }

    private Optional<String> optional(String value) {
        return value == null || value.isBlank() ? Optional.empty() : Optional.of(value);
    }

    private WeatherServiceSettingsResponse response(String value, String source) {
        Optional<String> key = optional(value);
        return new WeatherServiceSettingsResponse(
                key.isPresent(),
                key.map(this::mask).orElse(null),
                key.isPresent() ? source : "none"
        );
    }

    private String mask(String value) {
        int visible = Math.min(5, value.length());
        return "••••" + value.substring(value.length() - visible);
    }
}
