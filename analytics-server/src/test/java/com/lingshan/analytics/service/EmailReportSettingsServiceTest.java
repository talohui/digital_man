package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.config.AnalyticsConfigEncryptionProperties;
import com.lingshan.analytics.config.EmailReportProperties;
import com.lingshan.analytics.dto.UpdateEmailReportSettingsRequest;
import com.lingshan.analytics.dto.UpdateEmailReportSmtpSettingsRequest;
import com.lingshan.analytics.entity.EmailReportSettings;
import com.lingshan.analytics.repository.EmailReportSettingsRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailReportSettingsServiceTest {
    @Test
    void normalizes_multiple_recipients_and_rejects_invalid_addresses() {
        EmailReportSettingsService service = new EmailReportSettingsService(repository(), new ObjectMapper());

        var result = service.update(new UpdateEmailReportSettingsRequest(
                java.util.List.of("ops@example.com", " OPS@example.com "),
                true, LocalTime.of(9, 0), true, DayOfWeek.MONDAY, LocalTime.of(9, 30)
        ));

        assertThat(result.recipients()).containsExactly("ops@example.com");
        assertThat(result.dailyEnabled()).isTrue();
        assertThat(result.weeklyDay()).isEqualTo(DayOfWeek.MONDAY);
        assertThatThrownBy(() -> service.update(new UpdateEmailReportSettingsRequest(
                java.util.List.of("bad-address"), true, LocalTime.of(9, 0), false, DayOfWeek.MONDAY, LocalTime.of(9, 0)
        ))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("邮箱");
    }

    @Test
    void refuses_enabled_schedule_without_recipients() {
        EmailReportSettingsService service = new EmailReportSettingsService(repository(), new ObjectMapper());

        assertThatThrownBy(() -> service.update(new UpdateEmailReportSettingsRequest(
                java.util.List.of(), true, LocalTime.of(9, 0), false, DayOfWeek.MONDAY, LocalTime.of(9, 0)
        ))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("收件人");
    }

    @Test
    void encrypts_smtp_auth_code_and_uses_it_for_the_active_sender() {
        EmailReportSettingsService service = new EmailReportSettingsService(
                repository(), new ObjectMapper(),
                new EmailReportProperties("smtp.qq.com", 465, "", "", true),
                new AnalyticsConfigEncryptionProperties("test-master-key")
        );

        service.update(new UpdateEmailReportSettingsRequest(
                java.util.List.of("ops@example.com"), false, LocalTime.of(9, 0), false,
                DayOfWeek.MONDAY, LocalTime.of(9, 0), "sender@qq.com", "auth-code"
        ));

        assertThat(service.currentSmtp().username()).isEqualTo("sender@qq.com");
        assertThat(service.currentSmtp().authCode()).isEqualTo("auth-code");
    }

    @Test
    void updates_smtp_credentials_without_changing_the_report_schedule() {
        EmailReportSettingsService service = new EmailReportSettingsService(
                repository(), new ObjectMapper(),
                new EmailReportProperties("smtp.qq.com", 465, "", "", true),
                new AnalyticsConfigEncryptionProperties("test-master-key")
        );

        service.update(new UpdateEmailReportSettingsRequest(
                java.util.List.of("ops@example.com"), true, LocalTime.of(9, 0), true,
                DayOfWeek.MONDAY, LocalTime.of(9, 30)
        ));
        service.updateSmtp(new UpdateEmailReportSmtpSettingsRequest("sender@qq.com", "auth-code"));

        assertThat(service.current().recipients()).containsExactly("ops@example.com");
        assertThat(service.current().dailyEnabled()).isTrue();
        assertThat(service.current().dailyTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(service.current().weeklyEnabled()).isTrue();
        assertThat(service.current().weeklyDay()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(service.current().weeklyTime()).isEqualTo(LocalTime.of(9, 30));
        assertThat(service.currentSmtp().username()).isEqualTo("sender@qq.com");
        assertThat(service.currentSmtp().authCode()).isEqualTo("auth-code");
    }

    @Test
    void saves_smtp_credentials_before_a_report_plan_exists() {
        EmailReportSettingsService service = new EmailReportSettingsService(
                repository(), new ObjectMapper(),
                new EmailReportProperties("smtp.qq.com", 465, "", "", true),
                new AnalyticsConfigEncryptionProperties("test-master-key")
        );

        service.updateSmtp(new UpdateEmailReportSmtpSettingsRequest("sender@qq.com", "auth-code"));

        assertThat(service.current().recipients()).isEmpty();
        assertThat(service.currentSmtp().username()).isEqualTo("sender@qq.com");
        assertThat(service.currentSmtp().authCode()).isEqualTo("auth-code");
    }

    @Test
    void keeps_report_settings_readable_when_stored_smtp_secret_uses_an_old_master_key() {
        EmailReportSettingsRepository repository = repository();
        EmailReportSettingsService oldService = new EmailReportSettingsService(
                repository, new ObjectMapper(),
                new EmailReportProperties("smtp.qq.com", 465, "", "", true),
                new AnalyticsConfigEncryptionProperties("old-master-key")
        );
        oldService.updateSmtp(new UpdateEmailReportSmtpSettingsRequest("sender@qq.com", "old-auth-code"));

        EmailReportSettingsService currentService = new EmailReportSettingsService(
                repository, new ObjectMapper(),
                new EmailReportProperties("smtp.qq.com", 465, "", "", true),
                new AnalyticsConfigEncryptionProperties("current-master-key")
        );

        assertThat(currentService.current()).isNotNull();
        assertThat(currentService.currentSmtp().username()).isEqualTo("sender@qq.com");
        assertThat(currentService.currentSmtp().authCode()).isEmpty();
        assertThat(currentService.currentSmtp().configured()).isFalse();
    }

    @SuppressWarnings("unchecked")
    private EmailReportSettingsRepository repository() {
        Map<String, EmailReportSettings> records = new ConcurrentHashMap<>();
        return (EmailReportSettingsRepository) Proxy.newProxyInstance(
                EmailReportSettingsRepository.class.getClassLoader(),
                new Class<?>[]{EmailReportSettingsRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(records.get(args[0]));
                    case "save" -> {
                        EmailReportSettings entity = (EmailReportSettings) args[0];
                        assertThat(entity.getRecipientsJson()).as("recipients JSON must be initialized").isNotNull();
                        records.put(entity.getId(), entity);
                        yield entity;
                    }
                    case "toString" -> "EmailReportSettingsRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
