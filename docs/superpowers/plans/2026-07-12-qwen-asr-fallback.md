# Qwen ASR Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让导览页手机录音在未配置阿里 NLS 时自动复用现有百炼 Key，通过 `qwen3-asr-flash` 返回识别文本。

**Architecture:** 保留 `/api/asr-transcribe` 和 `transcribe_uploaded_file` 现有边界。在 `ali_nls_file.py` 内增加可单测的 Qwen-ASR 请求函数，NLS 凭据完整时用原路径，否则用百炼 OpenAI 兼容接口。

**Tech Stack:** Python 3, `requests`, `unittest`, Fay Flask backend, Alibaba Cloud Model Studio `qwen3-asr-flash`.

---

### Task 1: 锁定 Qwen-ASR 降级行为

**Files:**
- Create: `数字人开源项目/Fay-main/test_ali_nls_file.py`
- Test: `数字人开源项目/Fay-main/test_ali_nls_file.py`

- [ ] **Step 1: Write the failing tests**

```python
import base64
import unittest
from unittest.mock import Mock, patch

from asr import ali_nls_file


class QwenAsrFallbackTest(unittest.TestCase):
    @patch.object(ali_nls_file.requests, "post")
    def test_qwen_asr_uses_existing_bailian_config(self, post):
        post.return_value = Mock(
            status_code=200,
            text='{"choices":[{"message":{"content":"\u4f60\u597d\uff0c\u7075\u5c71\u3002"}}]}',
        )
        post.return_value.json.return_value = {
            "choices": [{"message": {"content": "\u4f60\u597d\uff0c\u7075\u5c71\u3002"}}]
        }

        text = ali_nls_file._transcribe_with_qwen(
            b"audio", "recording.webm", "https://dashscope.aliyuncs.com/compatible-mode/v1", "secret"
        )

        self.assertEqual(text, "\u4f60\u597d\uff0c\u7075\u5c71\u3002")
        request = post.call_args
        self.assertEqual(request.args[0], "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
        self.assertEqual(request.kwargs["headers"]["Authorization"], "Bearer secret")
        data = request.kwargs["json"]["messages"][0]["content"][0]["input_audio"]["data"]
        self.assertEqual(data, "data:audio/webm;base64," + base64.b64encode(b"audio").decode())

    @patch.object(ali_nls_file, "_transcribe_with_qwen", return_value="\u4f60\u597d")
    @patch.object(ali_nls_file.cfg, "key_gpt_api_key", "secret")
    @patch.object(ali_nls_file.cfg, "gpt_base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    @patch.object(ali_nls_file.cfg, "key_ali_nls_app_key", None)
    def test_missing_nls_credentials_fall_back_to_qwen(self, qwen):
        self.assertEqual(ali_nls_file.transcribe_uploaded_file(b"audio", "recording.webm"), "\u4f60\u597d")
        qwen.assert_called_once()
```

- [ ] **Step 2: Run tests and verify RED**

Run: `python -m unittest -v test_ali_nls_file.py`

Expected: FAIL because `_transcribe_with_qwen` does not exist and the current function raises `未配置 ali_nls_app_key`.

### Task 2: Implement the minimal fallback

**Files:**
- Modify: `数字人开源项目/Fay-main/asr/ali_nls_file.py`
- Test: `数字人开源项目/Fay-main/test_ali_nls_file.py`

- [ ] **Step 1: Add Qwen request and response parsing**

```python
def _transcribe_with_qwen(audio_bytes, filename, base_url, api_key):
    mime = _mime_type(filename)
    data_uri = f"data:{mime};base64,{base64.b64encode(audio_bytes).decode('ascii')}"
    response = requests.post(
        f"{base_url.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": "qwen3-asr-flash",
            "messages": [{
                "role": "user",
                "content": [{"type": "input_audio", "input_audio": {"data": data_uri}}],
            }],
            "stream": False,
            "asr_options": {"language": "zh", "enable_itn": True},
        },
        timeout=45,
    )
    if response.status_code < 200 or response.status_code >= 300:
        raise ValueError(f"百炼语音识别 HTTP {response.status_code}: {(response.text or '')[:500]}")
    payload = response.json()
    text = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not isinstance(text, str) or not text.strip():
        raise ValueError("百炼语音识别未返回有效文本")
    return text.strip()
```

- [ ] **Step 2: Select backend by complete credentials**

In `transcribe_uploaded_file`, use the existing NLS path only when all three NLS values are present. Otherwise call `_transcribe_with_qwen` when `gpt_api_key` and `gpt_base_url` exist; if neither backend is configured, raise a clear configuration error.

```python
has_nls = all((cfg.key_ali_nls_key_id, cfg.key_ali_nls_key_secret, cfg.key_ali_nls_app_key))
if not has_nls:
    if cfg.key_gpt_api_key and cfg.gpt_base_url:
        return _transcribe_with_qwen(
            audio_bytes, filename, cfg.gpt_base_url, cfg.key_gpt_api_key
        )
    raise ValueError("未配置可用的语音识别服务")
```

- [ ] **Step 3: Run focused tests and verify GREEN**

Run: `python -m unittest -v test_ali_nls_file.py`

Expected: all Qwen fallback tests PASS.

- [ ] **Step 4: Run backend regression tests**

Run: `python -m unittest -v test_ali_nls_file.py test_lingshan_prestart_fast_path.py`

Expected: all tests PASS.

### Task 3: Restart and verify the live route

**Files:**
- No source changes expected.

- [ ] **Step 1: Restart Fay**

Stop only the current Fay process listening on ports `5000` and `10003`, then start the same worktree's `main.py start`.

- [ ] **Step 2: Verify ports and route error semantics**

Run `lsof` for ports `5000` and `10003`; both must point to the new Fay PID. Submit a deterministic small audio fixture to `/api/asr-transcribe` and verify the response no longer contains `未配置 ali_nls_app_key`.

- [ ] **Step 3: Verify real audio through the guide page**

Use the existing `/guide` page, hold the microphone, speak a short Chinese question, release, and verify that recognized text is sent once and receives one assistant answer. If browser automation cannot supply physical microphone audio, leave the page ready and report the exact one-step manual check while retaining the successful API-level audio verification.

- [ ] **Step 4: Final regression evidence**

Run backend tests again, `git diff --check` on the two changed Python files, and report exact pass counts and any remaining limitation.
