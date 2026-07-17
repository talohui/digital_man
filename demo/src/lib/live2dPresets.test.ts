import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_LIVE2D_PRESET,
  findLive2DPreset,
  listLive2DPresets,
  resolveLive2DPreset
} from './live2dPresets.ts'

test('uses 雅致 as the default after removing the legacy default costume', () => {
  assert.equal(DEFAULT_LIVE2D_PRESET.id, 'haru-final')
  assert.equal(DEFAULT_LIVE2D_PRESET.modelUrl, '/live2d/haru_final/haru_final.model3.json')
  assert.equal(DEFAULT_LIVE2D_PRESET.supportsCostumes, false)
})

test('lists only the three supplied local costume presets', () => {
  assert.deepEqual(
    listLive2DPresets().map((preset) => preset.id),
    ['haru-final', 'haru-second', 'haru-third']
  )
})

test('recognises supplied model URLs and prevents incompatible costume use', () => {
  const preset = findLive2DPreset('/live2d/haru_second/haru_second.model3.json')
  assert.equal(preset?.id, 'haru-second')
  assert.equal(preset?.supportsCostumes, false)
})

test('resolves an unknown or empty configured URL to the 雅致 preset', () => {
  assert.equal(resolveLive2DPreset('').id, 'haru-final')
  assert.equal(resolveLive2DPreset('/legacy/or/unknown.model3.json').id, 'haru-final')
})
