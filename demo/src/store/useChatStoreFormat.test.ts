import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const chatStoreSource = readFileSync(new URL('./useChatStore.ts', import.meta.url), 'utf8')

test('normalizes literal Fay line-break escapes before they reach Markdown rendering', () => {
  assert.match(chatStoreSource, /function decodeFayDisplayNewlines\(value: string\)/)
  assert.match(chatStoreSource, /decodeFayDisplayNewlines\(s\)/)
  assert.match(chatStoreSource, /\\\\r\\\\n\|\\\\n\|\\\\r/)
})
