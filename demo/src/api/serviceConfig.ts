import { getFayHttpBase } from '../lib/runtimeConfig'
import { buildServiceConfigUpdate } from '../lib/serviceConfigUpdate'

export type ServiceConfig = Record<string, string>

export type ServiceConfigSession = {
  token: string
  expiresIn: number
}

export { buildServiceConfigUpdate }

async function requestServiceConfig<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${getFayHttpBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  const body = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) throw new Error(body.message || `HTTP ${response.status}`)
  return body
}

export async function loginServiceConfig(password: string): Promise<ServiceConfigSession> {
  return requestServiceConfig('/api/admin/service-config/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export async function fetchServiceConfig(token: string): Promise<ServiceConfig> {
  const response = await requestServiceConfig<{ config: ServiceConfig }>(
    '/api/admin/service-config',
    {},
    token,
  )
  return response.config
}

export async function saveServiceConfig(token: string, config: ServiceConfig): Promise<ServiceConfig> {
  const response = await requestServiceConfig<{ config: ServiceConfig }>(
    '/api/admin/service-config',
    { method: 'PUT', body: JSON.stringify({ config }) },
    token,
  )
  return response.config
}

export async function revealServiceConfigSecret(
  token: string,
  field: string,
  password: string,
): Promise<string> {
  const response = await requestServiceConfig<{ value: string }>(
    '/api/admin/service-config/reveal',
    { method: 'POST', body: JSON.stringify({ field, password }) },
    token,
  )
  return response.value
}
