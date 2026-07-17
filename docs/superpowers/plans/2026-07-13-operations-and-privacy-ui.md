# Operations and Privacy UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver B-side NBA history/action/emergency workflows and C-side alerts, proactive speech, dynamic-route explanations, and privacy controls.

**Architecture:** Add typed API modules and focused components/hooks around existing pages and stores. Emergency state is fetched once in `MobileShell`, cached with expiry, and announced once per event version. Privacy deletion clears local stores only after the server confirms complete deletion.

**Tech Stack:** React 18, TypeScript 5.6, Ant Design, Zustand, Node test runner used by existing `.test.ts` files, Vite.

---

### Task 1: Add typed API clients and pure helpers

**Files:**
- Create: `demo/src/api/decisionOps.ts`
- Create: `demo/src/api/emergencies.ts`
- Create: `demo/src/api/privacy.ts`
- Create: `demo/src/lib/emergencyPresentation.ts`
- Create: `demo/src/lib/privacyCleanup.ts`
- Test: `demo/src/lib/emergencyPresentation.test.ts`
- Test: `demo/src/lib/privacyCleanup.test.ts`

- [ ] **Step 1: Write failing pure-helper tests**

```ts
test('critical event becomes modal and version is announced once', () => {
  assert.equal(presentationFor(event('CRITICAL')).mode, 'modal')
  assert.equal(shouldAnnounce(event('CRITICAL'), new Set()), true)
  assert.equal(shouldAnnounce(event('CRITICAL'), new Set([eventVersion(event('CRITICAL'))])), false)
})

test('local cleanup keeps identity until server completion', () => {
  assert.equal(buildCleanupPlan({ complete: false }).remove.length, 0)
  assert.ok(buildCleanupPlan({ complete: true }).remove.includes('lingshan-guide-store'))
})
```

- [ ] **Step 2: Run and confirm module-not-found failures**

Run: `cd demo && node --test --experimental-strip-types src/lib/emergencyPresentation.test.ts src/lib/privacyCleanup.test.ts`

Expected: FAIL because helper modules do not exist.

- [ ] **Step 3: Implement API contracts and helpers**

Define DTOs matching backend names, request through `VITE_ANALYTICS_HTTP`, and throw typed errors with safe messages. Event version is `${id}:${updatedAt ?? validFrom}`; presentation maps CRITICAL to modal and others to banner. Cleanup lists guide/chat/ticket/emergency/PostHog keys and creates a new `guest-${crypto.randomUUID()}` only after complete server deletion.

- [ ] **Step 4: Run and commit**

Run: `cd demo && node --test --experimental-strip-types src/lib/emergencyPresentation.test.ts src/lib/privacyCleanup.test.ts`

Expected: PASS.

Commit: `git add demo/src/api demo/src/lib/emergencyPresentation* demo/src/lib/privacyCleanup* && git commit -m "feat: add operations and privacy api clients"`

### Task 2: Enhance the NBA decision page

**Files:**
- Create: `demo/src/components/admin/DecisionHistoryDrawer.tsx`
- Create: `demo/src/components/admin/DecisionEvidenceDrawer.tsx`
- Create: `demo/src/components/admin/DecisionActionPanel.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.test.ts`

- [ ] **Step 1: Add failing source-level/UI helper assertions**

```ts
test('decision page exposes history, evidence and action workflows', () => {
  const source = readFileSync(pagePath, 'utf8')
  for (const label of ['历史版本', '查看证据', '转为待办', '效果评估']) assert.match(source, new RegExp(label))
})
```

- [ ] **Step 2: Run and confirm missing labels failure**

Run: `cd demo && node --test --experimental-strip-types src/pages/AdminMarketingDecisionPage.test.ts`

Expected: FAIL on the new labels.

- [ ] **Step 3: Implement history/compare/evidence UI**

Add a history drawer with page loading, two-snapshot selection, and added/removed/priority-changed groups. Evidence drawer displays source, time window, aggregate counts, and truncated samples; it never renders raw user/session IDs.

- [ ] **Step 4: Implement action and evaluation UI**

Each suggested action can create a todo; panel supports valid status transitions, owner, due time, note, evaluation windows, baseline/result metrics, and explicit “相关变化，不代表因果” copy.

- [ ] **Step 5: Run tests/build and commit**

Run: `cd demo && node --test --experimental-strip-types src/pages/AdminMarketingDecisionPage.test.ts && npm run build`

Expected: tests pass and Vite build succeeds.

Commit: `git add demo/src/pages/AdminMarketingDecisionPage* demo/src/components/admin/Decision* && git commit -m "feat: add nba history and action workflow"`

### Task 3: Add B-side emergency management

**Files:**
- Create: `demo/src/pages/AdminEmergencyPage.tsx`
- Create: `demo/src/pages/AdminEmergencyPage.test.ts`
- Modify: `demo/src/App.tsx`
- Modify: `demo/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Write failing route/form tests**

```ts
test('registers emergency route and required event controls', () => {
  assert.match(appSource, /\/admin\/emergency/)
  for (const label of ['临时闭园', '演出取消', '极端天气', '景点拥堵', '道路封闭', '游客走失', '医疗求助', '发布', '解除']) {
    assert.match(pageSource, new RegExp(label))
  }
})
```

- [ ] **Step 2: Run and confirm missing route/page failure**

Run: `cd demo && node --test --experimental-strip-types src/pages/AdminEmergencyPage.test.ts`

Expected: FAIL.

- [ ] **Step 3: Build list/editor/publish workflow**

Use an Ant Design table plus drawer form for type, severity, validity, affected spots/routes, route policy, knowledge Q/A, and confirmed handling text. Show DRAFT/ACTIVE/RESOLVED/EXPIRED and KB sync status; failed sync exposes retry without blocking route state.

- [ ] **Step 4: Add lazy route and dashboard entry**

Register `/admin/emergency` in the dirty `App.tsx` with a minimal merge and add one dashboard card. Do not replace or reformat either file.

- [ ] **Step 5: Run test/build and commit**

Run: `cd demo && node --test --experimental-strip-types src/pages/AdminEmergencyPage.test.ts && npm run build`

Expected: PASS and build success.

Commit: `git add demo/src/App.tsx demo/src/pages/AdminDashboard.tsx demo/src/pages/AdminEmergencyPage* && git commit -m "feat: add emergency operations page"`

### Task 4: Add global visitor alerts and proactive announcement

**Files:**
- Create: `demo/src/components/EmergencyAlertLayer.tsx`
- Create: `demo/src/hooks/useActiveEmergencies.ts`
- Create: `demo/src/hooks/useActiveEmergencies.test.ts`
- Modify: `demo/src/mobile/MobileShell.tsx`
- Modify: `demo/src/api/fay.ts`
- Modify: `demo/src/styles/global.css`

- [ ] **Step 1: Write failing cache/announcement tests**

```ts
test('uses unexpired cached events and marks them stale after fetch failure', async () => {
  const state = await loadEmergencies({ fetcher: failingFetcher, cache: validCache })
  assert.equal(state.stale, true)
  assert.equal(state.events.length, 1)
})
```

- [ ] **Step 2: Run and confirm missing hook failure**

Run: `cd demo && node --test --experimental-strip-types src/hooks/useActiveEmergencies.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement fetch/cache and one-time announcements**

Poll active events at a bounded interval, cache only until each event’s `validUntil`, and mark stale fallback. Mount a single layer in `MobileShell`; CRITICAL events require acknowledgement, others use a compact top banner. Speak `message` exactly once per version using the existing Fay speech path; do not model-rewrite medical/missing-person text.

- [ ] **Step 4: Add responsive styles, run build, and commit**

Run: `cd demo && node --test --experimental-strip-types src/hooks/useActiveEmergencies.test.ts src/lib/emergencyPresentation.test.ts && npm run build`

Expected: PASS and no mobile horizontal overflow at 390px width.

Commit: `git add demo/src/components/EmergencyAlertLayer.tsx demo/src/hooks/useActiveEmergencies* demo/src/mobile/MobileShell.tsx demo/src/api/fay.ts demo/src/styles/global.css && git commit -m "feat: alert visitors about active emergencies"`

### Task 5: Surface dynamic-route reasons

**Files:**
- Modify: `demo/src/api/guide.ts`
- Modify: `demo/src/store/useGuideStore.ts`
- Modify: `demo/src/components/RouteCard.tsx`
- Modify: `demo/src/mobile/MobileRoutePlanPage.tsx`
- Test: `demo/src/pages/guideRoutes.test.ts`

- [ ] **Step 1: Write failing type/source assertions**

```ts
test('route UI renders adjustment reasons and behavior-heat label', () => {
  assert.match(routeCardSource, /adjustmentReasons/)
  assert.match(routePageSource, /游客端访问热度/)
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `cd demo && node --test --experimental-strip-types src/pages/guideRoutes.test.ts`

Expected: FAIL.

- [ ] **Step 3: Preserve backend metadata in store and render compact reasons**

Extend recommendation types with `adjustmentReasons`, `dataFreshness`, and `fallbackUsed`; do not remap them away. Render a small warning/reason block only when adjustments exist and a safe-fallback message when used.

- [ ] **Step 4: Run test/build and commit**

Run: `cd demo && node --test --experimental-strip-types src/pages/guideRoutes.test.ts && npm run build`

Expected: PASS and build success.

Commit: `git add demo/src/api/guide.ts demo/src/store/useGuideStore.ts demo/src/components/RouteCard.tsx demo/src/mobile/MobileRoutePlanPage.tsx demo/src/pages/guideRoutes.test.ts && git commit -m "feat: explain live route adjustments"`

### Task 6: Add visitor privacy center and safe local deletion

**Files:**
- Create: `demo/src/components/PrivacyCenter.tsx`
- Create: `demo/src/components/PrivacyCenter.test.ts`
- Modify: `demo/src/mobile/MobileProfilePage.tsx`
- Modify: `demo/src/lib/analytics.ts`
- Modify: `demo/src/store/useGuideStore.ts`
- Modify: `demo/src/store/useTicketStore.ts`
- Modify: `demo/src/store/useChatStore.ts`
- Modify: `demo/src/store/chatSessions.ts`

- [ ] **Step 1: Write failing control and consent-gate tests**

```ts
test('privacy center exposes required controls', () => {
  for (const label of ['系统保存的数据', '个性化推荐', '行为分析', '导出个人数据', '清空对话', '删除全部数据']) {
    assert.match(source, new RegExp(label))
  }
})
test('analytics capture is skipped after consent withdrawal', async () => {
  consentStore.set({ analyticsEnabled: false })
  captureEvent('spot_enter', {})
  assert.equal(fetchCalls.length, 0)
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `cd demo && node --test --experimental-strip-types src/components/PrivacyCenter.test.ts demo/src/lib/privacyCleanup.test.ts`

Expected: FAIL on missing UI and consent gate.

- [ ] **Step 3: Implement summary/toggles/export**

Load server summary for the current valid guest ID, persist both consent switches through the API, immediately gate optional analytics, and download the export response as a dated JSON file.

- [ ] **Step 4: Implement clear-chat and complete-delete flows**

Clear-chat affects only chat session storage. Full delete uses a typed confirmation, calls the server, checks `complete=true`, then resets guide/ticket/chat/emergency/PostHog state and generates a fresh guest UUID. On partial failure keep the old identity and show failed categories.

- [ ] **Step 5: Run all frontend tests/build and commit**

Run: `cd demo && node --test --experimental-strip-types 'src/**/*.test.ts' && npm run build`

Expected: all existing/new tests pass and Vite build succeeds.

Commit: `git add demo/src/components/PrivacyCenter* demo/src/mobile/MobileProfilePage.tsx demo/src/lib/analytics.ts demo/src/store && git commit -m "feat: add visitor privacy center"`

### Task 7: Cross-service verification

**Files:**
- Modify only if verification exposes a defect in files already listed above.

- [ ] **Step 1: Run backend regression suite**

Run: `cd analytics-server && mvn test`

Expected: BUILD SUCCESS.

- [ ] **Step 2: Run RAG lightweight tests without starting services/indexing**

Run: `cd /Users/MR/Desktop/软件杯/lingshan-rag && python -m unittest kb_server.test_time_aware_faq scripts.test_time_aware_retrieval kb_server.test_ingestion kb_server.test_upload_pipeline -v`

Expected: PASS; no full evaluation or index rebuild starts.

- [ ] **Step 3: Run frontend tests and production build**

Run: `cd demo && node --test --experimental-strip-types 'src/**/*.test.ts' && npm run build`

Expected: PASS and build success.

- [ ] **Step 4: Verify APIs against already-running services only**

Run: `lsof -nP -iTCP:5002 -sTCP:LISTEN; lsof -nP -iTCP:5011 -sTCP:LISTEN`

Expected: identify existing processes before any HTTP check; do not start duplicates.

Run: `curl --noproxy '*' -sS http://127.0.0.1:5002/api/public/emergencies/active`

Expected: JSON array/response with no internal fields.

- [ ] **Step 5: Perform browser QA**

At desktop `/admin/decision` verify history, evidence, action transitions, and evaluation. At `/admin/emergency` publish a short-lived noncritical test event, then at 390×844 verify banner, one-time announcement, route reason, privacy export, consent gating, and deletion failure safety. Resolve the test event afterward.

- [ ] **Step 6: Commit only verification fixes**

Commit explicit changed files only with `git commit -m "fix: complete emergency and privacy integration"`; never use `git add -A` in this dirty worktree.

