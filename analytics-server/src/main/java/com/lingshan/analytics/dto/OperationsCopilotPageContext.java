package com.lingshan.analytics.dto;

public record OperationsCopilotPageContext(
        String pathname,
        String pageLabel,
        String objectType,
        String objectId,
        String objectLabel,
        String dataUpdatedAt
) {
    public OperationsCopilotPageContext(String pathname, String objectType, String objectId) {
        this(pathname, null, objectType, objectId, null, null);
    }
}
