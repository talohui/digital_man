package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lingshan.analytics.config.LingshanPathsProperties;
import com.lingshan.analytics.entity.AvatarConfig;
import com.lingshan.analytics.repository.AvatarConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

@Service
public class AvatarConfigService {

    private static final Logger log = LoggerFactory.getLogger(AvatarConfigService.class);

    public static final String DEFAULT_MODEL_URL =
            "https://fastly.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json";

    private final AvatarConfigRepository repository;
    private final LingshanPathsProperties paths;
    private final ObjectMapper mapper = new ObjectMapper();

    public AvatarConfigService(AvatarConfigRepository repository, LingshanPathsProperties paths) {
        this.repository = repository;
        this.paths = paths;
    }

    public Map<String, Object> getPublicConfig() {
        AvatarConfig cfg = getOrCreate();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("live2dModelUrl", cfg.getLive2dModelUrl());
        out.put("live2dPresetName", cfg.getLive2dPresetName());
        out.put("voiceId", cfg.getVoiceId());
        out.put("voiceName", cfg.getVoiceName());
        out.put("displayName", cfg.getDisplayName());
        out.put("costumeId", normalizeCostumeId(cfg.getCostumeId()));
        out.put("updatedAt", cfg.getUpdatedAt() != null ? cfg.getUpdatedAt().toString() : null);
        return out;
    }

    public Map<String, Object> getAdminConfig() {
        Map<String, Object> out = new LinkedHashMap<>(getPublicConfig());
        out.put("presets", listPresets());
        out.put("voices", listVoices());
        out.put("costumes", listCostumes());
        return out;
    }

    public Map<String, Object> update(Map<String, Object> body) {
        AvatarConfig cfg = getOrCreate();
        if (body.get("live2dModelUrl") instanceof String url && !url.isBlank()) {
            cfg.setLive2dModelUrl(url.trim());
        }
        if (body.get("live2dPresetName") instanceof String name) {
            cfg.setLive2dPresetName(name);
        }
        String voiceSyncWarning = null;
        if (body.get("voiceId") instanceof String voiceId && !voiceId.isBlank()) {
            cfg.setVoiceId(voiceId.trim());
            voiceSyncWarning = syncFayVoice(voiceId.trim());
        }
        if (body.get("voiceName") instanceof String voiceName) {
            cfg.setVoiceName(voiceName);
        }
        if (body.get("displayName") instanceof String displayName) {
            cfg.setDisplayName(displayName);
        }
        if (body.containsKey("costumeId")) {
            cfg.setCostumeId(normalizeCostumeId(body.get("costumeId")));
        }
        cfg.setUpdatedAt(LocalDateTime.now());
        repository.save(cfg);
        Map<String, Object> out = getPublicConfig();
        out.put("fayRestartRequired", body.containsKey("voiceId"));
        if (voiceSyncWarning != null) {
            out.put("voiceSyncWarning", voiceSyncWarning);
        }
        return out;
    }

    private AvatarConfig getOrCreate() {
        return repository.findById(1L).orElseGet(() -> {
            AvatarConfig cfg = new AvatarConfig();
            cfg.setId(1L);
            cfg.setLive2dModelUrl(DEFAULT_MODEL_URL);
            cfg.setLive2dPresetName("默认·小灵");
            cfg.setVoiceId("zhimiao_emo");
            cfg.setVoiceName("知妙");
            cfg.setDisplayName("小灵");
            cfg.setCostumeId("default");
            cfg.setUpdatedAt(LocalDateTime.now());
            return repository.save(cfg);
        });
    }

    private String normalizeCostumeId(Object raw) {
        if (raw instanceof String s) {
            String id = s.trim();
            if ("costume1".equals(id) || "costume2".equals(id) || "default".equals(id)) {
                return id;
            }
        }
        return "default";
    }

    public List<Map<String, String>> listCostumes() {
        return List.of(
                Map.of(
                        "id", "default",
                        "name", "默认（官方）",
                        "textureUrl", "",
                        "faceTextureUrl", "",
                        "clothesTextureUrl", ""),
                Map.of(
                        "id", "costume1",
                        "name", "服装一 · 红色",
                        "textureUrl", "/live2d/costumes/costume1_texture_00.png",
                        "faceTextureUrl", "/live2d/costumes/costume1_texture_00.png",
                        "clothesTextureUrl", "/live2d/costumes/costume1_texture_01.png"),
                Map.of(
                        "id", "costume2",
                        "name", "服装二 · 绿色",
                        "textureUrl", "/live2d/costumes/costume2_texture_00.png",
                        "faceTextureUrl", "/live2d/costumes/costume2_texture_00.png",
                        "clothesTextureUrl", "/live2d/costumes/costume2_texture_01.png")
        );
    }

  /**
   * 同步音色到 Fay 根目录 config.json 与 cache_data/config.json（Fay 启动可能读后者）。
   *
   * @return 非 null 表示部分失败，供管理端提示
   */
    /** 与 application.properties 默认路径一致（源码 UTF-8），避免 properties 乱码时无法解析。 */
    private static final String FAY_CONFIG_RELATIVE = "数字人开源项目/Fay-main/config.json";

    private Optional<Path> resolveFayConfigPath(List<Path> tried) {
        List<Path> candidates = new ArrayList<>();

        String envPath = System.getenv("FAY_CONFIG_PATH");
        if (envPath != null && !envPath.isBlank()) {
            candidates.add(Path.of(envPath.trim()));
        }

        String configured = paths.getFay().getConfigPath();
        if (configured != null && !configured.isBlank()) {
            Path p = Path.of(configured.trim());
            if (!p.isAbsolute()) {
                p = Path.of(System.getProperty("user.dir")).resolve(p);
            }
            candidates.add(p.normalize());
        }

        Path cwd = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        candidates.add(cwd.resolve("..").resolve(FAY_CONFIG_RELATIVE).normalize());

        Path repoRoot = cwd.getParent();
        if (repoRoot != null) {
            candidates.add(repoRoot.resolve(FAY_CONFIG_RELATIVE).normalize());
            try (Stream<Path> dirs = Files.list(repoRoot)) {
                dirs.filter(Files::isDirectory)
                        .map(dir -> dir.resolve("Fay-main").resolve("config.json"))
                        .forEach(candidates::add);
            } catch (IOException e) {
                log.debug("扫描仓库目录查找 Fay-main 失败: {}", e.getMessage());
            }
        }

        for (Path candidate : candidates) {
            Path abs = candidate.toAbsolutePath().normalize();
            tried.add(abs);
            if (Files.isRegularFile(abs)) {
                return Optional.of(abs);
            }
        }
        return Optional.empty();
    }

    private String syncFayVoice(String voiceId) {
        List<Path> tried = new ArrayList<>();
        Optional<Path> resolved = resolveFayConfigPath(tried);
        if (resolved.isEmpty()) {
            String msg = "未找到 Fay config.json，请设置环境变量 FAY_CONFIG_PATH 为绝对路径。"
                    + " 已尝试: " + tried;
            log.warn(msg);
            return msg;
        }

        Path configPath = resolved.get();
        Path fayRoot = configPath.getParent();
        if (fayRoot == null) {
            String msg = "Fay config 路径无效: " + configPath;
            log.warn(msg);
            return msg;
        }

        List<Path> targets = List.of(
                configPath,
                fayRoot.resolve("cache_data").resolve("config.json")
        );

        List<String> failures = new ArrayList<>();
        ObjectNode template = null;
        try {
            if (Files.exists(configPath)) {
                JsonNode root = mapper.readTree(configPath.toFile());
                if (root instanceof ObjectNode existing) {
                    template = existing.deepCopy();
                }
            }
        } catch (Exception e) {
            failures.add("读取主配置失败: " + e.getMessage());
        }

        for (Path target : targets) {
            try {
                Files.createDirectories(target.getParent());
                ObjectNode obj;
                if (Files.exists(target)) {
                    JsonNode root = mapper.readTree(target.toFile());
                    if (!(root instanceof ObjectNode existing)) {
                        failures.add(target + " 格式异常");
                        continue;
                    }
                    obj = existing;
                } else if (template != null) {
                    obj = template.deepCopy();
                } else {
                    failures.add("无法创建: " + target + "（无主配置模板）");
                    continue;
                }
                if (!obj.has("attribute") || !obj.get("attribute").isObject()) {
                    failures.add(target + " 缺少 attribute 节点");
                    continue;
                }
                ((ObjectNode) obj.get("attribute")).put("voice", voiceId);
                mapper.writerWithDefaultPrettyPrinter().writeValue(target.toFile(), obj);
                log.info("已同步 Fay 音色 {} -> {}", voiceId, target);
            } catch (Exception e) {
                log.warn("同步 Fay 音色到 {} 失败: {}", target, e.getMessage());
                failures.add(target + ": " + e.getMessage());
            }
        }

        if (failures.isEmpty()) {
            return null;
        }
        return "部分 Fay 配置文件写入失败: " + String.join("; ", failures);
    }

    public List<Map<String, String>> listPresets() {
        return List.of(
                Map.of("id", "haru", "name", "默认·小灵", "url", DEFAULT_MODEL_URL),
                Map.of("id", "haru_greeter_pro",
                        "name", "迎宾形象",
                        "url", "https://fastly.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_pro10.model3.json"),
                Map.of("id", "miku", "name", "备选形象",
                        "url", "https://fastly.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/miku/miku.model3.json")
        );
    }

    public List<Map<String, String>> listVoices() {
        return List.of(
                Map.of("id", "zhimiao_emo", "name", "知妙"),
                Map.of("id", "zhimi_emo", "name", "知米"),
                Map.of("id", "zhiyan_emo", "name", "知燕"),
                Map.of("id", "zhitian_emo", "name", "知甜")
        );
    }
}
