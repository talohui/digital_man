import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const main = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8')
const mobileHome = readFileSync(new URL('../mobile/MobileHomePage.tsx', import.meta.url), 'utf8')

test('registers the production map, poi detail and route guide paths', () => {
  assert.match(app, /path="\/map"\s+element=\{<LegacyMapRedirect\s*\/>\}/)
  assert.match(app, /path="\/spot\/:spotId"\s+element=\{<LegacySpotRedirect\s*\/>\}/)
  assert.match(app, /path="\/map-3d-guide-c"/)
  assert.match(app, /path="\/map-3d-guide-c\/poi\/:poiId"/)
  assert.match(app, /path="\/map-3d-guide-c\/route\/:routeId"/)
})

test('home crowd controls enter the map and preserve poi return context', () => {
  assert.match(mobileHome, /navigate\('\/map-3d-guide-c'\)/)
  assert.match(mobileHome, /saveHomeReturn\('home-crowd'/)
  assert.match(mobileHome, /\/map-3d-guide-c\/poi\/\$\{encodeURIComponent\(spot\.id\)\}\?from=browse/)
})

test('loads the C-app local typography without applying it from the admin shell', () => {
  assert.match(main, /import '\.\/styles\/c-app\/cAppTypography\.css'/)
  assert.equal(existsSync(new URL('../styles/c-app/cAppTypography.css', import.meta.url)), true)
})

test('includes the production GLB runtime controllers', () => {
  assert.equal(existsSync(new URL('../lib/map/GLBMemoryManager.ts', import.meta.url)), true)
  assert.equal(existsSync(new URL('../lib/map/GLBRuntimeOrchestrator.ts', import.meta.url)), true)
  assert.equal(existsSync(new URL('../lib/map/GLBSpatialController.ts', import.meta.url)), true)
})
