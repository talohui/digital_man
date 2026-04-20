package com.lingshan.analytics.service.impl;

import com.lingshan.analytics.service.SentimentAnalyzer;
import com.lingshan.analytics.service.SentimentResult;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 基于关键词规则的情感分析器（当前默认实现）。
 *
 * 词典针对景区中文对话场景定制。
 * 算法：命中词加分，命中词前 4 字符含强度词时权重 ×2，
 *       confidence = min(0.95, 0.5 + 占比 × 0.5)
 *
 * 切换到 Qwen 模型时：新建 QwenSentimentAnalyzer 实现 SentimentAnalyzer，
 * 将 application.properties 中 sentiment.provider 改为 qwen 即可，此类无需修改。
 */
@Primary
@Component
@ConditionalOnProperty(name = "sentiment.provider", havingValue = "keyword", matchIfMissing = true)
public class KeywordSentimentAnalyzer implements SentimentAnalyzer {

    private static final List<String> POSITIVE = List.of(
            "好", "棒", "赞", "美", "壮观", "震撼", "漂亮", "精彩", "喜欢", "开心",
            "感谢", "谢谢", "厉害", "不错", "满意", "方便", "清楚", "详细", "有趣",
            "好玩", "推荐", "期待", "值得", "完美", "难忘", "惊叹", "神圣", "庄严",
            "宏伟", "雄伟", "好看", "舒服", "愉快", "高兴", "兴奋", "惊喜", "想去",
            "要去", "打算去", "太棒", "很棒", "非常好", "超赞"
    );

    private static final List<String> NEGATIVE = List.of(
            "差", "糟", "烂", "坏", "贵", "难", "挤", "累", "堵", "失望",
            "不满", "投诉", "排队", "等待", "麻烦", "复杂", "不好", "不便",
            "看不懂", "找不到", "迷路", "无聊", "没意思", "坑", "骗",
            "太贵", "太远", "太累", "太热", "太冷", "太挤", "后悔",
            "没劲", "不推荐", "烦", "脏", "难看", "难走", "一般般"
    );

    private static final List<String> INTENSIFIERS = List.of(
            "非常", "特别", "超级", "太", "极其", "相当", "好（副词）", "真的"
    );

    @Override
    public SentimentResult analyze(String text) {
        if (text == null || text.isBlank()) {
            return new SentimentResult("neutral", 0.5, List.of());
        }

        List<String> matchedPos = new ArrayList<>();
        List<String> matchedNeg = new ArrayList<>();
        int posScore = 0;
        int negScore = 0;

        for (String word : POSITIVE) {
            if (text.contains(word)) {
                int weight = hasIntensifierBefore(text, word) ? 2 : 1;
                posScore += weight;
                matchedPos.add(word);
            }
        }

        for (String word : NEGATIVE) {
            if (text.contains(word)) {
                int weight = hasIntensifierBefore(text, word) ? 2 : 1;
                negScore += weight;
                matchedNeg.add(word);
            }
        }

        int total = posScore + negScore;
        if (total == 0) {
            return new SentimentResult("neutral", 0.5, List.of());
        }

        if (posScore > negScore) {
            double conf = Math.min(0.95, 0.5 + (double) posScore / total * 0.5);
            return new SentimentResult("positive", round2(conf), matchedPos);
        }

        if (negScore > posScore) {
            double conf = Math.min(0.95, 0.5 + (double) negScore / total * 0.5);
            return new SentimentResult("negative", round2(conf), matchedNeg);
        }

        // 平局
        return new SentimentResult("neutral", 0.4, List.of());
    }

    /**
     * 检查 word 前 4 个字符内是否包含强度修饰词
     */
    private boolean hasIntensifierBefore(String text, String word) {
        int idx = text.indexOf(word);
        if (idx <= 0) return false;
        String prefix = text.substring(Math.max(0, idx - 4), idx);
        return INTENSIFIERS.stream().anyMatch(prefix::contains);
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
