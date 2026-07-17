package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.VisitorDeleteResult;
import com.lingshan.analytics.dto.VisitorConsentDto;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.entity.UserProfile;
import com.lingshan.analytics.entity.VisitorBehaviorRecord;
import com.lingshan.analytics.entity.VisitorConsent;
import com.lingshan.analytics.repository.EventRepository;
import com.lingshan.analytics.repository.UserProfileRepository;
import com.lingshan.analytics.repository.VisitorBehaviorRecordRepository;
import com.lingshan.analytics.repository.VisitorConsentRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VisitorPrivacyServiceTest {

    private static final String USER = "guest-550e8400-e29b-41d4-a716-446655440000";
    private static final String OTHER = "guest-550e8400-e29b-41d4-a716-446655440001";

    @Test
    void defaultsToEnabledAndPersistsConsentWithdrawal() {
        State state = new State();
        VisitorPrivacyService service = service(state);

        assertThat(service.consent(USER).analyticsEnabled()).isTrue();
        assertThat(service.consent(USER).personalizationEnabled()).isTrue();

        VisitorConsentDto updated = service.updateConsent(USER, false, false);

        assertThat(updated.analyticsEnabled()).isFalse();
        assertThat(updated.personalizationEnabled()).isFalse();
        assertThat(service.analyticsEnabled(USER)).isFalse();
        assertThat(service.personalizationEnabled(USER)).isFalse();
        assertThatThrownBy(() -> service.consent("guest-not-a-uuid"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deletesOnlyTheRequestedGuestAndReportsEveryCategory() {
        State state = new State();
        state.events.add(event(USER));
        state.events.add(event(OTHER));
        state.profiles.put(USER, profile(USER));
        state.profiles.put(OTHER, profile(OTHER));
        state.behavior.add(behavior(USER));
        state.behavior.add(behavior(OTHER));
        VisitorPrivacyService service = service(state);
        service.updateConsent(USER, true, true);
        service.updateConsent(OTHER, true, true);

        VisitorDeleteResult result = service.deleteAll(USER);

        assertThat(result.complete()).isTrue();
        assertThat(result.deletedCounts()).containsEntry("analyticsEvents", 1L)
                .containsEntry("profile", 1L)
                .containsEntry("behaviorRecords", 1L)
                .containsEntry("consent", 1L);
        assertThat(state.events).extracting(AnalyticsEvent::getUserId).containsExactly(OTHER);
        assertThat(state.profiles).containsOnlyKeys(OTHER);
        assertThat(state.behavior).extracting(VisitorBehaviorRecord::getVisitorId).containsExactly(OTHER);
        assertThat(state.consents).containsOnlyKeys(OTHER);
    }

    private VisitorPrivacyService service(State state) {
        return new VisitorPrivacyService(
                consentRepository(state), eventRepository(state), profileRepository(state), behaviorRepository(state)
        );
    }

    private VisitorConsentRepository consentRepository(State state) {
        return proxy(VisitorConsentRepository.class, (method, args) -> switch (method) {
            case "findById" -> Optional.ofNullable(state.consents.get(args[0]));
            case "save" -> { VisitorConsent value = (VisitorConsent) args[0]; state.consents.put(value.getUserId(), value); yield value; }
            case "existsById" -> state.consents.containsKey(args[0]);
            case "deleteById" -> { state.consents.remove(args[0]); yield null; }
            case "toString" -> "ConsentRepository";
            default -> throw new UnsupportedOperationException(method);
        });
    }

    private EventRepository eventRepository(State state) {
        return proxy(EventRepository.class, (method, args) -> switch (method) {
            case "findByUserId" -> state.events.stream().filter(e -> args[0].equals(e.getUserId())).toList();
            case "countByUserId" -> state.events.stream().filter(e -> args[0].equals(e.getUserId())).count();
            case "deleteByUserId" -> removeEvents(state.events, (String) args[0]);
            case "toString" -> "EventRepository";
            default -> throw new UnsupportedOperationException(method);
        });
    }

    private UserProfileRepository profileRepository(State state) {
        return proxy(UserProfileRepository.class, (method, args) -> switch (method) {
            case "findById" -> Optional.ofNullable(state.profiles.get(args[0]));
            case "existsById" -> state.profiles.containsKey(args[0]);
            case "deleteById" -> { state.profiles.remove(args[0]); yield null; }
            case "toString" -> "ProfileRepository";
            default -> throw new UnsupportedOperationException(method);
        });
    }

    private VisitorBehaviorRecordRepository behaviorRepository(State state) {
        return proxy(VisitorBehaviorRecordRepository.class, (method, args) -> switch (method) {
            case "findByVisitorId" -> state.behavior.stream().filter(e -> args[0].equals(e.getVisitorId())).toList();
            case "countByVisitorId" -> state.behavior.stream().filter(e -> args[0].equals(e.getVisitorId())).count();
            case "deleteByVisitorId" -> removeBehavior(state.behavior, (String) args[0]);
            case "toString" -> "BehaviorRepository";
            default -> throw new UnsupportedOperationException(method);
        });
    }

    private long removeEvents(List<AnalyticsEvent> values, String userId) {
        long before = values.size();
        values.removeIf(value -> userId.equals(value.getUserId()));
        return before - values.size();
    }

    private long removeBehavior(List<VisitorBehaviorRecord> values, String userId) {
        long before = values.size();
        values.removeIf(value -> userId.equals(value.getVisitorId()));
        return before - values.size();
    }

    @SuppressWarnings("unchecked")
    private <T> T proxy(Class<T> type, Handler handler) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type},
                (proxy, method, args) -> handler.call(method.getName(), args == null ? new Object[0] : args));
    }

    private AnalyticsEvent event(String userId) { AnalyticsEvent value = new AnalyticsEvent(); value.setUserId(userId); return value; }
    private UserProfile profile(String userId) { UserProfile value = new UserProfile(); value.setUserId(userId); return value; }
    private VisitorBehaviorRecord behavior(String userId) { VisitorBehaviorRecord value = new VisitorBehaviorRecord(); value.setVisitorId(userId); return value; }

    private interface Handler { Object call(String method, Object[] args) throws Throwable; }
    private static class State {
        final Map<String, VisitorConsent> consents = new HashMap<>();
        final List<AnalyticsEvent> events = new ArrayList<>();
        final Map<String, UserProfile> profiles = new HashMap<>();
        final List<VisitorBehaviorRecord> behavior = new ArrayList<>();
    }
}
