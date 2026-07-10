import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { MapMobileChromeButton } from '../components/map/MapMobileChromeButton'
import { MapMobileToolRail, type MapMobileToolRailItem } from '../components/map/MapMobileToolRail'
import { getLingshanPoiDetailById } from '../data/lingshanPoiDetails'
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
  goToRouteActive
} from '../lib/mapGuideNavigation'
import { isRouteStage, parseStopParam, ROUTE_MODE_QUESTIONS, type MapGuideState } from '../types/mapGuide'
import { Map3DGuideExperience, type ScenicMapPresentation } from './Map3DGuidePage'
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

function getStopMeta(stop: ScenicRouteStop | undefined, fallbackStayTime = '建议停留20分钟') {
  const detail = getLingshanPoiDetailById(getStopPoiId(stop))
  return detail ? `${detail.category} · ${fallbackStayTime}` : `路线节点 · ${fallbackStayTime}`
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
  return [...ordered, ...remaining]
}

function getRouteMockAnswer(question: string, route: ScenicRouteConfig) {
  if (question.includes('下一站')) {
    return `${route.name}会按当前站点继续带你往前走。演示版先给出路线提醒，正式接入后会结合实时位置和下一站坐标回答。`
  }

  if (question.includes('跳过')) {
    return '可以。演示版会保留当前路线进度，正式接入后会把跳过站点写入路线上下文，再继续推荐下一站。'
  }

  if (question.includes('休息')) {
    return '附近休息点数据还在建设中。正式版本会优先推荐不偏离当前路线、且适合短暂停留的位置。'
  }

  if (question.includes('多久')) {
    return `${route.name}预计${route.guideRoute.durationLabel}。当前演示距离为占位，后续会根据定位和路线点串计算。`
  }

  return `我会围绕${route.name}继续讲路线重点、下一站看点和游览节奏。`
}

function getStationShortName(name: string) {
  return name
    .replace('入园', '')
    .replace('灵山大照壁', '照壁')
    .replace('祥符禅寺', '祥符')
    .replace('灵山大佛', '大佛')
    .replace('五印坛城', '坛城')
    .replace('九龙灌浴', '九龙')
}

function RouteToolRail({
  side,
  stage,
  overviewMode,
  onOverviewModeChange,
  is3dActive,
  onToggle3d,
  onLocate,
  onExit,
  onService
}: {
  side: 'left' | 'right'
  stage: MapGuideState['routeStage']
  overviewMode: 'overview' | 'current'
  onOverviewModeChange: (mode: 'overview' | 'current') => void
  is3dActive: boolean
  onToggle3d: () => void
  onLocate: () => void
  onExit: () => void
  onService: () => void
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
    onClick: onToggle3d
  }
  const serviceItem: MapMobileToolRailItem = {
    id: 'service',
    label: '服务',
    icon: '⌂',
    onClick: onService
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
      items={stage === 'preview' ? [locateItem, threeDItem, serviceItem] : [locateItem, threeDItem, serviceItem, exitItem]}
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
    <button type="button" className="map-route-tour-xiaoling-entry" onClick={onClick}>
      <span className="map-route-tour-avatar" aria-hidden="true">
        <i />
      </span>
      <strong>{label}</strong>
    </button>
  )
}

function RoutePreviewCard({
  route,
  selectedRouteId,
  onSelectRoute,
  onOpenXiaoling,
  onStart
}: {
  route: ScenicRouteConfig
  selectedRouteId: string
  onSelectRoute: (routeId: string) => void
  onOpenXiaoling: () => void
  onStart: (routeId: string) => void
}) {
  const routeOptions = getRoutePreviewTabs()
  const selectedRoute = getScenicRouteConfig(resolveScenicRouteId(selectedRouteId)) ?? route
  const tags = selectedRoute.tags.slice(0, 2)

  return (
    <section className="map-route-tour-card map-route-tour-card--preview" aria-label="路线预览">
      <button type="button" className="map-route-tour-preview-xiaoling" onClick={onOpenXiaoling}>
        <span>小灵推荐路线：这条路线会带你看灵山最重要的人文景点，要不要开始？</span>
      </button>
      <button type="button" className="map-route-tour-preview-guide" onClick={onOpenXiaoling}>
        <span className="map-route-tour-avatar" aria-hidden="true">
          <i />
        </span>
        <em>问小灵</em>
      </button>
      <div className="map-route-tour-card__inner">
        <div className="map-route-tour-card__main">
          <div className="map-route-tour-cover" aria-hidden="true">
            <span />
          </div>
          <div className="map-route-tour-card__content">
            <span className="map-route-tour-kicker">路线预览</span>
            <h2>{getRouteTabLabel(selectedRoute)}</h2>
            <p className="map-route-tour-meta">
              {selectedRoute.guideRoute.durationLabel} · {selectedRoute.stops.length}个景点
            </p>
            <div className="map-route-tour-tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <p className="map-route-tour-desc">{getRoutePreviewSummary(selectedRoute)}</p>
        <div className="map-route-tour-stops" aria-label="站点时间线">
          {selectedRoute.stops.map((stop, index) => (
            <span key={`${stop.id}-${index}`}>
              <i>{index + 1}</i>
              {getStationShortName(stop.name)}
            </span>
          ))}
        </div>
        <div className="map-route-tour-preview-carousel" aria-label="切换推荐路线">
          {routeOptions.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === selectedRoute.id ? 'is-active' : ''}
              onClick={() => onSelectRoute(resolveScenicRouteId(item.id))}
              aria-pressed={item.id === selectedRoute.id}
            >
              {getRouteTabLabel(item)}
            </button>
          ))}
        </div>
        <div className="map-route-tour-card__footer">
          <button type="button" className="map-route-tour-primary" onClick={() => onStart(selectedRoute.id)}>
            开始游览
          </button>
          <div className="map-route-tour-footer-hint">
            <small>左右滑动查看更多路线</small>
            <div className="map-route-tour-dots" aria-label="切换推荐路线">
              {routeOptions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === selectedRoute.id ? 'is-active' : ''}
                  onClick={() => onSelectRoute(resolveScenicRouteId(item.id))}
                  aria-label={`查看${getRouteTabLabel(item)}`}
                  aria-pressed={item.id === selectedRoute.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RouteActiveCard({
  route,
  currentStopIndex,
  onOpenXiaoling,
  onNavigate,
  onPoiDetail
}: {
  route: ScenicRouteConfig
  currentStopIndex: number
  onOpenXiaoling: () => void
  onNavigate: () => void
  onPoiDetail: (stopIndex: number) => void
}) {
  const nextStopIndex = Math.min(currentStopIndex + 1, route.stops.length - 1)
  const nextStop = getNextRouteStop(route.id, currentStopIndex)
  const description = getStopDescription(nextStop)

  return (
    <section className="map-route-tour-card map-route-tour-card--active" aria-label="路线进行中">
      <div className="map-route-tour-card__tip">小灵领队中：下一站是{nextStop?.name ?? '下一站'}，前方路口请留意指引。</div>
      <div className="map-route-tour-card__head">
        <span className="map-route-tour-kicker">下一站 · 第{nextStopIndex + 1}站</span>
        <XiaolingInlineEntry onClick={onOpenXiaoling} />
      </div>
      <h2>{nextStop?.name ?? '下一站'}</h2>
      <p className="map-route-tour-meta">距你320m · 步行约6分钟 · 建议停留20分钟</p>
      <p className="map-route-tour-desc">{description}</p>
      <div className="map-route-tour-actions">
        <button type="button" className="map-route-tour-primary" onClick={onNavigate}>
          导航到下一站
        </button>
        <button type="button" onClick={() => onPoiDetail(nextStopIndex)}>
          景点详情
        </button>
        <button type="button" onClick={onOpenXiaoling}>
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
      <p className="map-route-tour-desc">这里适合听建筑与灵山历史渊源，也可以进入详情查看图文介绍与 3D 模型。</p>
      <div className="map-route-tour-actions map-route-tour-actions--arrived">
        <button type="button" className="map-route-tour-primary" onClick={onOpenXiaoling}>
          听小灵讲解
        </button>
        <button type="button" onClick={() => onPoiDetail(currentStopIndex)}>
          景点详情
        </button>
        <button type="button" onClick={onContinue}>
          继续下一站
        </button>
      </div>
    </section>
  )
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
  const primaryLabel = stage === 'preview' ? '开始游览' : stage === 'arrived' ? '听讲解' : '导航'

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

function RouteXiaolingSheet({
  route,
  open,
  onClose
}: {
  route: ScenicRouteConfig
  open: boolean
  onClose: () => void
}) {
  const defaultAnswer = '你可以问我下一站怎么走、是否跳过某站，或者让小灵先讲讲下一站的故事。'
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [answerText, setAnswerText] = useState(defaultAnswer)
  const [inputText, setInputText] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedQuestion('')
      setAnswerText(defaultAnswer)
      setInputText('')
      setVoiceActive(false)
    }
  }, [defaultAnswer, open, route.id])

  if (!open) {
    return null
  }

  const handleQuestion = (question: string) => {
    setSelectedQuestion(question)
    setAnswerText(getRouteMockAnswer(question, route))
  }

  const handleSend = () => {
    const question = inputText.trim()
    if (!question) {
      return
    }
    setSelectedQuestion(question)
    setAnswerText(getRouteMockAnswer(question, route))
    setInputText('')
  }

  return (
    <div className="map-route-tour-sheet" role="dialog" aria-modal="true" aria-label="小灵路线问答">
      <button type="button" className="map-route-tour-sheet__scrim" onClick={onClose} aria-label="关闭小灵问答" />
      <section className="map-route-tour-sheet__panel">
        <div className="map-route-tour-sheet__handle" aria-hidden="true" />
        <div className="map-route-tour-sheet__head">
          <span className="map-route-tour-avatar" aria-hidden="true">
            <i />
          </span>
          <div>
            <strong>小灵 · {route.name}</strong>
            <p>我会按路线进度帮你看下一站、讲重点和提醒节奏。</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="map-route-tour-sheet__chips">
          {ROUTE_MODE_QUESTIONS.map((question) => (
            <button
              type="button"
              key={question}
              className={selectedQuestion === question ? 'is-active' : ''}
              onClick={() => handleQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
        <div className="map-route-tour-sheet__answer">
          <strong>{selectedQuestion || '小灵在这儿'}</strong>
          <p>{answerText}</p>
        </div>
        <div className="map-route-tour-sheet__input">
          <button
            type="button"
            className={voiceActive ? 'is-active' : ''}
            onClick={() => setVoiceActive((value) => !value)}
            aria-label="语音输入"
            aria-pressed={voiceActive}
          >
            ◉
          </button>
          <input
            aria-label="继续问小灵"
            placeholder="继续问小灵路线、下一站、休息点"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSend()
              }
            }}
          />
          <button type="button" aria-label="发送" onClick={handleSend}>
            ↑
          </button>
        </div>
      </section>
    </div>
  )
}

function RouteTourMobileOverlay({ route, guideState }: { route: ScenicRouteConfig; guideState: MapGuideState }) {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [xiaolingOpen, setXiaolingOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [serviceCategory, setServiceCategory] = useState<(typeof ROUTE_SERVICE_CATEGORIES)[number]['id']>('restroom')
  const [cardCollapsed, setCardCollapsed] = useState(false)
  const [overviewMode, setOverviewMode] = useState<'overview' | 'current'>('current')
  const [is3dActive, setIs3dActive] = useState(true)
  const [selectedRouteId, setSelectedRouteId] = useState(route.id)
  const [feedbackText, setFeedbackText] = useState('')
  const [visualViewportHeight, setVisualViewportHeight] = useState(0)
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0)
  const stage = guideState.routeStage ?? 'preview'
  const stopCount = route.stops.length
  const currentStopIndex = clampStopIndex(stage === 'preview' ? DEFAULT_STOP_INDEX : guideState.stopIndex, stopCount)
  const progressText = stage === 'preview' ? undefined : `${currentStopIndex + 1}/${stopCount}站`

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setCardCollapsed(false)
  }, [stage, route.id])

  useEffect(() => {
    setSelectedRouteId(route.id)
  }, [route.id])

  useEffect(() => {
    if (!feedbackText) {
      return undefined
    }

    const timer = window.setTimeout(() => setFeedbackText(''), 1800)
    return () => window.clearTimeout(timer)
  }, [feedbackText])

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
    goToPoiFromRoute(navigate, poiId, route.id, stopIndex)
  }

  const handleContinue = () => {
    if (currentStopIndex >= stopCount - 1) {
      setFeedbackText('路线已完成')
      return
    }

    const nextStopIndex = currentStopIndex + 1
    goContinueNextStop(navigate, route.id, nextStopIndex)
  }

  const handleToggle3d = () => {
    setIs3dActive((value) => {
      const nextValue = !value
      setFeedbackText(nextValue ? '3D 模式后续接入' : '已切回地图浏览')
      return nextValue
    })
  }

  const handleLocate = () => {
    setFeedbackText('已回到当前位置附近')
  }

  const handleNavigateNext = () => {
    setFeedbackText('导航能力建设中，后续将接入腾讯地图路线规划。')
  }

  const handleCollapsedPrimary = () => {
    if (stage === 'preview') {
      goToRouteActive(navigate, route.id, 0)
      return
    }
    if (stage === 'arrived') {
      setXiaolingOpen(true)
      return
    }
    handleNavigateNext()
  }

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={`map-route-tour-overlay map-route-tour-overlay--portal map-route-tour-overlay--${stage}`}
      style={overlayStyle}
      aria-label="路线游览移动端覆盖层"
    >
      <RouteTopbar
        routeName={route.name}
        progressText={progressText}
        onBack={() => goToMapBrowse(navigate)}
        onMore={() => setFeedbackText('更多功能建设中')}
      />
      <RouteToolRail
        side="left"
        stage={stage}
        overviewMode={overviewMode}
        onOverviewModeChange={setOverviewMode}
        is3dActive={is3dActive}
        onToggle3d={handleToggle3d}
        onLocate={handleLocate}
        onExit={() => goToMapBrowse(navigate)}
        onService={() => setServiceOpen(true)}
      />
      <RouteToolRail
        side="right"
        stage={stage}
        overviewMode={overviewMode}
        onOverviewModeChange={setOverviewMode}
        is3dActive={is3dActive}
        onToggle3d={handleToggle3d}
        onLocate={handleLocate}
        onExit={() => goToMapBrowse(navigate)}
        onService={() => setServiceOpen(true)}
      />
      <div className={`map-route-tour-bottom${cardCollapsed ? ' is-collapsed' : ''}`}>
        <button
          type="button"
          className="map-route-tour-collapse-toggle"
          onClick={() => setCardCollapsed((value) => !value)}
          aria-expanded={!cardCollapsed}
          aria-label={cardCollapsed ? '展开路线卡片' : '收起路线卡片'}
        >
          <span aria-hidden="true" />
        </button>
        {cardCollapsed ? (
          <RouteCollapsedBar
            route={route}
            stage={stage}
            currentStopIndex={currentStopIndex}
            onExpand={() => setCardCollapsed(false)}
            onPrimary={handleCollapsedPrimary}
          />
        ) : stage === 'preview' ? (
          <RoutePreviewCard
            route={route}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            onOpenXiaoling={() => setXiaolingOpen(true)}
            onStart={(targetRouteId) => goToRouteActive(navigate, targetRouteId, 0)}
          />
        ) : stage === 'arrived' ? (
          <RouteArrivedCard
            route={route}
            currentStopIndex={currentStopIndex}
            onOpenXiaoling={() => setXiaolingOpen(true)}
            onPoiDetail={handlePoiDetail}
            onContinue={handleContinue}
          />
        ) : (
          <RouteActiveCard
            route={route}
            currentStopIndex={currentStopIndex}
            onOpenXiaoling={() => setXiaolingOpen(true)}
            onNavigate={handleNavigateNext}
            onPoiDetail={handlePoiDetail}
          />
        )}
      </div>
      {feedbackText ? <div className="map-route-tour-toast">{feedbackText}</div> : null}
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
      <RouteXiaolingSheet route={route} open={xiaolingOpen} onClose={() => setXiaolingOpen(false)} />
    </div>,
    document.body
  )
}

function Map3DRouteGuidePage() {
  const { routeId } = useParams()
  const [searchParams] = useSearchParams()
  const route = useMemo(() => {
    const resolvedRouteId = resolveScenicRouteId(routeId ?? getDefaultScenicRouteId())
    return getScenicRouteConfig(resolvedRouteId)
  }, [routeId])

  const guideState = useMemo<MapGuideState>(() => {
    const stageParam = searchParams.get('stage')
    const routeStage = isRouteStage(stageParam) ? stageParam : 'preview'
    const stopIndex = parseStopParam(searchParams.get('stop'))

    return {
      viewMode: 'route',
      routeId: route.id,
      routeStage,
      stopIndex,
      xiaolingMode: 'route'
    }
  }, [route, searchParams])
  const routePresentation = useMemo<ScenicMapPresentation>(() => {
    const presentation = searchParams.get('presentation')
    return presentation === 'scenic3d' || presentation === 'ink2d' ? presentation : 'ink2d'
  }, [searchParams])

  return (
    <>
      <Map3DGuideExperience variant="prototype-c" guideState={guideState} presentation={routePresentation} />
      <RouteTourMobileOverlay route={route} guideState={guideState} />
    </>
  )
}

export default Map3DRouteGuidePage
