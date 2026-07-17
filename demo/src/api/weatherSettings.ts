import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const BASE = getAnalyticsApiBase()

export type WeatherSettings = {
  configured: boolean
  maskedKey: string | null
  source: 'admin' | 'environment' | 'none' | string
}

async function request<T>(path: string, token: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'X-Fay-Admin-Session': token,
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  const body = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) throw new Error(body.message || (response.status === 401 ? '管理员会话已过期，请重新验证' : '天气服务设置未保存'))
  return body
}

export function fetchWeatherSettings(token: string): Promise<WeatherSettings> {
  return request('/admin/weather-settings', token, { method: 'GET' })
}

export function updateWeatherSettings(token: string, apiKey: string): Promise<WeatherSettings> {
  return request('/admin/weather-settings', token, {
    method: 'PUT',
    body: JSON.stringify({ apiKey }),
  })
}
