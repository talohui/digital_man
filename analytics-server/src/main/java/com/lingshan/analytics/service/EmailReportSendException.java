package com.lingshan.analytics.service;

public class EmailReportSendException extends RuntimeException {
    private final String safeCode;

    public EmailReportSendException(String safeCode, Throwable cause) {
        super(safeCode, cause);
        this.safeCode = safeCode;
    }

    public String safeCode() {
        return safeCode;
    }
}
