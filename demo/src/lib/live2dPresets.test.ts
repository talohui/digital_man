import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_LIVE2D_PRESET,
  findLive2DPreset,
  listLive2DPresets,
  resolveLive2DPreset
} from './live2dPresets.ts'

test('keeps the existing local 小灵 model as the default preset', () => {
  assert.equal(DEFAULT_LIVE2D_PRESET.id, 'default')
  assert.equal(DEFAULT_LIVE2D_PRESET.modelUrl, '/live2d/haru/haru_greeter_t03.model3.json')
  assert.equal(DEFAULT_LIVE2D_PRESET.supportsCostumes, true)
})

test('lists the default model plus all three supplied local models', () => {
  assert.deepEqual(
    listLive2DPresets().map((preset) => preset.id),
    ['default', 'haru-final', 'haru-second', 'haru-third']
  )
})

test('recognises supplied model URLs and prevents incompatible costume use', () => {
  const preset = findLive2DPreset('/live2d/haru_second/haru_second.model3.json')
  assert.equal(preset?.id, 'haru-second')
  assert.equal(preset?.supportsCostumes, false)
})

test('resolves an unknown or empty configured URL to the unchanged default preset', () => {
  assert.equal(resolveLive2DPreset('').id, 'default')
  assert.equal(resolveLive2DPreset('/legacy/or/unknown.model3.json').id, 'default')
})
