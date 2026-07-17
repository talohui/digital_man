package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.GuideRouteCard;
import com.lingshan.analytics.dto.ScenicWeatherDto;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class WeatherRouteAdvisorTest {

    private final WeatherRouteAdvisor advisor = new WeatherRouteAdvisor();

    @Test
    void promotesTreeRichRouteOnSunnyHotWeather() {
        WeatherRouteAdvisor.Result result = advisor.apply(
                List.of(route("historical_culture", 90), route("prayer_meditation", 82), route("family", 80)),
                weather("晴", 32, 56, "2-3级")
        );

        assertThat(result.routes().get(0).id()).isEqualTo("prayer_meditation");
        assertThat(result.adjustmentReasons()).contains("晴热天气，优先推荐树荫较多的路线");
        assertThat(result.weather().strategy()).isEqualTo("shade-preferred");
    }

    @Test
    void promotesIndoorRouteOnRain() {
        WeatherRouteAdvisor.Result result = advisor.apply(
                List.of(route("prayer_meditation", 90), route("historical_culture", 82), route("family", 80)),
                weather("小雨", 24, 88, "3级")
        );

        assertThat(result.routes().get(0).id()).isEqualTo("historical_culture");
        assertThat(result.adjustmentReasons()).contains("降水天气，优先推荐室内停留更多的路线");
    }

    @Test
    void publishesFixedSlipSafetyNoticeForWetWeather() {
        WeatherRouteAdvisor.Result result = advisor.apply(
                List.of(route("prayer_meditation", 80)),
                weather("小雨", 22, 90, "4级")
        );

        assertThat(result.weather().weatherRiskKey()).isEqualTo("wet-surface");
        assertThat(result.weather().safetyNotice()).contains("台阶和石板路");
    }

    @Test
    void neverReintroducesRoutesFilteredBySafetyConstraints() {
        WeatherRouteAdvisor.Result result = advisor.apply(
                List.of(route("family", 80)),
                weather("晴", 33, 50, "2级")
        );

        assertThat(result.routes()).extracting(GuideRouteCard::id).containsExactly("family");
    }

    private ScenicWeatherDto weather(String condition, int temperature, int humidity, String windPower) {
        return new ScenicWeatherDto(
                condition, temperature, humidity, "东风", windPower, 1001,
                "2026-07-14 10:00", "滨湖区", "tencent", false, null, null
        );
    }

    private GuideRouteCard route(String id, double score) {
        return new GuideRouteCard(
                id, id, "", "", List.of(), "", score, score, "", "", null,
                List.of(), List.of(), List.of(), List.of("safe-stop"), List.of(), Map.of()
        );
    }
}
