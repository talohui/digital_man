package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.entity.DecisionCardRecord;
import com.lingshan.analytics.entity.DecisionSnapshot;
import com.lingshan.analytics.repository.DecisionCardRecordRepository;
import com.lingshan.analytics.repository.DecisionSnapshotRepository;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class DecisionHistoryServiceTest {

    @Test
    void persistsSnapshotAndCardsWithStableKeys() {
        AtomicReference<DecisionSnapshot> savedSnapshot = new AtomicReference<>();
        AtomicReference<List<DecisionCardRecord>> savedCards = new AtomicReference<>(List.of());
        DecisionSnapshotRepository snapshots = snapshotRepository(savedSnapshot);
        DecisionCardRecordRepository cards = cardRepository(savedCards);
        DecisionHistoryService service = new DecisionHistoryService(snapshots, cards, new ObjectMapper());
        LocalDateTime windowStart = LocalDateTime.of(2026, 7, 12, 12, 0);
        LocalDateTime windowEnd = LocalDateTime.of(2026, 7, 13, 12, 0);

        String snapshotId = service.save(response(), input(), windowStart, windowEnd);

        assertThat(snapshotId).isNotBlank();
        assertThat(savedSnapshot.get().getId()).isEqualTo(snapshotId);
        assertThat(savedSnapshot.get().getInputWindowStart()).isEqualTo(windowStart);
        assertThat(savedSnapshot.get().getInputWindowEnd()).isEqualTo(windowEnd);
        assertThat(savedCards.get()).hasSize(1);
        assertThat(savedCards.get().get(0).getSnapshotId()).isEqualTo(snapshotId);
        assertThat(savedCards.get().get(0).getStableKey()).isEqualTo("营销机会:祈福路线承接:灵山大佛");
    }

    @Test
    void returnsSanitizedDetailAndComparesCardVersions() {
        Map<String, DecisionSnapshot> snapshots = Map.of(
                "newer", snapshot("newer", "新决策"),
                "older", snapshot("older", "旧决策")
        );
        Map<String, List<DecisionCardRecord>> cards = new LinkedHashMap<>();
        cards.put("older", List.of(
                card("older", "route", "祈福路线", "低", "[\"userId=guest-secret 的祈福咨询\"]"),
                card("older", "parking", "停车引导", "中", "[\"停车咨询\"]")
        ));
        cards.put("newer", List.of(
                card("newer", "route", "祈福路线", "高", "[\"祈福咨询数量明显上升并持续超过一百二十个字符，因此详情返回时必须进行截断以避免证据抽屉泄露过多原始内容。祈福咨询数量明显上升并持续超过一百二十个字符。\"]"),
                card("newer", "weather", "高温提醒", "高", "[\"极端天气预警\"]")
        ));
        DecisionHistoryService service = new DecisionHistoryService(
                readableSnapshotRepository(snapshots), readableCardRepository(cards), new ObjectMapper()
        );

        var detail = service.detail("older");
        var comparison = service.compare("newer", "older");

        assertThat(detail.cards().get(0).evidence().get(0)).doesNotContain("guest-secret");
        assertThat(detail.cards().get(0).cardId()).isEqualTo("older-route");
        assertThat(detail.cards().get(0).evidence().get(0).length()).isLessThanOrEqualTo(120);
        assertThat(comparison.added()).extracting(DecisionCard::title).containsExactly("高温提醒");
        assertThat(comparison.removed()).extracting(DecisionCard::title).containsExactly("停车引导");
        assertThat(comparison.priorityChanged()).singleElement().satisfies(change -> {
            assertThat(change.title()).isEqualTo("祈福路线");
            assertThat(change.oldPriority()).isEqualTo("低");
            assertThat(change.newPriority()).isEqualTo("高");
        });
    }

    private DecisionSnapshot snapshot(String id, String summary) {
        DecisionSnapshot snapshot = new DecisionSnapshot();
        snapshot.setId(id);
        snapshot.setSummary(summary);
        snapshot.setGenerationSource("rules");
        snapshot.setGeneratedAt(LocalDateTime.of(2026, 7, 13, 12, 0));
        snapshot.setInputWindowStart(LocalDateTime.of(2026, 7, 12, 12, 0));
        snapshot.setInputWindowEnd(LocalDateTime.of(2026, 7, 13, 12, 0));
        snapshot.setInputSummaryJson("{\"totalMessages\":8}");
        snapshot.setDataSourcesJson("[\"热门问题 TopN\"]");
        return snapshot;
    }

    private DecisionCardRecord card(String snapshotId, String key, String title, String priority, String evidenceJson) {
        DecisionCardRecord card = new DecisionCardRecord();
        card.setId(snapshotId + "-" + key);
        card.setSnapshotId(snapshotId);
        card.setStableKey(key);
        card.setTitle(title);
        card.setType("运营处置");
        card.setPriority(priority);
        card.setEvidenceJson(evidenceJson);
        card.setReason("数据变化");
        card.setActionsJson("[\"执行动作\"]");
        card.setRelatedTopicsJson("[]");
        card.setRelatedSpotsJson("[]");
        return card;
    }

    private DecisionSnapshotRepository readableSnapshotRepository(Map<String, DecisionSnapshot> items) {
        return (DecisionSnapshotRepository) Proxy.newProxyInstance(
                DecisionSnapshotRepository.class.getClassLoader(), new Class<?>[]{DecisionSnapshotRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(items.get((String) args[0]));
                    case "toString" -> "ReadableDecisionSnapshotRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private DecisionCardRecordRepository readableCardRepository(Map<String, List<DecisionCardRecord>> items) {
        return (DecisionCardRecordRepository) Proxy.newProxyInstance(
                DecisionCardRecordRepository.class.getClassLoader(), new Class<?>[]{DecisionCardRecordRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findBySnapshotIdOrderByIdAsc" -> items.getOrDefault((String) args[0], List.of());
                    case "toString" -> "ReadableDecisionCardRecordRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private DecisionSnapshotRepository snapshotRepository(AtomicReference<DecisionSnapshot> saved) {
        return (DecisionSnapshotRepository) Proxy.newProxyInstance(
                DecisionSnapshotRepository.class.getClassLoader(),
                new Class<?>[]{DecisionSnapshotRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> { saved.set((DecisionSnapshot) args[0]); yield args[0]; }
                    case "toString" -> "InMemoryDecisionSnapshotRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private DecisionCardRecordRepository cardRepository(AtomicReference<List<DecisionCardRecord>> saved) {
        return (DecisionCardRecordRepository) Proxy.newProxyInstance(
                DecisionCardRecordRepository.class.getClassLoader(),
                new Class<?>[]{DecisionCardRecordRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "saveAll" -> {
                        List<DecisionCardRecord> records = new ArrayList<>();
                        ((Iterable<?>) args[0]).forEach(item -> records.add((DecisionCardRecord) item));
                        saved.set(List.copyOf(records));
                        yield records;
                    }
                    case "toString" -> "InMemoryDecisionCardRecordRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private DecisionResponse response() {
        DecisionCard card = new DecisionCard(
                "祈福路线承接", "营销机会", "高", List.of("祈福咨询 8 条"),
                "游客兴趣集中", List.of("推送祈福路线"),
                List.of("祈福文化"), List.of("灵山大佛"), false
        );
        return new DecisionResponse(
                "今日祈福咨询升温", List.of(card), List.of("推送祈福路线"),
                List.of("热门问题 TopN"), false, "llm", "2026-07-13T12:00:00+08:00",
                false, null
        );
    }

    private DecisionInput input() {
        return new DecisionInput(
                8, 0.75, 920, 3,
                List.of(new TopicMetric("祈福文化", 8, 1, List.of("如何祈福"))),
                false, "灵山大佛", 2, List.of("祈福静心"), "文创", 128
        );
    }
}
