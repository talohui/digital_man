package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.EmailReportSettingsDto;
import com.lingshan.analytics.entity.EmailReportDispatch;
import com.lingshan.analytics.repository.EmailReportDispatchRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class EmailReportService {
    private final EmailReportSettingsService settingsService;
    private final EmailReportDataService dataService;
    private final EmailReportGenerator generator;
    private final EmailReportRenderer renderer;
    private final EmailReportSender sender;
    private final EmailReportDispatchRepository dispatchRepository;
    private final ObjectMapper objectMapper;

    public EmailReportService(
            EmailReportSettingsService settingsService,
            EmailReportDataService dataService,
            EmailReportGenerator generator,
            EmailReportRenderer renderer,
            EmailReportSender sender,
            EmailReportDispatchRepository dispatchRepository,
            ObjectMapper objectMapper
    ) {
        this.settingsService = settingsService;
        this.dataService = dataService;
        this.generator = generator;
        this.renderer = renderer;
        this.sender = sender;
        this.dispatchRepository = dispatchRepository;
        this.objectMapper = objectMapper;
    }

    public synchronized EmailReportDispatch sendScheduled(EmailReportType reportType, LocalDate runDate) {
        if (reportType != EmailReportType.DAILY && reportType != EmailReportType.WEEKLY) {
            throw new IllegalArgumentException("定时报告类型无效");
        }
        EmailReportInput input = reportType == EmailReportType.DAILY
                ? dataService.daily(runDate)
                : dataService.weekly(runDate);
        return send(input, reportType, false);
    }

    public synchronized EmailReportDispatch sendTest() {
        return send(dataService.currentSnapshot(), EmailReportType.TEST, true);
    }

    public List<EmailReportDispatch> latestDispatches() {
        return dispatchRepository.findTop20ByOrderByCreatedAtDesc();
    }

    private EmailReportDispatch send(EmailReportInput input, EmailReportType reportType, boolean testMail) {
        EmailReportSettingsDto settings = settingsService.current();
        List<String> recipients = settings.recipients();
        String dispatchKey = testMail ? input.periodKey() + "-" + UUID.randomUUID() : input.periodKey();
        EmailReportDispatch dispatch = reserve(reportType, dispatchKey, recipients);
        if (dispatch == null) {
            return null;
        }
        if (recipients == null || recipients.isEmpty()) {
            dispatch.setStatus("FAILED");
            dispatch.setSafeErrorCode("RECIPIENTS_EMPTY");
            return dispatchRepository.saveAndFlush(dispatch);
        }
        try {
            EmailReportContent content = generator.generate(input);
            RenderedEmail email = renderer.render(content, input, testMail);
            dispatch.setSubject(email.subject());
            dispatch.setGenerationSource(content.generationSource());
            sender.send(recipients, email);
            dispatch.setStatus("SENT");
            dispatch.setSentAt(LocalDateTime.now());
        } catch (EmailReportSendException exception) {
            dispatch.setStatus("FAILED");
            dispatch.setSafeErrorCode(exception.safeCode());
        } catch (RuntimeException exception) {
            dispatch.setStatus("FAILED");
            dispatch.setSafeErrorCode("REPORT_GENERATION_FAILED");
        }
        return dispatchRepository.saveAndFlush(dispatch);
    }

    private EmailReportDispatch reserve(EmailReportType reportType, String periodKey, List<String> recipients) {
        if (reportType != EmailReportType.TEST
                && dispatchRepository.findByReportTypeAndPeriodKey(reportType.name(), periodKey).isPresent()) {
            return null;
        }
        EmailReportDispatch dispatch = new EmailReportDispatch();
        dispatch.setId(UUID.randomUUID().toString());
        dispatch.setReportType(reportType.name());
        dispatch.setPeriodKey(periodKey);
        dispatch.setGenerationSource("pending");
        dispatch.setRecipientHashesJson(writeRecipientHashes(recipients));
        dispatch.setRecipientCount(recipients == null ? 0 : recipients.size());
        dispatch.setStatus("PENDING");
        dispatch.setCreatedAt(LocalDateTime.now());
        try {
            return dispatchRepository.saveAndFlush(dispatch);
        } catch (DataIntegrityViolationException ignored) {
            return null;
        }
    }

    private String writeRecipientHashes(List<String> recipients) {
        List<String> hashes = new ArrayList<>();
        if (recipients != null) {
            for (String recipient : recipients) hashes.add(sha256(recipient));
        }
        try {
            return objectMapper.writeValueAsString(hashes);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("无法记录邮件审计", exception);
        }
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 不可用", exception);
        }
    }
}
