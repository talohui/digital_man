import assert from 'node:assert/strict'
import test from 'node:test'

import {
  decisionActionKey,
  indexDecisionActions,
  transitionActionLabel,
} from './decisionActionState.ts'

test('indexes an existing action by card and action text so reopening keeps its state', () => {
  const action = { id: 'todo-1', cardId: 'card-1', actionText: '增加文创引导', status: 'ACCEPTED' }
  const indexed = indexDecisionActions([action])

  assert.equal(indexed[decisionActionKey('card-1', '增加文创引导')], action)
  assert.equal(indexed[decisionActionKey(undefined, '增加文创引导')], action)
  assert.equal(indexed[decisionActionKey('card-2', '增加文创引导')], undefined)
})

test('uses operator verbs for transitions instead of presenting them as current states', () => {
  assert.equal(transitionActionLabel('ACCEPTED'), '接受并分派')
  assert.equal(transitionActionLabel('IN_PROGRESS'), '开始执行')
  assert.equal(transitionActionLabel('COMPLETED'), '标记完成')
  assert.equal(transitionActionLabel('DISMISSED'), '驳回建议')
})
