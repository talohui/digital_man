package com.lingshan.analytics.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @Column(length = 64)
    private String userId;

    @Column(columnDefinition = "TEXT")
    private String interestVectorJson;

    @Column(columnDefinition = "TEXT")
    private String tagVectorJson;

    @Column(columnDefinition = "TEXT")
    private String behaviorVectorJson;

    @Column(columnDefinition = "TEXT")
    private String selectedTagsJson;

    @Column(length = 255)
    private String tagSnapshotHash;

    @Column(length = 32)
    private String primaryPersona;

    private Double primaryScore;

    private Integer profileVersion;

    private LocalDateTime updatedAt;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getInterestVectorJson() { return interestVectorJson; }
    public void setInterestVectorJson(String json) { this.interestVectorJson = json; }

    public String getTagVectorJson() { return tagVectorJson; }
    public void setTagVectorJson(String json) { this.tagVectorJson = json; }

    public String getBehaviorVectorJson() { return behaviorVectorJson; }
    public void setBehaviorVectorJson(String json) { this.behaviorVectorJson = json; }

    public String getSelectedTagsJson() { return selectedTagsJson; }
    public void setSelectedTagsJson(String json) { this.selectedTagsJson = json; }

    public String getTagSnapshotHash() { return tagSnapshotHash; }
    public void setTagSnapshotHash(String hash) { this.tagSnapshotHash = hash; }

    public String getPrimaryPersona() { return primaryPersona; }
    public void setPrimaryPersona(String p) { this.primaryPersona = p; }

    public Double getPrimaryScore() { return primaryScore; }
    public void setPrimaryScore(Double s) { this.primaryScore = s; }

    public Integer getProfileVersion() { return profileVersion; }
    public void setProfileVersion(Integer v) { this.profileVersion = v; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime t) { this.updatedAt = t; }
}
