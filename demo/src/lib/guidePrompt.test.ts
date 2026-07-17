import assert from 'node:assert/strict'
import test from 'node:test'
import { buildGuidePrompt, isCasualTurn } from './guidePrompt.ts'
import type { GuideContext } from '../store/chatSessions.ts'

const guideContext: GuideContext = {
  routeId: 'historical_culture',
  routeName: '文化探秘路线',
  spotId: 'screen-wall',
  spotName: '灵山大照壁',
  spotIntro: '这里是文化探秘路线的起点。',
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

  assert.match(prompt, /当前路线：文化探秘路线/)
  assert.match(prompt, /当前景点：灵山大照壁/)
  assert.match(prompt, /导览场景：route_id=historical_culture; spot_id=screen-wall; source=map-selection/)
  assert.match(prompt, /当前景点是游客在地图中选中的浏览对象/)
  assert.doesNotMatch(prompt, /confidence=/)
  assert.match(prompt, /已游览景点ID：south-gate/)
  assert.match(prompt, /游客问题：请讲解一下这一站/)
})

test('buildGuidePrompt constrains route planning to the published route catalog', () => {
  const prompt = buildGuidePrompt('下午带父母来，想少走路，安静礼佛', {
    conversationMode: 'route-planning',
    routeName: '灵山路线规划',
    routePlanningProfile: '已选节奏：下午、长辈；兴趣心愿：祈福静心'
  })

  assert.match(prompt, /我建议你选择：/)
  assert.match(prompt, /历史文化爱好者路线、自然风光爱好者路线、亲子家庭路线/)
  assert.match(prompt, /游客原话：下午带父母来，想少走路，安静礼佛/)
})

test('buildGuidePrompt constrains ticket planning to the published fare catalog', () => {
  const prompt = buildGuidePrompt('一个老人，两个大人，想少走路', {
    conversationMode: 'ticket-planning',
    routeName: '灵山入园票笺',
    ticketPlanningProfile: '同行构成：陪长辈出行；游览节奏：舒缓慢游',
    ticketCatalogPrompt: '成人票 ¥210；半价票 ¥105；免费票 ¥0；网购联票 ¥225；观光车单独购票 ¥40/人'
  })

  assert.match(prompt, /成人票 ¥210/)
  assert.match(prompt, /半价票 ¥105/)
  assert.match(prompt, /网购联票 ¥225/)
  assert.match(prompt, /观光车单独购票 ¥40\/人/)
  assert.match(prompt, /不得替游客判断减免资格/)
  assert.match(prompt, /游客原话：一个老人，两个大人，想少走路/)
})

test('buildGuidePrompt constrains consume assistance to the real service catalog', () => {
  const prompt = buildGuidePrompt('带孩子想找一处安静吃饭的地方', {
    conversationMode: 'consume-assistant',
    routeName: '亲子家庭路线',
    spotName: '梵宫',
    consumeAssistantProfile: '当前分类：餐饮斋茶；当前位置：梵宫；今日路线：亲子家庭路线；游客偏好：亲子同行',
    consumeCatalogPrompt: '梵宫素斋 ¥68/人 · 梵宫东侧；禅意下午茶 ¥48/份 · 梵宫西廊'
  })

  assert.match(prompt, /梵宫素斋 ¥68\/人/)
  assert.match(prompt, /不得编造商品、套餐、折扣、库存/)
  assert.match(prompt, /游客原话：带孩子想找一处安静吃饭的地方/)
})
