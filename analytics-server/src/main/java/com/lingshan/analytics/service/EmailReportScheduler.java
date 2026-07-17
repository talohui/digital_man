package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.EmailReportSettingsDto;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.concurrent.ScheduledFuture;

@Component
public class EmailReportScheduler {
    static final ZoneId SHANGHAI = ZoneId.of("Asia/Shanghai");

    private final TaskScheduler taskScheduler;
    private final EmailReportSettingsService settingsService;
    private final EmailReportService reportService;
    private ScheduledFuture<?> dailyFuture;
    private ScheduledFuture<?> weeklyFuture;

    public EmailReportScheduler(
            @Qualifier("emailReportTaskScheduler") TaskScheduler taskScheduler,
            EmailReportSettingsService settingsService,
            EmailReportService reportService
    ) {
        this.taskScheduler = taskScheduler;
        this.settingsService = settingsService;
        this.reportService = reportService;
    }

    @PostConstruct
    public void schedulePersistedSettings() {
        reschedule();
    }

    public synchronized void reschedule() {
        cancel(dailyFuture);
        cancel(weeklyFuture);
        dailyFuture = null;
        weeklyFuture = null;
        EmailReportSettingsDto settings = settingsService.current();
        LocalDateTime now = LocalDateTime.now(SHANGHAI);
        if (settings.dailyEnabled() && !settings.recipients().isEmpty()) {
            dailyFuture = taskScheduler.schedule(this::runDaily,
                    Date.from(nextDaily(now, settings.dailyTime(), SHANGHAI).toInstant()));
        }
        if (settings.weeklyEnabled() && !settings.recipients().isEmpty()) {
            weeklyFuture = taskScheduler.schedule(this::runWeekly,
                    Date.from(nextWeekly(now, settings.weeklyDay(), settings.weeklyTime(), SHANGHAI).toInstant()));
        }
    }

    static ZonedDateTime nextDaily(LocalDateTime now, LocalTime sendTime, ZoneId zone) {
        LocalDateTime candidate = now.toLocalDate().atTime(sendTime == null ? LocalTime.of(9, 0) : sendTime);
        if (!candidate.isAfter(now)) candidate = candidate.plusDays(1);
        return candidate.atZone(zone);
    }

    static ZonedDateTime nextWeekly(LocalDateTime now, DayOfWeek day, LocalTime sendTime, ZoneId zone) {
        DayOfWeek targetDay = day == null ? DayOfWeek.MONDAY : day;
        LocalTime targetTime = sendTime == null ? LocalTime.of(9, 0) : sendTime;
        int days = Math.floorMod(targetDay.getValue() - now.getDayOfWeek().getValue(), 7);
        LocalDateTime candidate = now.toLocalDate().plusDays(days).atTime(targetTime);
        if (!candidate.isAfter(now)) candidate = candidate.plusWeeks(1);
        return candidate.atZone(zone);
    }

    private void runDaily() {
        try {
            reportService.sendScheduled(EmailReportType.DAILY, LocalDate.now(SHANGHAI));
        } finally {
            reschedule();
        }
    }

    private void runWeekly() {
        try {
            reportService.sendScheduled(EmailReportType.WEEKLY, LocalDate.now(SHANGHAI));
        } finally {
            reschedule();
        }
    }

    private void cancel(ScheduledFuture<?> future) {
        if (future != null) future.cancel(false);
    }
}
