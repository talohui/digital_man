package com.lingshan.analytics.service;

import com.lingshan.analytics.config.MarketingDecisionProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class FayEmailReportClient implements EmailReportGenerator {
    private static final List<String> SECTION_NAMES = List.of("客流与服务", "消费与客群", "风险与应急", "下一步动作");

    private final RestClient restClient;
    private final EmailReportFallbackWriter fallbackWriter;

    public FayEmailReportClient(MarketingDecisionProperties properties, EmailReportFallbackWriter fallbackWriter) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(100, properties.connectTimeoutMs()));
        requestFactory.setReadTimeout(Math.max(100, properties.readTimeoutMs()));
        this.restClient = RestClient.builder()
                .baseUrl(properties.normalizedFayBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.fallbackWriter = fallbackWriter;
    }

    @Override
    public EmailReportContent generate(EmailReportInput input) {
        try {
            EmailReportContent response = restClient.post()
                    .uri("/api/internal/operations-report")
                    .body(input)
                    .retrieve()
                    .body(EmailReportContent.class);
            return validate(response, input);
        } catch (RuntimeException exception) {
            return fallbackWriter.write(input, "FAY_REPORT_UNAVAILABLE");
        }
    }

    private EmailReportContent validate(EmailReportContent response, EmailReportInput input) {
        if (response == null || blank(response.subject()) || blank(response.headline())
                || response.sections() == null || !response.sections().keySet().equals(SECTION_NAMES.stream().collect(java.util.stream.Collectors.toSet()))
                || response.dataSources() == null || response.dataSources().isEmpty()
                || !input.dataSources().containsAll(response.dataSources())) {
            throw new IllegalArgumentException("invalid Fay operations report");
        }
        Map<String, String> sections = new LinkedHashMap<>();
        for (String name : SECTION_NAMES) {
            String value = response.sections().get(name);
            if (blank(value) || value.contains("<") || value.contains(">")) {
                throw new IllegalArgumentException("invalid Fay operations report section");
            }
            sections.put(name, value.trim());
        }
        if (response.subject().contains("<") || response.subject().contains(">")
                || response.headline().contains("<") || response.headline().contains(">")) {
            throw new IllegalArgumentException("invalid Fay operations report markup");
        }
        return new EmailReportContent(
                response.subject().trim(), response.headline().trim(), Map.copyOf(sections),
                List.copyOf(response.dataSources()), "llm", null);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
