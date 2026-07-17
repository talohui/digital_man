import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./XiaolingAvatar.tsx', import.meta.url), 'utf8')

test('uses a cached portrait without creating another Live2D surface', () => {
  assert.match(source, /useXiaolingPortrait\(\)/)
  assert.doesNotMatch(source, /<canvas/)
  assert.doesNotMatch(source, /Live2DStage/)
})

