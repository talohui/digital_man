package com.lingshan.analytics.controller;

import com.lingshan.analytics.service.PersonaEngine;
import com.lingshan.analytics.service.RecommendExplainService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final PersonaEngine personaEngine;
    private final RecommendExplainService explainService;

    public ProfileController(PersonaEngine personaEngine, RecommendExplainService explainService) {
        this.personaEngine = personaEngine;
        this.explainService = explainService;
    }

    @GetMapping("/profile/{userId}")
    public Map<String, Object> profile(@PathVariable String userId) {
        return personaEngine.getProfile(userId);
    }

    @GetMapping("/recommend/explain/{userId}")
    public Map<String, Object> explain(@PathVariable String userId) {
        return explainService.explain(userId);
    }
}
