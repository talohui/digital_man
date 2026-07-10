import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MapMobileChromeButton } from '../components/map/MapMobileChromeButton'
import { MapMobileToolRail } from '../components/map/MapMobileToolRail'
import { toggleMapPresentation } from '../lib/mapGuideNavigation'
import { type MapGuideState } from '../types/mapGuide'
import {
  Map3DGuideExperience,
  type MapPresentationTransitionSnapshot,
  type ScenicMapPresentation
} from './Map3DGuidePage'
import { closeGlobalXiaoling, guideAssistantEvents } from '../components/guide'
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
  is3dSwitching,
  isLayerOpen,
  onLocate,
  onToggle3d,
  onService,
  onLayer
}: {
  is3dActive: boolean
  is3dSwitching: boolean
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
        { id: '3d', label: '3D', icon: '◆', active: is3dActive, disabled: is3dSwitching, onClick: onToggle3d },
        { id: 'service', label: '服务', icon: '⌂', onClick: onService },
        { id: 'layers', label: '图层', icon: '▧', active: isLayerOpen, onClick: onLayer }
      ]}
    />
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

function BrowseMobileOverlay({ presentation, presentationSwitching, onPresentationChange }: {
  presentation: ScenicMapPresentation
  presentationSwitching: boolean
  onPresentationChange: (presentation: ScenicMapPresentation) => void
}) {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
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

  useEffect(() => {
    const closeServiceForGuide = () => setServiceOpen(false)
    window.addEventListener(guideAssistantEvents.open, closeServiceForGuide)
    return () => window.removeEventListener(guideAssistantEvents.open, closeServiceForGuide)
  }, [])

  const overlayStyle = useMemo(
    () =>
      ({
        '--browse-vvh': visualViewportHeight ? `${visualViewportHeight}px` : '100svh',
        '--browse-vvo-top': `${visualViewportOffsetTop}px`
      }) as CSSProperties,
    [visualViewportHeight, visualViewportOffsetTop]
  )

  const closeService = () => setServiceOpen(false)
  const toggleService = () => {
    setServiceOpen((open) => {
      if (!open) {
        closeGlobalXiaoling()
        setLayerOpen(false)
      }
      return !open
    })
  }
  const toggleLayer = () => {
    closeService()
    setLayerOpen((open) => !open)
  }
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
        is3dSwitching={presentationSwitching}
        isLayerOpen={layerOpen}
        onLocate={() => setFeedbackText('已回到当前位置附近')}
        onToggle3d={() => {
          onPresentationChange(presentation === 'scenic3d' ? 'ink2d' : 'scenic3d')
        }}
        onService={toggleService}
        onLayer={toggleLayer}
      />
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
    </div>,
    document.body
  )
}

function Map3DGuidePrototypeCPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const browsePresentation = useMemo<ScenicMapPresentation>(() => {
    const presentation = searchParams.get('presentation')
    return presentation === 'scenic3d' || presentation === 'ink2d' ? presentation : 'ink2d'
  }, [searchParams])
  const [presentationTransition, setPresentationTransition] = useState<MapPresentationTransitionSnapshot>({
    presentation: browsePresentation,
    transition: 'idle',
    isPresentationSwitching: false
  })

  return (
    <>
      <Map3DGuideExperience
        variant="prototype-c"
        guideState={browseGuideState}
        presentation={browsePresentation}
        onPresentationTransitionChange={setPresentationTransition}
      />
      <BrowseMobileOverlay
        presentation={browsePresentation}
        presentationSwitching={presentationTransition.isPresentationSwitching}
        onPresentationChange={() => toggleMapPresentation(navigate)}
      />
    </>
  )
}

export default Map3DGuidePrototypeCPage
