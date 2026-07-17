import assert from 'node:assert/strict'
import test from 'node:test'

import {
  OPERATIONS_COPILOT_SESSION_STORAGE_KEY,
  clearOperationsCopilotSession,
  createOperationsCopilotSession,
  readOperationsCopilotSession,
  saveOperationsCopilotSession,
  trimOperationsCopilotHistory,
  type OperationsCopilotSession,
} from './operationsCopilotSession.ts'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

test('filters unsupported and empty turns while trimming safe content', () => {
  const turns = trimOperationsCopilotHistory([
    { role: 'system', content: 'never persist this' },
    { role: 'user', content: '   ' },
    { role: 'user', content: '  分析入口客流  ' },
    { role: 'assistant', content: '  已收到  ' },
  ])

  assert.deepEqual(turns, [
    { role: 'user', content: '分析入口客流' },
    { role: 'assistant', content: '已收到' },
  ])
})

test('limits each turn to 800 characters and keeps only the latest 8 turns', () => {
  const turns = trimOperationsCopilotHistory(
    Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `${index}:turn`,
    })),
  )
  const [longTurn] = trimOperationsCopilotHistory([{ role: 'user', content: 'x'.repeat(900) }])

  assert.equal(turns.length, 8)
  assert.equal(turns[0]?.content.startsWith('2:'), true)
  assert.equal(turns[7]?.content.startsWith('9:'), true)
  assert.equal(Array.from(longTurn?.content ?? '').length, 800)
})

test('keeps complete newest turns within the 4000 character total', () => {
  const turns = trimOperationsCopilotHistory(
    Array.from({ length: 6 }, (_, index) => ({
      role: 'assistant',
      content: String(index).repeat(800),
    })),
  )

  assert.equal(turns.length, 5)
  assert.deepEqual(turns.map((turn) => turn.content[0]), ['1', '2', '3', '4', '5'])
  assert.equal(turns.reduce((total, turn) => total + Array.from(turn.content).length, 0), 4000)
})

test('does not split Unicode characters when limiting a turn', () => {
  const [turn] = trimOperationsCopilotHistory([{ role: 'user', content: '😀'.repeat(801) }])

  assert.equal(Array.from(turn?.content ?? '').length, 800)
  assert.equal(turn?.content.endsWith('😀'), true)
})

test('stores and restores only the session id and safe turns', () => {
  const storage = new MemoryStorage()
  const unsafeSession = {
    sessionId: 'copilot-session-1',
    turns: [
      { role: 'user', content: '  当前客流如何？  ', password: 'turn-password' },
      { role: 'system', content: 'hidden system prompt' },
    ],
    password: 'admin-password',
    fayAdminSessionToken: 'temporary-fay-session',
    proposal: { payload: { secret: true } },
  } as unknown as OperationsCopilotSession

  saveOperationsCopilotSession(unsafeSession, storage)

  const raw = storage.getItem(OPERATIONS_COPILOT_SESSION_STORAGE_KEY)
  assert.deepEqual(JSON.parse(String(raw)), {
    sessionId: 'copilot-session-1',
    turns: [{ role: 'user', content: '当前客流如何？' }],
  })
  assert.doesNotMatch(String(raw), /password|token|proposal/i)
  assert.deepEqual(readOperationsCopilotSession(storage), {
    sessionId: 'copilot-session-1',
    turns: [{ role: 'user', content: '当前客流如何？' }],
  })
})

test('redacts credential values accidentally pasted into a persisted conversation', () => {
  const [turn] = trimOperationsCopilotHistory([{
    role: 'user',
    content: '检查配置 password=secret-pass Authorization: Bearer live-token api_key: actual-key',
  }])

  assert.match(turn?.content ?? '', /password=\[已隐藏\]/)
  assert.match(turn?.content ?? '', /Authorization: \[已隐藏\]/)
  assert.match(turn?.content ?? '', /api_key: \[已隐藏\]/)
  assert.doesNotMatch(turn?.content ?? '', /secret-pass|live-token|actual-key/)
})

test('returns null when stored session JSON is damaged', () => {
  const storage = new MemoryStorage()
  storage.setItem(OPERATIONS_COPILOT_SESSION_STORAGE_KEY, '{damaged')

  assert.equal(readOperationsCopilotSession(storage), null)
})

test('creates a sanitized session and clears it from storage', () => {
  const storage = new MemoryStorage()
  const session = createOperationsCopilotSession('copilot-session-2', [
    { role: 'assistant', content: '  已恢复  ' },
  ])

  saveOperationsCopilotSession(session, storage)
  clearOperationsCopilotSession(storage)

  assert.deepEqual(session, {
    sessionId: 'copilot-session-2',
    turns: [{ role: 'assistant', content: '已恢复' }],
  })
  assert.equal(storage.getItem(OPERATIONS_COPILOT_SESSION_STORAGE_KEY), null)
})
