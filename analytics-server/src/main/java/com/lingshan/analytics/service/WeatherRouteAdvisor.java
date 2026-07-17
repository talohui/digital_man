package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.GuideRouteCard;
import com.lingshan.analytics.dto.ScenicWeatherDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WeatherRouteAdvisor {
    private static final double WEATHER_BOOST = 15.0;
    private static final Pattern FIRST_NUMBER = Pattern.compile("(\\d+)");

    public Result apply(List<GuideRouteCard> safeRoutes, ScenicWeatherDto weather) {
        List<GuideRouteCard> routes = safeRoutes == null ? List.of() : safeRoutes;
        if (weather == null) {
            return new Result(routes, List.of(), weather);
        }

        Strategy strategy = strategyFor(weather);
        ScenicWeatherDto guidedWeather = guide(weather);
        if (routes.isEmpty() || strategy.preference() == Preference.NONE) {
            return new Result(routes, List.of(), guidedWeather);
        }

        List<GuideRouteCard> adjusted = new ArrayList<>();
        for (GuideRouteCard route : routes) {
            GuideRouteCatalog.RouteProfile profile = GuideRouteCatalog.findRoute(route.id());
            double environmentalFit = profile == null ? 0.0 : fit(profile.environmentProfile(), strategy.preference());
            adjusted.add(copy(route, environmentalFit * WEATHER_BOOST, strategy));
        }
        adjusted.sort(Comparator.comparingDouble((GuideRouteCard route) -> value(route.score())).reversed());
        return new Result(List.copyOf(adjusted), List.of(strategy.advice()), guidedWeather);
    }

    public ScenicWeatherDto guide(ScenicWeatherDto weather) {
        if (weather == null) return null;
        Strategy strategy = strategyFor(weather);
        return weather.withGuidance(
                strategy.code(), strategy.advice(), strategy.riskKey(), strategy.safetyNotice()
        );
    }

    private Strategy strategyFor(ScenicWeatherDto weather) {
        String condition = weather.weather() == null ? "" : weather.weather().trim();
        if (condition.contains("雨") || condition.contains("雪") || condition.contains("雷")) {
            return new Strategy(
                    "indoor-preferred", "降水天气，优先推荐室内停留更多的路线", Preference.INDOOR,
                    "wet-surface", "当前可能有降水，台阶和石板路较湿滑，行走时请放慢脚步并留意脚下。"
            );
        }
        if (isSunny(condition) && weather.temperature() >= 28) {
            return new Strategy(
                    "shade-preferred", "晴热天气，优先推荐树荫较多的路线", Preference.SHADE,
                    "heat", "现在天气较热，建议随身补水、避开长时间暴晒，优先选择树荫或室内休息点。"
            );
        }
        if (weather.humidity() >= 85 || windLevel(weather.windPower()) >= 6) {
            return new Strategy(
                    "light-walk-preferred", "高湿或大风天气，优先推荐轻松路线", Preference.LIGHT_WALK,
                    "wind-discomfort", "当前体感可能不太舒适，建议放慢游览节奏，注意防风并适时休息。"
            );
        }
        return new Strategy("interest-first", "天气适宜，按兴趣偏好推荐", Preference.NONE, "normal", null);
    }

    private boolean isSunny(String condition) {
        return condition.contains("晴") || condition.contains("少云") || condition.contains("多云");
    }

    private int windLevel(String windPower) {
        if (windPower == null) return 0;
        Matcher matcher = FIRST_NUMBER.matcher(windPower);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : 0;
    }

    private double fit(GuideRouteCatalog.EnvironmentProfile profile, Preference preference) {
        if (profile == null) return 0.0;
        return switch (preference) {
            case SHADE -> profile.shadeLevel();
            case INDOOR -> profile.indoorLevel();
            case LIGHT_WALK -> profile.walkEase();
            case NONE -> 0.0;
        };
    }

    private GuideRouteCard copy(GuideRouteCard route, double boost, Strategy strategy) {
        Map<String, Object> debug = new LinkedHashMap<>(route.debug() == null ? Map.of() : route.debug());
        debug.put("weatherStrategy", strategy.code());
        debug.put("weatherScoreBoost", Math.round(boost * 10.0) / 10.0);
        return new GuideRouteCard(
                route.id(), route.name(), route.description(), route.durationLabel(), route.tags(),
                route.reason(), Math.round((value(route.score()) + boost) * 10.0) / 10.0,
                route.matchScore(), route.routePersona(), route.whyRecommended(), route.lightAlternativeId(),
                route.reasons(), route.matchedTags(), route.reasonCodes(), route.stopIds(),
                route.adjustmentReasons(), debug
        );
    }

    private double value(Double value) {
        return value == null ? 0.0 : value;
    }

    public record Result(List<GuideRouteCard> routes, List<String> adjustmentReasons, ScenicWeatherDto weather) {
    }

    private record Strategy(String code, String advice, Preference preference, String riskKey, String safetyNotice) {
    }

    private enum Preference {
        SHADE, INDOOR, LIGHT_WALK, NONE
    }
}
