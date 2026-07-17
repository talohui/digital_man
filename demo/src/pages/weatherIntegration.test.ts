import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const mobileHome = readFileSync(new URL('../mobile/MobileHomePage.tsx', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('./AdminDashboard.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8')

test('visitor home loads local weather and offers its route advice as a plan entry', () => {
  assert.match(mobileHome, /fetchScenicWeather/)
  assert.match(mobileHome, /mobile-weather-card/)
  assert.match(mobileHome, /routeAdvice/)
  assert.match(mobileHome, /navigate\('\/plan'\)/)
})

test('operations dashboard shows weather in the real-time overview without a separate external request', () => {
  assert.match(dashboard, /fetchScenicWeather/)
  assert.match(dashboard, /当前景区天气/)
  assert.match(dashboard, /weather\.temperature/)
})

test('weather card follows the existing warm Lingshan mobile visual language', () => {
  assert.match(styles, /\.mobile-weather-card/)
  assert.match(styles, /--color-daiqing/)
})
