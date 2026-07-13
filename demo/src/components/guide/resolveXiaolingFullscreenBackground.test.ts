import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./resolveXiaolingFullscreenBackground.ts', import.meta.url), 'utf8')

test('resolves the fullscreen guide background from Fan Gong media', () => {
  assert.match(source, /getPoiMedia\('fan_gong'\)/)
  assert.match(source, /media\.drawerBackground/)
  assert.match(source, /media\.cover/)
  assert.match(source, /media\.gallery\?\.\[0\]/)
})

