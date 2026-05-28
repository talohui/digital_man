import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const BASE = getAnalyticsApiBase()

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined)
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export type PublicAvatarConfig = {
  live2dModelUrl?: string
  live2dPresetName?: string
  voiceId?: string
  voiceName?: string
  displayName?: string
  costumeId?: string
  updatedAt?: string | null
}

export async function fetchPublicAvatarConfig(): Promise<PublicAvatarConfig | null> {
  const res = await fetch(`${BASE}/public/avatar-config`)
  if (!res.ok) return null
  return res.json()
}

export function adminGet<T>(path: string) {
  return requestJson<T>(path)
}

export function adminPut<T>(path: string, body: unknown) {
  return requestJson<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}
