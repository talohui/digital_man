import os
import secrets
import time

from flask import jsonify, request

from utils.service_config import (
    SENSITIVE_SERVICE_CONFIG_FIELDS,
    SERVICE_CONFIG_FIELDS,
    build_public_service_config,
    merge_service_config,
    read_service_config,
    verify_service_config_password,
    write_service_config,
)


SESSION_TTL_SECONDS = 30 * 60
REVEAL_TTL_SECONDS = 5 * 60


def register_service_config_api(app, config_path, password_hash, reload_callback):
    sessions = {}

    def require_session():
        authorization = request.headers.get("Authorization", "")
        token = authorization.removeprefix("Bearer ").strip()
        session = sessions.get(token)
        if not session or session["expires_at"] <= time.time():
            sessions.pop(token, None)
            return None
        return session

    def unavailable_response():
        return jsonify({"message": "服务配置管理员密码尚未配置"}), 503

    @app.post("/api/admin/service-config/login")
    def service_config_login():
        if not password_hash:
            return unavailable_response()
        payload = request.get_json(silent=True) or {}
        if not verify_service_config_password(payload.get("password"), password_hash):
            return jsonify({"message": "管理员密码错误"}), 401
        token = secrets.token_urlsafe(32)
        sessions[token] = {"expires_at": time.time() + SESSION_TTL_SECONDS, "reveal_until": 0}
        return jsonify({"token": token, "expiresIn": SESSION_TTL_SECONDS})

    @app.post("/api/admin/service-config/verify-session")
    def verify_service_config_session():
        if not require_session():
            return jsonify({"message": "需要服务配置管理员验证"}), 401
        response = jsonify({"verified": True})
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/api/admin/service-config")
    def get_service_config():
        if not require_session():
            return jsonify({"message": "需要服务配置管理员验证"}), 401
        return jsonify({"config": build_public_service_config(read_service_config(config_path))})

    @app.put("/api/admin/service-config")
    def update_service_config():
        if not require_session():
            return jsonify({"message": "需要服务配置管理员验证"}), 401
        updates = (request.get_json(silent=True) or {}).get("config")
        try:
            parser = read_service_config(config_path)
            merge_service_config(parser, updates)
            write_service_config(parser, config_path)
            reload_callback()
        except ValueError as error:
            return jsonify({"message": str(error)}), 400
        except Exception:
            return jsonify({"message": "保存服务配置失败"}), 500
        return jsonify(
            {"config": build_public_service_config(read_service_config(config_path)), "applied": True}
        )

    @app.post("/api/admin/service-config/reveal")
    def reveal_service_config_secret():
        if not require_session():
            return jsonify({"message": "需要服务配置管理员验证"}), 401
        payload = request.get_json(silent=True) or {}
        field = payload.get("field")
        if field not in SENSITIVE_SERVICE_CONFIG_FIELDS:
            return jsonify({"message": "该字段不可查看"}), 400
        if not password_hash:
            return unavailable_response()
        if not verify_service_config_password(payload.get("password"), password_hash):
            return jsonify({"message": "管理员密码错误"}), 401
        value = read_service_config(config_path).get("key", field, fallback="")
        response = jsonify({"field": field, "value": value, "expiresIn": REVEAL_TTL_SECONDS})
        response.headers["Cache-Control"] = "no-store"
        return response

    return {
        "service_config_fields": SERVICE_CONFIG_FIELDS,
        "sensitive_service_config_fields": SENSITIVE_SERVICE_CONFIG_FIELDS,
    }
