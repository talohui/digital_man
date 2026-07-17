package com.lingshan.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "decision_card_records", indexes = @Index(name = "idx_decision_card_snapshot", columnList = "snapshotId"))
public class DecisionCardRecord {
    @Id
    @Column(length = 36)
    private String id;

    @Column(length = 36, nullable = false)
    private String snapshotId;

    @Column(length = 512, nullable = false)
    private String stableKey;

    @Column(length = 255, nullable = false)
    private String title;
    @Column(length = 64, nullable = false)
    private String type;
    @Column(length = 16, nullable = false)
    private String priority;
    @Column(columnDefinition = "TEXT")
    private String evidenceJson;
    @Column(columnDefinition = "TEXT")
    private String reason;
    @Column(columnDefinition = "TEXT")
    private String actionsJson;
    @Column(columnDefinition = "TEXT")
    private String relatedTopicsJson;
    @Column(columnDefinition = "TEXT")
    private String relatedSpotsJson;
    private boolean demoFallback;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSnapshotId() { return snapshotId; }
    public void setSnapshotId(String snapshotId) { this.snapshotId = snapshotId; }
    public String getStableKey() { return stableKey; }
    public void setStableKey(String stableKey) { this.stableKey = stableKey; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getEvidenceJson() { return evidenceJson; }
    public void setEvidenceJson(String evidenceJson) { this.evidenceJson = evidenceJson; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getActionsJson() { return actionsJson; }
    public void setActionsJson(String actionsJson) { this.actionsJson = actionsJson; }
    public String getRelatedTopicsJson() { return relatedTopicsJson; }
    public void setRelatedTopicsJson(String relatedTopicsJson) { this.relatedTopicsJson = relatedTopicsJson; }
    public String getRelatedSpotsJson() { return relatedSpotsJson; }
    public void setRelatedSpotsJson(String relatedSpotsJson) { this.relatedSpotsJson = relatedSpotsJson; }
    public boolean isDemoFallback() { return demoFallback; }
    public void setDemoFallback(boolean demoFallback) { this.demoFallback = demoFallback; }
}
