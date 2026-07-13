package com.lingshan.analytics.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.config.MarketingDecisionProperties;
import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionResponse;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class FayMarketingDecisionClientTest {
    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void postsDecisionInputAndReturnsStructuredDecision() throws Exception {
        AtomicReference<String> received = new AtomicReference<>();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/internal/marketing-decision", exchange -> {
            received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] body = new ObjectMapper().writeValueAsBytes(validResponse());
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        FayMarketingDecisionClient client = new FayMarketingDecisionClient(
                new MarketingDecisionProperties(
                        "http://127.0.0.1:" + server.getAddress().getPort(),
                        1000,
                        1000
                )
        );

        DecisionResponse response = client.generate(input());

        assertThat(response.summary()).isEqualTo("模型摘要");
        assertThat(response.cards()).hasSize(3);
        assertThat(received.get()).contains("\"totalMessages\":8");
        assertThat(received.get()).doesNotContain("apiKey");
    }

    @Test
    void keepsExistingRuleConstructorBackwardCompatible() {
        DecisionResponse response = validResponse();

        assertThat(response.generationSource()).isNull();
        assertThat(response.generatedAt()).isNull();
        assertThat(response.cacheHit()).isFalse();
        assertThat(response.fallbackReason()).isNull();
    }

    private DecisionInput input() {
        return new DecisionInput(
                8,
                0.75,
                1200,
                2,
                List.of(new TopicMetric("祈福文化", 8, 0, List.of("怎么祈福"))),
                false
        );
    }

    private DecisionResponse validResponse() {
        List<DecisionCard> cards = List.of(
                card("路线承接"), card("内容承接"), card("现场承接")
        );
        return new DecisionResponse(
                "模型摘要",
                cards,
                List.of("推送路线"),
                List.of("热门问题 TopN"),
                false
        );
    }

    private DecisionCard card(String title) {
        return new DecisionCard(
                title,
                "营销机会",
                "中",
                List.of("祈福文化问题 8 条"),
                "游客兴趣集中",
                List.of("推送祈福路线"),
                List.of("祈福文化"),
                List.of("灵山大佛"),
                false
        );
    }
}
