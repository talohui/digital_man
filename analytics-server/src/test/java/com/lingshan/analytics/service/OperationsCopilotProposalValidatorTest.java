package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.OperationsCopilotProposalDraft;
import com.lingshan.analytics.dto.OperationsCopilotProposalUpdateRequest;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OperationsCopilotProposalValidatorTest {
    private final OperationsCopilotProposalValidator validator = new OperationsCopilotProposalValidator();

    @Test
    void rejects_unknown_payload_fields_and_action_type_mutation() throws Exception {
        OperationsCopilotProposalUpdateRequest update = new ObjectMapper().readValue("""
                {
                  "type":"KB_DEACTIVATE",
                  "title":"补充开放时间",
                  "summary":"补充管理员确认内容",
                  "payload":{"question":"梵宫开放吗","answer":"正常开放"}
                }
                """, OperationsCopilotProposalUpdateRequest.class);

        assertThatThrownBy(() -> validator.validateUpdate("KB_CREATE", update))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不允许");
        assertThatThrownBy(() -> validator.validateDraft(new OperationsCopilotProposalDraft(
                "KB_CREATE",
                "补充开放时间",
                "补充管理员确认内容",
                Map.of("question", "梵宫开放吗", "answer", "正常开放", "admin", true)
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不允许");
    }

    @Test
    void knowledge_update_and_deactivation_require_a_trusted_faq_id_source() {
        assertThatThrownBy(() -> validator.validateForExecution(new OperationsCopilotProposalDraft(
                "KB_UPDATE",
                "更新开放时间",
                "更新管理员确认内容",
                Map.of("faqId", "invented", "question", "梵宫开放吗", "answer", "正常开放")
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("可信 FAQ ID");
        assertThatThrownBy(() -> validator.validateForExecution(new OperationsCopilotProposalDraft(
                "KB_DEACTIVATE",
                "停用旧知识",
                "停用管理员确认内容",
                Map.of("faqId", "invented")
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("可信 FAQ ID");
    }

    @Test
    void accepts_only_whitelisted_fields_for_executable_create_and_emergency_drafts() {
        OperationsCopilotProposalDraft knowledge = validator.validateForExecution(
                new OperationsCopilotProposalDraft(
                        "KB_CREATE",
                        "补充开放时间",
                        "补充管理员确认内容",
                        Map.of(
                                "question", "梵宫开放吗",
                                "answer", "正常开放",
                                "tags", List.of("开放时间")
                        )
                ));
        OperationsCopilotProposalDraft emergency = validator.validateForExecution(
                new OperationsCopilotProposalDraft(
                        "EMERGENCY_DRAFT",
                        "入口道路封闭",
                        "需要管理员确认后发布",
                        Map.of(
                                "type", "ROAD_CLOSURE",
                                "title", "入口道路封闭",
                                "message", "请从东门绕行",
                                "severity", "WARNING",
                                "routePolicy", "EXCLUDE"
                        )
                ));

        assertThat(knowledge.type()).isEqualTo("KB_CREATE");
        assertThat(emergency.type()).isEqualTo("EMERGENCY_DRAFT");
    }

    @Test
    void ignores_optional_nulls_instead_of_throwing_an_internal_error() {
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("question", "梵宫开放吗");
        payload.put("answer", "正常开放");
        payload.put("validUntil", null);

        OperationsCopilotProposalDraft validated = validator.validateDraft(
                new OperationsCopilotProposalDraft(
                        "KB_CREATE", "补充开放时间", "需要管理员确认", payload));

        assertThat(validated.payload()).doesNotContainKey("validUntil");
    }

    @Test
    void validates_real_executor_limits_enums_times_and_list_items_before_confirmation() {
        assertThatThrownBy(() -> validator.validateDraft(new OperationsCopilotProposalDraft(
                "EMERGENCY_DRAFT",
                "入口道路封闭",
                "需要管理员确认后发布",
                Map.of(
                        "type", "ROAD_CLOSURE",
                        "title", "入口道路封闭",
                        "message", "请从东门绕行",
                        "severity", "NOT_A_LEVEL",
                        "routePolicy", "EXCLUDE"
                )
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("选项");

        assertThatThrownBy(() -> validator.validateDraft(new OperationsCopilotProposalDraft(
                "EMERGENCY_DRAFT",
                "入口道路封闭",
                "需要管理员确认后发布",
                Map.of(
                        "type", "ROAD_CLOSURE",
                        "title", "题".repeat(121),
                        "message", "请从东门绕行",
                        "severity", "WARNING",
                        "routePolicy", "EXCLUDE"
                )
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("title");

        assertThatThrownBy(() -> validator.validateDraft(new OperationsCopilotProposalDraft(
                "EMERGENCY_DRAFT",
                "入口道路封闭",
                "需要管理员确认后发布",
                Map.of(
                        "type", "ROAD_CLOSURE",
                        "title", "入口道路封闭",
                        "message", "请从东门绕行",
                        "severity", "WARNING",
                        "routePolicy", "EXCLUDE",
                        "validFrom", "not-a-time"
                )
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("时间");

        assertThatThrownBy(() -> validator.validateDraft(new OperationsCopilotProposalDraft(
                "EMERGENCY_DRAFT",
                "入口道路封闭",
                "需要管理员确认后发布",
                Map.of(
                        "type", "ROAD_CLOSURE",
                        "title", "入口道路封闭",
                        "message", "请从东门绕行",
                        "severity", "WARNING",
                        "routePolicy", "EXCLUDE",
                        "validUntil", "2000-01-01T00:00:00"
                )
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("时间");

        assertThatThrownBy(() -> validator.validateDraft(new OperationsCopilotProposalDraft(
                "KB_CREATE",
                "补充开放时间",
                "需要管理员确认",
                Map.of(
                        "question", "问".repeat(241),
                        "answer", "正常开放",
                        "tags", List.of("开放时间")
                )
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("question");

        assertThatThrownBy(() -> validator.validateDraft(new OperationsCopilotProposalDraft(
                "KB_CREATE",
                "补充开放时间",
                "需要管理员确认",
                Map.of(
                        "question", "梵宫开放吗",
                        "answer", "正常开放",
                        "tags", List.of(Map.of("unexpected", true))
                )
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tags");
    }
}
