package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.UserProfile;
import com.lingshan.analytics.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class PersonaEngineTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void repeatedPreferenceSnapshotDoesNotIncrementProfileVersion() throws Exception {
        TestHarness h = new TestHarness();

        h.engine.updateFromEvent("u1", "preference_update", Map.of("selectedTags", List.of("亲子游")));
        assertThat(h.profile().getProfileVersion()).isEqualTo(1);

        h.engine.updateFromEvent("u1", "preference_update", Map.of("selectedTags", List.of("亲子游")));

        assertThat(h.profile().getProfileVersion()).isEqualTo(1);
        assertThat(h.saveCount()).isEqualTo(1);
    }

    @Test
    void preferenceSnapshotCancellationRemovesTagPreference() throws Exception {
        TestHarness h = new TestHarness();

        h.engine.updateFromEvent("u1", "preference_update", Map.of("selectedTags", List.of("亲子游")));
        assertThat(vector(h.profile()).get("family")).isGreaterThan(0.0);

        h.engine.updateFromEvent("u1", "preference_update", Map.of("selectedTags", List.of()));

        assertThat(h.profile().getProfileVersion()).isEqualTo(2);
        assertThat(vector(h.profile()).get("family")).isEqualTo(0.0);
        assertThat(h.profile().getPrimaryScore()).isEqualTo(0.0);
        assertThat(h.engine.getProfile("u1").get("primaryPersonaLabel")).isNull();
        assertThat(h.engine.getProfile("u1").get("selectedTags")).isEqualTo(List.of());
    }

    @Test
    void tagToggleIsOnlyAnalyticsAndDoesNotUpdatePersona() {
        TestHarness h = new TestHarness();

        h.engine.updateFromEvent("u1", "tag_toggle", Map.of("tag", "亲子游", "on", true));

        assertThat(h.profile()).isNull();
        assertThat(h.saveCount()).isEqualTo(0);
    }

    @Test
    void behaviorSignalStillAccumulatesIndependentlyFromTagSnapshot() throws Exception {
        TestHarness h = new TestHarness();

        h.engine.updateFromEvent("u1", "preference_update", Map.of("selectedTags", List.of("文化探秘")));
        h.engine.updateFromEvent("u1", "user_message", Map.of("content_text", "带孩子拍照打卡哪里比较好"));

        Map<String, Double> v = vector(h.profile());
        assertThat(v.get("culture")).isGreaterThan(0.0);
        assertThat(v.get("family")).isGreaterThan(0.0);
        assertThat(v.get("photo")).isGreaterThan(0.0);
        assertThat(h.profile().getProfileVersion()).isEqualTo(2);
    }

    private Map<String, Double> vector(UserProfile profile) throws Exception {
        return mapper.readValue(profile.getInterestVectorJson(), new TypeReference<>() {});
    }

    private static class TestHarness {
        final AtomicReference<UserProfile> stored = new AtomicReference<>();
        final AtomicInteger saveCount = new AtomicInteger();
        final UserProfileRepository repository = createRepository();
        final PersonaEngine engine = new PersonaEngine(repository);

        UserProfile profile() {
            return stored.get();
        }

        int saveCount() {
            return saveCount.get();
        }

        @SuppressWarnings("unchecked")
        private UserProfileRepository createRepository() {
            return (UserProfileRepository) Proxy.newProxyInstance(
                    UserProfileRepository.class.getClassLoader(),
                    new Class<?>[]{UserProfileRepository.class},
                    (proxy, method, args) -> {
                        String name = method.getName();
                        if ("findById".equals(name)) {
                            return Optional.ofNullable(stored.get());
                        }
                        if ("save".equals(name)) {
                            UserProfile profile = (UserProfile) args[0];
                            stored.set(profile);
                            saveCount.incrementAndGet();
                            return profile;
                        }
                        if ("toString".equals(name)) {
                            return "InMemoryUserProfileRepository";
                        }
                        throw new UnsupportedOperationException(name);
                    }
            );
        }
    }
}
