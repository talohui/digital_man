import assert from 'node:assert/strict'
import test, { after, beforeEach } from 'node:test'

import {
  normalizeInternalReturnTo,
  readCAppReturnContext,
  resolveCAppReturnTarget,
  resolveHomeCrowdPoiReturn,
  resolveSpotsListPoiReturn,
  saveCAppReturnContext
} from './cAppReturnContext.ts'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { origin: 'https://lingshan.test' }, sessionStorage: storage }
})

beforeEach(() => storage.clear())
after(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('returnTo accepts only same-origin internal URLs', () => {
  assert.equal(normalizeInternalReturnTo('/?tab=home#crowd'), '/?tab=home#crowd')
  assert.equal(normalizeInternalReturnTo('https://lingshan.test/consume?from=guide'), '/consume?from=guide')
  assert.equal(normalizeInternalReturnTo('https://evil.example/phish'), undefined)
  assert.equal(normalizeInternalReturnTo('//evil.example/phish'), undefined)
})

test('home crowd POI returns only to its matching saved homepage context', () => {
  const saved = saveCAppReturnContext({
    source: 'home-crowd', returnTo: '/?tab=home', returnScrollY: 640,
    returnAnchor: 'c-app-home-crowd', poiId: 'lingshan_wall'
  })
  assert.equal(resolveHomeCrowdPoiReturn(saved, 'lingshan_wall'), '/?tab=home')
  assert.equal(resolveHomeCrowdPoiReturn(saved, 'jiulong_guanyu'), undefined)
})

test('spots list POI returns only to its matching list context', () => {
  const saved = saveCAppReturnContext({
    source: 'spots-list', returnTo: '/spots', returnScrollY: 420, poiId: 'giant_buddha'
  })
  assert.equal(resolveSpotsListPoiReturn(saved, 'giant_buddha'), '/spots')
  assert.equal(resolveSpotsListPoiReturn(saved, 'fan_gong'), undefined)
})

test('/guide return prefers stored context and preserves full route URL', () => {
  const saved = saveCAppReturnContext({
    source: 'map-route',
    returnTo: '/map-3d-guide-c/route/family?stage=active&stop=2&presentation=scenic3d',
    conversationKey: 'route:family', reopenDrawer: true
  })
  assert.equal(
    resolveCAppReturnTarget({ context: readCAppReturnContext(), queryReturnTo: '/', fallback: '/map-3d-guide-c' }),
    saved?.returnTo
  )
})
