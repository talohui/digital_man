from configparser import ConfigParser
import base64
import hashlib
import hmac
from pathlib import Path
import os
import re
import tempfile


SERVICE_CONFIG_FIELDS = frozenset(
    {
        "chat_module",
        "gpt_model_engine",
        "gpt_base_url",
        "gpt_api_key",
        "big_model_engine",
        "big_model_base_url",
        "big_model_api_key",
        "embedding_api_model",
        "embedding_api_base_url",
        "embedding_api_key",
        "ASR_mode",
        "ali_nls_key_id",
        "ali_nls_key_secret",
        "ali_nls_app_key",
        "tts_module",
        "ali_tss_key_id",
        "ali_tss_key_secret",
        "ali_tss_app_key",
        "ms_tts_key",
        "ms_tts_region",
        "volcano_tts_appid",
        "volcano_tts_access_token",
        "volcano_tts_cluster",
        "volcano_tts_voice_type",
        "baidu_emotion_app_id",
        "baidu_emotion_api_key",
        "baidu_emotion_secret_key",
    }
)

SENSITIVE_SERVICE_CONFIG_FIELDS = frozenset(
    {
        field
        for field in SERVICE_CONFIG_FIELDS
        if field.endswith(("_key", "_secret", "_token"))
    }
    | {"ali_nls_key_id", "ali_tss_key_id"}
)


def mask_service_secret(value):
    value = str(value or "")
    if not value:
        return ""
    return "••••" + value[-4:]


def verify_service_config_password(password, encoded_hash):
    if not isinstance(password, str) or not isinstance(encoded_hash, str):
        return False
    try:
        algorithm, n, r, p, encoded_salt, encoded_key = encoded_hash.split("$")
        if algorithm != "scrypt":
            return False
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=base64.b64decode(encoded_salt, validate=True),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(base64.b64decode(encoded_key, validate=True)),
        )
        return hmac.compare_digest(
            derived, base64.b64decode(encoded_key, validate=True)
        )
    except (ValueError, TypeError, UnicodeError):
        return False


def build_public_service_config(parser: ConfigParser):
    if not parser.has_section("key"):
        parser.add_section("key")

    public_config = {}
    for field in SERVICE_CONFIG_FIELDS:
        value = parser.get("key", field, fallback="")
        public_config[field] = (
            mask_service_secret(value)
            if field in SENSITIVE_SERVICE_CONFIG_FIELDS
            else value
        )
    return public_config


def merge_service_config(parser: ConfigParser, updates):
    if not isinstance(updates, dict):
        raise ValueError("service configuration must be an object")
    if not parser.has_section("key"):
        parser.add_section("key")

    for field, value in updates.items():
        if field not in SERVICE_CONFIG_FIELDS:
            raise ValueError(f"unsupported service configuration field: {field}")
        if value is None:
            continue
        if not isinstance(value, str):
            raise ValueError(f"service configuration field must be a string: {field}")
        if field in SENSITIVE_SERVICE_CONFIG_FIELDS and not value:
            continue
        parser.set("key", field, value)

    return parser


def read_service_config(path):
    parser = ConfigParser(interpolation=None)
    parser.read(path, encoding="utf-8")
    if not parser.has_section("key"):
        parser.add_section("key")
    return parser


def write_service_config(parser: ConfigParser, path):
    path = Path(path)
    original = path.read_text(encoding="utf-8") if path.exists() else "[key]\n"
    existing = read_service_config(path) if path.exists() else ConfigParser(interpolation=None)
    if not existing.has_section("key"):
        existing.add_section("key")

    changes = {
        field: parser.get("key", field, fallback="")
        for field in SERVICE_CONFIG_FIELDS
        if parser.get("key", field, fallback="") != existing.get("key", field, fallback="")
    }
    if not changes:
        return

    lines = original.splitlines(keepends=True)
    key_start = next(
        (index for index, line in enumerate(lines) if line.strip().lower() == "[key]"),
        None,
    )
    if key_start is None:
        lines.append("\n" if lines and not lines[-1].endswith("\n") else "")
        lines.append("[key]\n")
        key_start = len(lines) - 1

    key_end = next(
        (
            index
            for index in range(key_start + 1, len(lines))
            if re.match(r"^\s*\[[^]]+\]", lines[index])
        ),
        len(lines),
    )
    pending = dict(changes)
    for index in range(key_start + 1, key_end):
        for field, value in tuple(pending.items()):
            match = re.match(rf"^(\s*{re.escape(field)}\s*[=:]\s*)(.*?)(\r?\n)?$", lines[index])
            if match:
                lines[index] = f"{match.group(1)}{value}{match.group(3) or os.linesep}"
                pending.pop(field)
                break

    additions = [f"{field} = {value}{os.linesep}" for field, value in pending.items()]
    lines[key_end:key_end] = additions

    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        delete=False,
    ) as temporary_file:
        temporary_file.writelines(lines)
        temporary_path = temporary_file.name
    os.replace(temporary_path, path)
