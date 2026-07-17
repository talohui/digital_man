package com.lingshan.analytics.service;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

class OperationsCopilotExecutionStateServiceTest {
    @Test
    void uses_independent_short_transactions_for_every_state_transition() throws Exception {
        for (String method : new String[]{"claim", "discard", "complete", "fail", "reconcile"}) {
            Transactional transaction = switch (method) {
                case "claim" -> OperationsCopilotExecutionStateService.class
                        .getDeclaredMethod(method, String.class, String.class)
                        .getAnnotation(Transactional.class);
                case "discard" -> OperationsCopilotExecutionStateService.class
                        .getDeclaredMethod(method, String.class)
                        .getAnnotation(Transactional.class);
                default -> OperationsCopilotExecutionStateService.class
                        .getDeclaredMethod(method, String.class, java.util.Map.class)
                        .getAnnotation(Transactional.class);
            };
            assertThat(transaction).isNotNull();
            assertThat(transaction.propagation()).isEqualTo(Propagation.REQUIRES_NEW);
        }
        assertThat(OperationsCopilotService.class
                .getDeclaredMethod("confirm", String.class, String.class, String.class)
                .getAnnotation(Transactional.class))
                .as("外部副作用不能包在 OperationsCopilotService 的长事务中")
                .isNull();
    }
}
