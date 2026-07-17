import assert from 'node:assert/strict'
import test from 'node:test'

test('aborting playback stops the active Web Audio source and resets the mouth', async () => {
  let stopCalls = 0
  let markStarted: (() => void) | undefined
  const started = new Promise<void>((resolve) => {
    markStarted = resolve
  })
  const mouthFrames: Array<[number, number]> = []

  class FakeBufferSource {
    buffer: unknown = null
    onended: (() => void) | null = null

    connect() {}

    start() {
      markStarted?.()
    }

    stop() {
      stopCalls += 1
      this.onended?.()
    }
  }

  class FakeAnalyser {
    fftSize = 1024
    frequencyBinCount = 512

    connect() {}
    getByteTimeDomainData(data: Uint8Array) { data.fill(128) }
    getByteFrequencyData(data: Uint8Array) { data.fill(0) }
  }

  class FakeAudioContext {
    state = 'running'
    sampleRate = 44100
    destination = {}

    async resume() {}
    async decodeAudioData() { return { duration: 60 } }
    createBufferSource() { return new FakeBufferSource() }
    createAnalyser() { return new FakeAnalyser() }
  }

  Object.assign(globalThis, {
    window: {
      AudioContext: FakeAudioContext,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    },
    fetch: async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8)
    }),
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => undefined
  })

  const { playWithLipsync } = await import('./audioLipsync.ts?interrupt-playback')
  const controller = new AbortController()
  const playback = playWithLipsync(
    '/audio/test.wav',
    (open, form) => mouthFrames.push([open, form]),
    controller.signal
  )

  await started
  controller.abort()
  await playback

  assert.equal(stopCalls, 1)
  assert.deepEqual(mouthFrames.at(-1), [0, 0])
})
