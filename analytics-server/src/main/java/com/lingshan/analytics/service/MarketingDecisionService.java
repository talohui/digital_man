package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MarketingDecisionService {
    private static final long CACHE_TTL_MILLIS = 5 * 60 * 1000L;
    private static final List<String> ALLOWED_PRIORITIES = List.of("高", "中", "低");
    private static final Map<String, String> SPOT_NAMES = Map.ofEntries(
            Map.entry("giant_buddha", "灵山大佛"), Map.entry("fan_gong", "梵宫"),
            Map.entry("jiulong_guanyu", "九龙灌浴"), Map.entry("foshou_square", "佛手广场"),
            Map.entry("baizi_mile", "百子戏弥勒"), Map.entry("xiangfu_temple", "祥符禅寺")
    );
    private static final Map<String, String> CONSUMPTION_LABELS = Map.of(
            "ticket", "门票", "food", "餐饮", "shopping", "文创", "transport", "交通", "entertainment", "演艺"
    );
    private final EventRepository repository;
    private final MarketingDecisionEngine engine;
    private final ObjectMapper objectMapper;
    private final MarketingDecisionGenerator fayClient;
    private final DecisionHistoryService historyService;
    private final EmergencyEventService emergencyEventService;
    private final OfficialBehaviorService officialBehaviorService;
    private CachedDecision cachedDecision;

    @Autowired
    public MarketingDecisionService(
            EventRepository repository,
            MarketingDecisionEngine engine,
            ObjectMapper objectMapper,
            MarketingDecisionGenerator fayClient,
            DecisionHistoryService historyService,
            EmergencyEventService emergencyEventService,
            OfficialBehaviorService officialBehaviorService
    ) {
        this.repository = repository;
        this.engine = engine;
        this.objectMapper = objectMapper;
        this.fayClient = fayClient;
        this.historyService = historyService;
        this.emergencyEventService = emergencyEventService;
        this.officialBehaviorService = officialBehaviorService;
    }

    public MarketingDecisionService(
            EventRepository repository,
            MarketingDecisionEngine engine,
            ObjectMapper objectMapper,
            MarketingDecisionGenerator fayClient,
            DecisionHistoryService historyService
    ) {
        this(repository, engine, objectMapper, fayClient, historyService, null, null);
    }

    public MarketingDecisionService(
            EventRepository repository,
            MarketingDecisionEngine engine,
            ObjectMapper objectMapper,
            MarketingDecisionGenerator fayClient
    ) {
        this(repository, engine, objectMapper, fayClient, null, null, null);
    }

    public MarketingDecisionService(
            EventRepository repository,
            MarketingDecisionEngine engine,
            ObjectMapper objectMapper,
            MarketingDecisionGenerator fayClient,
            DecisionHistoryService historyService,
            EmergencyEventService emergencyEventService
    ) {
        this(repository, engine, objectMapper, fayClient, historyService, emergencyEventService, null);
    }

    public DecisionResponse getDecisionCards() {
        return getDecisionCards(false);
    }

    public synchronized DecisionResponse getDecisionCards(boolean forceRefresh) {
        long now = System.currentTimeMillis();
        if (!forceRefresh && cachedDecision != null && cachedDecision.expiresAtMillis() > now) {
            return withMetadata(
                    cachedDecision.response(),
                    cachedDecision.response().generationSource(),
                    cachedDecision.response().generatedAt(),
                    true,
                    cachedDecision.response().fallbackReason()
            );
        }

        DecisionInput input = buildDecisionInput();
        DecisionResponse result;
        try {
            DecisionResponse modelResponse = fayClient.generate(input);
            if (!isValidModelResponse(modelResponse, input)) {
                result = ruleFallback(input, "模型结果格式不合格，已使用规则分析");
            } else {
                result = withMetadata(
                        modelResponse, "llm", Instant.now().toString(), false, null
                );
            }
        } catch (RuntimeException ignored) {
            result = ruleFallback(input, "模型服务暂不可用，已使用规则分析");
        }
        if (historyService != null) {
            LocalDateTime windowEnd = LocalDateTime.now();
            String snapshotId = historyService.save(result, input, windowEnd.minusHours(24), windowEnd);
            result = withSnapshotId(result, snapshotId);
        }
        cachedDecision = new CachedDecision(result, now + CACHE_TTL_MILLIS);
        return result;
    }

    private DecisionInput buildDecisionInput() {
        List<AnalyticsEvent> events = repository.findByTsAfter(LocalDateTime.now().minusHours(24));
        List<AnalyticsEvent> recent = repository.findByTsAfter(LocalDateTime.now().minusMinutes(5));
        Map<String, MutableTopicMetric> topicMap = new LinkedHashMap<>();
        Map<String, Integer> hotSpotVisits = new LinkedHashMap<>();
        Map<String, Integer> personaTagCounts = new LinkedHashMap<>();
        Map<String, Double> consumptionAmounts = new LinkedHashMap<>();
        int ticketPurchaseCount = 0;
        int totalMessages = 0;
        int positive = 0;
        for (AnalyticsEvent event : events) {
            Map<String, Object> props = readProperties(event.getProperties());
            if ("quick_ask".equals(event.getEvent()) && event.getQuestion() != null) addTopic(topicMap, event.getQuestion(), false);
            if ("user_message".equals(event.getEvent())) {
                totalMessages++;
                if ("positive".equals(event.getSentiment())) positive++;
                String content = contentText(props);
                if (content != null && !content.isBlank()) addTopic(topicMap, content, "negative".equals(event.getSentiment()));
            }
            if ("preference_update".equals(event.getEvent())) addPersonaTags(personaTagCounts, props);
            if ("ticket_purchase".equals(event.getEvent())) {
                ticketPurchaseCount++;
                addAmount(consumptionAmounts, "ticket", number(props.get("ticket_cost")));
            }
            if ("purchase".equals(event.getEvent())) addAmount(consumptionAmounts, string(props.get("category")), number(props.get("amount")));
        }
        for (AnalyticsEvent event : recent) {
            if ("spot_enter".equals(event.getEvent()) && event.getTargetId() != null) {
                hotSpotVisits.merge(event.getTargetId(), 1, Integer::sum);
            }
        }
        List<Double> latencies = events.stream().filter(event -> "ai_reply".equals(event.getEvent()) && event.getLatencyMs() != null).map(AnalyticsEvent::getLatencyMs).sorted().toList();
        List<TopicMetric> topics = topicMap.values().stream().map(MutableTopicMetric::toMetric).sorted(Comparator.comparingInt(TopicMetric::count).reversed()).toList();
        int messageBase = Math.max(totalMessages, topicMap.values().stream().mapToInt(metric -> metric.count).sum());
        int activeSessions = (int) recent.stream().filter(event -> "session_start".equals(event.getEvent())).count();
        Map.Entry<String, Integer> hotspot = hotSpotVisits.entrySet().stream().max(Map.Entry.comparingByValue()).orElse(null);
        String hottestSpot = hotspot == null ? null : SPOT_NAMES.getOrDefault(hotspot.getKey(), hotspot.getKey());
        int hottestSpotVisits = hotspot == null ? 0 : hotspot.getValue();
        List<String> personaTags = personaTagCounts.entrySet().stream().sorted(Map.Entry.<String, Integer>comparingByValue().reversed()).limit(3).map(Map.Entry::getKey).toList();
        Map.Entry<String, Double> consumption = consumptionAmounts.entrySet().stream()
                .filter(entry -> !"ticket".equals(entry.getKey()))
                .max(Map.Entry.comparingByValue())
                .orElseGet(() -> consumptionAmounts.entrySet().stream().max(Map.Entry.comparingByValue()).orElse(null));
        String topConsumptionCategory = consumption == null ? null : CONSUMPTION_LABELS.getOrDefault(consumption.getKey(), consumption.getKey());
        double totalConsumption = consumptionAmounts.values().stream().mapToDouble(Double::doubleValue).sum();
        double ticketRevenue = consumptionAmounts.getOrDefault("ticket", 0d);
        double ancillaryAmount = Math.max(0, totalConsumption - ticketRevenue);
        ConsumptionSignal consumptionSignal = totalConsumption > 0
                ? new ConsumptionSignal(true, topConsumptionCategory, "近24小时小程序购票与消费事件", false,
                totalConsumption, 0, 0, ticketPurchaseCount, ticketRevenue, ancillaryAmount)
                : historicalConsumptionSignal();
        List<EmergencySignal> activeEmergencies = emergencyEventService == null
                ? List.of()
                : emergencyEventService.active(LocalDateTime.now()).stream()
                .map(event -> new EmergencySignal(
                        event.id(), event.type(), event.title(), event.severity(), event.message(),
                        event.routePolicy(), event.affectedSpotIds(), event.affectedRouteIds(),
                        event.validUntil() == null ? null : event.validUntil().toString()
                ))
                .toList();
        return new DecisionInput(messageBase, totalMessages > 0 ? (double) positive / totalMessages : 0, percentile(latencies), activeSessions, topics,
                hottestSpotVisits >= 3, hottestSpot, hottestSpotVisits, personaTags, topConsumptionCategory, totalConsumption,
                activeEmergencies, consumptionSignal);
    }

    private DecisionResponse ruleFallback(DecisionInput input, String reason) {
        DecisionResponse rules = engine.generate(input);
        String source = rules.demoFallback() ? "demo" : "rules";
        return withMetadata(rules, source, Instant.now().toString(), false, reason);
    }

    private boolean isValidModelResponse(DecisionResponse response, DecisionInput input) {
        if (response == null || response.summary() == null || response.summary().isBlank()) return false;
        if (response.cards() == null || response.cards().size() < 3 || response.cards().size() > 5) return false;
        boolean cardsValid = response.cards().stream().allMatch(card ->
                card != null
                        && card.title() != null && !card.title().isBlank()
                        && card.type() != null && !card.type().isBlank()
                        && ALLOWED_PRIORITIES.contains(card.priority())
                        && card.evidence() != null && !card.evidence().isEmpty()
                        && card.reason() != null && !card.reason().isBlank()
                        && card.actions() != null && !card.actions().isEmpty()
        );
        return cardsValid && (!input.consumptionSignal().available()
                || response.cards().stream().anyMatch(card -> "消费转化".equals(card.type())));
    }

    private DecisionResponse withMetadata(
            DecisionResponse response,
            String source,
            String generatedAt,
            boolean cacheHit,
            String fallbackReason
    ) {
        return new DecisionResponse(
                response.summary(),
                response.cards(),
                response.actionTodos() == null ? List.of() : response.actionTodos(),
                response.dataSources() == null ? List.of() : response.dataSources(),
                response.demoFallback(),
                source,
                generatedAt,
                cacheHit,
                fallbackReason,
                response.snapshotId()
        );
    }

    private DecisionResponse withSnapshotId(DecisionResponse response, String snapshotId) {
        return new DecisionResponse(
                response.summary(), response.cards(), response.actionTodos(), response.dataSources(),
                response.demoFallback(), response.generationSource(), response.generatedAt(),
                response.cacheHit(), response.fallbackReason(), snapshotId
        );
    }

    private void addTopic(Map<String, MutableTopicMetric> topics, String text, boolean negative) {
        MutableTopicMetric metric = topics.computeIfAbsent(engine.classifyTopic(text), MutableTopicMetric::new);
        metric.count++;
        if (negative) metric.negativeCount++;
        if (metric.samples.size() < 3) metric.samples.add(text);
    }

    private Map<String, Object> readProperties(String properties) {
        if (properties == null || properties.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(properties, new TypeReference<>() {});
        } catch (Exception ignored) { return Map.of(); }
    }

    private String contentText(Map<String, Object> properties) { return string(properties.get("content_text")); }
    private String string(Object value) { return value instanceof String text && !text.isBlank() ? text : null; }
    private double number(Object value) { return value instanceof Number number ? Math.max(0, number.doubleValue()) : 0; }
    private void addAmount(Map<String, Double> amounts, String category, double amount) { if (category != null && amount > 0) amounts.merge(category, amount, Double::sum); }
    private void addPersonaTags(Map<String, Integer> tags, Map<String, Object> properties) {
        Object raw = properties.get("selectedTags");
        if (!(raw instanceof Collection<?> values)) raw = properties.get("selected_tags");
        if (raw instanceof Collection<?> values) for (Object value : values) if (value instanceof String tag && !tag.isBlank()) tags.merge(tag, 1, Integer::sum);
    }

    @SuppressWarnings("unchecked")
    private ConsumptionSignal historicalConsumptionSignal() {
        if (officialBehaviorService == null) return ConsumptionSignal.none();
        Map<String, Object> spending = officialBehaviorService.spending();
        Object rawMix = spending.get("costMix");
        if (!(rawMix instanceof Collection<?> rows)) return ConsumptionSignal.none();

        Map<String, Object> top = rows.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .map(item -> (Map<String, Object>) item)
                .filter(item -> !"ticket_cost".equals(string(item.get("category"))))
                .max(Comparator.comparingDouble(item -> number(item.get("share"))))
                .orElse(null);
        if (top == null) return ConsumptionSignal.none();

        String label = string(top.get("label"));
        if (label == null) return ConsumptionSignal.none();
        if ("购物".equals(label)) label = "文创";
        String source = string(spending.get("sourceLabel"));
        return new ConsumptionSignal(
                true,
                label,
                source == null ? "官方历史样本（推荐先验）" : source + "（推荐先验）",
                true,
                0,
                number(top.get("share")),
                number(spending.get("avgTotalCost")),
                0,
                0,
                0
        );
    }

    private double percentile(List<Double> values) {
        if (values.isEmpty()) return 0;
        return values.get(Math.max(0, Math.min(values.size() - 1, (int) Math.ceil(values.size() * 0.9) - 1)));
    }

    private static class MutableTopicMetric {
        private final String topic;
        private int count;
        private int negativeCount;
        private final List<String> samples = new ArrayList<>();
        private MutableTopicMetric(String topic) { this.topic = topic; }
        private TopicMetric toMetric() { return new TopicMetric(topic, count, negativeCount, samples); }
    }

    private record CachedDecision(DecisionResponse response, long expiresAtMillis) {}
}
