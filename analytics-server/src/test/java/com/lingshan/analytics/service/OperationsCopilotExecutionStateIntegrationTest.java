package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.OperationsCopilotRecord;
import com.lingshan.analytics.repository.OperationsCopilotRecordRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({
        OperationsCopilotExecutionStateService.class,
        OperationsCopilotExecutionStateIntegrationTest.TestConfig.class
})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class OperationsCopilotExecutionStateIntegrationTest {
    @Autowired
    private OperationsCopilotRecordRepository records;

    @Autowired
    private OperationsCopilotExecutionStateService executionState;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void claim_blocks_discard_and_fail_persists_structured_result() throws Exception {
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();

        OperationsCopilotRecord draft = saveDraft();
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();

        OperationsCopilotRecord claimed = executionState.claim(draft.getId(), draft.getProposalRevision());
        assertThat(claimed.getProposalStatus()).isEqualTo("EXECUTING");
        assertThat(records.findById(draft.getId())).get()
                .extracting(OperationsCopilotRecord::getProposalStatus)
                .isEqualTo("EXECUTING");

        assertThatThrownBy(() -> executionState.discard(draft.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("不能忽略");

        Map<String, Object> result = Map.of(
                "status", "FAILED",
                "failedStage", "WRITE_TARGET",
                "stages", List.of(Map.of("stage", "WRITE_TARGET", "status", "FAILED"))
        );
        executionState.fail(draft.getId(), result);

        OperationsCopilotRecord failed = records.findById(draft.getId()).orElseThrow();
        assertThat(failed.getProposalStatus()).isEqualTo("FAILED");
        JsonNode persistedResult = objectMapper.readTree(failed.getExecutionResultJson());
        assertThat(persistedResult.path("status").asText()).isEqualTo("FAILED");
        assertThat(persistedResult.path("failedStage").asText()).isEqualTo("WRITE_TARGET");
        assertThat(persistedResult.path("stages").path(0).path("stage").asText())
                .isEqualTo("WRITE_TARGET");
    }

    @Test
    void stale_revision_claim_is_rejected_and_leaves_draft_unchanged() {
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();

        OperationsCopilotRecord draft = saveDraft();

        assertThatThrownBy(() -> executionState.claim(draft.getId(), UUID.randomUUID().toString()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("草案已更新");

        OperationsCopilotRecord unchanged = records.findById(draft.getId()).orElseThrow();
        assertThat(unchanged.getProposalStatus()).isEqualTo("DRAFT");
        assertThat(unchanged.getProposalRevision()).isEqualTo(draft.getProposalRevision());
    }

    @Test
    void concurrent_claims_allow_only_one_real_transaction_to_enter_execution() throws Exception {
        OperationsCopilotRecord draft = saveDraft();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService callers = Executors.newFixedThreadPool(2);

        try {
            Future<Boolean> first = callers.submit(() -> attemptClaim(draft, ready, start));
            Future<Boolean> second = callers.submit(() -> attemptClaim(draft, ready, start));
            assertThat(ready.await(2, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            assertThat(List.of(first.get(3, TimeUnit.SECONDS), second.get(3, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
            assertThat(records.findById(draft.getId())).get()
                    .extracting(OperationsCopilotRecord::getProposalStatus)
                    .isEqualTo("EXECUTING");
        } finally {
            start.countDown();
            callers.shutdownNow();
        }
    }

    private boolean attemptClaim(
            OperationsCopilotRecord draft,
            CountDownLatch ready,
            CountDownLatch start
    ) throws Exception {
        ready.countDown();
        if (!start.await(2, TimeUnit.SECONDS)) {
            throw new IllegalStateException("并发测试未释放");
        }
        try {
            executionState.claim(draft.getId(), draft.getProposalRevision());
            return true;
        } catch (IllegalStateException expectedConflict) {
            return false;
        }
    }

    private OperationsCopilotRecord saveDraft() {
        LocalDateTime now = LocalDateTime.now();
        OperationsCopilotRecord record = new OperationsCopilotRecord();
        record.setId(UUID.randomUUID().toString());
        record.setQuestion("请发布景区拥堵提醒");
        record.setAnswer("已生成待确认草案");
        record.setSourcesJson("[]");
        record.setStructuredResponseJson("{}");
        record.setGenerationSource("rules");
        record.setProposalType("EMERGENCY_DRAFT");
        record.setProposalTitle("景区拥堵提醒");
        record.setProposalSummary("请游客错峰游览");
        record.setProposalPayloadJson("{\"type\":\"CROWDING\",\"title\":\"景区拥堵提醒\"}");
        record.setProposalStatus("DRAFT");
        record.setProposalRevision(UUID.randomUUID().toString());
        record.setCreatedAt(now);
        record.setUpdatedAt(now);
        return records.saveAndFlush(record);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestConfig {
        @Bean
        @Primary
        ObjectMapper objectMapper() {
            return new ObjectMapper().findAndRegisterModules();
        }
    }
}
