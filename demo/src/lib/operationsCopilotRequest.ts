// Native Node TypeScript tests require explicit extensions; Vite supports these source imports.
// @ts-expect-error TS5097: allow direct reuse in the Node strip-types test runner.
import { trimOperationsCopilotHistory } from './operationsCopilotSession.ts'
import type {
  OperationsCopilotPageContext,
  OperationsCopilotQueryInput,
} from './operationsCopilotSession'

export type { OperationsCopilotPageContext, OperationsCopilotQueryInput, OperationsCopilotTurn } from './operationsCopilotSession'

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
        history: trimOperationsCopilotHistory(input.history),
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
