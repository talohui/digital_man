package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MarketingDecisionServiceTest {

    @Test
    void aggregatesHeatmapTicketConsumptionAndPreferenceEvents() {
        List<AnalyticsEvent> events = List.of(
                event("spot_enter", "giant_buddha", "{}"),
                event("spot_enter", "giant_buddha", "{}"),
                event("spot_enter", "giant_buddha", "{}"),
                event("ticket_purchase", null, "{\"ticket_cost\":398,\"ticket_type\":\"family\"}"),
                event("purchase", null, "{\"category\":\"shopping\",\"amount\":128}"),
                event("preference_update", null, "{\"selectedTags\":[\"亲子游\",\"祈福静心\"]}")
        );
        MarketingDecisionService service = new MarketingDecisionService(repository(events), new MarketingDecisionEngine(), new ObjectMapper());

        DecisionResponse response = service.getDecisionCards();

        assertThat(response.demoFallback()).isFalse();
        assertThat(response.cards()).extracting(DecisionCard::type).contains("客流分流", "客群营销", "消费转化");
        assertThat(response.dataSources()).contains("实时景点访问热区", "购票与消费事件", "游客画像与偏好标签");
    }

    private EventRepository repository(List<AnalyticsEvent> events) {
        return (EventRepository) Proxy.newProxyInstance(EventRepository.class.getClassLoader(), new Class<?>[]{EventRepository.class}, (proxy, method, args) -> switch (method.getName()) {
            case "findByTsAfter" -> events;
            case "toString" -> "InMemoryEventRepository";
            default -> throw new UnsupportedOperationException(method.getName());
        });
    }

    private AnalyticsEvent event(String name, String targetId, String props) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEvent(name);
        event.setTargetId(targetId);
        event.setProperties(props);
        event.setTs(LocalDateTime.now().minusMinutes(1));
        return event;
    }
}
