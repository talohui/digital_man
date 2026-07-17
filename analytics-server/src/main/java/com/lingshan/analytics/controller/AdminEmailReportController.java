package com.lingshan.analytics.controller;

import com.lingshan.analytics.config.EmailReportProperties;
import com.lingshan.analytics.config.EmailReportSmtpSettings;
import com.lingshan.analytics.dto.EmailReportDispatchDto;
import com.lingshan.analytics.dto.EmailReportSettingsDto;
import com.lingshan.analytics.dto.EmailReportSettingsResponse;
import com.lingshan.analytics.dto.UpdateEmailReportSettingsRequest;
import com.lingshan.analytics.dto.UpdateEmailReportSmtpSettingsRequest;
import com.lingshan.analytics.entity.EmailReportDispatch;
import com.lingshan.analytics.service.AdminSessionVerifier;
import com.lingshan.analytics.service.EmailReportScheduler;
import com.lingshan.analytics.service.EmailReportService;
import com.lingshan.analytics.service.EmailReportSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/email-reports")
public class AdminEmailReportController {
    private final EmailReportSettingsService settingsService;
    private final EmailReportService reportService;
    private final EmailReportScheduler scheduler;
    private final AdminSessionVerifier adminSessionVerifier;
    private final EmailReportProperties properties;

    public AdminEmailReportController(
            EmailReportSettingsService settingsService,
            EmailReportService reportService,
            EmailReportScheduler scheduler,
            AdminSessionVerifier adminSessionVerifier,
            EmailReportProperties properties
    ) {
        this.settingsService = settingsService;
        this.reportService = reportService;
        this.scheduler = scheduler;
        this.adminSessionVerifier = adminSessionVerifier;
        this.properties = properties;
    }

    @GetMapping("/settings")
    public EmailReportSettingsResponse settings(
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken
    ) {
        requireAdmin(fayAdminSessionToken);
        return response(settingsService.current());
    }

    @PutMapping("/settings")
    public EmailReportSettingsResponse updateSettings(
            @RequestBody UpdateEmailReportSettingsRequest request,
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken
    ) {
        requireAdmin(fayAdminSessionToken);
        EmailReportSettingsDto settings = settingsService.update(request);
        scheduler.reschedule();
        return response(settings);
    }

    @GetMapping("/dispatches")
    public List<EmailReportDispatchDto> dispatches(
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken,
            @RequestParam(defaultValue = "20") int size
    ) {
        requireAdmin(fayAdminSessionToken);
        int limit = Math.max(1, Math.min(20, size));
        return reportService.latestDispatches().stream().limit(limit).map(this::dispatch).toList();
    }

    @PutMapping("/smtp")
    public EmailReportSettingsResponse updateSmtpSettings(
            @RequestBody UpdateEmailReportSmtpSettingsRequest request,
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken
    ) {
        requireAdmin(fayAdminSessionToken);
        return response(settingsService.updateSmtp(request));
    }

    @PostMapping("/test")
    public EmailReportDispatchDto sendTest(
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken
    ) {
        requireAdmin(fayAdminSessionToken);
        EmailReportDispatch result = reportService.sendTest();
        if (result == null) throw new IllegalStateException("测试邮件已被重复处理，请稍后重试");
        return dispatch(result);
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
    public ResponseEntity<Map<String, Object>> conflict(IllegalStateException error) {
        return error(409, error.getMessage());
    }

    private void requireAdmin(String fayAdminSessionToken) {
        if (!adminSessionVerifier.verify(fayAdminSessionToken)) {
            throw new SecurityException("需要重新输入管理员密码后才能管理运营报告");
        }
    }

    private EmailReportSettingsResponse response(EmailReportSettingsDto settings) {
        EmailReportSmtpSettings smtp = settingsService.currentSmtp();
        return new EmailReportSettingsResponse(
                settings.recipients(), settings.dailyEnabled(), settings.dailyTime(),
                settings.weeklyEnabled(), settings.weeklyDay(), settings.weeklyTime(),
                smtp.configured(), smtp.maskedUsername(), smtp.username()
        );
    }

    private EmailReportDispatchDto dispatch(EmailReportDispatch value) {
        return new EmailReportDispatchDto(
                value.getId(), value.getReportType(), value.getPeriodKey(), value.getSubject(),
                value.getGenerationSource(), value.getStatus(), value.getSafeErrorCode(),
                value.getRecipientCount(), value.getSentAt(), value.getCreatedAt()
        );
    }

    private ResponseEntity<Map<String, Object>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("ok", false, "message", message));
    }
}
