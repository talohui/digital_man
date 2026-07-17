import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./GlobalXiaolingAssistant.tsx', import.meta.url), 'utf8')
const assistantStyles = readFileSync(new URL('../../styles/guide/guideAssistant.css', import.meta.url), 'utf8')

test('owns one persistent Live2D stage for all presentation modes', () => {
  assert.equal((source.match(/<Live2DStage/g) ?? []).length, 1)
  assert.match(source, /data-xiaoling-live2d-mode=\{presentationMode\}/)
  assert.match(source, /data-xiaoling-live2d-instance=\{live2dInstanceId\}/)
  assert.match(source, /data-xiaoling-portrait-ready=/)
  assert.match(source, /presentationFraming=\{presentationMode === 'badge' \? 'full-body' : 'upper-body'\}/)
  assert.match(source, /visualViewport\.height \* 0\.85/)
})

test('keeps the route badge ring and Live2D portrait on one fixed layer', () => {
  assert.match(source, /const usesAvatarOnlyBadge = presentationMode === 'badge'/)
  assert.match(source, /top: `\$\{routeAvatarAnchor\.top\}px`/)
  assert.match(source, /right: `\$\{routeAvatarAnchor\.right\}px`/)
  assert.match(source, /bottom: 'max\(94px, calc\(env\(safe-area-inset-bottom, 0px\) \+ 86px\)\)'/)
  assert.match(assistantStyles, /\.xiaoling-live2d-host\s*\{[\s\S]*?position:\s*absolute/)
  assert.match(assistantStyles, /\.xiaoling-live2d-host\.is-badge\s*\{[\s\S]*?transition:\s*none/)
  assert.match(
    assistantStyles,
    /data-guide-mode="route"\][\s\S]*?guide-floating-companion--avatar-only[\s\S]*?transition:\s*none/
  )
})
