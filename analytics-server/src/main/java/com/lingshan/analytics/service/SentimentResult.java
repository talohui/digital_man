package com.lingshan.analytics.service;

import java.util.List;

/**
 * 情感分析结果。
 *
 * @param sentiment  positive | negative | neutral
 * @param confidence [0.0, 1.0]
 * @param matched    命中的关键词列表（调试用）
 */
public record SentimentResult(
        String sentiment,
        double confidence,
        List<String> matched
) {}
