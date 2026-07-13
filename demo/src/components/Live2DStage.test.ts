import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./Live2DStage.tsx', import.meta.url), 'utf8')

test('declares the immersive Live2D variant', () => {
  assert.match(source, /variant\?: 'default' \| 'embedded' \| 'immersive'/)
  assert.match(source, /const isImmersive = variant === 'immersive'/)
})

test('omits dashboard metrics from the immersive Live2D stage', () => {
  assert.match(source, /\{!isEmbedded && !isImmersive \? \(/)
})

test('keeps the Live2D instance stable while presentation mode changes', () => {
  assert.match(source, /instanceIdRef = useRef\(''\)/)
  assert.match(source, /instanceIdRef\.current = `xiaoling-live2d-/)
  assert.match(source, /\}, \[isInView, resolvedSceneId\]\)/)
  assert.doesNotMatch(source, /\[isInView, resolvedSceneId, presentationMode\]/)
  assert.match(source, /data-xiaoling-live2d-instance=\{instanceIdRef\.current\}/)
})
