from types import SimpleNamespace
import json

from utils.operations_report_llm import generate_operations_report


def config():
    return SimpleNamespace(
        big_model_engine="qwen-max",
        big_model_base_url="https://big.example/v1",
        big_model_api_key="big-key",
        gpt_model_engine="qwen-turbo",
        gpt_base_url="https://small.example/v1",
        key_gpt_api_key="small-key",
    )


def report_input():
    return {
        "periodKey": "D-2026-07-13",
        "metrics": {"ticketPurchaseCount": 8, "consumptionAmount": 320.0},
        "activeEmergencies": [],
        "weather": {"weather": "晴", "temperature": 31},
        "decisionSummary": {},
        "dataSources": ["门票与消费事件", "腾讯天气"],
    }


def valid_payload():
    return {
        "subject": "灵山胜境 7 月 13 日运营简报",
        "headline": "晴天客流与消费数据已汇总，请关注现场体验。",
        "sections": {
            "客流与服务": "本周期票务数据已汇总。",
            "消费与客群": "消费数据来自门票与消费事件。",
            "风险与应急": "当前没有生效中的应急事件。",
            "下一步动作": "持续观察天气与消费变化。",
        },
        "dataSources": ["门票与消费事件", "腾讯天气"],
    }


def test_model_generates_a_grounded_structured_report():
    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": json.dumps(valid_payload(), ensure_ascii=False)}}]}

    calls = []

    def post(url, **kwargs):
        calls.append((url, kwargs))
        return FakeResponse()

    result = generate_operations_report(report_input(), config(), post=post)

    assert result["generationSource"] == "llm"
    assert result["sections"]["客流与服务"]
    assert calls[0][0] == "https://big.example/v1/chat/completions"
    assert calls[0][1]["json"]["enable_thinking"] is False
    assert "big-key" not in str(calls[0][1]["json"])


def test_unsafe_or_invalid_model_content_returns_rules_fallback():
    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            payload = valid_payload()
            payload["sections"]["下一步动作"] = "<script>alert('xss')</script>"
            return {"choices": [{"message": {"content": json.dumps(payload, ensure_ascii=False)}}]}

    result = generate_operations_report(
        report_input(), config(), post=lambda *_args, **_kwargs: FakeResponse()
    )

    assert result["generationSource"] == "rules"
    assert result["sections"]
    assert "script" not in json.dumps(result["sections"]).lower()


def test_rejects_model_sources_not_present_in_safe_input():
    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            payload = valid_payload()
            payload["dataSources"] = ["游客原始聊天记录"]
            return {"choices": [{"message": {"content": json.dumps(payload, ensure_ascii=False)}}]}

    result = generate_operations_report(
        report_input(), config(), post=lambda *_args, **_kwargs: FakeResponse()
    )

    assert result["generationSource"] == "rules"
