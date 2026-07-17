package com.lingshan.analytics.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="decision_actions", indexes=@Index(name="idx_decision_action_card", columnList="cardId"))
public class DecisionAction {
 @Id @Column(length=36) private String id;
 @Column(length=36,nullable=false) private String cardId;
 @Column(length=36,nullable=false) private String snapshotId;
 @Column(length=500,nullable=false) private String actionText;
 @Column(length=24,nullable=false) private String status;
 @Column(length=80) private String owner; private LocalDateTime dueAt;
 @Column(columnDefinition="TEXT") private String note;
 private LocalDateTime acceptedAt,completedAt,baselineWindowStart,baselineWindowEnd,evaluationWindowStart,evaluationWindowEnd,createdAt,updatedAt;
 @Column(columnDefinition="TEXT") private String baselineMetricsJson;
 @Column(columnDefinition="TEXT") private String resultMetricsJson;
 public String getId(){return id;} public void setId(String v){id=v;} public String getCardId(){return cardId;} public void setCardId(String v){cardId=v;}
 public String getSnapshotId(){return snapshotId;} public void setSnapshotId(String v){snapshotId=v;} public String getActionText(){return actionText;} public void setActionText(String v){actionText=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;} public String getOwner(){return owner;} public void setOwner(String v){owner=v;}
 public LocalDateTime getDueAt(){return dueAt;} public void setDueAt(LocalDateTime v){dueAt=v;} public String getNote(){return note;} public void setNote(String v){note=v;}
 public LocalDateTime getAcceptedAt(){return acceptedAt;} public void setAcceptedAt(LocalDateTime v){acceptedAt=v;} public LocalDateTime getCompletedAt(){return completedAt;} public void setCompletedAt(LocalDateTime v){completedAt=v;}
 public LocalDateTime getBaselineWindowStart(){return baselineWindowStart;} public void setBaselineWindowStart(LocalDateTime v){baselineWindowStart=v;} public LocalDateTime getBaselineWindowEnd(){return baselineWindowEnd;} public void setBaselineWindowEnd(LocalDateTime v){baselineWindowEnd=v;}
 public LocalDateTime getEvaluationWindowStart(){return evaluationWindowStart;} public void setEvaluationWindowStart(LocalDateTime v){evaluationWindowStart=v;} public LocalDateTime getEvaluationWindowEnd(){return evaluationWindowEnd;} public void setEvaluationWindowEnd(LocalDateTime v){evaluationWindowEnd=v;}
 public String getBaselineMetricsJson(){return baselineMetricsJson;} public void setBaselineMetricsJson(String v){baselineMetricsJson=v;} public String getResultMetricsJson(){return resultMetricsJson;} public void setResultMetricsJson(String v){resultMetricsJson=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;} public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
}
