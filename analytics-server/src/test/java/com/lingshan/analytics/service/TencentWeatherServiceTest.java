package com.lingshan.analytics.service;

import com.lingshan.analytics.config.TencentWeatherProperties;
import com.lingshan.analytics.dto.ScenicWeatherDto;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class TencentWeatherServiceTest {

    @Test
    void readsTencentRealtimeInfosWithLatitudeBeforeLongitude() {
        TestWeatherService service = new TestWeatherService(properties(), validTencentPayload());

        ScenicWeatherDto weather = service.current().orElseThrow();

        assertThat(weather.weather()).isEqualTo("多云");
        assertThat(weather.temperature()).isEqualTo(30);
        assertThat(weather.humidity()).isEqualTo(72);
        assertThat(weather.windDirection()).isEqualTo("东南风");
        assertThat(weather.windPower()).isEqualTo("2-3级");
        assertThat(weather.updateTime()).isEqualTo("2026-07-14 10:00");
        assertThat(service.lastLocation).isEqualTo("31.4268,120.1008");
    }

    @Test
    void servesFreshCacheWithoutCallingTencentAgain() {
        TestWeatherService service = new TestWeatherService(properties(), validTencentPayload());

        service.current();
        ScenicWeatherDto cached = service.current().orElseThrow();

        assertThat(cached.cached()).isTrue();
        assertThat(service.callCount).isEqualTo(1);
    }

    @Test
    void returnsEmptyWhenWeatherKeyIsNotConfigured() {
        TestWeatherService service = new TestWeatherService(propertiesWithBlankKey(), validTencentPayload());

        assertThat(service.current()).isEmpty();
        assertThat(service.callCount).isZero();
    }

    private TencentWeatherProperties properties() {
        return new TencentWeatherProperties(
                "weather-key", "https://apis.map.qq.com/ws/weather/v1/", 31.4268, 120.1008, 600
        );
    }

    private TencentWeatherProperties propertiesWithBlankKey() {
        return new TencentWeatherProperties(
                "", "https://apis.map.qq.com/ws/weather/v1/", 31.4268, 120.1008, 600
        );
    }

    private String validTencentPayload() {
        return """
                {
                  "status": 0,
                  "message": "query ok",
                  "result": {
                    "realtime": [{
                      "district": "滨湖区",
                      "update_time": "2026-07-14 10:00",
                      "infos": {
                        "weather": "多云",
                        "temperature": 30,
                        "humidity": 72,
                        "wind_direction": "东南风",
                        "wind_power": "2-3级",
                        "air_pressure": 1001
                      }
                    }]
                  }
                }
                """;
    }

    private static final class TestWeatherService extends TencentWeatherService {
        private final String payload;
        private final Instant fixedNow = Instant.parse("2026-07-14T02:00:00Z");
        private int callCount;
        private String lastLocation;

        private TestWeatherService(TencentWeatherProperties properties, String payload) {
            super(properties);
            this.payload = payload;
        }

        @Override
        protected ScenicWeatherDto fetchFromTencent(String location) throws Exception {
            callCount += 1;
            lastLocation = location;
            return parseTencentPayload(payload);
        }

        @Override
        protected Instant now() {
            return fixedNow;
        }
    }
}
