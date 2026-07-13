import assert from 'node:assert/strict'
import test, { after, beforeEach } from 'node:test'

import { getMapResumeUrl, readMapResumeState, saveMapResumeState } from './mapResumeState.ts'

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

test('map resume preserves route URL and camera values', () => {
  const map = {
    getCenter: () => ({ lat: 31.42, lng: 120.15 }),
    getZoom: () => 17.2,
    getPitch: () => 43,
    getRotation: () => 18
  }
  const url = '/map-3d-guide-c/route/family?stage=active&stop=2&presentation=scenic3d'
  saveMapResumeState({ url, map, presentation: 'scenic3d' })
  assert.equal(getMapResumeUrl(), url)
  assert.deepEqual(readMapResumeState()?.camera, {
    center: { lat: 31.42, lng: 120.15 }, zoom: 17.2, pitch: 43, rotation: 18, presentation: 'scenic3d'
  })
})

test('expired or invalid route snapshots fall back to browse map', () => {
  saveMapResumeState({ url: '/map-3d-guide-c/route/family?stage=arrived&stop=3', presentation: 'ink2d' })
  const key = storage.key(0)
  assert.ok(key)
  const expired = JSON.parse(storage.getItem(key) ?? '{}')
  storage.setItem(key, JSON.stringify({ ...expired, savedAt: Date.now() - 2 * 60 * 60 * 1000 - 1 }))
  assert.equal(getMapResumeUrl(), '/map-3d-guide-c')
  assert.equal(saveMapResumeState({ url: '/map-3d-guide-c/route/not-a-route', presentation: 'ink2d' }), undefined)
})

