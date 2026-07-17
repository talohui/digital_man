package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.VisitorConsentDto;
import com.lingshan.analytics.dto.VisitorDeleteResult;
import com.lingshan.analytics.dto.VisitorPrivacyExport;
import com.lingshan.analytics.dto.VisitorPrivacySummary;
import com.lingshan.analytics.entity.AnalyticsEvent;
import com.lingshan.analytics.entity.UserProfile;
import com.lingshan.analytics.entity.VisitorBehaviorRecord;
import com.lingshan.analytics.entity.VisitorConsent;
import com.lingshan.analytics.repository.EventRepository;
import com.lingshan.analytics.repository.UserProfileRepository;
import com.lingshan.analytics.repository.VisitorBehaviorRecordRepository;
import com.lingshan.analytics.repository.VisitorConsentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class VisitorPrivacyService {
    private static final Pattern GUEST_ID = Pattern.compile(
            "^guest-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );

    private final VisitorConsentRepository consents;
    private final EventRepository events;
    private final UserProfileRepository profiles;
    private final VisitorBehaviorRecordRepository behavior;

    public VisitorPrivacyService(
            VisitorConsentRepository consents,
            EventRepository events,
            UserProfileRepository profiles,
            VisitorBehaviorRecordRepository behavior
    ) {
        this.consents = consents;
        this.events = events;
        this.profiles = profiles;
        this.behavior = behavior;
    }

    public boolean isManagedGuestId(String userId) {
        return userId != null && GUEST_ID.matcher(userId).matches();
    }

    @Transactional(readOnly = true)
    public VisitorConsentDto consent(String userId) {
        validate(userId);
        return consents.findById(userId).map(this::dto)
                .orElse(new VisitorConsentDto(userId, true, true, null));
    }

    @Transactional
    public VisitorConsentDto updateConsent(String userId, boolean personalizationEnabled, boolean analyticsEnabled) {
        validate(userId);
        VisitorConsent value = consents.findById(userId).orElseGet(VisitorConsent::new);
        value.setUserId(userId);
        value.setPersonalizationEnabled(personalizationEnabled);
        value.setAnalyticsEnabled(analyticsEnabled);
        value.setUpdatedAt(LocalDateTime.now());
        return dto(consents.save(value));
    }

    public boolean analyticsEnabled(String userId) {
        return !isManagedGuestId(userId) || consent(userId).analyticsEnabled();
    }

    public boolean personalizationEnabled(String userId) {
        return !isManagedGuestId(userId) || consent(userId).personalizationEnabled();
    }

    @Transactional(readOnly = true)
    public VisitorPrivacySummary summary(String userId) {
        validate(userId);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("analyticsEvents", events.countByUserId(userId));
        counts.put("profile", profiles.existsById(userId) ? 1L : 0L);
        counts.put("behaviorRecords", behavior.countByVisitorId(userId));
        counts.put("consent", consents.existsById(userId) ? 1L : 0L);
        return new VisitorPrivacySummary(userId, consent(userId), counts);
    }

    @Transactional(readOnly = true)
    public VisitorPrivacyExport export(String userId) {
        validate(userId);
        Map<String, Object> profile = profiles.findById(userId).map(this::profileMap).orElse(Map.of());
        List<Map<String, Object>> footprint = behavior.findByVisitorId(userId).stream().map(this::behaviorMap).toList();
        List<Map<String, Object>> analytics = events.findByUserId(userId).stream().map(this::eventMap).toList();
        return new VisitorPrivacyExport(userId, LocalDateTime.now(), consent(userId), profile, footprint, analytics);
    }

    @Transactional
    public VisitorDeleteResult deleteAll(String userId) {
        validate(userId);
        Map<String, Long> deleted = new LinkedHashMap<>();
        deleted.put("analyticsEvents", events.deleteByUserId(userId));
        deleted.put("behaviorRecords", behavior.deleteByVisitorId(userId));
        long profileCount = profiles.existsById(userId) ? 1L : 0L;
        if (profileCount > 0) profiles.deleteById(userId);
        deleted.put("profile", profileCount);
        long consentCount = consents.existsById(userId) ? 1L : 0L;
        if (consentCount > 0) consents.deleteById(userId);
        deleted.put("consent", consentCount);
        return new VisitorDeleteResult(userId, deleted, List.of(), true);
    }

    private VisitorConsentDto dto(VisitorConsent value) {
        return new VisitorConsentDto(value.getUserId(), value.isPersonalizationEnabled(), value.isAnalyticsEnabled(), value.getUpdatedAt());
    }

    private Map<String, Object> profileMap(UserProfile value) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("selectedTags", value.getSelectedTagsJson());
        out.put("primaryPersona", value.getPrimaryPersona());
        out.put("primaryScore", value.getPrimaryScore());
        out.put("interestVector", value.getInterestVectorJson());
        out.put("updatedAt", value.getUpdatedAt());
        return out;
    }

    private Map<String, Object> behaviorMap(VisitorBehaviorRecord value) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attractionName", value.getAttractionName());
        out.put("visitDate", value.getVisitDate());
        out.put("stayHours", value.getStayHours());
        out.put("ticketCost", value.getTicketCost());
        out.put("totalCost", value.getTotalCost());
        out.put("satisfaction", value.getSatisfaction());
        out.put("updatedAt", value.getUpdatedAt());
        return out;
    }

    private Map<String, Object> eventMap(AnalyticsEvent value) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("event", value.getEvent());
        out.put("targetId", value.getTargetId());
        out.put("properties", value.getProperties());
        out.put("timestamp", value.getTs());
        out.put("sentiment", value.getSentiment());
        out.put("ratingValue", value.getRatingValue());
        return out;
    }

    private void validate(String userId) {
        if (!isManagedGuestId(userId)) throw new IllegalArgumentException("游客标识格式无效");
    }
}
