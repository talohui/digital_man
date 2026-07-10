import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MapMobileChromeButton } from '../components/map/MapMobileChromeButton'
import { MapMobileToolRail } from '../components/map/MapMobileToolRail'
import {
  getDefaultScenicRouteId,
  getScenicRouteConfig,
  getScenicRouteOptions,
  type ScenicRouteConfig
} from '../data/lingshanScenicRoutes'
import { goToRoutePreview, toggleMapPresentation } from '../lib/mapGuideNavigation'
import { BROWSE_MODE_QUESTIONS, type MapGuideState } from '../types/mapGuide'
import { Map3DGuideExperience, type ScenicMapPresentation } from './Map3DGuidePage'
import '../styles/map/mapBrowseMobile.css'

const browseGuideState = {
  viewMode: 'browse',
  xiaolingMode: 'browse'
} satisfies MapGuideState

const BROWSE_SERVICE_CATEGORIES = [
  {
    id: 'restroom',
    label: '洗手间',
    description: '服务点位建设中。后续会按当前位置展示附近洗手间和步行方向。'
  },
  {
    id: 'rest',
    label: '休息区',
    description: '服务点位建设中。当前仅展示入口，正式接入后会结合游览节奏推荐休息点。'
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

type BrowseLayerMode = 'core' | 'all'

function getBrowseMockAnswer(question: string, route: ScenicRouteConfig) {
  if (question.includes('1 小时')) {
    return '如果只有 1 小时，建议先看胜境广场、灵山大照壁和灵山大佛主轴线。演示版先给出路线建议，正式版会结合实时位置和排队情况调整。'
  }

  if (question.includes('厕所')) {
    return '附近服务点数据还在建设中。正式版本会展示洗手间、休息区、餐饮点和出口方向，当前可先通过右侧“服务”入口查看功能示意。'
  }

  if (question.includes('拍')) {
    return '建议优先选择灵山大照壁、胜境广场和灵山大佛远景位。上午光线更适合拍建筑层次，下午适合拍金色水景和广场氛围。'
  }

  if (question.includes('景点')) {
    return '你可以点地图上的水墨题签进入景点详情，也可以让我围绕当前推荐景点讲故事、看点和停留建议。'
  }

  if (question.includes('路线')) {
    return `我推荐先走${route.name}，预计${route.guideRoute.durationLabel}，会串联${route.stops.length}个景点，适合从人文主线了解灵山胜境。`
  }

  return '我可以帮你规划路线、讲景点故事，也能找服务点。当前是展示版回答，后续会接入真实小灵上下文。'
}

function BrowseTopbar({ onBack, onMore }: { onBack: () => void; onMore: () => void }) {
  return (
    <header className="map-browse-topbar">
      <MapMobileChromeButton kind="back" label="返回首页" className="map-browse-topbar__back" onClick={onBack} />
      <div className="map-browse-topbar__title">
        <strong>灵山胜境</strong>
      </div>
      <MapMobileChromeButton kind="more" label="更多" className="map-browse-topbar__more" onClick={onMore} />
    </header>
  )
}

function BrowseToolRail({
  is3dActive,
  isLayerOpen,
  onLocate,
  onToggle3d,
  onService,
  onLayer
}: {
  is3dActive: boolean
  isLayerOpen: boolean
  onLocate: () => void
  onToggle3d: () => void
  onService: () => void
  onLayer: () => void
}) {
  return (
    <MapMobileToolRail
      side="right"
      className="map-browse-mobile-toolrail"
      ariaLabel="地图工具"
      items={[
        { id: 'locate', label: '定位', icon: '⌖', onClick: onLocate },
        { id: '3d', label: '3D', icon: '◆', active: is3dActive, onClick: onToggle3d },
        { id: 'service', label: '服务', icon: '⌂', onClick: onService },
        { id: 'layers', label: '图层', icon: '▧', active: isLayerOpen, onClick: onLayer }
      ]}
    />
  )
}

function BrowseCompanionCard({ onRoute, onXiaoling }: {
  onRoute: () => void
  onXiaoling: () => void
}) {
  return (
    <section className="map-browse-companion-card" aria-label="小灵陪伴入口">
      <button type="button" className="map-browse-companion-card__avatar" onClick={onXiaoling} aria-label="问小灵">
        <span aria-hidden="true">
          <i />
        </span>
      </button>
      <button type="button" className="map-browse-companion-card__tip" onClick={onXiaoling}>
        小灵：想找路线、听讲解、问服务点，都可以问我。
      </button>
      <div className="map-browse-companion-card__actions">
        <button type="button" onClick={onXiaoling}>问小灵</button>
        <button type="button" className="is-route" onClick={onRoute}>路线</button>
      </div>
    </section>
  )
}

function BrowseXiaolingSheet({
  route,
  open,
  onClose
}: {
  route: ScenicRouteConfig
  open: boolean
  onClose: () => void
}) {
  const defaultAnswer = '想找路线、听讲解、问服务点，都可以问我。'
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
  }, [defaultAnswer, open])

  if (!open) {
    return null
  }

  const handleQuestion = (question: string) => {
    setSelectedQuestion(question)
    setAnswerText(getBrowseMockAnswer(question, route))
  }

  const handleSend = () => {
    const question = inputText.trim()
    if (!question) {
      return
    }
    setSelectedQuestion(question)
    setAnswerText(getBrowseMockAnswer(question, route))
    setInputText('')
  }

  return (
    <div className="map-browse-sheet" role="dialog" aria-modal="true" aria-label="小灵地图问答">
      <button type="button" className="map-browse-sheet__scrim" onClick={onClose} aria-label="关闭小灵问答" />
      <section className="map-browse-sheet__panel">
        <div className="map-browse-sheet__handle" aria-hidden="true" />
        <div className="map-browse-sheet__head">
          <span className="map-browse-sheet__avatar" aria-hidden="true">
            <i />
          </span>
          <div>
            <strong>小灵在这儿</strong>
            <p>想找路线、听讲解、问服务点，都可以问我。</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="map-browse-sheet__chips">
          {BROWSE_MODE_QUESTIONS.map((question) => (
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
        <div className="map-browse-sheet__answer">
          <strong>{selectedQuestion || '你想先了解什么？'}</strong>
          <p>{answerText}</p>
        </div>
        <div className="map-browse-sheet__input">
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
            aria-label="问小灵"
            placeholder="问小灵路线、典故、服务点"
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

function BrowseServicePanel({
  open,
  category,
  onCategoryChange,
  onClose
}: {
  open: boolean
  category: (typeof BROWSE_SERVICE_CATEGORIES)[number]['id']
  onCategoryChange: (category: (typeof BROWSE_SERVICE_CATEGORIES)[number]['id']) => void
  onClose: () => void
}) {
  const dragStartYRef = useRef<number | null>(null)

  if (!open) {
    return null
  }

  return (
    <section
      className="map-browse-service-panel"
      role="dialog"
      aria-label="游园服务占位"
      onPointerDown={(event) => {
        dragStartYRef.current = event.clientY
      }}
      onPointerUp={(event) => {
        if (dragStartYRef.current !== null && event.clientY - dragStartYRef.current > 52) {
          onClose()
        }
        dragStartYRef.current = null
      }}
      onPointerCancel={() => {
        dragStartYRef.current = null
      }}
    >
        <div className="map-browse-sheet__handle" aria-hidden="true" />
        <header>
          <strong>游园服务</strong>
          <button type="button" onClick={onClose} aria-label="关闭服务">×</button>
        </header>
        <p>小灵将为你展示附近的洗手间、休息区、餐饮点和出口。服务点位建设中，当前为功能示意。</p>
        <div className="map-browse-service__categories" aria-label="游园服务分类">
          {BROWSE_SERVICE_CATEGORIES.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === category ? 'is-active' : ''}
              onClick={() => onCategoryChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="map-browse-service__note">
          {BROWSE_SERVICE_CATEGORIES.find((item) => item.id === category)?.description}
        </div>
    </section>
  )
}

function BrowseLayerPanel({
  open,
  mode,
  serviceVisible,
  onModeChange,
  onServiceVisibleChange
}: {
  open: boolean
  mode: BrowseLayerMode
  serviceVisible: boolean
  onModeChange: (mode: BrowseLayerMode) => void
  onServiceVisibleChange: (visible: boolean) => void
}) {
  if (!open) {
    return null
  }

  return (
    <section className="map-browse-layer-panel" aria-label="地图图层">
      <strong>地图图层</strong>
      <button type="button" className={mode === 'core' ? 'is-active' : ''} onClick={() => onModeChange('core')}>
        核心景点
      </button>
      <button type="button" className={mode === 'all' ? 'is-active' : ''} onClick={() => onModeChange('all')}>
        全部景点
      </button>
      <label>
        <input
          type="checkbox"
          checked={serviceVisible}
          onChange={(event) => onServiceVisibleChange(event.target.checked)}
        />
        服务设施
      </label>
      {serviceVisible ? <small>服务设施数据建设中</small> : null}
    </section>
  )
}

function BrowseMobileOverlay({ route, presentation, onPresentationChange }: {
  route: ScenicRouteConfig
  presentation: ScenicMapPresentation
  onPresentationChange: (presentation: ScenicMapPresentation) => void
}) {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [xiaolingOpen, setXiaolingOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [layerOpen, setLayerOpen] = useState(false)
  const [layerMode, setLayerMode] = useState<BrowseLayerMode>('core')
  const [serviceFacilitiesVisible, setServiceFacilitiesVisible] = useState(false)
  const [serviceCategory, setServiceCategory] = useState<(typeof BROWSE_SERVICE_CATEGORIES)[number]['id']>('restroom')
  const [feedbackText, setFeedbackText] = useState('')
  const [visualViewportHeight, setVisualViewportHeight] = useState(0)
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateVisualViewport = () => {
      setVisualViewportHeight(Math.round(window.visualViewport?.height ?? window.innerHeight))
      setVisualViewportOffsetTop(Math.round(window.visualViewport?.offsetTop ?? 0))
    }

    updateVisualViewport()
    window.addEventListener('resize', updateVisualViewport)
    window.visualViewport?.addEventListener('resize', updateVisualViewport)
    window.visualViewport?.addEventListener('scroll', updateVisualViewport)

    return () => {
      window.removeEventListener('resize', updateVisualViewport)
      window.visualViewport?.removeEventListener('resize', updateVisualViewport)
      window.visualViewport?.removeEventListener('scroll', updateVisualViewport)
    }
  }, [])

  useEffect(() => {
    if (!feedbackText) {
      return undefined
    }

    const timer = window.setTimeout(() => setFeedbackText(''), 1800)
    return () => window.clearTimeout(timer)
  }, [feedbackText])

  const overlayStyle = useMemo(
    () =>
      ({
        '--browse-vvh': visualViewportHeight ? `${visualViewportHeight}px` : '100svh',
        '--browse-vvo-top': `${visualViewportOffsetTop}px`
      }) as CSSProperties,
    [visualViewportHeight, visualViewportOffsetTop]
  )

  const closeService = () => setServiceOpen(false)
  const openXiaoling = () => {
    closeService()
    setXiaolingOpen(true)
  }
  const toggleService = () => {
    setServiceOpen((open) => {
      if (!open) {
        setXiaolingOpen(false)
        setLayerOpen(false)
      }
      return !open
    })
  }
  const toggleLayer = () => {
    closeService()
    setLayerOpen((open) => !open)
  }
  const handleRoute = () => goToRoutePreview(navigate, 'historical_culture')

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="map-browse-overlay map-browse-overlay--portal" style={overlayStyle} aria-label="普通浏览移动端覆盖层">
      <BrowseTopbar
        onBack={() => navigate('/')}
        onMore={() => setFeedbackText('更多功能建设中')}
      />
      <BrowseToolRail
        is3dActive={presentation === 'scenic3d'}
        isLayerOpen={layerOpen}
        onLocate={() => setFeedbackText('已回到当前位置附近')}
        onToggle3d={() => {
          onPresentationChange(presentation === 'scenic3d' ? 'ink2d' : 'scenic3d')
        }}
        onService={toggleService}
        onLayer={toggleLayer}
      />
      <div className="map-browse-bottom">
        <BrowseCompanionCard onRoute={handleRoute} onXiaoling={openXiaoling} />
      </div>
      {feedbackText ? <div className="map-browse-toast">{feedbackText}</div> : null}
      <BrowseLayerPanel
        open={layerOpen}
        mode={layerMode}
        serviceVisible={serviceFacilitiesVisible}
        onModeChange={setLayerMode}
        onServiceVisibleChange={(visible) => {
          setServiceFacilitiesVisible(visible)
          if (visible) {
            setFeedbackText('服务设施数据建设中')
          }
        }}
      />
      <BrowseServicePanel
        open={serviceOpen}
        category={serviceCategory}
        onCategoryChange={setServiceCategory}
        onClose={closeService}
      />
      <BrowseXiaolingSheet route={route} open={xiaolingOpen} onClose={() => setXiaolingOpen(false)} />
    </div>,
    document.body
  )
}

function Map3DGuidePrototypeCPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const recommendedRouteId = getDefaultScenicRouteId() || getScenicRouteOptions()[0]?.id
  const recommendedRoute = getScenicRouteConfig(recommendedRouteId)
  const browsePresentation = useMemo<ScenicMapPresentation>(() => {
    const presentation = searchParams.get('presentation')
    return presentation === 'scenic3d' || presentation === 'ink2d' ? presentation : 'ink2d'
  }, [searchParams])

  return (
    <>
      <Map3DGuideExperience variant="prototype-c" guideState={browseGuideState} presentation={browsePresentation} />
      <BrowseMobileOverlay
        route={recommendedRoute}
        presentation={browsePresentation}
        onPresentationChange={() => toggleMapPresentation(navigate)}
      />
    </>
  )
}

export default Map3DGuidePrototypeCPage
