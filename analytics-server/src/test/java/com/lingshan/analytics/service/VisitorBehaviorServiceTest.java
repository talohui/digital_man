package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.entity.VisitorBehaviorRecord;
import com.lingshan.analytics.repository.EventRepository;
import com.lingshan.analytics.repository.VisitorBehaviorRecordRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class VisitorBehaviorServiceTest {

    @Test
    void seedHistoryImportsLingshanSampleOnlyOnce() {
        TestHarness h = new TestHarness(new ArrayList<>(), List.of());

        h.service.seedHistoryIfEmpty();
        h.service.seedHistoryIfEmpty();

        assertThat(h.records).hasSize(522);
        assertThat(h.records).allMatch(record -> VisitorBehaviorService.HISTORY_SOURCE.equals(record.getSource()));
        assertThat(h.records.toString()).doesNotContain("tourist_id", "user_nickname", "attraction_content");
    }

    @Test
    void historyDashboardAggregatesLingshanRecords() {
        TestHarness h = new TestHarness(List.of(
                record("history-1", "灵山胜境", "35-44", "女", 3, 3.2, 3213.24, 60.0),
                record("history-2", "灵山大佛", "25-34", "男", 1, 3.6, 941.58, 40.0)
        ), List.of());

        Map<String, Object> dashboard = h.service.dashboard("history");

        assertThat(dashboard.get("mode")).isEqualTo("history");
        assertThat(dashboard.get("sampleCount")).isEqualTo(2);
        assertThat(dashboard.get("timeRangeLabel").toString()).contains("2025年灵山相关样本");
        assertThat(dashboard.get("summary").toString()).contains("avgSpend");
        assertThat(dashboard.get("attractions").toString()).contains("灵山胜境", "灵山大佛");
    }

    @Test
    void realtimeTicketPurchaseAndPurchaseUpdateVisitorRecord() {
        TestHarness h = new TestHarness(new ArrayList<>(), List.of());
        LocalDateTime now = LocalDateTime.now();

        h.service.recordTicketPurchase(Map.of(
                "ticket_id", "ticket-1",
                "age_band", "25-34",
                "gender", "女",
                "group_size", 3,
                "visit_date", "2026-05-28",
                "ticket_cost", 398
        ), now, "user-1");
        h.service.recordPurchase(Map.of(
                "ticket_id", "ticket-1",
                "category", "food",
                "amount", 58,
                "spot_id", "fan_gong"
        ), now.plusMinutes(1));

        assertThat(h.records).hasSize(1);
        VisitorBehaviorRecord record = h.records.get(0);
        assertThat(record.getSource()).isEqualTo(VisitorBehaviorService.REALTIME_SOURCE);
        assertThat(record.getFoodCost()).isEqualTo(58.0);
        assertThat(record.getTotalCost()).isEqualTo(456.0);
        assertThat(record.getAttractionName()).isEqualTo("梵宫");

        Map<String, Object> dashboard = h.service.dashboard("realtime");
        assertThat(dashboard.get("sampleCount")).isEqualTo(1);
        assertThat(dashboard.get("summary").toString()).contains("expectedVisitors=3.0");
        assertThat(dashboard.get("consumption").toString()).contains("餐饮", "456.0");
    }

    private static VisitorBehaviorRecord record(String visitorId, String attraction, String ageBand, String gender, int groupSize, double stayHours, double totalCost, double satisfaction) {
        VisitorBehaviorRecord record = new VisitorBehaviorRecord();
        record.setSource(VisitorBehaviorService.HISTORY_SOURCE);
        record.setVisitorId(visitorId);
        record.setTicketId(visitorId + "-ticket");
        record.setAttractionName(attraction);
        record.setAttractionType("风景名胜与休闲度假");
        record.setAgeBand(ageBand);
        record.setGender(gender);
        record.setVisitDate(LocalDate.of(2025, 8, 13));
        record.setStayHours(stayHours);
        record.setTicketCost(210.0);
        record.setFoodCost(50.0);
        record.setShoppingCost(60.0);
        record.setTransportCost(40.0);
        record.setEntertainmentCost(30.0);
        record.setTotalCost(totalCost);
        record.setGroupSize(groupSize);
        record.setSatisfaction(satisfaction);
        record.setCreatedAt(LocalDateTime.now().minusDays(1));
        record.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return record;
    }

    private static class TestHarness {
        final List<VisitorBehaviorRecord> records;
        final List<AnalyticsEvent> events;
        final VisitorBehaviorService service;

        TestHarness(List<VisitorBehaviorRecord> records, List<AnalyticsEvent> events) {
            this.records = new ArrayList<>(records);
            this.events = events;
            this.service = new VisitorBehaviorService(visitorRepo(), eventRepo(), new ObjectMapper());
        }

        private VisitorBehaviorRecordRepository visitorRepo() {
            return (VisitorBehaviorRecordRepository) Proxy.newProxyInstance(
                    VisitorBehaviorRecordRepository.class.getClassLoader(),
                    new Class<?>[]{VisitorBehaviorRecordRepository.class},
                    (proxy, method, args) -> switch (method.getName()) {
                        case "countBySource" -> records.stream().filter(r -> Objects.equals(r.getSource(), args[0])).count();
                        case "findBySource" -> records.stream().filter(r -> Objects.equals(r.getSource(), args[0])).toList();
                        case "findBySourceAndCreatedAtAfter" -> records.stream()
                                .filter(r -> Objects.equals(r.getSource(), args[0]))
                                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter((LocalDateTime) args[1]))
                                .toList();
                        case "findFirstBySourceAndTicketIdOrderByUpdatedAtDesc" -> records.stream()
                                .filter(r -> Objects.equals(r.getSource(), args[0]))
                                .filter(r -> Objects.equals(r.getTicketId(), args[1]))
                                .max(Comparator.comparing(VisitorBehaviorRecord::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
                        case "save" -> {
                            VisitorBehaviorRecord record = (VisitorBehaviorRecord) args[0];
                            records.removeIf(existing -> Objects.equals(existing.getTicketId(), record.getTicketId()) && Objects.equals(existing.getSource(), record.getSource()));
                            records.add(record);
                            yield record;
                        }
                        case "saveAll" -> {
                            @SuppressWarnings("unchecked")
                            Iterable<VisitorBehaviorRecord> incoming = (Iterable<VisitorBehaviorRecord>) args[0];
                            incoming.forEach(records::add);
                            yield incoming;
                        }
                        case "toString" -> "InMemoryVisitorBehaviorRecordRepository";
                        default -> throw new UnsupportedOperationException(method.getName());
                    }
            );
        }

        private EventRepository eventRepo() {
            return (EventRepository) Proxy.newProxyInstance(
                    EventRepository.class.getClassLoader(),
                    new Class<?>[]{EventRepository.class},
                    (proxy, method, args) -> switch (method.getName()) {
                        case "findByTsAfter" -> events.stream()
                                .filter(e -> e.getTs().isAfter((LocalDateTime) args[0]))
                                .toList();
                        case "toString" -> "InMemoryEventRepository";
                        default -> throw new UnsupportedOperationException(method.getName());
                    }
            );
        }
    }
}
