package com.lingshan.analytics.service;

import com.lingshan.analytics.config.EmailReportProperties;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
class JavaMailEmailReportSenderTest {
    @Test
    void sends_html_to_every_validated_recipient() throws Exception {
        CapturingMailSender mailSender = new CapturingMailSender();
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        mailSender.message = message;
        JavaMailEmailReportSender sender = new JavaMailEmailReportSender(
                mailSender,
                new EmailReportProperties("smtp.qq.com", 465, "sender@qq.com", "test-auth-code", true)
        );

        sender.send(List.of("ops-a@example.com", "ops-b@example.com"),
                new RenderedEmail("[测试] 灵山胜境运营简报", "<html><body>测试</body></html>"));

        assertThat(message.getAllRecipients()).hasSize(2);
        assertThat(message.getSubject()).isEqualTo("[测试] 灵山胜境运营简报");
        assertThat(mailSender.sent).containsExactly(message);
    }

    private static class CapturingMailSender extends JavaMailSenderImpl {
        private MimeMessage message;
        private MimeMessage[] sent;

        @Override public MimeMessage createMimeMessage() { return message; }
        @Override public void send(MimeMessage... messages) { this.sent = messages; }
    }
}
