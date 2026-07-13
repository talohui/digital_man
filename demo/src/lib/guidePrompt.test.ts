import assert from 'node:assert/strict'
import test from 'node:test'
import { buildGuidePrompt, isCasualTurn } from './guidePrompt.ts'
import type { GuideContext } from '../store/chatSessions.ts'

const guideContext: GuideContext = {
  routeId: 'historical_culture',
  routeName: '历史文化路线',
  spotId: 'screen-wall',
  spotName: '灵山大照壁',
  spotIntro: '这里是历史文化路线的起点。',
  spotNarrative: '讲解灵山大照壁的文化门面。',
  locationSource: 'map-selection',
  locationConfidence: 1,
  visitedSpotIds: ['south-gate']
}

test('isCasualTurn detects short greetings and polite replies', () => {
  assert.equal(isCasualTurn('你好'), true)
  assert.equal(isCasualTurn('你好！'), true)
  assert.equal(isCasualTurn('谢谢'), true)
  assert.equal(isCasualTurn('你好，灵山大佛有多高？'), false)
})

test('buildGuidePrompt keeps greetings free of route context', () => {
  assert.equal(buildGuidePrompt('你好', guideContext), '你好')
})

test('buildGuidePrompt keeps pure emotional support turns free of route context', () => {
  assert.equal(isCasualTurn('我好痛苦'), true)
  assert.equal(buildGuidePrompt('我好痛苦', guideContext), '我好痛苦')
  assert.equal(isCasualTurn('我很焦虑，灵山大佛怎么走'), false)
})

test('buildGuidePrompt still grounds explicit guide questions in the active scene', () => {
  const prompt = buildGuidePrompt('请讲解一下这一站', guideContext)

  assert.match(prompt, /当前路线：历史文化路线/)
  assert.match(prompt, /当前景点：灵山大照壁/)
  assert.match(prompt, /导览场景：route_id=historical_culture; spot_id=screen-wall; source=map-selection; confidence=1/)
  assert.match(prompt, /已游览景点ID：south-gate/)
  assert.match(prompt, /游客问题：请讲解一下这一站/)
})
