package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MarketingDecisionService {
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

    public MarketingDecisionService(EventRepository repository, MarketingDecisionEngine engine, ObjectMapper objectMapper) {
        this.repository = repository;
        this.engine = engine;
        this.objectMapper = objectMapper;
    }

    public DecisionResponse getDecisionCards() {
        List<AnalyticsEvent> events = repository.findByTsAfter(LocalDateTime.now().minusHours(24));
        List<AnalyticsEvent> recent = repository.findByTsAfter(LocalDateTime.now().minusMinutes(5));
        Map<String, MutableTopicMetric> topicMap = new LinkedHashMap<>();
        Map<String, Integer> hotSpotVisits = new LinkedHashMap<>();
        Map<String, Integer> personaTagCounts = new LinkedHashMap<>();
        Map<String, Double> consumptionAmounts = new LinkedHashMap<>();
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
            if ("ticket_purchase".equals(event.getEvent())) addAmount(consumptionAmounts, "ticket", number(props.get("ticket_cost")));
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
        Map.Entry<String, Double> consumption = consumptionAmounts.entrySet().stream().max(Map.Entry.comparingByValue()).orElse(null);
        String topConsumptionCategory = consumption == null ? null : CONSUMPTION_LABELS.getOrDefault(consumption.getKey(), consumption.getKey());
        double totalConsumption = consumptionAmounts.values().stream().mapToDouble(Double::doubleValue).sum();
        return engine.generate(new DecisionInput(messageBase, totalMessages > 0 ? (double) positive / totalMessages : 0, percentile(latencies), activeSessions, topics,
                hottestSpotVisits >= 3, hottestSpot, hottestSpotVisits, personaTags, topConsumptionCategory, totalConsumption));
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
}
