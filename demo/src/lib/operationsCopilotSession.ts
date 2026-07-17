export const OPERATIONS_COPILOT_SESSION_STORAGE_KEY = 'lingshan_operations_copilot_session_v1'

const MAX_TURN_CHARACTERS = 800
const MAX_HISTORY_TURNS = 8
const MAX_HISTORY_CHARACTERS = 4000
const SENSITIVE_VALUE = /(authorization|api[-_ ]?key|access[-_ ]?(?:token|key(?:id)?)|private[-_ ]?key|password|secret)(\s*["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|(?:(?:bearer|basic|apikey|token)\s+)?[^\s,;}]+)/gi
const BEARER_VALUE = /\b(bearer|basic|apikey|token)\s+[a-z0-9._~+/=-]+/gi

export type OperationsCopilotTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type OperationsCopilotPageContext = {
  pathname: string
  pageLabel: string
  objectType?: string
  objectId?: string
  objectLabel?: string
  dataUpdatedAt?: string
}

export type OperationsCopilotQueryInput = {
  question: string
  sessionId: string
  history: OperationsCopilotTurn[]
  pageContext?: OperationsCopilotPageContext
}

export type OperationsCopilotSession = {
  sessionId: string
  turns: OperationsCopilotTurn[]
}

type OperationsCopilotSessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getDefaultStorage(): OperationsCopilotSessionStorage | null {
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

function createSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `copilot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function takeCharacters(value: string, limit: number): string {
  return Array.from(value).slice(0, limit).join('')
}

function redactSensitiveValues(value: string): string {
  return value
    .replace(SENSITIVE_VALUE, (_match, label: string, delimiter: string) => `${label}${delimiter}[已隐藏]`)
    .replace(BEARER_VALUE, '[已隐藏]')
}

export function trimOperationsCopilotHistory(history: readonly unknown[] | null | undefined): OperationsCopilotTurn[] {
  if (!Array.isArray(history)) return []

  const safeTurns = history.flatMap((candidate): OperationsCopilotTurn[] => {
    if (!candidate || typeof candidate !== 'object') return []

    const role = Reflect.get(candidate, 'role')
    const rawContent = Reflect.get(candidate, 'content')
    if ((role !== 'user' && role !== 'assistant') || typeof rawContent !== 'string') return []

    const content = takeCharacters(redactSensitiveValues(rawContent.trim()), MAX_TURN_CHARACTERS)
    return content ? [{ role, content }] : []
  })

  const latestTurns = safeTurns.slice(-MAX_HISTORY_TURNS)
  const retained: OperationsCopilotTurn[] = []
  let characterCount = 0

  for (let index = latestTurns.length - 1; index >= 0; index -= 1) {
    const turn = latestTurns[index]
    if (!turn) continue

    const turnCharacters = Array.from(turn.content).length
    if (characterCount + turnCharacters > MAX_HISTORY_CHARACTERS) break

    retained.unshift(turn)
    characterCount += turnCharacters
  }

  return retained
}

export function createOperationsCopilotSession(
  sessionId = createSessionId(),
  turns: readonly unknown[] = [],
): OperationsCopilotSession {
  return {
    sessionId: sessionId.trim() || createSessionId(),
    turns: trimOperationsCopilotHistory(turns),
  }
}

export function readOperationsCopilotSession(
  storage: OperationsCopilotSessionStorage | null = getDefaultStorage(),
): OperationsCopilotSession | null {
  try {
    const raw = storage?.getItem(OPERATIONS_COPILOT_SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { sessionId?: unknown; turns?: unknown }
    if (typeof parsed?.sessionId !== 'string' || !parsed.sessionId.trim()) return null

    return createOperationsCopilotSession(parsed.sessionId, Array.isArray(parsed.turns) ? parsed.turns : [])
  } catch {
    return null
  }
}

export function saveOperationsCopilotSession(
  session: OperationsCopilotSession,
  storage: OperationsCopilotSessionStorage | null = getDefaultStorage(),
): void {
  if (!storage) return

  const safeSession = createOperationsCopilotSession(session.sessionId, session.turns)
  try {
    storage.setItem(OPERATIONS_COPILOT_SESSION_STORAGE_KEY, JSON.stringify(safeSession))
  } catch {
    // A restricted or full sessionStorage must not break Copilot usage.
  }
}

export function clearOperationsCopilotSession(
  storage: OperationsCopilotSessionStorage | null = getDefaultStorage(),
): void {
  try {
    storage?.removeItem(OPERATIONS_COPILOT_SESSION_STORAGE_KEY)
  } catch {
    // A restricted sessionStorage is equivalent to an already-cleared session.
  }
}
