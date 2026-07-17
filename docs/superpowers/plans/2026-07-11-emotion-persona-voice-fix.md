# Emotion, Persona, and Push-to-Talk Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make strong negative user messages show 小灵's worried expression, make every identity answer use the 灵山小灵 persona, and verify mobile push-to-talk automatically sends recognized text.

**Architecture:** Keep the existing frontend emotion state and MediaRecorder/ASR pipeline. Extend only the missing negative-intent vocabulary, add an explicit backend identity policy that overrides generic Fay configuration, and harden the existing push-to-talk UI contract without introducing continuous recording.

**Tech Stack:** React 18, TypeScript, Zustand, Pixi Live2D, Node test runner, Python unittest, Fay, Aliyun NLS.

---

### Task 1: Strong negative emotion detection

**Files:**
- Modify: `demo/src/lib/fayEmotion.test.ts`
- Modify: `demo/src/lib/fayEmotion.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that `我好痛苦`, `我快撑不住了`, `我感到绝望`, and `我想哭` all return `comfort`, while a neutral guide question remains `happy`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --experimental-strip-types src/lib/fayEmotion.test.ts`

Expected: FAIL because the new strong-negative phrases currently return `happy`.

- [ ] **Step 3: Implement the minimal matcher change**

Extend the existing `anxiousPattern` in `demo/src/lib/fayEmotion.ts` with the exact strong-negative phrases needed by the tests. Keep gratitude and confusion precedence unchanged.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2. Expected: all emotion tests pass.

### Task 2: Stable 灵山小灵 identity

**Files:**
- Modify: `数字人开源项目/Fay-main/test_lingshan_prestart_fast_path.py`
- Modify: `数字人开源项目/Fay-main/llm/nlp_cognitive_stream.py`
- Modify: `数字人开源项目/Fay-main/config.json`

- [ ] **Step 1: Write the failing backend identity test**

Add an AST-loaded helper test for `_build_lingshan_identity_prompt()` asserting that it contains `灵山小灵`, `女性`, `灵山胜境数字人导游`, and a rule forbidding self-identification as `Fay` or a generic assistant.

- [ ] **Step 2: Run the focused backend test and verify RED**

Run: `python -m unittest test_lingshan_prestart_fast_path.py`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Add and inject the identity policy**

Create `_build_lingshan_identity_prompt()` in `nlp_cognitive_stream.py` and append its returned policy after the generic agent attributes in the system prompt. The project identity must explicitly override conflicting generic configuration.

- [ ] **Step 4: Align non-sensitive runtime attributes**

Update only the `attribute` values for name, gender, job, position, goal, birth, and additional information in `config.json`; preserve `system.conf`, API keys, endpoints, and unrelated settings byte-for-byte.

- [ ] **Step 5: Run the focused backend test and verify GREEN**

Run the command from Step 2. Expected: all backend tests pass.

### Task 3: Push-to-talk contract and visitor-facing copy

**Files:**
- Modify: `demo/src/components/mobileChatUi.test.ts`
- Modify: `demo/src/components/ChatPanel.tsx`
- Modify: `demo/src/lib/voiceAsr.ts`
- Modify: `demo/src/lib/cloudAsr.ts`

- [ ] **Step 1: Write failing source-contract tests**

Assert that the chat panel starts recording on pointer down, attaches global release handlers, sends recognized final text exactly through the existing `sendMessage` path, and exposes visitor-facing copy `按住说话，松手自动发送` without the internal name `Fay`.

- [ ] **Step 2: Run the focused UI test and verify RED**

Run: `node --test --experimental-strip-types src/components/mobileChatUi.test.ts`

Expected: FAIL because current visible labels and errors still mention Fay.

- [ ] **Step 3: Apply minimal UI and error-copy changes**

Keep the MediaRecorder → `/api/asr-transcribe` → `onFinal` → `sendMessage` data flow unchanged. Replace internal implementation names in visitor-facing labels/errors with `语音识别服务` or `小灵服务`; retain actionable port/config details only in developer logs.

- [ ] **Step 4: Run the focused UI test and verify GREEN**

Run the command from Step 2. Expected: all mobile chat UI tests pass.

### Task 4: Full verification and live restart

**Files:**
- Verify all modified files above.

- [ ] **Step 1: Run all frontend tests**

Run: `node --test --experimental-strip-types src/**/*.test.ts`

Expected: zero failures.

- [ ] **Step 2: Run backend tests and production build**

Run: `python -m unittest test_lingshan_prestart_fast_path.py` and `npm run build`.

Expected: zero test failures and Vite build exit code 0.

- [ ] **Step 3: Restart Fay once**

Stop only the currently running Fay process and start one replacement instance so the new identity prompt and configuration are loaded. Confirm ports 5000 and 10003 listen.

- [ ] **Step 4: Verify the real page**

On `/guide`, send `我好痛苦` and verify worried state; send `你是谁` and verify the reply identifies as 灵山小灵 without `Fay`; confirm the microphone button shows the push-to-talk instruction and the browser console has no new ASR/audio errors.
