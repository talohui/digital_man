package com.lingshan.analytics.service;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class EmailReportSchedulerTest {
    @Test
    void calculates_next_daily_and_weekly_occurrences_in_shanghai_time() {
        ZoneId zone = ZoneId.of("Asia/Shanghai");
        LocalDateTime now = LocalDateTime.of(2026, 7, 14, 10, 0);

        assertThat(EmailReportScheduler.nextDaily(now, LocalTime.of(9, 0), zone))
                .isEqualTo(LocalDateTime.of(2026, 7, 15, 9, 0).atZone(zone));
        assertThat(EmailReportScheduler.nextWeekly(now, DayOfWeek.MONDAY, LocalTime.of(9, 0), zone))
                .isEqualTo(LocalDateTime.of(2026, 7, 20, 9, 0).atZone(zone));
    }
}
