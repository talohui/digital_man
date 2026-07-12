import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { MapMobileChromeButton } from '../components/map/MapMobileChromeButton'
import { MapLayerPanel } from '../components/map/MapLayerPanel'
import { MapMobileToolRail, type MapMobileToolRailItem } from '../components/map/MapMobileToolRail'
import { getLingshanPoiDetailById } from '../data/lingshanPoiDetails'
import {
  getPoiArrivalSummary,
  getRecommendedStayLabel,
  hasAvailablePoiGlbModel
} from '../data/poiGuideMetadata'
import {
  getDefaultScenicRouteId,
  getNextRouteStop,
  getRoutePoiId,
  getRouteStopByIndex,
  getScenicRouteConfig,
  getScenicRouteOptions,
  resolveScenicRouteId,
  type ScenicRouteConfig,
  type ScenicRouteStop
} from '../data/lingshanScenicRoutes'
import {
  goContinueNextStop,
  goToMapBrowse,
  goToPoiFromRoute,
  goToRouteActive,
  goToRouteArrived,
  goToRouteCompleted,
  goToRoutePreview,
  toggleMapPresentation
} from '../lib/mapGuideNavigation'
import { parseRouteNavigationState, type MapGuideState } from '../types/mapGuide'
import {
  Map3DGuideExperience,
  type Map3DGuideMapRuntime,
  type MapPresentationTransitionSnapshot,
  type ScenicMapPresentation
} from './Map3DGuidePage'
import { NavigationPrototypeCard } from '../prototype-navigation/NavigationPrototypeCard'
import { NavigationBetaDebugPanel } from '../prototype-navigation/NavigationBetaDebugPanel'
import { NavigationPrototypeMapLayer } from '../prototype-navigation/NavigationPrototypeMapLayer'
import { NavigationPrototypeUserMarkerLayer } from '../prototype-navigation/NavigationPrototypeUserMarkerLayer'
import { createNavigationBetaViewModel, type NavigationBetaViewModel } from '../prototype-navigation/navigationBetaViewModel'
import { isNavigationDebugEnabled } from '../prototype-navigation/navigationDebug'
import { commitPrototypeArrivalToRouteStage } from '../prototype-navigation/routeStageCommit'
import { resolveRouteSegmentTarget } from '../prototype-navigation/routeSegmentTarget'
import { useNavigationPrototypeStore } from '../prototype-navigation/useNavigationPrototypeStore'
import { useMultiStopReplayStore } from '../prototype-navigation/multiStopReplay'
import type { PrototypeNavigationTarget } from '../prototype-navigation/types'
import { useMapGuideUiStore } from '../store/useMapGuideUiStore'
import { closeGlobalXiaoling, guideAssistantEvents, openGlobalXiaoling } from '../components/guide'
import '../styles/map/mapRouteMobile.css'

const DEFAULT_STOP_INDEX = 0

function clampStopIndex(stopIndex: number | undefined, stopCount: number) {
  if (!stopCount) {
    return DEFAULT_STOP_INDEX
  }
  return Math.min(Math.max(stopIndex ?? DEFAULT_STOP_INDEX, DEFAULT_STOP_INDEX), stopCount - 1)
}

function getStopPoiId(stop: ScenicRouteStop | undefined) {
  return stop?.poiId ?? stop?.id
}

function getStopDescription(stop: ScenicRouteStop | undefined) {
  const detail = getLingshanPoiDetailById(getStopPoiId(stop))
  return detail?.intro ?? '沿路线继续前行，可在这一站了解灵山胜境的人文线索与景区空间节奏。'
}

function getStopMeta(stop: ScenicRouteStop | undefined) {
  const detail = getLingshanPoiDetailById(getStopPoiId(stop))
  return detail
    ? `${detail.category} · ${getRecommendedStayLabel(getStopPoiId(stop))}`
    : `路线节点 · ${getRecommendedStayLabel(getStopPoiId(stop))}`
}

const ROUTE_TAB_LABELS: Record<string, string> = {
  historical_culture: '历史文化路线',
  prayer_meditation: '祈福静心路线',
  highlights_checkin: '精华打卡路线',
  natural_scenery: '自然风光路线',
  family: '亲子轻松路线'
}

const ROUTE_PREVIEW_TAB_IDS = ['historical_culture', 'prayer_meditation', 'highlights_checkin', 'natural_scenery', 'family']

const ROUTE_PREVIEW_SUMMARIES: Record<string, string> = {
  historical_culture: '覆盖灵山代表性人文主线，适合听佛教历史与建筑故事。',
  prayer_meditation: '串联祈福礼佛节点，适合放慢脚步感受静心氛围。',
  family: '节奏轻松、停留点清楚，适合亲子同行慢慢游览。',
  highlights_checkin: '精选大佛、梵宫等高辨识度景点，适合拍照打卡。',
  natural_scenery: '沿山水与广场空间展开，适合边走边看景区风貌。'
}

const ROUTE_SERVICE_CATEGORIES = [
  {
    id: 'restroom',
    label: '洗手间',
    description: '服务点位建设中。后续会按当前位置展示附近洗手间和步行方向。'
  },
  {
    id: 'rest',
    label: '休息区',
    description: '服务点位建设中。当前仅展示入口，正式接入后会结合路线节奏推荐休息点。'
  },
  {
    id: 'dining',
    label: '餐饮点',
    description: '服务点位建设中。后续可展示附近餐饮、补给与开放状态。'
  },
  {
    id: 'exit',
    label: '出口',
    description: '服务点位建设中。后续会结合景区动线提示最近出口或返程方向。'
  }
] as const

function getRouteTabLabel(route: Pick<ScenicRouteConfig, 'id' | 'name'>) {
  return ROUTE_TAB_LABELS[route.id] ?? route.name
}

function getRoutePreviewSummary(route: Pick<ScenicRouteConfig, 'id' | 'description'>) {
  return ROUTE_PREVIEW_SUMMARIES[route.id] ?? route.description
}

function getRoutePreviewTabs() {
  const options = getScenicRouteOptions()
  const ordered = ROUTE_PREVIEW_TAB_IDS.map((routeId) => options.find((item) => item.id === routeId)).filter(
    (item): item is ReturnType<typeof getScenicRouteOptions>[number] => Boolean(item)
  )
  const remaining = options.filter((item) => !ordered.some((route) => route.id === item.id))
  return [...ordered, ...remaining].map((item) => getScenicRouteConfig(item.id))
}

function RouteToolRail({
  side,
  stage,
  overviewMode,
  onOverviewModeChange,
  is3dActive,
  is3dSwitching,
  onToggle3d,
  onLocate,
  onExit,
  onService,
  onLayer,
  isLayerOpen
}: {
  side: 'left' | 'right'
  stage: MapGuideState['routeStage']
  overviewMode: 'overview' | 'current'
  onOverviewModeChange: (mode: 'overview' | 'current') => void
  is3dActive: boolean
  is3dSwitching: boolean
  onToggle3d: () => void
  onLocate: () => void
  onExit: () => void
  onService: () => void
  onLayer: () => void
  isLayerOpen: boolean
}) {
  const locateItem: MapMobileToolRailItem = {
    id: 'locate',
    label: '定位',
    icon: '⌖',
    onClick: onLocate
  }
  const threeDItem: MapMobileToolRailItem = {
    id: '3d',
    label: '3D',
    icon: '◆',
    active: is3dActive,
    disabled: is3dSwitching,
    onClick: onToggle3d
  }
  const serviceItem: MapMobileToolRailItem = {
    id: 'service',
    label: '服务',
    icon: '⌂',
    onClick: onService
  }
  const layerItem: MapMobileToolRailItem = {
    id: 'layers',
    label: '图层',
    icon: '▧',
    active: isLayerOpen,
    expanded: isLayerOpen,
    onClick: onLayer
  }
  const exitItem: MapMobileToolRailItem = {
    id: 'exit',
    label: '退出',
    icon: '↩',
    danger: true,
    onClick: onExit
  }

  if (side === 'left') {
    if (stage === 'preview') {
      return (
        <MapMobileToolRail
          side="left"
          className="map-route-tour-toolrail"
          ariaLabel="路线总览工具"
          items={[
            {
              id: 'overview',
              label: '路线总览',
              active: true,
              vertical: true,
              onClick: () => onOverviewModeChange('overview')
            }
          ]}
        />
      )
    }

    return (
      <MapMobileToolRail
        side="left"
        className="map-route-tour-toolrail"
        ariaLabel="路线视图切换"
        items={[
          {
            id: 'overview',
            label: '总览',
            active: overviewMode === 'overview',
            vertical: true,
            onClick: () => onOverviewModeChange('overview')
          },
          {
            id: 'current',
            label: '当前',
            active: overviewMode === 'current',
            vertical: true,
            onClick: () => onOverviewModeChange('current')
          }
        ]}
      />
    )
  }

  return (
    <MapMobileToolRail
      side="right"
      className="map-route-tour-toolrail"
      ariaLabel="地图工具"
      assistantAnchor="route"
      items={[locateItem, threeDItem, serviceItem, layerItem, exitItem]}
    />
  )
}

function RouteTopbar({
  routeName,
  progressText,
  onBack,
  onMore
}: {
  routeName: string
  progressText?: string
  onBack: () => void
  onMore: () => void
}) {
  return (
    <header className="map-route-tour-topbar">
      <MapMobileChromeButton kind="back" label="返回地图" className="map-route-tour-topbar__back" onClick={onBack} />
      <div className="map-route-tour-topbar__title">
        <strong>{routeName}</strong>
        {progressText ? <span>{progressText}</span> : null}
      </div>
      <MapMobileChromeButton kind="more" label="更多" className="map-route-tour-topbar__more" onClick={onMore} />
    </header>
  )
}

function XiaolingInlineEntry({ label = '继续问小灵', onClick }: { label?: string; onClick: () => void }) {
  return (
    <button type="button" className="map-route-tour-guide-trigger" onClick={onClick}>
      <strong>{label}</strong>
    </button>
  )
}

function RoutePreviewSlide({
  route,
  selected,
  onStart
}: {
  route: ScenicRouteConfig
  selected: boolean
  onStart: (routeId: string) => void
}) {
  const tags = route.tags.slice(0, 2)

  return (
    <section
      className={`map-route-tour-card map-route-tour-card--preview map-route-tour-preview-slide${selected ? ' is-current' : ''}`}
      data-route-preview-id={route.id}
      aria-label={`${getRouteTabLabel(route)}路线预览`}
    >
      <div className="map-route-tour-card__inner">
        <div className="map-route-tour-card__main">
          <div className="map-route-tour-cover" aria-hidden="true">
            <span />
          </div>
          <div className="map-route-tour-card__content">
            <span className="map-route-tour-kicker">路线预览</span>
            <h2>{getRouteTabLabel(route)}</h2>
            <p className="map-route-tour-meta">
              {route.guideRoute.durationLabel} · {route.stops.length}个景点
            </p>
            <div className="map-route-tour-tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <p className="map-route-tour-desc">{getRoutePreviewSummary(route)}</p>
        <div className="map-route-tour-stops" aria-label="站点时间线">
          {route.stops.map((stop, index) => (
            <span key={`${stop.id}-${index}`}>
              <i>{index + 1}</i>
              {stop.name}
            </span>
          ))}
        </div>
        <div className="map-route-tour-card__footer">
          <button type="button" className="map-route-tour-primary" onClick={() => onStart(route.id)}>
            开始游览
          </button>
          <div className="map-route-tour-footer-hint">
            <small>左右滑动查看更多路线</small>
          </div>
        </div>
      </div>
    </section>
  )
}

function RoutePreviewDeck({
  selectedRouteId,
  onSelectRoute,
  onStart
}: {
  selectedRouteId: string
  onSelectRoute: (routeId: string) => void
  onStart: (routeId: string) => void
}) {
  const routeOptions = getRoutePreviewTabs()
  const trackRef = useRef<HTMLDivElement | null>(null)
  const settleTimerRef = useRef<number | null>(null)

  const selectLargestVisibleCard = useCallback(() => {
    const track = trackRef.current
    if (!track) {
      return
    }

    const trackRect = track.getBoundingClientRect()
    let bestRouteId = selectedRouteId
    let bestArea = -1

    track.querySelectorAll<HTMLElement>('[data-route-preview-id]').forEach((card) => {
      const rect = card.getBoundingClientRect()
      const width = Math.max(0, Math.min(rect.right, trackRect.right) - Math.max(rect.left, trackRect.left))
      const height = Math.max(0, Math.min(rect.bottom, trackRect.bottom) - Math.max(rect.top, trackRect.top))
      const area = width * height
      if (area > bestArea) {
        bestArea = area
        bestRouteId = card.dataset.routePreviewId ?? bestRouteId
      }
    })

    if (bestRouteId !== selectedRouteId) {
      onSelectRoute(bestRouteId)
    }
  }, [onSelectRoute, selectedRouteId])

  useEffect(() => {
    const track = trackRef.current
    if (!track) {
      return undefined
    }

    const activeCard = track.querySelector<HTMLElement>(`[data-route-preview-id="${selectedRouteId}"]`)
    if (!activeCard) {
      return undefined
    }

    const trackRect = track.getBoundingClientRect()
    const cardRect = activeCard.getBoundingClientRect()
    const targetLeft = track.scrollLeft + cardRect.left - trackRect.left - (trackRect.width - cardRect.width) / 2

    if (Math.abs(track.scrollLeft - targetLeft) > 2) {
      track.scrollTo({ left: Math.max(0, targetLeft), behavior: 'auto' })
    }

    return undefined
  }, [selectedRouteId])

  useEffect(() => () => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
    }
  }, [])

  return (
    <div className="map-route-tour-preview-deck" aria-label="左右滑动切换路线">
      <div
        className="map-route-tour-preview-deck__track"
        ref={trackRef}
        onScroll={() => {
          if (settleTimerRef.current !== null) {
            window.clearTimeout(settleTimerRef.current)
          }
          settleTimerRef.current = window.setTimeout(selectLargestVisibleCard, 160)
        }}
      >
        {routeOptions.map((route) => (
          <RoutePreviewSlide
            key={route.id}
            route={route}
            selected={route.id === selectedRouteId}
            onStart={onStart}
          />
        ))}
      </div>
      <div className="map-route-tour-dots" aria-label="当前路线">
        {routeOptions.map((route) => (
          <span key={route.id} className={route.id === selectedRouteId ? 'is-active' : ''} />
        ))}
      </div>
    </div>
  )
}

function RouteActiveCard({
  route,
  currentStopIndex,
  onOpenXiaoling,
  onPreviewGuide,
  onNavigate,
  onPoiDetail,
  prototypeTarget,
  prototypeStatus
}: {
  route: ScenicRouteConfig
  currentStopIndex: number
  onOpenXiaoling: () => void
  onPreviewGuide: (stop: ScenicRouteStop | undefined) => void
  onNavigate: () => void
  onPoiDetail: (stopIndex: number) => void
  prototypeTarget?: PrototypeNavigationTarget
  prototypeStatus: string
}) {
  const nextStopIndex = Math.min(currentStopIndex + 1, route.stops.length - 1)
  const nextStop = getNextRouteStop(route.id, currentStopIndex)
  const description = getStopDescription(nextStop)
  const stayLabel = getRecommendedStayLabel(getStopPoiId(nextStop))

  return (
    <section className="map-route-tour-card map-route-tour-card--active" aria-label="路线进行中">
      <div className="map-route-tour-card__tip">小灵领队中：下一站是{nextStop?.name ?? '下一站'}，前方路口请留意指引。</div>
      <div className="map-route-tour-card__head">
        <span className="map-route-tour-kicker">下一站 · 第{nextStopIndex + 1}站</span>
        <XiaolingInlineEntry onClick={onOpenXiaoling} />
      </div>
      <h2>{nextStop?.name ?? '下一站'}</h2>
      <p className="map-route-tour-meta">距你320m · 步行约6分钟 · {stayLabel}</p>
      <p className="map-route-tour-desc">{description}</p>
      <div className="map-route-tour-actions">
        {nextStop && prototypeTarget ? (
          <button type="button" className="map-route-tour-primary" onClick={onNavigate} disabled={prototypeStatus !== 'idle' && prototypeStatus !== 'error' && prototypeStatus !== 'cancelled'}>
            {prototypeStatus === 'idle' || prototypeStatus === 'error' || prototypeStatus === 'cancelled' ? '导航到下一站' : '导航进行中'}
          </button>
        ) : null}
        <button type="button" onClick={() => onPoiDetail(nextStopIndex)}>
          下一站详情
        </button>
        <button type="button" onClick={() => onPreviewGuide(nextStop)}>
          预览讲解
        </button>
      </div>
    </section>
  )
}

function RouteArrivedCard({
  route,
  currentStopIndex,
  onOpenXiaoling,
  onPoiDetail,
  onContinue
}: {
  route: ScenicRouteConfig
  currentStopIndex: number
  onOpenXiaoling: () => void
  onPoiDetail: (stopIndex: number) => void
  onContinue: () => void
}) {
  const currentStop = getRouteStopByIndex(route.id, currentStopIndex)
  const meta = getStopMeta(currentStop)
  const currentPoiId = getStopPoiId(currentStop)
  const arrivalSummary = getPoiArrivalSummary(currentPoiId)
    ?? '当前景点适合结合现场环境和图文介绍继续了解。'
  const arrivedDescription = hasAvailablePoiGlbModel(currentPoiId)
    ? `${arrivalSummary}。可进入详情查看图文介绍与 3D 模型。`
    : `${arrivalSummary}。可进入详情查看景点介绍与游览建议。`

  return (
    <section className="map-route-tour-card map-route-tour-card--arrived" aria-label="已到达景点">
      <div className="map-route-tour-card__tip">小灵讲解已准备好：你已到达{currentStop?.name ?? '当前景点'}，要听我讲讲吗？</div>
      <div className="map-route-tour-card__head">
        <span className="map-route-tour-kicker">你已到达</span>
        <XiaolingInlineEntry onClick={onOpenXiaoling} />
      </div>
      <div className="map-route-tour-arrived-title">
        <div>
          <h2>{currentStop?.name ?? '当前景点'}</h2>
          <p className="map-route-tour-meta">{meta}</p>
        </div>
        <span className="map-route-tour-arrived-badge">到达</span>
      </div>
      <p className="map-route-tour-desc">{arrivedDescription}</p>
      <div className="map-route-tour-actions map-route-tour-actions--arrived">
        <button type="button" className="map-route-tour-primary" onClick={onOpenXiaoling}>
          听小灵讲解
        </button>
        <button type="button" onClick={() => onPoiDetail(currentStopIndex)}>
          景点详情
        </button>
        <button type="button" onClick={onContinue}>
          {currentStopIndex >= route.stops.length - 1 ? '完成路线' : '继续下一站'}
        </button>
      </div>
    </section>
  )
}

function RouteCompletedCard({ route, onBack }: { route: ScenicRouteConfig; onBack: () => void }) {
  return <section className="map-route-tour-card map-route-tour-card--arrived" aria-label="路线已完成">
    <div className="map-route-tour-card__tip">恭喜完成{route.name}，可以继续自由浏览灵山胜境。</div>
    <h2>路线已完成</h2>
    <p className="map-route-tour-desc">本次路线的到达确认均由你手动完成。</p>
    <div className="map-route-tour-actions"><button type="button" className="map-route-tour-primary" onClick={onBack}>返回地图</button></div>
  </section>
}

function RouteJoiningCard({
  route,
  joinStopIndex,
  target,
  targetError,
  prototypeStatus,
  onNavigate,
  onCommitArrival,
  onOpenXiaoling,
  onPoiDetail
}: {
  route: ScenicRouteConfig
  joinStopIndex: number
  target?: PrototypeNavigationTarget
  targetError?: string
  prototypeStatus: string
  onNavigate: () => void
  onCommitArrival: () => void
  onOpenXiaoling: () => void
  onPoiDetail: (stopIndex: number) => void
}) {
  const stop = getRouteStopByIndex(route.id, joinStopIndex)
  return <section className="map-route-tour-card map-route-tour-card--active" aria-label="加入路线">
    <div className="map-route-tour-card__tip">先前往加入点{stop?.name ?? '当前站点'}，确认后才会进入正式路线进度。</div>
    <div className="map-route-tour-card__head">
      <span className="map-route-tour-kicker">加入路线 · 第{joinStopIndex + 1}站</span>
      <XiaolingInlineEntry onClick={onOpenXiaoling} />
    </div>
    <h2>{stop?.name ?? '加入点'}</h2>
    <p className="map-route-tour-desc">到达加入点前，不会标记此前站点已完成。</p>
    <div className="map-route-tour-actions">
      {target ? <button type="button" className="map-route-tour-primary" onClick={onNavigate} disabled={prototypeStatus !== 'idle' && prototypeStatus !== 'error' && prototypeStatus !== 'cancelled'}>
        {prototypeStatus === 'idle' || prototypeStatus === 'error' || prototypeStatus === 'cancelled' ? '导航到加入点' : '导航进行中'}
      </button> : null}
      <button type="button" onClick={() => onPoiDetail(joinStopIndex)}>加入点详情</button>
    </div>
  </section>
}

function RouteCollapsedBar({
  route,
  stage,
  currentStopIndex,
  onExpand,
  onPrimary
}: {
  route: ScenicRouteConfig
  stage: MapGuideState['routeStage']
  currentStopIndex: number
  onExpand: () => void
  onPrimary: () => void
}) {
  const currentStop = getRouteStopByIndex(route.id, currentStopIndex)
  const nextStop = getNextRouteStop(route.id, currentStopIndex)
  const title =
    stage === 'preview'
      ? route.name
      : stage === 'arrived'
        ? `已到达 · ${currentStop?.name ?? '当前景点'}`
        : `下一站 · ${nextStop?.name ?? '下一站'}`
  const meta =
    stage === 'preview'
      ? `${route.guideRoute.durationLabel} · ${route.stops.length}个景点`
      : stage === 'arrived'
        ? '小灵讲解已准备好'
        : '距你320m · 步行约6分钟'
  const primaryLabel = stage === 'preview' ? '开始游览' : stage === 'arrived' ? '景点详情' : '导航'

  return (
    <section className="map-route-tour-card map-route-tour-card--collapsed" aria-label="路线卡片已收起">
      <button type="button" className="map-route-tour-collapse-summary" onClick={onExpand}>
        <strong>{title}</strong>
        <span>{meta}</span>
      </button>
      <button type="button" className="map-route-tour-collapse-primary" onClick={onPrimary}>
        {primaryLabel}
      </button>
    </section>
  )
}

function RouteTourMobileOverlay({
  route,
  guideState,
  presentation,
  presentationSwitching,
  mapRuntime
}: {
  route: ScenicRouteConfig
  guideState: MapGuideState
  presentation: ScenicMapPresentation
  presentationSwitching: boolean
  mapRuntime: Map3DGuideMapRuntime | null
}) {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [debugMenuOpen, setDebugMenuOpen] = useState(false)
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)
  const [serviceCategory, setServiceCategory] = useState<(typeof ROUTE_SERVICE_CATEGORIES)[number]['id']>('restroom')
  const routeCardExpanded = useMapGuideUiStore((state) => state.routeCardExpanded)
  const setRouteCardExpanded = useMapGuideUiStore((state) => state.setRouteCardExpanded)
  const layerPanelOpen = useMapGuideUiStore((state) => state.layerPanelOpen)
  const setLayerPanelOpen = useMapGuideUiStore((state) => state.setLayerPanelOpen)
  const overviewMode = useMapGuideUiStore((state) => state.mapFocusMode)
  const setOverviewMode = useMapGuideUiStore((state) => state.setMapFocusMode)
  const [selectedRouteId, setSelectedRouteId] = useState(route.id)
  const [feedbackText, setFeedbackText] = useState('')
  const [visualViewportHeight, setVisualViewportHeight] = useState(0)
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0)
  const navigateTimerRef = useRef<number | null>(null)
  const stage = guideState.routeStage ?? 'preview'
  const cardCollapsed = !routeCardExpanded
  const stopCount = route.stops.length
  const currentStopIndex = clampStopIndex(stage === 'preview' ? DEFAULT_STOP_INDEX : guideState.stopIndex, stopCount)
  const joinStopIndex = clampStopIndex(guideState.joinStopIndex, stopCount)
  const prototypeStatus = useNavigationPrototypeStore((state) => state.status)
  const prototypeSession = useNavigationPrototypeStore((state) => state.session)
  const startPrototypeTarget = useNavigationPrototypeStore((state) => state.startTarget)
  const syncPrototypeTarget = useNavigationPrototypeStore((state) => state.syncTarget)
  const markRouteStageCommitted = useNavigationPrototypeStore((state) => state.markRouteStageCommitted)
  const setRouteStageCommitReason = useNavigationPrototypeStore((state) => state.setRouteStageCommitReason)
  const navigationStoreSnapshot = useNavigationPrototypeStore()
  const prepareNavigationTarget = useNavigationPrototypeStore((state) => state.prepareTarget)
  const requestPreparedNavigation = useNavigationPrototypeStore((state) => state.requestPreparedNavigation)
  const dismissPreparedNavigation = useNavigationPrototypeStore((state) => state.dismissPreparedNavigation)
  const pauseNavigation = useNavigationPrototypeStore((state) => state.pauseNavigation)
  const resumeNavigation = useNavigationPrototypeStore((state) => state.resumeNavigation)
  const cancelNavigation = useNavigationPrototypeStore((state) => state.cancelNavigation)
  const rerouteNavigation = useNavigationPrototypeStore((state) => state.reroute)
  const continueCurrentRoute = useNavigationPrototypeStore((state) => state.continueCurrentRoute)
  const continueAfterArrivalDetection = useNavigationPrototypeStore((state) => state.continueAfterArrivalDetection)
  const raiseNavigationError = useNavigationPrototypeStore((state) => state.raiseNavigationError)
  const localNavigationTest = useNavigationPrototypeStore((state) => state.localNavigationTest)
  const multiStopReplaySession = useMultiStopReplayStore((state) => state.session)
  const prototypeResolution = useMemo(() => {
    if (stage === 'active') {
      return resolveRouteSegmentTarget({ route, stage: 'active', currentStopIndex })
    }
    if (stage === 'joining') {
      return resolveRouteSegmentTarget({ route, stage: 'joining', currentStopIndex, joinStopIndex })
    }
    return { error: '' }
  }, [currentStopIndex, joinStopIndex, route, stage])
  const prototypeTarget = 'target' in prototypeResolution ? prototypeResolution.target : undefined
  const prototypeTargetError = 'error' in prototypeResolution ? prototypeResolution.error || undefined : undefined
  const navigationDebugEnabled = isNavigationDebugEnabled()
  const progressText = stage === 'preview' ? undefined : `${currentStopIndex + 1}/${stopCount}站`

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => () => setLayerPanelOpen(false), [setLayerPanelOpen])

  useEffect(() => {
    setRouteCardExpanded(true)
  }, [route.id, setRouteCardExpanded, stage])

  useEffect(() => {
    setSelectedRouteId(route.id)
  }, [route.id])

  useEffect(() => {
    if (localNavigationTest) return
    syncPrototypeTarget(prototypeTarget)
  }, [localNavigationTest, prototypeTarget, syncPrototypeTarget])

  useEffect(() => () => {
    if (navigateTimerRef.current !== null) {
      window.clearTimeout(navigateTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!feedbackText) {
      return undefined
    }

    const timer = window.setTimeout(() => setFeedbackText(''), 1800)
    return () => window.clearTimeout(timer)
  }, [feedbackText])

  useEffect(() => {
    const closeServiceForGuide = () => setServiceOpen(false)
    window.addEventListener(guideAssistantEvents.open, closeServiceForGuide)
    return () => window.removeEventListener(guideAssistantEvents.open, closeServiceForGuide)
  }, [])

  useEffect(() => {
    const updateVisualViewportHeight = () => {
      const nextHeight = Math.round(window.visualViewport?.height ?? window.innerHeight)
      const nextOffsetTop = Math.round(window.visualViewport?.offsetTop ?? 0)
      setVisualViewportHeight(nextHeight)
      setVisualViewportOffsetTop(nextOffsetTop)
    }

    updateVisualViewportHeight()
    window.addEventListener('resize', updateVisualViewportHeight)
    window.visualViewport?.addEventListener('resize', updateVisualViewportHeight)
    window.visualViewport?.addEventListener('scroll', updateVisualViewportHeight)

    return () => {
      window.removeEventListener('resize', updateVisualViewportHeight)
      window.visualViewport?.removeEventListener('resize', updateVisualViewportHeight)
      window.visualViewport?.removeEventListener('scroll', updateVisualViewportHeight)
    }
  }, [])

  const overlayStyle = useMemo(
    () =>
      ({
        '--route-vvh': visualViewportHeight ? `${visualViewportHeight}px` : '100svh',
        '--route-vvo-top': `${visualViewportOffsetTop}px`
      }) as CSSProperties,
    [visualViewportHeight, visualViewportOffsetTop]
  )

  const handlePoiDetail = (stopIndex: number) => {
    const poiId = getRoutePoiId(route.id, stopIndex)
    if (!poiId) {
      setFeedbackText('当前站点详情建设中')
      return
    }
    goToPoiFromRoute(navigate, poiId, {
      routeId: route.id,
      poiStopIndex: stopIndex,
      returnStage: stage === 'active' ? 'active' : 'arrived',
      returnStopIndex: currentStopIndex,
      presentation
    })
  }

  const handleContinue = () => {
    if (currentStopIndex >= stopCount - 1) {
      goToRouteCompleted(navigate, route.id, currentStopIndex, presentation)
      return
    }

    const continuesMultiStopReplay = navigationDebugEnabled
      && multiStopReplaySession?.routeId === route.id
      && multiStopReplaySession.status === 'awaiting-route-continue'
      && multiStopReplaySession.currentTargetStopIndex === currentStopIndex
    const nextStopIndex = continuesMultiStopReplay ? currentStopIndex : currentStopIndex + 1
    goContinueNextStop(navigate, route.id, nextStopIndex, presentation)
  }

  const handleToggle3d = () => {
    toggleMapPresentation(navigate)
  }

  const handleLocate = () => {
    setFeedbackText('已回到当前位置附近')
  }

  const handleNavigateNext = () => {
    if (!prototypeTarget) {
      raiseNavigationError('target-location-missing', prototypeTargetError)
      setFeedbackText(prototypeTargetError || '该站点导航位置尚未完善')
      return
    }
    prepareNavigationTarget(prototypeTarget)
    setFeedbackText('请确认定位说明')
  }

  const handleCommitPrototypeArrival = () => {
    const expectedTargetStopIndex = stage === 'joining' ? joinStopIndex : currentStopIndex + 1
    const expectedStop = getRouteStopByIndex(route.id, expectedTargetStopIndex)
    const result = commitPrototypeArrivalToRouteStage({
      session: prototypeSession,
      currentRouteId: route.id,
      currentStage: stage === 'joining' ? 'joining' : 'active',
      expectedTargetStopIndex,
      expectedTargetPoiId: getStopPoiId(expectedStop) ?? '',
      navigate,
      presentation,
      markCommitted: markRouteStageCommitted
    })
    setRouteStageCommitReason(result.reason)
    setFeedbackText(result.reason)
  }

  const navigationBetaViewModel = useMemo<NavigationBetaViewModel>(() => createNavigationBetaViewModel({
    ...navigationStoreSnapshot,
    debugEnabled: navigationDebugEnabled
  }, {
    enterPermissionIntro: () => prototypeTarget && prepareNavigationTarget(prototypeTarget),
    requestPermissionAndStart: requestPreparedNavigation,
    dismissPermissionIntro: dismissPreparedNavigation,
    retryLocation: resumeNavigation,
    retryPlanning: requestPreparedNavigation,
    pause: pauseNavigation,
    resume: resumeNavigation,
    cancel: cancelNavigation,
    reroute: () => void rerouteNavigation(),
    continueCurrentRoute,
    confirmArrival: handleCommitPrototypeArrival,
    continueAfterArrivalDetection,
    continueRestoredSession: resumeNavigation,
    discardRestoredSession: cancelNavigation
  }), [navigationStoreSnapshot, navigationDebugEnabled, prototypeTarget, prepareNavigationTarget, requestPreparedNavigation, dismissPreparedNavigation, resumeNavigation, pauseNavigation, cancelNavigation, rerouteNavigation, continueCurrentRoute, handleCommitPrototypeArrival, continueAfterArrivalDetection])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) useNavigationPrototypeStore.getState().pauseForBackground()
      else useNavigationPrototypeStore.getState().markResumePrompt()
    }
    const handlePageHide = () => useNavigationPrototypeStore.getState().pauseForBackground()
    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handleVisibility)
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handleVisibility)
    }
  }, [])

  const openXiaoling = () => {
    setServiceOpen(false)
    setDebugMenuOpen(false)
    setDebugPanelOpen(false)
    openGlobalXiaoling({ mode: 'route' })
  }

  const handleMore = () => {
    if (!navigationDebugEnabled) {
      setFeedbackText('更多功能建设中')
      return
    }
    setDebugMenuOpen((open) => !open)
  }

  const openDebugPanel = () => {
    setDebugMenuOpen(false)
    setServiceOpen(false)
    setLayerPanelOpen(false)
    setDebugPanelOpen(true)
  }

  const handlePreviewGuide = (stop: ScenicRouteStop | undefined) => {
    const stopName = stop?.name ?? '下一站'
    setServiceOpen(false)
    openGlobalXiaoling({
      mode: 'route',
      autoPrompt: `请用导览员的语气，为我讲解一下“${stopName}”这一站。`,
      autoResponse: `${stopName}是${route.name}中的下一站。你可以先留意它与前后空间的衔接，再从建筑、历史或游览礼序中选择感兴趣的角度继续了解。`
    })
  }

  const toggleService = () => {
    closeGlobalXiaoling()
    setDebugMenuOpen(false)
    setDebugPanelOpen(false)
    setLayerPanelOpen(false)
    setServiceOpen((open) => !open)
  }

  const toggleLayer = () => {
    setDebugMenuOpen(false)
    setDebugPanelOpen(false)
    setServiceOpen(false)
    setLayerPanelOpen(!layerPanelOpen)
  }

  const handleCollapsedPrimary = () => {
    if (stage === 'preview') {
      goToRouteActive(navigate, route.id, 0)
      return
    }
    if (stage === 'arrived') {
      handlePoiDetail(currentStopIndex)
      return
    }
    handleNavigateNext()
  }

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return <>
    <NavigationPrototypeMapLayer runtime={mapRuntime} />
    <NavigationPrototypeUserMarkerLayer runtime={mapRuntime} />
    {createPortal(
      <div
      className={`map-route-tour-overlay map-route-tour-overlay--portal map-route-tour-overlay--${stage}`}
      style={overlayStyle}
      aria-label="路线游览移动端覆盖层"
    >
      <RouteTopbar
        routeName={stage === 'preview' ? '路线预览' : route.name}
        progressText={progressText}
        onBack={() => goToMapBrowse(navigate, presentation)}
        onMore={handleMore}
      />
      {navigationDebugEnabled && debugMenuOpen ? (
        <div className="navigation-beta-debug-menu" role="menu" aria-label="更多功能">
          <button type="button" role="menuitem" onClick={openDebugPanel}>导航调试</button>
        </div>
      ) : null}
      <RouteToolRail
        side="left"
        stage={stage}
        overviewMode={overviewMode}
        onOverviewModeChange={setOverviewMode}
        is3dActive={presentation === 'scenic3d'}
        is3dSwitching={presentationSwitching}
        onToggle3d={handleToggle3d}
        onLocate={handleLocate}
        onExit={() => goToMapBrowse(navigate, presentation)}
        onService={toggleService}
        onLayer={toggleLayer}
        isLayerOpen={layerPanelOpen}
      />
      <RouteToolRail
        side="right"
        stage={stage}
        overviewMode={overviewMode}
        onOverviewModeChange={setOverviewMode}
        is3dActive={presentation === 'scenic3d'}
        is3dSwitching={presentationSwitching}
        onToggle3d={handleToggle3d}
        onLocate={handleLocate}
        onExit={() => goToMapBrowse(navigate, presentation)}
        onService={toggleService}
        onLayer={toggleLayer}
        isLayerOpen={layerPanelOpen}
      />
      <div className={`map-route-tour-bottom${!navigationBetaViewModel.shouldReplaceRouteSheet && cardCollapsed ? ' is-collapsed' : ''}`}>
        {!navigationBetaViewModel.shouldReplaceRouteSheet ? (
          <button
            type="button"
            className="map-route-tour-collapse-toggle"
            onClick={() => setRouteCardExpanded(!routeCardExpanded)}
            aria-expanded={!cardCollapsed}
            aria-label={cardCollapsed ? '展开路线卡片' : '收起路线卡片'}
          >
            <span aria-hidden="true" />
          </button>
        ) : null}
        {navigationBetaViewModel.shouldReplaceRouteSheet ? (
          <NavigationPrototypeCard viewModel={navigationBetaViewModel} />
        ) : cardCollapsed ? (
          <RouteCollapsedBar
            route={route}
            stage={stage}
            currentStopIndex={currentStopIndex}
            onExpand={() => setRouteCardExpanded(true)}
            onPrimary={handleCollapsedPrimary}
          />
        ) : stage === 'preview' ? (
          <RoutePreviewDeck
            selectedRouteId={selectedRouteId}
            onSelectRoute={(routeId) => {
              setSelectedRouteId(routeId)
              goToRoutePreview(navigate, routeId, presentation, { replace: true })
            }}
            onStart={(targetRouteId) => goToRouteActive(navigate, targetRouteId, 0, presentation)}
          />
        ) : stage === 'arrived' ? (
          <RouteArrivedCard
            route={route}
            currentStopIndex={currentStopIndex}
            onOpenXiaoling={openXiaoling}
            onPoiDetail={handlePoiDetail}
            onContinue={handleContinue}
          />
        ) : stage === 'completed' ? (
          <RouteCompletedCard route={route} onBack={() => goToMapBrowse(navigate, presentation)} />
        ) : stage === 'joining' ? (
          <RouteJoiningCard
            route={route}
            joinStopIndex={joinStopIndex}
            target={prototypeTarget}
            targetError={prototypeTargetError}
            prototypeStatus={prototypeStatus}
            onNavigate={handleNavigateNext}
            onCommitArrival={handleCommitPrototypeArrival}
            onOpenXiaoling={openXiaoling}
            onPoiDetail={handlePoiDetail}
          />
        ) : (
          <RouteActiveCard
            route={route}
            currentStopIndex={currentStopIndex}
            onOpenXiaoling={openXiaoling}
            onPreviewGuide={handlePreviewGuide}
            onNavigate={handleNavigateNext}
            onPoiDetail={handlePoiDetail}
            prototypeTarget={prototypeTarget}
            prototypeStatus={prototypeStatus}
          />
        )}
      </div>
      {navigationDebugEnabled ? (
        <NavigationBetaDebugPanel
          open={debugPanelOpen}
          route={route}
          stage={stage}
          currentStopIndex={currentStopIndex}
          joinStopIndex={joinStopIndex}
          mapRuntime={mapRuntime}
          onClose={() => setDebugPanelOpen(false)}
          onConfirmArrival={handleCommitPrototypeArrival}
          onContinueToActive={(stopIndex) => goContinueNextStop(navigate, route.id, stopIndex, presentation)}
        />
      ) : null}
      {feedbackText ? <div className="map-route-tour-toast">{feedbackText}</div> : null}
      <MapLayerPanel open={layerPanelOpen} className="map-route-tour-layer-panel" />
      {serviceOpen ? (
        <div className="map-route-tour-service" role="dialog" aria-modal="true" aria-label="游园服务占位">
          <button type="button" className="map-route-tour-service__scrim" onClick={() => setServiceOpen(false)} aria-label="关闭服务" />
          <section>
            <div className="map-route-tour-sheet__handle" aria-hidden="true" />
            <strong>游园服务</strong>
            <p>小灵将为你展示附近的洗手间、休息区、餐饮点和出口。服务点位建设中，当前为功能示意。</p>
            <div className="map-route-tour-service__categories" aria-label="游园服务分类">
              {ROUTE_SERVICE_CATEGORIES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === serviceCategory ? 'is-active' : ''}
                  onClick={() => setServiceCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="map-route-tour-service__note">
              {ROUTE_SERVICE_CATEGORIES.find((item) => item.id === serviceCategory)?.description}
            </div>
            <button type="button" onClick={() => setServiceOpen(false)}>
              知道了
            </button>
          </section>
        </div>
      ) : null}
      </div>,
      document.body
    )}
  </>
}

function Map3DRouteGuidePage() {
  const { routeId } = useParams()
  const [searchParams] = useSearchParams()
  const route = useMemo(() => {
    const resolvedRouteId = resolveScenicRouteId(routeId ?? getDefaultScenicRouteId())
    return getScenicRouteConfig(resolvedRouteId)
  }, [routeId])

  const guideState = useMemo<MapGuideState>(() => {
    const parsedState = parseRouteNavigationState(searchParams, route.stops.length)

    return {
      viewMode: 'route',
      routeId: route.id,
      routeStage: parsedState.routeStage,
      stopIndex: parsedState.stopIndex,
      joinStopIndex: parsedState.joinStopIndex,
      xiaolingMode: 'route'
    }
  }, [route, searchParams])
  const routePresentation = useMemo<ScenicMapPresentation>(() => {
    const presentation = searchParams.get('presentation')
    return presentation === 'scenic3d' || presentation === 'ink2d' ? presentation : 'ink2d'
  }, [searchParams])
  const [presentationTransition, setPresentationTransition] = useState<MapPresentationTransitionSnapshot>({
    presentation: routePresentation,
    transition: 'idle',
    isPresentationSwitching: false
  })
  const [mapRuntime, setMapRuntime] = useState<Map3DGuideMapRuntime | null>(null)
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const navigationSession = useNavigationPrototypeStore((state) => state.session)
  const localNavigationTest = useNavigationPrototypeStore((state) => state.localNavigationTest)
  const navigationPoiOverrideActive = Boolean(navigationSession || localNavigationTest)
    && ['locating', 'planning', 'navigating', 'paused', 'rerouting', 'arrived'].includes(navigationStatus)
  const handleMapRuntimeChange = useCallback((runtime: Map3DGuideMapRuntime | null) => {
    setMapRuntime(runtime)
  }, [])

  return (
    <>
      <Map3DGuideExperience
        variant="prototype-c"
        guideState={guideState}
        presentation={routePresentation}
        onPresentationTransitionChange={setPresentationTransition}
        onMapRuntimeChange={handleMapRuntimeChange}
        navigationPoiOverrideActive={navigationPoiOverrideActive}
      />
      <RouteTourMobileOverlay
        route={route}
        guideState={guideState}
        presentation={routePresentation}
        presentationSwitching={presentationTransition.isPresentationSwitching}
        mapRuntime={mapRuntime}
      />
    </>
  )
}

export default Map3DRouteGuidePage
