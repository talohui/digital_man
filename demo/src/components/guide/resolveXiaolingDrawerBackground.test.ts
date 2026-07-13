import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./resolveXiaolingDrawerBackground.ts', import.meta.url), 'utf8')

test('drawer background follows route stage context', () => {
  assert.match(source, /stage === 'preview'[^\n]+getRouteMedia\(context\.routeId\)/)
  assert.match(source, /stage === 'joining'[^\n]+getPoiMedia\(context\.currentStopPoiId\)/)
  assert.match(source, /stage === 'active'[^\n]+getPoiMedia\(context\.nextStopPoiId \?\? context\.currentStopPoiId\)/)
  assert.match(source, /stage === 'arrived'[^\n]+getPoiMedia\(context\.currentStopPoiId\)/)
})

test('POI drawer background uses selected POI media', () => {
  assert.match(source, /context\.page === 'poi'[\s\S]*?getPoiMedia\(context\.selectedPoiId\)/)
})
