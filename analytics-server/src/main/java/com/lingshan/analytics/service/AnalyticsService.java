package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EventRequest;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final EventRepository repository;
    private final SentimentAnalyzer sentimentAnalyzer;

    public AnalyticsService(EventRepository repository, SentimentAnalyzer sentimentAnalyzer) {
        this.repository = repository;
        this.sentimentAnalyzer = sentimentAnalyzer;
    }

    // ---- 写入事件 ----

    public void saveEvent(EventRequest req) {
        AnalyticsEvent e = new AnalyticsEvent();
        e.setEvent(req.event() != null ? req.event() : "unknown");
        e.setProperties(toJsonString(req.properties()));
        e.setTs(parseTimestamp(req.timestamp()));
        e.setCreatedAt(LocalDateTime.now());

        Map<String, Object> props = req.properties() != null ? req.properties() : Map.of();

        // user_message：做情感分析
        if ("user_message".equals(req.event())) {
            Object ct = props.get("content_text");
            if (ct instanceof String text && !text.isBlank()) {
                SentimentResult result = sentimentAnalyzer.analyze(text);
                e.setSentiment(result.sentiment());
                e.setSentimentConfidence(result.confidence());
            }
            Object iv = props.get("is_voice");
            if (iv instanceof Boolean b) e.setIsVoice(b);
        }

        // ai_reply：提取响应时延
        if ("ai_reply".equals(req.event())) {
            Object lat = props.get("latency_ms");
            if (lat instanceof Number n) e.setLatencyMs(n.doubleValue());
        }

        // quick_ask：提取问题文本
        if ("quick_ask".equals(req.event())) {
            Object q = props.get("question");
            if (q instanceof String s) e.setQuestion(s);
        }

        repository.save(e);
    }

    // ---- 读取 API ----

    public Map<String, Object> getSummary() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<AnalyticsEvent> events = repository.findByTsAfter(startOfDay);

        long totalSessions  = count(events, "session_start");
        long totalMessages  = count(events, "user_message");
        long quickAskCount  = count(events, "quick_ask");
        long positive = events.stream().filter(e -> "positive".equals(e.getSentiment())).count();
        long negative = events.stream().filter(e -> "negative".equals(e.getSentiment())).count();
        long neutral  = events.stream().filter(e -> "neutral".equals(e.getSentiment())).count();
        double positiveRatio = totalMessages > 0 ? round4((double) positive / totalMessages) : 0.0;

        OptionalDouble avgLat = events.stream()
                .filter(e -> "ai_reply".equals(e.getEvent()) && e.getLatencyMs() != null)
                .mapToDouble(AnalyticsEvent::getLatencyMs)
                .average();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date",              LocalDate.now().toString());
        result.put("totalSessions",     totalSessions);
        result.put("totalMessages",     totalMessages);
        result.put("quickAskCount",     quickAskCount);
        result.put("positiveRatio",     positiveRatio);
        result.put("sentimentPositive", positive);
        result.put("sentimentNegative", negative);
        result.put("sentimentNeutral",  neutral);
        result.put("avgLatencyMs",      round1(avgLat.orElse(0)));
        return result;
    }

    public List<Map<String, Object>> getSentimentTrend(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<AnalyticsEvent> events = repository.findByEventAndTsAfter("user_message", since);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00");
        Map<String, Map<String, Long>> grouped = events.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getTs().format(fmt),
                        TreeMap::new,
                        Collectors.groupingBy(
                                e -> e.getSentiment() != null ? e.getSentiment() : "neutral",
                                Collectors.counting()
                        )
                ));

        List<Map<String, Object>> list = new ArrayList<>();
        grouped.forEach((hour, sentMap) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("hour",     hour);
            row.put("positive", sentMap.getOrDefault("positive", 0L));
            row.put("negative", sentMap.getOrDefault("negative", 0L));
            row.put("neutral",  sentMap.getOrDefault("neutral",  0L));
            list.add(row);
        });
        return list;
    }

    public List<Map<String, Object>> getPopularQuestions(int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(1);
        List<AnalyticsEvent> events = repository.findByEventAndTsAfter("quick_ask", since);

        Map<String, Long> counts = events.stream()
                .filter(e -> e.getQuestion() != null)
                .collect(Collectors.groupingBy(AnalyticsEvent::getQuestion, Collectors.counting()));

        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("question", entry.getKey());
                    row.put("count",    entry.getValue());
                    row.put("type",     "quick_ask");
                    return row;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getLatencyStats(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<AnalyticsEvent> events = repository.findByEventAndTsAfter("ai_reply", since);

        List<Double> lats = events.stream()
                .filter(e -> e.getLatencyMs() != null)
                .map(AnalyticsEvent::getLatencyMs)
                .sorted()
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        if (lats.isEmpty()) {
            result.put("count", 0); result.put("avgMs", 0.0);
            result.put("p50Ms", 0.0); result.put("p90Ms", 0.0); result.put("maxMs", 0.0);
            return result;
        }

        int n = lats.size();
        double avg = lats.stream().mapToDouble(d -> d).average().orElse(0);
        result.put("count",  n);
        result.put("avgMs",  round1(avg));
        result.put("p50Ms",  round1(lats.get(Math.max(0, (int)(n * 0.5) - 1))));
        result.put("p90Ms",  round1(lats.get(Math.max(0, (int)(n * 0.9) - 1))));
        result.put("maxMs",  round1(lats.get(n - 1)));
        return result;
    }

    public Map<String, Object> getRealtime() {
        LocalDateTime since5min = LocalDateTime.now().minusMinutes(5);
        List<AnalyticsEvent> recent = repository.findByTsAfterOrderByTsDesc(since5min);

        long activeSessions = recent.stream().filter(e -> "session_start".equals(e.getEvent())).count();
        long messages5min   = recent.stream().filter(e -> "user_message".equals(e.getEvent())).count();

        List<Map<String, String>> recentItems = recent.stream()
                .limit(10)
                .map(e -> {
                    Map<String, String> item = new LinkedHashMap<>();
                    item.put("event",     e.getEvent());
                    item.put("timestamp", e.getTs().toString() + "Z");
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("asOf",               LocalDateTime.now() + "Z");
        result.put("activeSessions5min", activeSessions);
        result.put("messages5min",       messages5min);
        result.put("recentEvents",       recentItems);
        return result;
    }

    // ---- 工具方法 ----

    private long count(List<AnalyticsEvent> events, String eventName) {
        return events.stream().filter(e -> eventName.equals(e.getEvent())).count();
    }

    private LocalDateTime parseTimestamp(String ts) {
        if (ts == null || ts.isBlank()) return LocalDateTime.now();
        try {
            String s = ts.replace("Z", "").replace("z", "");
            if (s.contains(".")) s = s.substring(0, s.lastIndexOf('.'));
            return LocalDateTime.parse(s, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ex) {
            return LocalDateTime.now();
        }
    }

    private String toJsonString(Map<String, Object> props) {
        if (props == null) return "{}";
        StringBuilder sb = new StringBuilder("{");
        props.forEach((k, v) -> {
            sb.append("\"").append(k).append("\":");
            if (v instanceof String s) sb.append("\"").append(s.replace("\\", "\\\\").replace("\"", "\\\"")).append("\"");
            else sb.append(v);
            sb.append(",");
        });
        if (sb.length() > 1 && sb.charAt(sb.length() - 1) == ',') sb.setLength(sb.length() - 1);
        sb.append("}");
        return sb.toString();
    }

    private double round1(double v) { return Math.round(v * 10.0)    / 10.0; }
    private double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }
}
