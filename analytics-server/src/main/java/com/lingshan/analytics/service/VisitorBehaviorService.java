package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.entity.VisitorBehaviorRecord;
import com.lingshan.analytics.repository.EventRepository;
import com.lingshan.analytics.repository.VisitorBehaviorRecordRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VisitorBehaviorService {

    public static final String HISTORY_SOURCE = "history_lingshan_sample";
    public static final String REALTIME_SOURCE = "realtime_mini_program";
    private static final String SEED_PATH = "visitor-behavior/lingshan-visitor-behavior-seed-v1.json";
    private static final Map<String, String> PURCHASE_CATEGORY_NAMES = Map.of(
            "ticket", "门票",
            "food", "餐饮",
            "shopping", "文创",
            "transport", "交通",
            "entertainment", "演艺"
    );
    private static final Map<String, String> SPOT_NAMES = Map.ofEntries(
            Map.entry("south_gate", "南门入园"), Map.entry("lingshan_wall", "灵山大照壁"),
            Map.entry("shengjing_square", "胜境广场"), Map.entry("fozu_tan", "佛足坛"),
            Map.entry("jiulong_guanyu", "九龙灌浴"), Map.entry("puti_avenue", "菩提大道"),
            Map.entry("foshou_square", "佛手广场"), Map.entry("xiangfu_temple", "祥符禅寺"),
            Map.entry("xingtan_square", "杏坛广场"), Map.entry("foqian_square", "佛前广场"),
            Map.entry("giant_buddha", "灵山大佛"), Map.entry("baizi_mile", "百子戏弥勒"),
            Map.entry("fan_gong", "梵宫"), Map.entry("fan_gong_square", "梵宫广场"),
            Map.entry("wuyin_tancheng", "五印坛城"), Map.entry("manfeilong_tower", "曼飞龙塔"),
            Map.entry("lingshan_jingshe", "灵山精舍"), Map.entry("sansheng_hall", "三圣殿"),
            Map.entry("exit", "景区出口")
    );

    private final VisitorBehaviorRecordRepository repository;
    private final EventRepository eventRepository;
    private final ObjectMapper mapper;

    public VisitorBehaviorService(
            VisitorBehaviorRecordRepository repository,
            EventRepository eventRepository,
            ObjectMapper mapper
    ) {
        this.repository = repository;
        this.eventRepository = eventRepository;
        this.mapper = mapper;
    }

    @PostConstruct
    public void seedHistoryIfEmpty() {
        if (repository.countBySource(HISTORY_SOURCE) > 0) return;
        List<Map<String, Object>> rows = readSeedRows();
        List<VisitorBehaviorRecord> records = rows.stream().map(this::seedRecord).toList();
        repository.saveAll(records);
    }

    public void recordTicketPurchase(Map<String, Object> props, LocalDateTime ts, String userId) {
        String ticketId = str(props, "ticket_id");
        if (ticketId == null) return;
        VisitorBehaviorRecord record = repository.findFirstBySourceAndTicketIdOrderByUpdatedAtDesc(REALTIME_SOURCE, ticketId)
                .orElseGet(VisitorBehaviorRecord::new);
        if (record.getCreatedAt() == null) record.setCreatedAt(ts);
        record.setUpdatedAt(ts);
        record.setSource(REALTIME_SOURCE);
        record.setVisitorId(userId);
        record.setTicketId(ticketId);
        record.setAttractionName("灵山胜境");
        record.setAttractionType("小程序实时游客");
        record.setAgeBand(Optional.ofNullable(str(props, "age_band")).orElse("未知"));
        record.setGender(Optional.ofNullable(str(props, "gender")).orElse("未知"));
        record.setVisitDate(parseDate(str(props, "visit_date")));
        record.setGroupSize(Math.max(1, (int) Math.round(number(props, "group_size"))));
        record.setTicketCost(number(props, "ticket_cost"));
        record.setFoodCost(nonNull(record.getFoodCost()));
        record.setShoppingCost(nonNull(record.getShoppingCost()));
        record.setTransportCost(nonNull(record.getTransportCost()));
        record.setEntertainmentCost(nonNull(record.getEntertainmentCost()));
        record.setTotalCost(nonNull(record.getTicketCost())
                + nonNull(record.getFoodCost())
                + nonNull(record.getShoppingCost())
                + nonNull(record.getTransportCost())
                + nonNull(record.getEntertainmentCost()));
        repository.save(record);
    }

    public void recordPurchase(Map<String, Object> props, LocalDateTime ts) {
        String ticketId = str(props, "ticket_id");
        if (ticketId == null) return;
        Optional<VisitorBehaviorRecord> found = repository.findFirstBySourceAndTicketIdOrderByUpdatedAtDesc(REALTIME_SOURCE, ticketId);
        if (found.isEmpty()) return;
        VisitorBehaviorRecord record = found.get();
        double amount = number(props, "amount");
        if (amount <= 0) return;
        String category = str(props, "category");
        if ("food".equals(category)) record.setFoodCost(nonNull(record.getFoodCost()) + amount);
        if ("shopping".equals(category)) record.setShoppingCost(nonNull(record.getShoppingCost()) + amount);
        if ("transport".equals(category)) record.setTransportCost(nonNull(record.getTransportCost()) + amount);
        if ("entertainment".equals(category)) record.setEntertainmentCost(nonNull(record.getEntertainmentCost()) + amount);
        String spotId = str(props, "spot_id");
        if (spotId != null) record.setAttractionName(SPOT_NAMES.getOrDefault(spotId, spotId));
        record.setTotalCost(nonNull(record.getTicketCost())
                + nonNull(record.getFoodCost())
                + nonNull(record.getShoppingCost())
                + nonNull(record.getTransportCost())
                + nonNull(record.getEntertainmentCost()));
        record.setUpdatedAt(ts);
        repository.save(record);
    }

    public Map<String, Object> dashboard(String mode) {
        boolean history = "history".equalsIgnoreCase(mode);
        List<VisitorBehaviorRecord> records = history
                ? repository.findBySource(HISTORY_SOURCE)
                : repository.findBySourceAndCreatedAtAfter(REALTIME_SOURCE, LocalDateTime.now().minusHours(24));
        List<AnalyticsEvent> events = history ? List.of() : eventRepository.findByTsAfter(LocalDateTime.now().minusHours(24));
        String normalizedMode = history ? "history" : "realtime";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mode", normalizedMode);
        out.put("sourceLabel", history ? "灵山历史样本" : "实时游客数据");
        out.put("sampleCount", records.size());
        out.put("timeRangeLabel", history ? "2025年灵山相关样本 / " + records.size() + "条" : "近24小时 / 小程序采集");
        out.put("summary", summary(records, events, history));
        out.put("demographics", demographics(records));
        out.put("consumption", consumption(records, history));
        out.put("attractions", attractions(records, events, history));
        out.put("satisfaction", satisfaction(records, events, history));
        return out;
    }

    private Map<String, Object> summary(List<VisitorBehaviorRecord> records, List<AnalyticsEvent> events, boolean history) {
        long visitorCount = records.size();
        double expectedVisitors = records.stream().mapToDouble(r -> Math.max(1, r.getGroupSize() == null ? 1 : r.getGroupSize())).sum();
        double avgSatisfaction = history ? avg(records.stream().map(VisitorBehaviorRecord::getSatisfaction).toList()) : realtimeAvgSatisfaction(events);
        return item(
                "visitorCount", visitorCount,
                "expectedVisitors", round1(expectedVisitors),
                "avgGroupSize", visitorCount == 0 ? 0.0 : round1(expectedVisitors / visitorCount),
                "avgStayHours", avg(records.stream().map(VisitorBehaviorRecord::getStayHours).toList()),
                "avgSpend", avg(records.stream().map(VisitorBehaviorRecord::getTotalCost).toList()),
                "avgSatisfaction", avgSatisfaction,
                "ticketRevenue", round1(records.stream().mapToDouble(r -> nonNull(r.getTicketCost())).sum())
        );
    }

    private Map<String, Object> demographics(List<VisitorBehaviorRecord> records) {
        return item(
                "ageBands", distribution(records.stream().map(VisitorBehaviorRecord::getAgeBand).toList(), "ageBand"),
                "genderDistribution", distribution(records.stream().map(VisitorBehaviorRecord::getGender).toList(), "gender"),
                "groupSizeDistribution", distribution(records.stream()
                        .map(r -> (r.getGroupSize() == null ? 1 : r.getGroupSize()) + "人")
                        .toList(), "groupSize")
        );
    }

    private Map<String, Object> consumption(List<VisitorBehaviorRecord> records, boolean history) {
        double ticket = records.stream().mapToDouble(r -> nonNull(r.getTicketCost())).sum();
        double food = records.stream().mapToDouble(r -> nonNull(r.getFoodCost())).sum();
        double shopping = records.stream().mapToDouble(r -> nonNull(r.getShoppingCost())).sum();
        double transport = records.stream().mapToDouble(r -> nonNull(r.getTransportCost())).sum();
        double entertainment = records.stream().mapToDouble(r -> nonNull(r.getEntertainmentCost())).sum();
        double total = ticket + food + shopping + transport + entertainment;
        List<Map<String, Object>> costMix = List.of(
                costItem("ticket", ticket, total),
                costItem("food", food, total),
                costItem("shopping", shopping, total),
                costItem("transport", transport, total),
                costItem("entertainment", entertainment, total)
        );
        return item(
                "totalAmount", round1(total),
                "avgPerVisitor", records.isEmpty() ? 0.0 : round1(total / records.size()),
                "costMix", costMix,
                "topCategories", costMix.stream()
                        .sorted((a, b) -> Double.compare(((Number) b.get("amount")).doubleValue(), ((Number) a.get("amount")).doubleValue()))
                        .toList(),
                "trend", consumptionTrend(records, history)
        );
    }

    private Map<String, Object> attractions(List<VisitorBehaviorRecord> records, List<AnalyticsEvent> events, boolean history) {
        if (!history) {
            return item(
                    "visits", eventTargetRank(events, "spot_enter"),
                    "dwellRanking", eventDwellRank(events)
            );
        }
        Map<String, List<VisitorBehaviorRecord>> grouped = records.stream()
                .collect(Collectors.groupingBy(r -> Optional.ofNullable(r.getAttractionName()).orElse("未知")));
        List<Map<String, Object>> visits = grouped.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .map(e -> item(
                        "name", e.getKey(),
                        "count", e.getValue().size(),
                        "avgStayHours", avg(e.getValue().stream().map(VisitorBehaviorRecord::getStayHours).toList())
                ))
                .toList();
        List<Map<String, Object>> dwellRanking = visits.stream()
                .sorted((a, b) -> Double.compare(((Number) b.get("avgStayHours")).doubleValue(), ((Number) a.get("avgStayHours")).doubleValue()))
                .toList();
        return item("visits", visits, "dwellRanking", dwellRanking);
    }

    private Map<String, Object> satisfaction(List<VisitorBehaviorRecord> records, List<AnalyticsEvent> events, boolean history) {
        if (!history) {
            return item(
                    "distribution", realtimeSatisfactionDistribution(events),
                    "lowSatisfactionItems", realtimeLowSatisfaction(events),
                    "spotFeedback", realtimeSpotFeedback(events)
            );
        }
        List<Map<String, Object>> distribution = records.stream()
                .map(VisitorBehaviorRecord::getSatisfaction)
                .filter(Objects::nonNull)
                .map(value -> String.valueOf(Math.round(value)))
                .collect(Collectors.groupingBy(s -> s, TreeMap::new, Collectors.counting()))
                .entrySet().stream()
                .map(e -> item("score", e.getKey(), "count", e.getValue()))
                .toList();
        Map<String, DoubleSummaryStatistics> byAttraction = records.stream()
                .filter(r -> r.getSatisfaction() != null)
                .collect(Collectors.groupingBy(
                        r -> Optional.ofNullable(r.getAttractionName()).orElse("未知"),
                        Collectors.summarizingDouble(VisitorBehaviorRecord::getSatisfaction)
                ));
        List<Map<String, Object>> low = byAttraction.entrySet().stream()
                .filter(e -> e.getValue().getAverage() < 65)
                .map(e -> item("name", e.getKey(), "reason", "历史样本满意度偏低", "score", round1(e.getValue().getAverage())))
                .toList();
        return item("distribution", distribution, "lowSatisfactionItems", low, "spotFeedback", List.of());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> readSeedRows() {
        ClassPathResource resource = new ClassPathResource(SEED_PATH);
        try (InputStream input = resource.getInputStream()) {
            return mapper.readValue(input, new TypeReference<>() {});
        } catch (IOException error) {
            throw new UncheckedIOException("Failed to read visitor behavior seed: " + SEED_PATH, error);
        }
    }

    private VisitorBehaviorRecord seedRecord(Map<String, Object> row) {
        VisitorBehaviorRecord record = new VisitorBehaviorRecord();
        record.setSource(HISTORY_SOURCE);
        record.setVisitorId(str(row, "visitorId"));
        record.setTicketId(str(row, "ticketId"));
        record.setAttractionName(str(row, "attractionName"));
        record.setAttractionType(str(row, "attractionType"));
        record.setAgeBand(str(row, "ageBand"));
        record.setGender(str(row, "gender"));
        record.setVisitDate(parseDate(str(row, "visitDate")));
        record.setStayHours(number(row, "stayHours"));
        record.setTicketCost(number(row, "ticketCost"));
        record.setFoodCost(number(row, "foodCost"));
        record.setShoppingCost(number(row, "shoppingCost"));
        record.setTransportCost(number(row, "transportCost"));
        record.setEntertainmentCost(number(row, "entertainmentCost"));
        record.setTotalCost(number(row, "totalCost"));
        record.setGroupSize((int) Math.round(Math.max(1, number(row, "groupSize"))));
        record.setSatisfaction(number(row, "satisfaction"));
        LocalDateTime now = LocalDateTime.now();
        record.setCreatedAt(now);
        record.setUpdatedAt(now);
        return record;
    }

    private List<Map<String, Object>> distribution(List<String> values, String keyName) {
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> item(keyName, e.getKey(), "label", e.getKey(), "count", e.getValue()))
                .toList();
    }

    private List<Map<String, Object>> consumptionTrend(List<VisitorBehaviorRecord> records, boolean history) {
        DateTimeFormatter formatter = history ? DateTimeFormatter.ofPattern("yyyy-MM") : DateTimeFormatter.ofPattern("HH:00");
        Map<String, DoubleSummaryStatistics> grouped = new TreeMap<>();
        for (VisitorBehaviorRecord record : records) {
            String bucket = history
                    ? (record.getVisitDate() == null ? "未知" : record.getVisitDate().format(formatter))
                    : (record.getCreatedAt() == null ? "未知" : record.getCreatedAt().format(formatter));
            grouped.computeIfAbsent(bucket, k -> new DoubleSummaryStatistics()).accept(nonNull(record.getTotalCost()));
        }
        return grouped.entrySet().stream()
                .map(e -> item("bucket", e.getKey(), "amount", round1(e.getValue().getSum()), "count", e.getValue().getCount()))
                .toList();
    }

    private Map<String, Object> costItem(String category, double amount, double total) {
        return item(
                "category", category,
                "label", PURCHASE_CATEGORY_NAMES.getOrDefault(category, category),
                "amount", round1(amount),
                "share", total <= 0 ? 0.0 : round4(amount / total)
        );
    }

    private List<Map<String, Object>> eventTargetRank(List<AnalyticsEvent> events, String eventName) {
        return events.stream()
                .filter(e -> eventName.equals(e.getEvent()) && e.getTargetId() != null)
                .collect(Collectors.groupingBy(AnalyticsEvent::getTargetId, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(e -> item("spotId", e.getKey(), "name", SPOT_NAMES.getOrDefault(e.getKey(), e.getKey()), "count", e.getValue()))
                .toList();
    }

    private List<Map<String, Object>> eventDwellRank(List<AnalyticsEvent> events) {
        Map<String, DoubleSummaryStatistics> stats = events.stream()
                .filter(e -> "spot_leave".equals(e.getEvent()) && e.getTargetId() != null)
                .collect(Collectors.groupingBy(AnalyticsEvent::getTargetId, Collectors.summarizingDouble(e -> numberFromJson(e, "dwell_ms") / 1000.0)));
        return stats.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue().getAverage(), a.getValue().getAverage()))
                .limit(8)
                .map(e -> item("spotId", e.getKey(), "name", SPOT_NAMES.getOrDefault(e.getKey(), e.getKey()), "avgSeconds", round1(e.getValue().getAverage())))
                .toList();
    }

    private double realtimeAvgSatisfaction(List<AnalyticsEvent> events) {
        List<Double> scores = new ArrayList<>();
        for (AnalyticsEvent event : events) {
            if ("rate_route".equals(event.getEvent()) && event.getRatingValue() != null) {
                scores.add((event.getRatingValue() - 1) / 4.0 * 100.0);
            }
            if ("rate_spot".equals(event.getEvent()) && event.getRatingValue() != null) {
                scores.add(event.getRatingValue() > 0 ? 100.0 : 0.0);
            }
        }
        return avg(scores);
    }

    private List<Map<String, Object>> realtimeSatisfactionDistribution(List<AnalyticsEvent> events) {
        Map<String, Long> grouped = new LinkedHashMap<>();
        grouped.put("好评", events.stream().filter(e -> "rate_spot".equals(e.getEvent()) && e.getRatingValue() != null && e.getRatingValue() > 0).count());
        grouped.put("差评", events.stream().filter(e -> "rate_spot".equals(e.getEvent()) && e.getRatingValue() != null && e.getRatingValue() < 0).count());
        grouped.put("路线评分", events.stream().filter(e -> "rate_route".equals(e.getEvent())).count());
        return grouped.entrySet().stream().map(e -> item("score", e.getKey(), "count", e.getValue())).toList();
    }

    private List<Map<String, Object>> realtimeSpotFeedback(List<AnalyticsEvent> events) {
        Map<String, long[]> stats = new HashMap<>();
        for (AnalyticsEvent e : events) {
            if (!"rate_spot".equals(e.getEvent()) || e.getTargetId() == null || e.getRatingValue() == null) continue;
            long[] row = stats.computeIfAbsent(e.getTargetId(), k -> new long[2]);
            if (e.getRatingValue() > 0) row[0]++; else row[1]++;
        }
        return stats.entrySet().stream()
                .map(e -> item("spotId", e.getKey(), "name", SPOT_NAMES.getOrDefault(e.getKey(), e.getKey()), "likes", e.getValue()[0], "dislikes", e.getValue()[1]))
                .toList();
    }

    private List<Map<String, Object>> realtimeLowSatisfaction(List<AnalyticsEvent> events) {
        return realtimeSpotFeedback(events).stream()
                .filter(item -> ((Number) item.get("dislikes")).longValue() > 0)
                .map(item -> item("name", item.get("name"), "reason", "实时点踩反馈", "score", item.get("dislikes")))
                .toList();
    }

    private double numberFromJson(AnalyticsEvent event, String key) {
        try {
            Map<String, Object> props = mapper.readValue(event.getProperties() == null ? "{}" : event.getProperties(), new TypeReference<>() {});
            Object value = props.get(key);
            return value instanceof Number n ? n.doubleValue() : 0.0;
        } catch (Exception ignored) {
            return 0.0;
        }
    }

    private static LocalDate parseDate(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            return LocalDate.parse(text);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String str(Map<String, Object> props, String key) {
        Object value = props.get(key);
        return value instanceof String s && !s.isBlank() ? s : null;
    }

    private static double number(Map<String, Object> props, String key) {
        Object value = props.get(key);
        return value instanceof Number n ? n.doubleValue() : 0.0;
    }

    private static double nonNull(Double value) {
        return value == null ? 0.0 : value;
    }

    private static double avg(List<Double> values) {
        List<Double> filtered = values.stream().filter(Objects::nonNull).toList();
        return filtered.isEmpty() ? 0.0 : round1(filtered.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
    }

    private static Map<String, Object> item(Object... values) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i + 1 < values.length; i += 2) out.put(String.valueOf(values[i]), values[i + 1]);
        return out;
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private static double round4(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }
}
