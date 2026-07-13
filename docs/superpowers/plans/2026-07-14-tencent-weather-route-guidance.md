# 腾讯天气驱动路线建议 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过 analytics-server 安全代理腾讯天气，并将可解释天气策略同步到游客端首页、路线排序和 B 端总览。

**Architecture:** `TencentWeatherService` 从部署环境读取 Key，调用腾讯 WebService 并缓存 10 分钟；`WeatherRouteAdvisor` 将实时天气转换为稳定、可审计的路线重排策略。游客端和 B 端均只调用 `/api/public/weather`，路线推荐仍以应急与客流约束为先。

**Tech Stack:** Spring Boot 3 / Java 17 `HttpClient` / Jackson，React 18 / TypeScript / Vite，Node built-in test runner。

---

### Task 1: 腾讯天气服务和公共 API

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/config/TencentWeatherProperties.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/ScenicWeatherDto.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/TencentWeatherService.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/controller/PublicWeatherController.java`
- Create: `analytics-server/src/test/java/com/lingshan/analytics/service/TencentWeatherServiceTest.java`
- Modify: `analytics-server/src/main/resources/application.properties`

- [ ] **Step 1: Write the failing weather-service tests**

```java
@Test
void readsTencentRealtimeInfosWithLatitudeBeforeLongitude() {
    TestWeatherService service = new TestWeatherService(properties(), validTencentPayload());
    ScenicWeatherDto weather = service.current().orElseThrow();
    assertThat(weather.temperature()).isEqualTo(30);
    assertThat(service.lastLocation()).isEqualTo("31.4268,120.1008");
}

@Test
void servesFreshCacheWithoutCallingTencentAgain() {
    TestWeatherService service = new TestWeatherService(properties(), validTencentPayload());
    service.current();
    ScenicWeatherDto second = service.current().orElseThrow();
    assertThat(second.cached()).isTrue();
    assertThat(service.callCount()).isEqualTo(1);
}

@Test
void returnsEmptyWhenWeatherKeyIsNotConfigured() {
    assertThat(new TestWeatherService(propertiesWithBlankKey(), validTencentPayload()).current()).isEmpty();
}
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/maven/bin/mvn -Dtest=TencentWeatherServiceTest test` from `analytics-server`.

Expected: compilation failure because the weather properties, DTO and service do not exist.

- [ ] **Step 3: Add typed properties, DTO and cache-backed Tencent client**

```java
@ConfigurationProperties(prefix = "tencent.weather")
public record TencentWeatherProperties(
        String key, String baseUrl, double latitude, double longitude, int cacheTtlSeconds
) {
    public boolean configured() { return key != null && !key.isBlank(); }
}

public record ScenicWeatherDto(
        String weather, int temperature, int humidity, String windDirection,
        String windPower, int airPressure, String updateTime, String district,
        String source, boolean cached, String strategy, String routeAdvice
) {}
```

`TencentWeatherService` must use `java.net.http.HttpClient`, construct `location` as `latitude + "," + longitude`, parse only `result.realtime[0].infos`, reject non-zero Tencent `status`, and keep a successful result for `cacheTtlSeconds` (600 by default). It returns `Optional.empty()` for missing configuration or unavailable upstream data and logs only status/message, never the Key or URL query string.

- [ ] **Step 4: Add the public controller and environment defaults**

```java
@RestController
@RequestMapping("/api/public/weather")
class PublicWeatherController {
    @GetMapping
    ResponseEntity<ScenicWeatherDto> current() {
        return weatherService.current()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }
}
```

Add properties that resolve `TENCENT_WEATHER_KEY`, `LINGSHAN_WEATHER_LATITUDE`, `LINGSHAN_WEATHER_LONGITUDE`, and a 600-second cache TTL. Do not add a key to tracked configuration.

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/maven/bin/mvn -Dtest=TencentWeatherServiceTest test`.

Expected: all three tests pass.

- [ ] **Step 6: Commit the isolated backend weather contract**

```bash
git add analytics-server/src/main/java/com/lingshan/analytics/config/TencentWeatherProperties.java \
  analytics-server/src/main/java/com/lingshan/analytics/dto/ScenicWeatherDto.java \
  analytics-server/src/main/java/com/lingshan/analytics/service/TencentWeatherService.java \
  analytics-server/src/main/java/com/lingshan/analytics/controller/PublicWeatherController.java \
  analytics-server/src/main/resources/application.properties \
  analytics-server/src/test/java/com/lingshan/analytics/service/TencentWeatherServiceTest.java
git commit -m "feat: expose Tencent weather through analytics service"
```

### Task 2: 天气策略与安全后路线重排序

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/WeatherRouteAdvisor.java`
- Create: `analytics-server/src/test/java/com/lingshan/analytics/service/WeatherRouteAdvisorTest.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRouteCatalog.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRecommendationService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/ScenicWeatherDto.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/controller/PublicWeatherController.java`
- Modify: `analytics-server/src/test/java/com/lingshan/analytics/service/GuideRecommendationServiceTest.java`

- [ ] **Step 1: Write the failing route-advisor tests**

```java
@Test
void hotSunnyWeatherPromotesTheShadeRichNaturalRoute() {
    WeatherRouteAdvisor.Result result = advisor.apply(routes(), sunny(31, 56));
    assertThat(result.routes().get(0).id()).isEqualTo("natural_scenery");
    assertThat(result.adjustmentReasons()).contains("晴热天气，优先推荐树荫较多的路线");
}

@Test
void rainyWeatherPromotesTheIndoorRichHistoricalRoute() {
    WeatherRouteAdvisor.Result result = advisor.apply(routes(), rainy());
    assertThat(result.routes().get(0).id()).isEqualTo("historical_culture");
    assertThat(result.adjustmentReasons()).contains("降水天气，优先推荐室内停留更多的路线");
}

@Test
void emptyWeatherKeepsTheExistingSafeOrder() {
    assertThat(advisor.apply(routes(), null).routes()).extracting(GuideRouteCard::id)
            .containsExactly("family", "historical_culture", "natural_scenery");
}

@Test
void attachesTheSameSunnyStrategyForPublicWeatherConsumers() {
    assertThat(advisor.attachGuidance(sunny(31, 56)).strategy()).isEqualTo("sunny-heat");
}
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/maven/bin/mvn -Dtest=WeatherRouteAdvisorTest test`.

Expected: compilation failure because `WeatherRouteAdvisor` does not exist.

- [ ] **Step 3: Define auditable route comfort profiles and weather strategy**

```java
public record EnvironmentProfile(double shade, double indoorStops, double sunExposure, double walkingLoad) {}

public record WeatherStrategy(String id, String reason) {}
```

Add an `EnvironmentProfile` to each `GuideRouteCatalog.RouteProfile`. Define the natural-scenery profile as highest shade, historical-culture as highest indoor stops, and family as lower walking load. `WeatherRouteAdvisor.apply` must add score bonuses only after the existing `RouteConstraintEvaluator` has removed or penalized unsafe routes. It must append its reason to both global `adjustmentReasons` and each affected card’s `adjustmentReasons`. `WeatherRouteAdvisor.attachGuidance` must return a copy of `ScenicWeatherDto` with the same `strategy` and visitor-readable `routeAdvice`, so the public weather API and recommendation API cannot disagree on the active policy.

- [ ] **Step 4: Inject weather into recommendation orchestration**

```java
RouteConstraintEvaluator.Result constrained = constraintEvaluator.apply(...);
Optional<ScenicWeatherDto> weather = weatherService.current();
WeatherRouteAdvisor.Result weatherAdjusted = weatherRouteAdvisor.apply(constrained.routes(), weather.orElse(null));
```

Merge `weatherAdjusted.adjustmentReasons()` with the existing constraint reasons and add weather source/update fields to `dataFreshness`. Keep existing public constructors for `GuideRecommendationService` so current tests remain valid with weather unavailable. Update `PublicWeatherController` to return `weatherRouteAdvisor.attachGuidance(weather)` instead of the raw DTO. `TencentWeatherService` itself continues to return raw weather with null guidance fields.

- [ ] **Step 5: Run recommendation and advisor tests**

Run: `JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/maven/bin/mvn -Dtest=WeatherRouteAdvisorTest,GuideRecommendationServiceTest test`.

Expected: weather tests pass; existing emergency test still confirms closed stops are removed before weather sorting.

- [ ] **Step 6: Commit the weather-aware route ranking**

```bash
git add analytics-server/src/main/java/com/lingshan/analytics/service/WeatherRouteAdvisor.java \
  analytics-server/src/main/java/com/lingshan/analytics/service/GuideRouteCatalog.java \
  analytics-server/src/main/java/com/lingshan/analytics/service/GuideRecommendationService.java \
  analytics-server/src/main/java/com/lingshan/analytics/dto/ScenicWeatherDto.java \
  analytics-server/src/main/java/com/lingshan/analytics/controller/PublicWeatherController.java \
  analytics-server/src/test/java/com/lingshan/analytics/service/WeatherRouteAdvisorTest.java \
  analytics-server/src/test/java/com/lingshan/analytics/service/GuideRecommendationServiceTest.java
git commit -m "feat: adapt route ranking to weather conditions"
```

### Task 3: 前端天气 API 与游客端建议卡

**Files:**
- Create: `demo/src/api/weather.ts`
- Create: `demo/src/api/weather.test.ts`
- Create: `demo/src/api/weatherUiIntegration.test.ts`
- Modify: `demo/src/mobile/MobileHomePage.tsx`
- Modify: `demo/src/styles/global.css`

- [ ] **Step 1: Write the failing frontend API test**

```ts
test('weather API targets analytics public endpoint and always clears its timeout', () => {
  const source = read('../api/weather.ts')
  assert.match(source, /getAnalyticsApiBase\(\).*\/public\/weather/s)
  assert.match(source, /finally\s*\{\s*window\.clearTimeout\(timer\)/s)
  assert.doesNotMatch(source, /TENCENT_WEATHER_KEY|apis\.map\.qq\.com/)
})

test('visitor home shows weather without replacing the existing route adjustment panel', () => {
  const home = read('../mobile/MobileHomePage.tsx')
  const planner = read('../mobile/MobileRoutePlanPage.tsx')
  assert.match(home, /fetchScenicWeather/)
  assert.match(home, /天气暂不可用/)
  assert.match(home, /navigate\('\/plan'\)/)
  assert.match(planner, /routeAdjustmentReasons/)
})
```

- [ ] **Step 2: Run the focused Node test and verify it fails**

Run: `node --test src/api/weather.test.ts` from `demo`.

Expected: failure because the weather API module does not exist.

- [ ] **Step 3: Add a typed frontend weather request with timeout**

```ts
export type ScenicWeather = {
  weather: string; temperature: number; humidity: number;
  windDirection: string; windPower: string; updateTime: string;
  strategy?: string | null; routeAdvice?: string | null;
}

export async function fetchScenicWeather(): Promise<ScenicWeather> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${getAnalyticsApiBase()}/public/weather`, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json() as Promise<ScenicWeather>
  } finally {
    window.clearTimeout(timer)
  }
}
```

- [ ] **Step 4: Add the homepage weather card and route handoff**

`MobileHomePage` must request weather in an effect, clear loading in `finally`, and render weather or a compact unavailable state without blocking the page. Display weather, temperature, humidity, wind and update time. When the `strategy` / `routeAdvice` response is present, render a button that navigates to `/plan`.

`MobileRoutePlanPage` already renders server-returned `routeAdjustmentReasons`; verify that weather reasons pass through this existing block and do not create a second competing warning component.

- [ ] **Step 5: Add narrow responsive CSS**

Create a single `.mobile-weather-card` treatment adjacent to the existing home cards: no fixed width, long weather text wraps, and its action uses the existing green primary treatment. Do not change the desktop guide layout.

- [ ] **Step 6: Run focused frontend tests and verify they pass**

Run: `node --test src/api/weather.test.ts src/api/weatherUiIntegration.test.ts`.

Expected: tests pass and source checks prove the browser never calls Tencent directly.

- [ ] **Step 7: Commit the visitor-facing weather experience**

```bash
git add demo/src/api/weather.ts demo/src/api/weather.test.ts \
  demo/src/api/weatherUiIntegration.test.ts demo/src/mobile/MobileHomePage.tsx \
  demo/src/styles/global.css
git commit -m "feat: show weather-aware guidance to visitors"
```

### Task 4: B 端天气运营状态与端到端验证

**Files:**
- Modify: `demo/src/api/weatherUiIntegration.test.ts`
- Modify: `demo/src/pages/AdminDashboard.tsx`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: Write the failing B 端 integration contract**

```ts
test('operations dashboard uses the shared weather API without exposing Tencent credentials', () => {
  const dashboard = read('../pages/AdminDashboard.tsx')
  assert.match(dashboard, /fetchScenicWeather/)
  assert.match(dashboard, /天气暂不可用/)
  assert.doesNotMatch(dashboard, /TENCENT_WEATHER_KEY|apis\.map\.qq\.com/)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test src/api/weatherUiIntegration.test.ts`.

Expected: failure because the dashboard does not yet consume `fetchScenicWeather`.

- [ ] **Step 3: Add a compact B 端 weather status card**

`AdminDashboard` requests the same `fetchScenicWeather` module on load. In the existing real-time overview, render temperature, weather, humidity, wind, update time and active weather-route strategy. Keep the unavailable state explicit and non-blocking. No Tencent request URL or Key may reach the component.

- [ ] **Step 4: Add scoped B 端 styling and run focused tests**

Use only `.admin-ops-dashboard` scoped rules. Preserve the green translucent card language introduced in `admin-ops.css`; do not alter the visitor app styles.

Run: `node --test src/api/weatherUiIntegration.test.ts src/pages/adminOpsShell.test.ts`.

Expected: both tests pass.

- [ ] **Step 5: Run complete verification**

Run:

```bash
cd analytics-server && JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/maven/bin/mvn test
cd ../demo && node --test src/**/*.test.ts
cd ../demo && npm run build
git diff --check
```

Expected: Maven tests,  frontend tests and production build all exit 0; any Vite chunk-size warning is reported separately from failures.

- [ ] **Step 6: Commit B 端 integration after verification**

```bash
git add demo/src/pages/AdminDashboard.tsx demo/src/styles/admin-ops.css \
  demo/src/api/weatherUiIntegration.test.ts
git commit -m "feat: surface weather status in operations dashboard"
```
