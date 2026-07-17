package com.lingshan.analytics.controller;

import com.lingshan.analytics.config.EmailReportProperties;
import com.lingshan.analytics.config.EmailReportSmtpSettings;
import com.lingshan.analytics.dto.EmailReportSettingsDto;
import com.lingshan.analytics.dto.UpdateEmailReportSettingsRequest;
import com.lingshan.analytics.dto.UpdateEmailReportSmtpSettingsRequest;
import com.lingshan.analytics.service.AdminSessionVerifier;
import com.lingshan.analytics.service.EmailReportScheduler;
import com.lingshan.analytics.service.EmailReportService;
import com.lingshan.analytics.service.EmailReportSettingsService;
import org.springframework.scheduling.TaskScheduler;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminEmailReportControllerTest {
    @Test
    void saves_settings_only_for_a_verified_fay_admin_session() {
        EmailReportSettingsDto settings = new EmailReportSettingsDto(
                List.of("ops@example.com"), true, LocalTime.of(9, 0), false, DayOfWeek.MONDAY, LocalTime.of(9, 0));
        EmailReportSettingsService settingsService = new EmailReportSettingsService(null, null) {
            @Override public EmailReportSettingsDto current() { return settings; }
            @Override public EmailReportSettingsDto update(UpdateEmailReportSettingsRequest request) { return settings; }
            @Override public EmailReportSmtpSettings currentSmtp() {
                return new EmailReportSmtpSettings("smtp.qq.com", 465, "sender@qq.com", "test-auth-code", true);
            }
        };
        AdminEmailReportController controller = new AdminEmailReportController(
                settingsService,
                new EmailReportService(null, null, null, null, null, null, null),
                new EmailReportScheduler((TaskScheduler) null, settingsService, null) {
                    @Override public synchronized void reschedule() { }
                },
                (AdminSessionVerifier) token -> "verified".equals(token),
                new EmailReportProperties("smtp.qq.com", 465, "sender@qq.com", "test-auth-code", true)
        );

        var saved = controller.updateSettings(new UpdateEmailReportSettingsRequest(
                List.of("ops@example.com"), true, LocalTime.of(9, 0), false, DayOfWeek.MONDAY, LocalTime.of(9, 0)
        ), "verified");

        assertThat(saved.recipients()).containsExactly("ops@example.com");
        assertThat(saved.smtpConfigured()).isTrue();
        assertThatThrownBy(() -> controller.settings("invalid"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("管理员");
    }

    @Test
    void updates_smtp_credentials_without_rescheduling_the_report_plan() {
        EmailReportSettingsDto settings = new EmailReportSettingsDto(
                List.of("ops@example.com"), true, LocalTime.of(9, 0), true, DayOfWeek.MONDAY, LocalTime.of(9, 30));
        EmailReportSettingsService settingsService = new EmailReportSettingsService(null, null) {
            @Override public EmailReportSettingsDto current() { return settings; }
            @Override public EmailReportSettingsDto updateSmtp(UpdateEmailReportSmtpSettingsRequest request) {
                assertThat(request.smtpUsername()).isEqualTo("sender@qq.com");
                assertThat(request.smtpAuthCode()).isEqualTo("temporary-code");
                return settings;
            }
            @Override public EmailReportSmtpSettings currentSmtp() {
                return new EmailReportSmtpSettings("smtp.qq.com", 465, "sender@qq.com", "temporary-code", true);
            }
        };
        AtomicInteger reschedules = new AtomicInteger();
        AdminEmailReportController controller = new AdminEmailReportController(
                settingsService,
                new EmailReportService(null, null, null, null, null, null, null),
                new EmailReportScheduler((TaskScheduler) null, settingsService, null) {
                    @Override public synchronized void reschedule() { reschedules.incrementAndGet(); }
                },
                (AdminSessionVerifier) token -> "verified".equals(token),
                new EmailReportProperties("smtp.qq.com", 465, "sender@qq.com", "temporary-code", true)
        );

        var saved = controller.updateSmtpSettings(
                new UpdateEmailReportSmtpSettingsRequest("sender@qq.com", "temporary-code"), "verified");

        assertThat(saved.recipients()).containsExactly("ops@example.com");
        assertThat(saved.dailyEnabled()).isTrue();
        assertThat(saved.weeklyEnabled()).isTrue();
        assertThat(reschedules).hasValue(0);
    }
}
