package com.lingshan.analytics.controller;

import com.lingshan.analytics.dto.EventRequest;
import com.lingshan.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AnalyticsController {

    private final AnalyticsService service;

    public AnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> receiveEvent(@RequestBody EventRequest request) {
        service.saveEvent(request);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return service.getSummary();
    }

    @GetMapping("/sentiment-trend")
    public List<Map<String, Object>> sentimentTrend(
            @RequestParam(defaultValue = "12") int hours) {
        return service.getSentimentTrend(hours);
    }

    @GetMapping("/popular-questions")
    public List<Map<String, Object>> popularQuestions(
            @RequestParam(defaultValue = "10") int limit) {
        return service.getPopularQuestions(limit);
    }

    @GetMapping("/latency-stats")
    public Map<String, Object> latencyStats(
            @RequestParam(defaultValue = "24") int hours) {
        return service.getLatencyStats(hours);
    }

    @GetMapping("/realtime")
    public Map<String, Object> realtime() {
        return service.getRealtime();
    }
}
