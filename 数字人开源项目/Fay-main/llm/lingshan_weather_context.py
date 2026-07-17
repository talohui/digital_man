"""Trusted, cached weather context for the Lingshan visitor guide."""

from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass
from typing import Any, Callable, Mapping, Optional

import requests


_CACHE_TTL_SECONDS = 120.0
_REQUEST_TIMEOUT_SECONDS = 0.8
_NORMAL_RISK_KEY = "normal"


@dataclass(frozen=True)
class WeatherContext:
    prompt_text: str
    risk_key: str
    safety_notice: Optional[str]


def build_weather_context(payload: Mapping[str, Any]) -> Optional[WeatherContext]:
    weather = _text(payload.get("weather"))
    wind_direction = _text(payload.get("windDirection"))
    wind_power = _text(payload.get("windPower"))
    update_time = _text(payload.get("updateTime"))
    temperature = _number(payload.get("temperature"))
    humidity = _number(payload.get("humidity"))
    if not weather or not wind_direction or not wind_power or not update_time:
        return None
    if temperature is None or humidity is None:
        return None

    route_advice = _text(payload.get("routeAdvice"))
    risk_key = _text(payload.get("weatherRiskKey")) or _NORMAL_RISK_KEY
    safety_notice = _text(payload.get("safetyNotice")) or None
    prompt_parts = [
        f"当前灵山天气：{weather}，{_display_number(temperature)}℃，湿度 {_display_number(humidity)}%，"
        f"{wind_direction}{wind_power}，更新于 {update_time}。"
    ]
    if route_advice:
        prompt_parts.append(f"路线建议：{route_advice}。")
    if safety_notice:
        prompt_parts.append(f"安全规则提示：{safety_notice}")
    prompt_parts.append("天气事实仅以本上下文为准；没有本上下文时不得声称掌握实时天气。")
    return WeatherContext("\n".join(prompt_parts), risk_key, safety_notice)


class WeatherNoticeRegistry:
    """Records the latest risk state per visitor for one Fay process lifetime."""

    def __init__(self) -> None:
        self._last_risk_by_user: dict[str, str] = {}
        self._lock = threading.Lock()

    def notice_for(self, username: str, risk_key: str, safety_notice: Optional[str]) -> Optional[str]:
        user_key = _text(username)
        if not user_key:
            return None
        if not risk_key or risk_key == _NORMAL_RISK_KEY or not safety_notice:
            with self._lock:
                self._last_risk_by_user.pop(user_key, None)
            return None

        with self._lock:
            if self._last_risk_by_user.get(user_key) == risk_key:
                return None
            self._last_risk_by_user[user_key] = risk_key
        return safety_notice


class WeatherContextProvider:
    def __init__(
        self,
        fetch_json: Optional[Callable[[float], Mapping[str, Any]]] = None,
        now: Optional[Callable[[], float]] = None,
        cache_ttl_seconds: float = _CACHE_TTL_SECONDS,
    ) -> None:
        self._fetch_json = fetch_json or self._request_weather
        self._now = now or time.monotonic
        self._cache_ttl_seconds = cache_ttl_seconds
        self._cache: Optional[WeatherContext] = None
        self._cache_expires_at = 0.0
        self._lock = threading.Lock()

    def get_weather_context(self) -> Optional[WeatherContext]:
        current_time = self._now()
        with self._lock:
            if self._cache is not None and current_time < self._cache_expires_at:
                return self._cache

        try:
            payload = self._fetch_json(_REQUEST_TIMEOUT_SECONDS)
            context = build_weather_context(payload)
        except Exception:
            return None
        if context is None:
            return None

        with self._lock:
            self._cache = context
            self._cache_expires_at = current_time + self._cache_ttl_seconds
        return context

    @staticmethod
    def _request_weather(timeout: float) -> Mapping[str, Any]:
        base_url = os.environ.get("LINGSHAN_ANALYTICS_BASE_URL", "http://127.0.0.1:5002/api").rstrip("/")
        response = requests.get(f"{base_url}/public/weather", timeout=timeout)
        if response.status_code != 200:
            raise RuntimeError("weather service unavailable")
        payload = response.json()
        if not isinstance(payload, Mapping):
            raise ValueError("weather payload must be an object")
        return payload


weather_context_provider = WeatherContextProvider()
weather_notice_registry = WeatherNoticeRegistry()


def get_weather_context() -> Optional[WeatherContext]:
    return weather_context_provider.get_weather_context()


def _text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def _number(value: Any) -> Optional[float]:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _display_number(value: float) -> str:
    return str(int(value)) if value.is_integer() else str(value)
