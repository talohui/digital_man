package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EmergencyEventRequest;
import com.lingshan.analytics.entity.EmergencyEvent;
import com.lingshan.analytics.repository.EmergencyEventRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmergencyEventServiceTest {

    @Test
    void createsPublishesFiltersAndResolvesEmergency() {
        Map<String, EmergencyEvent> events = new LinkedHashMap<>();
        EmergencyEventService service = new EmergencyEventService(repository(events));
        LocalDateTime now = LocalDateTime.of(2026, 7, 13, 12, 0);

        var draft = service.create(request("ROAD_CLOSURE", now.minusMinutes(5), now.plusHours(2)));
        var active = service.publish(draft.id(), now);

        assertThat(draft.status()).isEqualTo("DRAFT");
        assertThat(active.status()).isEqualTo("ACTIVE");
        assertThat(service.active(now)).extracting("id").containsExactly(draft.id());
        assertThat(service.resolve(draft.id(), now.plusMinutes(10)).status()).isEqualTo("RESOLVED");
        assertThat(service.active(now.plusMinutes(11))).isEmpty();
    }

    @Test
    void rejectsUnconfirmedMedicalAndInvalidValidityWindow() {
        EmergencyEventService service = new EmergencyEventService(repository(new LinkedHashMap<>()));
        LocalDateTime now = LocalDateTime.of(2026, 7, 13, 12, 0);
        EmergencyEventRequest medical = new EmergencyEventRequest(
                "MEDICAL_HELP", "医疗协助", "", "CRITICAL", List.of("fan_gong"), List.of(),
                now, now.plusHours(1), "NONE", "哪里获得医疗协助", ""
        );
        assertThatThrownBy(() -> service.create(medical)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.create(request("CROWDING", now, now.minusMinutes(1))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void publishAndResolveSynchronizeKnowledgeWithoutBlockingOnFailure() {
        Map<String, EmergencyEvent> events = new LinkedHashMap<>();
        StubKnowledgeClient client = new StubKnowledgeClient();
        EmergencyEventService service = new EmergencyEventService(repository(events), client);
        LocalDateTime now = LocalDateTime.of(2026, 7, 13, 12, 0);
        var draft = service.create(request("SCENIC_CLOSURE", now.minusMinutes(1), now.plusHours(1)));

        var published = service.publish(draft.id(), now);
        var resolved = service.resolve(draft.id(), now.plusMinutes(5));

        assertThat(published.kbFaqId()).isEqualTo("faq-event-1");
        assertThat(published.kbSyncStatus()).isEqualTo("SYNCED");
        assertThat(client.deactivatedFaqId).isEqualTo("faq-event-1");
        assertThat(resolved.status()).isEqualTo("RESOLVED");

        client.fail = true;
        var failedDraft = service.create(request("CROWDING", now, now.plusHours(1)));
        var stillActive = service.publish(failedDraft.id(), now);
        assertThat(stillActive.status()).isEqualTo("ACTIVE");
        assertThat(stillActive.kbSyncStatus()).isEqualTo("FAILED");
    }

    private static class StubKnowledgeClient implements EmergencyKnowledgeClient {
        private boolean fail;
        private String deactivatedFaqId;
        @Override public String publish(EmergencyEvent event) {
            if (fail) throw new IllegalStateException("kb unavailable");
            return "faq-event-1";
        }
        @Override public void deactivate(String faqId) { deactivatedFaqId = faqId; }
    }

    private EmergencyEventRequest request(String type, LocalDateTime from, LocalDateTime until) {
        return new EmergencyEventRequest(
                type, "梵宫周边道路临时封闭", "请由东侧步道绕行", "WARNING",
                List.of("fan_gong"), List.of("historical_culture"), from, until,
                "EXCLUDE", "梵宫道路是否开放", "当前道路临时封闭，请按现场标识绕行"
        );
    }

    private EmergencyEventRepository repository(Map<String, EmergencyEvent> events) {
        return (EmergencyEventRepository) Proxy.newProxyInstance(
                EmergencyEventRepository.class.getClassLoader(), new Class<?>[]{EmergencyEventRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        EmergencyEvent event = (EmergencyEvent) args[0];
                        events.put(event.getId(), event);
                        yield event;
                    }
                    case "findById" -> Optional.ofNullable(events.get((String) args[0]));
                    case "findByStatus" -> events.values().stream()
                            .filter(event -> args[0].equals(event.getStatus())).toList();
                    case "toString" -> "InMemoryEmergencyRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
