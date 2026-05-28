package com.lingshan.analytics.controller;

import com.lingshan.analytics.service.OfficialBehaviorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/official-behavior")
public class OfficialBehaviorController {

    private final OfficialBehaviorService service;

    public OfficialBehaviorController(OfficialBehaviorService service) {
        this.service = service;
    }

    @GetMapping("/source-meta")
    public Map<String, Object> sourceMeta() {
        return service.sourceMeta();
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return service.summary();
    }

    @GetMapping("/demographics")
    public Map<String, Object> demographics() {
        return service.demographics();
    }

    @GetMapping("/attraction-types")
    public Map<String, Object> attractionTypes() {
        return service.attractionTypes();
    }

    @GetMapping("/satisfaction")
    public Map<String, Object> satisfaction() {
        return service.satisfaction();
    }

    @GetMapping("/spending")
    public Map<String, Object> spending() {
        return service.spending();
    }

    @GetMapping("/trends")
    public Map<String, Object> trends() {
        return service.trends();
    }

    @GetMapping("/recommendation-priors")
    public Map<String, Object> recommendationPriors() {
        return service.recommendationPriors();
    }
}
