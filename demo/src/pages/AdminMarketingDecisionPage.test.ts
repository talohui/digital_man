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
