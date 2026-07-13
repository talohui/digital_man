import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./GuideMessageTimeline.tsx', import.meta.url), 'utf8')

test('renders assistant text before structured guide content', () => {
  const bubbleIndex = source.indexOf('className={`chat-bubble chat-bubble--${message.role}`}')
  const structuredIndex = source.indexOf('className="guide-message__structured"')

  assert.ok(bubbleIndex >= 0)
  assert.ok(structuredIndex > bubbleIndex)
  assert.match(source, /GuideActionCardRenderer payload=\{message\.ui\}/)
})

