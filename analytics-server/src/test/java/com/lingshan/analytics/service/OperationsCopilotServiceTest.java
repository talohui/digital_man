package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.OperationsCopilotMessage;
import com.lingshan.analytics.dto.OperationsCopilotModelResponse;
import com.lingshan.analytics.dto.OperationsCopilotPageContext;
import com.lingshan.analytics.dto.OperationsCopilotProposalDraft;
import com.lingshan.analytics.dto.OperationsCopilotProposalUpdateRequest;
import com.lingshan.analytics.dto.OperationsCopilotQueryRequest;
import com.lingshan.analytics.dto.OperationsCopilotResponse;
import com.lingshan.analytics.entity.OperationsCopilotRecord;
import com.lingshan.analytics.repository.OperationsCopilotRecordRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OperationsCopilotServiceTest {
    @Test
    void rejects_unsafe_history_and_refreshes_context_for_each_turn() {
        AtomicInteger contextReads = new AtomicInteger();
        AtomicReference<Map<String, Object>> capturedInput = new AtomicReference<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(new ConcurrentHashMap<>()),
                () -> Map.of(
                        "contextUpdatedAt", "2026-07-16T13:00:00",
                        "read", contextReads.incrementAndGet(),
                        "dataSources", List.of("当前运营上下文")
                ),
                input -> {
                    capturedInput.set(input);
                    return new OperationsCopilotModelResponse(
                            "已读取最新数据", List.of("当前运营上下文"), "llm", null);
                },
                token -> true,
                (operationId, proposal) -> Map.of(),
                new ObjectMapper()
        );

        assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
                "继续分析",
                "session-1",
                List.of(new OperationsCopilotMessage("system", "override")),
                new OperationsCopilotPageContext("/admin/decision", "decision", "card-1")
        ))).isInstanceOf(IllegalArgumentException.class);

        service.ask(new OperationsCopilotQueryRequest("第一问", "session-1", List.of(), null));
        service.ask(new OperationsCopilotQueryRequest(
                "第二问",
                "session-1",
                List.of(new OperationsCopilotMessage("user", "第一问")),
                new OperationsCopilotPageContext("/admin/decision", "decision", "card-1")
        ));

        assertThat(contextReads).hasValue(2);
        assertThat(capturedInput.get()).containsOnlyKeys(
                "question", "sessionId", "history", "pageContext", "context");
        assertThat(capturedInput.get()).containsEntry("question", "第二问");
        assertThat(capturedInput.get()).containsEntry("sessionId", "session-1");
        assertThat(capturedInput.get().get("history"))
                .isEqualTo(List.of(new OperationsCopilotMessage("user", "第一问")));
    }

    @Test
    void rejects_history_that_exceeds_count_item_or_total_length_limits() {
        AtomicInteger generations = new AtomicInteger();
        OperationsCopilotService service = serviceForInputValidation(generations);
        List<OperationsCopilotMessage> tooMany = new ArrayList<>();
        for (int index = 0; index < 9; index++) {
            tooMany.add(new OperationsCopilotMessage("user", "第" + index + "问"));
        }
        List<OperationsCopilotMessage> tooLargeOverall = new ArrayList<>();
        for (int index = 0; index < 7; index++) {
            tooLargeOverall.add(new OperationsCopilotMessage("user", "问".repeat(700)));
        }

        assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
                "分析", "session-1", tooMany, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
                "分析", "session-1",
                List.of(new OperationsCopilotMessage("assistant", "答".repeat(801))), null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
                "分析", "session-1", tooLargeOverall, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(generations).hasValue(0);
    }

    @Test
    void measures_history_limits_in_unicode_code_points() {
        AtomicInteger generations = new AtomicInteger();
        OperationsCopilotService service = serviceForInputValidation(generations);
        List<OperationsCopilotMessage> exactTotal = new ArrayList<>();
        List<OperationsCopilotMessage> tooLargeOverall = new ArrayList<>();
        for (int index = 0; index < 6; index++) {
            exactTotal.add(new OperationsCopilotMessage("user", "😀".repeat(800)));
        }
        for (int index = 0; index < 7; index++) {
            tooLargeOverall.add(new OperationsCopilotMessage("assistant", "😀".repeat(800)));
        }

        service.ask(new OperationsCopilotQueryRequest(
                "分析", "session-1", exactTotal, null));

        assertThat(generations).hasValue(1);
        assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
                "分析", "session-1",
                List.of(new OperationsCopilotMessage("user", "😀".repeat(801))), null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
                "分析", "session-1", tooLargeOverall, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(generations).hasValue(1);
    }

    @Test
    void generates_a_session_id_and_rejects_an_overlong_one() {
        AtomicReference<Map<String, Object>> capturedInput = new AtomicReference<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(new ConcurrentHashMap<>()),
                () -> Map.of("dataSources", List.of("当前运营上下文")),
                input -> {
                    capturedInput.set(input);
                    return new OperationsCopilotModelResponse(
                            "已读取最新数据", List.of("当前运营上下文"), "llm", null);
                },
                token -> true,
                (operationId, proposal) -> Map.of(),
                new ObjectMapper()
        );

        service.ask(new OperationsCopilotQueryRequest("分析", null, null, null));

        assertThat(capturedInput.get().get("sessionId"))
                .isInstanceOf(String.class)
                .asString()
                .hasSize(36);
        assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
                "分析", "s".repeat(65), List.of(), null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @SuppressWarnings("unchecked")
    void redacts_sensitive_values_from_user_supplied_model_input() {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        AtomicReference<Map<String, Object>> capturedInput = new AtomicReference<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("当前运营上下文")),
                input -> {
                    capturedInput.set(input);
                    return new OperationsCopilotModelResponse(
                            "已读取最新数据", List.of("当前运营上下文"), "llm", null);
                },
                token -> true,
                (operationId, proposal) -> Map.of(),
                new ObjectMapper()
        );

        OperationsCopilotResponse response = service.ask(new OperationsCopilotQueryRequest(
                "分析 {\"apiKey\":\"json-secret\"} accessKey=access-secret",
                "apiKey=session-secret Authorization: Basic dXNlcjpwYXNz",
                List.of(new OperationsCopilotMessage("user", "password=history-secret")),
                new OperationsCopilotPageContext(
                        "/admin/decision",
                        "智能决策",
                        "decision",
                        "card-1",
                        "Authorization=page-secret",
                        null
                )
        ));

        assertThat(capturedInput.get().get("question").toString()).doesNotContain("json-secret");
        assertThat(capturedInput.get().get("question").toString()).doesNotContain("access-secret");
        assertThat(capturedInput.get().get("sessionId").toString()).doesNotContain("session-secret");
        assertThat(capturedInput.get().get("sessionId").toString()).doesNotContain("dXNlcjpwYXNz");
        List<OperationsCopilotMessage> history =
                (List<OperationsCopilotMessage>) capturedInput.get().get("history");
        assertThat(history.get(0).content()).doesNotContain("history-secret");
        OperationsCopilotPageContext pageContext =
                (OperationsCopilotPageContext) capturedInput.get().get("pageContext");
        assertThat(pageContext.objectLabel()).doesNotContain("page-secret");
        assertThat(response.sessionId()).doesNotContain("session-secret");
        assertThat(response.sessionId()).doesNotContain("dXNlcjpwYXNz");
        assertThat(stored.get(response.id()).getStructuredResponseJson())
                .doesNotContain("session-secret", "dXNlcjpwYXNz");
    }

    @Test
    @SuppressWarnings("unchecked")
    void clips_and_persists_structured_output_without_exposing_sensitive_context() {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        AtomicReference<Map<String, Object>> capturedInput = new AtomicReference<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of(
                        "contextUpdatedAt", "2026-07-16T13:00:00",
                        "dataSources", List.of("实时客流摘要", "购票与消费事件"),
                        "apiKey", "provider-secret",
                        "privateKey", "private-key-secret",
                        "api key", "spaced-key-secret",
                        "authorization ", "authorization-secret",
                        "nested", Map.of("password", "nested-secret", "safe", "保留")
                ),
                input -> {
                    capturedInput.set(input);
                    return new OperationsCopilotModelResponse(
                            "结论：先核实入口客流。",
                            List.of(
                                    "Authorization=top-secret",
                                    "证".repeat(161),
                                    "证据三", "证据四", "证据五", "证据六", "证据七"
                            ),
                            List.of(
                                    "动".repeat(201), "动作二", "动作三", "动作四",
                                    "动作五", "动作六", "动作七"
                            ),
                            List.of("险".repeat(201), "风险二", "风险三", "风险四", "风险五"),
                            List.of("实时客流摘要", "未经落地的来源"),
                            "llm",
                            "Authorization=fallback-secret " + "原".repeat(220),
                            new OperationsCopilotProposalDraft(
                                    "KB_CREATE",
                                    "补充入口知识",
                                    "需要管理员确认。",
                                    Map.of(
                                            "question", "入口是否开放",
                                            "answer", "请以现场公告为准",
                                            "apiKey", "proposal-secret"
                                    )
                            )
                    );
                },
                token -> true,
                (operationId, proposal) -> Map.of(),
                new ObjectMapper()
        );

        OperationsCopilotResponse response = service.ask(new OperationsCopilotQueryRequest(
                "分析入口",
                "session-1",
                List.of(new OperationsCopilotMessage("user", "今天先处理什么")),
                null
        ));

        assertThat(response.sessionId()).isEqualTo("session-1");
        assertThat(response.contextUpdatedAt()).isEqualTo("2026-07-16T13:00:00");
        assertThat(response.evidence()).hasSize(6).allMatch(item -> item.length() <= 160);
        assertThat(response.evidence()).noneMatch(item -> item.contains("top-secret"));
        assertThat(response.recommendedActions()).hasSize(6).allMatch(item -> item.length() <= 200);
        assertThat(response.risks()).hasSize(4).allMatch(item -> item.length() <= 200);
        assertThat(response.sources()).containsExactly("实时客流摘要");
        assertThat(response.fallbackReason()).hasSizeLessThanOrEqualTo(200);
        assertThat(response.fallbackReason()).doesNotContain("fallback-secret");
        assertThat(response.proposal().payload()).doesNotContainKey("apiKey");

        Map<String, Object> safeContext = (Map<String, Object>) capturedInput.get().get("context");
        assertThat(safeContext).doesNotContainKeys(
                "apiKey", "privateKey", "api key", "authorization ");
        assertThat((Map<String, Object>) safeContext.get("nested")).doesNotContainKey("password");
        assertThatThrownBy(() -> safeContext.put("tamper", true))
                .isInstanceOf(UnsupportedOperationException.class);

        OperationsCopilotResponse discarded = service.discard(response.id());
        assertThat(discarded.sessionId()).isEqualTo("session-1");
        assertThat(discarded.evidence()).isEqualTo(response.evidence());
        assertThat(discarded.recommendedActions()).isEqualTo(response.recommendedActions());
        assertThat(discarded.risks()).isEqualTo(response.risks());
        assertThat(discarded.contextUpdatedAt()).isEqualTo(response.contextUpdatedAt());
    }

    @Test
    void fallback_does_not_expose_generator_failure_details() {
        OperationsCopilotService service = new OperationsCopilotService(
                repository(new ConcurrentHashMap<>()),
                () -> Map.of("dataSources", List.of("当前运营上下文")),
                input -> {
                    throw new IllegalStateException("apiKey=provider-secret");
                },
                token -> true,
                (operationId, proposal) -> Map.of(),
                new ObjectMapper()
        );

        OperationsCopilotResponse response = service.ask(new OperationsCopilotQueryRequest("分析"));

        assertThat(response.generationSource()).isEqualTo("rules");
        assertThat(response.fallbackReason()).isNotBlank().doesNotContain("provider-secret");
        assertThat(response.evidence()).isEmpty();
        assertThat(response.recommendedActions()).isEmpty();
        assertThat(response.risks()).isEmpty();
    }

    @Test
    void persists_a_draft_but_executes_only_after_a_verified_fay_admin_session() {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        AtomicInteger executions = new AtomicInteger();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("实时客流摘要", "购票与消费事件")),
                context -> new OperationsCopilotModelResponse(
                        "建议先发布道路绕行提醒。",
                        List.of("入口客流已超过舒适阈值"),
                        List.of("先发布绕行提醒"),
                        List.of("现场状态仍需人工核实"),
                        List.of("实时客流摘要"),
                        "llm",
                        null,
                        new OperationsCopilotProposalDraft(
                                "EMERGENCY_DRAFT",
                                "入口道路绕行提醒",
                                "需要管理员确认后发布。",
                                validEmergencyPayload()
                        )
                ),
                "verified"::equals,
                (operationId, proposal) -> {
                    executions.incrementAndGet();
                    return Map.of("kind", "emergency", "id", "event-1", "status", "ACTIVE");
                },
                new ObjectMapper()
        );

        OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest("入口临时拥堵怎么办"));

        assertThat(draft.proposalStatus()).isEqualTo("DRAFT");
        assertThat(draft.proposal().type()).isEqualTo("EMERGENCY_DRAFT");
        assertThat(draft.proposalRevision()).isNotBlank();
        assertThat(executions).hasValue(0);
        assertThat(stored).containsKey(draft.id());

        assertThatThrownBy(() -> service.confirm(
                draft.id(), "not-verified", draft.proposalRevision()))
                .isInstanceOf(SecurityException.class);
        assertThat(executions).hasValue(0);

        OperationsCopilotResponse confirmed = service.confirm(
                draft.id(), "verified", draft.proposalRevision());

        assertThat(confirmed.proposalStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmed.executionResult()).containsEntry("status", "COMPLETED");
        assertThat(confirmed.executionResult().get("target"))
                .isEqualTo(Map.of("kind", "emergency", "id", "event-1", "status", "ACTIVE"));
        assertThat(confirmed.evidence()).isEqualTo(draft.evidence());
        assertThat(confirmed.recommendedActions()).isEqualTo(draft.recommendedActions());
        assertThat(confirmed.risks()).isEqualTo(draft.risks());
        assertThat(confirmed.contextUpdatedAt()).isEqualTo(draft.contextUpdatedAt());
        assertThat(executions).hasValue(1);
        assertThatThrownBy(() -> service.confirm(
                draft.id(), "verified", draft.proposalRevision()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void edits_only_a_draft_and_keeps_its_original_action_type() {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("知识库摘要")),
                context -> new OperationsCopilotModelResponse(
                        "建议补充开放时间。",
                        List.of("知识库摘要"),
                        "llm",
                        new OperationsCopilotProposalDraft(
                                "KB_CREATE",
                                "补充开放时间",
                                "需要管理员确认",
                                Map.of("question", "梵宫开放吗", "answer", "请以现场公告为准")
                        )
                ),
                "verified"::equals,
                (operationId, proposal) -> Map.of(),
                new ObjectMapper()
        );
        OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest("补充开放时间"));

        OperationsCopilotResponse updated = service.updateProposal(
                draft.id(),
                new OperationsCopilotProposalUpdateRequest(
                        "补充今日开放时间",
                        "已核对官方公告",
                        Map.of("question", "梵宫今天开放吗", "answer", "今日正常开放")
                )
        );

        assertThat(updated.proposal().type()).isEqualTo("KB_CREATE");
        assertThat(updated.proposal().title()).isEqualTo("补充今日开放时间");
        assertThat(updated.proposal().payload())
                .containsEntry("question", "梵宫今天开放吗")
                .containsEntry("answer", "今日正常开放");

        service.discard(draft.id());
        assertThatThrownBy(() -> service.updateProposal(
                draft.id(),
                new OperationsCopilotProposalUpdateRequest("再次修改", null, null)
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("待确认");
    }

    @Test
    void persists_a_structured_failed_stage_when_target_execution_throws() throws Exception {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("实时客流摘要")),
                context -> emergencyDraftResponse(),
                "verified"::equals,
                (operationId, proposal) -> {
                    throw new IllegalStateException("sensitive downstream detail");
                },
                new ObjectMapper()
        );
        OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest("发布入口提醒"));

        assertThatThrownBy(() -> service.confirm(
                draft.id(), "verified", draft.proposalRevision()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageNotContaining("sensitive downstream detail");

        OperationsCopilotRecord failed = stored.get(draft.id());
        assertThat(failed.getProposalStatus()).isEqualTo("FAILED");
        Map<?, ?> result = new ObjectMapper().readValue(failed.getExecutionResultJson(), Map.class);
        assertThat(result.get("status")).isEqualTo("FAILED");
        assertThat(result.get("failedStage")).isEqualTo("WRITE_TARGET");
        assertThat(result.toString()).doesNotContain("sensitive downstream detail");
    }

    @Test
    void persists_an_uncertain_result_instead_of_claiming_that_a_remote_write_failed() {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("知识库摘要")),
                context -> new OperationsCopilotModelResponse(
                        "建议补充开放时间。",
                        List.of("知识库摘要"),
                        "llm",
                        new OperationsCopilotProposalDraft(
                                "KB_CREATE",
                                "补充开放时间",
                                "需要管理员确认",
                                Map.of("question", "梵宫开放吗", "answer", "正常开放")
                        )
                ),
                "verified"::equals,
                (operationId, proposal) -> {
                    throw new OperationsCopilotUncertainOutcomeException(Map.of(
                            "kind", "knowledge",
                            "operationId", operationId
                    ));
                },
                new ObjectMapper()
        );
        OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest("补充开放时间"));

        OperationsCopilotResponse uncertain = service.confirm(
                draft.id(), "verified", draft.proposalRevision());

        assertThat(uncertain.proposalStatus()).isEqualTo("RECONCILING");
        assertThat(uncertain.executionResult()).containsEntry("status", "PARTIAL");
        assertThat(uncertain.executionResult()).containsEntry("outcomeStatus", "UNKNOWN");
        assertThat(uncertain.executionResult()).containsEntry("failedStage", "WRITE_TARGET");
        assertThat(uncertain.executionResult().get("target"))
                .isEqualTo(Map.of("kind", "knowledge", "operationId", draft.id()));
    }

    @Test
    void reports_partial_when_the_target_write_succeeds_but_dependency_sync_fails() {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        AtomicReference<String> operationId = new AtomicReference<>();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("实时客流摘要")),
                context -> emergencyDraftResponse(),
                "verified"::equals,
                (id, proposal) -> {
                    operationId.set(id);
                    return Map.of(
                            "kind", "emergency",
                            "id", "event-1",
                            "status", "ACTIVE",
                            "syncStatus", "FAILED"
                    );
                },
                new ObjectMapper()
        );
        OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest("发布入口提醒"));

        OperationsCopilotResponse confirmed = service.confirm(
                draft.id(), "verified", draft.proposalRevision());

        assertThat(operationId).hasValue(draft.id());
        assertThat(confirmed.proposalStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmed.executionResult()).containsEntry("status", "PARTIAL");
        assertThat(confirmed.executionResult()).containsEntry("failedStage", "SYNC_DEPENDENCIES");
    }

    @Test
    void rejects_confirmation_when_the_reviewed_draft_changes_during_admin_verification() {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        AtomicReference<OperationsCopilotService> serviceRef = new AtomicReference<>();
        AtomicInteger executions = new AtomicInteger();
        ObjectMapper json = new ObjectMapper();
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("知识库摘要")),
                context -> new OperationsCopilotModelResponse(
                        "建议补充开放时间。",
                        List.of("知识库摘要"),
                        "llm",
                        new OperationsCopilotProposalDraft(
                                "KB_CREATE",
                                "补充开放时间",
                                "需要管理员确认",
                                Map.of("question", "梵宫开放吗", "answer", "旧答案")
                        )
                ),
                token -> {
                    OperationsCopilotRecord record = stored.values().iterator().next();
                    serviceRef.get().updateProposal(
                            record.getId(),
                            new OperationsCopilotProposalUpdateRequest(
                                    null,
                                    null,
                                    Map.of(
                                            "question", "梵宫开放吗",
                                            "answer", "管理员确认期间保存的新答案"
                                    )
                            )
                    );
                    return true;
                },
                (operationId, proposal) -> {
                    executions.incrementAndGet();
                    return Map.of("kind", "knowledge", "id", "faq-1", "status", "active");
                },
                json
        );
        serviceRef.set(service);
        OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest("补充开放时间"));

        assertThatThrownBy(() -> service.confirm(
                draft.id(), "verified", draft.proposalRevision()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("草案已更新");

        assertThat(executions).hasValue(0);
        assertThat(stored.get(draft.id()).getProposalStatus()).isEqualTo("DRAFT");
        assertThat(stored.get(draft.id()).getProposalRevision())
                .isNotEqualTo(draft.proposalRevision());
    }

    @Test
    void concurrent_confirmation_executes_the_same_proposal_only_once() throws Exception {
        Map<String, OperationsCopilotRecord> stored = new ConcurrentHashMap<>();
        AtomicInteger executions = new AtomicInteger();
        CountDownLatch firstExecutionStarted = new CountDownLatch(1);
        CountDownLatch releaseExecution = new CountDownLatch(1);
        OperationsCopilotService service = new OperationsCopilotService(
                repository(stored),
                () -> Map.of("dataSources", List.of("实时客流摘要")),
                context -> new OperationsCopilotModelResponse(
                        "建议发布入口绕行提醒。",
                        List.of("实时客流摘要"),
                        "llm",
                        new OperationsCopilotProposalDraft(
                                "EMERGENCY_DRAFT",
                                "入口道路绕行提醒",
                                "需要管理员确认后发布。",
                                validEmergencyPayload()
                        )
                ),
                "verified"::equals,
                (operationId, proposal) -> {
                    executions.incrementAndGet();
                    firstExecutionStarted.countDown();
                    try {
                        if (!releaseExecution.await(2, TimeUnit.SECONDS)) {
                            throw new IllegalStateException("test execution timed out");
                        }
                    } catch (InterruptedException error) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("test execution interrupted");
                    }
                    return Map.of("kind", "emergency", "id", "event-1", "status", "ACTIVE");
                },
                new ObjectMapper()
        );
        OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest("入口临时拥堵怎么办"));
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<OperationsCopilotResponse> first = null;
        Future<OperationsCopilotResponse> second = null;
        try {
            first = pool.submit(() -> service.confirm(
                    draft.id(), "verified", draft.proposalRevision()));
            assertThat(firstExecutionStarted.await(1, TimeUnit.SECONDS)).isTrue();
            second = pool.submit(() -> service.confirm(
                    draft.id(), "verified", draft.proposalRevision()));

            Future<OperationsCopilotResponse> concurrentAttempt = second;
            assertThatThrownBy(() -> concurrentAttempt.get(600, TimeUnit.MILLISECONDS))
                    .isInstanceOf(ExecutionException.class)
                    .hasCauseInstanceOf(IllegalStateException.class);
            assertThat(executions).hasValue(1);
        } finally {
            releaseExecution.countDown();
            if (first != null) first.get(2, TimeUnit.SECONDS);
            if (second != null) {
                try {
                    second.get(2, TimeUnit.SECONDS);
                } catch (ExecutionException ignored) {
                    // The rejected concurrent confirmation is the expected result.
                }
            }
            pool.shutdownNow();
        }
    }

    @SuppressWarnings("unchecked")
    private OperationsCopilotRecordRepository repository(Map<String, OperationsCopilotRecord> records) {
        return (OperationsCopilotRecordRepository) Proxy.newProxyInstance(
                OperationsCopilotRecordRepository.class.getClassLoader(),
                new Class<?>[]{OperationsCopilotRecordRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        OperationsCopilotRecord record = (OperationsCopilotRecord) args[0];
                        records.put(record.getId(), record);
                        yield record;
                    }
                    case "findById" -> Optional.ofNullable(records.get(args[0]));
                    case "claimDraftForExecution" -> {
                        AtomicInteger claimed = new AtomicInteger();
                        records.computeIfPresent((String) args[0], (id, record) -> {
                            if ("DRAFT".equals(record.getProposalStatus())
                                    && args[1].equals(record.getProposalRevision())) {
                                record.setProposalStatus("EXECUTING");
                                claimed.set(1);
                            }
                            return record;
                        });
                        yield claimed.get();
                    }
                    case "discardDraft" -> {
                        AtomicInteger discarded = new AtomicInteger();
                        records.computeIfPresent((String) args[0], (id, record) -> {
                            if ("DRAFT".equals(record.getProposalStatus())) {
                                record.setProposalStatus("DISCARDED");
                                discarded.set(1);
                            }
                            return record;
                        });
                        yield discarded.get();
                    }
                    case "updateDraftProposal" -> {
                        AtomicInteger updated = new AtomicInteger();
                        records.computeIfPresent((String) args[0], (id, record) -> {
                            if ("DRAFT".equals(record.getProposalStatus())) {
                                record.setProposalTitle((String) args[1]);
                                record.setProposalSummary((String) args[2]);
                                record.setProposalPayloadJson((String) args[3]);
                                record.setProposalRevision((String) args[4]);
                                updated.set(1);
                            }
                            return record;
                        });
                        yield updated.get();
                    }
                    case "toString" -> "OperationsCopilotRecordRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private OperationsCopilotService serviceForInputValidation(AtomicInteger generations) {
        return new OperationsCopilotService(
                repository(new ConcurrentHashMap<>()),
                () -> Map.of("dataSources", List.of("当前运营上下文")),
                input -> {
                    generations.incrementAndGet();
                    return new OperationsCopilotModelResponse(
                            "已读取最新数据", List.of("当前运营上下文"), "llm", null);
                },
                token -> true,
                (operationId, proposal) -> Map.of(),
                new ObjectMapper()
        );
    }

    private OperationsCopilotModelResponse emergencyDraftResponse() {
        return new OperationsCopilotModelResponse(
                "建议发布入口绕行提醒。",
                List.of("实时客流摘要"),
                "llm",
                new OperationsCopilotProposalDraft(
                        "EMERGENCY_DRAFT",
                        "入口道路绕行提醒",
                        "需要管理员确认后发布。",
                        validEmergencyPayload()
                )
        );
    }

    private Map<String, Object> validEmergencyPayload() {
        return Map.of(
                "type", "ROAD_CLOSURE",
                "title", "入口道路封闭",
                "message", "请从东门绕行",
                "severity", "WARNING",
                "routePolicy", "EXCLUDE"
        );
    }
}
