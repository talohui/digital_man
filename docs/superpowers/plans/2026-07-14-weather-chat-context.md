# Weather Chat Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give 灵山小灵 trusted real-time weather context and one proactive, deduplicated safety reminder per visitor and weather risk state.

**Architecture:** analytics-server remains the sole weather-policy authority: it maps raw Tencent weather to route strategy, risk key and fixed safe notice. Fay fetches only the sanitized public weather DTO through a short-lived provider cache, adds the compact snapshot to the system prompt, and emits the fixed notice once before normal streamed text when the visitor enters or changes a risk state.

**Tech Stack:** Spring Boot / Java 17, Python 3, Fay streaming response pipeline, pytest/unittest, Maven.

---

### Task 1: Return explicit weather risk policy from analytics-server

**Files:**
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/ScenicWeatherDto.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/WeatherRouteAdvisor.java`
- Modify: `analytics-server/src/test/java/com/lingshan/analytics/service/WeatherRouteAdvisorTest.java`

- [ ] **Step 1: Write the failing test**

```java
WeatherRouteAdvisor.Result result = advisor.apply(
        List.of(route("natural_scenery", 80)),
        weather("小雨", 22, 90, "4级")
);
assertThat(result.weather().weatherRiskKey()).isEqualTo("wet-surface");
assertThat(result.weather().safetyNotice()).contains("台阶和石板路");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/maven/bin/mvn -Dtest=WeatherRouteAdvisorTest test`

Expected: compilation fails because `weatherRiskKey` and `safetyNotice` do not exist.

- [ ] **Step 3: Write minimal implementation**

Add nullable `weatherRiskKey` and `safetyNotice` fields to `ScenicWeatherDto`, preserve them in `asCached()` and `withGuidance()`, and make `WeatherRouteAdvisor` return the exact policy table values in the approved design. Keep policy priority rain/snow/thunder > hot/sunny > humidity/wind > normal.

```java
public ScenicWeatherDto withGuidance(
        String strategy, String routeAdvice, String weatherRiskKey, String safetyNotice
) {
    return new ScenicWeatherDto(weather, temperature, humidity, windDirection, windPower,
            airPressure, updateTime, district, source, cached,
            strategy, routeAdvice, weatherRiskKey, safetyNotice);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run the same Maven command. Expected: all advisor tests pass.

### Task 2: Build Fay’s independent weather context provider

**Files:**
- Create: `数字人开源项目/Fay-main/llm/lingshan_weather_context.py`
- Create: `数字人开源项目/Fay-main/tests/test_lingshan_weather_context.py`

- [ ] **Step 1: Write failing tests**

```python
def test_formats_sanitized_weather_context_and_notice():
    context = provider.from_payload({"weather": "小雨", "temperature": 22,
      "humidity": 90, "windDirection": "东风", "windPower": "4级",
      "updateTime": "2026-07-14 10:00", "strategy": "indoor-preferred",
      "routeAdvice": "降水天气，优先推荐室内停留更多的路线",
      "weatherRiskKey": "wet-surface", "safetyNotice": "当前可能有降水…"})
    assert "小雨" in context.prompt_text
    assert context.risk_key == "wet-surface"

def test_same_visitor_and_risk_is_not_notified_twice():
    assert notifier.notice_for("visitor-1", "wet-surface", "防滑提醒") == "防滑提醒"
    assert notifier.notice_for("visitor-1", "wet-surface", "防滑提醒") is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_lingshan_weather_context.py -q`

Expected: module import fails because the provider does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement a small provider using `requests.get`, environment variable `LINGSHAN_ANALYTICS_BASE_URL` (default `http://127.0.0.1:5002/api`), 800ms timeout and a process-local 120-second cache. Return `None` for timeout, 503, malformed payload or missing required weather facts. Implement a thread-safe `WeatherNoticeRegistry` keyed by `username + risk_key`; normal weather never yields a notice. Do not log response payloads or credentials.

```python
@dataclass(frozen=True)
class WeatherContext:
    prompt_text: str
    risk_key: str
    safety_notice: str

def get_weather_context() -> WeatherContext | None:
    response = requests.get(f"{_analytics_base_url()}/public/weather", timeout=0.8)
    if response.status_code != 200:
        return None
    return _from_payload(response.json())
```

- [ ] **Step 4: Run tests to verify they pass**

Run the same pytest command. Expected: context, caching, timeout fallback and notice dedupe tests pass.

### Task 3: Inject weather context into the Fay question pipeline

**Files:**
- Modify: `数字人开源项目/Fay-main/llm/nlp_cognitive_stream.py`
- Modify: `数字人开源项目/Fay-main/tests/test_lingshan_emotion_context.py`
- Modify: `数字人开源项目/Fay-main/tests/test_lingshan_weather_context.py`

- [ ] **Step 1: Write failing source-contract tests**

```python
source = Path("llm/nlp_cognitive_stream.py").read_text(encoding="utf-8")
assert "get_weather_context" in source
assert "weather_context.prompt_text" in source
assert "weather_notice" in source
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_lingshan_weather_context.py tests/test_lingshan_emotion_context.py -q`

Expected: source-contract assertion fails because `question()` does not yet retrieve weather context.

- [ ] **Step 3: Write minimal implementation**

Immediately after the existing system prompt is created, call the provider once, append a bounded `**实时天气导览上下文**` section when available, and add a strict instruction not to claim real-time weather when it is absent. If `WeatherNoticeRegistry` returns a fixed notice, call `write_sentence(weather_notice, force_first=is_first_sentence)` once before the first LLM output, then set `is_first_sentence` false. The notice must be written to `full_response_text` so conversation history remains coherent.

```python
weather_context = get_weather_context()
weather_notice = None
if weather_context is not None:
    system_prompt += f"\n**实时天气导览上下文**\n{weather_context.prompt_text}\n"
    weather_notice = weather_notice_registry.notice_for(
        username, weather_context.risk_key, weather_context.safety_notice
    )

if weather_notice:
    write_sentence(weather_notice, force_first=is_first_sentence)
    full_response_text += weather_notice
    is_first_sentence = False
```

- [ ] **Step 4: Run tests to verify they pass**

Run the same pytest command. Expected: both Fay behavior and prompt-contract tests pass.

### Task 4: Regression verification

**Files:**
- Verify only

- [ ] **Step 1: Run complete backend tests**

Run: `JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/maven/bin/mvn test` from `analytics-server`.

Expected: zero failures.

- [ ] **Step 2: Run affected Fay tests**

Run: `python -m pytest tests/test_lingshan_weather_context.py tests/test_lingshan_emotion_context.py tests/test_service_config.py -q` from `Fay-main`.

Expected: zero failures.

- [ ] **Step 3: Run demo validation**

Run: `node --test src/**/*.test.ts` and `npm run build` from `demo`.

Expected: zero failures and successful Vite build.

- [ ] **Step 4: Commit only feature files**

```bash
git add analytics-server/src/main/java/com/lingshan/analytics/dto/ScenicWeatherDto.java \
  analytics-server/src/main/java/com/lingshan/analytics/service/WeatherRouteAdvisor.java \
  analytics-server/src/test/java/com/lingshan/analytics/service/WeatherRouteAdvisorTest.java \
  数字人开源项目/Fay-main/llm/lingshan_weather_context.py \
  数字人开源项目/Fay-main/llm/nlp_cognitive_stream.py \
  数字人开源项目/Fay-main/tests/test_lingshan_weather_context.py
git commit -m "feat: add weather-aware guide context"
```
