package com.lingshan.analytics.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public record EmailReportSettingsDto(
        List<String> recipients,
        boolean dailyEnabled,
        LocalTime dailyTime,
        boolean weeklyEnabled,
        DayOfWeek weeklyDay,
        LocalTime weeklyTime
) {
}
