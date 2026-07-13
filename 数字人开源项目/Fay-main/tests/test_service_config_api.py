import base64
import hashlib

from flask import Flask

from gui.service_config_api import register_service_config_api


def password_hash(password):
    salt = b"service-config-test-salt"
    derived = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    return "scrypt$16384$8$1${}${}".format(
        base64.b64encode(salt).decode(), base64.b64encode(derived).decode()
    )


def create_client(tmp_path):
    config_path = tmp_path / "system.conf"
    config_path.write_text("[key]\ngpt_api_key = secret-key-1234\ngpt_model_engine = qwen-plus\n", encoding="utf-8")
    app = Flask(__name__)
    reload_calls = []
    register_service_config_api(
        app,
        config_path=config_path,
        password_hash=password_hash("correct-password"),
        reload_callback=lambda: reload_calls.append("reloaded"),
    )
    return app.test_client(), config_path, reload_calls


def login(client):
    response = client.post("/api/admin/service-config/login", json={"password": "correct-password"})
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


def test_config_endpoint_requires_a_server_side_session_and_masks_keys(tmp_path):
    client, _, _ = create_client(tmp_path)

    assert client.get("/api/admin/service-config").status_code == 401

    response = client.get(
        "/api/admin/service-config", headers=login(client)
    )

    assert response.status_code == 200
    assert response.get_json()["config"]["gpt_api_key"] == "••••1234"


def test_config_update_preserves_empty_key_and_hot_reloads(tmp_path):
    client, config_path, reload_calls = create_client(tmp_path)

    response = client.put(
        "/api/admin/service-config",
        headers=login(client),
        json={"config": {"gpt_model_engine": "qwen-max", "gpt_api_key": ""}},
    )

    assert response.status_code == 200
    assert "gpt_model_engine = qwen-max" in config_path.read_text(encoding="utf-8")
    assert "gpt_api_key = secret-key-1234" in config_path.read_text(encoding="utf-8")
    assert reload_calls == ["reloaded"]


def test_secret_reveal_requires_password_reconfirmation_and_disables_caching(tmp_path):
    client, _, _ = create_client(tmp_path)
    headers = login(client)

    denied = client.post(
        "/api/admin/service-config/reveal",
        headers=headers,
        json={"field": "gpt_api_key", "password": "wrong-password"},
    )
    allowed = client.post(
        "/api/admin/service-config/reveal",
        headers=headers,
        json={"field": "gpt_api_key", "password": "correct-password"},
    )

    assert denied.status_code == 401
    assert allowed.status_code == 200
    assert allowed.get_json()["value"] == "secret-key-1234"
    assert allowed.headers["Cache-Control"] == "no-store"
