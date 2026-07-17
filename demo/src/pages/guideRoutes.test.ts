import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const routeCard = readFileSync(new URL('../components/RouteCard.tsx', import.meta.url), 'utf8')
const routePage = readFileSync(new URL('../mobile/MobileRoutePlanPageV2.tsx', import.meta.url), 'utf8')
const routeRecommendationStep = readFileSync(new URL('../components/mobile/route/RouteRecommendationStep.tsx', import.meta.url), 'utf8')
const guideApi = readFileSync(new URL('../api/guide.ts', import.meta.url), 'utf8')

test('keeps a classic guide route while making immersive guide the default', () => {
  assert.match(app, /path="\/guide"\s+element=\{<GuideImmersivePage\s*\/>\}/)
  assert.match(app, /path="\/guide\/classic"\s+element=\{<HomePage\s*\/>\}/)
})

test('route UI preserves emergency adjustment metadata and visitor heat label', () => {
  assert.match(routeCard, /adjustmentReasons/)
  assert.match(routePage, /routeAdjustmentReasons/)
  assert.match(routeRecommendationStep, /游客端访问热度/)
  assert.match(guideApi, /fallbackUsed/)
  assert.match(guideApi, /dataFreshness/)
})
