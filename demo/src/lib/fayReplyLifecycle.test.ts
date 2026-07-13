import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FAY_SEND_TIMEOUT_MS,
  isFayReplyComplete
} from './fayReplyLifecycle.ts'

test('recognises the text end marker', () => {
  assert.equal(isFayReplyComplete({}, '回答结束_<isend>'), true)
})

test('recognises Fay Data.IsEnd variants', () => {
  assert.equal(isFayReplyComplete({ Data: { IsEnd: 1 } }, ''), true)
  assert.equal(isFayReplyComplete({ Data: { IsEnd: '1' } }, ''), true)
  assert.equal(isFayReplyComplete({ data: { isEnd: true } }, ''), true)
})

test('does not treat an in-progress chunk as complete', () => {
  assert.equal(isFayReplyComplete({ Data: { IsEnd: 0 } }, '回答中'), false)
  assert.equal(isFayReplyComplete({ data: { isEnd: 'false' } }, '回答中'), false)
})

test('uses a bounded send timeout', () => {
  assert.equal(FAY_SEND_TIMEOUT_MS, 15_000)
})
