package com.lingshan.analytics.dto;

public record GuideFeedbackRequest(
        String userId,
        String routeId,
        String action
) {
}
