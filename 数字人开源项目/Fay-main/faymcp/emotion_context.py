def build_emotion_context(sentiment):
    contexts = {
        0: {
            "emotion": "anxious",
            "polarity": "negative",
            "confidence": 1.0,
            "action": {"affect": "comforting"},
        },
        1: {
            "emotion": "neutral",
            "polarity": "neutral",
            "confidence": 1.0,
            "action": {"affect": "neutral"},
        },
        2: {
            "emotion": "happy",
            "polarity": "positive",
            "confidence": 1.0,
            "action": {"affect": "warm"},
        },
    }
    return contexts.get(sentiment)


def build_lingshan_rag_params(tool_name, params, question, analyzer):
    if tool_name != "query_lingshan_rag":
        return params

    try:
        emotion_context = build_emotion_context(analyzer(question))
    except Exception:
        return params

    if emotion_context is None:
        return params

    enriched_params = dict(params)
    enriched_params["emotion_context"] = emotion_context
    return enriched_params
