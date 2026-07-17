package com.lingshan.analytics.service;

import com.lingshan.analytics.config.MarketingDecisionProperties;
import com.lingshan.analytics.dto.OperationsCopilotModelResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Component
public class FayOperationsCopilotClient implements OperationsCopilotGenerator {
    private static final int MAX_READ_TIMEOUT_MILLIS = 25_000;
    private final RestClient restClient;

    public FayOperationsCopilotClient(MarketingDecisionProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(100, properties.connectTimeoutMs()));
        requestFactory.setReadTimeout(readTimeoutMillis(properties.readTimeoutMs()));
        this.restClient = RestClient.builder()
                .baseUrl(properties.normalizedFayBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public OperationsCopilotModelResponse generate(Map<String, Object> input) {
        OperationsCopilotModelResponse response = restClient.post()
                .uri("/api/internal/operations-copilot")
                .body(input)
                .retrieve()
                .body(OperationsCopilotModelResponse.class);
        if (response == null) {
            throw new RestClientException("Fay returned an empty operations copilot response");
        }
        return response;
    }

    static int readTimeoutMillis(int configuredTimeoutMillis) {
        return Math.max(100, Math.min(MAX_READ_TIMEOUT_MILLIS, configuredTimeoutMillis));
    }
}
