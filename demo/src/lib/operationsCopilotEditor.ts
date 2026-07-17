type ProposalLike = {
  type: string
  title: string
  summary: string
  payload: Record<string, unknown>
}

export type OperationsCopilotEditorValues = Record<string, string> & {
  proposalTitle: string
  proposalSummary: string
}

const ALLOWED_FIELDS: Record<string, string[]> = {
  EMERGENCY_DRAFT: ['type', 'title', 'message', 'severity', 'affectedSpotIds', 'affectedRouteIds', 'validFrom', 'validUntil', 'routePolicy'],
  KB_CREATE: ['question', 'answer', 'tags', 'validFrom', 'validUntil'],
  KB_UPDATE: ['faqId', 'question', 'answer', 'tags', 'validFrom', 'validUntil'],
  KB_DEACTIVATE: ['faqId'],
}

const LIST_FIELDS = new Set(['affectedSpotIds', 'affectedRouteIds', 'tags'])

function listValue(value: string): string[] {
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean).slice(0, 12)
}

export function proposalToEditorValues(proposal: ProposalLike): OperationsCopilotEditorValues {
  const values: Record<string, string> = { proposalTitle: proposal.title, proposalSummary: proposal.summary }
  for (const field of ALLOWED_FIELDS[proposal.type] ?? []) {
    const value = proposal.payload[field]
    values[field] = Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : ''
  }
  return values as OperationsCopilotEditorValues
}

export function buildOperationsCopilotProposalUpdate(
  proposal: ProposalLike,
  values: Record<string, string>,
): { title: string; summary: string; payload: Record<string, unknown> } {
  const payload: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS[proposal.type] ?? []) {
    const value = values[field]?.trim() ?? ''
    if (LIST_FIELDS.has(field)) payload[field] = listValue(value)
    else if (value || Object.prototype.hasOwnProperty.call(proposal.payload, field)) payload[field] = value
  }
  return {
    title: values.proposalTitle?.trim() || proposal.title,
    summary: values.proposalSummary?.trim() || proposal.summary,
    payload,
  }
}
