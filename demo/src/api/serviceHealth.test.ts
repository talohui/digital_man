import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatServiceHealthTime,
  getServiceHealth,
  getServiceHealthTone,
  summarizeServiceHealth,
  type ServiceHealthResponse,
} from './serviceHealth.ts'

function health(overall: ServiceHealthResponse['overall'], componentStatuses: ServiceHealthResponse['overall'][] = []): ServiceHealthResponse {
  const keys = ['analytics', 'fay', 'rag', 'weather', 'model']
  return {
    overall,
    checkedAt: '2026-07-16T06:00:00Z',
    components: componentStatuses.map((status, index) => ({
      key: keys[index] ?? `service-${index}`,
      label: `服务 ${index + 1}`,
      status,
      message: '状态已核验',
      checkedAt: '2026-07-16T06:00:00Z',
      lastSuccessAt: null,
      latencyMs: 12,
      recoveryPath: '/admin/config',
    })),
  }
}

test('summarizes normal health with the verified component count', () => {
  assert.equal(summarizeServiceHealth(health('NORMAL', ['NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL'])), '5 项服务正常')
  assert.equal(getServiceHealthTone('NORMAL'), 'normal')
})

test('maps every non-normal health state to direct Chinese status copy', () => {
  assert.equal(summarizeServiceHealth(health('DEGRADED')), '服务部分降级')
  assert.equal(summarizeServiceHealth(health('UNCONFIGURED')), '有服务待配置')
  assert.equal(summarizeServiceHealth(health('STALE')), '服务状态已过期')
  assert.equal(summarizeServiceHealth(health('OFFLINE')), '有服务离线')
  assert.equal(getServiceHealthTone('OFFLINE'), 'error')
  assert.equal(getServiceHealthTone('UNCONFIGURED'), 'warning')
})

test('does not claim success before the health response arrives', () => {
  assert.equal(summarizeServiceHealth(null), '服务检测中')
  assert.equal(formatServiceHealthTime(null), '尚未检测')
})

test('formats the backend timestamp for Chinese operator copy', () => {
  const formatted = formatServiceHealthTime('2026-07-16T06:00:00Z', 'zh-CN', 'Asia/Shanghai')
  assert.match(formatted, /14:00/)
})

test('requests the aggregated health endpoint and accepts a complete response', async (t) => {
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input)
    return new Response(JSON.stringify(health('NORMAL', ['NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL'])), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch
  t.after(() => { globalThis.fetch = originalFetch })

  const response = await getServiceHealth()

  assert.match(requestedUrl, /\/api\/dashboard\/service-health$/)
  assert.equal(response.overall, 'NORMAL')
})

test('rejects an incomplete health payload instead of inventing a normal state', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify({ overall: 'NORMAL' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })) as typeof fetch
  t.after(() => { globalThis.fetch = originalFetch })

  await assert.rejects(() => getServiceHealth(), /无法获取完整服务状态/)
})

test('rejects a partial component list even when the backend claims normal', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify(health('NORMAL', ['NORMAL'])), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })) as typeof fetch
  t.after(() => { globalThis.fetch = originalFetch })

  await assert.rejects(() => getServiceHealth(), /无法获取完整服务状态/)
})
