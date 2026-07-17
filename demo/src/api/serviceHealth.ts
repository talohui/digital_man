// Native Node TypeScript tests require explicit extensions; Vite supports these source imports.
// @ts-expect-error TS5097: keep the same module graph in the Node strip-types test runner.
import { getAnalyticsApiBase } from '../lib/runtimeConfig.ts'

export type ServiceHealthStatus = 'NORMAL' | 'DEGRADED' | 'UNCONFIGURED' | 'OFFLINE' | 'STALE'

export type ServiceHealthComponent = {
  key: string
  label: string
  status: ServiceHealthStatus
  message: string
  checkedAt: string
  lastSuccessAt: string | null
  latencyMs: number
  recoveryPath: string
}

export type ServiceHealthResponse = {
  overall: ServiceHealthStatus
  checkedAt: string
  components: ServiceHealthComponent[]
}

const SERVICE_HEALTH_STATUSES = new Set<ServiceHealthStatus>([
  'NORMAL',
  'DEGRADED',
  'UNCONFIGURED',
  'OFFLINE',
  'STALE',
])

const REQUIRED_SERVICE_KEYS = new Set(['analytics', 'fay', 'rag', 'weather', 'model'])

function isCompleteHealthResponse(value: unknown): value is ServiceHealthResponse {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ServiceHealthResponse>
  if (!candidate.overall || !SERVICE_HEALTH_STATUSES.has(candidate.overall)) return false
  if (typeof candidate.checkedAt !== 'string' || !Array.isArray(candidate.components)) return false
  if (candidate.components.length !== REQUIRED_SERVICE_KEYS.size) return false

  const keys = new Set<string>()
  for (const component of candidate.components) {
    if (!component || typeof component !== 'object') return false
    if (!REQUIRED_SERVICE_KEYS.has(component.key) || keys.has(component.key)) return false
    if (!SERVICE_HEALTH_STATUSES.has(component.status)) return false
    if (
      typeof component.label !== 'string'
      || typeof component.message !== 'string'
      || typeof component.checkedAt !== 'string'
      || typeof component.latencyMs !== 'number'
      || typeof component.recoveryPath !== 'string'
      || (component.lastSuccessAt !== null && typeof component.lastSuccessAt !== 'string')
    ) return false
    keys.add(component.key)
  }
  return keys.size === REQUIRED_SERVICE_KEYS.size
}

export const SERVICE_HEALTH_STATUS_LABELS: Record<ServiceHealthStatus, string> = {
  NORMAL: '正常',
  DEGRADED: '部分降级',
  UNCONFIGURED: '待配置',
  OFFLINE: '离线',
  STALE: '状态过期',
}

export type ServiceHealthTone = 'normal' | 'warning' | 'stale' | 'error'

export function getServiceHealthTone(status: ServiceHealthStatus): ServiceHealthTone {
  if (status === 'NORMAL') return 'normal'
  if (status === 'OFFLINE') return 'error'
  if (status === 'STALE') return 'stale'
  return 'warning'
}

export function summarizeServiceHealth(health: ServiceHealthResponse | null): string {
  if (!health) return '服务检测中'
  if (health.overall === 'NORMAL') {
    const verified = health.components.filter((component) => component.status === 'NORMAL').length
    return `${verified} 项服务正常`
  }
  if (health.overall === 'DEGRADED') return '服务部分降级'
  if (health.overall === 'UNCONFIGURED') return '有服务待配置'
  if (health.overall === 'STALE') return '服务状态已过期'
  return '有服务离线'
}

export function formatServiceHealthTime(
  value: string | null,
  locale = 'zh-CN',
  timeZone?: string,
): string {
  if (!value) return '尚未检测'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '时间未知'
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}

export async function getServiceHealth(signal?: AbortSignal): Promise<ServiceHealthResponse> {
  const base = typeof window === 'undefined' ? 'http://127.0.0.1:5002/api' : getAnalyticsApiBase()
  const response = await fetch(`${base}/dashboard/service-health`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !isCompleteHealthResponse(body)) {
    throw new Error('无法获取完整服务状态')
  }
  return body
}
