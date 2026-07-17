package com.lingshan.analytics.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.DecisionSnapshot;
import com.lingshan.analytics.repository.DecisionCardRecordRepository;
import com.lingshan.analytics.repository.DecisionSnapshotRepository;
import com.lingshan.analytics.service.DecisionHistoryService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.assertThat;

class DecisionHistoryControllerTest {

    @Test
    void exposesHistoryDetailAndComparisonUnderDashboardController() {
        DecisionSnapshot snapshot = snapshot("snapshot-1");
        DecisionHistoryService history = new DecisionHistoryService(
                snapshots(snapshot), emptyCards(), new ObjectMapper()
        );
        DashboardController controller = new DashboardController(null, null, null, history);

        assertThat(controller.decisionHistory(0, 20).items()).extracting("id").containsExactly("snapshot-1");
        assertThat(controller.decisionDetail("snapshot-1").id()).isEqualTo("snapshot-1");
        assertThat(controller.compareDecisions("snapshot-1", "snapshot-1").added()).isEmpty();
        assertThat(controller.decisionNotFound(new NoSuchElementException("未找到决策快照")).getStatusCode().value())
                .isEqualTo(404);
    }

    private DecisionSnapshot snapshot(String id) {
        DecisionSnapshot snapshot = new DecisionSnapshot();
        snapshot.setId(id);
        snapshot.setSummary("运营摘要");
        snapshot.setGenerationSource("rules");
        snapshot.setGeneratedAt(LocalDateTime.of(2026, 7, 13, 12, 0));
        snapshot.setInputSummaryJson("{}");
        snapshot.setDataSourcesJson("[]");
        return snapshot;
    }

    private DecisionSnapshotRepository snapshots(DecisionSnapshot snapshot) {
        return (DecisionSnapshotRepository) Proxy.newProxyInstance(
                DecisionSnapshotRepository.class.getClassLoader(), new Class<?>[]{DecisionSnapshotRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findAll" -> {
                        Pageable pageable = (Pageable) args[0];
                        yield new PageImpl<>(List.of(snapshot), pageable, 1);
                    }
                    case "findById" -> Optional.of(snapshot);
                    case "toString" -> "HistorySnapshotRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private DecisionCardRecordRepository emptyCards() {
        return (DecisionCardRecordRepository) Proxy.newProxyInstance(
                DecisionCardRecordRepository.class.getClassLoader(), new Class<?>[]{DecisionCardRecordRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findBySnapshotIdOrderByIdAsc" -> List.of();
                    case "toString" -> "EmptyDecisionCardRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
