import assert from 'node:assert/strict'
import test from 'node:test'

import { isConfirmableProposal } from './operationsCopilotProposal.ts'

test('only a draft Copilot proposal can be confirmed', () => {
  assert.equal(isConfirmableProposal({ status: 'DRAFT', type: 'EMERGENCY_DRAFT' }), true)
  assert.equal(isConfirmableProposal({ status: 'DRAFT', type: 'KB_CREATE' }), true)
  assert.equal(isConfirmableProposal({ status: 'CONFIRMED', type: 'EMERGENCY_DRAFT' }), false)
  assert.equal(isConfirmableProposal({ status: 'DISCARDED', type: 'KB_CREATE' }), false)
  assert.equal(isConfirmableProposal({ status: 'FAILED', type: 'KB_CREATE' }), false)
})

test('blocks model-supplied FAQ update identifiers until selected from a trusted catalog', () => {
  assert.equal(isConfirmableProposal({ status: 'DRAFT', type: 'KB_UPDATE' }), false)
  assert.equal(isConfirmableProposal({ status: 'DRAFT', type: 'KB_DEACTIVATE' }), false)
})
