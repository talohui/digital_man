package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.dto.EmergencyEventDto;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DecisionOperationsCopilotContextProvider implements OperationsCopilotContextProvider {
    private final MarketingDecisionService marketingDecisionService;
    private final EmergencyEventService emergencyEventService;

    public DecisionOperationsCopilotContextProvider(
            MarketingDecisionService marketingDecisionService,
            EmergencyEventService emergencyEventService
    ) {
        this.marketingDecisionService = marketingDecisionService;
        this.emergencyEventService = emergencyEventService;
    }

    @Override
    public Map<String, Object> build() {
        Map<String, Object> context = new LinkedHashMap<>();
        List<String> dataSources = new ArrayList<>();
        List<Map<String, String>> decisionCards = new ArrayList<>();
        try {
            DecisionResponse decision = marketingDecisionService.getDecisionCards(false);
            if (decision != null) {
                if (decision.dataSources() != null) {
                    dataSources.addAll(decision.dataSources().stream()
                            .filter(value -> value != null && !value.isBlank())
                            .limit(10)
                            .toList());
                }
                if (decision.cards() != null) {
                    for (DecisionCard card : decision.cards().stream().limit(5).toList()) {
                        if (card == null) continue;
                        Map<String, String> safeCard = new LinkedHashMap<>();
                        safeCard.put("title", text(card.title()));
                        safeCard.put("type", text(card.type()));
                        safeCard.put("priority", text(card.priority()));
                        decisionCards.add(safeCard);
                    }
                }
                context.put("decisionSummary", text(decision.summary()));
                context.put("decisionGenerationSource", text(decision.generationSource()));
            }
        } catch (RuntimeException ignored) {
            context.put("decisionSummary", "当前决策面板数据暂不可用");
        }
        if (dataSources.isEmpty()) dataSources.add("当前运营上下文");
        context.put("dataSources", dataSources);
        context.put("decisionCards", decisionCards);
        context.put("activeEmergencies", activeEmergencySummary());
        context.put("contextUpdatedAt", LocalDateTime.now().toString());
        return context;
    }

    private List<Map<String, String>> activeEmergencySummary() {
        try {
            return emergencyEventService.active(LocalDateTime.now()).stream()
                    .limit(10)
                    .map(this::safeEmergency)
                    .toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private Map<String, String> safeEmergency(EmergencyEventDto event) {
        Map<String, String> summary = new LinkedHashMap<>();
        summary.put("type", text(event.type()));
        summary.put("title", text(event.title()));
        summary.put("severity", text(event.severity()));
        summary.put("routePolicy", text(event.routePolicy()));
        return summary;
    }

    private String text(String value) {
        return value == null ? "" : value.trim();
    }
}
