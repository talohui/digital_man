package com.lingshan.analytics.service;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class EmailReportFallbackWriter {
    public EmailReportContent write(EmailReportInput input, String reason) {
        Map<String, Object> metrics = input.metrics();
        Map<String, String> sections = new LinkedHashMap<>();
        sections.put("客流与服务", String.format("本周期收到 %s 条游客问答，路线点击 %s 次，平均回复耗时 %s 毫秒。",
                metrics.getOrDefault("messageCount", 0), metrics.getOrDefault("routeClickCount", 0),
                metrics.getOrDefault("averageReplyLatencyMs", 0)));
        sections.put("消费与客群", String.format("门票购买 %s 笔、票务收入 %s 元；消费 %s 笔、消费金额 %s 元。",
                metrics.getOrDefault("ticketPurchaseCount", 0), metrics.getOrDefault("ticketRevenue", 0),
                metrics.getOrDefault("purchaseCount", 0), metrics.getOrDefault("consumptionAmount", 0)));
        sections.put("风险与应急", input.activeEmergencies().isEmpty()
                ? "本周期无正在生效的应急事件。"
                : "存在 " + input.activeEmergencies().size() + " 条生效中的应急事件，请以管理员发布的官方处置指引为准。");
        sections.put("下一步动作", "持续关注高频问答、路线点击和消费类别变化；对已发布的应急事件优先核验游客提醒与路线限制是否生效。");
        return new EmailReportContent(
                "灵山胜境运营简报 " + input.periodKey(),
                "基于已完成周期的真实运营汇总生成。",
                Map.copyOf(sections),
                input.dataSources(),
                "rules",
                reason
        );
    }
}
