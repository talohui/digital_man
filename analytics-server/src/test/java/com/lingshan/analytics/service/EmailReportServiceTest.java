package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.EmailReportSettingsDto;
import com.lingshan.analytics.entity.EmailReportDispatch;
import com.lingshan.analytics.repository.EmailReportDispatchRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class EmailReportServiceTest {
    @Test
    void sends_a_formal_period_once_but_allows_a_separate_test_mail() {
        List<EmailReportDispatch> records = new ArrayList<>();
        AtomicInteger sendCalls = new AtomicInteger();
        EmailReportService service = new EmailReportService(
                settings(), data(), input -> content(), new HtmlEmailReportRenderer(),
                (recipients, email) -> sendCalls.incrementAndGet(), repository(records), new ObjectMapper()
        );

        service.sendScheduled(EmailReportType.DAILY, LocalDate.of(2026, 7, 14));
        service.sendScheduled(EmailReportType.DAILY, LocalDate.of(2026, 7, 14));
        service.sendTest();

        assertThat(sendCalls).hasValue(2);
        assertThat(records).hasSize(2);
        assertThat(records.get(0).getStatus()).isEqualTo("SENT");
        assertThat(records.get(0).getRecipientHashesJson()).doesNotContain("ops@example.com");
        assertThat(records.get(1).getReportType()).isEqualTo("TEST");
        assertThat(records.get(1).getSubject()).startsWith("[测试]");
    }

    private EmailReportSettingsService settings() {
        return new EmailReportSettingsService(null, null) {
            @Override public EmailReportSettingsDto current() {
                return new EmailReportSettingsDto(List.of("ops@example.com"), true, LocalTime.of(9, 0), true, DayOfWeek.MONDAY, LocalTime.of(9, 0));
            }
        };
    }

    private EmailReportDataService data() {
        EmailReportInput input = input("D-2026-07-13");
        return new EmailReportDataService(null, null) {
            @Override public EmailReportInput daily(LocalDate runDate) { return input; }
            @Override public EmailReportInput weekly(LocalDate runDate) { return input; }
            @Override public EmailReportInput currentSnapshot() { return input("TEST-2026-07-14T10:00"); }
        };
    }

    private EmailReportInput input(String periodKey) {
        return new EmailReportInput("DAILY", periodKey,
                LocalDateTime.of(2026, 7, 13, 0, 0), LocalDateTime.of(2026, 7, 14, 0, 0),
                Map.of("messageCount", 1L), List.of(), Map.of(), Map.of(), List.of("游客问答与情绪汇总"));
    }

    private EmailReportContent content() {
        return new EmailReportContent("灵山胜境运营简报", "运营摘要", Map.of(
                "客流与服务", "客流汇总", "消费与客群", "消费汇总",
                "风险与应急", "无应急", "下一步动作", "继续观察"
        ), List.of("游客问答与情绪汇总"), "rules", null);
    }

    @SuppressWarnings("unchecked")
    private EmailReportDispatchRepository repository(List<EmailReportDispatch> records) {
        return (EmailReportDispatchRepository) Proxy.newProxyInstance(
                EmailReportDispatchRepository.class.getClassLoader(),
                new Class<?>[]{EmailReportDispatchRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByReportTypeAndPeriodKey" -> records.stream()
                            .filter(record -> record.getReportType().equals(args[0]) && record.getPeriodKey().equals(args[1]))
                            .findFirst();
                    case "save", "saveAndFlush" -> {
                        EmailReportDispatch record = (EmailReportDispatch) args[0];
                        if (!records.contains(record)) records.add(record);
                        yield record;
                    }
                    case "findAll" -> List.copyOf(records);
                    case "toString" -> "EmailReportDispatchRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
    }
}
