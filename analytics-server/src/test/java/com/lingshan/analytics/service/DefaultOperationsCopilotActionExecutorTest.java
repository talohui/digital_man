package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EmergencyEventDto;
import com.lingshan.analytics.dto.OperationsCopilotProposalDraft;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DefaultOperationsCopilotActionExecutorTest {
    @Test
    void forwards_the_copilot_record_id_as_a_knowledge_operation_id() {
        AtomicReference<Map<String, Object>> body = new AtomicReference<>();
        KnowledgeBaseTransport knowledge = new KnowledgeBaseTransport() {
            @Override
            public Map<String, Object> postFaq(Map<String, Object> request) {
                body.set(request);
                return Map.of("faq", Map.of("id", "faq-1"));
            }

            @Override
            public void updateFaq(String id, Map<String, Object> request) {
                throw new UnsupportedOperationException();
            }
        };
        DefaultOperationsCopilotActionExecutor executor =
                new DefaultOperationsCopilotActionExecutor(null, knowledge);

        Map<String, Object> result = executor.execute("copilot-1", new OperationsCopilotProposalDraft(
                "KB_CREATE",
                "补充开放时间",
                "需要管理员确认",
                Map.of(
                        "question", "梵宫开放吗",
                        "answer", "正常开放",
                        "tags", List.of("开放时间")
                )
        ));

        assertThat(body.get()).containsEntry("operationId", "copilot-1");
        assertThat(result).containsEntry("kind", "knowledge");
        assertThat(result).containsEntry("id", "faq-1");
    }

    @Test
    void also_rejects_untrusted_knowledge_ids_at_the_executor_boundary() {
        KnowledgeBaseTransport knowledge = new KnowledgeBaseTransport() {
            @Override
            public Map<String, Object> postFaq(Map<String, Object> request) {
                throw new UnsupportedOperationException();
            }

            @Override
            public void updateFaq(String id, Map<String, Object> request) {
                throw new AssertionError("不得把模型生成的 FAQ ID 发送到知识库");
            }
        };
        DefaultOperationsCopilotActionExecutor executor =
                new DefaultOperationsCopilotActionExecutor(null, knowledge);

        assertThatThrownBy(() -> executor.execute("copilot-1", new OperationsCopilotProposalDraft(
                "KB_UPDATE",
                "更新开放时间",
                "需要管理员确认",
                Map.of("faqId", "invented", "question", "梵宫开放吗", "answer", "正常开放")
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("可信 FAQ ID");
    }

    @Test
    void never_silently_truncates_an_approved_payload_at_execution_time() {
        DefaultOperationsCopilotActionExecutor executor =
                new DefaultOperationsCopilotActionExecutor(null, new KnowledgeBaseTransport() {
                    @Override
                    public Map<String, Object> postFaq(Map<String, Object> request) {
                        throw new AssertionError("超长内容不得发送到知识库");
                    }

                    @Override
                    public void updateFaq(String id, Map<String, Object> request) {
                        throw new UnsupportedOperationException();
                    }
                });

        assertThatThrownBy(() -> executor.execute("copilot-1", new OperationsCopilotProposalDraft(
                "KB_CREATE",
                "补充开放时间",
                "需要管理员确认",
                Map.of("question", "问".repeat(241), "answer", "正常开放")
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("question");
    }

    @Test
    void reports_a_knowledge_write_with_no_response_id_as_an_uncertain_outcome() {
        DefaultOperationsCopilotActionExecutor executor =
                new DefaultOperationsCopilotActionExecutor(null, new KnowledgeBaseTransport() {
                    @Override
                    public Map<String, Object> postFaq(Map<String, Object> request) {
                        return Map.of();
                    }

                    @Override
                    public void updateFaq(String id, Map<String, Object> request) {
                        throw new UnsupportedOperationException();
                    }
                });

        assertThatThrownBy(() -> executor.execute("copilot-1", new OperationsCopilotProposalDraft(
                "KB_CREATE",
                "补充开放时间",
                "需要管理员确认",
                Map.of("question", "梵宫开放吗", "answer", "正常开放")
        ))).isInstanceOfSatisfying(OperationsCopilotUncertainOutcomeException.class, error ->
                assertThat(error.target()).containsEntry("operationId", "copilot-1"));
    }

    @Test
    void preserves_the_created_emergency_id_when_publish_has_an_uncertain_outcome() {
        EmergencyEventService emergencies = new EmergencyEventService(null) {
            @Override
            public EmergencyEventDto create(com.lingshan.analytics.dto.EmergencyEventRequest request) {
                return emergency("event-1", "DRAFT");
            }

            @Override
            public EmergencyEventDto publish(String id, LocalDateTime now) {
                throw new IllegalStateException("commit response lost");
            }
        };
        DefaultOperationsCopilotActionExecutor executor =
                new DefaultOperationsCopilotActionExecutor(emergencies, null);

        assertThatThrownBy(() -> executor.execute("copilot-1", new OperationsCopilotProposalDraft(
                "EMERGENCY_DRAFT",
                "入口道路绕行提醒",
                "需要管理员确认",
                Map.of(
                        "type", "ROAD_CLOSURE",
                        "title", "入口道路封闭",
                        "message", "请从东门绕行",
                        "severity", "WARNING",
                        "routePolicy", "EXCLUDE"
                )
        ))).isInstanceOfSatisfying(OperationsCopilotUncertainOutcomeException.class, error ->
                assertThat(error.target())
                        .containsEntry("operationId", "copilot-1")
                        .containsEntry("id", "event-1")
                        .containsEntry("status", "DRAFT"));
    }

    private EmergencyEventDto emergency(String id, String status) {
        LocalDateTime now = LocalDateTime.now();
        return new EmergencyEventDto(
                id, "ROAD_CLOSURE", "入口道路封闭", "请从东门绕行",
                "WARNING", status, List.of(), List.of(), now, now.plusHours(2),
                "EXCLUDE", null, null, null, "PENDING", now, now, null
        );
    }
}
