package com.lingshan.analytics.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public record UpdateEmailReportSettingsRequest(
        List<String> recipients,
        boolean dailyEnabled,
        LocalTime dailyTime,
        boolean weeklyEnabled,
        DayOfWeek weeklyDay,
        LocalTime weeklyTime,
        String smtpUsername,
        String smtpAuthCode
) {
    public UpdateEmailReportSettingsRequest(
            List<String> recipients,
            boolean dailyEnabled,
            LocalTime dailyTime,
            boolean weeklyEnabled,
            DayOfWeek weeklyDay,
            LocalTime weeklyTime
    ) {
        this(recipients, dailyEnabled, dailyTime, weeklyEnabled, weeklyDay, weeklyTime, null, null);
    }
}
