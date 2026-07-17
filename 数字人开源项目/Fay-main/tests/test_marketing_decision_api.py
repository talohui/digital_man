from pathlib import Path

from flask import Flask

from gui.marketing_decision_api import register_marketing_decision_api


def valid_payload():
    return {
        "summary": "模型摘要",
        "cards": [{"title": "卡片"}] * 3,
        "actionTodos": [],
        "dataSources": [],
        "demoFallback": False,
    }


def create_client(generator):
    app = Flask(__name__)
    register_marketing_decision_api(app, generator)
    return app.test_client()


def test_internal_endpoint_returns_generator_payload():
    client = create_client(lambda payload: {**valid_payload(), "received": payload["totalMessages"]})

    response = client.post(
        "/api/internal/marketing-decision",
        json={"totalMessages": 8, "topics": []},
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )

    assert response.status_code == 200
    assert response.get_json()["summary"] == "模型摘要"
    assert response.get_json()["received"] == 8


def test_internal_endpoint_accepts_ipv6_loopback():
    client = create_client(lambda _: valid_payload())
    response = client.post(
        "/api/internal/marketing-decision",
        json={},
        environ_base={"REMOTE_ADDR": "::1"},
    )
    assert response.status_code == 200


def test_internal_endpoint_rejects_non_loopback_requests():
    client = create_client(lambda _: valid_payload())
    response = client.post(
        "/api/internal/marketing-decision",
        json={},
        environ_base={"REMOTE_ADDR": "10.0.0.2"},
    )
    assert response.status_code == 403


def test_internal_endpoint_rejects_non_object_payload():
    client = create_client(lambda _: valid_payload())
    response = client.post(
        "/api/internal/marketing-decision",
        json=["invalid"],
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )
    assert response.status_code == 400


def test_internal_endpoint_hides_generator_exception_details():
    def fail(_):
        raise RuntimeError("secret provider response")

    client = create_client(fail)
    response = client.post(
        "/api/internal/marketing-decision",
        json={},
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )
    assert response.status_code == 503
    assert response.get_json() == {"message": "model decision unavailable"}
    assert "secret provider response" not in response.get_data(as_text=True)


def test_fay_flask_server_registers_internal_marketing_decision_route():
    source = (Path(__file__).parents[1] / "gui" / "flask_server.py").read_text(
        encoding="utf-8"
    )
    assert "from gui.marketing_decision_api import register_marketing_decision_api" in source
    assert "register_marketing_decision_api(" in source
