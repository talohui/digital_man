import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LINGSHAN_SPLASH_STORAGE_KEY,
  markLingshanSplashSeen,
  shouldShowLingshanSplash,
  type IntroStorage,
} from './introStorage.ts'

function createMemoryStorage(initialValue: string | null = null): IntroStorage {
  let value = initialValue

  return {
    getItem(key: string) {
      assert.equal(key, LINGSHAN_SPLASH_STORAGE_KEY)
      return value
    },
    setItem(key: string, nextValue: string) {
      assert.equal(key, LINGSHAN_SPLASH_STORAGE_KEY)
      value = nextValue
    },
  }
}

test('shouldShowLingshanSplash returns true for first-time visitors', () => {
  assert.equal(shouldShowLingshanSplash(createMemoryStorage()), true)
})

test('shouldShowLingshanSplash returns false after the splash has been seen', () => {
  assert.equal(shouldShowLingshanSplash(createMemoryStorage('true')), false)
})

test('markLingshanSplashSeen stores the persistent seen flag', () => {
  const storage = createMemoryStorage()

  markLingshanSplashSeen(storage)

  assert.equal(shouldShowLingshanSplash(storage), false)
})

test('splash storage helpers tolerate unavailable storage', () => {
  const brokenStorage: IntroStorage = {
    getItem() {
      throw new Error('storage unavailable')
    },
    setItem() {
      throw new Error('storage unavailable')
    },
  }

  assert.equal(shouldShowLingshanSplash(brokenStorage), true)
  assert.doesNotThrow(() => markLingshanSplashSeen(brokenStorage))
})
