import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('./MobileGuidePageV2.tsx', import.meta.url), 'utf8')

test('mounts guide v2 only as a development preview', () => {
  assert.match(app, /import\.meta\.env\.DEV \? <Route path="\/guide-v2"/)
  assert.match(app, /location\.pathname === '\/guide-v2'/)
})

test('reuses the formal Xiaoling conversation and voice-capable ChatPanel', () => {
  assert.match(page, /useChatStore/)
  assert.match(page, /<ChatPanel sceneId=\{TOUR_GUIDE_SCENE_ID\}/)
  assert.match(page, /sendQuickAsk\(question, TOUR_GUIDE_SCENE_ID\)/)
  assert.doesNotMatch(page, /语音输入暂未接入|原型会话仅保留在当前页面|buildReply/)
})
