import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./GuideActionCardRenderer.tsx', import.meta.url), 'utf8')

test('renders every route card supplied by the guide payload', () => {
  assert.match(source, /payload\.items\.map\(\(item\) =>/)
  assert.match(source, /key=\{item\.routeId\}/)
  assert.doesNotMatch(source, /payload\.items\[0\]/)
})

