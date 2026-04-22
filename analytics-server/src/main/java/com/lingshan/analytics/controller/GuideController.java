package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.GuideFeedbackRequest;
import com.lingshan.analytics.dto.GuideRecommendationRequest;
import com.lingshan.analytics.dto.GuideRecommendationResponse;
import com.lingshan.analytics.service.GuideRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/guide")
public class GuideController {

    private final GuideRecommendationService guideRecommendationService;

    public GuideController(GuideRecommendationService guideRecommendationService) {
        this.guideRecommendationService = guideRecommendationService;
    }

    @PostMapping("/recommendations")
    public GuideRecommendationResponse recommendations(@RequestBody GuideRecommendationRequest request) {
        return guideRecommendationService.recommend(request);
    }

    @PostMapping("/feedback")
    public Map<String, Object> feedback(@RequestBody GuideFeedbackRequest request) {
        guideRecommendationService.recordFeedback(request);
        return Map.of("ok", true);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException error) {
        return ResponseEntity.badRequest().body(Map.of(
                "ok", false,
                "message", error.getMessage()
        ));
    }
}
