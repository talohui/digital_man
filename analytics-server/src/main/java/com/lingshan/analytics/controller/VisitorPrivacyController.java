package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.VisitorConsentDto;
import com.lingshan.analytics.dto.VisitorConsentRequest;
import com.lingshan.analytics.dto.VisitorDeleteResult;
import com.lingshan.analytics.dto.VisitorPrivacyExport;
import com.lingshan.analytics.dto.VisitorPrivacySummary;
import com.lingshan.analytics.service.VisitorPrivacyService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visitor/privacy/{userId}")
public class VisitorPrivacyController {
    private final VisitorPrivacyService service;

    public VisitorPrivacyController(VisitorPrivacyService service) {
        this.service = service;
    }

    @GetMapping
    public VisitorPrivacySummary summary(@PathVariable String userId) { return service.summary(userId); }

    @PutMapping("/consent")
    public VisitorConsentDto updateConsent(@PathVariable String userId, @RequestBody VisitorConsentRequest request) {
        return service.updateConsent(userId, request.personalizationEnabled(), request.analyticsEnabled());
    }

    @GetMapping("/export")
    public VisitorPrivacyExport export(@PathVariable String userId) { return service.export(userId); }

    @DeleteMapping
    public VisitorDeleteResult deleteAll(@PathVariable String userId) { return service.deleteAll(userId); }
}
