package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.OperationsCopilotMessage;
import com.lingshan.analytics.dto.OperationsCopilotModelResponse;
import com.lingshan.analytics.dto.OperationsCopilotPageContext;
import com.lingshan.analytics.dto.OperationsCopilotProposalDraft;
import com.lingshan.analytics.dto.OperationsCopilotQueryRequest;
import com.lingshan.analytics.dto.OperationsCopilotResponse;
import com.lingshan.analytics.entity.OperationsCopilotRecord;
import com.lingshan.analytics.repository.OperationsCopilotRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class OperationsCopilotService {
    private static final int MAX_HISTORY_MESSAGES = 8;
    private static final int MAX_HISTORY_ITEM_LENGTH = 800;
    private static final int MAX_HISTORY_TOTAL_LENGTH = 4_800;
    private static final int MAX_SESSION_ID_LENGTH = 64;
    private static final Pattern SENSITIVE_VALUE = Pattern.compile(
            "(?i)(authorization|api[-_ ]?key|access[-_ ]?(?:token|key(?:id)?)"
                    + "|private[-_ ]?key|password|secret)"
                    + "\\s*[\"']?\\s*[:=]\\s*"
                    + "(?:\"[^\"]*\"|'[^']*'|"
                    + "(?:(?:bearer|basic|apikey|token)\\s+)?[^\\s,;}]+)"
    );
    private static final Pattern BEARER_VALUE = Pattern.compile(
            "(?i)bearer\\s+[a-z0-9._~+/=-]+"
    );
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]");
    private static final Set<String> ALLOWED_PROPOSAL_TYPES = Set.of(
            "EMERGENCY_DRAFT", "KB_CREATE", "KB_UPDATE", "KB_DEACTIVATE"
    );

    private final OperationsCopilotRecordRepository records;
    private final OperationsCopilotContextProvider contextProvider;
    private final OperationsCopilotGenerator generator;
    private final AdminSessionVerifier adminSessionVerifier;
    private final OperationsCopilotActionExecutor actionExecutor;
    private final ObjectMapper objectMapper;

    public OperationsCopilotService(
            OperationsCopilotRecordRepository records,
            OperationsCopilotContextProvider contextProvider,
            OperationsCopilotGenerator generator,
            AdminSessionVerifier adminSessionVerifier,
            OperationsCopilotActionExecutor actionExecutor,
            ObjectMapper objectMapper
    ) {
        this.records = records;
        this.contextProvider = contextProvider;
        this.generator = generator;
        this.adminSessionVerifier = adminSessionVerifier;
        this.actionExecutor = actionExecutor;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public OperationsCopilotResponse ask(OperationsCopilotQueryRequest request) {
        String question = requiredQuestion(request == null ? null : request.question());
        String sessionId = safeSessionId(request == null ? null : request.sessionId());
        List<OperationsCopilotMessage> history = safeHistory(request == null ? null : request.history());
        OperationsCopilotPageContext pageContext = safePageContext(request == null ? null : request.pageContext());
        Map<String, Object> context = safeContext();
        OperationsCopilotModelResponse generated = safeGenerate(
                question, sessionId, history, pageContext, context);
        List<String> evidence = safeItems(generated.evidence(), 6, 160);
        List<String> recommendedActions = safeItems(generated.recommendedActions(), 6, 200);
        List<String> risks = safeItems(generated.risks(), 4, 200);
        List<String> sources = safeSources(generated.sources(), context);
        OperationsCopilotProposalDraft proposal = safeProposal(generated.proposal());
        String contextUpdatedAt = contextUpdatedAt(context);
        String fallbackReason = safeOutputText(generated.fallbackReason(), 200);
        OperationsCopilotRecord record = new OperationsCopilotRecord();
        LocalDateTime now = LocalDateTime.now();
        record.setId(UUID.randomUUID().toString());
        record.setQuestion(question);
        record.setAnswer(safeAnswer(generated.answer()));
        record.setSourcesJson(write(sources));
        record.setGenerationSource("llm".equals(generated.generationSource()) ? "llm" : "rules");
        record.setStructuredResponseJson(write(structuredResponse(
                sessionId,
                contextUpdatedAt,
                evidence,
                recommendedActions,
                risks,
                fallbackReason
        )));
        if (proposal != null) {
            record.setProposalType(proposal.type());
            record.setProposalTitle(proposal.title());
            record.setProposalSummary(proposal.summary());
            record.setProposalPayloadJson(write(proposal.payload()));
            record.setProposalStatus("DRAFT");
        }
        record.setCreatedAt(now);
        record.setUpdatedAt(now);
        return response(records.save(record));
    }

    @Transactional
    public OperationsCopilotResponse confirm(String id, String fayAdminSessionToken) {
        OperationsCopilotRecord record = find(id);
        if (!"DRAFT".equals(record.getProposalStatus())) {
            throw new IllegalStateException("仅待确认草案可以执行");
        }
        if (!adminSessionVerifier.verify(fayAdminSessionToken)) {
            throw new SecurityException("需要重新输入管理员密码以确认此操作");
        }
        if (records.claimDraftForExecution(id, LocalDateTime.now()) != 1) {
            throw new IllegalStateException("该草案正在执行或已处理，请勿重复提交");
        }
        record = find(id);
        OperationsCopilotProposalDraft proposal = proposal(record);
        try {
            Map<String, Object> executionResult = sanitizeMap(actionExecutor.execute(proposal));
            record.setExecutionResultJson(write(executionResult));
            record.setProposalStatus("CONFIRMED");
            record.setUpdatedAt(LocalDateTime.now());
            return response(records.save(record));
        } catch (RuntimeException error) {
            record.setExecutionResultJson(write(Map.of("status", "failed")));
            record.setProposalStatus("FAILED");
            record.setUpdatedAt(LocalDateTime.now());
            records.save(record);
            throw new IllegalStateException("草案未执行，请检查应急或知识库服务后重试");
        }
    }

    @Transactional
    public OperationsCopilotResponse discard(String id) {
        OperationsCopilotRecord record = find(id);
        if (!"DRAFT".equals(record.getProposalStatus())) {
            throw new IllegalStateException("仅待确认草案可以忽略");
        }
        record.setProposalStatus("DISCARDED");
        record.setUpdatedAt(LocalDateTime.now());
        return response(records.save(record));
    }

    private OperationsCopilotModelResponse safeGenerate(
            String question,
            String sessionId,
            List<OperationsCopilotMessage> history,
            OperationsCopilotPageContext pageContext,
            Map<String, Object> context
    ) {
        try {
            Map<String, Object> input = new LinkedHashMap<>();
            input.put("question", question);
            input.put("sessionId", sessionId);
            input.put("history", history);
            input.put("pageContext", pageContext);
            input.put("context", context);
            OperationsCopilotModelResponse response = generator.generate(
                    Collections.unmodifiableMap(input));
            if (response != null && response.answer() != null && !response.answer().isBlank()) {
                return response;
            }
            return fallback("模型结果格式不合格，已使用规则分析");
        } catch (RuntimeException ignored) {
            // The caller receives only a safe, read-only rule fallback.
            return fallback("模型服务暂不可用，已使用规则分析");
        }
    }

    private OperationsCopilotModelResponse fallback(String reason) {
        return new OperationsCopilotModelResponse(
                "当前仅能提供基于已接入数据的只读运营建议；请核实现场情况后再创建应急或知识库草案。",
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                "rules",
                reason,
                null
        );
    }

    private Map<String, Object> safeContext() {
        try {
            Map<String, Object> context = contextProvider.build();
            Map<String, Object> withDefaults = new LinkedHashMap<>();
            if (context != null) withDefaults.putAll(context);
            withDefaults.putIfAbsent("dataSources", List.of("当前运营上下文"));
            withDefaults.putIfAbsent("contextUpdatedAt", LocalDateTime.now().toString());
            return sanitizeMap(withDefaults);
        } catch (RuntimeException ignored) {
            return sanitizeMap(Map.of(
                    "dataSources", List.of("当前运营上下文"),
                    "contextUpdatedAt", LocalDateTime.now().toString()
            ));
        }
    }

    private OperationsCopilotProposalDraft safeProposal(OperationsCopilotProposalDraft proposal) {
        if (proposal == null || !ALLOWED_PROPOSAL_TYPES.contains(proposal.type())) return null;
        if (blank(proposal.title()) || blank(proposal.summary()) || proposal.payload() == null) return null;
        String title = safeOutputText(proposal.title(), 160);
        String summary = safeOutputText(proposal.summary(), 600);
        if (blank(title) || blank(summary)) return null;
        return new OperationsCopilotProposalDraft(
                proposal.type(),
                title,
                summary,
                sanitizeMap(proposal.payload())
        );
    }

    private List<String> safeSources(List<String> generated, Map<String, Object> context) {
        List<String> allowed = new ArrayList<>();
        Object raw = context.get("dataSources");
        if (raw instanceof List<?> values) {
            for (Object value : values) {
                if (value instanceof String source && !source.isBlank() && allowed.size() < 8) {
                    String safeSource = safeOutputText(source, 160);
                    if (!blank(safeSource) && !allowed.contains(safeSource)) allowed.add(safeSource);
                }
            }
        }
        if (allowed.isEmpty()) allowed.add("当前运营上下文");
        if (generated == null) return allowed;
        List<String> grounded = generated.stream()
                .filter(source -> source != null && allowed.contains(source.trim()))
                .map(String::trim)
                .distinct()
                .limit(6)
                .toList();
        return grounded.isEmpty() ? allowed : grounded;
    }

    private OperationsCopilotProposalDraft proposal(OperationsCopilotRecord record) {
        if (record.getProposalType() == null) throw new IllegalStateException("没有可执行的 Copilot 草案");
        OperationsCopilotProposalDraft proposal = new OperationsCopilotProposalDraft(
                record.getProposalType(),
                record.getProposalTitle(),
                record.getProposalSummary(),
                readMap(record.getProposalPayloadJson())
        );
        if (safeProposal(proposal) == null) throw new IllegalStateException("Copilot 草案已失效");
        return proposal;
    }

    private OperationsCopilotResponse response(OperationsCopilotRecord record) {
        OperationsCopilotProposalDraft proposal = record.getProposalType() == null
                ? null
                : safeProposal(new OperationsCopilotProposalDraft(
                        record.getProposalType(),
                        record.getProposalTitle(),
                        record.getProposalSummary(),
                        readMap(record.getProposalPayloadJson())
                ));
        Map<String, Object> structured = readMap(record.getStructuredResponseJson());
        return new OperationsCopilotResponse(
                record.getId(),
                safeAnswer(record.getAnswer()),
                safeItems(stringList(structured.get("evidence")), 6, 160),
                safeItems(stringList(structured.get("recommendedActions")), 6, 200),
                safeItems(stringList(structured.get("risks")), 4, 200),
                safeItems(readList(record.getSourcesJson()), 8, 160),
                record.getGenerationSource(),
                safeOutputText(stringValue(structured.get("fallbackReason")), 200),
                proposal,
                safeOutputText(stringValue(structured.get("sessionId")), 64),
                safeOutputText(stringValue(structured.get("contextUpdatedAt")), 64),
                record.getProposalStatus(),
                sanitizeMap(readMap(record.getExecutionResultJson()))
        );
    }

    private OperationsCopilotRecord find(String id) {
        return records.findById(id).orElseThrow(() -> new NoSuchElementException("未找到 Copilot 草案"));
    }

    private String requiredQuestion(String question) {
        if (blank(question)) throw new IllegalArgumentException("请输入运营问题");
        return safeOutputText(question, 600);
    }

    private String safeSessionId(String sessionId) {
        if (blank(sessionId)) return UUID.randomUUID().toString();
        String value = sessionId.trim();
        if (characterCount(value) > MAX_SESSION_ID_LENGTH) {
            throw new IllegalArgumentException("会话标识不能超过 64 个字符");
        }
        return safeOutputText(value, MAX_SESSION_ID_LENGTH);
    }

    private List<OperationsCopilotMessage> safeHistory(List<OperationsCopilotMessage> history) {
        if (history == null) return List.of();
        if (history.size() > MAX_HISTORY_MESSAGES) {
            throw new IllegalArgumentException("仅支持最近 8 条对话历史");
        }
        List<OperationsCopilotMessage> safe = new ArrayList<>();
        int totalLength = 0;
        for (OperationsCopilotMessage message : history) {
            if (message == null || !("user".equals(message.role()) || "assistant".equals(message.role()))) {
                throw new IllegalArgumentException("对话历史仅允许 user 或 assistant 角色");
            }
            String rawContent = message.content() == null ? null : message.content().trim();
            if (blank(rawContent) || characterCount(rawContent) > MAX_HISTORY_ITEM_LENGTH) {
                throw new IllegalArgumentException("单条对话历史不能为空且不能超过 800 个字符");
            }
            totalLength += characterCount(rawContent);
            if (totalLength > MAX_HISTORY_TOTAL_LENGTH) {
                throw new IllegalArgumentException("对话历史总长度不能超过 4800 个字符");
            }
            String content = safeOutputText(rawContent, MAX_HISTORY_ITEM_LENGTH);
            safe.add(new OperationsCopilotMessage(message.role(), content));
        }
        return List.copyOf(safe);
    }

    private OperationsCopilotPageContext safePageContext(OperationsCopilotPageContext pageContext) {
        if (pageContext == null) return null;
        return new OperationsCopilotPageContext(
                optionalText(pageContext.pathname(), 240),
                optionalText(pageContext.pageLabel(), 80),
                optionalText(pageContext.objectType(), 64),
                optionalText(pageContext.objectId(), 128),
                optionalText(pageContext.objectLabel(), 160),
                optionalText(pageContext.dataUpdatedAt(), 64)
        );
    }

    private String optionalText(String value, int maxLength) {
        return safeOutputText(value, maxLength);
    }

    private Map<String, Object> structuredResponse(
            String sessionId,
            String contextUpdatedAt,
            List<String> evidence,
            List<String> recommendedActions,
            List<String> risks,
            String fallbackReason
    ) {
        Map<String, Object> structured = new LinkedHashMap<>();
        structured.put("sessionId", sessionId);
        structured.put("contextUpdatedAt", contextUpdatedAt);
        structured.put("evidence", evidence);
        structured.put("recommendedActions", recommendedActions);
        structured.put("risks", risks);
        structured.put("fallbackReason", fallbackReason);
        return structured;
    }

    private String contextUpdatedAt(Map<String, Object> context) {
        String updatedAt = safeOutputText(stringValue(context.get("contextUpdatedAt")), 64);
        return blank(updatedAt) ? LocalDateTime.now().toString() : updatedAt;
    }

    private List<String> safeItems(List<String> values, int maxItems, int maxLength) {
        if (values == null) return List.of();
        List<String> safe = new ArrayList<>();
        for (String value : values) {
            String item = safeOutputText(value, maxLength);
            if (!blank(item) && !safe.contains(item)) safe.add(item);
            if (safe.size() == maxItems) break;
        }
        return List.copyOf(safe);
    }

    private String safeOutputText(String value, int maxLength) {
        if (blank(value)) return null;
        String safe = SENSITIVE_VALUE.matcher(value.trim()).replaceAll("$1=[REDACTED]");
        safe = BEARER_VALUE.matcher(safe).replaceAll("Bearer [REDACTED]");
        return takeCharacters(safe, maxLength);
    }

    private int characterCount(String value) {
        return value.codePointCount(0, value.length());
    }

    private String takeCharacters(String value, int maxLength) {
        if (characterCount(value) <= maxLength) return value;
        return value.substring(0, value.offsetByCodePoints(0, maxLength));
    }

    private Map<String, Object> sanitizeMap(Map<?, ?> value) {
        return sanitizeMap(value, 0);
    }

    private Map<String, Object> sanitizeMap(Map<?, ?> value, int depth) {
        if (value == null || depth > 6) return Map.of();
        Map<String, Object> safe = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : value.entrySet()) {
            if (!(entry.getKey() instanceof String key) || sensitiveKey(key)) continue;
            Object item = sanitizeValue(entry.getValue(), depth + 1);
            if (item != null) safe.put(key, item);
        }
        return Collections.unmodifiableMap(safe);
    }

    private Object sanitizeValue(Object value, int depth) {
        if (value == null || depth > 6) return null;
        if (value instanceof String text) return safeOutputText(text, 2_000);
        if (value instanceof Number || value instanceof Boolean) return value;
        if (value instanceof Map<?, ?> map) return sanitizeMap(map, depth);
        if (value instanceof List<?> values) {
            List<Object> safe = new ArrayList<>();
            for (Object item : values) {
                Object normalized = sanitizeValue(item, depth + 1);
                if (normalized != null) safe.add(normalized);
                if (safe.size() == 50) break;
            }
            return Collections.unmodifiableList(safe);
        }
        return null;
    }

    private boolean sensitiveKey(String key) {
        String normalized = NON_ALPHANUMERIC.matcher(key.toLowerCase(Locale.ROOT)).replaceAll("");
        return normalized.contains("password")
                || normalized.contains("secret")
                || normalized.contains("token")
                || normalized.equals("apikey")
                || normalized.equals("authorization")
                || normalized.contains("credential")
                || normalized.matches(".*(?:api|access|private|client|signing|encryption|weather)key(?:id)?$");
    }

    private List<String> stringList(Object value) {
        if (!(value instanceof List<?> values)) return List.of();
        List<String> strings = new ArrayList<>();
        for (Object item : values) {
            if (item instanceof String text) strings.add(text);
        }
        return strings;
    }

    private String stringValue(Object value) {
        return value instanceof String text ? text : null;
    }

    private String safeAnswer(String answer) {
        if (blank(answer)) return "当前仅能提供只读运营建议，请稍后重试。";
        return safeOutputText(answer, 800);
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("无法保存 Copilot 审计记录");
        }
    }

    private List<String> readList(String value) {
        if (blank(value)) return List.of();
        try {
            return objectMapper.readValue(value, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException error) {
            return List.of();
        }
    }

    private Map<String, Object> readMap(String value) {
        if (blank(value)) return Map.of();
        try {
            return objectMapper.readValue(value, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException error) {
            return Map.of();
        }
    }
}
