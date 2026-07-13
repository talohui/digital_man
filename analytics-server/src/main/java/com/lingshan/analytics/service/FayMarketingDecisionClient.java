package com.lingshan.analytics.service;

import com.lingshan.analytics.config.MarketingDecisionProperties;
import com.lingshan.analytics.dto.DecisionResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class FayMarketingDecisionClient implements MarketingDecisionGenerator {
    private final RestClient restClient;

    public FayMarketingDecisionClient(MarketingDecisionProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(100, properties.connectTimeoutMs()));
        requestFactory.setReadTimeout(Math.max(100, properties.readTimeoutMs()));
        this.restClient = RestClient.builder()
                .baseUrl(properties.normalizedFayBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public DecisionResponse generate(DecisionInput input) {
        DecisionResponse response = restClient.post()
                .uri("/api/internal/marketing-decision")
                .body(input)
                .retrieve()
                .body(DecisionResponse.class);
        if (response == null) {
            throw new RestClientException("Fay returned an empty marketing decision");
        }
        return response;
    }
}
