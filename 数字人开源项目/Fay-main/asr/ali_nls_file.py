# -*- coding: utf-8 -*-
"""浏览器上传短音频 → 阿里云 NLS 一句话识别（REST）。"""

import io
import json

import requests
from pydub import AudioSegment

from asr import ali_nls
from utils import config_util as cfg
from utils import util

_ASR_URL = "https://nls-gateway-cn-shenzhen.aliyuncs.com/stream/v1/asr"


def _guess_format(filename: str):
    if not filename or "." not in filename:
        return None
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext in ("webm", "wav", "mp3", "ogg", "m4a", "aac"):
        return ext
    return None


def _to_pcm16k_mono(audio_bytes: bytes, filename: str = "audio.webm") -> bytes:
    fmt = _guess_format(filename)
    try:
        seg = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
    except Exception as e:
        err = str(e).lower()
        if "ffmpeg" in err or "avconv" in err or "decoder" in err:
            raise ValueError(
                "无法解码上传音频：请安装 ffmpeg 并加入系统 PATH（Windows 可 choco install ffmpeg）"
            ) from e
        raise ValueError(f"音频解码失败: {e}") from e
    seg = seg.set_frame_rate(16000).set_channels(1).set_sample_width(2)
    return seg.raw_data


def transcribe_uploaded_file(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    if not audio_bytes:
        raise ValueError("音频为空")
    if not cfg.key_ali_nls_app_key:
        raise ValueError("未配置 ali_nls_app_key，请在 system.conf 中填写阿里云 NLS 凭据")

    token = ali_nls.get_nls_token()
    if not token:
        raise ValueError("AliNLS token 获取失败，请检查 key 配置并查看 Fay 日志")

    pcm = _to_pcm16k_mono(audio_bytes, filename)
    params = {
        "appkey": cfg.key_ali_nls_app_key,
        "format": "pcm",
        "sample_rate": 16000,
        "enable_punctuation_prediction": "true",
        "enable_inverse_text_normalization": "true",
    }
    headers = {
        "X-NLS-Token": token,
        "Content-Type": "application/octet-stream",
    }
    resp = requests.post(
        _ASR_URL,
        params=params,
        headers=headers,
        data=pcm,
        timeout=45,
    )
    body_preview = (resp.text or "")[:500]
    if resp.status_code != 200:
        util.log(2, f"AliNLS REST ASR HTTP {resp.status_code}: {body_preview}")
        raise ValueError(f"阿里云识别 HTTP {resp.status_code}: {body_preview or '无响应体'}")

    try:
        payload = resp.json()
    except json.JSONDecodeError as e:
        util.log(2, f"AliNLS REST 非 JSON: {body_preview}")
        raise ValueError("语音识别返回非 JSON") from e

    status = payload.get("status")
    if status is not None and status != 20000000:
        msg = payload.get("message") or payload.get("result") or body_preview
        util.log(2, f"AliNLS REST status={status}: {msg}")
        raise ValueError(f"阿里云识别失败: {msg}")

    text = (payload.get("result") or "").strip()
    if not text:
        msg = payload.get("message") or "未识别到有效文本"
        raise ValueError(str(msg))
    return text
