package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.OperationsCopilotProposalUpdateRequest;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.PatchMapping;

import static org.assertj.core.api.Assertions.assertThat;

class OperationsCopilotControllerTest {
    @Test
    void exposes_a_draft_only_proposal_patch_route_without_an_action_type_parameter() throws Exception {
        var method = OperationsCopilotController.class.getDeclaredMethod(
                "updateProposal", String.class, OperationsCopilotProposalUpdateRequest.class);

        assertThat(method.getAnnotation(PatchMapping.class).value())
                .containsExactly("/{id}/proposal");
        assertThat(OperationsCopilotProposalUpdateRequest.class.getDeclaredFields())
                .extracting("name")
                .contains("title", "summary", "payload")
                .doesNotContain("type", "actionType");
    }
}
