import assert from 'node:assert/strict'
import test from 'node:test'

import { createChatSession, DEFAULT_ASSISTANT_GREETING } from './chatSessions.ts'

test('new chat sessions do not carry an emotion from an earlier reply', () => {
  assert.equal(createChatSession('tour-guide').robotState, 'happy')
  assert.equal(createChatSession('tour-guide').replyEmotionState, null)
})

test('the default greeting only refers to controls that are present on the guide', () => {
  assert.doesNotMatch(DEFAULT_ASSISTANT_GREETING, /热门问题/)
  assert.match(DEFAULT_ASSISTANT_GREETING, /打字|麦克风/)
})
