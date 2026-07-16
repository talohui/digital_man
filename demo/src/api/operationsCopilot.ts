import { getAnalyticsApiBase } from '../lib/runtimeConfig'
import { buildOperationsCopilotConfirmRequest, buildOperationsCopilotQueryRequest } from '../lib/operationsCopilotRequest'
import type { OperationsCopilotQueryInput } from '../lib/operationsCopilotSession'

export type {
  OperationsCopilotPageContext,
  OperationsCopilotQueryInput,
  OperationsCopilotTurn,
} from '../lib/operationsCopilotSession'

const BASE = getAnalyticsApiBase()

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
  sources: string[]
  generationSource: 'llm' | 'rules' | string
  proposal: OperationsCopilotProposal | null
  proposalStatus?: 'DRAFT' | 'CONFIRMED' | 'DISCARDED' | 'FAILED' | null
  executionResult?: Record<string, unknown>
}

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
): Promise<OperationsCopilotResponse> {
  return request(
    `/dashboard/operations-copilot/${encodeURIComponent(proposalId)}/confirm`,
    buildOperationsCopilotConfirmRequest(fayAdminSessionToken),
  )
}

export function discardOperationsCopilotProposal(proposalId: string): Promise<OperationsCopilotResponse> {
  return request(`/dashboard/operations-copilot/${encodeURIComponent(proposalId)}/discard`, {
    method: 'POST',
  })
}
