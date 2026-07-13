from dataclasses import dataclass
import json
import re

import requests


ALLOWED_PRIORITIES = {"高", "中", "低"}
MODEL_TIMEOUT_SECONDS = 20
KNOWN_SPOTS = {
    "灵山大佛",
    "梵宫",
    "九龙灌浴",
    "佛手广场",
    "百子戏弥勒",
    "祥符禅寺",
    "五印坛城",
    "佛前广场",
    "景区入口",
    "停车场",
}
KNOWLEDGE_PERFORMANCE_TERMS = (
    "知识库命中",
    "知识库响应",
    "未命中",
    "有效应答",
    "命中率",
)
CARD_FIELDS = (
    "title",
    "type",
    "priority",
    "evidence",
    "reason",
    "actions",
    "relatedTopics",
    "relatedSpots",
)


@dataclass(frozen=True)
class ModelConfig:
    model: str
    base_url: str
    api_key: str


def _text(value):
    return value.strip() if isinstance(value, str) else ""


def select_model_config(config):
    big = ModelConfig(
        _text(getattr(config, "big_model_engine", "")),
        _text(getattr(config, "big_model_base_url", ""))
        or _text(getattr(config, "gpt_base_url", "")),
        _text(getattr(config, "big_model_api_key", ""))
        or _text(getattr(config, "key_gpt_api_key", "")),
    )
    if big.model and big.base_url and big.api_key:
        return big

    small = ModelConfig(
        _text(getattr(config, "gpt_model_engine", "")),
        _text(getattr(config, "gpt_base_url", "")),
        _text(getattr(config, "key_gpt_api_key", "")),
    )
    if small.model and small.base_url and small.api_key:
        return small
    raise ValueError("marketing decision model is not configured")


def extract_decision_json(text):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("model returned empty decision content")
    candidate = text.strip()
    fence = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", candidate, re.DOTALL | re.IGNORECASE)
    if fence:
        candidate = fence.group(1).strip()
    if not candidate.startswith("{"):
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("model decision is not valid JSON")
        candidate = candidate[start : end + 1]
    try:
        payload = json.loads(candidate)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError("model decision is not valid JSON") from error
    if not isinstance(payload, dict):
        raise ValueError("model decision must be a JSON object")
    return payload


def _required_text(value, field, max_length):
    text = _text(value)
    if not text:
        raise ValueError(f"decision field is required: {field}")
    return text[:max_length]


def _text_list(value, field, minimum=0, maximum=5, item_length=160):
    if not isinstance(value, list):
        raise ValueError(f"decision field must be a list: {field}")
    items = [_text(item)[:item_length] for item in value if _text(item)]
    if len(items) < minimum:
        raise ValueError(f"decision field has too few items: {field}")
    return items[:maximum]


def validate_decision_payload(payload, decision_input=None):
    if not isinstance(payload, dict):
        raise ValueError("model decision must be an object")
    summary = _required_text(payload.get("summary"), "summary", 400)
    cards = payload.get("cards")
    if not isinstance(cards, list) or not 3 <= len(cards) <= 5:
        raise ValueError("decision cards must contain 3 to 5 items")

    normalized_cards = []
    for index, raw in enumerate(cards):
        if not isinstance(raw, dict):
            raise ValueError(f"decision card must be an object: {index}")
        priority = _required_text(raw.get("priority"), "priority", 2)
        if priority not in ALLOWED_PRIORITIES:
            raise ValueError("decision priority must be 高, 中 or 低")
        normalized_cards.append(
            {
                "title": _required_text(raw.get("title"), "title", 80),
                "type": _required_text(raw.get("type"), "type", 30),
                "priority": priority,
                "evidence": _text_list(raw.get("evidence"), "evidence", 1, 3),
                "reason": _required_text(raw.get("reason"), "reason", 280),
                "actions": _text_list(raw.get("actions"), "actions", 1, 3),
                "relatedTopics": _text_list(raw.get("relatedTopics", []), "relatedTopics", 0, 3, 40),
                "relatedSpots": _text_list(raw.get("relatedSpots", []), "relatedSpots", 0, 4, 40),
                "demoFallback": False,
            }
        )

    normalized = {
        "summary": summary,
        "cards": normalized_cards,
        "actionTodos": _text_list(payload.get("actionTodos", []), "actionTodos", 0, 6),
        "dataSources": _text_list(payload.get("dataSources", []), "dataSources", 0, 10, 60),
        "demoFallback": False,
    }
    if isinstance(decision_input, dict):
        input_text = json.dumps(decision_input, ensure_ascii=False)
        has_knowledge_metrics = any(
            key in decision_input
            for key in ("knowledgeHitRate", "ragHitRate", "knowledgeMissCount")
        )

        def has_unsupported_spot(text):
            return any(spot in text and spot not in input_text for spot in KNOWN_SPOTS)

        if has_unsupported_spot(normalized["summary"]):
            raise ValueError("model decision contains unsupported spot references")
        if not has_knowledge_metrics and any(
            term in normalized["summary"] for term in KNOWLEDGE_PERFORMANCE_TERMS
        ):
            raise ValueError("model decision contains unsupported knowledge metrics")
        for card in normalized["cards"]:
            grounded_fields = [card["title"], card["reason"], *card["evidence"]]
            if any(has_unsupported_spot(value) for value in grounded_fields):
                raise ValueError("model decision contains unsupported spot references")
            if not has_knowledge_metrics:
                card["evidence"] = [
                    value
                    for value in card["evidence"]
                    if not any(term in value for term in KNOWLEDGE_PERFORMANCE_TERMS)
                ]
                if any(term in card["reason"] for term in KNOWLEDGE_PERFORMANCE_TERMS):
                    card["reason"] = "同类问题重复出现，适合补充标准问答与服务入口。"
                if not card["evidence"]:
                    raise ValueError("model decision contains unsupported knowledge metrics")
            card["actions"] = [
                action for action in card["actions"] if not has_unsupported_spot(action)
            ]
            card["relatedSpots"] = [
                spot for spot in card["relatedSpots"] if not has_unsupported_spot(spot)
            ]
            if not card["actions"]:
                raise ValueError("model decision contains unsupported spot references")
        normalized["actionTodos"] = [
            action
            for action in normalized["actionTodos"]
            if not has_unsupported_spot(action)
        ]
    return normalized


def build_messages(decision_input):
    schema = {
        "summary": "运营摘要",
        "cards": [
            {
                "title": "决策标题",
                "type": "营销机会/服务优化/客流分流/知识库补全/技术优化/客群营销/消费转化",
                "priority": "高/中/低",
                "evidence": ["只能引用输入中的证据"],
                "reason": "原因",
                "actions": ["可执行动作"],
                "relatedTopics": ["主题"],
                "relatedSpots": ["景点"],
                "demoFallback": False,
            }
        ],
        "actionTodos": ["按优先级汇总的动作"],
        "dataSources": ["实际使用的数据来源"],
        "demoFallback": False,
    }
    return [
        {
            "role": "system",
            "content": (
                "你是灵山胜境的运营决策分析师。只根据输入数据生成 3 到 5 张 Next Best Action 卡片。"
                "禁止虚构人数、金额、比例、热区、活动或景点事实；任何量化证据必须逐字来自输入。"
                "景点名称只能使用输入数据中已经出现的名称；输入没有景点时不得列举景点或声称某处最近。"
                "输入未提供知识库命中指标，不得声称知识库未命中、命中率、有效应答数量或零应答。"
                "建议必须具体、可执行。只输出 JSON 对象，不要 Markdown。输出结构："
                + json.dumps(schema, ensure_ascii=False)
            ),
        },
        {
            "role": "user",
            "content": "运营数据：" + json.dumps(decision_input, ensure_ascii=False, separators=(",", ":")),
        },
    ]


def generate_marketing_decision(decision_input, config, post=requests.post):
    if not isinstance(decision_input, dict):
        raise ValueError("decision input must be an object")
    selected = select_model_config(config)
    response = post(
        selected.base_url.rstrip("/") + "/chat/completions",
        headers={
            "Authorization": f"Bearer {selected.api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": selected.model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": build_messages(decision_input),
        },
        timeout=MODEL_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    try:
        content = response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise ValueError("model response is missing decision content") from error
    return validate_decision_payload(extract_decision_json(content), decision_input)
