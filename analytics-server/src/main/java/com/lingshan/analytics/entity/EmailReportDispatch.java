package com.lingshan.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "email_report_dispatches",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_email_report_dispatch_period",
                columnNames = {"reportType", "periodKey"}
        ),
        indexes = @Index(name = "idx_email_report_dispatch_created", columnList = "createdAt")
)
public class EmailReportDispatch {
    @Id
    @Column(length = 36)
    private String id;

    @Column(length = 16, nullable = false)
    private String reportType;

    @Column(length = 64, nullable = false)
    private String periodKey;

    @Column(length = 240)
    private String subject;

    @Column(length = 24, nullable = false)
    private String generationSource;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String recipientHashesJson;

    private int recipientCount;

    @Column(length = 24, nullable = false)
    private String status;

    @Column(length = 80)
    private String safeErrorCode;

    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }
    public String getPeriodKey() { return periodKey; }
    public void setPeriodKey(String periodKey) { this.periodKey = periodKey; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getGenerationSource() { return generationSource; }
    public void setGenerationSource(String generationSource) { this.generationSource = generationSource; }
    public String getRecipientHashesJson() { return recipientHashesJson; }
    public void setRecipientHashesJson(String recipientHashesJson) { this.recipientHashesJson = recipientHashesJson; }
    public int getRecipientCount() { return recipientCount; }
    public void setRecipientCount(int recipientCount) { this.recipientCount = recipientCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSafeErrorCode() { return safeErrorCode; }
    public void setSafeErrorCode(String safeErrorCode) { this.safeErrorCode = safeErrorCode; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
