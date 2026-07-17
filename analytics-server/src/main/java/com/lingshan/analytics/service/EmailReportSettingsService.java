package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.config.AnalyticsConfigEncryptionProperties;
import com.lingshan.analytics.config.EmailReportProperties;
import com.lingshan.analytics.config.EmailReportSmtpSettings;
import com.lingshan.analytics.dto.EmailReportSettingsDto;
import com.lingshan.analytics.dto.UpdateEmailReportSettingsRequest;
import com.lingshan.analytics.dto.UpdateEmailReportSmtpSettingsRequest;
import com.lingshan.analytics.entity.EmailReportSettings;
import com.lingshan.analytics.repository.EmailReportSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class EmailReportSettingsService {
    public static final String SETTINGS_ID = "default";
    private static final int MAX_RECIPIENTS = 20;
    private static final Pattern EMAIL = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,63}$", Pattern.CASE_INSENSITIVE);

    private final EmailReportSettingsRepository repository;
    private final ObjectMapper objectMapper;
    private final EmailReportProperties properties;
    private final AnalyticsConfigEncryptionProperties encryptionProperties;

    public EmailReportSettingsService(EmailReportSettingsRepository repository, ObjectMapper objectMapper) {
        this(repository, objectMapper,
                new EmailReportProperties("smtp.qq.com", 465, "", "", true),
                new AnalyticsConfigEncryptionProperties(""));
    }

    @Autowired
    public EmailReportSettingsService(
            EmailReportSettingsRepository repository,
            ObjectMapper objectMapper,
            EmailReportProperties properties,
            AnalyticsConfigEncryptionProperties encryptionProperties
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.encryptionProperties = encryptionProperties;
    }

    public EmailReportSettingsDto current() {
        return repository.findById(SETTINGS_ID)
                .map(this::toDto)
                .orElseGet(this::defaultSettings);
    }

    public EmailReportSmtpSettings currentSmtp() {
        EmailReportSettings stored = repository.findById(SETTINGS_ID).orElse(null);
        String username = firstNonBlank(stored == null ? null : stored.getSmtpUsername(), properties.username());
        String authCode = properties.authCode();
        if (stored != null && stored.getEncryptedSmtpAuthCode() != null && !stored.getEncryptedSmtpAuthCode().isBlank()) {
            try {
                authCode = cipher().decrypt(stored.getEncryptedSmtpAuthCode());
            } catch (IllegalStateException ignored) {
                // A deployment may rotate its master key while the database still contains
                // a secret encrypted by the previous key. Keep the settings page readable
                // so an administrator can safely replace the stale SMTP credential.
                authCode = properties.authCode();
            }
        }
        return new EmailReportSmtpSettings(properties.host(), properties.port(), username, authCode, properties.ssl());
    }

    @Transactional
    public EmailReportSettingsDto update(UpdateEmailReportSettingsRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("报告设置不能为空");
        }
        List<String> recipients = normalizeRecipients(request.recipients());
        validateSchedule(request, recipients);

        EmailReportSettings settings = repository.findById(SETTINGS_ID)
                .orElseGet(this::newSettings);
        settings.setRecipientsJson(writeRecipients(recipients));
        if (request.smtpUsername() != null && !request.smtpUsername().isBlank()) {
            String username = request.smtpUsername().trim().toLowerCase(Locale.ROOT);
            if (!EMAIL.matcher(username).matches()) {
                throw new IllegalArgumentException("发件人邮箱格式不正确");
            }
            settings.setSmtpUsername(username);
        }
        if (request.smtpAuthCode() != null && !request.smtpAuthCode().isBlank()) {
            settings.setEncryptedSmtpAuthCode(cipher().encrypt(request.smtpAuthCode().trim()));
        }
        settings.setDailyEnabled(request.dailyEnabled());
        settings.setDailyTime(request.dailyTime());
        settings.setWeeklyEnabled(request.weeklyEnabled());
        settings.setWeeklyDay(request.weeklyDay() == null ? null : request.weeklyDay().name());
        settings.setWeeklyTime(request.weeklyTime());
        settings.setUpdatedAt(LocalDateTime.now());
        return toDto(repository.save(settings));
    }

    @Transactional
    public EmailReportSettingsDto updateSmtp(UpdateEmailReportSmtpSettingsRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("QQ SMTP 设置不能为空");
        }
        EmailReportSettings settings = repository.findById(SETTINGS_ID)
                .orElseGet(this::newSettings);
        if (request.smtpUsername() != null && !request.smtpUsername().isBlank()) {
            String username = request.smtpUsername().trim().toLowerCase(Locale.ROOT);
            if (!EMAIL.matcher(username).matches()) {
                throw new IllegalArgumentException("发件人邮箱格式不正确");
            }
            settings.setSmtpUsername(username);
        }
        if (request.smtpAuthCode() != null && !request.smtpAuthCode().isBlank()) {
            settings.setEncryptedSmtpAuthCode(cipher().encrypt(request.smtpAuthCode().trim()));
        }
        settings.setUpdatedAt(LocalDateTime.now());
        return toDto(repository.save(settings));
    }

    private void validateSchedule(UpdateEmailReportSettingsRequest request, List<String> recipients) {
        if ((request.dailyEnabled() || request.weeklyEnabled()) && recipients.isEmpty()) {
            throw new IllegalArgumentException("启用定时发送时至少需要一个收件人");
        }
        if (request.dailyEnabled() && request.dailyTime() == null) {
            throw new IllegalArgumentException("启用日报时必须设置发送时间");
        }
        if (request.weeklyEnabled() && request.weeklyDay() == null) {
            throw new IllegalArgumentException("启用周报时必须设置发送星期");
        }
        if (request.weeklyEnabled() && request.weeklyTime() == null) {
            throw new IllegalArgumentException("启用周报时必须设置发送时间");
        }
    }

    private List<String> normalizeRecipients(List<String> values) {
        if (values == null) {
            return List.of();
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String value : values) {
            String email = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
            if (!EMAIL.matcher(email).matches()) {
                throw new IllegalArgumentException("收件人邮箱格式不正确");
            }
            normalized.add(email);
        }
        if (normalized.size() > MAX_RECIPIENTS) {
            throw new IllegalArgumentException("收件人最多 20 个");
        }
        return List.copyOf(normalized);
    }

    private EmailReportSettings newSettings() {
        EmailReportSettings settings = new EmailReportSettings();
        settings.setId(SETTINGS_ID);
        settings.setRecipientsJson("[]");
        return settings;
    }

    private EmailReportSettingsDto defaultSettings() {
        return new EmailReportSettingsDto(
                List.of(), false, LocalTime.of(9, 0), false, DayOfWeek.MONDAY, LocalTime.of(9, 0));
    }

    private EmailReportSettingsDto toDto(EmailReportSettings settings) {
        DayOfWeek weeklyDay = parseDay(settings.getWeeklyDay());
        return new EmailReportSettingsDto(
                readRecipients(settings.getRecipientsJson()),
                settings.isDailyEnabled(),
                Optional.ofNullable(settings.getDailyTime()).orElse(LocalTime.of(9, 0)),
                settings.isWeeklyEnabled(),
                weeklyDay,
                Optional.ofNullable(settings.getWeeklyTime()).orElse(LocalTime.of(9, 0)));
    }

    private DayOfWeek parseDay(String value) {
        try {
            return value == null || value.isBlank() ? DayOfWeek.MONDAY : DayOfWeek.valueOf(value);
        } catch (IllegalArgumentException ignored) {
            return DayOfWeek.MONDAY;
        }
    }

    private String writeRecipients(List<String> recipients) {
        try {
            return objectMapper.writeValueAsString(recipients);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("无法保存收件人设置", exception);
        }
    }

    private List<String> readRecipients(String recipientsJson) {
        if (recipientsJson == null || recipientsJson.isBlank()) {
            return List.of();
        }
        try {
            List<String> stored = objectMapper.readValue(recipientsJson, new TypeReference<>() { });
            return new ArrayList<>(stored == null ? List.of() : stored);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("收件人设置已损坏", exception);
        }
    }

    private String firstNonBlank(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred : fallback;
    }

    private WeatherKeyCipher cipher() {
        if (!encryptionProperties.configured()) {
            throw new IllegalStateException("QQ SMTP 配置加密主密钥尚未配置");
        }
        return new WeatherKeyCipher(encryptionProperties.masterKey());
    }
}
