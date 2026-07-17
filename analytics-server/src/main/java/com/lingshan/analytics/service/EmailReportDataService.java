package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.dto.EmergencyEventDto;
import com.lingshan.analytics.dto.ScenicWeatherDto;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class EmailReportDataService {
    private static final String DAILY = "DAILY";
    private static final String WEEKLY = "WEEKLY";

    private final EventRepository eventRepository;
    private final ObjectMapper objectMapper;
    private final EmergencyEventService emergencyEventService;
    private final TencentWeatherService weatherService;
    private final MarketingDecisionService decisionService;

    @Autowired
    public EmailReportDataService(
            EventRepository eventRepository,
            ObjectMapper objectMapper,
            EmergencyEventService emergencyEventService,
            TencentWeatherService weatherService,
            MarketingDecisionService decisionService
    ) {
        this.eventRepository = eventRepository;
        this.objectMapper = objectMapper;
        this.emergencyEventService = emergencyEventService;
        this.weatherService = weatherService;
        this.decisionService = decisionService;
    }

    EmailReportDataService(EventRepository eventRepository, ObjectMapper objectMapper) {
        this(eventRepository, objectMapper, null, null, null);
    }

    public EmailReportInput daily(LocalDate runDate) {
        LocalDate target = requireDate(runDate).minusDays(1);
        return build(DAILY, "D-" + target, target.atStartOfDay(), target.plusDays(1).atStartOfDay());
    }

    public EmailReportInput weekly(LocalDate runDate) {
        LocalDate currentWeekStart = requireDate(runDate)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate targetWeekStart = currentWeekStart.minusWeeks(1);
        return build(WEEKLY, "W-" + targetWeekStart, targetWeekStart.atStartOfDay(), targetWeekStart.plusWeeks(1).atStartOfDay());
    }

    public EmailReportInput currentSnapshot() {
        LocalDateTime end = LocalDateTime.now().withSecond(0).withNano(0);
        return build("TEST", "TEST-" + end, end.minusHours(24), end);
    }

    private EmailReportInput build(String reportType, String periodKey, LocalDateTime start, LocalDateTime end) {
        List<AnalyticsEvent> events = eventRepository.findByTsBetween(start, end.minusNanos(1));
        Map<String, Object> metrics = aggregateMetrics(events);
        List<Map<String, Object>> emergencies = activeEmergencies();
        Map<String, Object> weather = weatherSummary();
        Map<String, Object> decisionSummary = decisionSummary();
        List<String> sources = new ArrayList<>(List.of("门票与消费事件", "游客问答与情绪汇总", "路线与景点行为事件"));
        if (!emergencies.isEmpty()) sources.add("应急事件管理");
        if (!weather.isEmpty()) sources.add("腾讯天气");
        if (!decisionSummary.isEmpty()) sources.add("Next Best Action 决策面板");
        return new EmailReportInput(
                reportType, periodKey, start, end, immutableCopy(metrics), List.copyOf(emergencies),
                immutableCopy(weather), immutableCopy(decisionSummary), List.copyOf(sources));
    }

    private Map<String, Object> aggregateMetrics(List<AnalyticsEvent> events) {
        long messageCount = events.stream().filter(event -> "user_message".equals(event.getEvent())).count();
        long quickAskCount = events.stream().filter(event -> "quick_ask".equals(event.getEvent())).count();
        long routeClickCount = events.stream().filter(event -> "route_click".equals(event.getEvent())).count();
        long spotEnterCount = events.stream().filter(event -> "spot_enter".equals(event.getEvent())).count();
        long positiveCount = events.stream().filter(event -> "positive".equals(event.getSentiment())).count();
        long negativeCount = events.stream().filter(event -> "negative".equals(event.getSentiment())).count();
        long ticketCount = events.stream().filter(event -> "ticket_purchase".equals(event.getEvent())).count();
        long purchaseCount = events.stream().filter(event -> "purchase".equals(event.getEvent())).count();
        double ticketRevenue = events.stream()
                .filter(event -> "ticket_purchase".equals(event.getEvent()))
                .mapToDouble(event -> number(readProperties(event), "ticket_cost"))
                .sum();
        double consumptionAmount = events.stream()
                .filter(event -> "purchase".equals(event.getEvent()))
                .mapToDouble(event -> number(readProperties(event), "amount"))
                .sum();
        double averageLatency = events.stream()
                .map(AnalyticsEvent::getLatencyMs)
                .filter(value -> value != null && value >= 0)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0);

        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        Map<String, Long> preferenceTags = new LinkedHashMap<>();
        Map<String, Long> spotVisits = new LinkedHashMap<>();
        for (AnalyticsEvent event : events) {
            Map<String, Object> properties = readProperties(event);
            if ("purchase".equals(event.getEvent())) {
                String category = text(properties.get("category"));
                if (category != null) categoryCounts.merge(category, 1L, Long::sum);
            }
            if ("preference_update".equals(event.getEvent())) {
                addTags(preferenceTags, properties.get("selectedTags"));
                addTags(preferenceTags, properties.get("selected_tags"));
            }
            if ("spot_enter".equals(event.getEvent()) && event.getTargetId() != null) {
                spotVisits.merge(event.getTargetId(), 1L, Long::sum);
            }
        }

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("messageCount", messageCount);
        metrics.put("quickAskCount", quickAskCount);
        metrics.put("positiveSentimentCount", positiveCount);
        metrics.put("negativeSentimentCount", negativeCount);
        metrics.put("routeClickCount", routeClickCount);
        metrics.put("spotEnterCount", spotEnterCount);
        metrics.put("ticketPurchaseCount", ticketCount);
        metrics.put("ticketRevenue", round(ticketRevenue));
        metrics.put("purchaseCount", purchaseCount);
        metrics.put("consumptionAmount", round(consumptionAmount));
        metrics.put("averageReplyLatencyMs", round(averageLatency));
        metrics.put("topPurchaseCategories", topNames(categoryCounts, 3));
        metrics.put("topPreferenceTags", topNames(preferenceTags, 3));
        metrics.put("topVisitedSpots", topNames(spotVisits, 3));
        return metrics;
    }

    private List<Map<String, Object>> activeEmergencies() {
        if (emergencyEventService == null) return List.of();
        try {
            return emergencyEventService.active(LocalDateTime.now()).stream()
                    .map(this::safeEmergency)
                    .toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private Map<String, Object> safeEmergency(EmergencyEventDto event) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("type", event.type());
        result.put("title", event.title());
        result.put("severity", event.severity());
        result.put("routePolicy", event.routePolicy());
        result.put("validUntil", event.validUntil() == null ? null : event.validUntil().toString());
        return result;
    }

    private Map<String, Object> weatherSummary() {
        if (weatherService == null) return Map.of();
        try {
            return weatherService.current().map(this::safeWeather).orElseGet(Map::of);
        } catch (RuntimeException ignored) {
            return Map.of();
        }
    }

    private Map<String, Object> safeWeather(ScenicWeatherDto weather) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("weather", weather.weather());
        result.put("temperature", weather.temperature());
        result.put("humidity", weather.humidity());
        result.put("routeAdvice", weather.routeAdvice());
        result.put("safetyNotice", weather.safetyNotice());
        return result;
    }

    private Map<String, Object> decisionSummary() {
        if (decisionService == null) return Map.of();
        try {
            DecisionResponse decision = decisionService.getDecisionCards();
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("summary", decision.summary());
            result.put("generationSource", decision.generationSource());
            result.put("actionTodoCount", decision.actionTodos() == null ? 0 : decision.actionTodos().size());
            return result;
        } catch (RuntimeException ignored) {
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readProperties(AnalyticsEvent event) {
        String raw = event.getProperties();
        if (raw == null || raw.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(raw, new TypeReference<>() { });
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private void addTags(Map<String, Long> tags, Object values) {
        if (!(values instanceof Collection<?> collection)) return;
        for (Object value : collection) {
            String tag = text(value);
            if (tag != null) tags.merge(tag, 1L, Long::sum);
        }
    }

    private List<String> topNames(Map<String, Long> values, int limit) {
        return values.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(limit)
                .map(Map.Entry::getKey)
                .toList();
    }

    private double number(Map<String, Object> properties, String name) {
        Object value = properties.get(name);
        return value instanceof Number number ? Math.max(0, number.doubleValue()) : 0;
    }

    private String text(Object value) {
        if (!(value instanceof String string) || string.isBlank()) return null;
        return string.trim();
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private Map<String, Object> immutableCopy(Map<String, Object> values) {
        return Collections.unmodifiableMap(new LinkedHashMap<>(values));
    }

    private LocalDate requireDate(LocalDate value) {
        if (value == null) throw new IllegalArgumentException("报告日期不能为空");
        return value;
    }
}
