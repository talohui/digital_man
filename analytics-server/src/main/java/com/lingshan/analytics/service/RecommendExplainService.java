package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import com.lingshan.analytics.service.GuideRouteCatalog.RouteProfile;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendExplainService {

    private static final Map<String, String> LIGHT_ALT = Map.of(
            "historical_culture", "prayer_meditation",
            "prayer_meditation",  "family",
            "family",              "prayer_meditation"
    );

    private final PersonaEngine personaEngine;
    private final EventRepository eventRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public RecommendExplainService(PersonaEngine personaEngine, EventRepository eventRepository) {
        this.personaEngine = personaEngine;
        this.eventRepository = eventRepository;
    }

    public Map<String, Object> explain(String userId) {
        Map<String, Double> userVec = personaEngine.getVector(userId);
        Map<String, Object> profile = personaEngine.getProfile(userId);
        List<String> recentQuestions = recentQuestions(userId, 3);

        List<Map<String, Object>> ranked = new ArrayList<>();
        for (RouteProfile route : GuideRouteCatalog.ROUTES) {
            double cos = cosine(userVec, route.interestVector());
            Map<String, Object> card = new LinkedHashMap<>();
            card.put("routeId",              route.routeId());
            card.put("routeName",            route.routeName());
            card.put("durationLabel",        route.durationLabel());
            card.put("description",          route.description());
            card.put("tags",                 route.labels());
            card.put("primaryPersona",       route.primaryPersona());
            card.put("matchScore",           round3(cos));
            card.put("whyRecommended",       buildWhy(profile, recentQuestions, route));
            card.put("lightAlternativeId",   LIGHT_ALT.getOrDefault(route.routeId(), null));
            card.put("interestVector",       route.interestVector());
            ranked.add(card);
        }
        ranked.sort((a, b) -> Double.compare((double) b.get("matchScore"), (double) a.get("matchScore")));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId",        userId);
        out.put("profile",       profile);
        out.put("recommendations", ranked);
        out.put("evidenceTopics", recentQuestions);
        return out;
    }

    private List<String> recentQuestions(String userId, int n) {
        if (userId == null || userId.isBlank()) return List.of();
        List<AnalyticsEvent> ums = eventRepository.findTop10ByUserIdAndEventOrderByTsDesc(userId, "user_message");
        List<String> qs = new ArrayList<>();
        for (AnalyticsEvent e : ums) {
            String q = extractContentText(e.getProperties());
            if (q != null && !q.isBlank()) qs.add(trim(q, 30));
            if (qs.size() >= n) break;
        }
        if (qs.size() < n) {
            List<AnalyticsEvent> qas = eventRepository.findTop10ByUserIdAndEventOrderByTsDesc(userId, "quick_ask");
            for (AnalyticsEvent e : qas) {
                if (qs.size() >= n) break;
                if (e.getQuestion() != null) qs.add(trim(e.getQuestion(), 30));
            }
        }
        return qs;
    }

    private String extractContentText(String json) {
        if (json == null) return null;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> m = mapper.readValue(json, Map.class);
            Object t = m.get("content_text");
            return t instanceof String s ? s : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private String buildWhy(Map<String, Object> profile, List<String> recent, RouteProfile route) {
        Object label = profile.get("primaryPersonaLabel");
        @SuppressWarnings("unchecked")
        List<String> sec = (List<String>) profile.getOrDefault("secondaryPreferences", List.of());
        StringBuilder sb = new StringBuilder();
        if (label != null && !((String) label).isBlank()) {
            sb.append("你当前更接近 ").append(label);
            if (!sec.isEmpty()) sb.append(" · 偏好 ").append(String.join(" / ", sec));
        } else {
            sb.append("尚未识别明确画像 · 先按热门偏好补齐");
        }
        if (!recent.isEmpty()) {
            sb.append(" · 最近问了:").append(String.join(" / ", recent));
        }
        sb.append("。这条「").append(route.routeName()).append("」匹配你的 ")
          .append(route.primaryPersona()).append(" 偏好。");
        return sb.toString();
    }

    private static double cosine(Map<String, Double> a, Map<String, Double> b) {
        double dot = 0, na = 0, nb = 0;
        for (String dim : PersonaEngine.ATOMS) {
            double x = a.getOrDefault(dim, 0.0);
            double y = b.getOrDefault(dim, 0.0);
            dot += x * y;
            na += x * x;
            nb += y * y;
        }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    private static String trim(String s, int n) {
        return s.length() <= n ? s : s.substring(0, n) + "…";
    }

    private static double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
