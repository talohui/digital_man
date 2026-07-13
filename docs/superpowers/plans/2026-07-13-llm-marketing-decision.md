# LLM Marketing Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace rule-only NBA generation with Fay-hosted LLM generation, while preserving validated rule fallback, five-minute caching, forced refresh, and a clear B-end source state.

**Architecture:** `analytics-server` remains the owner of data aggregation and calls a new loopback-only Fay endpoint with `DecisionInput`. Fay reuses `big_model_*` or `gpt_*` OpenAI-compatible configuration and returns strict JSON; analytics validates and caches it, otherwise it returns the existing rule result with metadata. The React page reads the metadata, supports forced refresh, ends loading on every terminal state, and remains responsive.

**Tech Stack:** Python 3 / Flask / requests / pytest; Java 17 / Spring Boot 3.3 / RestClient / JUnit 5; React / TypeScript / Ant Design / Node test runner.

---

## File map

- Create `数字人开源项目/Fay-main/utils/marketing_decision_llm.py`: model selection, prompt construction, OpenAI-compatible request, JSON extraction and validation.
- Create `数字人开源项目/Fay-main/gui/marketing_decision_api.py`: loopback-only Flask route with bounded request handling.
- Modify `数字人开源项目/Fay-main/gui/flask_server.py`: register the new route only.
- Create `数字人开源项目/Fay-main/tests/test_marketing_decision_llm.py`: generator and parser behavior.
- Create `数字人开源项目/Fay-main/tests/test_marketing_decision_api.py`: route access and error behavior.
- Create `analytics-server/src/main/java/com/lingshan/analytics/config/MarketingDecisionProperties.java`: Fay base URL and timeout properties.
- Create `analytics-server/src/main/java/com/lingshan/analytics/service/FayMarketingDecisionClient.java`: bounded HTTP client.
- Modify `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionResponse.java`: generation metadata with backward-compatible constructor.
- Modify `analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionService.java`: validate, cache, force refresh, and rule fallback.
- Modify `analytics-server/src/main/java/com/lingshan/analytics/controller/DashboardController.java`: accept `forceRefresh`.
- Modify `analytics-server/src/main/resources/application.properties`: internal Fay URL and timeouts.
- Create `analytics-server/src/test/java/com/lingshan/analytics/service/FayMarketingDecisionClientTest.java`: client contract tests.
- Modify `analytics-server/src/test/java/com/lingshan/analytics/service/MarketingDecisionServiceTest.java`: LLM/cache/fallback tests.
- Modify `demo/src/pages/AdminMarketingDecisionPage.tsx`: state badge, generation time, force refresh, terminal error state, responsive layout.
- Modify `demo/src/pages/AdminMarketingDecisionPage.test.ts`: source state, refresh request and responsive contract tests.

### Task 1: Fay structured LLM generator

**Files:**
- Create: `数字人开源项目/Fay-main/utils/marketing_decision_llm.py`
- Test: `数字人开源项目/Fay-main/tests/test_marketing_decision_llm.py`

- [ ] **Step 1: Write failing generator tests**

```python
def test_prefers_big_model_configuration(monkeypatch):
    config = SimpleNamespace(
        big_model_engine="qwen-max",
        big_model_base_url="https://big.example/v1",
        big_model_api_key="big-key",
        gpt_model_engine="qwen-turbo",
        gpt_base_url="https://small.example/v1",
        key_gpt_api_key="small-key",
    )
    assert select_model_config(config) == ModelConfig(
        "qwen-max", "https://big.example/v1", "big-key"
    )

def test_extracts_valid_json_from_code_fence():
    payload = extract_decision_json("```json\n{\"summary\":\"摘要\",\"cards\":[...] }\n```")
    assert payload["summary"] == "摘要"

def test_rejects_card_with_unknown_priority():
    with pytest.raises(ValueError, match="priority"):
        validate_decision_payload(payload_with_priority("紧急"))
```

- [ ] **Step 2: Run tests and verify RED**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_marketing_decision_llm.py -q`

Expected: collection fails because `utils.marketing_decision_llm` does not exist.

- [ ] **Step 3: Implement the minimal generator**

Implement these public boundaries:

```python
@dataclass(frozen=True)
class ModelConfig:
    model: str
    base_url: str
    api_key: str

def select_model_config(config): ...
def extract_decision_json(text: str) -> dict: ...
def validate_decision_payload(payload: dict) -> dict: ...

def generate_marketing_decision(decision_input, config, post=requests.post):
    selected = select_model_config(config)
    response = post(
        selected.base_url.rstrip("/") + "/chat/completions",
        headers={"Authorization": f"Bearer {selected.api_key}"},
        json={
            "model": selected.model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": build_messages(decision_input),
        },
        timeout=20,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return validate_decision_payload(extract_decision_json(content))
```

Validation limits cards to 3–5, priorities to `高/中/低`, list lengths to the design limits, and strips unknown top-level output fields. Prompt text states that every numeric fact must be copied from input.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_marketing_decision_llm.py -q`

Expected: all generator tests pass.

### Task 2: Fay internal Flask endpoint

**Files:**
- Create: `数字人开源项目/Fay-main/gui/marketing_decision_api.py`
- Modify: `数字人开源项目/Fay-main/gui/flask_server.py`
- Test: `数字人开源项目/Fay-main/tests/test_marketing_decision_api.py`

- [ ] **Step 1: Write failing route tests**

```python
def test_internal_endpoint_returns_generator_payload():
    client = create_client(generator=lambda _: valid_payload())
    response = client.post(
        "/api/internal/marketing-decision",
        json={"totalMessages": 8, "topics": []},
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )
    assert response.status_code == 200
    assert response.get_json()["summary"] == "摘要"

def test_internal_endpoint_rejects_non_loopback_requests():
    response = client.post(
        "/api/internal/marketing-decision",
        json={},
        environ_base={"REMOTE_ADDR": "10.0.0.2"},
    )
    assert response.status_code == 403
```

- [ ] **Step 2: Run tests and verify RED**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_marketing_decision_api.py -q`

Expected: import or route registration failure.

- [ ] **Step 3: Implement and register the endpoint**

```python
def register_marketing_decision_api(app, generator):
    @app.post("/api/internal/marketing-decision")
    def internal_marketing_decision():
        if request.remote_addr not in {"127.0.0.1", "::1"}:
            return jsonify({"message": "forbidden"}), 403
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"message": "invalid decision input"}), 400
        try:
            return jsonify(generator(payload))
        except ValueError as error:
            return jsonify({"message": str(error)}), 422
        except Exception:
            return jsonify({"message": "model decision unavailable"}), 503
```

In `flask_server.py`, register it with a lambda that passes `config_util` to `generate_marketing_decision`. Do not log request bodies, API keys, or raw model output.

- [ ] **Step 4: Run endpoint and existing Fay tests**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_marketing_decision_api.py tests/test_marketing_decision_llm.py -q`

Expected: all selected tests pass.

### Task 3: Analytics Fay client and response metadata

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/config/MarketingDecisionProperties.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/FayMarketingDecisionClient.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionResponse.java`
- Modify: `analytics-server/src/main/resources/application.properties`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/FayMarketingDecisionClientTest.java`

- [ ] **Step 1: Write failing client and metadata tests**

```java
@Test
void returnsStructuredDecisionFromFay() {
    server.enqueue(jsonResponse(validDecisionJson()));
    DecisionResponse result = client.generate(input());
    assertThat(result.summary()).isEqualTo("模型摘要");
    assertThat(result.cards()).hasSize(3);
}

@Test
void supportsGenerationMetadataWithoutBreakingRuleConstructors() {
    DecisionResponse response = new DecisionResponse(
        "摘要", cards(), todos(), sources(), false
    );
    assertThat(response.generationSource()).isNull();
}
```

- [ ] **Step 2: Run tests and verify RED**

Run: `mvn -q -Dtest=FayMarketingDecisionClientTest test`

Expected: missing client/properties/metadata failures.

- [ ] **Step 3: Implement properties, client, and metadata**

```java
@ConfigurationProperties(prefix = "marketing-decision")
public record MarketingDecisionProperties(String fayBaseUrl, int connectTimeoutMs, int readTimeoutMs) {}
```

`FayMarketingDecisionClient.generate(DecisionInput)` posts to `/api/internal/marketing-decision` using a `SimpleClientHttpRequestFactory` with bounded connect/read timeouts and deserializes `DecisionResponse`.

Extend `DecisionResponse` with:

```java
String generationSource,
String generatedAt,
boolean cacheHit,
String fallbackReason
```

Keep the existing five-argument constructor delegating to the canonical record constructor with neutral metadata.

Add properties:

```properties
marketing-decision.fay-base-url=${FAY_HTTP_URL:http://127.0.0.1:5000}
marketing-decision.connect-timeout-ms=1500
marketing-decision.read-timeout-ms=25000
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `mvn -q -Dtest=FayMarketingDecisionClientTest test`

Expected: selected client tests pass.

### Task 4: Analytics validation, cache, force refresh, and fallback

**Files:**
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/controller/DashboardController.java`
- Modify: `analytics-server/src/test/java/com/lingshan/analytics/service/MarketingDecisionServiceTest.java`

- [ ] **Step 1: Write failing behavior tests**

```java
@Test
void usesLlmResponseAndCachesItForFiveMinutes() {
    DecisionResponse first = service.getDecisionCards(false);
    DecisionResponse second = service.getDecisionCards(false);
    assertThat(first.generationSource()).isEqualTo("llm");
    assertThat(second.cacheHit()).isTrue();
    verify(client, times(1)).generate(any());
}

@Test
void forceRefreshBypassesCache() {
    service.getDecisionCards(false);
    service.getDecisionCards(true);
    verify(client, times(2)).generate(any());
}

@Test
void fallsBackToRulesWhenFayFails() {
    when(client.generate(any())).thenThrow(new ResourceAccessException("timeout"));
    DecisionResponse result = service.getDecisionCards(false);
    assertThat(result.generationSource()).isEqualTo("rules");
    assertThat(result.cards()).isNotEmpty();
    assertThat(result.fallbackReason()).contains("模型服务暂不可用");
}
```

- [ ] **Step 2: Run tests and verify RED**

Run: `mvn -q -Dtest=MarketingDecisionServiceTest test`

Expected: constructor/method/metadata assertions fail because LLM/cache behavior is absent.

- [ ] **Step 3: Implement minimal synchronized cache and validation**

Add `getDecisionCards(boolean forceRefresh)` and keep `getDecisionCards()` delegating with `false`. Within a synchronized refresh section:

1. return unexpired cache unless forced;
2. build `DecisionInput` using the existing aggregation;
3. call `FayMarketingDecisionClient.generate(input)`;
4. validate 3–5 cards and required fields;
5. decorate successful output with `generationSource="llm"` and current ISO time;
6. on any client/validation error call `engine.generate(input)`, decorate with `generationSource="rules"` and a non-sensitive fallback reason;
7. cache either result for five minutes.

Controller contract:

```java
@GetMapping("/marketing-decision")
public Object marketingDecision(
        @RequestParam(defaultValue = "false") boolean forceRefresh
) {
    return marketingDecisionService.getDecisionCards(forceRefresh);
}
```

- [ ] **Step 4: Run service and full analytics tests**

Run: `mvn -q -Dtest=MarketingDecisionServiceTest test`

Expected: selected tests pass.

Run: `mvn -q test`

Expected: all analytics tests pass.

### Task 5: B-end source state, refresh, and responsive behavior

**Files:**
- Modify: `demo/src/pages/AdminMarketingDecisionPage.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.test.ts`

- [ ] **Step 1: Write failing UI contract tests**

```typescript
test('shows LLM, rule fallback and demo source labels', () => {
  assert.match(page, /大模型生成/)
  assert.match(page, /规则兜底/)
  assert.match(page, /演示样例/)
})

test('force refresh calls the analytics endpoint and terminal errors stop loading', () => {
  assert.match(page, /forceRefresh=true/)
  assert.match(page, /setLoading\(false\)/)
  assert.match(page, /重新生成/)
})

test('page prevents narrow viewport overflow', () => {
  assert.match(page, /minWidth:\s*0/)
  assert.match(page, /flexWrap:\s*'wrap'/)
  assert.match(page, /overflowX:\s*'hidden'/)
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test src/pages/AdminMarketingDecisionPage.test.ts`

Expected: new source, force refresh, loading, and responsive assertions fail.

- [ ] **Step 3: Implement minimal page changes**

Extend `DecisionResponse` with `generationSource`, `generatedAt`, `cacheHit`, and `fallbackReason`. Extract `load(forceRefresh = false)` so the button can call `load(true)`, and always clear loading in `finally`.

Add:

```tsx
<Tag color={sourceColor}>{sourceLabel}</Tag>
{decision?.generatedAt ? <Text>生成于 {formatTime(decision.generatedAt)}</Text> : null}
<Button loading={loading} onClick={() => void load(true)}>重新生成</Button>
```

Use `forceRefresh ? '?forceRefresh=true' : ''` on both primary and compatibility endpoints. Add `overflowX: 'hidden'` to the page, `flexWrap: 'wrap'` to the header, and `minWidth: 0` to text/grid containers. When there is an error and no decision, render a terminal error card rather than the loading card.

- [ ] **Step 4: Run page tests and frontend verification**

Run: `node --test src/pages/AdminMarketingDecisionPage.test.ts`

Expected: page tests pass.

Run: `npm run build`

Expected: Vite production build exits 0.

### Task 6: Integrated verification

**Files:** No production edits expected.

- [ ] **Step 1: Run focused Fay suite**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_marketing_decision_llm.py tests/test_marketing_decision_api.py -q`

Expected: all focused Fay tests pass.

- [ ] **Step 2: Run analytics suite**

Run: `mvn -q test`

Expected: all analytics tests pass.

- [ ] **Step 3: Run frontend tests and build**

Run: `node --test src/pages/AdminMarketingDecisionPage.test.ts`

Expected: all page contract tests pass.

Run: `npm run build`

Expected: build exits 0.

- [ ] **Step 4: Inspect only scoped diff**

Run: `git diff --check -- <all files listed in this plan>`

Expected: no whitespace errors, no secret values, and no unrelated files changed by this implementation.
