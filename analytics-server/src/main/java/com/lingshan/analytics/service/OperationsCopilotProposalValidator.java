package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.OperationsCopilotProposalDraft;
import com.lingshan.analytics.dto.OperationsCopilotProposalUpdateRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class OperationsCopilotProposalValidator {
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "EMERGENCY_DRAFT", "KB_CREATE", "KB_UPDATE", "KB_DEACTIVATE"
    );
    private static final Set<String> EMERGENCY_TYPES = Set.of(
            "SCENIC_CLOSURE", "SHOW_CANCELLED", "EXTREME_WEATHER", "CROWDING", "ROAD_CLOSURE"
    );
    private static final Set<String> SEVERITIES = Set.of("INFO", "WARNING", "CRITICAL");
    private static final Set<String> ROUTE_POLICIES = Set.of("NONE", "PENALIZE", "EXCLUDE");
    private static final Map<String, Set<String>> ALLOWED_PAYLOAD_FIELDS = Map.of(
            "EMERGENCY_DRAFT", Set.of(
                    "type", "title", "message", "severity", "affectedSpotIds",
                    "affectedRouteIds", "validFrom", "validUntil", "routePolicy"
            ),
            "KB_CREATE", Set.of("question", "answer", "tags", "validFrom", "validUntil"),
            "KB_UPDATE", Set.of("faqId", "question", "answer", "tags", "validFrom", "validUntil"),
            "KB_DEACTIVATE", Set.of("faqId")
    );
    private static final Map<String, Set<String>> REQUIRED_PAYLOAD_FIELDS = Map.of(
            "EMERGENCY_DRAFT", Set.of("type", "title", "message", "severity", "routePolicy"),
            "KB_CREATE", Set.of("question", "answer"),
            "KB_UPDATE", Set.of("faqId", "question", "answer"),
            "KB_DEACTIVATE", Set.of("faqId")
    );
    private static final Set<String> LIST_FIELDS = Set.of("affectedSpotIds", "affectedRouteIds", "tags");

    public OperationsCopilotProposalDraft validateDraft(OperationsCopilotProposalDraft proposal) {
        if (proposal == null || !ALLOWED_TYPES.contains(proposal.type())) {
            throw new IllegalArgumentException("Copilot 草案类型无效");
        }
        String title = requiredText(proposal.title(), "草案标题", 160);
        String summary = requiredText(proposal.summary(), "草案摘要", 600);
        if (proposal.payload() == null) {
            throw new IllegalArgumentException("Copilot 草案内容不能为空");
        }
        Set<String> allowed = ALLOWED_PAYLOAD_FIELDS.get(proposal.type());
        for (String field : proposal.payload().keySet()) {
            if (!allowed.contains(field)) {
                throw new IllegalArgumentException("Copilot 草案包含不允许的字段：" + field);
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : proposal.payload().entrySet()) {
            String field = entry.getKey();
            Object value = entry.getValue();
            if (value == null) continue;
            if (LIST_FIELDS.contains(field)) {
                payload.put(field, normalizeList(field, value));
                continue;
            }
            if (!(value instanceof String text)) {
                throw new IllegalArgumentException("Copilot 草案字段格式无效：" + field);
            }
            String normalized = text.trim();
            if (normalized.isEmpty()) continue;
            int maxLength = scalarLimit(field);
            if (normalized.codePointCount(0, normalized.length()) > maxLength) {
                throw new IllegalArgumentException("Copilot 草案字段长度超出限制：" + field);
            }
            payload.put(field, normalized);
        }

        for (String field : REQUIRED_PAYLOAD_FIELDS.get(proposal.type())) {
            if (!(payload.get(field) instanceof String value) || value.isBlank()) {
                throw new IllegalArgumentException(field + "不能为空");
            }
        }
        validateSemantics(proposal.type(), payload);
        return new OperationsCopilotProposalDraft(
                proposal.type(), title, summary, Collections.unmodifiableMap(payload));
    }

    public void validateUpdate(String existingType, OperationsCopilotProposalUpdateRequest request) {
        if (!ALLOWED_TYPES.contains(existingType)) {
            throw new IllegalArgumentException("Copilot 草案类型无效");
        }
        if (request == null) {
            throw new IllegalArgumentException("Copilot 草案修改不能为空");
        }
        if (!request.unknownFields().isEmpty()) {
            throw new IllegalArgumentException("Copilot 草案包含不允许的字段："
                    + request.unknownFields().iterator().next());
        }
        if (request.payload() != null) {
            Set<String> allowed = ALLOWED_PAYLOAD_FIELDS.get(existingType);
            for (String field : request.payload().keySet()) {
                if (!allowed.contains(field)) {
                    throw new IllegalArgumentException("Copilot 草案包含不允许的字段：" + field);
                }
            }
        }
    }

    public OperationsCopilotProposalDraft validateForExecution(OperationsCopilotProposalDraft proposal) {
        OperationsCopilotProposalDraft validated = validateDraft(proposal);
        if ("KB_UPDATE".equals(validated.type()) || "KB_DEACTIVATE".equals(validated.type())) {
            throw new IllegalArgumentException("知识更新或停用需要来自只读知识目录的可信 FAQ ID");
        }
        return validated;
    }

    private List<String> normalizeList(String field, Object value) {
        if (!(value instanceof List<?> values)) {
            throw new IllegalArgumentException("Copilot 草案字段格式无效：" + field);
        }
        int maxItems = "tags".equals(field) ? 10 : 12;
        int maxLength = "tags".equals(field) ? 48 : 64;
        if (values.size() > maxItems) {
            throw new IllegalArgumentException("Copilot 草案字段数量超出限制：" + field);
        }
        List<String> normalized = new ArrayList<>();
        for (Object item : values) {
            if (!(item instanceof String text) || text.isBlank()) {
                throw new IllegalArgumentException("Copilot 草案字段格式无效：" + field);
            }
            String trimmed = text.trim();
            if (trimmed.codePointCount(0, trimmed.length()) > maxLength) {
                throw new IllegalArgumentException("Copilot 草案字段长度超出限制：" + field);
            }
            normalized.add(trimmed);
        }
        return List.copyOf(normalized);
    }

    private void validateSemantics(String proposalType, Map<String, Object> payload) {
        if ("EMERGENCY_DRAFT".equals(proposalType)) {
            if (!EMERGENCY_TYPES.contains(payload.get("type"))
                    || !SEVERITIES.contains(payload.get("severity"))
                    || !ROUTE_POLICIES.contains(payload.get("routePolicy"))) {
                throw new IllegalArgumentException("应急草案包含不允许的选项");
            }
        }
        LocalDateTime validFrom = parseTime(payload.get("validFrom"));
        LocalDateTime validUntil = parseTime(payload.get("validUntil"));
        if ("EMERGENCY_DRAFT".equals(proposalType)) {
            LocalDateTime effectiveFrom = validFrom == null ? LocalDateTime.now() : validFrom;
            LocalDateTime effectiveUntil = validUntil == null ? effectiveFrom.plusHours(2) : validUntil;
            if (!effectiveUntil.isAfter(effectiveFrom)) {
                throw new IllegalArgumentException("Copilot 草案时间范围无效");
            }
            return;
        }
        if (validFrom != null && validUntil != null && !validUntil.isAfter(validFrom)) {
            throw new IllegalArgumentException("Copilot 草案时间范围无效");
        }
    }

    private LocalDateTime parseTime(Object value) {
        if (!(value instanceof String text) || text.isBlank()) return null;
        try {
            return LocalDateTime.parse(text);
        } catch (DateTimeParseException error) {
            throw new IllegalArgumentException("Copilot 草案时间格式无效");
        }
    }

    private int scalarLimit(String field) {
        return switch (field) {
            case "type" -> 32;
            case "title" -> 120;
            case "message" -> 400;
            case "severity", "routePolicy" -> 16;
            case "question" -> 240;
            case "answer" -> 1_200;
            case "faqId" -> 80;
            case "validFrom", "validUntil" -> 48;
            default -> throw new IllegalArgumentException("Copilot 草案字段无效：" + field);
        };
    }

    private String requiredText(Object value, String label, int maxLength) {
        if (!(value instanceof String text) || text.isBlank()) {
            throw new IllegalArgumentException(label + "不能为空");
        }
        String trimmed = text.trim();
        if (trimmed.codePointCount(0, trimmed.length()) > maxLength) {
            throw new IllegalArgumentException(label + "长度超出限制");
        }
        return trimmed;
    }
}
