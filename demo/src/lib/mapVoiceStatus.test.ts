import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const statusPath = new URL('./mapVoiceStatus.ts', import.meta.url)

async function loadStatus() {
  assert.equal(existsSync(statusPath), true)
  return import('./mapVoiceStatus.ts')
}

test('keeps recording state ahead of sending and answered states', async () => {
  const { getMapVoiceStatus } = await loadStatus()
  assert.equal(
    getMapVoiceStatus({ isRecording: true, isSending: true, hasAnswered: true, error: '' }),
    'recording'
  )
})

test('shows the answering state while Fay is responding', async () => {
  const { getMapVoiceStatus } = await loadStatus()
  assert.equal(
    getMapVoiceStatus({ isRecording: false, isSending: true, hasAnswered: true, error: '' }),
    'answering'
  )
})

test('shows an error before the idle prompt', async () => {
  const { getMapVoiceStatus } = await loadStatus()
  assert.equal(
    getMapVoiceStatus({ isRecording: false, isSending: false, hasAnswered: false, error: '麦克风不可用' }),
    'error'
  )
})

test('surfaces the completed reply state before returning to idle', async () => {
  const { getMapVoiceStatus } = await loadStatus()
  assert.equal(
    getMapVoiceStatus({ isRecording: false, isSending: false, hasAnswered: true, error: '' }),
    'answered'
  )
  assert.equal(
    getMapVoiceStatus({ isRecording: false, isSending: false, hasAnswered: false, error: '' }),
    'idle'
  )
})
