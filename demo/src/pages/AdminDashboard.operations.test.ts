import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('./AdminDashboard.tsx', import.meta.url), 'utf8')

test('keeps the dashboard as a signal inbox and sends strategy work to the decision center', () => {
  assert.match(page, /今日运营待办/)
  assert.match(page, /仅展示实时异常与机会信号/)
  assert.match(page, /进入 AI 决策中心/)
  assert.match(page, /navigate\('\/admin\/decision'\)/)
  assert.doesNotMatch(page, /建议优化推荐卡文案与排序/)
  assert.doesNotMatch(page, /可补充对应知识库内容或设置首页快捷入口/)
})

test('uses the shared one-second demo timeline without accelerating backend polling', () => {
  assert.match(page, /useDemoTicker/)
  assert.match(page, /buildAdminDemoFrame/)
  assert.match(page, /演示数据 · 非真实运营/)
  assert.match(page, /每 1 秒更新/)
  assert.match(page, /setInterval\(load, 15000\)/)
  assert.doesNotMatch(page, /setInterval\(load, 1000\)/)
})
