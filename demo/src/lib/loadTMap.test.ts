import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./loadTMap.ts', import.meta.url), 'utf8')

test('loads both model and visualization Tencent Map libraries', () => {
  assert.match(source, /TMAP_SCRIPT_LIBRARIES = 'model,visualization'/)
})
