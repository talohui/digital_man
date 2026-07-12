import base64
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


MODULE_PATH = (
    Path(__file__).resolve().parent / "asr" / "ali_nls_file.py"
)
fake_ali_nls = types.SimpleNamespace(get_nls_token=Mock(return_value="token"))
fake_cfg = types.SimpleNamespace(
    key_ali_nls_key_id=None,
    key_ali_nls_key_secret=None,
    key_ali_nls_app_key=None,
    key_gpt_api_key=None,
    gpt_base_url=None,
)
fake_util = types.SimpleNamespace(log=Mock())
module_spec = importlib.util.spec_from_file_location("test_target_ali_nls_file", MODULE_PATH)
ali_nls_file = importlib.util.module_from_spec(module_spec)
with patch.dict(
    sys.modules,
    {
        "asr.ali_nls": fake_ali_nls,
        "utils.config_util": fake_cfg,
        "utils.util": fake_util,
    },
):
    module_spec.loader.exec_module(ali_nls_file)


class QwenAsrFallbackTest(unittest.TestCase):
    @patch.object(ali_nls_file.requests, "post")
    def test_qwen_asr_uses_existing_bailian_config(self, post):
        response = Mock(status_code=200, text="ok")
        response.json.return_value = {
            "choices": [{"message": {"content": "你好，灵山。"}}]
        }
        post.return_value = response

        text = ali_nls_file._transcribe_with_qwen(
            b"audio",
            "recording.webm",
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "secret",
        )

        self.assertEqual(text, "你好，灵山。")
        request = post.call_args
        self.assertEqual(
            request.args[0],
            "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        )
        self.assertEqual(request.kwargs["headers"]["Authorization"], "Bearer secret")
        payload = request.kwargs["json"]
        self.assertEqual(payload["model"], "qwen3-asr-flash")
        self.assertEqual(payload["asr_options"], {"language": "zh", "enable_itn": True})
        data = payload["messages"][0]["content"][0]["input_audio"]["data"]
        self.assertEqual(
            data,
            "data:audio/webm;base64," + base64.b64encode(b"audio").decode(),
        )

    @patch.object(ali_nls_file, "_transcribe_with_qwen", return_value="你好", create=True)
    @patch.object(ali_nls_file.cfg, "key_gpt_api_key", "secret")
    @patch.object(
        ali_nls_file.cfg,
        "gpt_base_url",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    @patch.object(ali_nls_file.cfg, "key_ali_nls_key_id", None)
    @patch.object(ali_nls_file.cfg, "key_ali_nls_key_secret", None)
    @patch.object(ali_nls_file.cfg, "key_ali_nls_app_key", None)
    def test_missing_nls_credentials_fall_back_to_qwen(self, qwen):
        text = ali_nls_file.transcribe_uploaded_file(b"audio", "recording.webm")

        self.assertEqual(text, "你好")
        qwen.assert_called_once_with(
            b"audio",
            "recording.webm",
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "secret",
        )

    @patch.object(ali_nls_file.requests, "post")
    def test_qwen_asr_reports_http_error_without_exposing_key(self, post):
        post.return_value = Mock(status_code=401, text="invalid credentials")

        with self.assertRaisesRegex(ValueError, "HTTP 401") as caught:
            ali_nls_file._transcribe_with_qwen(
                b"audio",
                "recording.webm",
                "https://dashscope.aliyuncs.com/compatible-mode/v1",
                "top-secret",
            )

        self.assertNotIn("top-secret", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
