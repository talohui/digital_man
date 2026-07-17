import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addEmotionInstructionToPrompt,
  createFayEmotionCue,
  detectUserEmotionIntent,
  getReplyEmotionStateForUserText,
  resolveReplyRobotState
} from './fayEmotion.ts'

test('createFayEmotionCue maps positive sentiment and thanks to happy cue', () => {
  const cue = createFayEmotionCue({ Data: { Sentiment: 2 } }, '谢谢你，讲得真好')

  assert.equal(cue.tone, 'happy')
  assert.equal(cue.robotState, 'happy')
  assert.equal(cue.speechRateHint, 'lively')
})

test('createFayEmotionCue keeps neutral sentiment as normal guide state', () => {
  const cue = createFayEmotionCue({ Data: { Sentiment: 1 } }, '灵山大佛有多高')

  assert.equal(cue.tone, 'neutral')
  assert.equal(cue.robotState, 'normal')
  assert.equal(cue.speechRateHint, 'normal')
})

test('createFayEmotionCue maps negative and anxious labels to comfort cue', () => {
  const cue = createFayEmotionCue({ Data: { Sentiment: 0, Emotion: 'anxious' } }, '我有点担心会迷路')

  assert.equal(cue.tone, 'comfort')
  assert.equal(cue.robotState, 'comfort')
  assert.equal(cue.shouldEmpathize, true)
  assert.equal(cue.speechRateHint, 'slow')
})

test('detectUserEmotionIntent treats confusion as thinking intent', () => {
  assert.equal(detectUserEmotionIntent('这个我不太懂，能详细说说吗'), 'confused')
})

test('addEmotionInstructionToPrompt adds detailed instruction for confused users', () => {
  const prompt = addEmotionInstructionToPrompt('游客问题：这个我不太懂', '这个我不太懂')

  assert.match(prompt, /更详细/)
  assert.match(prompt, /分步骤/)
})

test('keeps the user concern state while Fay reports generic speaking', () => {
  assert.equal(getReplyEmotionStateForUserText('我很担心会迷路'), 'comfort')
  assert.equal(
    resolveReplyRobotState('comfort', 'speaking', createFayEmotionCue({}, '')),
    'comfort'
  )
})

test('keeps an explicit smile for gratitude without forcing neutral questions to smile', () => {
  assert.equal(getReplyEmotionStateForUserText('谢谢你，讲得真好'), 'happy')
  assert.equal(getReplyEmotionStateForUserText('灵山大佛有多高'), null)
})

test('strong negative user messages enter the comfort state', () => {
  for (const text of ['我好痛苦', '我快撑不住了', '我感到绝望', '我想哭']) {
    assert.equal(getReplyEmotionStateForUserText(text), 'comfort', text)
  }
  assert.equal(getReplyEmotionStateForUserText('灵山大佛有多高'), null)
})

test('keeps user concern when the assistant reply sounds upbeat', () => {
  assert.equal(
    resolveReplyRobotState(
      'comfort',
      'speaking',
      createFayEmotionCue({ Data: { Sentiment: 2 } }, '很高兴为你服务')
    ),
    'comfort'
  )
})

test('keeps confusion as thinking throughout the reply', () => {
  assert.equal(getReplyEmotionStateForUserText('我还是不太懂'), 'thinking')
  assert.equal(
    resolveReplyRobotState('thinking', 'speaking', createFayEmotionCue({}, '')),
    'thinking'
  )
})

test('lets neutral user questions follow the actual assistant transport state', () => {
  assert.equal(getReplyEmotionStateForUserText('灵山大佛有多高'), null)
  assert.equal(
    resolveReplyRobotState(null, 'speaking', createFayEmotionCue({ Data: { Sentiment: 2 } }, '')),
    'happy'
  )
  assert.equal(resolveReplyRobotState(null, 'speaking', createFayEmotionCue({}, '')), 'speaking')
})
