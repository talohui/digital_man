package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClientException;

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
        MarketingDecisionGenerator client = failingClient();
        MarketingDecisionService service = new MarketingDecisionService(
                repository(events), new MarketingDecisionEngine(), new ObjectMapper(), client
        );

        DecisionResponse response = service.getDecisionCards();

        assertThat(response.demoFallback()).isFalse();
        assertThat(response.cards()).extracting(DecisionCard::type).contains("客流分流", "客群营销", "消费转化");
        assertThat(response.dataSources()).contains("实时景点访问热区", "购票与消费事件", "游客画像与偏好标签");
        assertThat(response.generationSource()).isEqualTo("rules");
    }

    @Test
    void usesLlmResponseAndCachesItForFiveMinutes() {
        StubGenerator client = StubGenerator.returning(modelResponse());
        MarketingDecisionService service = new MarketingDecisionService(
                repository(realSignalEvents()), new MarketingDecisionEngine(), new ObjectMapper(), client
        );

        DecisionResponse first = service.getDecisionCards(false);
        DecisionResponse second = service.getDecisionCards(false);

        assertThat(first.generationSource()).isEqualTo("llm");
        assertThat(first.cacheHit()).isFalse();
        assertThat(first.generatedAt()).isNotBlank();
        assertThat(second.cacheHit()).isTrue();
        assertThat(client.calls).isEqualTo(1);
    }

    @Test
    void forceRefreshBypassesCache() {
        StubGenerator client = StubGenerator.returning(modelResponse());
        MarketingDecisionService service = new MarketingDecisionService(
                repository(realSignalEvents()), new MarketingDecisionEngine(), new ObjectMapper(), client
        );

        service.getDecisionCards(false);
        service.getDecisionCards(true);

        assertThat(client.calls).isEqualTo(2);
    }

    @Test
    void fallsBackToRulesWhenFayFailsWithoutExposingProviderDetails() {
        StubGenerator client = StubGenerator.failing(new RestClientException("provider-secret-detail"));
        MarketingDecisionService service = new MarketingDecisionService(
                repository(realSignalEvents()), new MarketingDecisionEngine(), new ObjectMapper(), client
        );

        DecisionResponse response = service.getDecisionCards(false);

        assertThat(response.generationSource()).isEqualTo("rules");
        assertThat(response.cards()).isNotEmpty();
        assertThat(response.fallbackReason()).isEqualTo("模型服务暂不可用，已使用规则分析");
        assertThat(response.fallbackReason()).doesNotContain("provider-secret-detail");
    }

    @Test
    void rejectsInvalidModelDecisionAndFallsBackToRules() {
        DecisionResponse invalid = new DecisionResponse(
                "模型摘要", List.of(), List.of(), List.of(), false
        );
        StubGenerator client = StubGenerator.returning(invalid);
        MarketingDecisionService service = new MarketingDecisionService(
                repository(realSignalEvents()), new MarketingDecisionEngine(), new ObjectMapper(), client
        );

        DecisionResponse response = service.getDecisionCards(false);

        assertThat(response.generationSource()).isEqualTo("rules");
        assertThat(response.fallbackReason()).isEqualTo("模型结果格式不合格，已使用规则分析");
    }

    private List<AnalyticsEvent> realSignalEvents() {
        AnalyticsEvent message = event("user_message", null, "{\"content_text\":\"灵山大佛怎么祈福\"}");
        message.setSentiment("positive");
        return List.of(message, event("spot_enter", "giant_buddha", "{}"));
    }

    private DecisionResponse modelResponse() {
        List<DecisionCard> cards = List.of(
                decisionCard("祈福路线承接"),
                decisionCard("祈福内容承接"),
                decisionCard("祈福现场承接")
        );
        return new DecisionResponse(
                "模型摘要", cards, List.of("推送祈福路线"), List.of("热门问题 TopN"), false
        );
    }

    private DecisionCard decisionCard(String title) {
        return new DecisionCard(
                title, "营销机会", "中", List.of("祈福文化问题 1 条"),
                "游客兴趣集中", List.of("推送祈福路线"),
                List.of("祈福文化"), List.of("灵山大佛"), false
        );
    }

    private MarketingDecisionGenerator failingClient() {
        return StubGenerator.failing(new RestClientException("unavailable"));
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

    private static class StubGenerator implements MarketingDecisionGenerator {
        private final DecisionResponse response;
        private final RuntimeException error;
        private int calls;

        private StubGenerator(DecisionResponse response, RuntimeException error) {
            this.response = response;
            this.error = error;
        }

        static StubGenerator returning(DecisionResponse response) {
            return new StubGenerator(response, null);
        }

        static StubGenerator failing(RuntimeException error) {
            return new StubGenerator(null, error);
        }

        @Override
        public DecisionResponse generate(DecisionInput input) {
            calls++;
            if (error != null) throw error;
            return response;
        }
    }
}
