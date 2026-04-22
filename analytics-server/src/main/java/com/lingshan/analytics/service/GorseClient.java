package com.lingshan.analytics.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.lingshan.analytics.config.GorseProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Component
public class GorseClient {

    private static final Logger log = LoggerFactory.getLogger(GorseClient.class);

    private final GorseProperties properties;
    private final RestClient restClient;

    public GorseClient(GorseProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.normalizedBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeaders(headers -> {
                    if (properties.apiKey() != null && !properties.apiKey().isBlank()) {
                        headers.set("X-API-Key", properties.apiKey());
                    }
                })
                .build();
    }

    public boolean isEnabled() {
        return properties.enabled() && !properties.normalizedBaseUrl().isBlank();
    }

    public boolean ping() {
        if (!isEnabled()) {
            return false;
        }

        try {
            restClient.get()
                    .uri("/api/health/live")
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException error) {
            log.warn("Gorse ping failed: {}", error.getMessage());
            return false;
        }
    }

    public void upsertUser(String userId, List<String> labels) {
        if (!isEnabled()) {
            return;
        }

        requestVoid("POST", "/api/user", new GorseUser(userId, labels, "guide-user"));
    }

    public void upsertItems(Collection<GuideRouteCatalog.RouteProfile> routes) {
        if (!isEnabled()) {
            return;
        }

        List<GorseItem> items = routes.stream()
                .map(route -> new GorseItem(
                        route.routeId(),
                        false,
                        route.labels(),
                        List.of("route"),
                        Instant.now().toString(),
                        route.routeName()
                ))
                .toList();

        requestVoid("POST", "/api/items", items);
    }

    public void writeFeedback(List<GorseFeedback> feedbacks) {
        if (!isEnabled() || feedbacks.isEmpty()) {
            return;
        }

        requestVoid("POST", "/api/feedback", feedbacks);
    }

    public List<String> recommend(String userId, int size) {
        if (!isEnabled()) {
            return List.of();
        }

        try {
            JsonNode node = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/recommend/{user-id}")
                            .queryParam("n", size)
                            .build(userId))
                    .retrieve()
                    .body(JsonNode.class);

            if (node == null || !node.isArray()) {
                return List.of();
            }

            List<String> ids = new ArrayList<>();
            for (JsonNode itemNode : node) {
                String routeId = extractRouteId(itemNode);
                if (routeId != null && !routeId.isBlank() && !ids.contains(routeId)) {
                    ids.add(routeId);
                }
            }
            return ids;
        } catch (RestClientException error) {
            log.warn("Failed to fetch Gorse recommendations: {}", error.getMessage());
            return List.of();
        }
    }

    private void requestVoid(String method, String path, Object body) {
        try {
            if ("POST".equals(method)) {
                restClient.post().uri(path).body(body).retrieve().toBodilessEntity();
            } else if ("PUT".equals(method)) {
                restClient.put().uri(path).body(body).retrieve().toBodilessEntity();
            } else {
                throw new IllegalArgumentException("Unsupported method: " + method);
            }
        } catch (RestClientException error) {
            throw error;
        }
    }

    private String extractRouteId(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            return node.asText();
        }

        JsonNode candidates = node.get("Id");
        if (candidates == null || candidates.isNull()) {
            candidates = node.get("ItemId");
        }
        if (candidates == null || candidates.isNull()) {
            candidates = node.get("id");
        }
        if (candidates == null || candidates.isNull()) {
            candidates = node.get("itemId");
        }
        return candidates == null || candidates.isNull() ? null : candidates.asText();
    }

    public record GorseFeedback(
            @JsonProperty("FeedbackType") String feedbackType,
            @JsonProperty("UserId") String userId,
            @JsonProperty("ItemId") String itemId,
            @JsonProperty("Timestamp") String timestamp,
            @JsonProperty("Comment") String comment
    ) {
    }

    private record GorseUser(
            @JsonProperty("UserId") String userId,
            @JsonProperty("Labels") List<String> labels,
            @JsonProperty("Comment") String comment
    ) {
    }

    private record GorseItem(
            @JsonProperty("ItemId") String itemId,
            @JsonProperty("IsHidden") boolean hidden,
            @JsonProperty("Labels") List<String> labels,
            @JsonProperty("Categories") List<String> categories,
            @JsonProperty("Timestamp") String timestamp,
            @JsonProperty("Comment") String comment
    ) {
    }
}
