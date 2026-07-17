import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { buildEmailReportRequest } from '../lib/emailReportRequest.ts'

const api = readFileSync(new URL('./emailReports.ts', import.meta.url), 'utf8')

test('email report requests carry the temporary Fay admin session in a header only', () => {
  const request = buildEmailReportRequest('PUT', 'temporary-fay-session', {
    smtpUsername: 'sender@qq.com',
    smtpAuthCode: 'one-time-auth-code',
    recipients: ['ops@example.com'],
    dailyEnabled: true,
  })
  const headers = new Headers(request.headers)

  assert.equal(headers.get('X-Fay-Admin-Session'), 'temporary-fay-session')
  assert.equal(headers.get('Content-Type'), 'application/json')
  assert.deepEqual(JSON.parse(String(request.body)), {
    smtpUsername: 'sender@qq.com',
    smtpAuthCode: 'one-time-auth-code',
    recipients: ['ops@example.com'],
    dailyEnabled: true,
  })
  assert.doesNotMatch(String(request.body), /temporary-fay-session/)
})

test('declares an isolated SMTP credential request without report settings', () => {
  assert.match(api, /export function updateEmailReportSmtpSettings/)
  assert.match(api, /request\('\/admin\/email-reports\/smtp'/)
  assert.doesNotMatch(api, /updateEmailReportSettings\([^\n]*EmailReportSmtpUpdate/)
  const request = buildEmailReportRequest('PUT', 'temporary-fay-session', {
    smtpUsername: 'sender@qq.com',
    smtpAuthCode: 'temporary-code',
  })

  assert.deepEqual(JSON.parse(String(request.body)), {
    smtpUsername: 'sender@qq.com',
    smtpAuthCode: 'temporary-code',
  })
})

test('prevents an unavailable email service from leaving the save request pending forever', () => {
  assert.match(api, /AbortController/)
  assert.match(api, /运营报告服务响应超时/)
})

test('allows test email generation and SMTP delivery more time than settings requests', () => {
  assert.match(api, /TEST_EMAIL_TIMEOUT_MS\s*=\s*90000/)
  assert.match(api, /request\('\/admin\/email-reports\/test', buildEmailReportRequest\('POST', token\), TEST_EMAIL_TIMEOUT_MS\)/)
})
