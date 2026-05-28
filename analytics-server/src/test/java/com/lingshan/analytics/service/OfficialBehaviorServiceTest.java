package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class OfficialBehaviorServiceTest {

    private final OfficialBehaviorService service = new OfficialBehaviorService(new ObjectMapper());

    @Test
    void exposesOnlyAggregatedOfficialBehaviorData() {
        Map<String, Object> summary = service.summary();
        assertThat(((Number) summary.get("sampleCount")).intValue()).isEqualTo(140447);
        assertThat(summary.get("sourceLabel")).isEqualTo("官方历史样本");
        assertThat(summary.get("disclaimer").toString()).contains("不代表灵山实时客流");
        assertThat(summary.toString()).doesNotContain("tourist_id", "user_nickname", "attraction_content", "U000");

        Map<?, ?> dateRange = (Map<?, ?>) summary.get("dateRange");
        assertThat(dateRange.get("start")).isEqualTo("2025-01-01");
        assertThat(dateRange.get("end")).isEqualTo("2025-12-31");

        Map<?, ?> satisfactionScale = (Map<?, ?>) summary.get("satisfactionScale");
        assertThat(satisfactionScale.get("rawMin")).isEqualTo(2.0);
        assertThat(satisfactionScale.get("rawMax")).isEqualTo(5.0);
        assertThat(satisfactionScale.get("normalizedTo")).isEqualTo("0-100");
        assertThat(summary.get("stayDurationUnit")).isEqualTo("hour");
    }

    @Test
    void containsExpectedTypeStatsAndPriors() {
        Map<String, Object> attractionTypes = service.attractionTypes();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) attractionTypes.get("items");

        assertThat(items)
                .extracting(item -> item.get("type"))
                .contains(
                        "古镇水乡",
                        "风景名胜与休闲度假",
                        "主题乐园",
                        "动植物园与水族馆",
                        "现代地标",
                        "博物馆与展馆",
                        "自然公园",
                        "历史文化"
                );

        Map<String, Object> priors = service.recommendationPriors();
        assertThat(priors.get("sourceLabel")).isEqualTo("官方历史样本");
        assertThat(priors.toString()).contains("defaultPriors");
    }
}
