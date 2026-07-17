package com.lingshan.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "decision_snapshots")
public class DecisionSnapshot {
    @Id
    @Column(length = 36)
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String summary;

    @Column(length = 16, nullable = false)
    private String generationSource;

    private LocalDateTime generatedAt;
    private boolean cacheHit;

    @Column(length = 512)
    private String fallbackReason;

    private LocalDateTime inputWindowStart;
    private LocalDateTime inputWindowEnd;

    @Column(columnDefinition = "TEXT")
    private String inputSummaryJson;

    @Column(columnDefinition = "TEXT")
    private String dataSourcesJson;

    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getGenerationSource() { return generationSource; }
    public void setGenerationSource(String generationSource) { this.generationSource = generationSource; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public boolean isCacheHit() { return cacheHit; }
    public void setCacheHit(boolean cacheHit) { this.cacheHit = cacheHit; }
    public String getFallbackReason() { return fallbackReason; }
    public void setFallbackReason(String fallbackReason) { this.fallbackReason = fallbackReason; }
    public LocalDateTime getInputWindowStart() { return inputWindowStart; }
    public void setInputWindowStart(LocalDateTime inputWindowStart) { this.inputWindowStart = inputWindowStart; }
    public LocalDateTime getInputWindowEnd() { return inputWindowEnd; }
    public void setInputWindowEnd(LocalDateTime inputWindowEnd) { this.inputWindowEnd = inputWindowEnd; }
    public String getInputSummaryJson() { return inputSummaryJson; }
    public void setInputSummaryJson(String inputSummaryJson) { this.inputSummaryJson = inputSummaryJson; }
    public String getDataSourcesJson() { return dataSourcesJson; }
    public void setDataSourcesJson(String dataSourcesJson) { this.dataSourcesJson = dataSourcesJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
