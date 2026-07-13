import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const page = readFileSync(new URL('./GuideImmersivePage.tsx', import.meta.url), 'utf8')

test('uses the existing Live2D and ChatPanel in the immersive guide', () => {
  assert.match(page, /<Live2DStage[^>]*variant="immersive"/)
  assert.match(page, /<ChatPanel sceneId=\{DEFAULT_SCENE_ID\}/)
  assert.match(page, /navigate\('\/guide\/classic'\)/)
})

test('keeps the chat composer on the guide stage instead of in a drawer', () => {
  assert.match(page, /immersive-guide__chat/)
  assert.doesNotMatch(page, /<Drawer/)
  assert.doesNotMatch(page, /setChatOpen/)
})
