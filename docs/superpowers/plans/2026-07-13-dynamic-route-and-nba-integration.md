# Dynamic Route and NBA Emergency Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use recent behavior heat, active emergency constraints, consent, ticket/consumption/persona data, and emergency state in route and NBA outputs.

**Architecture:** Keep existing Gorse/local route ranking, then apply one deterministic constraint layer. Marketing decision input receives aggregated emergency/commerce/persona facts; model failure still uses the same enriched rule input.

**Tech Stack:** Java 17, Spring Boot, JUnit 5; existing React API types.

---

### Task 1: Add route constraint model and evaluator

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/RouteConstraintEvaluator.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/GuideRouteCard.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/GuideRecommendationResponse.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/RouteConstraintEvaluatorTest.java`

- [ ] **Step 1: Write failing deterministic tests**

```java
assertThat(evaluator.apply(routes, List.of(exclude("fan_gong")), heat("jiulong_guanyu", 8)))
    .allSatisfy(route -> assertThat(route.stopIds()).doesNotContain("fan_gong"));
assertThat(evaluator.apply(routes, List.of(penalize("family")), Map.of()).getFirst().id())
    .isNotEqualTo("family");
assertThat(evaluator.apply(singleStopRoute, List.of(exclude("only-stop")), Map.of()).fallbackUsed())
    .isTrue();
```

- [ ] **Step 2: Run and confirm missing evaluator failure**

Run: `cd analytics-server && mvn -Dtest=RouteConstraintEvaluatorTest test`

Expected: compilation failure.

- [ ] **Step 3: Implement post-ranking penalties and explanations**

Apply recent behavior heat as a capped score penalty, `PENALIZE` as a larger route/spot penalty, and `EXCLUDE` by removing affected stops. Return `adjustmentReasons`, `dataFreshness`, and `fallbackUsed`; label heat source `游客端访问热度`.

- [ ] **Step 4: Run and commit**

Run: `cd analytics-server && mvn -Dtest=RouteConstraintEvaluatorTest test`

Expected: PASS for penalize, exclude, and safe fallback.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics/{service,dto} analytics-server/src/test/java/com/lingshan/analytics/service/RouteConstraintEvaluatorTest.java && git commit -m "feat: add emergency route constraints"`

### Task 2: Integrate heat, emergencies, and consent into recommendations

**Files:**
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRecommendationService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/EmergencyEventService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/VisitorPrivacyService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/repository/EventRepository.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/GuideRecommendationServiceTest.java`

- [ ] **Step 1: Write failing orchestration tests**

```java
when(consent.personalizationEnabled(userId)).thenReturn(false);
assertThat(service.recommend(request).recommendationSource()).isEqualTo("default-no-personalization");
when(emergencies.active(any())).thenReturn(List.of(exclude("fan_gong")));
assertThat(service.recommend(request).routes()).allSatisfy(route ->
    assertThat(route.stopIds()).doesNotContain("fan_gong"));
```

- [ ] **Step 2: Run and confirm behavior is absent**

Run: `cd analytics-server && mvn -Dtest=GuideRecommendationServiceTest test`

Expected: FAIL on source and excluded stop assertions.

- [ ] **Step 3: Wire the evaluator after current recommendation generation**

Query only `spot_enter` events from the last five minutes, active emergencies for current time, and consent for the request user. With personalization disabled, bypass Gorse/persona scoring and start from catalog defaults before applying safety constraints.

- [ ] **Step 4: Run route/backend suites and commit**

Run: `cd analytics-server && mvn -Dtest=GuideRecommendationServiceTest,LocalScoreEngineTest test`

Expected: PASS and existing default recommendations remain unchanged without active constraints.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics analytics-server/src/test/java/com/lingshan/analytics/service/GuideRecommendationServiceTest.java && git commit -m "feat: apply live constraints to route recommendations"`

### Task 3: Enrich NBA inputs and emergency todos

**Files:**
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/DecisionInput.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionEngine.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/FayMarketingDecisionClient.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/MarketingDecisionServiceTest.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/MarketingDecisionEngineTest.java`

- [ ] **Step 1: Write failing enriched-input tests**

```java
DecisionInput input = service.buildDecisionInputForTest();
assertThat(input.totalConsumption()).isEqualTo(368.0);
assertThat(input.personaTags()).contains("亲子游");
assertThat(input.activeEmergencies()).extracting(EmergencySignal::type).contains("ROAD_CLOSURE");
DecisionResponse fallback = engine.generate(input);
assertThat(fallback.actionTodos()).anyMatch(todo -> todo.contains("道路封闭"));
```

- [ ] **Step 2: Run and confirm missing emergency input failure**

Run: `cd analytics-server && mvn -Dtest=MarketingDecisionServiceTest,MarketingDecisionEngineTest test`

Expected: FAIL because active emergencies are not in `DecisionInput`.

- [ ] **Step 3: Aggregate current commerce/persona/heat/emergency facts**

Reuse existing 24-hour ticket, purchase, preference, emotion, latency, question, and five-minute hotspot aggregation. Add active emergency summaries and explicit data source labels; do not include visitor IDs or raw full conversations.

- [ ] **Step 4: Update prompt and rule fallback**

Require emergency cards to recommend confirmed operational actions only. Rule fallback adds critical/high-priority emergency todos while retaining marketing/service cards when safe.

- [ ] **Step 5: Run full backend suite and commit**

Run: `cd analytics-server && mvn test`

Expected: BUILD SUCCESS; LLM validation/fallback and current input tests pass.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics/service analytics-server/src/test/java/com/lingshan/analytics/service && git commit -m "feat: include emergencies in nba decisions"`

