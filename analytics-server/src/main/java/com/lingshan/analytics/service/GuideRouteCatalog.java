package com.lingshan.analytics.service;

import java.util.List;
import java.util.Map;

public final class GuideRouteCatalog {

    public static final List<String> CANONICAL_TAGS = List.of(
            "亲子游",
            "文化探秘",
            "祈福静心",
            "轻松漫步",
            "拍照打卡"
    );

    public static final List<String> ATOM_DIMS = List.of(
            "culture", "ritual", "family", "photo", "walk_light", "deep_guide"
    );

    public static final List<RouteProfile> ROUTES = List.of(
            new RouteProfile(
                    "historical_culture",
                    "文化探秘路线",
                    "6 小时深度游",
                    List.of("文化探秘", "祈福静心"),
                    "适合喜欢佛教历史、建筑艺术与沉浸式讲解的游客，覆盖灵山最有代表性的人文主线。",
                    Map.of("culture", 0.95, "ritual", 0.68, "family", 0.12, "photo", 0.35, "walk_light", 0.20, "deep_guide", 0.92),
                    "文化朝圣型",
                    List.of("south_gate", "lingshan_wall", "shengjing_square", "foshou_square", "xiangfu_temple", "xingtan_square", "foqian_square", "giant_buddha", "fan_gong", "wuyin_tancheng", "sansheng_hall", "exit"),
                    new EnvironmentProfile(0.35, 0.88, 0.28)
            ),
            new RouteProfile(
                    "prayer_meditation",
                    "祈福静心路线",
                    "4.5 小时静心游",
                    List.of("祈福静心", "轻松漫步"),
                    "适合以礼佛、祈愿和安静参访为主的游客，节奏从入园礼序逐步进入大佛朝礼。",
                    Map.of("culture", 0.58, "ritual", 0.96, "family", 0.22, "photo", 0.42, "walk_light", 0.82, "deep_guide", 0.52),
                    "疗愈祈福型",
                    List.of("south_gate", "lingshan_wall", "shengjing_square", "jiulong_guanyu", "foshou_square", "xiangfu_temple", "xingtan_square", "foqian_square", "giant_buddha", "exit"),
                    new EnvironmentProfile(0.95, 0.34, 0.78)
            ),
            new RouteProfile(
                    "family",
                    "亲子游路线",
                    "4 小时轻松游",
                    List.of("亲子游", "拍照打卡"),
                    "适合带孩子边玩边逛，侧重互动体验、故事表达和视觉冲击，节奏更友好。",
                    Map.of("culture", 0.30, "ritual", 0.18, "family", 0.92, "photo", 0.76, "walk_light", 0.70, "deep_guide", 0.22),
                    "亲子轻游型",
                    List.of("south_gate", "jiulong_guanyu", "foshou_square", "baizi_mile", "fan_gong", "wuyin_tancheng", "exit"),
                    new EnvironmentProfile(0.58, 0.58, 0.92)
            )
    );

    private GuideRouteCatalog() {
    }

    public static RouteProfile findRoute(String routeId) {
        return ROUTES.stream()
                .filter(route -> route.routeId().equals(routeId))
                .findFirst()
                .orElse(null);
    }

    public record RouteProfile(
            String routeId,
            String routeName,
            String durationLabel,
            List<String> labels,
            String description,
            Map<String, Double> interestVector,
            String primaryPersona,
            List<String> stopIds,
            EnvironmentProfile environmentProfile
    ) {
    }

    public record EnvironmentProfile(double shadeLevel, double indoorLevel, double walkEase) {
    }
}
