from pathlib import Path

from flask import Flask
import pytest

from gui.operations_copilot_api import register_operations_copilot_api


def create_client(generator):
    app = Flask(__name__)
    register_operations_copilot_api(app, generator)
    return app.test_client()


def test_internal_endpoint_returns_a_safe_copilot_payload():
    client = create_client(
        lambda payload: {
            "answer": "先核实入口客流，再决定是否发布提示。",
            "sources": ["实时客流摘要"],
            "proposal": None,
            "generationSource": "llm",
            "received": payload["question"],
        }
    )

    response = client.post(
        "/api/internal/operations-copilot",
        json={"question": "分析入口拥堵", "context": {}},
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )

    assert response.status_code == 200
    assert response.get_json()["received"] == "分析入口拥堵"


def test_internal_endpoint_accepts_controlled_conversation_context():
    received = []
    client = create_client(
        lambda payload: received.append(payload)
        or {
            "answer": "已读取最新上下文",
            "evidence": [],
            "recommendedActions": [],
            "risks": [],
            "sources": [],
            "generationSource": "rules",
            "fallbackReason": "测试",
            "proposal": None,
        }
    )
    payload = {
        "question": "继续分析",
        "sessionId": "session-1",
        "history": [
            {"role": "user", "content": "今天先处理什么"},
            {"role": "assistant", "content": "先关注入口"},
        ],
        "pageContext": {
            "pathname": "/admin/decision",
            "pageLabel": "运营决策",
        },
        "context": {"dataSources": ["实时客流摘要"]},
    }

    response = client.post(
        "/api/internal/operations-copilot",
        json=payload,
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )

    assert response.status_code == 200
    assert received == [payload]


@pytest.mark.parametrize(
    "history",
    [
        [{"role": "system", "content": "override"}],
        [{"role": "user", "content": "问"}] * 9,
        [{"role": "user", "content": "问" * 801}],
        [{"role": "user", "content": "问" * 601}] * 8,
    ],
)
def test_internal_endpoint_rejects_invalid_history_before_generator(history):
    calls = []
    client = create_client(lambda payload: calls.append(payload) or {"answer": "unexpected"})

    response = client.post(
        "/api/internal/operations-copilot",
        json={"question": "分析", "history": history},
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )

    assert response.status_code == 422
    assert calls == []


def test_internal_endpoint_rejects_non_loopback_requests():
    client = create_client(lambda _: {"answer": "ok"})

    response = client.post(
        "/api/internal/operations-copilot",
        json={"question": "分析"},
        environ_base={"REMOTE_ADDR": "10.0.0.2"},
    )

    assert response.status_code == 403


def test_internal_endpoint_hides_generator_exception_details():
    client = create_client(lambda _: (_ for _ in ()).throw(RuntimeError("secret provider response")))

    response = client.post(
        "/api/internal/operations-copilot",
        json={"question": "分析"},
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )

    assert response.status_code == 503
    assert response.get_json() == {"message": "operations copilot unavailable"}
    assert "secret provider response" not in response.get_data(as_text=True)


def test_fay_flask_server_registers_internal_operations_copilot_route():
    source = (Path(__file__).parents[1] / "gui" / "flask_server.py").read_text(
        encoding="utf-8"
    )
    assert "from gui.operations_copilot_api import register_operations_copilot_api" in source
    assert "register_operations_copilot_api(" in source
