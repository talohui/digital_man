package com.lingshan.analytics.controller;

import com.lingshan.analytics.service.DashboardService;
import com.lingshan.analytics.service.DecisionHistoryService;
import com.lingshan.analytics.service.MarketingDecisionService;
import com.lingshan.analytics.service.ServiceHealthService;
import com.lingshan.analytics.service.VisitorBehaviorService;
import com.lingshan.analytics.dto.DecisionComparison;
import com.lingshan.analytics.dto.DecisionHistoryPage;
import com.lingshan.analytics.dto.DecisionSnapshotDetail;
import com.lingshan.analytics.dto.ServiceHealthResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService service;
    private final MarketingDecisionService marketingDecisionService;
    private final VisitorBehaviorService visitorBehaviorService;
    private final DecisionHistoryService decisionHistoryService;
    private final ServiceHealthService serviceHealthService;

    @Autowired
    public DashboardController(
            DashboardService service,
            MarketingDecisionService marketingDecisionService,
            VisitorBehaviorService visitorBehaviorService,
            DecisionHistoryService decisionHistoryService,
            ServiceHealthService serviceHealthService
    ) {
        this.service = service;
        this.marketingDecisionService = marketingDecisionService;
        this.visitorBehaviorService = visitorBehaviorService;
        this.decisionHistoryService = decisionHistoryService;
        this.serviceHealthService = serviceHealthService;
    }

    public DashboardController(
            DashboardService service,
            MarketingDecisionService marketingDecisionService,
            VisitorBehaviorService visitorBehaviorService,
            DecisionHistoryService decisionHistoryService
    ) {
        this(service, marketingDecisionService, visitorBehaviorService, decisionHistoryService, null);
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

    @GetMapping("/service-health")
    public ServiceHealthResponse serviceHealth() { return serviceHealthService.check(); }

    @GetMapping("/recommendation")
    public Map<String, Object> recommendation() { return service.recommendation(); }

    @GetMapping("/marketing-decision")
    public Object marketingDecision(@RequestParam(defaultValue = "false") boolean forceRefresh) {
        return marketingDecisionService.getDecisionCards(forceRefresh);
    }

    @GetMapping("/marketing-decision/history")
    public DecisionHistoryPage decisionHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return decisionHistoryService.history(page, size);
    }

    @GetMapping("/marketing-decision/{snapshotId}")
    public DecisionSnapshotDetail decisionDetail(@PathVariable String snapshotId) {
        return decisionHistoryService.detail(snapshotId);
    }

    @GetMapping("/marketing-decision/{newerId}/compare/{olderId}")
    public DecisionComparison compareDecisions(
            @PathVariable String newerId,
            @PathVariable String olderId
    ) {
        return decisionHistoryService.compare(newerId, olderId);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> decisionNotFound(NoSuchElementException error) {
        return ResponseEntity.status(404).body(Map.of(
                "ok", false,
                "message", error.getMessage()
        ));
    }

    @GetMapping("/realtime")
    public Map<String, Object> realtime(@RequestParam(defaultValue = "5") int activeWindowMinutes) {
        return service.realtime(activeWindowMinutes);
    }
}
