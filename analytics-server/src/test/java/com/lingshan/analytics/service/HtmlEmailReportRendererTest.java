package com.lingshan.analytics.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlEmailReportRendererTest {
    @Test
    void escapes_model_content_and_marks_ai_generated_report() {
        HtmlEmailReportRenderer renderer = new HtmlEmailReportRenderer();
        EmailReportContent content = new EmailReportContent(
                "灵山胜境运营简报", "<script>alert(1)</script>",
                Map.of(
                        "客流与服务", "客流汇总", "消费与客群", "消费汇总",
                        "风险与应急", "无应急", "下一步动作", "继续观察"
                ),
                List.of("门票与消费事件"), "llm", null
        );

        RenderedEmail email = renderer.render(content, input(), false);

        assertThat(email.subject()).isEqualTo("灵山胜境运营简报");
        assertThat(email.html()).contains("灵山胜境运营简报", "大模型生成", "&lt;script&gt;")
                .doesNotContain("<script>");
    }

    private EmailReportInput input() {
        return new EmailReportInput("DAILY", "D-2026-07-13",
                LocalDateTime.of(2026, 7, 13, 0, 0), LocalDateTime.of(2026, 7, 14, 0, 0),
                Map.of(), List.of(), Map.of(), Map.of(), List.of("门票与消费事件"));
    }
}
