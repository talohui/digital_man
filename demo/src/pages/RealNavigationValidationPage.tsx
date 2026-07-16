import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { XiaolingAvatar } from '../components/guide/XiaolingAvatar'
import { closeGlobalXiaoling, openGlobalXiaoling } from '../components/guide'
import { NavigationPrototypeCard } from '../prototype-navigation/NavigationPrototypeCard'
import { NavigationPrototypeLocalTestMapLayer } from '../prototype-navigation/NavigationPrototypeLocalTestMapLayer'
import { NavigationPrototypeMapLayer } from '../prototype-navigation/NavigationPrototypeMapLayer'
import { NavigationPrototypeUserMarkerLayer } from '../prototype-navigation/NavigationPrototypeUserMarkerLayer'
import { createNavigationBetaViewModel } from '../prototype-navigation/navigationBetaViewModel'
import type { Gcj02Position } from '../prototype-navigation/types'
import { useNavigationPrototypeStore } from '../prototype-navigation/useNavigationPrototypeStore'
import type { MapGuideState } from '../types/mapGuide'
import { Map3DGuideExperience, type Map3DGuideMapRuntime } from './Map3DGuidePage'
import '../styles/map/mapRouteMobile.css'
import '../styles/map/mapNavigationValidation.css'

const navigationValidationGuideState = {
  viewMode: 'browse',
  xiaolingMode: 'browse'
} satisfies MapGuideState

type TargetPreview = {
  coordinate: Gcj02Position
  name: string
  distanceMeters?: number
}

type CompletionSummary = {
  targetName: string
  distanceMeters?: number
  durationMinutes?: number
}

function formatDistance(distanceMeters?: number) {
  if (distanceMeters === undefined) return '计算中'
  return distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1)} 公里`
    : `${Math.round(distanceMeters)} 米`
}

function resolveXiaolingReminder(input: {
  completed?: CompletionSummary
  phase?: string
  status: string
  latestStepPrompt?: string
  targetName?: string
  hasTargetPreview: boolean
}) {
  if (input.completed) return `真实导航验证完成，前往“${input.completed.targetName}”的整条链路已经跑通。`
  if (input.status === 'arrived' || input.phase === 'arrived') return `已进入目的地范围，请你亲手确认到达“${input.targetName ?? '目的地'}”。`
  if (input.status === 'error' || input.phase === 'error') return '这次连接没有成功，我们可以重新定位后再试一次。'
  if (input.status === 'planning' || input.phase === 'planning') return `正在请求腾讯 Walking，为你规划前往“${input.targetName ?? '目的地'}”的真实步行路线。`
  if (input.latestStepPrompt && input.status === 'navigating') return input.latestStepPrompt
  if (input.status === 'paused') return '页面切换后导航已暂停，点击继续后我再陪你走。'
  if (input.phase === 'awaiting-target') {
    return input.hasTargetPreview
      ? '已经选好目的地。确认后会用腾讯步行算路，不是两点直线。'
      : '请在蓝点附近点一个目的地，选一段有转弯的路线最能展示真实导航。'
  }
  if (input.phase === 'locating') return '正在读取浏览器真实位置，完成 WGS84 到 GCJ-02 的坐标转换。'
  if (input.phase === 'permission-intro') return '定位只用于本次步行导航，不上传或持久化你的轨迹。'
  return '先用你现在的真实位置验证导航，到了灵山再切换成景区线路调试。'
}

function fitWalkingRoute(runtime: Map3DGuideMapRuntime, polyline: Gcj02Position[]) {
  if (polyline.length < 2) return
  const lats = polyline.map((point) => point.lat)
  const lngs = polyline.map((point) => point.lng)
  const { map, TMap } = runtime
  if (typeof TMap?.LatLng !== 'function') return

  if (typeof TMap.LatLngBounds === 'function' && typeof map?.fitBounds === 'function') {
    const bounds = new TMap.LatLngBounds(
      new TMap.LatLng(Math.min(...lats), Math.min(...lngs)),
      new TMap.LatLng(Math.max(...lats), Math.max(...lngs))
    )
    const compact = window.matchMedia('(max-width: 880px)').matches
    map.fitBounds(bounds, {
      padding: compact
        ? { top: 128, right: 34, bottom: 248, left: 34 }
        : { top: 112, right: 430, bottom: 74, left: 74 }
    })
    return
  }

  map?.setCenter?.(new TMap.LatLng(
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2
  ))
}

export default function RealNavigationValidationPage() {
  const navigate = useNavigate()
  const [mapRuntime, setMapRuntime] = useState<Map3DGuideMapRuntime | null>(null)
  const [targetPreview, setTargetPreview] = useState<TargetPreview | undefined>()
  const [completion, setCompletion] = useState<CompletionSummary | undefined>()
  const fittedRouteRef = useRef<string>()
  const snapshot = useNavigationPrototypeStore()
  const localTest = snapshot.localNavigationTest
  const localSession = snapshot.session?.target.mode === 'local-test' ? snapshot.session : undefined
  const hasLocalNavigationContext = Boolean(localTest || localSession)
  const localStatus = hasLocalNavigationContext ? snapshot.status : 'idle'
  const isSecure = typeof window === 'undefined' || window.isSecureContext
  const target = localSession?.target ?? (localTest?.target
    ? {
        mode: 'local-test' as const,
        poiId: 'local-navigation-test-target',
        name: localTest.target.name,
        coordinate: localTest.target.coordinate
      }
    : undefined)

  const beginRealTest = useCallback(() => {
    closeGlobalXiaoling()
    setCompletion(undefined)
    setTargetPreview(undefined)
    const state = useNavigationPrototypeStore.getState()
    if (state.session || state.preparedTarget || state.localNavigationTest) state.cancelNavigation()
    useNavigationPrototypeStore.getState().prepareLocalNavigationTest()
    useNavigationPrototypeStore.getState().startLocalNavigationTest()
  }, [])

  const cancelLocalTest = useCallback(() => {
    useNavigationPrototypeStore.getState().cancelLocalNavigationTest()
    setTargetPreview(undefined)
  }, [])

  const retryLocalTest = useCallback(() => {
    const state = useNavigationPrototypeStore.getState()
    if (state.session?.target.mode === 'local-test' && state.convertedGcj02Position) {
      state.startTarget(state.session.target)
      return
    }
    beginRealTest()
  }, [beginRealTest])

  const confirmTarget = useCallback(() => {
    if (!targetPreview) return
    useNavigationPrototypeStore.getState().setLocalNavigationTestTarget({
      coordinate: targetPreview.coordinate,
      name: targetPreview.name
    })
  }, [targetPreview])

  const confirmArrival = useCallback(() => {
    const state = useNavigationPrototypeStore.getState()
    if (state.status !== 'arrived' || state.session?.target.mode !== 'local-test') return
    setCompletion({
      targetName: state.session.target.name,
      distanceMeters: state.route?.distanceMeters,
      durationMinutes: state.route?.durationMinutes
    })
    state.cancelLocalNavigationTest()
  }, [])

  const viewModel = useMemo(() => createNavigationBetaViewModel({
    ...snapshot,
    status: localStatus,
    preparedTarget: undefined,
    session: localSession,
    route: localSession ? snapshot.route : undefined,
    progress: localSession ? snapshot.progress : undefined,
    locationSource: hasLocalNavigationContext ? snapshot.locationSource : undefined,
    heading: hasLocalNavigationContext ? snapshot.heading : undefined,
    error: hasLocalNavigationContext ? snapshot.error : undefined,
    errorKind: hasLocalNavigationContext ? snapshot.errorKind : undefined,
    lastRerouteError: hasLocalNavigationContext ? snapshot.lastRerouteError : undefined,
    restoredFromSessionStorage: localSession ? snapshot.restoredFromSessionStorage : false,
    backgroundPaused: localSession ? snapshot.backgroundPaused : false,
    debugEnabled: false,
    simulatedNavigationAvailable: false
  }, {
    enterPermissionIntro: beginRealTest,
    requestPermissionAndStart: beginRealTest,
    dismissPermissionIntro: cancelLocalTest,
    retryLocation: retryLocalTest,
    retryPlanning: retryLocalTest,
    pause: snapshot.pauseNavigation,
    resume: snapshot.resumeNavigation,
    cancel: cancelLocalTest,
    reroute: () => void snapshot.reroute(),
    continueCurrentRoute: snapshot.continueCurrentRoute,
    confirmArrival,
    continueAfterArrivalDetection: snapshot.continueAfterArrivalDetection,
    continueRestoredSession: snapshot.resumeNavigation,
    discardRestoredSession: cancelLocalTest,
    startSimulatedNavigation: () => undefined
  }), [beginRealTest, cancelLocalTest, confirmArrival, hasLocalNavigationContext, localSession, localStatus, retryLocalTest, snapshot, target])

  const reminder = resolveXiaolingReminder({
    completed: completion,
    phase: localTest?.phase,
    status: localStatus,
    latestStepPrompt: localSession ? snapshot.latestStepPrompt : undefined,
    targetName: target?.name ?? targetPreview?.name,
    hasTargetPreview: Boolean(targetPreview)
  })

  const askXiaoling = useCallback(() => {
    const state = useNavigationPrototypeStore.getState()
    const activeLocalSession = state.session?.target.mode === 'local-test' ? state.session : undefined
    const targetName = activeLocalSession?.target.name ?? targetPreview?.name ?? '附近目的地'
    const factualInstruction = activeLocalSession && state.progress?.currentInstruction
      ? `腾讯地图当前步行指引是：${state.progress.currentInstruction}。`
      : ''
    openGlobalXiaoling({
      mode: 'route',
      autoPrompt: `我正在体验从真实位置前往“${targetName}”的步行导航。${factualInstruction}请用一两句简短的小灵导览员语气提醒我，不要改写路线事实。`
    })
  }, [targetPreview?.name])

  useEffect(() => {
    const route = snapshot.route
    if (!mapRuntime || !route || route.polyline.length < 2 || snapshot.session?.target.mode !== 'local-test') return
    const routeKey = `${snapshot.session.id}:${route.polyline.length}:${route.destination.lat}:${route.destination.lng}:${snapshot.requestGeneration}`
    if (fittedRouteRef.current === routeKey) return
    fittedRouteRef.current = routeKey
    const frame = window.requestAnimationFrame(() => fitWalkingRoute(mapRuntime, route.polyline))
    return () => window.cancelAnimationFrame(frame)
  }, [mapRuntime, snapshot.requestGeneration, snapshot.route, snapshot.session])

  useEffect(() => {
    document.body.classList.add('real-nav-validation-active')
    closeGlobalXiaoling()
    return () => document.body.classList.remove('real-nav-validation-active')
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = useNavigationPrototypeStore.getState()
      if (state.session?.target.mode !== 'local-test') return
      if (document.hidden) state.pauseForBackground()
      else state.markResumePrompt()
    }
    const handlePageHide = () => {
      const state = useNavigationPrototypeStore.getState()
      if (state.session?.target.mode === 'local-test') state.pauseForBackground()
    }
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handleVisibilityChange)
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handleVisibilityChange)
    }
  }, [])

  useEffect(() => () => {
    const state = useNavigationPrototypeStore.getState()
    if (state.session?.target.mode === 'local-test' || state.localNavigationTest) {
      state.cancelLocalNavigationTest()
    }
  }, [])

  const showSetupPanel = !completion && (!localTest
    || localTest.phase === 'permission-intro'
    || localTest.phase === 'locating'
    || localTest.phase === 'awaiting-target')
  const showNavigationCard = !completion && viewModel.visible && !showSetupPanel

  return (
    <div className="real-nav-validation-page">
      <Map3DGuideExperience
        variant="prototype-c"
        guideState={navigationValidationGuideState}
        presentation="ink2d"
        cameraScope="navigation"
        bootstrapMapRuntime
        onMapRuntimeChange={setMapRuntime}
        navigationPoiOverrideActive={Boolean(localTest)}
      />

      {hasLocalNavigationContext ? (
        <>
          <NavigationPrototypeMapLayer runtime={mapRuntime} />
          <NavigationPrototypeUserMarkerLayer runtime={mapRuntime} />
          <NavigationPrototypeLocalTestMapLayer
            runtime={mapRuntime}
            enabled
            showControls={false}
            restoreCameraOnFinish={false}
            onTargetPreviewChange={setTargetPreview}
          />
        </>
      ) : null}

      <div className="real-nav-validation-overlay">
        <header className="real-nav-validation-topbar">
          <button
            type="button"
            className="real-nav-validation-topbar__back"
            onClick={() => navigate('/map-3d-guide-c?presentation=ink2d')}
            aria-label="返回灵山导览"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div className="real-nav-validation-topbar__title">
            <strong>真实导航验证</strong>
            <span>本机附近 · 腾讯 Walking</span>
          </div>
          <span className={`real-nav-validation-security${isSecure ? ' is-secure' : ' is-insecure'}`}>
            <i aria-hidden="true" />
            {isSecure ? 'HTTPS' : '需要 HTTPS'}
          </span>
        </header>

        <aside className="real-nav-validation-xiaoling" aria-live="polite">
          <span className="real-nav-validation-xiaoling__avatar"><XiaolingAvatar size="small" /></span>
          <div>
            <strong>小灵陪你验证</strong>
            <p>{reminder}</p>
          </div>
          <button type="button" onClick={askXiaoling}>问小灵</button>
        </aside>

        {showSetupPanel ? (
          <section className="real-nav-validation-panel" aria-label="真实导航验证步骤">
            {!localTest || localTest.phase === 'permission-intro' ? (
              <>
                <span className="real-nav-validation-panel__eyebrow">比赛现场可验证</span>
                <h1>用现在的位置，走一段真路线</h1>
                <p>浏览器定位后，在地图上选择 200–500 米内的目的地。蓝线、距离和分步指引都来自腾讯步行算路。</p>
                <div className="real-nav-validation-flow" aria-label="真实导航数据链路">
                  <span>真实 GPS</span><i>→</i><span>坐标转换</span><i>→</i><span>腾讯 Walking</span>
                </div>
                <button type="button" className="real-nav-validation-primary" onClick={beginRealTest}>
                  开始真实定位验证
                </button>
                <small>{isSecure ? '定位仅用于本次测试，不上传轨迹。' : '当前页面不是安全连接，请使用 HTTPS 或 localhost 打开。'}</small>
              </>
            ) : null}

            {localTest?.phase === 'locating' ? (
              <div className="real-nav-validation-locating">
                <span className="real-nav-validation-spinner" aria-hidden="true" />
                <div><strong>正在获取真实位置</strong><p>请允许定位，并尽量靠近窗边或室外开阔区域。</p></div>
                <button type="button" onClick={cancelLocalTest}>取消</button>
              </div>
            ) : null}

            {localTest?.phase === 'awaiting-target' ? (
              <>
                <span className="real-nav-validation-panel__eyebrow">蓝点是你的真实位置</span>
                <h2>{targetPreview ? '确认这个目的地' : '点击地图选择附近目的地'}</h2>
                <p>{targetPreview ? '你也可以继续点地图更换目的地。' : '建议选择 200–500 米、途中有转弯的位置，更容易看出路线不是直线模拟。'}</p>
                {targetPreview ? (
                  <div className="real-nav-validation-target">
                    <span aria-hidden="true">●</span>
                    <div><strong>{targetPreview.name}</strong><small>直线约 {formatDistance(targetPreview.distanceMeters)} · 算路后显示真实路程</small></div>
                  </div>
                ) : null}
                <div className="real-nav-validation-panel__actions">
                  <button type="button" className="real-nav-validation-primary" disabled={!targetPreview} onClick={confirmTarget}>
                    用腾讯步行算路
                  </button>
                  <button type="button" className="real-nav-validation-secondary" onClick={beginRealTest}>重新定位</button>
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {showNavigationCard ? (
          <div className="real-nav-validation-card">
            <NavigationPrototypeCard viewModel={viewModel} />
          </div>
        ) : null}

        {completion ? (
          <section className="real-nav-validation-panel real-nav-validation-panel--success" aria-live="polite">
            <span className="real-nav-validation-success-icon" aria-hidden="true">✓</span>
            <span className="real-nav-validation-panel__eyebrow">真实链路已验证</span>
            <h2>已到达 {completion.targetName}</h2>
            <p>已完成真实定位、腾讯步行算路、动态 step 与人工到达确认。这次测试不会修改灵山正式路线进度。</p>
            <div className="real-nav-validation-success-metrics">
              <span><b>{formatDistance(completion.distanceMeters)}</b>腾讯路程</span>
              <span><b>{completion.durationMinutes ?? '-'} 分钟</b>预计步行</span>
            </div>
            <div className="real-nav-validation-panel__actions">
              <button type="button" className="real-nav-validation-primary" onClick={beginRealTest}>再验证一次</button>
              <button type="button" className="real-nav-validation-secondary" onClick={() => navigate('/map-3d-guide-c?presentation=ink2d')}>返回灵山导览</button>
            </div>
          </section>
        ) : null}

        {hasLocalNavigationContext && snapshot.locationSource === 'geolocation' && snapshot.convertedGcj02Position ? (
          <div className="real-nav-validation-live-source">
            <span><i aria-hidden="true" />实时 GPS</span>
            <span>精度 ±{Math.round(snapshot.convertedGcj02Position.accuracy)}m</span>
            <span>{snapshot.conversionStatus === 'ready' ? 'GCJ-02 已就绪' : '坐标校准中'}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
