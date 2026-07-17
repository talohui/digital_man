import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const layer = readFileSync(new URL('./EmergencyAlertLayer.tsx', import.meta.url), 'utf8')
const fay = readFileSync(new URL('../api/fay.ts', import.meta.url), 'utf8')
const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const emergencyApi = readFileSync(new URL('../api/emergencies.ts', import.meta.url), 'utf8')
const activeEmergencyHook = readFileSync(new URL('../hooks/useActiveEmergencies.ts', import.meta.url), 'utf8')

test('announces exact emergency copy through Fay with browser speech fallback', () => {
  assert.match(layer, /sendExactSpeechToFay/)
  assert.match(layer, /speechSynthesis/)
  assert.match(layer, /getFayUsername/)
  assert.match(fay, /transparent-pass/)
  assert.match(fay, /queue:\s*true/)
})

test('mounts alerts globally on C routes and refreshes other tabs after mutations', () => {
  assert.match(app, /import EmergencyAlertLayer/)
  assert.match(app, /!isAdminRoute \? <EmergencyAlertLayer \/>/)
  assert.match(emergencyApi, /EMERGENCY_REFRESH_KEY/)
  assert.match(activeEmergencyHook, /addEventListener\('storage'/)
})
