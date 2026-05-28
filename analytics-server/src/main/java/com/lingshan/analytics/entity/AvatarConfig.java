package com.lingshan.analytics.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "avatar_config")
public class AvatarConfig {

    @Id
    private Long id = 1L;

    private String live2dModelUrl;
    private String live2dPresetName;
    private String voiceId;
    private String voiceName;
    private String displayName;
    /** default | costume1 | costume2 — 成套替换 texture_00（脸/发）+ texture_01（衣服） */
    private String costumeId;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLive2dModelUrl() { return live2dModelUrl; }
    public void setLive2dModelUrl(String live2dModelUrl) { this.live2dModelUrl = live2dModelUrl; }

    public String getLive2dPresetName() { return live2dPresetName; }
    public void setLive2dPresetName(String live2dPresetName) { this.live2dPresetName = live2dPresetName; }

    public String getVoiceId() { return voiceId; }
    public void setVoiceId(String voiceId) { this.voiceId = voiceId; }

    public String getVoiceName() { return voiceName; }
    public void setVoiceName(String voiceName) { this.voiceName = voiceName; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getCostumeId() { return costumeId; }
    public void setCostumeId(String costumeId) { this.costumeId = costumeId; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
