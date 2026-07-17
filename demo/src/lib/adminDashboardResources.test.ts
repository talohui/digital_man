import assert from 'node:assert/strict'
import test from 'node:test'

import {
  failResource,
  isAdminDemoEnabled,
  loadingResource,
  readyResource,
  settleResource,
} from './adminDashboardResources.ts'

test('demo mode is opt-in only', () => {
  assert.equal(isAdminDemoEnabled({}), false)
  assert.equal(isAdminDemoEnabled({ VITE_ADMIN_DEMO_DATA: 'false' }), false)
  assert.equal(isAdminDemoEnabled({ VITE_ADMIN_DEMO_DATA: 'true' }), true)
  assert.equal(isAdminDemoEnabled({ VITE_ADMIN_DEMO_DATA: ' TRUE ' }), true)
})

test('keeps the last successful payload as stale after a refresh error', () => {
  const state = failResource(readyResource({ total: 12 }, '2026-07-16T13:00:00+08:00'), '连接失败')

  assert.equal(state.status, 'stale')
  assert.equal(state.data.total, 12)
  assert.equal(state.fetchedAt, '2026-07-16T13:00:00+08:00')
  assert.equal(state.error, '连接失败')
})

test('marks a first-load failure as error without inventing data', () => {
  const state = failResource(loadingResource({ total: 0 }), '服务不可用')

  assert.equal(state.status, 'error')
  assert.equal(state.data.total, 0)
  assert.equal(state.fetchedAt, undefined)
})

test('settles independent requests without erasing the last successful payload', () => {
  const previous = readyResource({ total: 12 }, '2026-07-16T13:00:00+08:00')
  const failed = settleResource(previous, { status: 'rejected', reason: new Error('timeout') }, '票务服务')
  const recovered = settleResource(failed, { status: 'fulfilled', value: { total: 18 } }, '票务服务', '2026-07-16T13:01:00+08:00')

  assert.equal(failed.status, 'stale')
  assert.equal(failed.data.total, 12)
  assert.match(failed.error ?? '', /票务服务/)
  assert.equal(recovered.status, 'ready')
  assert.equal(recovered.data.total, 18)
  assert.equal(recovered.error, undefined)
})
