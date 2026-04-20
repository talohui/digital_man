package com.lingshan.analytics.service;

/**
 * 情感分析策略接口（Strategy Pattern）。
 *
 * 当前实现：KeywordSentimentAnalyzer（关键词规则）
 * 后续扩展：
 *   - QwenSentimentAnalyzer：调用阿里百炼 DashScope API
 *   - LocalModelSentimentAnalyzer：本地 ONNX/TensorFlow Lite 模型
 *
 * 切换方式：在新实现类上加 @Primary，或通过 @ConditionalOnProperty
 * 配合 application.properties 的 sentiment.provider 选择。
 * 前端代码无需任何改动。
 */
public interface SentimentAnalyzer {

    /**
     * 分析文本情感。
     *
     * @param text 待分析的用户输入文本（中文）
     * @return SentimentResult，包含 sentiment / confidence / matched
     */
    SentimentResult analyze(String text);
}
