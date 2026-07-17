import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

function read(relativeUrl: string) {
  const url = new URL(relativeUrl, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

const shell = read('../admin-ops/AdminOpsShell.tsx')
const decision = read('../../pages/AdminMarketingDecisionPage.tsx')
const float = read('./OperationsCopilotFloat.tsx')
const chat = read('./OperationsCopilotChat.tsx')
const styles = read('../../styles/admin-ops.css')

test('mounts one global Copilot entry outside the decision page content', () => {
  assert.match(shell, /<OperationsCopilotFloat\s*\/>/)
  assert.doesNotMatch(decision, /<OperationsCopilotPanel\s*\/>/)
})

test('opens a global chat drawer with an explicit global-data boundary', () => {
  assert.match(float, /运营 Copilot/)
  assert.match(float, /role="dialog"/)
  assert.match(chat, /全局运营数据/)
  assert.match(chat, /queryOperationsCopilot/)
})

test('keeps Copilot proposal confirmation and responsive floating styles', () => {
  assert.match(chat, /confirmOperationsCopilotProposal/)
  assert.match(chat, /loginServiceConfig/)
  assert.match(styles, /\.operations-copilot-float__drawer/)
  assert.match(styles, /@media \(max-width: 860px\)[\s\S]*operations-copilot-float__drawer/)
})

test('keeps a safe cross-page session and renders grounded structured analysis', () => {
  assert.match(chat, /readOperationsCopilotSession/)
  assert.match(chat, /saveOperationsCopilotSession/)
  assert.match(chat, /pageContext/)
  assert.match(chat, /判断依据/)
  assert.match(chat, /建议动作/)
  assert.match(chat, /执行风险/)
  assert.match(chat, /OperationsCopilotProposalEditor/)
  assert.match(chat, /OperationsCopilotExecutionResult/)
})

test('isolates the closed drawer and restores keyboard focus after closing', () => {
  assert.match(float, /inert=\{open \? undefined : ''\}/)
  assert.match(float, /drawerRef/)
  assert.match(float, /triggerRef\.current\?\.focus\(\)/)
  assert.match(float, /event\.key === 'Tab'/)
})

test('prevents a confirmation from submitting the same write twice', () => {
  assert.match(chat, /confirmingRef\.current/)
  assert.match(chat, /if \(confirmingRef\.current\) return/)
  assert.match(chat, /disabled=\{confirming\}/)
})

test('renders an uncertain downstream write as reconciling instead of a safe retry', () => {
  const executionResult = read('./OperationsCopilotExecutionResult.tsx')
  assert.match(executionResult, /RECONCILING/)
  assert.match(executionResult, /UNKNOWN/)
  assert.match(executionResult, /outcomeStatus/)
  assert.match(executionResult, /reconciliationStatus/)
  assert.match(executionResult, /请勿重复发布/)
})

test('respects mobile safe areas and reduced motion preferences', () => {
  assert.match(styles, /env\(safe-area-inset-bottom\)/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
})
