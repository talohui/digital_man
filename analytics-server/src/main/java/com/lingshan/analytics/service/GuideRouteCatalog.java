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
                    "历史文化路线",
                    "6 小时深度游",
                    List.of("文化探秘", "祈福静心"),
                    "适合喜欢佛教历史、建筑艺术与沉浸式讲解的游客，覆盖灵山最有代表性的人文主线。",
                    Map.of("culture", 0.95, "ritual", 0.68, "family", 0.12, "photo", 0.35, "walk_light", 0.20, "deep_guide", 0.92),
                    "文化朝圣型"
            ),
            new RouteProfile(
                    "natural_scenery",
                    "自然风光路线",
                    "5 小时全景游",
                    List.of("轻松漫步", "拍照打卡"),
                    "适合偏好慢节奏漫游、园林禅意和太湖视野的游客，整体更轻松也更适合拍照。",
                    Map.of("culture", 0.32, "ritual", 0.40, "family", 0.30, "photo", 0.82, "walk_light", 0.88, "deep_guide", 0.30),
                    "疗愈祈福型"
            ),
            new RouteProfile(
                    "family",
                    "亲子路线",
                    "4 小时轻松游",
                    List.of("亲子游", "拍照打卡"),
                    "适合带孩子边玩边逛，侧重互动体验、故事表达和视觉冲击，节奏更友好。",
                    Map.of("culture", 0.30, "ritual", 0.18, "family", 0.92, "photo", 0.76, "walk_light", 0.70, "deep_guide", 0.22),
                    "亲子轻游型"
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
            String primaryPersona
    ) {
    }
}
