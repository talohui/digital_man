import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const BASE = getAnalyticsApiBase()

export type VisitorConsent = { userId: string; personalizationEnabled: boolean; analyticsEnabled: boolean; updatedAt?: string | null }
export type VisitorPrivacySummary = { userId: string; consent: VisitorConsent; savedDataCounts: Record<string, number> }
export type VisitorPrivacyExport = { userId: string; exportedAt: string; consent: VisitorConsent; profile: Record<string, unknown>; footprint: Array<Record<string, unknown>>; analyticsEvents: Array<Record<string, unknown>> }
export type VisitorDeleteResult = { userId: string; deletedCounts: Record<string, number>; failedCategories: string[]; complete: boolean }

async function request<T>(userId: string, suffix = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}/visitor/privacy/${encodeURIComponent(userId)}${suffix}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> | undefined) }
  })
  if (!response.ok) throw new Error(response.status >= 500 ? '隐私服务暂不可用' : '个人数据操作失败')
  return response.json() as Promise<T>
}

export const fetchPrivacySummary = (userId: string) => request<VisitorPrivacySummary>(userId)
export const updateVisitorConsent = (userId: string, value: Pick<VisitorConsent, 'personalizationEnabled' | 'analyticsEnabled'>) => request<VisitorConsent>(userId, '/consent', { method: 'PUT', body: JSON.stringify(value) })
export const exportVisitorData = (userId: string) => request<VisitorPrivacyExport>(userId, '/export')
export const deleteVisitorData = (userId: string) => request<VisitorDeleteResult>(userId, '', { method: 'DELETE' })
