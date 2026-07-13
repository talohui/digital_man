package com.lingshan.analytics.service;

import java.util.List;

public record TopicMetric(
        String topic,
        int count,
        int negativeCount,
        List<String> samples
) {
}
