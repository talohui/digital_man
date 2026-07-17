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

export const PUBLIC_AVATAR_CONFIG_UPDATED_EVENT = 'lingshan-avatar-config-updated'
const PUBLIC_AVATAR_CONFIG_REVISION_KEY = 'lingshan-avatar-config-revision'

export function notifyPublicAvatarConfigUpdated() {
  const revision = String(Date.now())
  window.localStorage.setItem(PUBLIC_AVATAR_CONFIG_REVISION_KEY, revision)
  window.dispatchEvent(new CustomEvent(PUBLIC_AVATAR_CONFIG_UPDATED_EVENT, { detail: { revision } }))
}

export async function fetchPublicAvatarConfig(): Promise<PublicAvatarConfig | null> {
  try {
    const res = await fetch(`${BASE}/public/avatar-config`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function adminGet<T>(path: string) {
  return requestJson<T>(path)
}

export function adminPut<T>(path: string, body: unknown) {
  return requestJson<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}
