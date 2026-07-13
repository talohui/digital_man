type FayReplyLike = {
  Data?: Record<string, unknown>
  data?: Record<string, unknown>
  [key: string]: unknown
}

export const FAY_SEND_TIMEOUT_MS = 15_000

function isTruthyEndFlag(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true'
}

export function isFayReplyComplete(message: FayReplyLike, rawText = ''): boolean {
  if (/_<isend>/i.test(rawText)) return true

  const candidates = [
    message.IsEnd,
    message.isEnd,
    message.Data?.IsEnd,
    message.Data?.isEnd,
    message.data?.IsEnd,
    message.data?.isEnd
  ]

  return candidates.some(isTruthyEndFlag)
}
