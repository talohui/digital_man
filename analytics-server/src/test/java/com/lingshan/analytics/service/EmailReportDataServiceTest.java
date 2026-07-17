package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EmailReportDataServiceTest {
    @Test
    void uses_completed_daily_and_weekly_windows_without_raw_visitor_content() {
        EmailReportDataService service = new EmailReportDataService(repository(), new ObjectMapper());

        EmailReportInput daily = service.daily(LocalDate.of(2026, 7, 14));
        EmailReportInput weekly = service.weekly(LocalDate.of(2026, 7, 14));

        assertThat(daily.periodKey()).isEqualTo("D-2026-07-13");
        assertThat(daily.periodStart()).isEqualTo(LocalDateTime.of(2026, 7, 13, 0, 0));
        assertThat(daily.periodEnd()).isEqualTo(LocalDateTime.of(2026, 7, 14, 0, 0));
        assertThat(weekly.periodKey()).isEqualTo("W-2026-07-06");
        assertThat(weekly.periodStart()).isEqualTo(LocalDateTime.of(2026, 7, 6, 0, 0));
        assertThat(weekly.periodEnd()).isEqualTo(LocalDateTime.of(2026, 7, 13, 0, 0));
        assertThat(daily.metrics()).containsEntry("ticketPurchaseCount", 1L)
                .containsEntry("purchaseCount", 1L)
                .doesNotContainKey("rawVisitorMessages");
        assertThat(daily.dataSources()).contains("门票与消费事件", "游客问答与情绪汇总");
    }

    @SuppressWarnings("unchecked")
    private EventRepository repository() {
        List<AnalyticsEvent> events = List.of(
                event("ticket_purchase", "{\"ticket_cost\":180}", LocalDateTime.of(2026, 7, 13, 9, 0)),
                event("purchase", "{\"amount\":80,\"category\":\"food\"}", LocalDateTime.of(2026, 7, 13, 10, 0)),
                event("user_message", "{\"content_text\":\"this must never leave the server\"}", LocalDateTime.of(2026, 7, 13, 11, 0))
        );
        return (EventRepository) Proxy.newProxyInstance(
                EventRepository.class.getClassLoader(),
                new Class<?>[]{EventRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findByTsBetween")) {
                        LocalDateTime from = (LocalDateTime) args[0];
                        LocalDateTime to = (LocalDateTime) args[1];
                        return events.stream().filter(event -> !event.getTs().isBefore(from) && !event.getTs().isAfter(to)).toList();
                    }
                    if (method.getName().equals("toString")) return "EventRepository";
                    throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private AnalyticsEvent event(String name, String properties, LocalDateTime ts) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEvent(name);
        event.setProperties(properties);
        event.setTs(ts);
        return event;
    }
}
