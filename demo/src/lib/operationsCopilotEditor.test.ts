import assert from 'node:assert/strict'
import test from 'node:test'

import { buildOperationsCopilotProposalUpdate, proposalToEditorValues } from './operationsCopilotEditor.ts'

test('converts emergency list fields to friendly comma-separated editor values and back', () => {
  const proposal = {
    type: 'EMERGENCY_DRAFT',
    title: '入口拥堵',
    summary: '建议分流',
    payload: {
      type: 'CROWDING',
      title: '入口拥堵',
      message: '请从东侧入口进入',
      severity: 'WARNING',
      routePolicy: 'PENALIZE',
      affectedSpotIds: ['east-gate', 'square'],
    },
  }

  const values = proposalToEditorValues(proposal)
  assert.equal(values.affectedSpotIds, 'east-gate, square')

  const update = buildOperationsCopilotProposalUpdate(proposal, {
    ...values,
    affectedSpotIds: 'east-gate，square，',
  })
  assert.deepEqual(update.payload.affectedSpotIds, ['east-gate', 'square'])
  assert.equal('unknown' in update.payload, false)
})

test('keeps the immutable proposal type outside the editable update envelope', () => {
  const proposal = {
    type: 'KB_CREATE',
    title: '新增问答',
    summary: '补充开放时间',
    payload: { question: '几点开放？', answer: '07:30 开放', tags: ['开放时间'] },
  }
  const update = buildOperationsCopilotProposalUpdate(proposal, {
    proposalTitle: '开放时间问答',
    proposalSummary: '补充官方开放时间',
    question: '几点开放？',
    answer: '07:30 开放',
    tags: '开放时间, 官方',
    unknown: 'should-not-pass',
  })

  assert.deepEqual(update, {
    title: '开放时间问答',
    summary: '补充官方开放时间',
    payload: { question: '几点开放？', answer: '07:30 开放', tags: ['开放时间', '官方'] },
  })
})
