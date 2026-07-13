import assert from 'node:assert/strict'
import test from 'node:test'

test('unlockAudio reports success only after the mobile audio context is running', async () => {
  let resumeCalls = 0

  class FakeAudioContext {
    state = 'suspended'

    async resume() {
      resumeCalls += 1
      this.state = 'running'
    }
  }

  Object.assign(globalThis, {
    window: { AudioContext: FakeAudioContext }
  })

  const { unlockAudio } = await import('./audioLipsync.ts')
  const unlocked = await unlockAudio()

  assert.equal(unlocked, true)
  assert.equal(resumeCalls, 1)
})
