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

    private static final List<String> GUIDE_TAGS =
            List.of("亲子游", "文化探秘", "祈福静心", "轻松漫步", "拍照打卡");

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
    private static final double TAG_WEIGHT = 0.70;
    private static final double BEHAVIOR_WEIGHT = 0.30;

    private final UserProfileRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    public PersonaEngine(UserProfileRepository repository) {
        this.repository = repository;
    }

    public void updateFromEvent(String userId, String eventType, Map<String, Object> props) {
        if (userId == null || userId.isBlank()) return;
        Map<String, Object> safeProps = props != null ? props : Map.of();

        if ("preference_update".equals(eventType)) {
            updateFromPreferenceSnapshot(userId, safeProps);
            return;
        }

        Map<String, Double> signal = signalFor(eventType, safeProps);
        if (signal.isEmpty()) return;

        UserProfile profile = repository.findById(userId).orElse(null);
        if (profile == null) {
            profile = new UserProfile();
            profile.setUserId(userId);
        }

        Map<String, Double> oldBehavior = readVector(profile.getBehaviorVectorJson());
        Map<String, Double> mergedBehavior = new HashMap<>();
        for (String dim : ATOMS) {
            double prev = oldBehavior.getOrDefault(dim, 0.0);
            double sig = signal.getOrDefault(dim, 0.0);
            mergedBehavior.put(dim, MEMORY_WEIGHT * prev + SIGNAL_WEIGHT * sig);
        }

        Map<String, Double> behaviorVector = normalize(mergedBehavior);
        Map<String, Double> tagVector = readVector(profile.getTagVectorJson());
        saveProfile(profile, tagVector, behaviorVector, null, null);
    }

    private void updateFromPreferenceSnapshot(String userId, Map<String, Object> props) {
        List<String> selectedTags = normalizeSelectedTags(props.get("selectedTags"));
        if (selectedTags.isEmpty()) {
            selectedTags = normalizeSelectedTags(props.get("selected_tags"));
        }

        String nextHash = tagSnapshotHash(selectedTags);
        UserProfile profile = repository.findById(userId).orElse(null);
        if (profile == null && selectedTags.isEmpty()) {
            return;
        }
        if (profile != null && Objects.equals(nextHash, profile.getTagSnapshotHash())) {
            return;
        }

        if (profile == null) {
            profile = new UserProfile();
            profile.setUserId(userId);
        }

        Map<String, Double> tagVector = vectorForTags(selectedTags);
        Map<String, Double> behaviorVector = readVector(profile.getBehaviorVectorJson());
        saveProfile(profile, tagVector, behaviorVector, selectedTags, nextHash);
    }

    private void saveProfile(
            UserProfile profile,
            Map<String, Double> tagVector,
            Map<String, Double> behaviorVector,
            List<String> selectedTags,
            String tagSnapshotHash
    ) {
        Map<String, Double> finalVector = mergeFinalVector(tagVector, behaviorVector);
        String[] persona = hasAnySignal(finalVector) ? pickPersona(finalVector) : new String[]{null, "0.0"};

        profile.setTagVectorJson(writeVector(tagVector));
        profile.setBehaviorVectorJson(writeVector(behaviorVector));
        profile.setInterestVectorJson(writeVector(finalVector));
        if (selectedTags != null) {
            profile.setSelectedTagsJson(writeTags(selectedTags));
        }
        if (tagSnapshotHash != null) {
            profile.setTagSnapshotHash(tagSnapshotHash);
        }
        profile.setPrimaryPersona(persona[0]);
        profile.setPrimaryScore(Double.parseDouble(persona[1]));
        profile.setProfileVersion(nextVersion(profile));
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
            out.put("selectedTags", List.of());
            out.put("updatedAt", null);
            return out;
        }
        Map<String, Double> v = readVector(p.getInterestVectorJson());
        String primaryPersona = p.getPrimaryPersona();
        out.put("profileVersion",      p.getProfileVersion());
        out.put("interestVector",      v);
        out.put("primaryPersona",      primaryPersona);
        out.put("primaryPersonaLabel", primaryPersona == null ? null : PERSONA_LABELS.getOrDefault(primaryPersona, ""));
        out.put("primaryScore",        round3(p.getPrimaryScore() == null ? 0 : p.getPrimaryScore()));
        out.put("secondaryPreferences", topAtomLabels(v, 2));
        out.put("selectedTags",        readTags(p.getSelectedTagsJson()));
        out.put("updatedAt",           p.getUpdatedAt() == null ? null : p.getUpdatedAt().toString());
        return out;
    }

    public Map<String, Double> getVector(String userId) {
        UserProfile p = repository.findById(userId).orElse(null);
        if (p == null) return emptyVector();
        return readVector(p.getInterestVectorJson());
    }

    public static String personaLabel(String code) {
        return code == null ? "" : PERSONA_LABELS.getOrDefault(code, "");
    }

    private Map<String, Double> signalFor(String event, Map<String, Object> props) {
        Map<String, Double> s = new HashMap<>();
        if (event == null) return s;
        switch (event) {
            case "tag_toggle" -> {
                // 只作为点击埋点保留；画像由 preference_update 的 selectedTags 快照驱动。
            }
            case "route_click" -> {
                String rid = strProp(props, "target_id");
                if ("historical_culture".equals(rid)) { bump(s, "culture", 0.25); bump(s, "ritual", 0.15); bump(s, "deep_guide", 0.20); }
                if ("natural_scenery".equals(rid))    { bump(s, "walk_light", 0.25); bump(s, "photo", 0.20); }
                if ("family".equals(rid))             { bump(s, "family", 0.30); bump(s, "photo", 0.15); }
            }
            case "ticket_purchase" -> {
                double groupSize = numberProp(props, "group_size");
                String ageBand = strProp(props, "age_band");
                String ticketType = strProp(props, "ticket_type");
                if (groupSize >= 3) { bump(s, "family", 0.18); bump(s, "walk_light", 0.06); }
                if ("60+".equals(ageBand)) { bump(s, "walk_light", 0.08); bump(s, "ritual", 0.04); }
                if ("18-24".equals(ageBand) || "25-34".equals(ageBand)) { bump(s, "photo", 0.06); }
                if ("family".equals(ticketType)) { bump(s, "family", 0.12); }
                if ("culture".equals(ticketType)) { bump(s, "culture", 0.10); bump(s, "deep_guide", 0.08); }
                if ("blessing".equals(ticketType)) { bump(s, "ritual", 0.10); }
                if ("leisure".equals(ticketType)) { bump(s, "walk_light", 0.10); }
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

    private Map<String, Double> vectorForTags(List<String> selectedTags) {
        Map<String, Double> s = new HashMap<>();
        for (String tag : selectedTags) {
            if ("亲子游".equals(tag))     { bump(s, "family", 0.30); bump(s, "photo", 0.10); }
            if ("文化探秘".equals(tag))   { bump(s, "culture", 0.30); bump(s, "deep_guide", 0.20); }
            if ("祈福静心".equals(tag))   { bump(s, "ritual", 0.30); bump(s, "walk_light", 0.10); }
            if ("轻松漫步".equals(tag))   { bump(s, "walk_light", 0.30); }
            if ("拍照打卡".equals(tag))   { bump(s, "photo", 0.30); }
        }
        return normalize(s);
    }

    private Map<String, Double> mergeFinalVector(Map<String, Double> tagVector, Map<String, Double> behaviorVector) {
        Map<String, Double> merged = new LinkedHashMap<>();
        for (String dim : ATOMS) {
            double tag = tagVector.getOrDefault(dim, 0.0);
            double behavior = behaviorVector.getOrDefault(dim, 0.0);
            merged.put(dim, round3(TAG_WEIGHT * tag + BEHAVIOR_WEIGHT * behavior));
        }
        return merged;
    }

    private List<String> normalizeSelectedTags(Object raw) {
        if (!(raw instanceof Collection<?> values)) return List.of();
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (Object value : values) {
            if (value instanceof String tag && GUIDE_TAGS.contains(tag)) {
                out.add(tag);
            }
        }
        return List.copyOf(out);
    }

    private String tagSnapshotHash(List<String> selectedTags) {
        return selectedTags.stream().sorted().reduce((a, b) -> a + "|" + b).orElse("");
    }

    private int nextVersion(UserProfile profile) {
        Integer version = profile.getProfileVersion();
        return version == null ? 1 : version + 1;
    }

    private boolean hasAnySignal(Map<String, Double> vector) {
        return vector.values().stream().anyMatch(v -> v != null && v > 0.0001);
    }

    private static void bump(Map<String, Double> m, String k, double v) {
        m.merge(k, v, Double::sum);
    }

    private static String strProp(Map<String, Object> props, String key) {
        Object v = props.get(key);
        return v instanceof String s && !s.isBlank() ? s : null;
    }

    private static double numberProp(Map<String, Object> props, String key) {
        Object v = props.get(key);
        return v instanceof Number n ? n.doubleValue() : 0.0;
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
                .filter(e -> e.getValue() != null && e.getValue() > 0)
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

    private List<String> readTags(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return mapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String writeTags(List<String> tags) {
        try {
            return mapper.writeValueAsString(tags);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private static double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
