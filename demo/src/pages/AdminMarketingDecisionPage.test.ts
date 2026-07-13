import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const page = readFileSync(new URL('./AdminMarketingDecisionPage.tsx', import.meta.url), 'utf8')

test('renders the standalone Next Best Action decision workspace', () => {
  assert.match(page, /Next Best Action 待办/)
  assert.match(page, /证据来源/)
  assert.match(page, /\/admin\/heatmap/)
  assert.match(page, /\/dashboard\/marketing-decision/)
  assert.match(page, /\/decision\/cards/)
})

test('registers the decision workspace in the new B-end routes', () => {
  const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
  assert.match(app, /path="\/admin\/decision"\s+element=\{<AdminMarketingDecisionPage\s*\/>\}/)
})

test('shows LLM, rule fallback and demo source labels', () => {
  assert.match(page, /大模型生成/)
  assert.match(page, /规则兜底/)
  assert.match(page, /演示样例/)
  assert.match(page, /generatedAt/)
})

test('force refresh calls analytics and every terminal state clears loading', () => {
  assert.match(page, /forceRefresh=true/)
  assert.match(page, /重新生成/)
  assert.match(page, /setLoading\(false\)/)
  assert.match(page, /finally/)
})

test('prevents narrow viewport overflow', () => {
  assert.match(page, /overflowX:\s*'hidden'/)
  assert.match(page, /flexWrap:\s*'wrap'/)
  assert.match(page, /minWidth:\s*0/)
})
