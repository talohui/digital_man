import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('./ScenicMapPage.tsx', import.meta.url), 'utf8')

test('drives the heatmap from the shared one-second demo tick', () => {
  assert.match(page, /useDemoTicker\(true\)/)
  assert.match(page, /buildAdminDemoFrame/)
  assert.match(page, /createSeededRandom\(demoTick\)/)
  assert.doesNotMatch(page, /TICK_INTERVAL_MS/)
  assert.doesNotMatch(page, /setInterval\(updateHeatmap/)
})

test('keeps Tencent map initialization isolated from tick updates', () => {
  assert.match(page, /async function initTencentHeatmap/)
  assert.match(page, /\}, \[\]\)/)
  assert.match(page, /heatDataSetterRef\.current\?\.\(heatData\)/)
})
