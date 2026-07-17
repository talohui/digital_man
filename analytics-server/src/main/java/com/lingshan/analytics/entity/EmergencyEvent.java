package com.lingshan.analytics.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="emergency_events",indexes={@Index(name="idx_emergency_status",columnList="status"),@Index(name="idx_emergency_validity",columnList="validFrom,validUntil")})
public class EmergencyEvent {
 @Id @Column(length=36) private String id; @Column(length=32,nullable=false) private String type; @Column(length=200,nullable=false) private String title;
 @Column(columnDefinition="TEXT",nullable=false) private String message; @Column(length=16,nullable=false) private String severity; @Column(length=16,nullable=false) private String status;
 @Column(columnDefinition="TEXT") private String affectedSpotIdsJson,affectedRouteIdsJson; private LocalDateTime validFrom,validUntil;
 @Column(length=16,nullable=false) private String routePolicy; @Column(length=500) private String knowledgeQuestion; @Column(columnDefinition="TEXT") private String knowledgeAnswer;
 @Column(length=36) private String kbFaqId; @Column(length=16) private String kbSyncStatus; @Column(length=500) private String kbSyncError;
 @Column(length=80) private String createdBy; private LocalDateTime createdAt,updatedAt,resolvedAt;
 public String getId(){return id;} public void setId(String v){id=v;} public String getType(){return type;} public void setType(String v){type=v;} public String getTitle(){return title;} public void setTitle(String v){title=v;}
 public String getMessage(){return message;} public void setMessage(String v){message=v;} public String getSeverity(){return severity;} public void setSeverity(String v){severity=v;} public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public String getAffectedSpotIdsJson(){return affectedSpotIdsJson;} public void setAffectedSpotIdsJson(String v){affectedSpotIdsJson=v;} public String getAffectedRouteIdsJson(){return affectedRouteIdsJson;} public void setAffectedRouteIdsJson(String v){affectedRouteIdsJson=v;}
 public LocalDateTime getValidFrom(){return validFrom;} public void setValidFrom(LocalDateTime v){validFrom=v;} public LocalDateTime getValidUntil(){return validUntil;} public void setValidUntil(LocalDateTime v){validUntil=v;}
 public String getRoutePolicy(){return routePolicy;} public void setRoutePolicy(String v){routePolicy=v;} public String getKnowledgeQuestion(){return knowledgeQuestion;} public void setKnowledgeQuestion(String v){knowledgeQuestion=v;} public String getKnowledgeAnswer(){return knowledgeAnswer;} public void setKnowledgeAnswer(String v){knowledgeAnswer=v;}
 public String getKbFaqId(){return kbFaqId;} public void setKbFaqId(String v){kbFaqId=v;} public String getKbSyncStatus(){return kbSyncStatus;} public void setKbSyncStatus(String v){kbSyncStatus=v;} public String getKbSyncError(){return kbSyncError;} public void setKbSyncError(String v){kbSyncError=v;}
 public String getCreatedBy(){return createdBy;} public void setCreatedBy(String v){createdBy=v;} public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;} public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;} public LocalDateTime getResolvedAt(){return resolvedAt;} public void setResolvedAt(LocalDateTime v){resolvedAt=v;}
}
