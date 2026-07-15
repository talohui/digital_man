import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const hookUrl = new URL('./useDemoTicker.ts', import.meta.url)
const source = existsSync(hookUrl) ? readFileSync(hookUrl, 'utf8') : ''

test('starts a one-second timer only when dynamic demo mode is enabled', () => {
  assert.match(source, /if \(!enabled\) return/)
  assert.match(source, /window\.setInterval\(sync, 1000\)/)
})

test('pauses hidden-page updates and resynchronizes when visibility changes', () => {
  assert.match(source, /document\.visibilityState !== 'hidden'/)
  assert.match(source, /document\.addEventListener\('visibilitychange', sync\)/)
})

test('cleans up both the interval and visibility listener', () => {
  assert.match(source, /window\.clearInterval\(timer\)/)
  assert.match(source, /document\.removeEventListener\('visibilitychange', sync\)/)
})
