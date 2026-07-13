import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { isNavigationDebugEnabled } from './navigationDebug.ts'

test('simulated navigation debug UI requires DEV and navigationDebug=1', () => {
  assert.equal(isNavigationDebugEnabled('?navigationDebug=1', true), true)
  assert.equal(isNavigationDebugEnabled('', true), false)
  assert.equal(isNavigationDebugEnabled('?navigationDebug=1', false), false)
})

test('route debug DOM and insecure-context fallback stay behind the debug view model', () => {
  const routePage = readFileSync(new URL('../pages/Map3DRouteGuidePage.tsx', import.meta.url), 'utf8')
  const viewModel = readFileSync(new URL('./navigationBetaViewModel.ts', import.meta.url), 'utf8')
  assert.match(routePage, /navigationDebugEnabled && debugMenuOpen/)
  assert.match(routePage, /navigationDebugEnabled \? \(/)
  assert.match(viewModel, /available: snapshot\.debugEnabled && snapshot\.simulatedNavigationAvailable/)
  assert.match(viewModel, /insecureContextFallback: snapshot\.debugEnabled && snapshot\.simulatedNavigationAvailable/)
})
