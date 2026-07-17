import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const BASE = getAnalyticsApiBase()
export const EMERGENCY_REFRESH_KEY = 'lingshan-emergency-refresh'

export type EmergencyType = 'SCENIC_CLOSURE' | 'SHOW_CANCELLED' | 'EXTREME_WEATHER' | 'CROWDING' | 'ROAD_CLOSURE' | 'MISSING_PERSON' | 'MEDICAL_HELP'
export type EmergencySeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type EmergencyStatus = 'DRAFT' | 'ACTIVE' | 'RESOLVED'
export type RoutePolicy = 'NONE' | 'PENALIZE' | 'EXCLUDE'

export type EmergencyEvent = {
  id: string
  type: EmergencyType
  title: string
  message: string
  severity: EmergencySeverity
  status?: EmergencyStatus
  affectedSpotIds: string[]
  affectedRouteIds: string[]
  validFrom: string
  validUntil: string
  routePolicy: RoutePolicy
  knowledgeQuestion?: string | null
  knowledgeAnswer?: string | null
  kbFaqId?: string | null
  kbSyncStatus?: 'PENDING' | 'SYNCED' | 'FAILED'
  createdAt?: string | null
  updatedAt?: string | null
  resolvedAt?: string | null
}

export type EmergencyEventInput = Omit<EmergencyEvent, 'id' | 'status' | 'kbFaqId' | 'kbSyncStatus' | 'createdAt' | 'updatedAt' | 'resolvedAt'>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> | undefined) }
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message || (response.status >= 500 ? '应急服务暂不可用' : '应急事件操作失败'))
  }
  return response.json() as Promise<T>
}

function notifyEmergencyChanged() {
  try { localStorage.setItem(EMERGENCY_REFRESH_KEY, String(Date.now())) }
  catch { /* storage may be unavailable */ }
}

async function mutate<T>(path: string, init: RequestInit): Promise<T> {
  const result = await request<T>(path, init)
  notifyEmergencyChanged()
  return result
}

export const fetchActiveEmergencies = () => request<EmergencyEvent[]>('/public/emergencies/active')
export const fetchAdminEmergencies = () => request<EmergencyEvent[]>('/admin/emergencies')
export const createEmergency = (value: EmergencyEventInput) => mutate<EmergencyEvent>('/admin/emergencies', { method: 'POST', body: JSON.stringify(value) })
export const updateEmergency = (id: string, value: EmergencyEventInput) => mutate<EmergencyEvent>(`/admin/emergencies/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(value) })
export const publishEmergency = (id: string) => mutate<EmergencyEvent>(`/admin/emergencies/${encodeURIComponent(id)}/publish`, { method: 'POST' })
export const resolveEmergency = (id: string) => mutate<EmergencyEvent>(`/admin/emergencies/${encodeURIComponent(id)}/resolve`, { method: 'POST' })
export const retryEmergencyKnowledgeSync = (id: string) => mutate<EmergencyEvent>(`/admin/emergencies/${encodeURIComponent(id)}/retry-kb-sync`, { method: 'POST' })
