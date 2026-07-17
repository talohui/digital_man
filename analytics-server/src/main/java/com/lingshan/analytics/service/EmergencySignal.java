package com.lingshan.analytics.service;

import java.util.List;

public record EmergencySignal(
        String id,
        String type,
        String title,
        String severity,
        String message,
        String routePolicy,
        List<String> affectedSpotIds,
        List<String> affectedRouteIds,
        String validUntil
) {
    public EmergencySignal {
        affectedSpotIds = affectedSpotIds == null ? List.of() : List.copyOf(affectedSpotIds);
        affectedRouteIds = affectedRouteIds == null ? List.of() : List.copyOf(affectedRouteIds);
    }
}
