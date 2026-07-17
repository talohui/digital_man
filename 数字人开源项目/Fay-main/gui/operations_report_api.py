from flask import jsonify, request


LOOPBACK_ADDRESSES = {"127.0.0.1", "::1"}


def register_operations_report_api(app, generator):
    @app.post("/api/internal/operations-report")
    def internal_operations_report():
        if request.remote_addr not in LOOPBACK_ADDRESSES:
            return jsonify({"message": "forbidden"}), 403
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"message": "invalid report input"}), 400
        try:
            return jsonify(generator(payload))
        except ValueError as error:
            return jsonify({"message": str(error)}), 422
        except Exception:
            return jsonify({"message": "operations report unavailable"}), 503

    return internal_operations_report
