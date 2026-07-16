import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const entry = readFileSync(new URL('./MobileProfilePage.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('./MobileProfilePageV2.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../styles/c-app/mobileProfileV2.css', import.meta.url), 'utf8')

test('promotes the profile experience to the formal /me route', () => {
  assert.match(app, /path="\/me"\s+element=\{<MobileProfilePage\s*\/>\}/)
  assert.doesNotMatch(app, /path="\/me-v2"/)
  assert.match(entry, /MobileProfilePageV2/)
})

test('returns from Xiaoling to the formal profile route', () => {
  assert.match(page, /\/guide\?returnTo=%2Fme'/)
  assert.doesNotMatch(page, /returnTo=%2Fme-v2/)
})

test('keeps the profile page on bundled local fonts', () => {
  assert.match(styles, /--font-lingshan-display:\s*"LingshanSerif"/)
  assert.match(styles, /--font-lingshan-body:\s*"LingshanSans"/)
  assert.doesNotMatch(styles, /https?:\/\//)
})
