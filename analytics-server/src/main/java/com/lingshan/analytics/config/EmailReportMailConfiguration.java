package com.lingshan.analytics.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class EmailReportMailConfiguration {
    @Bean("emailReportJavaMailSender")
    JavaMailSender emailReportJavaMailSender(EmailReportProperties properties) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(properties.host());
        sender.setPort(properties.port());
        sender.setUsername(properties.username());
        sender.setPassword(properties.authCode());
        Properties mail = sender.getJavaMailProperties();
        mail.put("mail.transport.protocol", "smtp");
        mail.put("mail.smtp.auth", "true");
        mail.put("mail.smtp.ssl.enable", Boolean.toString(properties.ssl()));
        mail.put("mail.smtp.connectiontimeout", "8000");
        mail.put("mail.smtp.timeout", "15000");
        mail.put("mail.smtp.writetimeout", "15000");
        return sender;
    }
}
