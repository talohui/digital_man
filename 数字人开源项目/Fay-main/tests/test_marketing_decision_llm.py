from types import SimpleNamespace

import pytest

from utils.marketing_decision_llm import (
    ModelConfig,
    extract_decision_json,
    generate_marketing_decision,
    select_model_config,
    validate_decision_payload,
)


def valid_payload():
    return {
        "summary": "今日祈福咨询升温，建议结合实时客流承接路线转化。",
        "cards": [
            {
                "title": f"建议 {index}",
                "type": "营销机会",
                "priority": "高" if index == 0 else "中",
                "evidence": ["祈福文化问题 8 条"],
                "reason": "输入数据表明游客兴趣集中。",
                "actions": ["推送祈福静心路线"],
                "relatedTopics": ["祈福文化"],
                "relatedSpots": ["灵山大佛"],
                "demoFallback": False,
            }
            for index in range(3)
        ],
        "actionTodos": ["推送祈福静心路线"],
        "dataSources": ["热门问题 TopN"],
        "demoFallback": False,
    }


def config(**overrides):
    values = {
        "big_model_engine": "qwen-max",
        "big_model_base_url": "https://big.example/v1",
        "big_model_api_key": "big-key",
        "gpt_model_engine": "qwen-turbo",
        "gpt_base_url": "https://small.example/v1",
        "key_gpt_api_key": "small-key",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_prefers_big_model_configuration():
    assert select_model_config(config()) == ModelConfig(
        "qwen-max", "https://big.example/v1", "big-key"
    )


def test_falls_back_to_gpt_configuration_when_big_model_is_incomplete():
    selected = select_model_config(config(big_model_engine="", big_model_api_key=""))
    assert selected == ModelConfig(
        "qwen-turbo", "https://small.example/v1", "small-key"
    )


def test_extracts_valid_json_from_markdown_code_fence():
    import json

    payload = extract_decision_json("```json\n" + json.dumps(valid_payload(), ensure_ascii=False) + "\n```")
    assert payload["summary"].startswith("今日祈福咨询")


def test_rejects_unknown_priority():
    payload = valid_payload()
    payload["cards"][0]["priority"] = "紧急"
    with pytest.raises(ValueError, match="priority"):
        validate_decision_payload(payload)


def test_rejects_too_few_cards():
    payload = valid_payload()
    payload["cards"] = payload["cards"][:2]
    with pytest.raises(ValueError, match="3 to 5"):
        validate_decision_payload(payload)


def test_rejects_spot_names_not_grounded_in_decision_input():
    payload = valid_payload()
    payload["cards"][0]["actions"] = ["推送梵宫、五印坛城、祥符禅寺最近路线"]
    with pytest.raises(ValueError, match="unsupported spot"):
        validate_decision_payload(
            payload,
            {"hottestSpot": None, "topics": [{"samples": ["我好像迷路了"]}]},
        )


def test_drops_only_unsupported_action_and_keeps_grounded_card():
    payload = valid_payload()
    payload["cards"][0]["actions"] = [
        "增加我在哪快捷入口",
        "推送梵宫、五印坛城、祥符禅寺最近路线",
    ]
    payload["cards"][0]["relatedSpots"] = ["梵宫"]

    result = validate_decision_payload(
        payload,
        {"hottestSpot": None, "topics": [{"samples": ["我好像迷路了"]}]},
    )

    assert result["cards"][0]["actions"] == ["增加我在哪快捷入口"]
    assert result["cards"][0]["relatedSpots"] == []


def test_replaces_knowledge_performance_claim_when_input_has_no_hit_metrics():
    payload = valid_payload()
    payload["cards"][0]["reason"] = "无一条匹配现有知识库响应，导致零有效应答"

    result = validate_decision_payload(
        payload,
        {"hottestSpot": "灵山大佛", "topics": [{"samples": ["怎么祈福"]}]},
    )

    assert result["cards"][0]["reason"] == "同类问题重复出现，适合补充标准问答与服务入口。"


def test_generator_posts_to_openai_compatible_endpoint_without_leaking_key_into_body():
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            import json

            return {
                "choices": [
                    {"message": {"content": json.dumps(valid_payload(), ensure_ascii=False)}}
                ]
            }

    def post(url, **kwargs):
        calls.append((url, kwargs))
        return FakeResponse()

    result = generate_marketing_decision(
        {
            "totalMessages": 8,
            "hottestSpot": "灵山大佛",
            "topics": [{"topic": "祈福文化", "count": 8}],
        },
        config(),
        post=post,
    )

    assert result["cards"][0]["title"] == "建议 0"
    assert calls[0][0] == "https://big.example/v1/chat/completions"
    assert calls[0][1]["timeout"] == 20
    assert calls[0][1]["headers"]["Authorization"] == "Bearer big-key"
    assert "big-key" not in str(calls[0][1]["json"])
