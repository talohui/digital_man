package com.lingshan.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "operations_copilot_records",
        indexes = @Index(name = "idx_operations_copilot_created", columnList = "createdAt")
)
public class OperationsCopilotRecord {
    @Id
    @Column(length = 36)
    private String id;

    @Column(length = 600, nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String answer;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String sourcesJson;

    @Column(columnDefinition = "TEXT")
    private String structuredResponseJson;

    @Column(length = 24, nullable = false)
    private String generationSource;

    @Column(length = 32)
    private String proposalType;

    @Column(length = 160)
    private String proposalTitle;

    @Column(columnDefinition = "TEXT")
    private String proposalSummary;

    @Column(columnDefinition = "TEXT")
    private String proposalPayloadJson;

    @Column(length = 24)
    private String proposalStatus;

    @Column(columnDefinition = "TEXT")
    private String executionResultJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getSourcesJson() { return sourcesJson; }
    public void setSourcesJson(String sourcesJson) { this.sourcesJson = sourcesJson; }
    public String getStructuredResponseJson() { return structuredResponseJson; }
    public void setStructuredResponseJson(String structuredResponseJson) { this.structuredResponseJson = structuredResponseJson; }
    public String getGenerationSource() { return generationSource; }
    public void setGenerationSource(String generationSource) { this.generationSource = generationSource; }
    public String getProposalType() { return proposalType; }
    public void setProposalType(String proposalType) { this.proposalType = proposalType; }
    public String getProposalTitle() { return proposalTitle; }
    public void setProposalTitle(String proposalTitle) { this.proposalTitle = proposalTitle; }
    public String getProposalSummary() { return proposalSummary; }
    public void setProposalSummary(String proposalSummary) { this.proposalSummary = proposalSummary; }
    public String getProposalPayloadJson() { return proposalPayloadJson; }
    public void setProposalPayloadJson(String proposalPayloadJson) { this.proposalPayloadJson = proposalPayloadJson; }
    public String getProposalStatus() { return proposalStatus; }
    public void setProposalStatus(String proposalStatus) { this.proposalStatus = proposalStatus; }
    public String getExecutionResultJson() { return executionResultJson; }
    public void setExecutionResultJson(String executionResultJson) { this.executionResultJson = executionResultJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
