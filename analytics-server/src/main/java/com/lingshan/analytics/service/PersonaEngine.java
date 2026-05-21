package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.UserProfile;
import com.lingshan.analytics.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PersonaEngine {

    public static final List<String> ATOMS =
            List.of("culture", "ritual", "family", "photo", "walk_light", "deep_guide");

    private static final Map<String, String> PERSONA_LABELS = Map.of(
            "culture_pilgrim", "文化朝圣型",
            "serenity_seeker", "疗愈祈福型",
            "family_explorer", "亲子轻游型"
    );

    private static final Map<String, List<String>> PERSONA_ATOMS = Map.of(
            "culture_pilgrim", List.of("culture", "ritual", "deep_guide"),
            "serenity_seeker", List.of("ritual", "walk_light"),
            "family_explorer", List.of("family", "photo")
    );

    private static final double MEMORY_WEIGHT = 0.75;
    private static final double SIGNAL_WEIGHT = 0.25;

    private final UserProfileRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    public PersonaEngine(UserProfileRepository repository) {
        this.repository = repository;
    }

    public void updateFromEvent(String userId, String eventType, Map<String, Object> props) {
        if (userId == null || userId.isBlank()) return;

        Map<String, Double> signal = signalFor(eventType, props);
        if (signal.isEmpty()) return;

        UserProfile profile = repository.findById(userId).orElse(null);
        Map<String, Double> vector;
        int version;

        if (profile == null) {
            vector = normalize(signal);
            version = 1;
            profile = new UserProfile();
            profile.setUserId(userId);
        } else {
            Map<String, Double> old = readVector(profile.getInterestVectorJson());
            Map<String, Double> merged = new HashMap<>();
            for (String dim : ATOMS) {
                double prev = old.getOrDefault(dim, 0.0);
                double sig  = signal.getOrDefault(dim, 0.0);
                merged.put(dim, MEMORY_WEIGHT * prev + SIGNAL_WEIGHT * sig);
            }
            vector = normalize(merged);
            version = profile.getProfileVersion() == null ? 2 : profile.getProfileVersion() + 1;
        }

        String[] persona = pickPersona(vector);
        profile.setInterestVectorJson(writeVector(vector));
        profile.setPrimaryPersona(persona[0]);
        profile.setPrimaryScore(Double.parseDouble(persona[1]));
        profile.setProfileVersion(version);
        profile.setUpdatedAt(LocalDateTime.now());
        repository.save(profile);
    }

    public Map<String, Object> getProfile(String userId) {
        UserProfile p = repository.findById(userId).orElse(null);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", userId);
        if (p == null) {
            out.put("profileVersion", 0);
            out.put("interestVector", emptyVector());
            out.put("primaryPersona", null);
            out.put("primaryPersonaLabel", null);
            out.put("primaryScore", 0.0);
            out.put("secondaryPreferences", List.of());
            out.put("updatedAt", null);
            return out;
        }
        Map<String, Double> v = readVector(p.getInterestVectorJson());
        out.put("profileVersion",      p.getProfileVersion());
        out.put("interestVector",      v);
        out.put("primaryPersona",      p.getPrimaryPersona());
        out.put("primaryPersonaLabel", PERSONA_LABELS.getOrDefault(p.getPrimaryPersona(), ""));
        out.put("primaryScore",        round3(p.getPrimaryScore() == null ? 0 : p.getPrimaryScore()));
        out.put("secondaryPreferences", topAtomLabels(v, 2));
        out.put("updatedAt",           p.getUpdatedAt() == null ? null : p.getUpdatedAt().toString());
        return out;
    }

    public Map<String, Double> getVector(String userId) {
        UserProfile p = repository.findById(userId).orElse(null);
        if (p == null) return emptyVector();
        return readVector(p.getInterestVectorJson());
    }

    public static String personaLabel(String code) {
        return PERSONA_LABELS.getOrDefault(code, "");
    }

    private Map<String, Double> signalFor(String event, Map<String, Object> props) {
        Map<String, Double> s = new HashMap<>();
        if (event == null) return s;
        switch (event) {
            case "tag_toggle" -> {
                Object tag = props.get("tag");
                Object on  = props.get("on");
                if (Boolean.FALSE.equals(on)) return s;
                if ("亲子游".equals(tag))     { bump(s, "family", 0.30); bump(s, "photo", 0.10); }
                if ("文化探秘".equals(tag))   { bump(s, "culture", 0.30); bump(s, "deep_guide", 0.20); }
                if ("祈福静心".equals(tag))   { bump(s, "ritual", 0.30); bump(s, "walk_light", 0.10); }
                if ("轻松漫步".equals(tag))   { bump(s, "walk_light", 0.30); }
                if ("拍照打卡".equals(tag))   { bump(s, "photo", 0.30); }
            }
            case "route_click" -> {
                String rid = strProp(props, "target_id");
                if ("historical_culture".equals(rid)) { bump(s, "culture", 0.25); bump(s, "ritual", 0.15); bump(s, "deep_guide", 0.20); }
                if ("natural_scenery".equals(rid))    { bump(s, "walk_light", 0.25); bump(s, "photo", 0.20); }
                if ("family".equals(rid))             { bump(s, "family", 0.30); bump(s, "photo", 0.15); }
            }
            case "spot_enter" -> {
                String sid = strProp(props, "target_id");
                if ("giant_buddha".equals(sid))   { bump(s, "culture", 0.10); bump(s, "ritual", 0.10); }
                if ("fan_gong".equals(sid))       { bump(s, "culture", 0.15); bump(s, "deep_guide", 0.12); }
                if ("baizi_mile".equals(sid))     { bump(s, "family", 0.15); }
                if ("foshou_square".equals(sid))  { bump(s, "photo", 0.12); bump(s, "family", 0.08); }
                if ("lingshan_jingshe".equals(sid)) { bump(s, "walk_light", 0.15); bump(s, "ritual", 0.08); }
                if ("xiangfu_temple".equals(sid)) { bump(s, "ritual", 0.15); bump(s, "deep_guide", 0.08); }
            }
            case "user_message", "quick_ask" -> {
                String text = strProp(props, "content_text");
                if (text == null) text = strProp(props, "question");
                if (text == null) return s;
                if (text.matches(".*(文化|历史|建筑|艺术|玄奘|寺|佛教).*")) { bump(s, "culture", 0.10); bump(s, "deep_guide", 0.06); }
                if (text.matches(".*(祈福|礼佛|清静|禅意|宁静|静心).*"))   { bump(s, "ritual", 0.12); bump(s, "walk_light", 0.05); }
                if (text.matches(".*(孩子|亲子|小朋友|带娃|宝宝).*"))      { bump(s, "family", 0.15); }
                if (text.matches(".*(拍照|打卡|景色|风光|太湖|日落).*"))   { bump(s, "photo", 0.12); }
                if (text.matches(".*(轻松|慢|漫步|散步|不要太累).*"))      { bump(s, "walk_light", 0.12); }
                if (text.matches(".*(详细|讲清楚|深度|为什么|起源).*"))    { bump(s, "deep_guide", 0.10); }
            }
            default -> { /* no-op */ }
        }
        return s;
    }

    private static void bump(Map<String, Double> m, String k, double v) {
        m.merge(k, v, Double::sum);
    }

    private static String strProp(Map<String, Object> props, String key) {
        Object v = props.get(key);
        return v instanceof String s && !s.isBlank() ? s : null;
    }

    private static Map<String, Double> normalize(Map<String, Double> raw) {
        double max = raw.values().stream().mapToDouble(Double::doubleValue).max().orElse(0);
        Map<String, Double> out = new LinkedHashMap<>();
        for (String dim : ATOMS) {
            double v = raw.getOrDefault(dim, 0.0);
            out.put(dim, max <= 0 ? 0.0 : round3(Math.min(1.0, v / Math.max(max, 1.0))));
        }
        return out;
    }

    private static Map<String, Double> emptyVector() {
        Map<String, Double> v = new LinkedHashMap<>();
        for (String dim : ATOMS) v.put(dim, 0.0);
        return v;
    }

    private static String[] pickPersona(Map<String, Double> v) {
        String best = "culture_pilgrim";
        double bestScore = -1;
        for (var e : PERSONA_ATOMS.entrySet()) {
            double sum = 0;
            for (String atom : e.getValue()) sum += v.getOrDefault(atom, 0.0);
            double score = sum / e.getValue().size();
            if (score > bestScore) {
                bestScore = score;
                best = e.getKey();
            }
        }
        return new String[]{ best, String.valueOf(round3(bestScore)) };
    }

    private static List<String> topAtomLabels(Map<String, Double> v, int n) {
        Map<String, String> niceNames = Map.of(
                "culture", "文化探秘",
                "ritual", "祈福静心",
                "family", "亲子游",
                "photo", "拍照打卡",
                "walk_light", "轻松漫步",
                "deep_guide", "深度讲解"
        );
        return v.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(n)
                .map(e -> niceNames.getOrDefault(e.getKey(), e.getKey()))
                .toList();
    }

    private Map<String, Double> readVector(String json) {
        if (json == null || json.isBlank()) return emptyVector();
        try {
            Map<String, Double> m = mapper.readValue(json, new TypeReference<>() {});
            Map<String, Double> out = emptyVector();
            for (String dim : ATOMS) if (m.get(dim) != null) out.put(dim, m.get(dim));
            return out;
        } catch (Exception ex) {
            return emptyVector();
        }
    }

    private String writeVector(Map<String, Double> v) {
        try {
            return mapper.writeValueAsString(v);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private static double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
