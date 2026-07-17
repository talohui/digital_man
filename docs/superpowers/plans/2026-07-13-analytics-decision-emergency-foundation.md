# Analytics Decision and Emergency Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist NBA snapshots/actions, emergency events, visitor consent, export, and user-scoped deletion in analytics-server.

**Architecture:** Spring Boot remains the source of truth. New JPA entities and repositories sit behind focused services; controllers expose DTOs rather than entities. Existing `/api/dashboard/marketing-decision` remains backward compatible and only adds `snapshotId`.

**Tech Stack:** Java 17, Spring Boot 3.3, Spring Data JPA, H2, JUnit 5, MockMvc.

---

### Task 1: Persist decision snapshots and cards

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/entity/DecisionSnapshot.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/entity/DecisionCardRecord.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/repository/DecisionSnapshotRepository.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/repository/DecisionCardRecordRepository.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/DecisionHistoryService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionResponse.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionService.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/DecisionHistoryServiceTest.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/MarketingDecisionServiceTest.java`

- [ ] **Step 1: Write failing persistence tests**

```java
@Test
void savesOneSnapshotForFreshGenerationAndNoneForCacheHit() {
    DecisionResponse first = service.getDecisionCards(true);
    DecisionResponse cached = service.getDecisionCards(false);
    assertThat(first.snapshotId()).isNotBlank();
    assertThat(cached.snapshotId()).isEqualTo(first.snapshotId());
    assertThat(snapshotRepository.count()).isEqualTo(1);
}
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `cd analytics-server && mvn -Dtest=DecisionHistoryServiceTest,MarketingDecisionServiceTest test`

Expected: compilation failure because `snapshotId` and persistence classes do not exist.

- [ ] **Step 3: Add focused entities and repositories**

Implement `DecisionSnapshot` with `id`, summary/source/timestamps/cache/fallback/window fields and JSON strings, and `DecisionCardRecord` with `snapshotId`, `stableKey`, card content JSON fields. Use generated UUID strings and repository methods:

```java
Page<DecisionSnapshot> findAllByOrderByGeneratedAtDesc(Pageable pageable);
List<DecisionCardRecord> findBySnapshotIdOrderByIdAsc(String snapshotId);
```

- [ ] **Step 4: Add history serialization and integrate fresh generation**

Add `String snapshotId` as the final `DecisionResponse` component and preserve the five-argument constructor. `DecisionHistoryService.save(DecisionResponse, DecisionInput)` returns the persisted ID. Call it only after a fresh LLM/rules generation; return the cached ID on cache hits.

- [ ] **Step 5: Run tests and commit**

Run: `cd analytics-server && mvn -Dtest=DecisionHistoryServiceTest,MarketingDecisionServiceTest test`

Expected: PASS; repository count remains one after the cached request.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics/{entity,repository,service,dto} analytics-server/src/test/java/com/lingshan/analytics/service && git commit -m "feat: persist marketing decision snapshots"`

### Task 2: Expose history, detail, and comparison

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionSnapshotDetail.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionComparison.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/DecisionHistoryService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/controller/DashboardController.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/controller/DecisionHistoryControllerTest.java`

- [ ] **Step 1: Write failing MockMvc tests**

```java
mockMvc.perform(get("/api/dashboard/marketing-decision/history?page=0&size=20"))
    .andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray());
mockMvc.perform(get("/api/dashboard/marketing-decision/{id}", snapshotId))
    .andExpect(jsonPath("$.cards[0].evidence").isArray());
mockMvc.perform(get("/api/dashboard/marketing-decision/{newer}/compare/{older}", newer, older))
    .andExpect(jsonPath("$.added").isArray())
    .andExpect(jsonPath("$.priorityChanged").isArray());
```

- [ ] **Step 2: Run and confirm 404 responses**

Run: `cd analytics-server && mvn -Dtest=DecisionHistoryControllerTest test`

Expected: FAIL with 404.

- [ ] **Step 3: Implement DTO mapping and stable-key comparison**

Map JSON fields with the shared `ObjectMapper`. Comparison uses `stableKey` maps and returns `added`, `removed`, and entries whose priority changed. Evidence samples are truncated to 120 characters and never include `userId` or `sessionId`.

- [ ] **Step 4: Add controller endpoints and validate pagination**

Add `history(page,size)`, `detail(snapshotId)`, and `compare(newer,older)` under `/api/dashboard/marketing-decision`; clamp `size` to 1–100 and return 404 for missing IDs.

- [ ] **Step 5: Run tests and commit**

Run: `cd analytics-server && mvn -Dtest=DecisionHistoryControllerTest test`

Expected: PASS.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics/{controller,dto,service} analytics-server/src/test/java/com/lingshan/analytics/controller && git commit -m "feat: expose decision history and comparison"`

### Task 3: Add decision action workflow and evaluation

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/entity/DecisionAction.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/repository/DecisionActionRepository.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/DecisionActionService.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/controller/DecisionActionController.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/DecisionActionServiceTest.java`

- [ ] **Step 1: Write failing state-machine and metric tests**

```java
assertThatThrownBy(() -> service.update(id, "COMPLETED", null, null, null))
    .isInstanceOf(IllegalStateException.class);
DecisionActionDto accepted = service.update(id, "ACCEPTED", "运营一组", dueAt, "先试运行");
assertThat(accepted.status()).isEqualTo("ACCEPTED");
assertThat(service.evaluate(id, baselineStart, baselineEnd, resultStart, resultEnd)
    .resultMetrics()).containsKeys("questionCount", "negativeRatio", "purchaseAmount", "p90LatencyMs");
```

- [ ] **Step 2: Run and confirm missing service failure**

Run: `cd analytics-server && mvn -Dtest=DecisionActionServiceTest test`

Expected: compilation failure.

- [ ] **Step 3: Implement action persistence and transitions**

Allow only `PROPOSED -> ACCEPTED|DISMISSED`, `ACCEPTED -> IN_PROGRESS|DISMISSED`, and `IN_PROGRESS -> COMPLETED|DISMISSED`. Store baseline/result metrics as JSON and timestamps as `LocalDateTime`.

- [ ] **Step 4: Implement evaluation queries**

Use `EventRepository.findByTsBetween` to compute question count, negative ratio, route exposure/clicks, spot visits, ticket/purchase totals, average rating, and P90 reply latency for both windows. Return deltas as observations, never causal claims.

- [ ] **Step 5: Add POST/PATCH/evaluate endpoints, run, and commit**

Run: `cd analytics-server && mvn -Dtest=DecisionActionServiceTest test`

Expected: PASS including illegal transition rejection.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics/{entity,repository,service,controller} analytics-server/src/test/java/com/lingshan/analytics/service && git commit -m "feat: track and evaluate decision actions"`

### Task 4: Persist and publish emergency events

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/entity/EmergencyEvent.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/repository/EmergencyEventRepository.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/EmergencyEventService.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/controller/EmergencyEventController.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/EmergencyEventServiceTest.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/controller/EmergencyEventControllerTest.java`

- [ ] **Step 1: Write failing lifecycle tests**

```java
EmergencyEventDto draft = service.create(validDraft());
assertThat(draft.status()).isEqualTo("DRAFT");
EmergencyEventDto active = service.publish(draft.id());
assertThat(active.status()).isEqualTo("ACTIVE");
assertThat(service.active(now)).extracting(EmergencyEventDto::id).contains(draft.id());
assertThat(service.resolve(draft.id()).status()).isEqualTo("RESOLVED");
```

- [ ] **Step 2: Run and confirm missing classes**

Run: `cd analytics-server && mvn -Dtest=EmergencyEventServiceTest,EmergencyEventControllerTest test`

Expected: compilation failure.

- [ ] **Step 3: Implement validation and lifecycle**

Validate the seven event types, three severities, three route policies, `validUntil > validFrom`, and nonblank confirmed instructions for `MISSING_PERSON`/`MEDICAL_HELP`. Persist `updatedAt` on every edit so clients can version announcements. Expired active events are excluded by repository time-window query.

- [ ] **Step 4: Add public/admin endpoints**

Expose admin CRUD/publish/resolve under `/api/admin/emergencies` and a public projection at `/api/public/emergencies/active`. Public responses omit `createdBy`, raw sync errors, and internal notes.

- [ ] **Step 5: Run and commit**

Run: `cd analytics-server && mvn -Dtest=EmergencyEventServiceTest,EmergencyEventControllerTest test`

Expected: PASS for draft/publish/resolve/expiry and public projection.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics/{entity,repository,service,controller} analytics-server/src/test/java/com/lingshan/analytics && git commit -m "feat: add emergency event lifecycle"`

### Task 5: Add visitor consent, export, and scoped deletion

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/entity/VisitorConsent.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/repository/VisitorConsentRepository.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/VisitorPrivacyService.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/controller/VisitorPrivacyController.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/repository/EventRepository.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/repository/UserProfileRepository.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/repository/VisitorBehaviorRecordRepository.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/AnalyticsService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/PersonaEngine.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/VisitorPrivacyServiceTest.java`

- [ ] **Step 1: Write failing consent and deletion tests**

```java
service.updateConsent(userId, false, false);
analyticsService.save(eventFor(userId));
assertThat(eventRepository.findByUserId(userId)).isEmpty();
DeleteResult result = service.deleteAll(userId);
assertThat(result.complete()).isTrue();
assertThat(profileRepository.findByUserId(userId)).isEmpty();
assertThat(behaviorRepository.findByUserId(userId)).isEmpty();
```

- [ ] **Step 2: Run and confirm failure**

Run: `cd analytics-server && mvn -Dtest=VisitorPrivacyServiceTest test`

Expected: compilation failure.

- [ ] **Step 3: Implement consent gates and strict identifier validation**

Accept only `guest-` followed by a UUID. Default both flags to true when no record exists. Reject new nonessential analytics writes when `analyticsEnabled=false`; skip persona updates when `personalizationEnabled=false`.

- [ ] **Step 4: Implement summary/export/delete transaction**

Summary reports categories and counts; export returns profile, consent, footprint, ticket/purchase events, and analytics events as JSON. `@Transactional deleteAll` deletes only the given user from events/profile/behavior/consent and returns per-category counts.

- [ ] **Step 5: Add privacy endpoints, run full backend suite, and commit**

Run: `cd analytics-server && mvn test`

Expected: BUILD SUCCESS; existing dashboard and guide tests still pass.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics analytics-server/src/test/java/com/lingshan/analytics && git commit -m "feat: add visitor privacy controls"`
