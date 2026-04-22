package com.lingshan.analytics.service;

import java.util.List;

public final class GuideRouteCatalog {

    public static final List<String> CANONICAL_TAGS = List.of(
            "亲子游",
            "文化探秘",
            "祈福静心",
            "轻松漫步",
            "拍照打卡"
    );

    public static final List<RouteProfile> ROUTES = List.of(
            new RouteProfile(
                    "historical_culture",
                    "历史文化路线",
                    "6 小时深度游",
                    List.of("文化探秘", "祈福静心"),
                    "适合喜欢佛教历史、建筑艺术与沉浸式讲解的游客，覆盖灵山最有代表性的人文主线。"
            ),
            new RouteProfile(
                    "natural_scenery",
                    "自然风光路线",
                    "5 小时全景游",
                    List.of("轻松漫步", "拍照打卡"),
                    "适合偏好慢节奏漫游、园林禅意和太湖视野的游客，整体更轻松也更适合拍照。"
            ),
            new RouteProfile(
                    "family",
                    "亲子路线",
                    "4 小时轻松游",
                    List.of("亲子游", "拍照打卡"),
                    "适合带孩子边玩边逛，侧重互动体验、故事表达和视觉冲击，节奏更友好。"
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
            String description
    ) {
    }
}
