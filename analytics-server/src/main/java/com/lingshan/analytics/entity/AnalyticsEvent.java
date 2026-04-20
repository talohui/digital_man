package com.lingshan.analytics.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_events",
       indexes = {
           @Index(name = "idx_event", columnList = "event"),
           @Index(name = "idx_ts",    columnList = "ts")
       })
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String event;

    @Column(columnDefinition = "TEXT")
    private String properties;

    @Column(nullable = false)
    private LocalDateTime ts;

    private LocalDateTime createdAt;

    @Column(length = 16)
    private String sentiment;

    private Double sentimentConfidence;
    private Double latencyMs;

    @Column(length = 512)
    private String question;

    private Boolean isVoice;

    // ---------- getters & setters ----------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }

    public String getProperties() { return properties; }
    public void setProperties(String properties) { this.properties = properties; }

    public LocalDateTime getTs() { return ts; }
    public void setTs(LocalDateTime ts) { this.ts = ts; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }

    public Double getSentimentConfidence() { return sentimentConfidence; }
    public void setSentimentConfidence(Double sentimentConfidence) { this.sentimentConfidence = sentimentConfidence; }

    public Double getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Double latencyMs) { this.latencyMs = latencyMs; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public Boolean getIsVoice() { return isVoice; }
    public void setIsVoice(Boolean isVoice) { this.isVoice = isVoice; }
}
