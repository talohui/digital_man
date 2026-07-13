import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./GlobalXiaolingAssistant.tsx', import.meta.url), 'utf8')

test('owns one persistent Live2D stage for all presentation modes', () => {
  assert.equal((source.match(/<Live2DStage/g) ?? []).length, 1)
  assert.match(source, /data-xiaoling-live2d-mode=\{presentationMode\}/)
  assert.match(source, /data-xiaoling-live2d-instance=\{live2dInstanceId\}/)
  assert.match(source, /data-xiaoling-portrait-ready=/)
})

