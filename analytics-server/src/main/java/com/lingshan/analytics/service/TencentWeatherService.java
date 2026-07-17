package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.config.TencentWeatherProperties;
import com.lingshan.analytics.dto.ScenicWeatherDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

@Service
public class TencentWeatherService {
    private static final Logger log = LoggerFactory.getLogger(TencentWeatherService.class);

    private final TencentWeatherProperties properties;
    private final WeatherServiceSettingsService settingsService;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private volatile CacheEntry cache;

    @Autowired
    public TencentWeatherService(TencentWeatherProperties properties, WeatherServiceSettingsService settingsService) {
        this(
                properties,
                settingsService,
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build(),
                new ObjectMapper()
        );
    }

    public TencentWeatherService(TencentWeatherProperties properties) {
        this(properties, null, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build(), new ObjectMapper());
    }

    TencentWeatherService(
            TencentWeatherProperties properties,
            HttpClient httpClient,
            ObjectMapper objectMapper
    ) {
        this(properties, null, httpClient, objectMapper);
    }

    private TencentWeatherService(
            TencentWeatherProperties properties,
            WeatherServiceSettingsService settingsService,
            HttpClient httpClient,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.settingsService = settingsService;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public Optional<ScenicWeatherDto> current() {
        try {
            if (activeKey().isBlank()) {
                return Optional.empty();
            }
            Instant currentTime = now();
            CacheEntry cached = cache;
            if (cached != null && currentTime.isBefore(cached.expiresAt())) {
                return Optional.of(cached.weather().asCached());
            }
            ScenicWeatherDto weather = fetchFromTencent(location());
            cache = new CacheEntry(weather, currentTime.plusSeconds(properties.effectiveCacheTtlSeconds()));
            return Optional.of(weather);
        } catch (Exception exception) {
            log.warn("Tencent weather is temporarily unavailable: {}", safeMessage(exception));
            return Optional.empty();
        }
    }

    protected Instant now() {
        return Instant.now();
    }

    protected ScenicWeatherDto fetchFromTencent(String location) throws Exception {
        URI requestUri = URI.create(normalizedBaseUrl()
                + "?key=" + encode(activeKey())
                + "&location=" + encode(location)
                + "&type=now&output=json");
        HttpRequest request = HttpRequest.newBuilder(requestUri)
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Tencent weather HTTP status " + response.statusCode());
        }
        return parseTencentPayload(response.body());
    }

    protected ScenicWeatherDto parseTencentPayload(String payload) throws Exception {
        JsonNode root = objectMapper.readTree(payload);
        int status = root.path("status").asInt(-1);
        if (status != 0) {
            throw new IllegalStateException("Tencent weather status " + status);
        }

        JsonNode realtime = root.path("result").path("realtime");
        if (!realtime.isArray() || realtime.isEmpty()) {
            throw new IllegalStateException("Tencent weather did not provide realtime data");
        }

        JsonNode current = realtime.get(0);
        JsonNode infos = current.path("infos");
        if (infos.isMissingNode() || infos.isNull()) {
            throw new IllegalStateException("Tencent weather did not provide realtime infos");
        }

        String windPower = infos.hasNonNull("wind_power_v2")
                ? infos.path("wind_power_v2").asText()
                : infos.path("wind_power").asText();
        return new ScenicWeatherDto(
                infos.path("weather").asText(),
                infos.path("temperature").asInt(),
                infos.path("humidity").asInt(),
                infos.path("wind_direction").asText(),
                windPower,
                infos.path("air_pressure").asInt(),
                current.path("update_time").asText(),
                current.path("district").asText(),
                "tencent",
                false,
                null,
                null
        );
    }

    private String normalizedBaseUrl() {
        String baseUrl = properties.baseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("Tencent weather base URL is not configured");
        }
        return baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    }

    public void clearCache() {
        cache = null;
    }

    private String activeKey() {
        if (settingsService != null) {
            return settingsService.activeKey().orElse("");
        }
        return properties.key() == null ? "" : properties.key();
    }

    private String location() {
        return String.format(Locale.ROOT, "%.4f,%.4f", properties.latitude(), properties.longitude());
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String safeMessage(Exception exception) {
        return exception.getClass().getSimpleName();
    }

    private record CacheEntry(ScenicWeatherDto weather, Instant expiresAt) {
    }
}
