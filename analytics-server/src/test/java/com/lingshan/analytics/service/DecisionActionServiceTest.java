package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.entity.DecisionAction;
import com.lingshan.analytics.entity.DecisionCardRecord;
import com.lingshan.analytics.repository.DecisionActionRepository;
import com.lingshan.analytics.repository.DecisionCardRecordRepository;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DecisionActionServiceTest {

    @Test
    void enforcesTransitionsAndEvaluatesTwoWindows() {
        Map<String, DecisionAction> actions = new LinkedHashMap<>();
        LocalDateTime baselineStart = LocalDateTime.of(2026, 7, 12, 8, 0);
        LocalDateTime baselineEnd = LocalDateTime.of(2026, 7, 12, 10, 0);
        LocalDateTime resultStart = LocalDateTime.of(2026, 7, 13, 8, 0);
        LocalDateTime resultEnd = LocalDateTime.of(2026, 7, 13, 10, 0);
        DecisionActionService service = new DecisionActionService(
                actionRepository(actions), cardRepository(), eventRepository(
                        baselineStart, List.of(event("user_message", "negative", null, "{}")),
                        resultStart, List.of(
                                event("user_message", "positive", null, "{}"),
                                event("route_click", null, null, "{}"),
                                event("purchase", null, null, "{\"amount\":128}"),
                                event("ai_reply", null, 900.0, "{}")
                        )
                ), new ObjectMapper()
        );

        var created = service.create("card-1", "推送祈福路线");
        assertThatThrownBy(() -> service.update(created.id(), "COMPLETED", null, null, null))
                .isInstanceOf(IllegalStateException.class);
        var accepted = service.update(created.id(), "ACCEPTED", "运营一组", resultEnd, "先试运行");
        var evaluated = service.evaluate(created.id(), baselineStart, baselineEnd, resultStart, resultEnd);

        assertThat(accepted.status()).isEqualTo("ACCEPTED");
        assertThat(accepted.owner()).isEqualTo("运营一组");
        assertThat(((Number) evaluated.baselineMetrics().get("questionCount")).longValue()).isEqualTo(1L);
        assertThat(((Number) evaluated.resultMetrics().get("routeClicks")).longValue()).isEqualTo(1L);
        assertThat((Double) evaluated.resultMetrics().get("purchaseAmount")).isEqualTo(128.0);
        assertThat((Double) evaluated.resultMetrics().get("p90LatencyMs")).isEqualTo(900.0);
    }

    private DecisionActionRepository actionRepository(Map<String, DecisionAction> actions) {
        return (DecisionActionRepository) Proxy.newProxyInstance(
                DecisionActionRepository.class.getClassLoader(), new Class<?>[]{DecisionActionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        DecisionAction action = (DecisionAction) args[0];
                        actions.put(action.getId(), action);
                        yield action;
                    }
                    case "findById" -> Optional.ofNullable(actions.get((String) args[0]));
                    case "toString" -> "InMemoryDecisionActionRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private DecisionCardRecordRepository cardRepository() {
        DecisionCardRecord card = new DecisionCardRecord();
        card.setId("card-1");
        card.setSnapshotId("snapshot-1");
        return (DecisionCardRecordRepository) Proxy.newProxyInstance(
                DecisionCardRecordRepository.class.getClassLoader(), new Class<?>[]{DecisionCardRecordRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.of(card);
                    case "toString" -> "InMemoryDecisionCardRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private EventRepository eventRepository(
            LocalDateTime baselineStart, List<AnalyticsEvent> baseline,
            LocalDateTime resultStart, List<AnalyticsEvent> result
    ) {
        return (EventRepository) Proxy.newProxyInstance(
                EventRepository.class.getClassLoader(), new Class<?>[]{EventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByTsBetween" -> ((LocalDateTime) args[0]).equals(baselineStart) ? baseline : result;
                    case "toString" -> "WindowedEventRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private AnalyticsEvent event(String name, String sentiment, Double latency, String properties) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEvent(name);
        event.setSentiment(sentiment);
        event.setLatencyMs(latency);
        event.setProperties(properties);
        event.setTs(LocalDateTime.now());
        return event;
    }
}
