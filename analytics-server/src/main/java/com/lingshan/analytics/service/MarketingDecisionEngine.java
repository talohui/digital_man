package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class MarketingDecisionEngine {

    private static final Map<String, List<String>> TOPIC_KEYWORDS = new LinkedHashMap<>();

    static {
        TOPIC_KEYWORDS.put("祈福文化", List.of("祈福", "拜佛", "开光", "佛手", "大佛", "祥符禅寺", "许愿", "烧香"));
        TOPIC_KEYWORDS.put("路线导览", List.of("路线", "怎么走", "下一站", "游览顺序", "推荐路线", "导航", "入口"));
        TOPIC_KEYWORDS.put("演出活动", List.of("表演", "演出", "九龙灌浴", "时间", "几点开始", "节目"));
        TOPIC_KEYWORDS.put("餐饮休息", List.of("吃饭", "餐厅", "休息", "厕所", "卫生间", "饮水", "咖啡"));
        TOPIC_KEYWORDS.put("交通停车", List.of("停车", "停车场", "公交", "打车", "自驾", "出口", "收费"));
        TOPIC_KEYWORDS.put("门票服务", List.of("门票", "价格", "预约", "开放时间", "退票", "购票"));
        TOPIC_KEYWORDS.put("亲子游玩", List.of("小孩", "儿童", "亲子", "老人", "婴儿车", "无障碍"));
        TOPIC_KEYWORDS.put("拍照打卡", List.of("拍照", "打卡", "好看", "机位", "出片", "照片"));
    }

    public DecisionResponse generate(DecisionInput input) {
        ConsumptionSignal consumptionSignal = effectiveConsumptionSignal(input);
        boolean hasOperationalSignal = input.hottestSpotVisits() > 0
                || !input.personaTags().isEmpty()
                || input.totalConsumptionAmount() > 0
                || consumptionSignal.available()
                || !input.activeEmergencies().isEmpty();
        if (input.totalMessages() <= 0 && input.topics().isEmpty() && !hasOperationalSignal) return demoFallback();

        List<TopicMetric> topics = input.topics().stream()
                .sorted(Comparator.comparingInt(TopicMetric::count).reversed())
                .toList();
        List<DecisionCard> cards = new ArrayList<>();

        input.activeEmergencies().stream()
                .sorted(Comparator.comparingInt(this::emergencyRank))
                .map(this::emergencyCard)
                .forEach(cards::add);

        // 消费转化是运营核心信号：优先放入卡片队列，避免被一般咨询、知识库建议挤出前五。
        if (consumptionSignal.available()) cards.add(consumptionCard(consumptionSignal));

        if (!topics.isEmpty()) {
            TopicMetric top = topics.get(0);
            cards.add(interestCard(top, input.totalMessages()));
            if (isMarketingTopic(top.topic())) cards.add(marketingCard(top));
        }
        topics.stream()
                .filter(topic -> topic.negativeCount() >= 2 || "交通停车".equals(topic.topic()))
                .findFirst()
                .ifPresent(topic -> cards.add(serviceCard(topic)));
        if (input.heatmapHot() || input.hottestSpotVisits() >= 3 || input.activeSessions5min() >= 3) {
            cards.add(crowdCard(input.activeSessions5min(), input.hottestSpot(), input.hottestSpotVisits()));
        }
        if (!input.personaTags().isEmpty()) cards.add(personaCard(input.personaTags()));
        if (input.p90LatencyMs() > 3000) cards.add(techCard(input.p90LatencyMs()));
        topics.stream().filter(topic -> topic.count() >= 3).findFirst().ifPresent(topic -> cards.add(knowledgeCard(topic)));

        List<DecisionCard> finalCards = cards.stream().limit(5).toList();
        List<String> dataSources = new ArrayList<>(List.of(
                "热门问题 TopN", "用户提问主题", "情感分析", "响应延迟", "实时活跃会话",
                "实时景点访问热区", "购票与消费事件", "游客画像与偏好标签"
        ));
        if (!input.activeEmergencies().isEmpty()) dataSources.add("应急事件状态");
        if (consumptionSignal.available()) dataSources.add(consumptionSignal.sourceLabel());
        return new DecisionResponse(
                buildSummary(topics, input),
                finalCards,
                finalCards.stream().flatMap(card -> card.actions().stream()).limit(6).toList(),
                dataSources,
                false
        );
    }

    /** Keeps older callers working while all new callers provide an explicit signal source. */
    private ConsumptionSignal effectiveConsumptionSignal(DecisionInput input) {
        if (input.consumptionSignal().available()) return input.consumptionSignal();
        if (input.totalConsumptionAmount() <= 0) return ConsumptionSignal.none();
        String category = input.topConsumptionCategory() == null || input.topConsumptionCategory().isBlank()
                ? "综合服务"
                : input.topConsumptionCategory();
        return new ConsumptionSignal(
                true, category, "近24小时小程序购票与消费事件", false,
                input.totalConsumptionAmount(), 0, 0, 0, 0, input.totalConsumptionAmount()
        );
    }

    public String classifyTopic(String text) {
        if (text == null || text.isBlank()) return "其他咨询";
        for (Map.Entry<String, List<String>> entry : TOPIC_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) if (text.contains(keyword)) return entry.getKey();
        }
        return "其他咨询";
    }

    private DecisionCard interestCard(TopicMetric topic, int totalMessages) {
        int ratio = totalMessages > 0 ? Math.round(topic.count() * 100f / totalMessages) : 0;
        return card(topic.topic() + "咨询热度上升", "游客兴趣洞察", ratio >= 30 ? "高" : "中",
                List.of(topic.topic() + "问题 " + topic.count() + " 条", "占今日提问约 " + ratio + "%", sampleEvidence(topic)),
                "游客当前对“" + topic.topic() + "”相关体验关注度较高，适合前置展示相关内容。",
                List.of("在游客端首页前置“" + topic.topic() + "”快捷入口", "将相关点位加入小灵问答优先引导", "把高频问题沉淀为运营观察项"),
                List.of(topic.topic()), relatedSpots(topic.topic()));
    }

    private DecisionCard marketingCard(TopicMetric topic) {
        String route = switch (topic.topic()) {
            case "祈福文化" -> "祈福静心路线";
            case "演出活动" -> "演出观赏路线";
            case "餐饮休息" -> "餐饮休憩路线";
            case "拍照打卡" -> "灵山打卡路线";
            default -> "主题推荐路线";
        };
        return card(topic.topic() + "转化机会", "营销机会", "高",
                List.of(topic.topic() + "进入高频咨询", sampleEvidence(topic), "关联点位：" + String.join("、", relatedSpots(topic.topic()))),
                "游客已经表现出明确兴趣，可将问答流量转化为路线、活动或文创入口。",
                List.of("推送“" + route + "”", "在问答中增加相关活动/商品入口", "对相关景点配置打卡或文创引导"),
                List.of(topic.topic()), relatedSpots(topic.topic()));
    }

    private DecisionCard serviceCard(TopicMetric topic) {
        return card(topic.topic() + "问题需要服务优化", "服务优化", topic.negativeCount() >= 3 ? "高" : "中",
                List.of(topic.topic() + "问题 " + topic.count() + " 条", "负面/困惑反馈 " + topic.negativeCount() + " 条", sampleEvidence(topic)),
                "该类问题重复出现且存在负面反馈，说明游客在现场指引或信息获取上仍有阻塞。",
                List.of("补充" + shortTopic(topic.topic()) + " FAQ", "在游客端增加" + shortTopic(topic.topic()) + "指引快捷入口", "检查线下标识与数字人回答是否一致"),
                List.of(topic.topic()), relatedSpots(topic.topic()));
    }

    private DecisionCard crowdCard(int activeSessions, String hottestSpot, int hottestSpotVisits) {
        String spot = hottestSpot == null || hottestSpot.isBlank() ? "核心区域" : hottestSpot;
        return card("核心区域客流需联动分流", "客流分流", activeSessions >= 5 ? "高" : "中",
                List.of("近 5 分钟活跃会话 " + activeSessions + " 个", "实时热区：" + spot + " 访问 " + hottestSpotVisits + " 次", "路线咨询可联动地图热区观察"),
                "当实时咨询和地图热区同时升高时，应主动推荐替代路线，降低核心点位拥堵。",
                List.of("打开客流热力图核查高密度区域", "推荐“梵宫 → 百子戏弥勒 → 佛前广场”替代路线", "在游客端提示错峰游览"),
                List.of("路线导览", "客流热力"), List.of(spot));
    }

    private DecisionCard personaCard(List<String> personaTags) {
        String focus = personaTags.get(0);
        return card(focus + "客群可定向承接", "客群营销", "中",
                List.of("游客偏好标签：" + String.join("、", personaTags), "画像来自 preference_update 事件", "可按客群调整导览入口"),
                "当前客群已有明确游览偏好，适合用相应路线、讲解主题和活动入口承接。",
                List.of("首页前置“" + focus + "”路线入口", "为该客群设置问答优先引导", "复盘该客群的路线点击与消费转化"),
                personaTags, List.of());
    }

    private DecisionCard consumptionCard(ConsumptionSignal signal) {
        if (signal.historicalBaseline()) {
            int share = (int) Math.round(signal.categoryShare() * 100);
            return card(signal.topCategory() + "消费存在承接机会", "消费转化", "中",
                    List.of(
                            signal.sourceLabel() + "：仅作推荐先验，不代表当前实时成交",
                            signal.topCategory() + "在样本消费结构中占比约 " + share + "%",
                            "样本人均消费约 " + Math.round(signal.averageSpend()) + " 元"
                    ),
                    "当前尚未采集到实时订单，先以历史消费结构规划入口；上线后应以实时购票和订单数据复核效果。",
                    List.of("在购票成功页增加“餐饮、文创、交通”服务入口", "在高停留景点配置“" + signal.topCategory() + "”推荐卡", "补齐订单与推荐点击埋点，按实时数据复核转化"),
                    List.of("消费转化", signal.topCategory()), List.of());
        }

        if (signal.ticketPurchaseCount() > 0 && signal.ancillaryAmount() <= 0) {
            return card("购票后尚未形成二次消费", "消费转化", "高",
                    List.of(
                            "近 24 小时购票 " + signal.ticketPurchaseCount() + " 单，门票收入 " + Math.round(signal.ticketRevenue()) + " 元",
                            "餐饮、文创、交通、演艺订单暂未采集到",
                            "数据来自近 24 小时小程序购票与消费事件"
                    ),
                    "已有明确入园意愿，但购票后没有被承接到餐饮、文创、交通或演艺服务，存在二次消费流失风险。",
                    List.of("在购票成功页展示餐饮、文创与交通服务入口", "按游客路线和停留点推送关联服务", "跟踪购票后 2 小时内的二次消费转化"),
                    List.of("门票服务", "消费转化"), List.of());
        }

        return card(signal.topCategory() + "消费可继续转化", "消费转化", "中",
                List.of(
                        "近 24 小时消费总额 " + Math.round(signal.totalAmount()) + " 元",
                        "主要二次消费品类：" + signal.topCategory(),
                        "数据来自近 24 小时小程序购票与消费事件"
                ),
                "已有消费行为说明游客对相关服务具备付费意愿，可在合适节点继续承接。",
                List.of("在相关点位补充“" + signal.topCategory() + "”推荐入口", "为已购票游客推荐关联服务", "观察推荐后的点击与订单转化"),
                List.of(signal.topCategory(), "消费转化"), List.of());
    }

    private DecisionCard techCard(double p90) {
        return card("响应延迟偏高，影响营销承接", "技术优化", "中",
                List.of("P90 响应时长 " + Math.round(p90) + " ms", "AI 回复慢会降低游客继续咨询意愿", "营销推荐依赖稳定问答链路"),
                "当响应变慢时，游客更容易中断咨询，热门问题和路线推荐的转化效率会下降。",
                List.of("检查 Fay/RAG 服务链路", "缓存高频问答与路线推荐", "对慢请求进行日志追踪"),
                List.of("技术体验"), List.of());
    }

    private DecisionCard knowledgeCard(TopicMetric topic) {
        return card("高频问题建议补充知识库", "知识库补全", "中",
                List.of(topic.topic() + "高频问题 " + topic.count() + " 条", sampleEvidence(topic), "可沉淀为 FAQ 或知识库条目"),
                "同类问题重复出现，说明游客端需要更直接的信息入口，知识库也应覆盖更细的问法。",
                List.of("生成" + shortTopic(topic.topic()) + " FAQ 草稿", "补充相关景点的问答切块", "将高频问题加入快捷问答"),
                List.of(topic.topic()), relatedSpots(topic.topic()));
    }

    private DecisionCard emergencyCard(EmergencySignal event) {
        List<String> scope = new ArrayList<>();
        if (!event.affectedRouteIds().isEmpty()) scope.add("影响路线：" + String.join("、", event.affectedRouteIds()));
        if (!event.affectedSpotIds().isEmpty()) scope.add("影响点位：" + String.join("、", event.affectedSpotIds()));
        if (scope.isEmpty()) scope.add("影响范围：全景区提醒");
        List<String> evidence = new ArrayList<>(List.of(
                "生效中的应急事件：" + emergencyTypeLabel(event.type()),
                "事件等级：" + event.severity(),
                scope.get(0)
        ));
        if (event.validUntil() != null && !event.validUntil().isBlank()) evidence.add("有效至：" + event.validUntil());
        return card(
                event.title(),
                "应急处置",
                "CRITICAL".equals(event.severity()) ? "高" : "WARNING".equals(event.severity()) ? "中" : "低",
                evidence,
                event.message() == null || event.message().isBlank() ? "该事件正在生效，需要联动调整游客端导览与现场处置。" : event.message(),
                emergencyActions(event),
                List.of(emergencyTypeLabel(event.type())),
                event.affectedSpotIds()
        );
    }

    private List<String> emergencyActions(EmergencySignal event) {
        return switch (event.type()) {
            case "ROAD_CLOSURE" -> List.of("立即调整受影响路线并发布绕行指引", "游客端弹出道路封闭提醒", "通知数字人主动播报绕行信息");
            case "SCENIC_CLOSURE" -> List.of("暂停推荐受影响景点和路线", "游客端弹出临时闭园提醒", "数字人主动说明可用替代景点");
            case "SHOW_CANCELLED" -> List.of("下架已取消演出入口", "游客端提醒演出取消", "推荐同期可用活动或路线");
            case "EXTREME_WEATHER" -> List.of("发布极端天气安全提醒", "暂停不安全的室外路线", "数字人主动播报避险建议");
            case "CROWDING" -> List.of("降低受影响路线推荐优先级", "游客端提示错峰游览", "打开热力图核查现场状态");
            case "MISSING_PERSON" -> List.of("立即通知游客服务中心协查", "仅播报管理员确认的寻人信息", "记录处置进度并及时解除事件");
            case "MEDICAL_HELP" -> List.of("立即联系现场医疗与安保人员", "仅播报管理员确认的求助位置", "保持应急通道路线可用");
            default -> List.of("核查事件影响范围", "同步游客端提醒", "跟踪处置进度");
        };
    }

    private int emergencyRank(EmergencySignal event) {
        return "CRITICAL".equals(event.severity()) ? 0 : "WARNING".equals(event.severity()) ? 1 : 2;
    }

    private String emergencyTypeLabel(String type) {
        return switch (type) {
            case "SCENIC_CLOSURE" -> "临时闭园";
            case "SHOW_CANCELLED" -> "演出取消";
            case "EXTREME_WEATHER" -> "极端天气";
            case "CROWDING" -> "景点拥堵";
            case "ROAD_CLOSURE" -> "道路封闭";
            case "MISSING_PERSON" -> "游客走失";
            case "MEDICAL_HELP" -> "医疗求助";
            default -> "应急事件";
        };
    }

    private DecisionResponse demoFallback() {
        List<DecisionCard> cards = List.of(
                demoCard("祈福类咨询热度上升", "营销机会", "高", List.of("演示样例：祈福、佛手、灵山大佛进入高频咨询", "关联点位：灵山大佛、佛手广场、祥符禅寺"), "游客对祈福文化和打卡体验关注度较高。", List.of("推送祈福静心路线", "增加祈福文创入口", "问答中优先引导祈福点位"), List.of("祈福文化"), List.of("灵山大佛", "佛手广场", "祥符禅寺")),
                demoCard("停车与入口问题重复出现", "服务优化", "高", List.of("演示样例：停车、入口、收费规则咨询集中", "负面情绪偏高时需优先处理"), "游客对到达景区后的第一步指引不够清楚。", List.of("补充停车 FAQ", "首页增加停车指引快捷入口", "统一停车场到入口路线说明"), List.of("交通停车"), List.of("景区入口", "停车场")),
                demoCard("九龙灌浴区域热度偏高", "客流分流", "中", List.of("演示样例：热力图显示核心演出区密度偏高", "路线咨询量同步增加"), "核心点位可能出现拥堵，需要给游客推荐替代路线。", List.of("推荐低密度替代路线", "提示错峰观看演出", "打开热力图核查现场状态"), List.of("演出活动", "路线导览"), List.of("九龙灌浴", "梵宫", "百子戏弥勒")),
                demoCard("演出时间问题高频出现", "知识库补全", "中", List.of("演示样例：九龙灌浴、演出时间、几点开始重复出现", "适合生成固定 FAQ"), "游客需要快速确认活动时间，适合前置成快捷问答。", List.of("新增演出时间表快捷问答", "补充活动日程 FAQ", "在路线推荐中加入演出提醒"), List.of("演出活动"), List.of("九龙灌浴")),
                demoCard("部分问题知识库命中不足", "知识库补全", "中", List.of("演示样例：细分服务问题反复追问", "运营人员可将缺口补录到知识库"), "知识库覆盖不完整会影响数字人回答质量。", List.of("整理未命中问题清单", "补充对应资料或新增 FAQ", "复测 RAG 回答质量"), List.of("知识库"), List.of())
        );
        return new DecisionResponse("当前 analytics 数据不足，系统展示 demo fallback 决策样例；接入游客提问后会自动切换为真实规则分析。", cards, cards.stream().flatMap(card -> card.actions().stream()).limit(6).toList(), List.of("demo fallback：热门问题 TopN / 情感趋势 / 热力图 / 响应延迟"), true);
    }

    private DecisionCard demoCard(String title, String type, String priority, List<String> evidence, String reason, List<String> actions, List<String> topics, List<String> spots) {
        return new DecisionCard(title, type, priority, evidence, reason, actions, topics, spots, true);
    }

    private DecisionCard card(String title, String type, String priority, List<String> evidence, String reason, List<String> actions, List<String> topics, List<String> spots) {
        return new DecisionCard(title, type, priority, evidence, reason, actions, topics, spots, false);
    }

    private boolean isMarketingTopic(String topic) { return List.of("祈福文化", "演出活动", "餐饮休息", "拍照打卡").contains(topic); }
    private String sampleEvidence(TopicMetric topic) { return topic.samples().isEmpty() ? "暂无样例问题" : "样例问题：" + topic.samples().get(0); }
    private String buildSummary(List<TopicMetric> topics, DecisionInput input) {
        if (!input.activeEmergencies().isEmpty()) {
            return "当前有 " + input.activeEmergencies().size() + " 起生效中的应急事件，应优先完成游客提醒、路线调整与现场处置，再开展常规营销动作。";
        }
        if (topics.isEmpty()) return "今日游客咨询量较少，建议继续观察热门问题、情感趋势与热力图变化。";
        String latencyHint = input.p90LatencyMs() > 3000 ? "同时响应延迟偏高，建议检查 Fay/RAG 链路。" : "当前响应体验整体可承接营销推荐。";
        return "今日游客主要关注 " + topics.stream().limit(3).map(TopicMetric::topic).toList() + "，建议围绕高频主题配置路线、FAQ 与活动入口。" + latencyHint;
    }
    private String shortTopic(String topic) { return switch (topic) { case "交通停车" -> "停车"; case "演出活动" -> "演出"; case "餐饮休息" -> "餐饮"; case "路线导览" -> "路线"; case "门票服务" -> "门票"; default -> topic; }; }
    private List<String> relatedSpots(String topic) { return switch (topic) { case "祈福文化" -> List.of("灵山大佛", "佛手广场", "祥符禅寺"); case "演出活动" -> List.of("九龙灌浴", "梵宫"); case "餐饮休息" -> List.of("景区餐饮区", "游客中心"); case "交通停车" -> List.of("景区入口", "停车场"); case "路线导览" -> List.of("九龙灌浴", "梵宫", "佛前广场"); case "拍照打卡" -> List.of("灵山大佛", "佛手广场", "梵宫"); default -> List.of(); }; }
}
