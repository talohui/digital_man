import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./resolveXiaolingDrawerBackground.ts', import.meta.url), 'utf8')

test('drawer background follows route stage context', () => {
  assert.match(source, /route-preview[^\n]+getRouteMedia\(context\.routeId\)/)
  assert.match(source, /stage === 'joining'[\s\S]*?getPoiMedia\(context\.currentStopPoiId\)/)
  assert.match(source, /stage === 'active'[\s\S]*?nextStopPoiId \?\? context\.currentStopPoiId[\s\S]*?getPoiMedia\(poiId\)/)
  assert.match(source, /stage === 'arrived'[\s\S]*?getPoiMedia\(context\.currentStopPoiId\)/)
})

test('POI drawer background uses selected POI media', () => {
  assert.match(source, /context\.page === 'poi'[\s\S]*?getPoiMedia\(context\.selectedPoiId\)/)
})

test('background descriptor exposes stable context keys and ordered fallbacks', () => {
  assert.match(source, /drawerBackground[\s\S]*?cover[\s\S]*?gallery\?\.\[0\][\s\S]*?SCENIC_MEDIA_FALLBACK/)
  assert.match(source, /route:\$\{routeId\}:active:\$\{poiId\}/)
  assert.match(source, /browse:lingshan/)
})
