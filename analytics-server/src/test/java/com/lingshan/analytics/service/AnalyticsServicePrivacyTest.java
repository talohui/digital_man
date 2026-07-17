package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EventRequest;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.repository.EventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsServicePrivacyTest {
    @Test
    void skipsOptionalEventWriteAfterAnalyticsConsentWithdrawal() {
        AtomicInteger saves = new AtomicInteger();
        EventRepository events = (EventRepository) Proxy.newProxyInstance(
                EventRepository.class.getClassLoader(), new Class<?>[]{EventRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) { saves.incrementAndGet(); return (AnalyticsEvent) args[0]; }
                    if ("toString".equals(method.getName())) return "PrivacyEventRepository";
                    throw new UnsupportedOperationException(method.getName());
                }
        );
        VisitorPrivacyService privacy = new VisitorPrivacyService(null, null, null, null) {
            @Override
            public boolean analyticsEnabled(String ignored) { return false; }
        };
        AnalyticsService service = new AnalyticsService(events, text -> new SentimentResult("neutral", 0.5, List.of()), null, null, privacy);

        service.saveEvent(new EventRequest(
                "spot_enter",
                Map.of("user_id", "guest-550e8400-e29b-41d4-a716-446655440000", "target_id", "fan_gong"),
                "2026-07-13T10:00:00Z"
        ));

        assertThat(saves).hasValue(0);
    }
}
