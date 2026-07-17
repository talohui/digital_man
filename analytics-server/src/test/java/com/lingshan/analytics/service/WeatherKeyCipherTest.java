package com.lingshan.analytics.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WeatherKeyCipherTest {
    @Test
    void encryptsAndRestoresWeatherKeyWithoutKeepingPlaintext() {
        WeatherKeyCipher cipher = new WeatherKeyCipher("test-master-key");

        String encrypted = cipher.encrypt("weather-key-for-test");

        assertThat(encrypted).startsWith("v1:");
        assertThat(encrypted).doesNotContain("weather-key-for-test");
        assertThat(cipher.decrypt(encrypted)).isEqualTo("weather-key-for-test");
    }

    @Test
    void reports_a_domain_neutral_error_when_a_shared_secret_cannot_be_decrypted() {
        String encrypted = new WeatherKeyCipher("old-master-key").encrypt("secret-for-test");

        assertThatThrownBy(() -> new WeatherKeyCipher("new-master-key").decrypt(encrypted))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("安全配置解密失败");
    }
}
