// Native Node TypeScript tests require explicit extensions; Vite supports these source imports.
// @ts-expect-error TS5097: allow the same module graph in the Node strip-types test runner.
import { getAnalyticsApiBase } from '../lib/runtimeConfig.ts'
// @ts-expect-error TS5097: allow the same module graph in the Node strip-types test runner.
import { buildOperationsCopilotConfirmRequest, buildOperationsCopilotQueryRequest } from '../lib/operationsCopilotRequest.ts'
import type { OperationsCopilotQueryInput } from '../lib/operationsCopilotSession'

export type {
  OperationsCopilotPageContext,
  OperationsCopilotQueryInput,
  OperationsCopilotTurn,
} from '../lib/operationsCopilotSession'

const BASE = typeof window === 'undefined' ? 'http://127.0.0.1:5002/api' : getAnalyticsApiBase()

export type OperationsCopilotProposalType = 'EMERGENCY_DRAFT' | 'KB_CREATE' | 'KB_UPDATE' | 'KB_DEACTIVATE'

export type OperationsCopilotProposal = {
  type: OperationsCopilotProposalType
  title: string
  summary: string
  payload: Record<string, unknown>
}

export type OperationsCopilotResponse = {
  id: string
  answer: string
  evidence: string[]
  recommendedActions: string[]
  risks: string[]
  sources: string[]
  generationSource: 'llm' | 'rules' | string
  fallbackReason?: string | null
  proposal: OperationsCopilotProposal | null
  proposalRevision?: string | null
  sessionId?: string | null
  contextUpdatedAt?: string | null
  proposalStatus?: 'DRAFT' | 'CONFIRMED' | 'DISCARDED' | 'FAILED' | 'RECONCILING' | null
  executionResult?: Record<string, unknown>
}

export type OperationsCopilotProposalUpdate = Pick<OperationsCopilotProposal, 'title' | 'summary' | 'payload'>

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  const body = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) throw new Error(body.message || (response.status >= 500 ? '运营 Copilot 暂不可用' : 'Copilot 操作未完成'))
  return body
}

export function queryOperationsCopilot(input: string | OperationsCopilotQueryInput): Promise<OperationsCopilotResponse> {
  return request('/dashboard/operations-copilot/query', buildOperationsCopilotQueryRequest(input))
}

export function confirmOperationsCopilotProposal(
  proposalId: string,
  fayAdminSessionToken: string,
  proposalRevision: string,
): Promise<OperationsCopilotResponse> {
  return request(
    `/dashboard/operations-copilot/${encodeURIComponent(proposalId)}/confirm`,
    buildOperationsCopilotConfirmRequest(fayAdminSessionToken, proposalRevision),
  )
}

export function discardOperationsCopilotProposal(proposalId: string): Promise<OperationsCopilotResponse> {
  return request(`/dashboard/operations-copilot/${encodeURIComponent(proposalId)}/discard`, {
    method: 'POST',
  })
}

export function updateOperationsCopilotProposal(
  proposalId: string,
  update: OperationsCopilotProposalUpdate,
): Promise<OperationsCopilotResponse> {
  return request(`/dashboard/operations-copilot/${encodeURIComponent(proposalId)}/proposal`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: update.title,
      summary: update.summary,
      payload: update.payload,
    }),
  })
}
