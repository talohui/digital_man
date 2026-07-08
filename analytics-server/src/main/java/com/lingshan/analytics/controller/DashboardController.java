package com.lingshan.analytics.controller;

import com.lingshan.analytics.service.DashboardService;
import com.lingshan.analytics.service.VisitorBehaviorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService service;
    private final VisitorBehaviorService visitorBehaviorService;

    public DashboardController(DashboardService service, VisitorBehaviorService visitorBehaviorService) {
        this.service = service;
        this.visitorBehaviorService = visitorBehaviorService;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam(defaultValue = "5") int activeWindowMinutes) {
        return service.overview(activeWindowMinutes);
    }

    @GetMapping("/chat-insights")
    public Map<String, Object> chatInsights() { return service.chatInsights(); }

    @GetMapping("/behavior")
    public Map<String, Object> behavior() { return service.behavior(); }

    @GetMapping("/ticketing")
    public Map<String, Object> ticketing() { return service.ticketing(); }

    @GetMapping("/consumption")
    public Map<String, Object> consumption() { return service.consumption(); }

    @GetMapping("/visitor-behavior")
    public Map<String, Object> visitorBehavior(@RequestParam(defaultValue = "realtime") String mode) {
        return visitorBehaviorService.dashboard(mode);
    }

    @GetMapping("/persona")
    public Map<String, Object> persona() { return service.persona(); }

    @GetMapping("/service-quality")
    public Map<String, Object> serviceQuality() { return service.serviceQuality(); }

    @GetMapping("/recommendation")
    public Map<String, Object> recommendation() { return service.recommendation(); }

    @GetMapping("/realtime")
    public Map<String, Object> realtime(@RequestParam(defaultValue = "5") int activeWindowMinutes) {
        return service.realtime(activeWindowMinutes);
    }
}
