package com.lingshan.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "email_report_settings")
public class EmailReportSettings {
    @Id
    @Column(length = 16)
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String recipientsJson;

    @Column(length = 320)
    private String smtpUsername;

    @Column(columnDefinition = "TEXT")
    private String encryptedSmtpAuthCode;

    private boolean dailyEnabled;
    private LocalTime dailyTime;
    private boolean weeklyEnabled;

    @Column(length = 16)
    private String weeklyDay;

    private LocalTime weeklyTime;
    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRecipientsJson() { return recipientsJson; }
    public void setRecipientsJson(String recipientsJson) { this.recipientsJson = recipientsJson; }
    public String getSmtpUsername() { return smtpUsername; }
    public void setSmtpUsername(String smtpUsername) { this.smtpUsername = smtpUsername; }
    public String getEncryptedSmtpAuthCode() { return encryptedSmtpAuthCode; }
    public void setEncryptedSmtpAuthCode(String encryptedSmtpAuthCode) { this.encryptedSmtpAuthCode = encryptedSmtpAuthCode; }
    public boolean isDailyEnabled() { return dailyEnabled; }
    public void setDailyEnabled(boolean dailyEnabled) { this.dailyEnabled = dailyEnabled; }
    public LocalTime getDailyTime() { return dailyTime; }
    public void setDailyTime(LocalTime dailyTime) { this.dailyTime = dailyTime; }
    public boolean isWeeklyEnabled() { return weeklyEnabled; }
    public void setWeeklyEnabled(boolean weeklyEnabled) { this.weeklyEnabled = weeklyEnabled; }
    public String getWeeklyDay() { return weeklyDay; }
    public void setWeeklyDay(String weeklyDay) { this.weeklyDay = weeklyDay; }
    public LocalTime getWeeklyTime() { return weeklyTime; }
    public void setWeeklyTime(LocalTime weeklyTime) { this.weeklyTime = weeklyTime; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
