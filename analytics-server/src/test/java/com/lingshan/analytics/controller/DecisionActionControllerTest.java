package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.CreateDecisionActionRequest;
import com.lingshan.analytics.dto.EvaluateDecisionActionRequest;
import com.lingshan.analytics.dto.UpdateDecisionActionRequest;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import static org.assertj.core.api.Assertions.assertThat;

class DecisionActionControllerTest {
    @Test
    void exposesCreateUpdateAndEvaluateRoutes() throws Exception {
        assertThat(DecisionActionController.class.getAnnotation(RequestMapping.class).value())
                .containsExactly("/api/dashboard/decision-actions");
        assertThat(DecisionActionController.class.getDeclaredMethod("create", CreateDecisionActionRequest.class)
                .getAnnotation(PostMapping.class).value()).containsExactly("");
        assertThat(DecisionActionController.class.getDeclaredMethod("update", String.class, UpdateDecisionActionRequest.class)
                .getAnnotation(PatchMapping.class).value()).containsExactly("/{id}");
        assertThat(DecisionActionController.class.getDeclaredMethod("evaluate", String.class, EvaluateDecisionActionRequest.class)
                .getAnnotation(PostMapping.class).value()).containsExactly("/{id}/evaluate");
    }
}
