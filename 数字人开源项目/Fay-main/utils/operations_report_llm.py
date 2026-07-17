import json
import re

import requests

from utils.marketing_decision_llm import extract_decision_json, select_model_config


MODEL_TIMEOUT_SECONDS = 20
SECTION_NAMES = ("客流与服务", "消费与客群", "风险与应急", "下一步动作")
HTML_PATTERN = re.compile(r"[<>]")
NUMBER_PATTERN = re.compile(r"\d+(?:\.\d+)?")


def _text(value, maximum=600):
    return value.strip()[:maximum] if isinstance(value, str) else ""


def _string_list(value, maximum=8, item_maximum=80):
    if not isinstance(value, list):
        return []
    return [_text(item, item_maximum) for item in value if _text(item, item_maximum)][:maximum]


def fallback_operations_report(report_input, reason="模型结果格式不合格"):
    metrics = report_input.get("metrics") if isinstance(report_input, dict) else {}
    metrics = metrics if isinstance(metrics, dict) else {}
    emergencies = report_input.get("activeEmergencies") if isinstance(report_input, dict) else []
    emergency_count = len(emergencies) if isinstance(emergencies, list) else 0
    sections = {
        "客流与服务": "本周期游客问答、路线点击与服务响应数据已完成汇总，请结合现场情况持续观察。",
        "消费与客群": "门票与消费事件已纳入本次汇总，请关注消费类别与游客偏好的变化趋势。",
        "风险与应急": (
            "当前存在 %d 条生效中的应急事件，请以管理员发布的官方处置指引为准。" % emergency_count
            if emergency_count
            else "当前没有生效中的应急事件。"
        ),
        "下一步动作": "优先核验游客提醒、路线限制和高频问题的处置状态，再根据下一周期数据调整运营动作。",
    }
    return {
        "subject": "灵山胜境运营简报 " + _text(report_input.get("periodKey"), 64),
        "headline": "基于已完成周期的真实运营汇总生成。",
        "sections": sections,
        "dataSources": _string_list(report_input.get("dataSources"), 10),
        "generationSource": "rules",
        "fallbackReason": _text(reason, 120),
    }


def _contains_html(value):
    if isinstance(value, str):
        return bool(HTML_PATTERN.search(value))
    if isinstance(value, dict):
        return any(_contains_html(item) for item in value.values())
    if isinstance(value, list):
        return any(_contains_html(item) for item in value)
    return False


def _numbers_are_grounded(payload, report_input):
    allowed = {
        float(value)
        for value in NUMBER_PATTERN.findall(json.dumps(report_input, ensure_ascii=False))
    }
    used = {
        float(value)
        for value in NUMBER_PATTERN.findall(json.dumps(payload, ensure_ascii=False))
    }
    return used.issubset(allowed)


def validate_operations_report_payload(payload, report_input):
    if not isinstance(payload, dict):
        raise ValueError("report must be an object")
    subject = _text(payload.get("subject"), 180)
    headline = _text(payload.get("headline"), 360)
    sections = payload.get("sections")
    if not subject or not headline or not isinstance(sections, dict):
        raise ValueError("report fields are required")
    if set(sections) != set(SECTION_NAMES):
        raise ValueError("report sections are invalid")
    normalized_sections = {name: _text(sections.get(name), 900) for name in SECTION_NAMES}
    if any(not value for value in normalized_sections.values()):
        raise ValueError("report section is required")
    sources = _string_list(payload.get("dataSources"), 10)
    allowed_sources = set(_string_list(report_input.get("dataSources"), 10))
    if not sources or not set(sources).issubset(allowed_sources):
        raise ValueError("report sources are not grounded")
    normalized = {
        "subject": subject,
        "headline": headline,
        "sections": normalized_sections,
        "dataSources": sources,
        "generationSource": "llm",
        "fallbackReason": None,
    }
    if _contains_html(normalized):
        raise ValueError("report must not contain HTML")
    if not _numbers_are_grounded(normalized, report_input):
        raise ValueError("report contains ungrounded metrics")
    return normalized


def build_messages(report_input):
    schema = {
        "subject": "邮件主题",
        "headline": "一行运营摘要",
        "sections": {name: "一段可执行说明" for name in SECTION_NAMES},
        "dataSources": ["必须从输入 dataSources 原样选择"],
    }
    return [
        {
            "role": "system",
            "content": (
                "你是灵山胜境运营报告撰写助手。只使用输入的聚合运营数据，生成中文日报或周报。"
                "严禁输出 HTML、原始游客文本、游客身份信息、联系方式、订单明细，严禁虚构人数、金额、比例、景点、天气或应急事实。"
                "医疗或走失相关内容只能提示采用输入中管理员已发布的官方指引，不得提供救援指令。"
                "输出必须是 JSON 对象，且包含恰好四个段落：客流与服务、消费与客群、风险与应急、下一步动作。"
                "dataSources 只能逐字选择输入 dataSources。不要输出 Markdown。结构："
                + json.dumps(schema, ensure_ascii=False)
            ),
        },
        {
            "role": "user",
            "content": "安全运营汇总：" + json.dumps(report_input, ensure_ascii=False, separators=(",", ":")),
        },
    ]


def generate_operations_report(report_input, config, post=requests.post):
    if not isinstance(report_input, dict):
        raise ValueError("report input must be an object")
    try:
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
                "enable_thinking": False,
                "response_format": {"type": "json_object"},
                "messages": build_messages(report_input),
            },
            timeout=MODEL_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return validate_operations_report_payload(extract_decision_json(content), report_input)
    except Exception as error:
        return fallback_operations_report(report_input, error.__class__.__name__)
