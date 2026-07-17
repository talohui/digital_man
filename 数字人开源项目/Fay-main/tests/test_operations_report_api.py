from pathlib import Path

from flask import Flask

from gui.operations_report_api import register_operations_report_api


def valid_payload():
    return {
        "subject": "运营简报",
        "headline": "摘要",
        "sections": {"客流与服务": "内容"},
        "dataSources": ["门票与消费事件"],
        "generationSource": "rules",
    }


def client(generator):
    app = Flask(__name__)
    register_operations_report_api(app, generator)
    return app.test_client()


def test_internal_route_is_loopback_only():
    response = client(lambda _: valid_payload()).post(
        "/api/internal/operations-report", json={}, environ_base={"REMOTE_ADDR": "10.0.0.2"}
    )
    assert response.status_code == 403


def test_internal_route_returns_structured_report_for_loopback():
    response = client(lambda payload: {**valid_payload(), "period": payload["periodKey"]}).post(
        "/api/internal/operations-report",
        json={"periodKey": "D-2026-07-13"},
        environ_base={"REMOTE_ADDR": "127.0.0.1"},
    )
    assert response.status_code == 200
    assert response.get_json()["period"] == "D-2026-07-13"


def test_internal_route_hides_provider_errors():
    response = client(lambda _: (_ for _ in ()).throw(RuntimeError("provider secret"))).post(
        "/api/internal/operations-report", json={}, environ_base={"REMOTE_ADDR": "127.0.0.1"}
    )
    assert response.status_code == 503
    assert "provider secret" not in response.get_data(as_text=True)


def test_fay_server_registers_operations_report_route():
    source = (Path(__file__).parents[1] / "gui" / "flask_server.py").read_text(encoding="utf-8")
    assert "from gui.operations_report_api import register_operations_report_api" in source
    assert "register_operations_report_api(" in source
