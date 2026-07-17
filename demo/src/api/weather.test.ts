import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const weatherApi = readFileSync(new URL('./weather.ts', import.meta.url), 'utf8')

test('weather API is proxied through analytics rather than exposing Tencent credentials to the browser', () => {
  assert.match(weatherApi, /getAnalyticsApiBase/)
  assert.match(weatherApi, /public\/weather/)
  assert.doesNotMatch(weatherApi, /apis\.map\.qq\.com|TENCENT_WEATHER_KEY/)
})

test('weather API has an eight second timeout and degrades to null', () => {
  assert.match(weatherApi, /AbortController/)
  assert.match(weatherApi, /8000/)
  assert.match(weatherApi, /return null/)
  assert.match(weatherApi, /clearTimeout/)
})
