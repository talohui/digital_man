import assert from 'node:assert/strict'
import test from 'node:test'
import { readCachedConsent, writeCachedConsent } from './privacyConsent.ts'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) }
  }
}

test('consent cache defaults to enabled and persists explicit withdrawal', () => {
  const storage = memoryStorage()
  assert.deepEqual(readCachedConsent('guest-a', storage), { personalizationEnabled: true, analyticsEnabled: true })
  writeCachedConsent('guest-a', { personalizationEnabled: false, analyticsEnabled: false }, storage)
  assert.deepEqual(readCachedConsent('guest-a', storage), { personalizationEnabled: false, analyticsEnabled: false })
  assert.deepEqual(readCachedConsent('guest-b', storage), { personalizationEnabled: true, analyticsEnabled: true })
})
