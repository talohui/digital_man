package com.lingshan.analytics.service;

import java.util.List;

public record DecisionInput(
        int totalMessages,
        double positiveRatio,
        double p90LatencyMs,
        int activeSessions5min,
        List<TopicMetric> topics,
        boolean heatmapHot,
        String hottestSpot,
        int hottestSpotVisits,
        List<String> personaTags,
        String topConsumptionCategory,
        double totalConsumptionAmount
) {
    public DecisionInput(
            int totalMessages,
            double positiveRatio,
            double p90LatencyMs,
            int activeSessions5min,
            List<TopicMetric> topics,
            boolean heatmapHot
    ) {
        this(totalMessages, positiveRatio, p90LatencyMs, activeSessions5min, topics, heatmapHot,
                null, 0, List.of(), null, 0);
    }
}
