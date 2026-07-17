import assert from 'node:assert/strict'
import test from 'node:test'
import { getCloudRecordingError } from './cloudRecordingGuard.ts'

test('rejects recordings shorter than 800ms', () => {
  assert.equal(getCloudRecordingError(799, 5000), '请按住至少 1 秒再松手。')
})

test('rejects recordings without enough audio bytes', () => {
  assert.equal(getCloudRecordingError(1200, 1023), '请按住至少 1 秒再松手。')
})

test('accepts a normal short question', () => {
  assert.equal(getCloudRecordingError(1200, 4096), null)
})
