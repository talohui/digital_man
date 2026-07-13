import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')

test('keeps a classic guide route while making the shared Xiaoling surface the default', () => {
  assert.match(app, /path="\/guide"\s+element=\{<XiaolingFullscreenRoute\s*\/>\}/)
  assert.match(app, /path="\/guide\/classic"\s+element=\{<HomePage\s*\/>\}/)
})

test('keeps admin and main 3D routes without merge markers', () => {
  assert.doesNotMatch(app, /^(<<<<<<<|=======|>>>>>>>)/m)
  assert.match(app, /path="\/admin\/decision"/)
  assert.match(app, /path="\/admin\/config"/)
  assert.match(app, /path="\/map-3d-guide-c"/)
  assert.match(app, /path="\/map-3d-guide-c\/poi\/:poiId"/)
  assert.match(app, /path="\/map"\s+element=\{<LegacyMapRedirect\s*\/>\}/)
  assert.match(app, /path="\/spot\/:spotId"\s+element=\{<LegacySpotRedirect\s*\/>\}/)
})
