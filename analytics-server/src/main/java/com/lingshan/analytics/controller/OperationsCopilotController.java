package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.OperationsCopilotQueryRequest;
import com.lingshan.analytics.dto.OperationsCopilotProposalUpdateRequest;
import com.lingshan.analytics.dto.OperationsCopilotResponse;
import com.lingshan.analytics.service.OperationsCopilotService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/dashboard/operations-copilot")
public class OperationsCopilotController {
    private final OperationsCopilotService service;

    public OperationsCopilotController(OperationsCopilotService service) {
        this.service = service;
    }

    @PostMapping("/query")
    public OperationsCopilotResponse query(@RequestBody OperationsCopilotQueryRequest request) {
        return service.ask(request);
    }

    @PostMapping("/{id}/confirm")
    public OperationsCopilotResponse confirm(
            @PathVariable String id,
            @RequestHeader(value = "X-Fay-Admin-Session", defaultValue = "") String fayAdminSessionToken,
            @RequestHeader(value = HttpHeaders.IF_MATCH, defaultValue = "") String proposalRevision
    ) {
        return service.confirm(id, fayAdminSessionToken, proposalRevision);
    }

    @PatchMapping("/{id}/proposal")
    public OperationsCopilotResponse updateProposal(
            @PathVariable String id,
            @RequestBody OperationsCopilotProposalUpdateRequest request
    ) {
        return service.updateProposal(id, request);
    }

    @PostMapping("/{id}/discard")
    public OperationsCopilotResponse discard(@PathVariable String id) {
        return service.discard(id);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> unauthorized(SecurityException error) {
        return error(401, error.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException error) {
        return error(400, error.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> conflict(IllegalStateException error) {
        return error(409, error.getMessage());
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> notFound(NoSuchElementException error) {
        return error(404, error.getMessage());
    }

    private ResponseEntity<Map<String, Object>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("ok", false, "message", message));
    }
}
