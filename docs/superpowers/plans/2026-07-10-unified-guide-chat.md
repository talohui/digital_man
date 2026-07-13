# Unified Location-Aware Guide Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one continuous location-aware Xiaoling conversation, fix the stuck composer and invisible send icon, preserve worried/confused/happy expressions through the reply, and bias RAG retrieval toward the current scenic spot.

**Architecture:** The frontend uses one stable `tour-guide` scene and updates a structured `GuideContext` whenever route/spot state changes. Pure helpers own reply-completion detection, emotion priority, and scene selection so they can be tested without rendering React. The existing RAG vector search remains global, but reranking receives a parsed current-spot hint and boosts matching metadata while preserving public scenic-area knowledge.

**Tech Stack:** React 18, TypeScript, Zustand, Vite, Node test runner, Python 3, ChromaDB, Fay MCP.

---

### Task 1: Reply completion and composer unlock

**Files:**
- Create: `demo/src/lib/fayReplyLifecycle.ts`
- Create: `demo/src/lib/fayReplyLifecycle.test.ts`
- Modify: `demo/src/api/fay.ts`
- Modify: `demo/src/store/useChatStore.ts`

- [ ] **Step 1: Write failing completion tests**

Test `_\u003cisend\u003e`, `Data.IsEnd`, `data.isEnd`, non-final chunks, and timeout selection through pure functions:

```ts
assert.equal(isFayReplyComplete({ Data: { IsEnd: 1 } }, ''), true)
assert.equal(isFayReplyComplete({}, '回答结束_\u003cisend\u003e'), true)
assert.equal(isFayReplyComplete({ Data: { IsEnd: 0 } }, '回答中'), false)
assert.equal(getFaySendTimeoutMs(), 15_000)
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test src/lib/fayReplyLifecycle.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement completion helpers**

Create pure parsing helpers accepting Fay's mixed casing and numeric/boolean/string flags. Export a single 15-second request timeout constant.

- [ ] **Step 4: Add abortable HTTPS send**

Change `sendTextToFay(msg, username, signal?)` to pass `signal` into `fetch`. In `sendMessage`, create an `AbortController`, clear its timer in `finally`, and treat `AbortError` as a retryable timeout instead of leaving `isSending` stuck.

- [ ] **Step 5: Unlock on final reply**

In `handleFayMessage`, when `isFayReplyComplete` is true, patch the addressed scene with:

```ts
{ ...session, isSending: false, _lastSendTime: 0 }
```

The `finally` write remains as an idempotent fallback.

- [ ] **Step 6: Run tests**

Run: `node --test src/lib/*.test.ts`

Expected: all tests pass.

### Task 2: One guide session with structured location context

**Files:**
- Create: `demo/src/lib/guideScene.ts`
- Create: `demo/src/lib/guideScene.test.ts`
- Modify: `demo/src/store/chatSessions.ts`
- Modify: `demo/src/mobile/MobileGuidePage.tsx`
- Modify: `demo/src/pages/SpotGuidePage.tsx`

- [ ] **Step 1: Write scene-resolution tests**

Cover the stable scene ID and source priority:

```ts
assert.equal(TOUR_GUIDE_SCENE_ID, 'tour-guide')
assert.equal(resolveGuideSpotContext({ spotPageId: 'a', mapSelectedId: 'b' }).spotId, 'a')
assert.equal(resolveGuideSpotContext({ mapSelectedId: 'b', gpsSpotId: 'c' }).spotId, 'b')
assert.equal(resolveGuideSpotContext({ gpsSpotId: 'c', gpsConfidence: 0.3, defaultSpotId: 'd' }).spotId, 'd')
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test src/lib/guideScene.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Extend GuideContext**

Add `routeId`, `spotId`, `locationSource`, `locationConfidence`, and `visitedSpotIds` as optional fields while keeping existing fields compatible.

- [ ] **Step 4: Implement stable scene helpers**

Export `TOUR_GUIDE_SCENE_ID` and a pure `resolveGuideSpotContext` using priority `spot-page > map-selection > route-progress > confident GPS > route-default`.

- [ ] **Step 5: Migrate direct guide pages**

Use `TOUR_GUIDE_SCENE_ID` in both mobile and desktop spot guide pages. Update `setActiveScene` with the latest structured context instead of creating `spot:<route>:<spot>` sessions. Preserve current route, spot, narrative, visited-state tracking, and TTS calls.

- [ ] **Step 6: Run scene tests**

Run: `node --test src/lib/*.test.ts`

Expected: all tests pass.

### Task 3: Canonical entry and visible mobile send button

**Files:**
- Modify: `demo/src/components/FloatingGuide.tsx`
- Modify: `demo/src/components/ChatPanel.tsx`
- Modify: `demo/src/styles/global.css`

- [ ] **Step 1: Replace the duplicate floating chat**

Change the floating FAB action to `navigate('/guide')`. Remove the overlay-only `assistant` ChatPanel, its duplicate session state, and its body-scroll locking code. Keep the existing button artwork and route hiding rules.

- [ ] **Step 2: Give send text a dedicated class**

Render:

```tsx
<SendOutlined />
<span className="chat-card__send-label">发送</span>
```

- [ ] **Step 3: Scope mobile hiding correctly**

Replace broad `.chat-card__send span { display: none; }` selectors with `.chat-card__send-label { display: none; }`. Add an explicit icon size and disabled color so the arrow remains visible in empty, ready, and loading states.

- [ ] **Step 4: Build and visually verify**

Run: `npx tsc --noEmit`

Expected: exit 0.

At 375x812, verify FAB navigation reaches `/guide`, Live2D is present, and the send arrow is visible before typing.

### Task 4: Persist emotional expression through the reply

**Files:**
- Modify: `demo/src/store/chatSessions.ts`
- Modify: `demo/src/lib/fayEmotion.ts`
- Modify: `demo/src/lib/fayEmotion.test.ts`
- Modify: `demo/src/store/useChatStore.ts`
- Modify: `demo/src/lib/live2dManager.ts`

- [ ] **Step 1: Write emotion-priority tests**

Add tests proving user worry and confusion override generic `speaking`, while backend explicit negative/positive signals can refine neutral input:

```ts
assert.equal(resolveReplyRobotState('comfort', 'speaking', 'neutral'), 'comfort')
assert.equal(resolveReplyRobotState('thinking', 'speaking', 'neutral'), 'thinking')
assert.equal(resolveReplyRobotState('normal', 'speaking', 'happy'), 'happy')
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test src/lib/fayEmotion.test.ts`

Expected: FAIL because the resolver is missing.

- [ ] **Step 3: Store per-reply emotion**

Add `replyEmotionState: RobotState | null` to ChatSession. Set it from the user's original text at send time. Use it while handling Fay text, robot-state, and audio messages.

- [ ] **Step 4: Apply emotion priority**

Generic `thinking/speaking/normal` transport states must not override `comfort`, `happy`, or semantic `thinking`. Backend sentiment refines only neutral pending state. Clear the pending state after the final audio segment and return to `normal`.

- [ ] **Step 5: Verify expression mappings**

Keep `happy -> f04`, `thinking -> f03`, `comfort -> f06`, and ensure state changes always call `playMotionForState`.

- [ ] **Step 6: Run all frontend tests**

Run: `node --test src/lib/*.test.ts`

Expected: all tests pass.

### Task 5: Current-spot-aware RAG reranking

**Files:**
- Modify: `/Users/MR/Desktop/软件杯/lingshan-rag/scripts/rag_utils.py`
- Create: `/Users/MR/Desktop/软件杯/lingshan-rag/scripts/test_scene_context.py`

- [ ] **Step 1: Write parsing and rerank tests**

Use stdlib `unittest` to cover:

```py
self.assertEqual(extract_scene_spot("当前景点：灵山大佛\n游客问题：这里多高"), "灵山大佛")
self.assertEqual(resolve_target_spot("当前景点：九龙灌浴\n游客问题：梵宫几点开放"), "梵宫")
```

Create synthetic hits and assert the explicit/current spot hit ranks before unrelated spot hits while global service hits remain eligible.

- [ ] **Step 2: Run tests and confirm RED**

Run: `python scripts/test_scene_context.py`

Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Parse scene and explicit target**

Parse the structured `当前景点：` line. Reuse the existing spot-name aliases to detect a spot explicitly named in `游客问题：`; explicit user target wins over current scene.

- [ ] **Step 4: Boost metadata matches in reranking**

In `rerank_hits`, add a bounded boost for exact `spot_name`/`spot_id`/section-path match and a bounded penalty for chunks assigned to a different spot. Do not penalize chunks with no spot metadata, preserving ticket, transport, FAQ, and route knowledge.

- [ ] **Step 5: Run RAG and regression tests**

Run: `python scripts/test_scene_context.py`

Run: `python scripts/07_regression_check.py`

Expected: scene tests pass and existing regression checks do not lose prior hard-fact answers.

### Task 6: Final verification

**Files:**
- Verify all modified frontend and RAG files.

- [ ] **Step 1: Frontend tests and types**

Run: `node --test src/lib/*.test.ts`

Run: `npx tsc --noEmit`

- [ ] **Step 2: Production build**

Run: `npm run build`

Expected: exit 0; existing chunk-size warnings are acceptable.

- [ ] **Step 3: Mobile browser flow**

At 375x812:

1. Open `/guide` and send three sequential prompts.
2. Confirm the send icon is visible and re-enabled after each complete reply.
3. Verify worry, confusion, gratitude, and neutral prompts change the stage status/expression.
4. Navigate from another C-end page using “问小灵”; confirm `/guide`, Live2D, and prior history remain.
5. Switch selected scenic spot; confirm history remains and the next prompt contains the new scene context.

- [ ] **Step 4: Diff hygiene**

Run: `git diff --check` on the touched files and inspect `git status --short` without reverting unrelated worktree changes.
