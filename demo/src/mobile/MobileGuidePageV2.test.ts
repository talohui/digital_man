import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('./MobileGuidePageV2.tsx', import.meta.url), 'utf8')

test('mounts guide v2 only as a development preview', () => {
  assert.match(app, /import\.meta\.env\.DEV \? <Route path="\/guide-v2"/)
  assert.match(app, /location\.pathname === '\/guide-v2'/)
})

test('keeps the prototype conversation isolated from formal guide and Fay state', () => {
  assert.doesNotMatch(page, /useGuideSessionStore|useChatStore|sendTextToFay|Live2DStage|saveCAppReturnContext/)
  assert.match(page, /useState<PrototypeMessage\[]>\(INITIAL_MESSAGES\)/)
  assert.match(page, /原型会话仅保留在当前页面/)
})
