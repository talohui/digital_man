package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Predicate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final List<String> GUIDE_TAGS = List.of("亲子游", "文化探秘", "祈福静心", "轻松漫步", "拍照打卡");
    private static final Map<String, String> ROUTE_NAMES = Map.of(
            "historical_culture", "历史文化路线",
            "natural_scenery", "自然风光路线",
            "family", "亲子轻游路线"
    );
    private static final Map<String, String> TICKET_TYPE_NAMES = Map.of(
            "standard", "标准票",
            "family", "亲子套票",
            "culture", "文化深度票",
            "blessing", "祈福体验票",
            "leisure", "轻松漫步票"
    );
    private static final Map<String, String> PURCHASE_CATEGORY_NAMES = Map.of(
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
    private static final Map<String, List<String>> INTENT_KEYWORDS = Map.of(
            "景点介绍", List.of("介绍", "讲讲", "是什么", "历史", "文化", "建筑", "大佛", "梵宫", "坛城"),
            "路线推荐", List.of("路线", "怎么走", "推荐", "先去", "游览", "安排", "攻略"),
            "祈福礼佛", List.of("祈福", "礼佛", "拜佛", "许愿", "禅", "静心", "寺"),
            "亲子游玩", List.of("孩子", "亲子", "小朋友", "带娃", "宝宝"),
            "拍照打卡", List.of("拍照", "打卡", "出片", "风景", "机位"),
            "交通位置", List.of("在哪", "位置", "入口", "出口", "停车", "怎么去", "几点", "时间")
    );
    private static final List<String> NEGATIVE_WORDS = List.of("不好", "差", "慢", "等太久", "失望", "难找", "不准", "没用", "卡", "失败");
    private static final Pattern CHINESE_TOKEN = Pattern.compile("[\\u4e00-\\u9fa5]{2,}");
    private static final double MAX_REASONABLE_LATENCY_MS = 120_000.0;

    private final EventRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    public DashboardService(EventRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> overview() {
        return overview(5);
    }

    public Map<String, Object> overview(int activeWindowMinutes) {
        int activeWindow = normalizeActiveWindowMinutes(activeWindowMinutes);
        List<AnalyticsEvent> today = todayEvents();
        List<Double> lats = latencies(today);
        long totalMessages = count(today, "user_message");
        long voiceStartCount = count(today, "voice_start");
        long voiceMessageCount = today.stream().filter(e -> "user_message".equals(e.getEvent()) && Boolean.TRUE.equals(e.getIsVoice())).count();
        Map<String, Long> feedbackSentiment = feedbackSentiment(today);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalMessages", totalMessages);
        out.put("totalAiReplies", count(today, "ai_reply"));
        out.put("activeSessions5min", activeSessions(activeWindow));
        out.put("activeWindowMinutes", activeWindow);
        out.put("positiveRatio", ratio(today.stream().filter(e -> "positive".equals(e.getSentiment())).count(), totalMessages));
        out.put("avgLatencyMs", avg(lats));
        out.put("p90LatencyMs", percentile(lats, 0.90));
        out.put("quickAskCount", count(today, "quick_ask"));
        out.put("voiceUseCount", Math.max(voiceStartCount, voiceMessageCount));
        out.put("routeClickCount", count(today, "route_click"));
        out.put("feedbackCount", count(today, "rate_route") + count(today, "rate_spot"));
        out.put("feedbackPositiveCount", feedbackSentiment.get("positive"));
        out.put("feedbackNegativeCount", feedbackSentiment.get("negative"));
        out.put("feedbackNeutralCount", feedbackSentiment.get("neutral"));
        return out;
    }

    public Map<String, Object> chatInsights() {
        List<AnalyticsEvent> events = todayEvents();
        List<String> questions = events.stream()
                .filter(e -> "user_message".equals(e.getEvent()) || "quick_ask".equals(e.getEvent()))
                .map(this::questionText)
                .filter(s -> s != null && !s.isBlank())
                .toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("topQuestions", topQuestionTopics(questions, 10));
        out.put("keywordStats", keywordStats(questions, 20));
        out.put("intentDistribution", intentDistribution(questions));
        out.put("spotMentionStats", spotMentionStats(questions));
        out.put("negativeQuestionCount", questions.stream().filter(this::hasNegativeWord).count());
        return out;
    }

    public Map<String, Object> behavior() {
        List<AnalyticsEvent> events = todayEvents();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("routeClicks", rankByTarget(events, e -> "route_click".equals(e.getEvent()), ROUTE_NAMES, "routeId", 8));
        out.put("spotVisits", rankByTarget(events, e -> "spot_enter".equals(e.getEvent()), SPOT_NAMES, "spotId", 10));
        out.put("spotDwellAvg", dwellAverage(events));
        out.put("routeRatings", ratings(events, "rate_route", ROUTE_NAMES, "routeId"));
        out.put("spotFeedback", spotFeedback(events));
        out.put("lowSatisfactionItems", lowSatisfactionItems(events));
        return out;
    }

    public Map<String, Object> ticketing() {
        List<AnalyticsEvent> tickets = todayEvents().stream()
                .filter(e -> "ticket_purchase".equals(e.getEvent()))
                .toList();
        long ticketCount = tickets.size();
        double expectedVisitors = tickets.stream().mapToDouble(e -> Math.max(1.0, numberProp(e, "group_size"))).sum();
        double ticketRevenue = tickets.stream().mapToDouble(e -> numberProp(e, "ticket_cost")).sum();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("ticketCount", ticketCount);
        out.put("expectedVisitors", round1(expectedVisitors));
        out.put("avgGroupSize", ticketCount <= 0 ? 0.0 : round1(expectedVisitors / ticketCount));
        out.put("ticketRevenue", round1(ticketRevenue));
        out.put("visitDateDistribution", distributionByStringProp(tickets, "visit_date", Map.of(), "visitDate"));
        out.put("ageBands", distributionByStringProp(tickets, "age_band", Map.of(), "ageBand"));
        out.put("genderDistribution", distributionByStringProp(tickets, "gender", Map.of(), "gender"));
        out.put("groupSizeDistribution", distributionByNumberProp(tickets, "group_size", "groupSize"));
        out.put("ticketTypes", distributionByStringProp(tickets, "ticket_type", TICKET_TYPE_NAMES, "ticketType"));
        return out;
    }

    public Map<String, Object> consumption() {
        List<AnalyticsEvent> purchases = todayEvents().stream()
                .filter(e -> "purchase".equals(e.getEvent()))
                .toList();
        double totalAmount = purchases.stream().mapToDouble(e -> numberProp(e, "amount")).sum();
        long purchaseCount = purchases.size();
        long payingTickets = purchases.stream()
                .map(e -> stringProp(e, "ticket_id"))
                .filter(Objects::nonNull)
                .distinct()
                .count();

        Map<String, DoubleSummaryStatistics> categoryStats = purchases.stream()
                .collect(Collectors.groupingBy(
                        e -> Optional.ofNullable(stringProp(e, "category")).orElse("unknown"),
                        LinkedHashMap::new,
                        Collectors.summarizingDouble(e -> numberProp(e, "amount"))
                ));
        List<Map<String, Object>> costMix = PURCHASE_CATEGORY_NAMES.entrySet().stream()
                .map(entry -> {
                    DoubleSummaryStatistics stat = categoryStats.getOrDefault(entry.getKey(), new DoubleSummaryStatistics());
                    double amount = stat.getSum();
                    return item(
                            "category", entry.getKey(),
                            "label", entry.getValue(),
                            "amount", round1(amount),
                            "count", stat.getCount(),
                            "share", totalAmount <= 0 ? 0.0 : round4(amount / totalAmount)
                    );
                })
                .toList();
        List<Map<String, Object>> topCategories = costMix.stream()
                .sorted((a, b) -> Double.compare(((Number) b.get("amount")).doubleValue(), ((Number) a.get("amount")).doubleValue()))
                .toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("purchaseCount", purchaseCount);
        out.put("totalAmount", round1(totalAmount));
        out.put("avgPerPurchase", purchaseCount <= 0 ? 0.0 : round1(totalAmount / purchaseCount));
        out.put("avgPerTicket", payingTickets <= 0 ? 0.0 : round1(totalAmount / payingTickets));
        out.put("costMix", costMix);
        out.put("topCategories", topCategories);
        out.put("trend", purchaseTrend(purchases));
        out.put("recentPurchases", recentPurchases(purchases));
        return out;
    }


    public Map<String, Object> recommendation() {
        List<AnalyticsEvent> events = todayEvents();
        Map<String, Long> exposures = new HashMap<>();
        Map<String, Long> clicks = new HashMap<>();
        Map<String, Long> engines = new LinkedHashMap<>();

        for (AnalyticsEvent event : events) {
            if (!"recommend_exposure".equals(event.getEvent()) && !"recommend_click".equals(event.getEvent())) continue;
            String routeId = routeId(event);
            if (routeId == null) continue;
            String engine = Optional.ofNullable(stringProp(event, "engine")).orElse("unknown");
            engines.merge(engine, 1L, Long::sum);
            if ("recommend_exposure".equals(event.getEvent())) exposures.merge(routeId, 1L, Long::sum);
            if ("recommend_click".equals(event.getEvent())) clicks.merge(routeId, 1L, Long::sum);
        }

        long exposureCount = exposures.values().stream().mapToLong(Long::longValue).sum();
        long clickCount = clicks.values().stream().mapToLong(Long::longValue).sum();
        Set<String> routeIds = new HashSet<>();
        routeIds.addAll(exposures.keySet());
        routeIds.addAll(clicks.keySet());

        List<Map<String, Object>> topRoutes = routeIds.stream()
                .sorted((a, b) -> {
                    int byClicks = Long.compare(clicks.getOrDefault(b, 0L), clicks.getOrDefault(a, 0L));
                    if (byClicks != 0) return byClicks;
                    return Long.compare(exposures.getOrDefault(b, 0L), exposures.getOrDefault(a, 0L));
                })
                .limit(8)
                .map(routeId -> item(
                        "routeId", routeId,
                        "name", ROUTE_NAMES.getOrDefault(routeId, routeId),
                        "exposureCount", exposures.getOrDefault(routeId, 0L),
                        "clickCount", clicks.getOrDefault(routeId, 0L),
                        "ctr", ratio(clicks.getOrDefault(routeId, 0L), exposures.getOrDefault(routeId, 0L))
                ))
                .toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("exposureCount", exposureCount);
        out.put("clickCount", clickCount);
        out.put("ctr", ratio(clickCount, exposureCount));
        out.put("engineDistribution", engines.entrySet().stream()
                .map(e -> item("engine", e.getKey(), "count", e.getValue()))
                .toList());
        out.put("topRoutes", topRoutes);
        return out;
    }

    public Map<String, Object> persona() {
        List<AnalyticsEvent> events = todayEvents();
        Map<String, Long> distribution = new LinkedHashMap<>();
        GUIDE_TAGS.forEach(tag -> distribution.put(tag, 0L));
        for (AnalyticsEvent event : events) {
            if ("preference_update".equals(event.getEvent())) {
                for (String tag : selectedTags(event)) distribution.merge(tag, 1L, Long::sum);
            } else if ("tag_toggle".equals(event.getEvent()) && Boolean.TRUE.equals(prop(event, "on"))) {
                String tag = stringProp(event, "tag");
                if (GUIDE_TAGS.contains(tag)) distribution.merge(tag, 1L, Long::sum);
            }
        }
        List<Map<String, Object>> selectedTagDistribution = distribution.entrySet().stream()
                .map(e -> item("tag", e.getKey(), "count", e.getValue()))
                .toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("selectedTagDistribution", selectedTagDistribution);
        out.put("tagTrend", tagTrend(events));
        out.put("personaSummary", selectedTagDistribution);
        return out;
    }

    public Map<String, Object> serviceQuality() {
        List<AnalyticsEvent> events = repository.findByTsAfter(LocalDateTime.now().minusHours(24));
        List<Double> lats = latencies(events);
        long voiceStart = count(events, "voice_start");
        long voiceEnd = count(events, "voice_end");
        long aiReplies = count(events, "ai_reply");
        long userMessages = count(events, "user_message");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("p50LatencyMs", percentile(lats, 0.50));
        out.put("p90LatencyMs", percentile(lats, 0.90));
        out.put("maxLatencyMs", lats.isEmpty() ? 0.0 : round1(lats.get(lats.size() - 1)));
        out.put("avgLatencyMs", avg(lats));
        out.put("voiceStartCount", voiceStart);
        out.put("voiceEndCount", voiceEnd);
        out.put("voiceCompletionRate", ratio(voiceEnd, voiceStart));
        out.put("aiReplyCount", aiReplies);
        out.put("userMessageCount", userMessages);
        out.put("estimatedAnswerRate", Math.min(1.0, ratio(aiReplies, userMessages)));
        out.put("recentSlowReplies", recentSlowReplies(events));
        return out;
    }

    public Map<String, Object> realtime() {
        return realtime(5);
    }

    public Map<String, Object> realtime(int activeWindowMinutes) {
        int activeWindow = normalizeActiveWindowMinutes(activeWindowMinutes);
        List<AnalyticsEvent> recent = repository.findByTsAfterOrderByTsDesc(LocalDateTime.now().minusMinutes(30));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("activeSessions5min", activeSessions(activeWindow));
        out.put("activeWindowMinutes", activeWindow);
        out.put("recentEvents", recent.stream().limit(16).map(this::eventRow).toList());
        out.put("alerts", alerts(recent));
        return out;
    }

    private List<AnalyticsEvent> todayEvents() {
        return repository.findByTsAfter(LocalDateTime.now().minusHours(24));
    }

    private long activeSessions(int minutes) {
        return repository.findByTsAfter(LocalDateTime.now().minusMinutes(minutes)).stream()
                .map(AnalyticsEvent::getSessionId)
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .count();
    }

    private int normalizeActiveWindowMinutes(int minutes) {
        return Math.max(1, Math.min(120, minutes));
    }

    private Map<String, Long> feedbackSentiment(List<AnalyticsEvent> events) {
        long positive = 0;
        long negative = 0;
        long neutral = 0;

        for (AnalyticsEvent event : events) {
            if (!"rate_route".equals(event.getEvent()) && !"rate_spot".equals(event.getEvent())) continue;
            Double value = event.getRatingValue();
            if (value == null) {
                neutral++;
            } else if ("rate_route".equals(event.getEvent())) {
                if (value >= 4.0) positive++;
                else if (value <= 2.0) negative++;
                else neutral++;
            } else if (value > 0) {
                positive++;
            } else if (value < 0) {
                negative++;
            } else {
                neutral++;
            }
        }

        Map<String, Long> out = new LinkedHashMap<>();
        out.put("positive", positive);
        out.put("negative", negative);
        out.put("neutral", neutral);
        return out;
    }

    private List<Double> latencies(List<AnalyticsEvent> events) {
        return events.stream()
                .filter(e -> "ai_reply".equals(e.getEvent()) && e.getLatencyMs() != null)
                .filter(e -> validLatency(e.getLatencyMs()))
                .map(AnalyticsEvent::getLatencyMs)
                .sorted()
                .toList();
    }

    private long count(List<AnalyticsEvent> events, String event) {
        return events.stream().filter(e -> event.equals(e.getEvent())).count();
    }

    private List<Map<String, Object>> topStrings(List<String> values, String keyName, int limit) {
        return values.stream().map(String::trim).filter(s -> !s.isBlank())
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
                .entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit).map(e -> item(keyName, desensitize(e.getKey()), "count", e.getValue())).toList();
    }

    private List<Map<String, Object>> topQuestionTopics(List<String> questions, int limit) {
        Map<String, Long> counts = new HashMap<>();
        for (String question : questions) {
            String topic = questionTopic(question);
            if (topic != null && !topic.isBlank()) counts.merge(topic, 1L, Long::sum);
        }
        return counts.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit).map(e -> item("question", e.getKey(), "count", e.getValue())).toList();
    }

    private String questionTopic(String question) {
        if (question == null) return "";
        String text = desensitize(question).trim();
        String spot = mentionedSpotName(text);

        if (containsAny(text, List.of("多高", "高度", "几米", "多少米"))) {
            return spot == null ? "景点高度咨询" : spot + "高度咨询";
        }
        if (containsAny(text, List.of("几点", "时间", "开放", "开始", "演出", "表演", "什么时候"))) {
            return spot == null ? "开放演出时间咨询" : spot + "时间/演出咨询";
        }
        if (containsAny(text, List.of("怎么走", "怎么去", "过去", "在哪", "哪里", "位置", "入口", "出口", "路线"))) {
            if (containsAny(text, List.of("停车", "车位", "停车场"))) return "停车交通咨询";
            return spot == null ? "路线位置咨询" : spot + "路线位置咨询";
        }
        if (containsAny(text, List.of("门票", "票价", "买票", "预约", "入园", "检票"))) return "门票入园咨询";
        if (containsAny(text, List.of("停车", "车位", "停车场"))) return "停车交通咨询";
        if (containsAny(text, List.of("吃", "餐饮", "素面", "饭", "茶", "饮品"))) return "餐饮茶歇咨询";
        if (containsAny(text, List.of("文创", "纪念品", "商店", "购物", "买"))) return "文创购物咨询";
        if (containsAny(text, List.of("祈福", "许愿", "拜佛", "礼佛", "香", "祈福牌"))) return "祈福礼佛咨询";
        if (containsAny(text, List.of("亲子", "孩子", "小朋友", "带娃", "宝宝"))) return "亲子路线咨询";
        if (containsAny(text, List.of("拍照", "打卡", "出片", "机位"))) return "拍照打卡咨询";
        if (spot != null) return spot + "介绍咨询";

        String intent = INTENT_KEYWORDS.entrySet().stream()
                .filter(e -> containsAny(text, e.getValue()))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
        if (intent != null) return intent + "咨询";

        return compactQuestionText(text);
    }

    private String mentionedSpotName(String text) {
        if (text == null) return null;
        for (String name : SPOT_NAMES.values()) if (text.contains(name)) return name;
        if (text.contains("大佛")) return "灵山大佛";
        if (text.contains("梵宫")) return "梵宫";
        if (text.contains("坛城") || text.contains("五印")) return "五印坛城";
        if (text.contains("九龙")) return "九龙灌浴";
        if (text.contains("祥符") || text.contains("寺")) return "祥符禅寺";
        return null;
    }

    private String compactQuestionText(String text) {
        String compact = text.replaceAll("[\\s，。！？、,.!?：:；;“”\"'（）()【】\\[\\]]+", "")
                .replaceAll("^(请问|想问|问一下|麻烦问下)", "")
                .replaceAll("(吗|呢|啊|呀|吧)$", "");
        if (compact.length() > 12) compact = compact.substring(0, 12);
        return compact.isBlank() ? "其他咨询" : compact;
    }

    private List<Map<String, Object>> keywordStats(List<String> questions, int limit) {
        Map<String, Long> counts = new HashMap<>();
        for (String question : questions) {
            Matcher matcher = CHINESE_TOKEN.matcher(question);
            while (matcher.find()) {
                String token = matcher.group();
                if (token.length() > 8) token = token.substring(0, 8);
                if (!isStopWord(token)) counts.merge(token, 1L, Long::sum);
            }
        }
        return counts.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit).map(e -> item("keyword", e.getKey(), "count", e.getValue())).toList();
    }

    private List<Map<String, Object>> intentDistribution(List<String> questions) {
        Map<String, Long> counts = new LinkedHashMap<>();
        INTENT_KEYWORDS.keySet().forEach(intent -> counts.put(intent, 0L));
        counts.put("其他", 0L);
        for (String question : questions) {
            String intent = INTENT_KEYWORDS.entrySet().stream().filter(e -> containsAny(question, e.getValue()))
                    .map(Map.Entry::getKey).findFirst().orElse("其他");
            counts.merge(intent, 1L, Long::sum);
        }
        return counts.entrySet().stream().map(e -> item("type", e.getKey(), "value", e.getValue())).toList();
    }

    private List<Map<String, Object>> spotMentionStats(List<String> questions) {
        Map<String, Long> counts = new HashMap<>();
        for (String question : questions) {
            for (String name : SPOT_NAMES.values()) if (question.contains(name)) counts.merge(name, 1L, Long::sum);
            if (question.contains("大佛")) counts.merge("灵山大佛", 1L, Long::sum);
        }
        return counts.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10).map(e -> item("spot", e.getKey(), "count", e.getValue())).toList();
    }

    private List<Map<String, Object>> rankByTarget(List<AnalyticsEvent> events, Predicate<AnalyticsEvent> filter, Map<String, String> names, String idKey, int limit) {
        return events.stream().filter(filter).map(AnalyticsEvent::getTargetId).filter(Objects::nonNull)
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
                .entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit).map(e -> item(idKey, e.getKey(), "name", names.getOrDefault(e.getKey(), e.getKey()), "count", e.getValue())).toList();
    }

    private List<Map<String, Object>> dwellAverage(List<AnalyticsEvent> events) {
        Map<String, DoubleSummaryStatistics> stats = events.stream().filter(e -> "spot_leave".equals(e.getEvent())).filter(e -> e.getTargetId() != null)
                .collect(Collectors.groupingBy(AnalyticsEvent::getTargetId, Collectors.summarizingDouble(e -> numberProp(e, "dwell_ms") / 1000.0)));
        return stats.entrySet().stream().filter(e -> e.getValue().getCount() > 0)
                .sorted((a, b) -> Double.compare(b.getValue().getAverage(), a.getValue().getAverage()))
                .limit(8).map(e -> item("spotId", e.getKey(), "name", SPOT_NAMES.getOrDefault(e.getKey(), e.getKey()), "avgSeconds", round1(e.getValue().getAverage()))).toList();
    }

    private List<Map<String, Object>> ratings(List<AnalyticsEvent> events, String eventName, Map<String, String> names, String idKey) {
        Map<String, DoubleSummaryStatistics> stats = events.stream()
                .filter(e -> eventName.equals(e.getEvent()) && e.getTargetId() != null && e.getRatingValue() != null)
                .collect(Collectors.groupingBy(AnalyticsEvent::getTargetId, Collectors.summarizingDouble(AnalyticsEvent::getRatingValue)));
        return stats.entrySet().stream().sorted((a, b) -> Double.compare(b.getValue().getAverage(), a.getValue().getAverage()))
                .limit(8).map(e -> item(idKey, e.getKey(), "name", names.getOrDefault(e.getKey(), e.getKey()), "avgRating", round1(e.getValue().getAverage()), "count", e.getValue().getCount())).toList();
    }

    private List<Map<String, Object>> spotFeedback(List<AnalyticsEvent> events) {
        Map<String, long[]> stats = new HashMap<>();
        for (AnalyticsEvent e : events) {
            if (!"rate_spot".equals(e.getEvent()) || e.getTargetId() == null || e.getRatingValue() == null) continue;
            long[] row = stats.computeIfAbsent(e.getTargetId(), k -> new long[2]);
            if (e.getRatingValue() > 0) row[0]++; else row[1]++;
        }
        return stats.entrySet().stream().sorted((a, b) -> Long.compare((b.getValue()[0] + b.getValue()[1]), (a.getValue()[0] + a.getValue()[1])))
                .limit(10).map(e -> item("spotId", e.getKey(), "name", SPOT_NAMES.getOrDefault(e.getKey(), e.getKey()), "likes", e.getValue()[0], "dislikes", e.getValue()[1])).toList();
    }

    private List<Map<String, Object>> lowSatisfactionItems(List<AnalyticsEvent> events) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map<String, Object> rating : ratings(events, "rate_route", ROUTE_NAMES, "routeId")) {
            Number avg = (Number) rating.get("avgRating");
            if (avg != null && avg.doubleValue() < 3.5) rows.add(item("name", rating.get("name"), "reason", "路线评分偏低", "score", avg));
        }
        for (Map<String, Object> feedback : spotFeedback(events)) {
            long dislikes = ((Number) feedback.get("dislikes")).longValue();
            long likes = ((Number) feedback.get("likes")).longValue();
            if (dislikes > 0 && dislikes >= likes) rows.add(item("name", feedback.get("name"), "reason", "点踩反馈偏高", "score", dislikes));
        }
        return rows.stream().limit(8).toList();
    }

    private List<Map<String, Object>> distributionByStringProp(List<AnalyticsEvent> events, String propKey, Map<String, String> labels, String idKey) {
        return events.stream()
                .map(e -> stringProp(e, propKey))
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(s -> s, LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> item(
                        idKey, e.getKey(),
                        "label", labels.getOrDefault(e.getKey(), e.getKey()),
                        "count", e.getValue()
                ))
                .toList();
    }

    private List<Map<String, Object>> distributionByNumberProp(List<AnalyticsEvent> events, String propKey, String idKey) {
        return events.stream()
                .map(e -> (int) Math.max(1, Math.round(numberProp(e, propKey))))
                .collect(Collectors.groupingBy(n -> n, TreeMap::new, Collectors.counting()))
                .entrySet().stream()
                .map(e -> item(
                        idKey, e.getKey(),
                        "label", e.getKey() + "人",
                        "count", e.getValue()
                ))
                .toList();
    }

    private List<Map<String, Object>> purchaseTrend(List<AnalyticsEvent> purchases) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:00");
        Map<String, DoubleSummaryStatistics> grouped = purchases.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getTs().format(fmt),
                        TreeMap::new,
                        Collectors.summarizingDouble(e -> numberProp(e, "amount"))
                ));
        return grouped.entrySet().stream()
                .map(e -> item("hour", e.getKey(), "amount", round1(e.getValue().getSum()), "count", e.getValue().getCount()))
                .toList();
    }

    private List<Map<String, Object>> recentPurchases(List<AnalyticsEvent> purchases) {
        return purchases.stream()
                .sorted(Comparator.comparing(AnalyticsEvent::getTs).reversed())
                .limit(8)
                .map(e -> {
                    String category = Optional.ofNullable(stringProp(e, "category")).orElse("unknown");
                    String spotId = stringProp(e, "spot_id");
                    String routeId = stringProp(e, "route_id");
                    return item(
                            "timestamp", e.getTs().toString(),
                            "category", category,
                            "label", PURCHASE_CATEGORY_NAMES.getOrDefault(category, category),
                            "amount", round1(numberProp(e, "amount")),
                            "spotName", spotId == null ? "" : SPOT_NAMES.getOrDefault(spotId, spotId),
                            "routeName", routeId == null ? "" : ROUTE_NAMES.getOrDefault(routeId, routeId)
                    );
                })
                .toList();
    }

    private List<Map<String, Object>> tagTrend(List<AnalyticsEvent> events) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:00");
        Map<String, Map<String, Long>> grouped = new TreeMap<>();
        for (AnalyticsEvent e : events) {
            if (!"preference_update".equals(e.getEvent())) continue;
            String hour = e.getTs().format(fmt);
            Map<String, Long> row = grouped.computeIfAbsent(hour, h -> new LinkedHashMap<>());
            GUIDE_TAGS.forEach(tag -> row.putIfAbsent(tag, 0L));
            for (String tag : selectedTags(e)) row.merge(tag, 1L, Long::sum);
        }
        List<Map<String, Object>> out = new ArrayList<>();
        grouped.forEach((hour, row) -> row.forEach((tag, count) -> out.add(item("hour", hour, "tag", tag, "count", count))));
        return out;
    }

    private List<Map<String, Object>> recentSlowReplies(List<AnalyticsEvent> events) {
        return events.stream().filter(e -> "ai_reply".equals(e.getEvent()) && e.getLatencyMs() != null)
                .filter(e -> validLatency(e.getLatencyMs()))
                .sorted(Comparator.comparing(AnalyticsEvent::getTs).reversed()).filter(e -> e.getLatencyMs() >= 3000)
                .limit(8).map(e -> item("timestamp", e.getTs().toString(), "latencyMs", round1(e.getLatencyMs()), "sessionId", safeId(e.getSessionId()))).toList();
    }

    private List<Map<String, Object>> alerts(List<AnalyticsEvent> recent) {
        List<Map<String, Object>> alerts = new ArrayList<>();
        long negative = recent.stream().filter(e -> "negative".equals(e.getSentiment())).count();
        long slow = recent.stream().filter(e -> e.getLatencyMs() != null && validLatency(e.getLatencyMs()) && e.getLatencyMs() > 5000).count();
        long dislikes = recent.stream().filter(e -> "rate_spot".equals(e.getEvent()) && e.getRatingValue() != null && e.getRatingValue() < 0).count();
        if (negative > 0) alerts.add(item("level", "warning", "message", "近 30 分钟出现 " + negative + " 条负面咨询"));
        if (slow > 0) alerts.add(item("level", "warning", "message", "近 30 分钟出现 " + slow + " 次慢回复"));
        if (dislikes > 0) alerts.add(item("level", "notice", "message", "近 30 分钟出现 " + dislikes + " 次景点点踩"));
        if (alerts.isEmpty()) alerts.add(item("level", "ok", "message", "当前 AI 导览运行平稳"));
        return alerts;
    }

    private Map<String, Object> eventRow(AnalyticsEvent event) {
        String label = switch (event.getEvent()) {
            case "user_message" -> "用户提问";
            case "ai_reply" -> "AI 回复";
            case "route_click" -> "路线点击";
            case "spot_enter" -> "进入景点";
            case "spot_leave" -> "离开景点";
            case "rate_route" -> "路线评分";
            case "rate_spot" -> "景点评价";
            case "voice_start" -> "开始语音";
            case "voice_end" -> "结束语音";
            case "preference_update" -> "偏好更新";
            case "recommend_exposure" -> "推荐曝光";
            case "recommend_click" -> "推荐点击";
            case "ticket_purchase" -> "门票购买";
            case "purchase" -> "消费支付";
            default -> event.getEvent();
        };
        return item("event", event.getEvent(), "label", label, "timestamp", event.getTs().toString(), "target", displayTarget(event));
    }


    private String routeId(AnalyticsEvent event) {
        if (event.getTargetId() != null && ROUTE_NAMES.containsKey(event.getTargetId())) return event.getTargetId();
        String routeId = stringProp(event, "route_id");
        return routeId != null && ROUTE_NAMES.containsKey(routeId) ? routeId : null;
    }

    private String displayTarget(AnalyticsEvent event) {
        if ("purchase".equals(event.getEvent())) {
            String category = stringProp(event, "category");
            if (category != null) return PURCHASE_CATEGORY_NAMES.getOrDefault(category, category);
        }
        if ("ticket_purchase".equals(event.getEvent())) {
            String ticketType = stringProp(event, "ticket_type");
            return ticketType == null ? "门票" : TICKET_TYPE_NAMES.getOrDefault(ticketType, ticketType);
        }
        if (event.getTargetId() == null) return "";
        return ROUTE_NAMES.getOrDefault(event.getTargetId(), SPOT_NAMES.getOrDefault(event.getTargetId(), event.getTargetId()));
    }

    private String questionText(AnalyticsEvent event) {
        if (event.getQuestion() != null) return event.getQuestion();
        String content = stringProp(event, "content_text");
        if (content != null) return content;
        return stringProp(event, "question");
    }

    private List<String> selectedTags(AnalyticsEvent event) {
        Object raw = prop(event, "selectedTags");
        if (!(raw instanceof Collection<?>)) raw = prop(event, "selected_tags");
        if (raw instanceof Collection<?> values) {
            return values.stream().filter(String.class::isInstance).map(String.class::cast).filter(GUIDE_TAGS::contains).distinct().toList();
        }
        String properties = event.getProperties();
        if (properties == null) return List.of();
        List<String> tags = new ArrayList<>();
        for (String tag : GUIDE_TAGS) if (properties.contains(tag)) tags.add(tag);
        return tags;
    }

    private boolean hasNegativeWord(String text) { return containsAny(text, NEGATIVE_WORDS); }
    private boolean containsAny(String text, List<String> words) { return text != null && words.stream().anyMatch(text::contains); }
    private boolean isStopWord(String token) { return token.length() < 2 || List.of("什么", "一下", "可以", "怎么", "这个", "那个", "今天", "我们", "你们", "请问", "介绍").contains(token); }
    private boolean validLatency(Double latencyMs) { return latencyMs != null && latencyMs >= 0 && latencyMs <= MAX_REASONABLE_LATENCY_MS; }

    private Object prop(AnalyticsEvent event, String key) {
        try {
            Map<String, Object> props = mapper.readValue(event.getProperties() == null ? "{}" : event.getProperties(), new TypeReference<>() {});
            return props.get(key);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String stringProp(AnalyticsEvent event, String key) {
        Object value = prop(event, key);
        return value instanceof String s && !s.isBlank() ? s : null;
    }

    private double numberProp(AnalyticsEvent event, String key) {
        Object value = prop(event, key);
        return value instanceof Number n ? n.doubleValue() : 0.0;
    }

    private double ratio(long numerator, long denominator) { return denominator <= 0 ? 0.0 : round4((double) numerator / denominator); }
    private double avg(List<Double> values) { return values.isEmpty() ? 0.0 : round1(values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)); }
    private double percentile(List<Double> sortedValues, double p) {
        if (sortedValues.isEmpty()) return 0.0;
        int index = (int) Math.ceil(sortedValues.size() * p) - 1;
        return round1(sortedValues.get(Math.max(0, Math.min(sortedValues.size() - 1, index))));
    }

    private String desensitize(String text) {
        return text.replaceAll("1[3-9]\\d{9}", "手机号").replaceAll("[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}", "邮箱");
    }

    private String safeId(String id) {
        if (id == null || id.length() <= 8) return id == null ? "" : id;
        return id.substring(0, 4) + "..." + id.substring(id.length() - 4);
    }

    private Map<String, Object> item(Object... values) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i + 1 < values.length; i += 2) out.put(String.valueOf(values[i]), values[i + 1]);
        return out;
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    private double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }
}
