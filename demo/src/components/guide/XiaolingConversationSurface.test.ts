import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./XiaolingConversationSurface.tsx', import.meta.url), 'utf8')

test('drawer and fullscreen share one conversation timeline', () => {
  assert.match(source, /const content = \(/)
  assert.match(source, /<GuideMessageTimeline messages=\{messages\}/)
  assert.match(source, /if \(mode === 'fullscreen'\) return content/)
  assert.equal((source.match(/<GuideMessageTimeline/g) ?? []).length, 1)
})

