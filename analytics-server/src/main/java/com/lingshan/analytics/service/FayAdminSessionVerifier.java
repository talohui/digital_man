package com.lingshan.analytics.service;

import com.lingshan.analytics.config.MarketingDecisionProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class FayAdminSessionVerifier implements AdminSessionVerifier {
    private final RestClient restClient;

    public FayAdminSessionVerifier(MarketingDecisionProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(100, properties.connectTimeoutMs()));
        requestFactory.setReadTimeout(Math.max(100, properties.readTimeoutMs()));
        this.restClient = RestClient.builder()
                .baseUrl(properties.normalizedFayBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public boolean verify(String fayAdminSessionToken) {
        if (fayAdminSessionToken == null || fayAdminSessionToken.isBlank()) {
            return false;
        }
        try {
            Map<String, Object> response = restClient.post()
                    .uri("/api/admin/service-config/verify-session")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + fayAdminSessionToken)
                    .retrieve()
                    .body(Map.class);
            return response != null && Boolean.TRUE.equals(response.get("verified"));
        } catch (RuntimeException ignored) {
            return false;
        }
    }
}
