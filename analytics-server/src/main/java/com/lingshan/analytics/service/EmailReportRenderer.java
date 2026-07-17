package com.lingshan.analytics.service;

public interface EmailReportRenderer {
    RenderedEmail render(EmailReportContent content, EmailReportInput input, boolean testMail);
}
