from pathlib import Path

from llm.lingshan_weather_context import (
    WeatherContextProvider,
    WeatherNoticeRegistry,
    build_weather_context,
)


RAIN_PAYLOAD = {
    "weather": "小雨",
    "temperature": 22,
    "humidity": 90,
    "windDirection": "东风",
    "windPower": "4级",
    "updateTime": "2026-07-14 10:00",
    "source": "tencent",
    "strategy": "indoor-preferred",
    "routeAdvice": "降水天气，优先推荐室内停留更多的路线",
    "weatherRiskKey": "wet-surface",
    "safetyNotice": "当前可能有降水，台阶和石板路较湿滑，行走时请放慢脚步并留意脚下。",
}


def test_formats_sanitized_weather_context_and_notice():
    context = build_weather_context(RAIN_PAYLOAD)

    assert context is not None
    assert "小雨" in context.prompt_text
    assert "更新于 2026-07-14 10:00" in context.prompt_text
    assert context.risk_key == "wet-surface"
    assert context.safety_notice == RAIN_PAYLOAD["safetyNotice"]


def test_same_visitor_and_risk_is_not_notified_twice_but_risk_change_is():
    registry = WeatherNoticeRegistry()

    assert registry.notice_for("visitor-1", "wet-surface", "防滑提醒") == "防滑提醒"
    assert registry.notice_for("visitor-1", "wet-surface", "防滑提醒") is None
    assert registry.notice_for("visitor-1", "heat", "补水提醒") == "补水提醒"


def test_normal_weather_never_generates_proactive_notice():
    registry = WeatherNoticeRegistry()

    assert registry.notice_for("visitor-1", "wet-surface", "防滑提醒") == "防滑提醒"
    assert registry.notice_for("visitor-1", "normal", None) is None
    assert registry.notice_for("visitor-1", "wet-surface", "防滑提醒") == "防滑提醒"


def test_provider_caches_successful_weather_for_two_minutes():
    calls = []
    provider = WeatherContextProvider(
        fetch_json=lambda timeout: calls.append(timeout) or RAIN_PAYLOAD,
        now=lambda: 100.0,
    )

    first = provider.get_weather_context()
    second = provider.get_weather_context()

    assert first is not None
    assert second == first
    assert calls == [0.8]


def test_provider_drops_malformed_or_failed_payloads():
    assert build_weather_context({"weather": "小雨"}) is None
    provider = WeatherContextProvider(
        fetch_json=lambda timeout: (_ for _ in ()).throw(RuntimeError("offline")),
        now=lambda: 100.0,
    )

    assert provider.get_weather_context() is None


def test_question_pipeline_uses_trusted_weather_context_and_fixed_notice():
    source = (Path(__file__).parents[1] / "llm" / "nlp_cognitive_stream.py").read_text(
        encoding="utf-8"
    )

    assert "from llm.lingshan_weather_context import get_weather_context, weather_notice_registry" in source
    assert "weather_context = get_weather_context()" in source
    assert "**实时天气导览上下文**" in source
    assert "weather_notice = weather_notice_registry.notice_for(" in source
    assert "write_sentence(weather_notice, force_first=is_first_sentence)" in source
