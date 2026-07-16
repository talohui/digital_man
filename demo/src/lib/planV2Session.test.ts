import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test, { after, beforeEach } from 'node:test'

import { guideRoutes } from '../data/guideData.ts'
import { getNextPlanningMode, getRouteStopTargetIndex, resolveInitialRouteStopId } from './planV2Interactions.ts'
import { readPlanV2Session, savePlanV2Session } from './planV2Session.ts'
import { createRoutePlanState, routePlanReducer } from './routePlanState.ts'

const scenicRoutesSource = readFileSync(new URL('../data/lingshanScenicRoutes.ts', import.meta.url), 'utf8')
const planV2Source = readFileSync(new URL('../mobile/MobileRoutePlanPageV2.tsx', import.meta.url), 'utf8')
const formalPlanEntrySource = readFileSync(new URL('../mobile/MobileRoutePlanPage.tsx', import.meta.url), 'utf8')
const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const planV2Styles = readFileSync(new URL('../styles/c-app/planV2.css', import.meta.url), 'utf8')
const routeFolioStyles = readFileSync(new URL('../styles/c-app/routeItineraryFolio.css', import.meta.url), 'utf8')
const bottomNavStyles = readFileSync(new URL('../styles/c-app/cAppBottomNav.css', import.meta.url), 'utf8')
const routeFolioSource = readFileSync(new URL('../components/mobile/route/RouteItineraryFolio.tsx', import.meta.url), 'utf8')
const bottomSheetSource = readFileSync(new URL('../components/mobile/overlays/CAppBottomSheet.tsx', import.meta.url), 'utf8')
const modeBookSource = readFileSync(new URL('../components/mobile/route/RoutePlanningModeBook.tsx', import.meta.url), 'utf8')
const preferenceStepsSource = readFileSync(new URL('../components/mobile/route/RoutePreferenceSteps.tsx', import.meta.url), 'utf8')
const recommendationStepSource = readFileSync(new URL('../components/mobile/route/RouteRecommendationStep.tsx', import.meta.url), 'utf8')
const assistantSheetSource = readFileSync(new URL('../components/mobile/route/RoutePlannerAssistantSheet.tsx', import.meta.url), 'utf8')

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { sessionStorage: storage }
})

beforeEach(() => storage.clear())
after(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('formal plan session restores route, step, stop and scroll position', () => {
  savePlanV2Session({
    selectedRouteId: 'prayer_meditation',
    hasChosenRoute: true,
    activeStep: 3,
    selectedStopId: 'giant_buddha',
    scrollY: 1280
  })

  const restored = readPlanV2Session()
  assert.ok(restored)
  assert.equal(restored.selectedRouteId, 'prayer_meditation')
  assert.equal(restored.hasChosenRoute, true)
  assert.equal(restored.activeStep, 3)
  assert.equal(restored.selectedStopId, 'giant_buddha')
  assert.equal(restored.scrollY, 1280)
})

test('formal plan session drops expired snapshots', () => {
  savePlanV2Session({
    selectedRouteId: 'family',
    hasChosenRoute: true,
    activeStep: 3,
    scrollY: 200
  })
  const key = storage.key(0)
  assert.ok(key)
  const snapshot = JSON.parse(storage.getItem(key) ?? '{}')
  storage.setItem(key, JSON.stringify({ ...snapshot, savedAt: Date.now() - 2 * 60 * 60 * 1000 - 1 }))
  assert.equal(readPlanV2Session(), undefined)
})

test('formal plan migrates the development session key once', () => {
  storage.setItem('lingshan:plan-v2:session:v1', JSON.stringify({
    version: 1,
    savedAt: Date.now(),
    selectedRouteId: 'family',
    hasChosenRoute: true,
    activeStep: 3,
    scrollY: 88
  }))
  assert.equal(readPlanV2Session()?.selectedRouteId, 'family')
  assert.equal(storage.getItem('lingshan:plan-v2:session:v1'), null)
  assert.ok(storage.getItem('lingshan:plan:session:v1'))
})

test('every local guide route has an exact scenic map route', () => {
  assert.equal(guideRoutes.length, 5)
  assert.match(scenicRoutesSource, /scenicRouteConfigs:\s*ScenicRouteConfig\[\]\s*=\s*guideRoutes\.map\(buildScenicRouteConfig\)/)
  assert.match(scenicRoutesSource, /scenicRouteConfigs\.find\(\(route\)\s*=>\s*route\.id\s*===\s*routeId\)/)
})

test('formal plan starts the selected map route at its first active stop', () => {
  assert.match(planV2Source, /if \(!selectedRoute \|\| !selectedScenicRoute\)/)
  assert.match(planV2Source, /stage=active&stop=1&presentation=ink2d&returnTo=%2Fplan/)
  assert.match(planV2Source, /returnTo: '\/plan'/)
  assert.match(planV2Source, /saveMapResumeState\(\{ url: routeUrl, presentation: 'ink2d' \}\)/)
})

test('plan V2 keeps narrow screens and fixed actions inside safe areas', () => {
  assert.match(planV2Styles, /@media \(max-width: 340px\)/)
  assert.match(planV2Styles, /\.plan-v2-mode-book__copy > p \{ white-space: nowrap; \}/)
  assert.doesNotMatch(modeBookSource, /所有选择都能随时修改/)
  assert.match(planV2Styles, /bottom: calc\(77px \+ env\(safe-area-inset-bottom\)\)/)
  assert.match(planV2Styles, /padding-bottom: calc\(164px \+ env\(safe-area-inset-bottom\)\)/)
  assert.match(routeFolioStyles, /\.route-itinerary-folio__stop-strip[^}]+overflow-x: auto/)
  assert.match(bottomNavStyles, /calc\(7px \+ env\(safe-area-inset-bottom\)\)/)
})

test('formal plan keeps functional copy readable without narrow-screen overflow', () => {
  assert.match(planV2Styles, /--plan-type-eyebrow: 10px/)
  assert.match(planV2Styles, /--plan-type-caption: 11px/)
  assert.match(planV2Styles, /--plan-type-body: 12px/)
  assert.match(planV2Styles, /body:has\(\.plan-v2-preview\) \{ min-width: 0; \}/)
  assert.match(planV2Styles, /\.plan-v2-mode-book__page \{[^}]+height: 176px; min-height: 176px/)
  assert.match(planV2Styles, /\.plan-v2-mode-book__page--manual \{[^}]+grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(planV2Styles, /\.plan-v2-xiaoling-panel__composer > button \{[^}]+min-width: 84px/)
  assert.match(routeFolioStyles, /\.route-itinerary-folio__facts span \{ min-height: 48px; flex-direction: column/)
})

test('planning tabs wrap with arrow keys and honor Home and End', () => {
  assert.equal(getNextPlanningMode('smart', 'ArrowLeft'), 'manual')
  assert.equal(getNextPlanningMode('smart', 'ArrowRight'), 'manual')
  assert.equal(getNextPlanningMode('manual', 'ArrowLeft'), 'smart')
  assert.equal(getNextPlanningMode('manual', 'ArrowRight'), 'smart')
  assert.equal(getNextPlanningMode('manual', 'Home'), 'smart')
  assert.equal(getNextPlanningMode('smart', 'End'), 'manual')
})

test('route stop restoration and keyboard navigation stay within bounds', () => {
  const stopIds = ['gate', 'buddha', 'palace']
  assert.equal(resolveInitialRouteStopId(stopIds, 'buddha'), 'buddha')
  assert.equal(resolveInitialRouteStopId(stopIds, 'missing'), 'gate')
  assert.equal(resolveInitialRouteStopId([], 'missing'), undefined)
  assert.equal(getRouteStopTargetIndex(0, 0, 'ArrowRight'), -1)
  assert.equal(getRouteStopTargetIndex(3, 0, 'ArrowLeft'), 0)
  assert.equal(getRouteStopTargetIndex(3, 0, 'ArrowRight'), 1)
  assert.equal(getRouteStopTargetIndex(3, 1, 'End'), 2)
  assert.equal(getRouteStopTargetIndex(3, 2, 'ArrowRight'), 2)
  assert.equal(getRouteStopTargetIndex(3, 2, 'Home'), 0)
})

test('route plan reducer keeps coupled interaction transitions atomic', () => {
  let state = createRoutePlanState({ selectedRouteId: 'route-a' })
  state = routePlanReducer(state, { type: 'CHOOSE_ROUTE', routeId: 'route-b', source: 'manual', message: '已展开路线 B' })
  assert.deepEqual(
    [state.selectedRouteId, state.hasChosenRoute, state.activeStep, state.selectedStopId, state.selectionSource, state.planningMode],
    ['route-b', true, 3, '', 'manual', 'manual']
  )

  state = routePlanReducer(state, { type: 'SELECT_STOP', stopId: 'stop-2' })
  state = routePlanReducer(state, { type: 'PREFERENCES_CHANGED' })
  assert.equal(state.selectedRouteId, 'route-b')
  assert.equal(state.hasChosenRoute, false)
  assert.equal(state.selectedStopId, 'stop-2')
  assert.equal(state.selectionSource, null)

  state = routePlanReducer(state, { type: 'REOPEN_CHOOSER', message: '重新比较' })
  assert.equal(state.activeStep, 3)
  assert.equal(state.selectedRouteId, 'route-b')
  state = routePlanReducer(state, { type: 'RECONCILE_ROUTES', routeId: 'route-c' })
  assert.deepEqual([state.selectedRouteId, state.hasChosenRoute, state.selectedStopId], ['route-c', false, ''])
})

test('route plan reducer tracks assistant refresh and acceptance', () => {
  let state = createRoutePlanState({ selectedRouteId: 'route-a' })
  state = routePlanReducer(state, { type: 'OPEN_ASSISTANT' })
  state = routePlanReducer(state, { type: 'SET_DRAFT', draft: '下午少走路' })
  state = routePlanReducer(state, { type: 'SUBMIT_REQUEST', request: '下午少走路', reply: '已经重新排卷', awaitRecommendations: true })
  assert.deepEqual([state.drawerOpen, state.draft, state.lastRequest, state.smartRefreshPhase], [true, '', '下午少走路', 'awaiting-loading'])
  state = routePlanReducer(state, { type: 'RECOMMENDATIONS_LOADING' })
  assert.equal(state.smartRefreshPhase, 'loading')
  state = routePlanReducer(state, { type: 'SUGGEST_ROUTE', routeId: 'route-smart', message: '小灵已首荐' })
  assert.deepEqual([state.selectedRouteId, state.hasChosenRoute, state.smartRefreshPhase], ['route-smart', false, 'idle'])
  state = routePlanReducer(state, { type: 'CHOOSE_ROUTE', routeId: 'route-smart', source: 'smart', message: '已采用' })
  assert.deepEqual([state.hasChosenRoute, state.drawerOpen, state.selectionSource, state.planningMode], [true, false, 'smart', 'smart'])
})

test('route plan reducer keeps reversible controls and restored state consistent', () => {
  let state = createRoutePlanState({
    selectedRouteId: 'route-restored',
    activeStep: 3,
    hasChosenRoute: true,
    selectedStopId: 'stop-restored'
  })
  assert.deepEqual(
    [state.selectedRouteId, state.activeStep, state.hasChosenRoute, state.selectedStopId],
    ['route-restored', 3, true, 'stop-restored']
  )

  state = routePlanReducer(state, { type: 'SET_DRAFT', draft: '想慢慢走' })
  state = routePlanReducer(state, { type: 'OPEN_ASSISTANT' })
  state = routePlanReducer(state, { type: 'CLOSE_ASSISTANT' })
  assert.deepEqual([state.drawerOpen, state.draft, state.planningMode], [false, '想慢慢走', 'smart'])

  state = routePlanReducer(state, { type: 'TOGGLE_ADVANCED' })
  state = routePlanReducer(state, { type: 'TOGGLE_ALL_ROUTES' })
  assert.deepEqual([state.advancedOpen, state.showAllRoutes], [true, true])

  state = routePlanReducer(state, {
    type: 'SUBMIT_REQUEST',
    request: '按现在的想法推荐',
    reply: '沿用当前偏好',
    awaitRecommendations: false
  })
  assert.deepEqual(
    [state.hasChosenRoute, state.lastRequest, state.reply, state.draft, state.smartRefreshPhase],
    [false, '按现在的想法推荐', '沿用当前偏好', '', 'idle']
  )

  state = routePlanReducer(state, { type: 'CHOOSE_ROUTE', routeId: 'route-smart', source: 'smart', message: '已采用' })
  state = routePlanReducer(state, { type: 'REOPEN_CHOOSER', message: '重新比较' })
  assert.deepEqual(
    [state.hasChosenRoute, state.selectionSource, state.planningMode, state.activeStep],
    [false, null, 'smart', 3]
  )
})

test('formal plan preserves dialog, disclosure and stop-list semantics after component split', () => {
  assert.match(modeBookSource, /aria-haspopup="dialog"/)
  assert.match(modeBookSource, /aria-controls="plan-v2-xiaoling-dialog"/)
  assert.match(preferenceStepsSource, /aria-controls="plan-v2-advanced-groups"/)
  assert.match(preferenceStepsSource, /id="plan-v2-advanced-groups"/)
  assert.match(recommendationStepSource, /aria-controls="plan-v2-route-list"/)
  assert.match(assistantSheetSource, /keepFocusInsideDialog/)
  assert.match(planV2Source, /scrollToPlanSection\(`plan-v2-step-\$\{step\}-trigger`, true\)/)
  assert.doesNotMatch(planV2Source, /mappableCandidateRoutes\.find\([^\n]+\)\s*\?\?\s*mappableCandidateRoutes\[0\]/)
  assert.match(routeFolioSource, /role="listbox"/)
  assert.match(routeFolioSource, /role="option"/)
  assert.match(routeFolioSource, /tabIndex=\{selected \? 0 : -1\}/)
  assert.match(routeFolioSource, /aria-selected=\{selected\}/)
  assert.match(bottomSheetSource, /aria-labelledby=\{titleId\}/)
})

test('formal /plan renders the promoted page without the legacy shell', () => {
  assert.match(formalPlanEntrySource, /MobileRoutePlanPageV2/)
  assert.match(appSource, /const MobileRoutePlanPage = lazy\(\(\) => import\('\.\/mobile\/MobileRoutePlanPage'\)\)/)
  assert.match(appSource, /isFormalStandaloneCAppRoute = \[[^\]]*'\/plan'[^\]]*\]/)
  assert.match(appSource, /<Route path="\/plan" element=\{<MobileRoutePlanPage \/>\} \/>/)
  assert.match(appSource, /<Route path="\/plan-v2" element=\{<Navigate replace to="\/plan" \/>\}/)
  assert.match(planV2Source, /navigate\('\/'\)/)
  assert.doesNotMatch(planV2Source, /本地原型|\/home-v2|returnTo=%2Fplan-v2/)
})

test('formal plan stylesheet no longer contains replaced itinerary rules', () => {
  assert.doesNotMatch(planV2Styles, /\.plan-v2-selected(?:__|\s|\{|:)/)
  assert.doesNotMatch(planV2Styles, /\.plan-v2-section-label/)
  assert.doesNotMatch(planV2Styles, /\.plan-v2-itinerary\s*\{/)
  assert.doesNotMatch(planV2Styles, /plan-v2-selected-open|plan-v2-stop-in|plan-v2-route-select/)
})
