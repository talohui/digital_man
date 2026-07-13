package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MarketingDecisionEngineTest {

    @Test
    void generatesMarketingAndServiceCardsFromTopicSignals() {
        MarketingDecisionEngine engine = new MarketingDecisionEngine();
        DecisionResponse response = engine.generate(new DecisionInput(
                42,
                0.68,
                2800,
                4,
                List.of(
                        new TopicMetric("祈福文化", 18, 1, List.of("祈福路线怎么走")),
                        new TopicMetric("交通停车", 7, 4, List.of("停车场入口在哪里"))
                ),
                false
        ));

        assertThat(response.demoFallback()).isFalse();
        assertThat(response.cards()).extracting(DecisionCard::type)
                .contains("游客兴趣洞察", "营销机会", "服务优化", "客流分流");
    }

    @Test
    void returnsDemoFallbackWhenAnalyticsDataIsEmpty() {
        MarketingDecisionEngine engine = new MarketingDecisionEngine();
        DecisionResponse response = engine.generate(new DecisionInput(0, 0, 0, 0, List.of(), false));

        assertThat(response.demoFallback()).isTrue();
        assertThat(response.cards()).hasSize(5);
        assertThat(response.cards()).allSatisfy(card -> assertThat(card.demoFallback()).isTrue());
        assertThat(response.cards()).extracting(DecisionCard::title).contains("部分问题知识库命中不足");
    }

    @Test
    void turnsHeatmapCommerceAndPersonaSignalsIntoDecisionCards() {
        MarketingDecisionEngine engine = new MarketingDecisionEngine();
        DecisionResponse response = engine.generate(new DecisionInput(
                18, 0.7, 900, 2, List.of(), false,
                "灵山大佛", 6, List.of("亲子游", "祈福静心"), "文创", 1280
        ));

        assertThat(response.cards()).extracting(DecisionCard::type)
                .contains("客流分流", "客群营销", "消费转化");
        assertThat(response.dataSources()).contains("实时景点访问热区", "购票与消费事件", "游客画像与偏好标签");
    }
}
