from pathlib import Path

from faymcp.emotion_context import build_emotion_context, build_lingshan_rag_params


def test_maps_baidu_negative_sentiment_to_comforting_context():
    assert build_emotion_context(0) == {
        "emotion": "anxious",
        "polarity": "negative",
        "confidence": 1.0,
        "action": {"affect": "comforting"},
    }


def test_maps_baidu_neutral_sentiment_to_neutral_context():
    assert build_emotion_context(1) == {
        "emotion": "neutral",
        "polarity": "neutral",
        "confidence": 1.0,
        "action": {"affect": "neutral"},
    }


def test_maps_baidu_positive_sentiment_to_warm_context():
    assert build_emotion_context(2) == {
        "emotion": "happy",
        "polarity": "positive",
        "confidence": 1.0,
        "action": {"affect": "warm"},
    }


def test_ignores_unknown_sentiment_values():
    assert build_emotion_context(None) is None
    assert build_emotion_context(3) is None


def test_injects_positive_context_for_lingshan_rag_only():
    params = build_lingshan_rag_params(
        "query_lingshan_rag",
        {"query": "灵山大佛在哪"},
        "灵山大佛在哪",
        lambda _: 2,
    )

    assert params["query"] == "灵山大佛在哪"
    assert params["emotion_context"]["polarity"] == "positive"
    assert params["emotion_context"]["action"]["affect"] == "warm"
    assert build_lingshan_rag_params("other_tool", {"query": "x"}, "x", lambda _: 2) == {"query": "x"}


def test_keeps_original_lingshan_params_when_analysis_fails():
    def raise_analysis_error(_):
        raise RuntimeError("baidu unavailable")

    original = {"query": "怎么去梵宫", "top_k": 5}
    assert build_lingshan_rag_params(
        "query_lingshan_rag", original, "怎么去梵宫", raise_analysis_error
    ) == original


def test_mcp_prestart_enriches_lingshan_rag_with_baidu_sentiment():
    source = (Path(__file__).parents[1] / "faymcp" / "mcp_service.py").read_text(
        encoding="utf-8"
    )

    assert "from faymcp.emotion_context import build_lingshan_rag_params" in source
    assert "baidu_emotion.get_sentiment" in source
    assert "filled_params = build_lingshan_rag_params(" in source
