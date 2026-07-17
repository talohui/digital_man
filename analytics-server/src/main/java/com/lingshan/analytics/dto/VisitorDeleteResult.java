package com.lingshan.analytics.dto;

import java.util.List;
import java.util.Map;

public record VisitorDeleteResult(
        String userId,
        Map<String, Long> deletedCounts,
        List<String> failedCategories,
        boolean complete
) {
}
