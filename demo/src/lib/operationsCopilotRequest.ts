import type {
  OperationsCopilotPageContext,
  OperationsCopilotQueryInput,
  OperationsCopilotTurn,
} from './operationsCopilotSession'

export type { OperationsCopilotPageContext, OperationsCopilotQueryInput, OperationsCopilotTurn } from './operationsCopilotSession'

function trimQueryHistory(history: readonly unknown[] | null | undefined): OperationsCopilotTurn[] {
  if (!Array.isArray(history)) return []

  const safeTurns = history.flatMap((candidate): OperationsCopilotTurn[] => {
    if (!candidate || typeof candidate !== 'object') return []

    const role = Reflect.get(candidate, 'role')
    const rawContent = Reflect.get(candidate, 'content')
    if ((role !== 'user' && role !== 'assistant') || typeof rawContent !== 'string') return []

    const content = Array.from(rawContent.trim()).slice(0, 800).join('')
    return content ? [{ role, content }] : []
  }).slice(-8)

  const retained: OperationsCopilotTurn[] = []
  let characterCount = 0
  for (let index = safeTurns.length - 1; index >= 0; index -= 1) {
    const turn = safeTurns[index]
    if (!turn) continue

    const turnCharacters = Array.from(turn.content).length
    if (characterCount + turnCharacters > 4000) break

    retained.unshift(turn)
    characterCount += turnCharacters
  }
  return retained
}

function pickPageContext(pageContext: OperationsCopilotPageContext): OperationsCopilotPageContext {
  return {
    pathname: pageContext.pathname,
    pageLabel: pageContext.pageLabel,
    objectType: pageContext.objectType,
    objectId: pageContext.objectId,
    objectLabel: pageContext.objectLabel,
    dataUpdatedAt: pageContext.dataUpdatedAt,
  }
}

export function buildOperationsCopilotQueryRequest(input: string | OperationsCopilotQueryInput): RequestInit {
  const body = typeof input === 'string'
    ? { question: input }
    : {
        question: input.question,
        sessionId: input.sessionId,
        history: trimQueryHistory(input.history),
        ...(input.pageContext ? { pageContext: pickPageContext(input.pageContext) } : {}),
      }

  return {
    method: 'POST',
    body: JSON.stringify(body),
  }
}

export function buildOperationsCopilotConfirmRequest(fayAdminSessionToken: string): RequestInit {
  return {
    method: 'POST',
    headers: { 'X-Fay-Admin-Session': fayAdminSessionToken },
  }
}
