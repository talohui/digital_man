from flask import jsonify, request

from utils.operations_copilot_llm import normalize_operations_copilot_input


LOOPBACK_ADDRESSES = {"127.0.0.1", "::1"}


def register_operations_copilot_api(app, generator):
    @app.post("/api/internal/operations-copilot")
    def internal_operations_copilot():
        if request.remote_addr not in LOOPBACK_ADDRESSES:
            return jsonify({"message": "forbidden"}), 403
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"message": "invalid operations copilot input"}), 400
        try:
            return jsonify(generator(normalize_operations_copilot_input(payload)))
        except ValueError as error:
            return jsonify({"message": str(error)}), 422
        except Exception:
            return jsonify({"message": "operations copilot unavailable"}), 503

    return internal_operations_copilot
