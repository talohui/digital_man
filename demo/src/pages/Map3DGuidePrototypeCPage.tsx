import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MapMobileChromeButton } from '../components/map/MapMobileChromeButton'
import { MapLayerPanel } from '../components/map/MapLayerPanel'
import { MapMobileToolRail } from '../components/map/MapMobileToolRail'
import { MapVoiceAssistant } from '../components/map/MapVoiceAssistant'
import { MapServicePanel, type MapServiceCategoryId } from '../components/map/MapServicePanel'
import { toggleMapPresentation } from '../lib/mapGuideNavigation'
import { useMapGuideUiStore } from '../store/useMapGuideUiStore'
import { type MapGuideState } from '../types/mapGuide'
import {
  Map3DGuideExperience,
  type Map3DGuideMapRuntime,
  type MapPresentationTransitionSnapshot,
  type ScenicMapPresentation
} from './Map3DGuidePage'
import {
  closeGlobalXiaoling,
  guideAssistantEvents,
  setGlobalXiaolingCompanionSuppressed
} from '../components/guide'
import '../styles/map/mapBrowseMobile.css'
import { useMapResumeMemory } from '../hooks/useMapResumeMemory'
import { REAL_NAVIGATION_VALIDATION_PATH } from '../prototype-navigation/navigationValidation'
import { BrowseShowcaseNavigationController } from '../prototype-navigation/BrowseShowcaseNavigationController'
import {
  focusShowcaseMapLocation,
  ShowcaseMapLocationLayer
} from '../prototype-navigation/ShowcaseMapLocationLayer'
import { resolveShowcaseMapLocation } from '../prototype-navigation/showcaseNavigation'
import { useNavigationPrototypeStore } from '../prototype-navigation/useNavigationPrototypeStore'
import type { Gcj02Position } from '../prototype-navigation/types'

const browseGuideState = {
  viewMode: 'browse',
  xiaolingMode: 'browse'
} satisfies MapGuideState

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

function BrowseMoreMenu({
  open,
  onNavigationTest,
  onClose
}: {
  open: boolean
  onNavigationTest: () => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <section className="map-browse-more-menu" role="menu" aria-label="更多功能">
      <button type="button" role="menuitem" onClick={onNavigationTest}>
        <strong>真实导航验证</strong>
        <span>用当前位置选择附近目的地</span>
      </button>
      <button type="button" className="map-browse-more-menu__close" onClick={onClose}>关闭</button>
    </section>
  )
}

function BrowseDesktopNavigationEntry() {
  const navigate = useNavigate()

  return (
    <aside className="map-browse-desktop-more">
      <button
        type="button"
        className="map-browse-desktop-more__trigger"
        aria-label="打开真实导航验证"
        onClick={() => {
          closeGlobalXiaoling()
          navigate(REAL_NAVIGATION_VALIDATION_PATH)
        }}
      >
        <span aria-hidden="true">•••</span>
        <strong>真实导航验证</strong>
      </button>
    </aside>
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

function BrowseMobileOverlay({ presentation, presentationSwitching, onPresentationChange, mapRuntime }: {
  presentation: ScenicMapPresentation
  presentationSwitching: boolean
  onPresentationChange: (presentation: ScenicMapPresentation) => void
  mapRuntime: Map3DGuideMapRuntime | null
}) {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [serviceCategory, setServiceCategory] = useState<MapServiceCategoryId>('restroom')
  const [feedbackText, setFeedbackText] = useState('')
  const [showcaseLocatePosition, setShowcaseLocatePosition] = useState<Gcj02Position>()
  const [visualViewportHeight, setVisualViewportHeight] = useState(0)
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0)
  const layerPanelOpen = useMapGuideUiStore((state) => state.layerPanelOpen)
  const setLayerPanelOpen = useMapGuideUiStore((state) => state.setLayerPanelOpen)
  const navigationLocationSource = useNavigationPrototypeStore((state) => state.locationSource)
  const navigationConvertedPosition = useNavigationPrototypeStore((state) => state.convertedGcj02Position)
  const virtualNavigationPosition = navigationLocationSource === 'replay-gcj02'
    || navigationLocationSource === 'manual-gcj02'
    ? navigationConvertedPosition
    : undefined

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => () => setLayerPanelOpen(false), [setLayerPanelOpen])

  useEffect(() => {
    const suppressed = serviceOpen || moreOpen
    setGlobalXiaolingCompanionSuppressed(suppressed)
    return () => {
      if (suppressed) setGlobalXiaolingCompanionSuppressed(false)
    }
  }, [moreOpen, serviceOpen])

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
    const closeServiceForGuide = () => {
      setServiceOpen(false)
      setMoreOpen(false)
    }
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
    setMoreOpen(false)
    setServiceOpen((open) => {
      if (!open) {
        closeGlobalXiaoling()
        setLayerPanelOpen(false)
      }
      return !open
    })
  }
  const toggleLayer = () => {
    setMoreOpen(false)
    closeService()
    setLayerPanelOpen(!layerPanelOpen)
  }
  const handleLocate = () => {
    const logicalLocation = resolveShowcaseMapLocation()
    const position = virtualNavigationPosition ?? logicalLocation?.position
    if (!position) {
      setFeedbackText('虚拟定位点暂不可用')
      return
    }
    if (!focusShowcaseMapLocation(mapRuntime, position)) {
      setFeedbackText('地图正在加载，请稍后再试')
      return
    }
    setShowcaseLocatePosition(virtualNavigationPosition ? undefined : position)
    setFeedbackText(virtualNavigationPosition
      ? '虚拟定位演示：已回到当前导航位置'
      : `虚拟定位演示：${logicalLocation?.name ?? '当前位置'}`)
  }
  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return <>
    <ShowcaseMapLocationLayer
      runtime={mapRuntime}
      position={virtualNavigationPosition ? undefined : showcaseLocatePosition}
    />
    {createPortal(
    <div className={`map-browse-overlay map-browse-overlay--portal ${serviceOpen ? 'has-service-sheet' : ''}`} style={overlayStyle} aria-label="普通浏览移动端覆盖层">
      <BrowseTopbar
        onBack={() => navigate('/')}
        onMore={() => {
          closeGlobalXiaoling()
          closeService()
          setLayerPanelOpen(false)
          setMoreOpen((open) => !open)
        }}
      />
      <BrowseMoreMenu
        open={moreOpen}
        onNavigationTest={() => navigate(REAL_NAVIGATION_VALIDATION_PATH)}
        onClose={() => setMoreOpen(false)}
      />
      <BrowseToolRail
        is3dActive={presentation === 'scenic3d'}
        is3dSwitching={presentationSwitching}
        isLayerOpen={layerPanelOpen}
        onLocate={handleLocate}
        onToggle3d={() => {
          onPresentationChange(presentation === 'scenic3d' ? 'ink2d' : 'scenic3d')
        }}
        onService={toggleService}
        onLayer={toggleLayer}
      />
      {feedbackText ? <div className="map-browse-toast">{feedbackText}</div> : null}
      <MapLayerPanel
        open={layerPanelOpen}
        className="map-browse-layer-panel"
        onServiceFacilitiesChange={(enabled) => {
          if (enabled) {
            setFeedbackText('服务设施数据建设中')
          }
        }}
      />
      <MapServicePanel
        open={serviceOpen}
        category={serviceCategory}
        onCategoryChange={setServiceCategory}
        onClose={closeService}
      />
      <MapVoiceAssistant />
    </div>,
    document.body
    )}
  </>
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
  const [mapRuntime, setMapRuntime] = useState<Map3DGuideMapRuntime | null>(null)
  useMapResumeMemory(mapRuntime, browsePresentation)

  return (
    <>
      <Map3DGuideExperience
        variant="prototype-c"
        guideState={browseGuideState}
        presentation={browsePresentation}
        onPresentationTransitionChange={setPresentationTransition}
        onMapRuntimeChange={setMapRuntime}
      />
      <BrowseMobileOverlay
        presentation={browsePresentation}
        presentationSwitching={presentationTransition.isPresentationSwitching}
        onPresentationChange={() => toggleMapPresentation(navigate)}
        mapRuntime={mapRuntime}
      />
      <BrowseShowcaseNavigationController
        presentation={browsePresentation}
        mapRuntime={mapRuntime}
      />
      <BrowseDesktopNavigationEntry />
    </>
  )
}

export default Map3DGuidePrototypeCPage
