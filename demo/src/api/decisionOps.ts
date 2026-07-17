import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const BASE = getAnalyticsApiBase()

export type DecisionCard = { cardId?: string | null; title: string; type: string; priority: '高' | '中' | '低'; evidence: string[]; reason: string; actions: string[]; relatedTopics: string[]; relatedSpots: string[]; demoFallback: boolean }
export type DecisionSnapshotSummary = { id: string; summary: string; generationSource: string; generatedAt: string; fallbackReason?: string | null }
export type DecisionSnapshotDetail = DecisionSnapshotSummary & { inputWindowStart: string; inputWindowEnd: string; inputSummary: Record<string, unknown>; dataSources: string[]; cards: DecisionCard[] }
export type DecisionHistoryPage = { items: DecisionSnapshotSummary[]; page: number; size: number; total: number }
export type DecisionComparison = { added: DecisionCard[]; removed: DecisionCard[]; priorityChanged: Array<{ stableKey: string; title: string; oldPriority: string; newPriority: string }> }
export type DecisionAction = { id: string; cardId: string; snapshotId?: string | null; actionText: string; status: string; owner?: string | null; dueAt?: string | null; note?: string | null; baselineMetrics?: Record<string, unknown>; resultMetrics?: Record<string, unknown> }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> | undefined) }
  })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) {
    const serverMessage = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : undefined
    throw new Error(serverMessage || (response.status >= 500 ? '决策服务暂不可用' : '决策操作失败'))
  }
  return payload as T
}

export const fetchDecisionHistory = (page = 0, size = 20) => request<DecisionHistoryPage>(`/dashboard/marketing-decision/history?page=${page}&size=${size}`)
export const fetchDecisionSnapshot = (id: string) => request<DecisionSnapshotDetail>(`/dashboard/marketing-decision/${encodeURIComponent(id)}`)
export const fetchDecisionActions = (snapshotId: string) => request<DecisionAction[]>(`/dashboard/decision-actions?snapshotId=${encodeURIComponent(snapshotId)}`)
export const compareDecisionSnapshots = (newerId: string, olderId: string) => request<DecisionComparison>(`/dashboard/marketing-decision/${encodeURIComponent(newerId)}/compare/${encodeURIComponent(olderId)}`)
export const createDecisionAction = (cardId: string, actionText: string) => request<DecisionAction>('/dashboard/decision-actions', { method: 'POST', body: JSON.stringify({ cardId, actionText }) })
export const updateDecisionAction = (id: string, value: { status: string; owner?: string; dueAt?: string; note?: string }) => request<DecisionAction>(`/dashboard/decision-actions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(value) })
export const evaluateDecisionAction = (id: string, value: { baselineStart: string; baselineEnd: string; resultStart: string; resultEnd: string }) => request<DecisionAction>(`/dashboard/decision-actions/${encodeURIComponent(id)}/evaluate`, { method: 'POST', body: JSON.stringify(value) })
