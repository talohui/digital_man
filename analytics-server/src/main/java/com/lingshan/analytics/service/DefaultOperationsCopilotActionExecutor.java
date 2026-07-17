package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EmergencyEventDto;
import com.lingshan.analytics.dto.EmergencyEventRequest;
import com.lingshan.analytics.dto.OperationsCopilotProposalDraft;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DefaultOperationsCopilotActionExecutor implements OperationsCopilotActionExecutor {
    private static final Set<String> EMERGENCY_TYPES = Set.of(
            "SCENIC_CLOSURE", "SHOW_CANCELLED", "EXTREME_WEATHER", "CROWDING", "ROAD_CLOSURE"
    );
    private static final Set<String> SEVERITIES = Set.of("INFO", "WARNING", "CRITICAL");
    private static final Set<String> ROUTE_POLICIES = Set.of("NONE", "PENALIZE", "EXCLUDE");

    private final EmergencyEventService emergencyEventService;
    private final KnowledgeBaseTransport knowledgeBaseTransport;
    private final OperationsCopilotProposalValidator proposalValidator;

    @Autowired
    public DefaultOperationsCopilotActionExecutor(
            EmergencyEventService emergencyEventService,
            KnowledgeBaseTransport knowledgeBaseTransport,
            OperationsCopilotProposalValidator proposalValidator
    ) {
        this.emergencyEventService = emergencyEventService;
        this.knowledgeBaseTransport = knowledgeBaseTransport;
        this.proposalValidator = proposalValidator;
    }

    public DefaultOperationsCopilotActionExecutor(
            EmergencyEventService emergencyEventService,
            KnowledgeBaseTransport knowledgeBaseTransport
    ) {
        this(emergencyEventService, knowledgeBaseTransport, new OperationsCopilotProposalValidator());
    }

    @Override
    public Map<String, Object> execute(String operationId, OperationsCopilotProposalDraft proposal) {
        if (operationId == null || operationId.isBlank()) {
            throw new IllegalArgumentException("Copilot 操作标识不能为空");
        }
        proposal = proposalValidator.validateForExecution(proposal);
        return switch (proposal.type()) {
            case "EMERGENCY_DRAFT" -> publishEmergency(operationId, proposal.payload());
            case "KB_CREATE" -> createKnowledge(operationId, proposal.payload());
            case "KB_UPDATE", "KB_DEACTIVATE" ->
                    throw new IllegalArgumentException("知识更新或停用需要来自只读知识目录的可信 FAQ ID");
            default -> throw new IllegalArgumentException("Copilot 草案类型无效");
        };
    }

    private Map<String, Object> publishEmergency(String operationId, Map<String, Object> payload) {
        String type = required(payload, "type", 32);
        String severity = required(payload, "severity", 16);
        String routePolicy = required(payload, "routePolicy", 16);
        if (!EMERGENCY_TYPES.contains(type) || !SEVERITIES.contains(severity) || !ROUTE_POLICIES.contains(routePolicy)) {
            throw new IllegalArgumentException("应急草案包含不允许的选项");
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime validFrom = time(payload, "validFrom", now);
        LocalDateTime validUntil = time(payload, "validUntil", validFrom.plusHours(2));
        if (!validUntil.isAfter(validFrom)) throw new IllegalArgumentException("应急草案有效期无效");
        EmergencyEventRequest request = new EmergencyEventRequest(
                type,
                required(payload, "title", 120),
                required(payload, "message", 400),
                severity,
                stringList(payload.get("affectedSpotIds")),
                stringList(payload.get("affectedRouteIds")),
                validFrom,
                validUntil,
                routePolicy,
                null,
                null
        );
        EmergencyEventDto draft = emergencyEventService.create(request);
        EmergencyEventDto published;
        try {
            published = emergencyEventService.publish(draft.id(), now);
        } catch (RuntimeException error) {
            throw new OperationsCopilotUncertainOutcomeException(Map.of(
                    "kind", "emergency",
                    "id", draft.id(),
                    "status", draft.status(),
                    "operationId", operationId
            ));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kind", "emergency");
        result.put("id", published.id());
        result.put("status", published.status());
        result.put("syncStatus", published.kbSyncStatus() == null ? "PENDING" : published.kbSyncStatus());
        result.put("operationId", operationId);
        return result;
    }

    private Map<String, Object> createKnowledge(String operationId, Map<String, Object> payload) {
        Map<String, Object> body = knowledgeBody(payload);
        body.put("operationId", operationId);
        body.put("sourceType", "admin_copilot");
        body.put("status", "active");
        Map<String, Object> response;
        try {
            response = knowledgeBaseTransport.postFaq(body);
        } catch (RuntimeException error) {
            throw new OperationsCopilotUncertainOutcomeException(Map.of(
                    "kind", "knowledge",
                    "operationId", operationId
            ));
        }
        String id;
        try {
            id = faqId(response);
        } catch (RuntimeException error) {
            throw new OperationsCopilotUncertainOutcomeException(Map.of(
                    "kind", "knowledge",
                    "operationId", operationId
            ));
        }
        return Map.of(
                "kind", "knowledge",
                "id", id,
                "status", "active",
                "operationId", operationId
        );
    }

    private Map<String, Object> knowledgeBody(Map<String, Object> payload) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("question", required(payload, "question", 240));
        body.put("answer", required(payload, "answer", 1200));
        body.put("tags", stringList(payload.get("tags")));
        optional(body, "validFrom", text(payload.get("validFrom"), 48));
        optional(body, "validUntil", text(payload.get("validUntil"), 48));
        return body;
    }

    private String faqId(Map<String, Object> response) {
        Object faq = response == null ? null : response.get("faq");
        if (faq instanceof Map<?, ?> item && item.get("id") instanceof String id && !id.isBlank()) {
            return id;
        }
        throw new IllegalStateException("知识库未返回 FAQ ID");
    }

    private LocalDateTime time(Map<String, Object> payload, String field, LocalDateTime fallback) {
        String value = text(payload.get(field), 48);
        if (value.isBlank()) return fallback;
        try {
            return LocalDateTime.parse(value);
        } catch (RuntimeException error) {
            throw new IllegalArgumentException("应急草案时间格式无效");
        }
    }

    private List<String> stringList(Object value) {
        if (!(value instanceof List<?> values)) return List.of();
        List<String> items = new ArrayList<>();
        for (Object item : values) {
            String text = text(item, 64);
            if (!text.isBlank() && items.size() < 12) items.add(text);
        }
        return items;
    }

    private String required(Map<String, Object> payload, String field, int maxLength) {
        String value = text(payload.get(field), maxLength);
        if (value.isBlank()) throw new IllegalArgumentException("Copilot 草案字段不能为空：" + field);
        return value;
    }

    private String text(Object value, int maxLength) {
        if (!(value instanceof String text)) return "";
        text = text.trim();
        if (text.codePointCount(0, text.length()) > maxLength) {
            throw new IllegalArgumentException("Copilot 草案字段长度超出限制");
        }
        return text;
    }

    private void optional(Map<String, Object> body, String key, String value) {
        if (!value.isBlank()) body.put(key, value);
    }
}
