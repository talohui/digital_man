package com.lingshan.analytics.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FayOperationsCopilotClientTest {
    @Test
    void allowsTheBoundedFayModelWindowButKeepsShorterConfiguredTimeout() {
        assertThat(FayOperationsCopilotClient.readTimeoutMillis(25_000)).isEqualTo(25_000);
        assertThat(FayOperationsCopilotClient.readTimeoutMillis(60_000)).isEqualTo(25_000);
        assertThat(FayOperationsCopilotClient.readTimeoutMillis(1_500)).isEqualTo(1_500);
    }
}
