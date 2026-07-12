from configparser import ConfigParser
import base64
import hashlib

import pytest

from utils.service_config import (
    build_public_service_config,
    merge_service_config,
    read_service_config,
    write_service_config,
    verify_service_config_password,
)


def make_config():
    parser = ConfigParser()
    parser.add_section("key")
    parser.set("key", "gpt_model_engine", "qwen-plus")
    parser.set("key", "gpt_base_url", "https://example.invalid/v1")
    parser.set("key", "gpt_api_key", "secret-key-1234")
    parser.set("key", "ali_tss_key_id", "access-key-id-1234")
    return parser


def test_public_service_config_masks_sensitive_values():
    public = build_public_service_config(make_config())

    assert public["gpt_model_engine"] == "qwen-plus"
    assert public["gpt_api_key"] == "••••1234"
    assert public["ali_tss_key_id"] == "••••1234"
    assert "secret-key-1234" not in public.values()
    assert "access-key-id-1234" not in public.values()


def test_empty_api_key_keeps_existing_value_but_allows_other_updates():
    parser = make_config()

    merge_service_config(
        parser,
        {"gpt_model_engine": "qwen-max", "gpt_api_key": ""},
    )

    assert parser.get("key", "gpt_model_engine") == "qwen-max"
    assert parser.get("key", "gpt_api_key") == "secret-key-1234"


def test_unknown_service_config_field_is_rejected():
    with pytest.raises(ValueError, match="unsupported service configuration field"):
        merge_service_config(make_config(), {"unexpected_field": "value"})


def test_write_service_config_updates_key_section_without_overwriting_other_sections(tmp_path):
    path = tmp_path / "system.conf"
    path.write_text("[key]\ngpt_api_key = old-key\n[database]\nhost = keep-me\n", encoding="utf-8")

    parser = read_service_config(path)
    merge_service_config(parser, {"gpt_api_key": "new-key"})
    write_service_config(parser, path)

    written = path.read_text(encoding="utf-8")
    assert "gpt_api_key = new-key" in written
    assert "[database]" in written
    assert "host = keep-me" in written


def test_password_verification_uses_scrypt_hash_format():
    salt = b"test-salt-123456"
    derived = hashlib.scrypt(
        b"correct-password", salt=salt, n=16384, r=8, p=1, dklen=32
    )
    encoded = "scrypt$16384$8$1${}${}".format(
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(derived).decode("ascii"),
    )

    assert verify_service_config_password("correct-password", encoded)
    assert not verify_service_config_password("wrong-password", encoded)
    assert not verify_service_config_password("correct-password", "invalid")
