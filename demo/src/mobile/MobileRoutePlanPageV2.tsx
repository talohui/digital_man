import { ArrowLeftOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { sendGuideFeedback } from '../api/guide'
import { XiaolingAvatar } from '../components/guide/XiaolingAvatar'
import { MarketTitle } from '../components/mobile/consume'
import MountainGate from '../components/mobile/home/MountainGate'
import CAppBottomNav from '../components/mobile/navigation/CAppBottomNav'
import RouteItineraryFolio from '../components/mobile/route/RouteItineraryFolio'
import RoutePlannerAssistantSheet from '../components/mobile/route/RoutePlannerAssistantSheet'
import RoutePlanningModeBook from '../components/mobile/route/RoutePlanningModeBook'
import RoutePreferenceSteps from '../components/mobile/route/RoutePreferenceSteps'
import RouteRecommendationStep from '../components/mobile/route/RouteRecommendationStep'
import { scoreRoute } from '../components/mobile/route/routePlanPresentation'
import {
  GUIDE_PREFERENCE_GROUPS,
  GUIDE_TAGS,
  buildLocalGuideRecommendations,
  type GuidePreferenceKey,
  type GuideRecommendationCard
} from '../data/guideData'
import { getScenicRouteById, normalizeScenicRouteId } from '../data/lingshanScenicRoutes'
import {
  capturePreferenceUpdate,
  captureRecommendationClick,
  captureRecommendationExposure,
  captureRouteClick,
  captureRouteExpose,
  captureTagToggle
} from '../lib/analytics'
import { saveMapResumeState } from '../lib/mapResumeState'
import type { PlanV2PlanningMode } from '../lib/planV2Interactions'
import { readPlanV2Session, savePlanV2Session } from '../lib/planV2Session'
import { createRoutePlanState, routePlanReducer, type RoutePlanStep } from '../lib/routePlanState'
import { useGuideStore } from '../store/useGuideStore'
import '../styles/c-app/mobileHome.css'
import '../styles/c-app/planV2.css'

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function MobileRoutePlanPage() {
  const navigate = useNavigate()
  const [restoredSession] = useState(() => readPlanV2Session())
  const selectedTags = useGuideStore((state) => state.selectedTags)
  const guidePreferences = useGuideStore((state) => state.guidePreferences)
  const candidateRoutes = useGuideStore((state) => state.candidateRoutes)
  const routeAdjustmentReasons = useGuideStore((state) => state.routeAdjustmentReasons)
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const isLoading = useGuideStore((state) => state.isLoading)
  const lastError = useGuideStore((state) => state.lastError)
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const toggleTag = useGuideStore((state) => state.toggleTag)
  const setGuidePreference = useGuideStore((state) => state.setGuidePreference)
  const refreshRecommendations = useGuideStore((state) => state.refreshRecommendations)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const [planState, dispatch] = useReducer(
    routePlanReducer,
    {
      selectedRouteId: normalizeScenicRouteId(restoredSession?.selectedRouteId ?? activeRouteId) ?? activeRouteId,
      activeStep: restoredSession?.activeStep,
      hasChosenRoute: restoredSession?.hasChosenRoute,
      selectedStopId: restoredSession?.selectedStopId
    },
    createRoutePlanState
  )
  const exposedRecommendationKeyRef = useRef('')
  const sentPreferenceKeyRef = useRef('')
  const restoreScrollYRef = useRef(restoredSession?.scrollY)
  const assistantTriggerRef = useRef<HTMLButtonElement>(null)

  const {
    planningMode,
    selectionSource,
    activeStep,
    selectedRouteId,
    hasChosenRoute,
    selectedStopId,
    selectionMessage,
    advancedOpen,
    showAllRoutes,
    drawerOpen,
    draft,
    lastRequest,
    smartRefreshPhase
  } = planState
  const [xiaolingRecommendedRouteId, setXiaolingRecommendedRouteId] = useState<string | null>(null)

  const selectedTagsKey = selectedTags.join('|')
  const guidePreferenceKey = GUIDE_PREFERENCE_GROUPS.map((group) => guidePreferences[group.key]).join('|')
  const recommendationInputKey = `${selectedTagsKey}::${guidePreferenceKey}`
  const mappableCandidateRoutes = useMemo(() => {
    const safeRoutes = candidateRoutes.filter((route) => Boolean(getScenicRouteById(route.id)))
    const localRoutes = buildLocalGuideRecommendations(selectedTags, guidePreferences)
    const serverByRouteId = new Map(safeRoutes.map((route) => [normalizeScenicRouteId(route.id), route]))
    return localRoutes.map((canonicalRoute) => {
      const serverRoute = serverByRouteId.get(canonicalRoute.id)
      return {
        ...canonicalRoute,
        ...serverRoute,
        // Route identity and public copy come from the fixed three-route catalog;
        // an older running analytics JAR may still return legacy names or omit one.
        id: canonicalRoute.id,
        name: canonicalRoute.name,
        description: canonicalRoute.description,
        durationLabel: canonicalRoute.durationLabel,
        tags: canonicalRoute.tags,
        stopIds: canonicalRoute.stopIds,
        adjustmentReasons: serverRoute?.adjustmentReasons?.length
          ? serverRoute.adjustmentReasons
          : routeAdjustmentReasons
      }
    })
  }, [candidateRoutes, guidePreferences, routeAdjustmentReasons, selectedTags])
  const selectedRoute = useMemo(
    () => mappableCandidateRoutes.find((route) => route.id === selectedRouteId),
    [mappableCandidateRoutes, selectedRouteId]
  )
  const selectedScenicRoute = selectedRoute ? getScenicRouteById(selectedRoute.id) : undefined
  const xiaolingRecommendedRoute = useMemo(
    () => mappableCandidateRoutes.find((route) => route.id === xiaolingRecommendedRouteId)
      ?? mappableCandidateRoutes[0],
    [mappableCandidateRoutes, xiaolingRecommendedRouteId]
  )
  const corePreferenceGroups = GUIDE_PREFERENCE_GROUPS.slice(0, 3)
  const routeProfileLabels = corePreferenceGroups
    .map((group) => group.options.find((option) => option.value === guidePreferences[group.key])?.label)
    .filter((label): label is string => Boolean(label))
  const visibleRoutes = useMemo(() => {
    if (showAllRoutes || mappableCandidateRoutes.length <= 3) return mappableCandidateRoutes
    const firstRoutes = mappableCandidateRoutes.slice(0, 3)
    if (!selectedRoute || firstRoutes.some((route) => route.id === selectedRoute.id)) return firstRoutes
    return [...mappableCandidateRoutes.slice(0, 2), selectedRoute]
  }, [mappableCandidateRoutes, selectedRoute, showAllRoutes])

  useEffect(() => {
    ensureUserId()
  }, [ensureUserId])

  useEffect(() => {
    if (recommendationInputKey === sentPreferenceKeyRef.current) return
    sentPreferenceKeyRef.current = recommendationInputKey
    capturePreferenceUpdate(selectedTags, guidePreferences)
  }, [guidePreferences, recommendationInputKey, selectedTags])

  useEffect(() => {
    void refreshRecommendations()
  }, [refreshRecommendations, recommendationInputKey])

  useEffect(() => {
    if (!mappableCandidateRoutes.length) return
    if (!mappableCandidateRoutes.some((route) => route.id === selectedRouteId)) {
      dispatch({ type: 'RECONCILE_ROUTES', routeId: mappableCandidateRoutes[0].id })
    }

    const exposureKey = mappableCandidateRoutes
      .map((item, index) => `${item.recommendationRequestId ?? 'local'}:${item.id}:${index + 1}`)
      .join('|')
    if (exposureKey === exposedRecommendationKeyRef.current) return
    exposedRecommendationKeyRef.current = exposureKey
    captureRouteExpose(mappableCandidateRoutes.map((item) => item.id))
    captureRecommendationExposure(mappableCandidateRoutes)
  }, [mappableCandidateRoutes, selectedRouteId])

  useEffect(() => {
    let scrollFrame = 0
    const persist = () => savePlanV2Session({
      selectedRouteId,
      hasChosenRoute,
      activeStep,
      selectedStopId: selectedStopId || undefined,
      scrollY: window.scrollY
    })
    const persistScroll = () => {
      window.cancelAnimationFrame(scrollFrame)
      scrollFrame = window.requestAnimationFrame(persist)
    }

    persist()
    window.addEventListener('scroll', persistScroll, { passive: true })
    window.addEventListener('pagehide', persist)
    return () => {
      window.cancelAnimationFrame(scrollFrame)
      window.removeEventListener('scroll', persistScroll)
      window.removeEventListener('pagehide', persist)
      persist()
    }
  }, [activeStep, hasChosenRoute, selectedRouteId, selectedStopId])

  useEffect(() => {
    const scrollY = restoreScrollYRef.current
    if (scrollY === undefined || !mappableCandidateRoutes.length) return
    let innerFrame = 0
    const outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'auto' })
        restoreScrollYRef.current = undefined
      })
    })
    return () => {
      window.cancelAnimationFrame(outerFrame)
      window.cancelAnimationFrame(innerFrame)
    }
  }, [hasChosenRoute, mappableCandidateRoutes.length, selectedScenicRoute?.id])

  useEffect(() => {
    if (smartRefreshPhase === 'awaiting-loading') {
      if (isLoading) dispatch({ type: 'RECOMMENDATIONS_LOADING' })
      return
    }
    if (smartRefreshPhase !== 'loading' || isLoading || !mappableCandidateRoutes.length) return
    const recommendedRoute = mappableCandidateRoutes[0]
    dispatch({ type: 'SUGGEST_ROUTE', routeId: recommendedRoute.id, message: `小灵已首荐${recommendedRoute.name}` })
  }, [isLoading, mappableCandidateRoutes, smartRefreshPhase])

  const scrollToPlanSection = (targetId: string, moveFocus = false) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId)
      target?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' })
      if (moveFocus) target?.focus({ preventScroll: true })
    }))
  }

  const handleTagToggle = (tag: string) => {
    const willSelect = !selectedTags.includes(tag)
    captureTagToggle(tag, willSelect)
    dispatch({ type: 'PREFERENCES_CHANGED' })
    toggleTag(tag)
  }

  const handlePreferenceSelect = (key: GuidePreferenceKey, value: string) => {
    dispatch({ type: 'PREFERENCES_CHANGED' })
    setGuidePreference(key, value)
  }

  const chooseRoute = (route: GuideRecommendationCard, index: number) => {
    dispatch({ type: 'CHOOSE_ROUTE', routeId: route.id, source: 'manual', message: `已展开${route.name}` })
    captureRecommendationClick(route, index + 1)
    scrollToPlanSection('plan-v2-itinerary', true)
  }

  const reopenRouteChooser = () => {
    dispatch({ type: 'REOPEN_CHOOSER', message: '已保留上一条路线，可以重新比较后再确认。' })
    scrollToPlanSection('plan-v2-step-3-trigger', true)
  }

  const startRoute = () => {
    if (!selectedRoute || !selectedScenicRoute) {
      dispatch({ type: 'START_FAILED', message: '这条路线暂未接入地图，请更换路线后再试。' })
      return
    }
    const userId = ensureUserId()
    const routeId = selectedScenicRoute.id
    const routeUrl = `/map-3d-guide-c/route/${encodeURIComponent(routeId)}?stage=active&stop=1&presentation=ink2d&returnTo=%2Fplan`
    savePlanV2Session({
      selectedRouteId: routeId,
      hasChosenRoute: true,
      activeStep: 3,
      selectedStopId: selectedStopId || undefined,
      scrollY: window.scrollY
    })
    saveMapResumeState({ url: routeUrl, presentation: 'ink2d' })
    captureRouteClick(routeId)
    setActiveRouteId(routeId)
    void sendGuideFeedback({ userId, routeId, action: 'select_route' })
    navigate(routeUrl, { state: { returnTo: '/plan' } })
  }

  const submitRouteRequest = (requestText: string) => {
    const request = requestText.trim()
    if (!request || isLoading) return
    setXiaolingRecommendedRouteId(null)
    dispatch({
      type: 'SUBMIT_REQUEST',
      request,
      reply: '',
      awaitRecommendations: false
    })
  }

  const acceptSmartRoute = (routeId?: string) => {
    const recommendedRoute = mappableCandidateRoutes.find((route) => route.id === routeId)
      ?? xiaolingRecommendedRoute
    if (!recommendedRoute) return
    dispatch({
      type: 'CHOOSE_ROUTE',
      routeId: recommendedRoute.id,
      source: 'smart',
      message: `已采用小灵推荐的${recommendedRoute.name}`
    })
    scrollToPlanSection('plan-v2-itinerary', true)
  }

  const selectPlanningMode = (mode: PlanV2PlanningMode, moveFocus = false) => {
    dispatch({ type: 'SET_MODE', mode })
    if (moveFocus) window.requestAnimationFrame(() => document.getElementById(`plan-v2-${mode}-tab`)?.focus())
  }

  const goToStep = (step: RoutePlanStep) => {
    dispatch({ type: 'GO_TO_STEP', step })
    scrollToPlanSection(`plan-v2-step-${step}-trigger`, true)
  }

  return (
    <div className={`plan-v2-preview c-app-root${hasChosenRoute ? ' has-route-dock' : ''}`}>
      <div className="plan-v2-device">
        <main className="plan-v2-page">
          <header className="plan-v2-topbar">
            <button type="button" onClick={() => navigate('/')} aria-label="返回首页"><ArrowLeftOutlined /></button>
            <span><strong>灵山胜境</strong><small>小灵行程卷</small></span>
            <i>路线规划</i>
          </header>

          <div className="plan-v2-scenery" aria-hidden="true" />

          <section className="plan-v2-intro" aria-labelledby="plan-v2-title">
            <MarketTitle id="plan-v2-title" title="规划今日路线" eyebrow="一程一卷" aside={isLoading ? <LoadingOutlined spin /> : '小灵智荐'} animationDelay={80} />
            <MountainGate variant="services" className="plan-v2-xiaoling-gate" delay={120}>
              <div className="plan-v2-xiaoling-note">
                <span className="plan-v2-xiaoling-note__avatar"><XiaolingAvatar size="floating" /></span>
                <div className="plan-v2-xiaoling-note__copy">
                  <small>小灵行旅笺</small>
                  <strong>陪你定下这一程</strong>
                  <p>说出想法，或亲手择签；沿途景点，我替你串成顺路一卷。</p>
                </div>
                <span className="plan-v2-xiaoling-note__seal" aria-hidden="true">灵</span>
              </div>
            </MountainGate>
            <RoutePlanningModeBook
              planningMode={planningMode}
              selectionSource={selectionSource}
              lastRequest={lastRequest}
              drawerOpen={drawerOpen}
              assistantTriggerRef={assistantTriggerRef}
              onSelectMode={selectPlanningMode}
              onOpenAssistant={() => dispatch({ type: 'OPEN_ASSISTANT' })}
              onGoToFirstStep={() => goToStep(1)}
            />
          </section>

          <RoutePreferenceSteps
            activeStep={activeStep}
            selectedTags={selectedTags}
            guidePreferences={guidePreferences}
            routeProfileLabels={routeProfileLabels}
            advancedOpen={advancedOpen}
            isLoading={isLoading}
            lastError={lastError}
            onGoToStep={goToStep}
            onTagToggle={handleTagToggle}
            onPreferenceSelect={handlePreferenceSelect}
            onToggleAdvanced={() => dispatch({ type: 'TOGGLE_ADVANCED' })}
          />

          <RouteRecommendationStep
            activeStep={activeStep}
            hasChosenRoute={hasChosenRoute}
            selectedRoute={selectedRoute}
            routes={mappableCandidateRoutes}
            visibleRoutes={visibleRoutes}
            isLoading={isLoading}
            lastError={lastError}
            selectionMessage={selectionMessage}
            selectionSource={selectionSource}
            showAllRoutes={showAllRoutes}
            onGoToStep={goToStep}
            onChooseRoute={chooseRoute}
            onReopenChooser={reopenRouteChooser}
            onToggleAllRoutes={() => dispatch({ type: 'TOGGLE_ALL_ROUTES' })}
            onRetry={() => { void refreshRecommendations() }}
          />

          {activeStep === 3 && hasChosenRoute && selectedRoute && selectedScenicRoute ? (
            <div id="plan-v2-itinerary" className="plan-v2-itinerary-anchor" tabIndex={-1} aria-label={`${selectedRoute.name}行程详情`}>
              <RouteItineraryFolio
                key={selectedScenicRoute.id}
                route={selectedScenicRoute}
                matchLabel={scoreRoute(selectedRoute)}
                reason={selectedRoute.reason || selectedRoute.whyRecommended || selectedRoute.description}
                initialSelectedStopId={selectedStopId}
                onSelectedStopChange={(stopId) => dispatch({ type: 'SELECT_STOP', stopId })}
              />
            </div>
          ) : null}
        </main>

        {hasChosenRoute && selectedRoute ? (
          <footer className="plan-v2-start-dock" aria-label="路线出发操作">
            <button className="plan-v2-start-dock__route" type="button" onClick={reopenRouteChooser} aria-label={`更换当前路线：${selectedRoute.name}`}>
              <small>{isLoading ? '小灵重排中' : '今日已择 · 换路线'}</small><strong>{selectedRoute.name}</strong>
            </button>
            <button className="plan-v2-start-dock__primary" type="button" disabled={isLoading} onClick={startRoute} aria-label={`按${selectedRoute.name}与小灵一同出发`}>
              {isLoading ? '小灵排卷中' : '与小灵一同出发'} <RightOutlined />
            </button>
          </footer>
        ) : null}
        <CAppBottomNav activeKey="home" />
        <RoutePlannerAssistantSheet
          open={drawerOpen}
          routeProfileLabels={routeProfileLabels}
          selectedTags={selectedTags}
          recommendation={xiaolingRecommendedRoute}
          isLoading={isLoading}
          draft={draft}
          returnFocusRef={assistantTriggerRef}
          onClose={() => dispatch({ type: 'CLOSE_ASSISTANT' })}
          onAccept={() => acceptSmartRoute(xiaolingRecommendedRoute?.id)}
          onDraftChange={(nextDraft) => dispatch({ type: 'SET_DRAFT', draft: nextDraft })}
          onSubmit={submitRouteRequest}
          onRecommendationChange={setXiaolingRecommendedRouteId}
        />
      </div>
    </div>
  )
}

export default MobileRoutePlanPage
