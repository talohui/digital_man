package com.lingshan.analytics.service;

import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DashboardServiceTest {

    @Test
    void aggregatesDashboardSignalsWithoutTouchingQaFlow() {
        List<AnalyticsEvent> events = new ArrayList<>();
        events.add(event("user_message", "s1", "u1", null, null, null, "positive", "{\"content_text\":\"梵宫主要看什么\"}"));
        events.add(event("user_message", "s1", "u1", null, null, null, "negative", "{\"content_text\":\"回复有点慢\"}"));
        events.add(event("ai_reply", "s1", "u1", null, 1200.0, null, null, "{}"));
        events.add(event("ai_reply", "s1", "u1", null, 4200.0, null, null, "{}"));
        events.add(event("route_click", "s1", "u1", "historical_culture", null, null, null, "{}"));
        events.add(event("spot_enter", "s1", "u1", "fan_gong", null, null, null, "{}"));
        events.add(event("spot_leave", "s1", "u1", "fan_gong", null, null, null, "{\"dwell_ms\":90000}"));
        events.add(event("rate_route", "s1", "u1", "historical_culture", null, 5.0, null, "{}"));
        events.add(event("rate_spot", "s1", "u1", "fan_gong", null, 1.0, null, "{}"));
        events.add(event("preference_update", "s1", "u1", null, null, null, null, "{\"selectedTags\":[\"文化探秘\",\"祈福静心\"]}"));
        events.add(event("recommend_exposure", "s1", "u1", "historical_culture", null, null, null, "{\"route_id\":\"historical_culture\",\"engine\":\"local-score-v1\",\"rank\":1}"));
        events.add(event("recommend_exposure", "s1", "u1", "family", null, null, null, "{\"route_id\":\"family\",\"engine\":\"local-score-v1\",\"rank\":2}"));
        events.add(event("recommend_click", "s1", "u1", "historical_culture", null, null, null, "{\"route_id\":\"historical_culture\",\"engine\":\"local-score-v1\",\"rank\":1}"));
        events.add(event("ticket_purchase", "s1", "u1", null, null, null, null, "{\"ticket_id\":\"ticket-1\",\"age_band\":\"25-34\",\"gender\":\"女\",\"group_size\":3,\"visit_date\":\"2026-05-28\",\"ticket_type\":\"family\",\"ticket_cost\":398}"));
        events.add(event("purchase", "s1", "u1", "fan_gong", null, null, null, "{\"ticket_id\":\"ticket-1\",\"category\":\"food\",\"amount\":58,\"route_id\":\"historical_culture\",\"spot_id\":\"fan_gong\"}"));
        events.add(event("purchase", "s1", "u1", "fan_gong", null, null, null, "{\"ticket_id\":\"ticket-1\",\"category\":\"shopping\",\"amount\":128,\"route_id\":\"historical_culture\",\"spot_id\":\"fan_gong\"}"));

        DashboardService service = new DashboardService(repository(events));

        Map<String, Object> overview = service.overview();
        assertThat(overview.get("totalMessages")).isEqualTo(2L);
        assertThat(overview.get("feedbackCount")).isEqualTo(2L);
        assertThat((Double) overview.get("p90LatencyMs")).isEqualTo(4200.0);

        Map<String, Object> chat = service.chatInsights();
        assertThat((Long) chat.get("negativeQuestionCount")).isEqualTo(1L);
        assertThat(chat.get("spotMentionStats").toString()).contains("梵宫");

        Map<String, Object> behavior = service.behavior();
        assertThat(behavior.get("routeClicks").toString()).contains("历史文化路线");
        assertThat(behavior.get("spotDwellAvg").toString()).contains("90.0");

        Map<String, Object> persona = service.persona();
        assertThat(persona.get("selectedTagDistribution").toString()).contains("文化探秘", "祈福静心");

        Map<String, Object> recommendation = service.recommendation();
        assertThat(recommendation.get("exposureCount")).isEqualTo(2L);
        assertThat(recommendation.get("clickCount")).isEqualTo(1L);
        assertThat(recommendation.get("ctr")).isEqualTo(0.5);
        assertThat(recommendation.get("engineDistribution").toString()).contains("local-score-v1");
        assertThat(recommendation.get("topRoutes").toString()).contains("历史文化路线");

        Map<String, Object> ticketing = service.ticketing();
        assertThat(ticketing.get("ticketCount")).isEqualTo(1L);
        assertThat(ticketing.get("expectedVisitors")).isEqualTo(3.0);
        assertThat(ticketing.get("ticketRevenue")).isEqualTo(398.0);
        assertThat(ticketing.get("ageBands").toString()).contains("25-34");
        assertThat(ticketing.get("ticketTypes").toString()).contains("亲子套票");

        Map<String, Object> consumption = service.consumption();
        assertThat(consumption.get("purchaseCount")).isEqualTo(2L);
        assertThat(consumption.get("totalAmount")).isEqualTo(186.0);
        assertThat(consumption.get("avgPerTicket")).isEqualTo(186.0);
        assertThat(consumption.get("costMix").toString()).contains("餐饮", "文创");
    }

    private EventRepository repository(List<AnalyticsEvent> events) {
        return (EventRepository) Proxy.newProxyInstance(
                EventRepository.class.getClassLoader(),
                new Class<?>[]{EventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByTsAfter" -> events.stream()
                            .filter(e -> e.getTs().isAfter((LocalDateTime) args[0]))
                            .toList();
                    case "findByTsAfterOrderByTsDesc" -> events.stream()
                            .filter(e -> e.getTs().isAfter((LocalDateTime) args[0]))
                            .sorted(Comparator.comparing(AnalyticsEvent::getTs).reversed())
                            .toList();
                    case "toString" -> "InMemoryEventRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private AnalyticsEvent event(String name, String session, String user, String target, Double latency, Double rating, String sentiment, String props) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEvent(name);
        event.setSessionId(session);
        event.setUserId(user);
        event.setTargetId(target);
        event.setLatencyMs(latency);
        event.setRatingValue(rating);
        event.setSentiment(sentiment);
        event.setProperties(props);
        event.setTs(LocalDateTime.now().minusMinutes(2));
        return event;
    }
}
