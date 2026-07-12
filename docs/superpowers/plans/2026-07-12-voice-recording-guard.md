# Voice Recording Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 防止录音状态词被当成用户问题发送，并在客户端拦截过短/过小音频，避免百炼 `The audio is empty` 错误暴露给游客。

**Architecture:** 用一个纯 TypeScript 函数定义云端录音的最小时长和字节门槛，`cloudAsr.ts` 只在校验通过后上传。`ChatPanel.tsx` 将语音状态与手工输入分离，后端对供应商空音频错误做最后一层翻译。

**Tech Stack:** React, TypeScript, Node test runner, Python `unittest`, Fay Flask backend.

---

### Task 1: Lock the frontend state-separation behavior

**Files:**
- Modify: `demo/src/components/mobileChatUi.test.ts`
- Modify: `demo/src/components/ChatPanel.tsx`

- [ ] **Step 1: Add RED source-contract tests**

```ts
test('recording status never becomes sendable input', () => {
  assert.match(chatPanelSource, /onInterim:\s*\(text\)\s*=>\s*\{\s*setVoiceDraft\(text\)\s*\}/)
  assert.doesNotMatch(
    chatPanelSource,
    /onInterim:[\s\S]*?setVoiceDraft\(text\)[\s\S]*?setInputText\(text, resolvedSceneId\)/
  )
  assert.match(chatPanelSource, /if \(isRecording \|\| voiceDraft\) return/)
  assert.match(chatPanelSource, /readOnly=\{isRecording\}/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/components/mobileChatUi.test.ts`

Expected: FAIL because `onInterim` still calls `setInputText`, `handleSend` has no guard, and the textarea is not read-only.

- [ ] **Step 3: Make the minimal ChatPanel change**

```tsx
onInterim: (text) => {
  setVoiceDraft(text)
},

const handleSend = async () => {
  if (isRecording || voiceDraft) return
  shouldStickToBottomRef.current = true
  void unlockAudio()
  await sendMessage(inputText, resolvedSceneId)
}

<textarea
  readOnly={isRecording}
  ...
/>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test src/components/mobileChatUi.test.ts`

Expected: all tests PASS.

### Task 2: Reject empty cloud recordings before fetch

**Files:**
- Create: `demo/src/lib/cloudRecordingGuard.ts`
- Create: `demo/src/lib/cloudRecordingGuard.test.ts`
- Modify: `demo/src/lib/cloudAsr.ts`

- [ ] **Step 1: Add RED tests for the pure guard**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { getCloudRecordingError } from './cloudRecordingGuard.ts'

test('rejects recordings shorter than 800ms', () => {
  assert.equal(getCloudRecordingError(799, 5000), '请按住至少 1 秒再松手。')
})

test('rejects recordings without enough audio bytes', () => {
  assert.equal(getCloudRecordingError(1200, 1023), '请按住至少 1 秒再松手。')
})

test('accepts a normal short question', () => {
  assert.equal(getCloudRecordingError(1200, 4096), null)
})
```

- [ ] **Step 2: Run the guard test and verify RED**

Run: `node --test src/lib/cloudRecordingGuard.test.ts`

Expected: FAIL because `cloudRecordingGuard.ts` does not exist.

- [ ] **Step 3: Implement the pure guard**

```ts
export const MIN_CLOUD_RECORDING_MS = 800
export const MIN_CLOUD_RECORDING_BYTES = 1024

export function getCloudRecordingError(durationMs: number, totalBytes: number): string | null {
  if (durationMs < MIN_CLOUD_RECORDING_MS || totalBytes < MIN_CLOUD_RECORDING_BYTES) {
    return '请按住至少 1 秒再松手。'
  }
  return null
}
```

- [ ] **Step 4: Wire the guard into cloudAsr**

```ts
let recordingStartedAt = 0

recorder.start(250)
recordingStartedAt = Date.now()

const durationMs = recordingStartedAt ? Date.now() - recordingStartedAt : 0
const totalBytes = blobChunks.reduce((sum, chunk) => sum + chunk.size, 0)
const recordingError = getCloudRecordingError(durationMs, totalBytes)
if (recordingError) {
  opts.onError?.(recordingError)
  return
}
```

- [ ] **Step 5: Run the guard and full frontend tests**

Run: `node --test src/lib/cloudRecordingGuard.test.ts src/**/*.test.ts`

Expected: all tests PASS.

### Task 3: Translate the provider empty-audio error

**Files:**
- Modify: `数字人开源项目/Fay-main/test_ali_nls_file.py`
- Modify: `数字人开源项目/Fay-main/asr/ali_nls_file.py`

- [ ] **Step 1: Add a RED backend test**

```python
@patch.object(ali_nls_file.requests, "post")
def test_qwen_asr_translates_empty_audio_error(self, post):
    post.return_value = Mock(
        status_code=400,
        text='{"error":{"message":"The audio is empty"}}',
    )
    with self.assertRaisesRegex(ValueError, "请按住至少 1 秒") as caught:
        ali_nls_file._transcribe_with_qwen(
            b"header-only",
            "recording.webm",
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "secret",
        )
    self.assertNotIn("InternalError", str(caught.exception))
    self.assertNotIn("audio is empty", str(caught.exception).lower())
```

- [ ] **Step 2: Run the backend test and verify RED**

Run: `python -m unittest -v test_ali_nls_file.py`

Expected: FAIL because the raw provider body is still included.

- [ ] **Step 3: Add the minimal translation**

```python
if "audio is empty" in body_preview.lower():
    raise ValueError("没有录到有效语音，请按住至少 1 秒再松手")
```

Place this branch before the generic non-2xx error.

- [ ] **Step 4: Run backend regression tests**

Run: `python -m unittest -v test_ali_nls_file.py test_lingshan_prestart_fast_path.py`

Expected: all tests PASS.

### Task 4: Build, restart, and verify

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 2: Run whitespace checks**

Run: `git diff --check` for the six changed files.

Expected: exit 0 with no output.

- [ ] **Step 3: Restart Fay and verify ports**

Restart only the process listening on ports `5000/10003`. Verify both ports point to the new PID.

- [ ] **Step 4: Verify UI contracts**

Reload `/guide`; confirm the page renders. Physical microphone input remains a one-step user check: press for at least one second, release, and confirm only recognized text is sent once.
