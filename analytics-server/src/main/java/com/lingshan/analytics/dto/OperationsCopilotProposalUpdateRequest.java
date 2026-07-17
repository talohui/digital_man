package com.lingshan.analytics.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

public final class OperationsCopilotProposalUpdateRequest {
    private String title;
    private String summary;
    private Map<String, Object> payload;
    private final Set<String> unknownFields = new LinkedHashSet<>();

    public OperationsCopilotProposalUpdateRequest() {
    }

    public OperationsCopilotProposalUpdateRequest(
            String title,
            String summary,
            Map<String, Object> payload
    ) {
        this.title = title;
        this.summary = summary;
        this.payload = payload == null ? null : new LinkedHashMap<>(payload);
    }

    public String title() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String summary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Map<String, Object> payload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload == null ? null : new LinkedHashMap<>(payload);
    }

    @JsonAnySetter
    public void captureUnknownField(String field, Object ignored) {
        unknownFields.add(field);
    }

    public Set<String> unknownFields() {
        return Collections.unmodifiableSet(unknownFields);
    }
}
