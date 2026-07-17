package com.lingshan.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_consents")
public class VisitorConsent {
    @Id
    @Column(length = 64)
    private String userId;
    private boolean personalizationEnabled;
    private boolean analyticsEnabled;
    private LocalDateTime updatedAt;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public boolean isPersonalizationEnabled() { return personalizationEnabled; }
    public void setPersonalizationEnabled(boolean value) { this.personalizationEnabled = value; }
    public boolean isAnalyticsEnabled() { return analyticsEnabled; }
    public void setAnalyticsEnabled(boolean value) { this.analyticsEnabled = value; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
