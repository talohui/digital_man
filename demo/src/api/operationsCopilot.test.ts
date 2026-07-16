import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'

import { buildOperationsCopilotConfirmRequest, buildOperationsCopilotQueryRequest } from '../lib/operationsCopilotRequest.ts'
import { confirmOperationsCopilotProposal, queryOperationsCopilot } from './operationsCopilot.ts'

type FetchCall = {
  input: string | URL | Request
  init?: RequestInit
}

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

function captureFetch(calls: FetchCall[]): void {
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init })
    return new Response(JSON.stringify({
      id: 'copilot-response',
      answer: '已分析',
      sources: [],
      generationSource: 'rules',
      proposal: null,
    }), { status: 200 })
  }) as typeof fetch
}

test('builds a Copilot query request with only the operator question', () => {
  const request = buildOperationsCopilotQueryRequest('分析入口客流')

  assert.equal(request.method, 'POST')
  assert.deepEqual(JSON.parse(String(request.body)), { question: '分析入口客流' })
})

test('builds a contextual Copilot query request with trimmed safe history', () => {
  const request = buildOperationsCopilotQueryRequest({
    question: '比较今天和昨天的入口客流',
    sessionId: 'copilot-session-1',
    history: [
      { role: 'system', content: 'do not send' },
      { role: 'user', content: '  今天入口客流如何？  ' },
      { role: 'assistant', content: '  今天入口客流较高。  ' },
    ],
    pageContext: {
      pathname: '/admin/dashboard',
      pageLabel: '运营看板',
      objectType: 'scenic-area',
      objectId: 'lingshan',
      objectLabel: '灵山景区',
      dataUpdatedAt: '2026-07-16T09:30:00+08:00',
    },
  })

  assert.equal(request.method, 'POST')
  assert.deepEqual(JSON.parse(String(request.body)), {
    question: '比较今天和昨天的入口客流',
    sessionId: 'copilot-session-1',
    history: [
      { role: 'user', content: '今天入口客流如何？' },
      { role: 'assistant', content: '今天入口客流较高。' },
    ],
    pageContext: {
      pathname: '/admin/dashboard',
      pageLabel: '运营看板',
      objectType: 'scenic-area',
      objectId: 'lingshan',
      objectLabel: '灵山景区',
      dataUpdatedAt: '2026-07-16T09:30:00+08:00',
    },
  })
})

test('does not copy password, Fay token, or proposal fields into an object query', () => {
  const request = buildOperationsCopilotQueryRequest({
    question: '分析风险',
    sessionId: 'copilot-session-2',
    history: [{ role: 'user', content: '检查客流' }],
    password: 'admin-password',
    fayAdminSessionToken: 'temporary-fay-session',
    proposal: { payload: { secret: true } },
  } as never)

  const body = String(request.body)
  assert.doesNotMatch(body, /password|token|proposal/i)
  assert.deepEqual(JSON.parse(body), {
    question: '分析风险',
    sessionId: 'copilot-session-2',
    history: [{ role: 'user', content: '检查客流' }],
  })
})

test('applies 8 turn, 800 character, 4000 total, and Unicode boundaries to query history', () => {
  const latestRequest = buildOperationsCopilotQueryRequest({
    question: '检查最近会话',
    sessionId: 'copilot-session-latest',
    history: Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `${index}:turn`,
    })),
  })
  const unicodeRequest = buildOperationsCopilotQueryRequest({
    question: '检查 Unicode',
    sessionId: 'copilot-session-unicode',
    history: [{ role: 'user', content: '😀'.repeat(801) }],
  })
  const totalRequest = buildOperationsCopilotQueryRequest({
    question: '检查总长度',
    sessionId: 'copilot-session-total',
    history: Array.from({ length: 6 }, (_, index) => ({
      role: 'assistant',
      content: String(index).repeat(800),
    })),
  })

  const latestHistory = JSON.parse(String(latestRequest.body)).history
  const unicodeHistory = JSON.parse(String(unicodeRequest.body)).history
  const totalHistory = JSON.parse(String(totalRequest.body)).history
  assert.equal(latestHistory.length, 8)
  assert.equal(latestHistory[0].content, '2:turn')
  assert.equal(Array.from(unicodeHistory[0].content).length, 800)
  assert.equal(unicodeHistory[0].content.endsWith('😀'), true)
  assert.equal(totalHistory.length, 5)
  assert.equal(totalHistory.reduce((total: number, turn: { content: string }) => total + Array.from(turn.content).length, 0), 4000)
  assert.equal(totalHistory[0].content[0], '1')
})

test('builds a confirmation with a temporary Fay admin session header, never in the request body', () => {
  const request = buildOperationsCopilotConfirmRequest('temporary-fay-session')
  const headers = new Headers(request.headers)

  assert.equal(headers.get('X-Fay-Admin-Session'), 'temporary-fay-session')
  assert.equal(request.body, undefined)
})

test('queryOperationsCopilot keeps the legacy string request contract through fetch', async () => {
  const calls: FetchCall[] = []
  captureFetch(calls)

  await queryOperationsCopilot('分析入口客流')

  assert.equal(calls.length, 1)
  assert.equal(String(calls[0]?.input), 'http://127.0.0.1:5002/api/dashboard/operations-copilot/query')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { question: '分析入口客流' })
})

test('queryOperationsCopilot sends the contextual object contract through fetch', async () => {
  const calls: FetchCall[] = []
  captureFetch(calls)

  await queryOperationsCopilot({
    question: '继续分析',
    sessionId: 'copilot-session-api',
    history: [
      { role: 'user', content: '  上一轮问题  ' },
      { role: 'assistant', content: '  上一轮答复  ' },
    ],
    pageContext: {
      pathname: '/admin/dashboard',
      pageLabel: '运营看板',
    },
  })

  assert.equal(String(calls[0]?.input), 'http://127.0.0.1:5002/api/dashboard/operations-copilot/query')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    question: '继续分析',
    sessionId: 'copilot-session-api',
    history: [
      { role: 'user', content: '上一轮问题' },
      { role: 'assistant', content: '上一轮答复' },
    ],
    pageContext: {
      pathname: '/admin/dashboard',
      pageLabel: '运营看板',
    },
  })
})

test('confirmOperationsCopilotProposal keeps the Fay session only in the final request header', async () => {
  const calls: FetchCall[] = []
  captureFetch(calls)

  await confirmOperationsCopilotProposal('proposal/1', 'temporary-fay-session')

  assert.equal(String(calls[0]?.input), 'http://127.0.0.1:5002/api/dashboard/operations-copilot/proposal%2F1/confirm')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal(new Headers(calls[0]?.init?.headers).get('Content-Type'), 'application/json')
  assert.equal(new Headers(calls[0]?.init?.headers).get('X-Fay-Admin-Session'), 'temporary-fay-session')
  assert.equal(calls[0]?.init?.body, undefined)
})
