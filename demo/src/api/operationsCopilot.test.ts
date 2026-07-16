import assert from 'node:assert/strict'
import test from 'node:test'

import { buildOperationsCopilotConfirmRequest, buildOperationsCopilotQueryRequest } from '../lib/operationsCopilotRequest.ts'

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

test('builds a confirmation with a temporary Fay admin session header, never in the request body', () => {
  const request = buildOperationsCopilotConfirmRequest('temporary-fay-session')
  const headers = new Headers(request.headers)

  assert.equal(headers.get('X-Fay-Admin-Session'), 'temporary-fay-session')
  assert.equal(request.body, undefined)
})
