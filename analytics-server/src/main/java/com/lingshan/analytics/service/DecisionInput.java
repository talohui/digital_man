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
        double totalConsumptionAmount,
        List<EmergencySignal> activeEmergencies,
        ConsumptionSignal consumptionSignal
) {
    public DecisionInput {
        topics = topics == null ? List.of() : List.copyOf(topics);
        personaTags = personaTags == null ? List.of() : List.copyOf(personaTags);
        activeEmergencies = activeEmergencies == null ? List.of() : List.copyOf(activeEmergencies);
        consumptionSignal = consumptionSignal == null ? ConsumptionSignal.none() : consumptionSignal;
    }

    public DecisionInput(
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
            double totalConsumptionAmount,
            List<EmergencySignal> activeEmergencies
    ) {
        this(totalMessages, positiveRatio, p90LatencyMs, activeSessions5min, topics, heatmapHot,
                hottestSpot, hottestSpotVisits, personaTags, topConsumptionCategory,
                totalConsumptionAmount, activeEmergencies, ConsumptionSignal.none());
    }

    public DecisionInput(
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
        this(totalMessages, positiveRatio, p90LatencyMs, activeSessions5min, topics, heatmapHot,
                hottestSpot, hottestSpotVisits, personaTags, topConsumptionCategory,
                totalConsumptionAmount, List.of(), ConsumptionSignal.none());
    }

    public DecisionInput(
            int totalMessages,
            double positiveRatio,
            double p90LatencyMs,
            int activeSessions5min,
            List<TopicMetric> topics,
            boolean heatmapHot
    ) {
        this(totalMessages, positiveRatio, p90LatencyMs, activeSessions5min, topics, heatmapHot,
                null, 0, List.of(), null, 0, List.of(), ConsumptionSignal.none());
    }
}
