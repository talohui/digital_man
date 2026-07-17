package com.lingshan.analytics.service;

import com.lingshan.analytics.config.EmailReportProperties;
import com.lingshan.analytics.config.EmailReportSmtpSettings;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;

@Component
public class JavaMailEmailReportSender implements EmailReportSender {
    private final JavaMailSender mailSender;
    private final EmailReportProperties properties;
    private final EmailReportSettingsService settingsService;

    public JavaMailEmailReportSender(
            @Qualifier("emailReportJavaMailSender") JavaMailSender mailSender,
            EmailReportProperties properties
    ) {
        this.mailSender = mailSender;
        this.properties = properties;
        this.settingsService = null;
    }

    @Autowired
    public JavaMailEmailReportSender(EmailReportSettingsService settingsService) {
        this.mailSender = null;
        this.properties = null;
        this.settingsService = settingsService;
    }

    @Override
    public void send(List<String> recipients, RenderedEmail email) {
        EmailReportSmtpSettings smtp = settingsService == null
                ? new EmailReportSmtpSettings(properties.host(), properties.port(), properties.username(), properties.authCode(), properties.ssl())
                : settingsService.currentSmtp();
        if (!smtp.configured()) {
            throw new EmailReportSendException("SMTP_NOT_CONFIGURED", null);
        }
        if (recipients == null || recipients.isEmpty()) {
            throw new EmailReportSendException("RECIPIENTS_EMPTY", null);
        }
        try {
            JavaMailSender activeMailSender = mailSender;
            if (activeMailSender == null) {
                JavaMailSenderImpl configuredSender = new JavaMailSenderImpl();
                configuredSender.setHost(smtp.host());
                configuredSender.setPort(smtp.port());
                configuredSender.setUsername(smtp.username());
                configuredSender.setPassword(smtp.authCode());
                Properties mail = configuredSender.getJavaMailProperties();
                mail.put("mail.transport.protocol", "smtp");
                mail.put("mail.smtp.auth", "true");
                mail.put("mail.smtp.ssl.enable", Boolean.toString(smtp.ssl()));
                mail.put("mail.smtp.connectiontimeout", "8000");
                mail.put("mail.smtp.timeout", "15000");
                mail.put("mail.smtp.writetimeout", "15000");
                activeMailSender = configuredSender;
            }
            MimeMessage message = activeMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(smtp.username());
            helper.setTo(recipients.toArray(String[]::new));
            helper.setSubject(email.subject());
            helper.setText(email.html(), true);
            activeMailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new EmailReportSendException("SMTP_SEND_FAILED", exception);
        }
    }
}
