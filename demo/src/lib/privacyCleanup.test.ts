import assert from 'node:assert/strict'
import test from 'node:test'

import { buildCleanupPlan } from './privacyCleanup.ts'

test('local cleanup keeps identity until server confirms complete deletion', () => {
  assert.deepEqual(buildCleanupPlan({ complete: false, failedCategories: ['analyticsEvents'] }).remove, [])
  const completed = buildCleanupPlan({ complete: true, failedCategories: [] })
  assert.ok(completed.remove.includes('lingshan-guide-store'))
  assert.ok(completed.remove.includes('lingshan-ticket-store'))
  assert.equal(completed.rotateGuestIdentity, true)
})
