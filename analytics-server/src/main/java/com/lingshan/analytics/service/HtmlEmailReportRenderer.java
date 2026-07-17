package com.lingshan.analytics.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class HtmlEmailReportRenderer implements EmailReportRenderer {
    private static final List<String> SECTION_NAMES = List.of("客流与服务", "消费与客群", "风险与应急", "下一步动作");

    @Override
    public RenderedEmail render(EmailReportContent content, EmailReportInput input, boolean testMail) {
        String subject = (testMail ? "[测试] " : "") + safe(content.subject());
        String source = "llm".equals(content.generationSource()) ? "大模型生成" : "规则兜底";
        StringBuilder html = new StringBuilder(2500);
        html.append("<!doctype html><html><body style=\"margin:0;background:#f5f2eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;color:#26362d;\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td style=\"padding:28px 16px;\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:680px;margin:auto;background:#ffffff;border:1px solid #d8e2d5;border-radius:14px;overflow:hidden;\">")
                .append("<tr><td style=\"padding:24px 28px;background:#1f4b3a;color:#fff;\"><div style=\"font-size:12px;letter-spacing:1px;opacity:.82;\">灵山胜境 · AI 运营报告</div><h1 style=\"margin:8px 0 0;font-size:24px;line-height:1.3;\">")
                .append(safe(content.subject())).append("</h1></td></tr>")
                .append("<tr><td style=\"padding:24px 28px;\"><p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">")
                .append(safe(content.headline())).append("</p>")
                .append("<p style=\"margin:0 0 22px;color:#58705f;font-size:13px;\">报告周期：")
                .append(safe(input.periodKey())).append("　·　来源：").append(source)
                .append(testMail ? "　·　这是测试邮件" : "")
                .append("</p>");
        Map<String, String> sections = content.sections() == null ? Map.of() : content.sections();
        for (String name : SECTION_NAMES) {
            html.append("<section style=\"padding:16px 0;border-top:1px solid #e8eee6;\"><h2 style=\"margin:0 0 8px;font-size:16px;color:#27573f;\">")
                    .append(name).append("</h2><p style=\"margin:0;font-size:14px;line-height:1.75;white-space:pre-line;\">")
                    .append(safe(sections.get(name))).append("</p></section>");
        }
        html.append("<div style=\"margin-top:18px;padding:12px 14px;background:#f1f6ef;border-radius:8px;font-size:12px;color:#58705f;\">数据来源：")
                .append(safe(String.join("、", content.dataSources() == null ? List.of() : content.dataSources())))
                .append("</div></td></tr><tr><td style=\"padding:16px 28px;background:#f7f9f6;color:#78877d;font-size:12px;line-height:1.6;\">本邮件由灵山胜境运营系统自动生成；请结合现场实际与官方处置流程执行。</td></tr></table></td></tr></table></body></html>");
        return new RenderedEmail(subject, html.toString());
    }

    private String safe(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
