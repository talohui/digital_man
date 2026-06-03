import {
  AimOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
  LoadingOutlined,
  RightOutlined,
  SwapOutlined,
  UpOutlined
} from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDefaultSpotId,
  getGuideRouteById,
  getGuideSpotById,
  getGuideRouteSpots,
  guideRoutes,
  scenicCenter,
  type GuideSpot
} from '../data/guideData'
import { captureRateRoute } from '../lib/analytics'
import { loadTMap } from '../lib/loadTMap'
import { buildWalkingRoute } from '../lib/routePlanning'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'
import { useBottomSheetDrag } from '../hooks/useBottomSheetDrag'
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap'

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'
type RouteStatus = 'idle' | 'loading' | 'ready' | 'fallback'
type SheetState = 'collapsed' | 'half' | 'expanded'

const nextSheetState: Record<SheetState, SheetState> = {
  collapsed: 'half',
  half: 'expanded',
  expanded: 'collapsed'
}

// 拖拽手势调参(便于真机调):px/ms,正=向上
const DRAG_VELOCITY_THRESHOLD = 0.55
// 拖拽过冲极限(吸附前允许超出 expanded 高度多少 px,做 rubber-band 视觉)
const DRAG_OVERSHOOT = 60

const scenicMarkerIcon = createSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
    <path d="M24 2c-10.5 0-19 8.5-19 19 0 13.7 15.5 27 18.2 29.2a1 1 0 0 0 1.3 0C27.5 48 43 34.7 43 21 43 10.5 34.5 2 24 2Z" fill="#0D9488" stroke="#ffffff" stroke-width="2"/>
    <circle cx="24" cy="21" r="7.5" fill="#ffffff"/>
  </svg>
`)

const activeMarkerIcon = createSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="54" height="62" viewBox="0 0 54 62">
    <path d="M27 3c-11.6 0-21 9.4-21 21 0 14.8 17.4 29.4 20.3 31.7a1.1 1.1 0 0 0 1.4 0C30.6 53.4 48 38.8 48 24 48 12.4 38.6 3 27 3Z" fill="#D97706" stroke="#fffdf7" stroke-width="2"/>
    <circle cx="27" cy="24" r="8.5" fill="#fffdf7"/>
  </svg>
`)

function MobileMapPage() {
  const navigate = useNavigate()
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)

  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const setSelectedSpotId = useGuideStore((state) => state.setSelectedSpotId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)

  const [mapStatus, setMapStatus] = useState<MapStatus>('idle')
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')
  const [pageMessage, setPageMessage] = useState('地图准备中...')
  const [showRoutes, setShowRoutes] = useState(false)
  const [sheetState, setSheetState] = useState<SheetState>('collapsed')
  const [routeRating, setRouteRating] = useState(0)
  const [submittedRouteRatings, setSubmittedRouteRatings] = useState<Record<string, number>>({})

  const route = getGuideRouteById(activeRouteId)
  const sceneId = `map:${route.id}`
  const routeSpots = useMemo(() => getGuideRouteSpots(route.id), [route.id])
  const selectedSpot = getGuideSpotById(selectedSpotId || getDefaultSpotId(route.id))
  const selectedIndex = route.stops.findIndex((stop) => stop.spotId === selectedSpot.id)
  const selectedNarrative =
    route.stops.find((stop) => stop.spotId === selectedSpot.id)?.narrative ?? selectedSpot.intro
  const nextStop = selectedIndex >= 0 ? route.stops[selectedIndex + 1] : route.stops[1]
  const nextSpot = nextStop ? getGuideSpotById(nextStop.spotId) : null
  const submittedRating = submittedRouteRatings[route.id] ?? 0
  const routeStatusLabel =
    routeStatus === 'loading'
      ? '路线规划中'
      : routeStatus === 'fallback'
        ? '路线就绪'
        : routeStatus === 'ready'
          ? '路线就绪'
          : mapStatus === 'error'
            ? '地图加载失败'
            : '准备中'

  useEffect(() => {
    setActiveScene(sceneId, { routeName: route.name })
  }, [route.name, sceneId, setActiveScene])

  useEffect(() => {
    if (!route.stops.some((stop) => stop.spotId === selectedSpotId)) {
      setSelectedSpotId(getDefaultSpotId(route.id))
    }
  }, [route.id, route.stops, selectedSpotId, setSelectedSpotId])

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      if (!mapElementRef.current) return

      setMapStatus('loading')
      setPageMessage('正在加载腾讯地图底座...')

      try {
        const TMap = await loadTMap()
        if (cancelled || !mapElementRef.current) return

        const center = new TMap.LatLng(scenicCenter.lat, scenicCenter.lng)
        const map = new TMap.Map(mapElementRef.current, {
          center,
          zoom: 16,
          pitch: 0,
          rotation: 0
        })
        mapRef.current = map

        setMapStatus('ready')
        setPageMessage('地图已就绪，开始绘制路线。')
      } catch (error) {
        setMapStatus('error')
        setPageMessage(error instanceof Error ? error.message : '腾讯地图初始化失败。')
      }
    }

    void initMap()

    return () => {
      cancelled = true
      mapRef.current?.destroy?.()
      mapRef.current = null
      markerLayerRef.current = null
      routeLayerRef.current = null
    }
  }, [])

  // Effect A:仅 routeSpots / selectedSpot.id 变化时重建 marker layer
  // (之前把 sheetState 也写进 deps,导致拖拽 sheet 时不断重建 MultiMarker → GC 抖)
  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) return

    markerLayerRef.current?.setMap?.(null)

    markerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: {
        scenic: new window.TMap.MarkerStyle({
          width: 24,
          height: 28,
          anchor: { x: 12, y: 28 },
          src: scenicMarkerIcon
        }),
        active: new window.TMap.MarkerStyle({
          width: 30,
          height: 34,
          anchor: { x: 15, y: 34 },
          src: activeMarkerIcon
        })
      },
      geometries: routeSpots.map((spot) => ({
        id: spot.id,
        styleId: spot.id === selectedSpot.id ? 'active' : 'scenic',
        position: new window.TMap.LatLng(spot.lat, spot.lng),
        properties: { title: spot.name, intro: spot.intro }
      }))
    })

    markerLayerRef.current.on('click', (event: any) => {
      const spotId = event.geometry?.id
      if (!spotId) return
      setSelectedSpotId(spotId)
    })
  }, [mapStatus, routeSpots, selectedSpot.id, setSelectedSpotId])

  // Effect B:仅居中,独立追踪 sheetState 决定是否保留 zoom
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapRef.current) return
    focusSpot(mapRef.current, selectedSpot, sheetState !== 'collapsed')
  }, [mapStatus, selectedSpot.id, sheetState])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current || routeSpots.length < 2) return

    let cancelled = false

    async function renderRoute() {
      setRouteStatus('loading')
      setPageMessage(`${route.name}正在规划景区步行路线...`)

      const plannedRoute = await buildWalkingRoute(routeSpots)
      if (cancelled || !window.TMap || !mapRef.current) return

      routeLayerRef.current?.setMap?.(null)
      routeLayerRef.current = new window.TMap.MultiPolyline({
        map: mapRef.current,
        styles: {
          route: new window.TMap.PolylineStyle({
            color: '#0D9488',
            width: 6,
            borderWidth: 2,
            borderColor: '#ffffff',
            lineCap: 'round'
          })
        },
        geometries: [
          {
            id: route.id,
            styleId: 'route',
            paths: plannedRoute.path.map((point) => new window.TMap.LatLng(point.lat, point.lng))
          }
        ]
      })

      fitMapToRoute(mapRef.current, routeSpots)

      if (plannedRoute.usedFallback) {
        setRouteStatus('fallback')
        setPageMessage(`${route.name}已为你连好途经景点，按顺序游览即可。`)
        return
      }

      setRouteStatus('ready')
      setPageMessage(`${route.name}已按腾讯步行规划绘制完成。`)
    }

    void renderRoute()

    return () => {
      cancelled = true
    }
  }, [mapStatus, route.id, route.name, routeSpots])

  // 切换 sheet 状态时重新取景，保证路线始终落在 sheet 之上、不被遮挡
  useEffect(() => {
    if (mapStatus !== 'ready' || routeSpots.length < 2) return
    fitMapToRoute(mapRef.current, routeSpots, SHEET_BOTTOM_PADDING[sheetState])
  }, [sheetState, mapStatus, routeSpots])

  const switchRoute = (routeId: string) => {
    setActiveRouteId(routeId)
    setRouteRating(0)
    setShowRoutes(false)
    setSheetState('collapsed')
  }

  const setSpot = (spotId: string) => {
    const spot = getGuideSpotById(spotId)
    setSelectedSpotId(spot.id)
    focusSpot(mapRef.current, spot, sheetState !== 'collapsed')
  }

  // 路线浮层焦点管理 → 提到通用 hook
  const routeDialogRef = useRef<HTMLDivElement | null>(null)
  const routeCloseBtnRef = useRef<HTMLButtonElement | null>(null)
  useDialogFocusTrap({
    open: showRoutes,
    ref: routeDialogRef,
    onClose: () => setShowRoutes(false),
    initialFocusRef: routeCloseBtnRef
  })

  // sheet 拖拽 → 提到通用 hook
  const sheetRef = useRef<HTMLElement | null>(null)
  const getSnapHeights = (): Record<SheetState, number> => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    return {
      collapsed: 116,
      half: Math.min(vh * 0.4, 312),
      expanded: Math.min(vh * 0.6, 470)
    }
  }
  const {
    onTouchStart: handleSheetTouchStart,
    onTouchMove: handleSheetTouchMove,
    onTouchEnd: finishSheetDrag
  } = useBottomSheetDrag<SheetState>({
    sheetRef,
    snapsOf: getSnapHeights,
    state: sheetState,
    setState: setSheetState,
    order: ['collapsed', 'half', 'expanded'],
    dragSelector: '.mobile-map-sheet__handle, .mobile-map-sheet__summary',
    velocityThreshold: DRAG_VELOCITY_THRESHOLD,
    overshoot: DRAG_OVERSHOOT
  })

  const submitRouteRating = () => {
    if (routeRating <= 0 || submittedRating > 0) return
    captureRateRoute(route.id, routeRating)
    setSubmittedRouteRatings((current) => ({ ...current, [route.id]: routeRating }))
  }

  return (
    <div className="mobile-map-page">
      <div
        ref={mapElementRef}
        className="mobile-map-page__map"
        role="application"
        aria-label={`灵山胜境地图,当前路线 ${route.name},共 ${route.stops.length} 站`}
      />
      {/* 屏幕阅读器实时播报 sheet 状态变化 */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {sheetState === 'collapsed'
          ? '景点详情已收起'
          : sheetState === 'half'
            ? '景点详情已半展开,显示景点列表'
            : '景点详情已完全展开,显示简介与评分'}
      </div>

      {/* 浮动顶栏：返回 / 当前路线(含状态小圆点) / 切路线 */}
      <header className="mobile-map-floating-header">
        <button type="button" className="mobile-map-icon-btn" onClick={() => navigate('/')} aria-label="返回首页">
          <ArrowLeftOutlined />
        </button>
        <div className="mobile-map-floating-header__title">
          <strong>
            {route.name}
            <span
              className={`mobile-map-status-dot is-${routeStatus === 'ready' || routeStatus === 'fallback' ? 'ready' : routeStatus === 'loading' ? 'loading' : mapStatus === 'error' ? 'error' : 'idle'}`}
              aria-label={routeStatusLabel}
              title={routeStatusLabel}
            />
          </strong>
          <span>{route.durationLabel}</span>
        </div>
        <button
          type="button"
          className={`mobile-map-route-toggle ${showRoutes ? 'is-open' : ''}`}
          onClick={() => setShowRoutes((value) => !value)}
        >
          <SwapOutlined />
          切路线
        </button>
      </header>

      {/* 看全线：折叠态时浮动在右下、地图之上；展开后移入 sheet 内 */}
      {sheetState === 'collapsed' ? (
        <button
          type="button"
          className="mobile-map-focus-btn"
          onClick={() => fitMapToRoute(mapRef.current, routeSpots, SHEET_BOTTOM_PADDING[sheetState])}
          aria-label="查看全线"
        >
          <AimOutlined />
          <span>看全线</span>
        </button>
      ) : null}

      {showRoutes ? (
        <>
          <div className="mobile-map-scrim" onClick={() => setShowRoutes(false)} />
          <div
            ref={routeDialogRef}
            className="mobile-route-switcher"
            role="dialog"
            aria-modal="true"
            aria-label="切换路线"
          >
            <div className="mobile-route-switcher__head">
              <strong>切换路线</strong>
              <button
                ref={routeCloseBtnRef}
                type="button"
                onClick={() => setShowRoutes(false)}
                aria-label="关闭路线切换"
              >
                <CloseOutlined />
              </button>
            </div>
            {guideRoutes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === route.id ? 'is-active' : ''}
                onClick={() => switchRoute(item.id)}
              >
                <span>{item.name}</span>
                <small>{item.id === route.id ? '当前路线' : item.durationLabel}</small>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* 底部 sheet：默认极简，可上拉展开（折叠 → 半展开 → 展开） */}
      <section
        ref={sheetRef}
        className={`mobile-map-sheet is-${sheetState}`}
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={finishSheetDrag}
        onTouchCancel={finishSheetDrag}
      >
        <button
          className="mobile-map-sheet__handle"
          type="button"
          onClick={() => setSheetState((value) => nextSheetState[value])}
          aria-label={sheetState === 'expanded' ? '收起景点详情' : '展开景点详情'}
        >
          <span className="mobile-map-sheet__grip" />
          {sheetState === 'expanded' ? <DownOutlined /> : <UpOutlined />}
        </button>

        {/* 概要：始终显示（站序 / 站名 / 下一站 / 讲解） */}
        <div className="mobile-map-sheet__summary">
          <div className="mobile-map-sheet__summary-text">
            <span className="mobile-section-kicker">
              第 {selectedIndex + 1} / {route.stops.length} 站
            </span>
            <strong>{selectedSpot.name}</strong>
            <span className="mobile-map-sheet__next">
              {nextSpot ? `下一站 · ${nextSpot.name}` : '已到路线终点'}
            </span>
          </div>
          <button
            type="button"
            className="mobile-map-sheet__cta"
            onClick={() => navigate(`/spot/${selectedSpot.id}`)}
          >
            讲解
            <RightOutlined />
          </button>
        </div>

        {/* 半展开：景点横滑 + 下一站 + 进入讲解；完全展开再加简介/评分 */}
        {sheetState !== 'collapsed' ? (
          <div className="mobile-map-sheet__body">
            {sheetState === 'expanded' ? (
              <p className="mobile-map-sheet__narrative">{selectedNarrative}</p>
            ) : null}

            <div className="mobile-map-sheet__meta">
              <span>{nextSpot ? `下一站 · ${nextSpot.name}` : '已到路线终点'}</span>
              <button type="button" onClick={() => fitMapToRoute(mapRef.current, routeSpots, SHEET_BOTTOM_PADDING[sheetState])}>
                <AimOutlined />
                看全线
              </button>
            </div>

            <div className="mobile-spot-strip">
              {routeSpots.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  className={spot.id === selectedSpot.id ? 'is-active' : ''}
                  onClick={() => setSpot(spot.id)}
                >
                  <span>{spot.name}</span>
                  <small>{spot.stayMinutes} 分钟</small>
                </button>
              ))}
            </div>

            {sheetState === 'expanded' ? (
              <div className="mobile-map-sheet__rating">
                <div>
                  <span>路线体验评分</span>
                  {submittedRating > 0 ? <small>已提交 {submittedRating} 星</small> : null}
                </div>
                <div className="mobile-map-sheet__rate-actions">
                  <div className="mobile-star-rate" role="radiogroup" aria-label="路线评分">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (submittedRating || routeRating) >= star
                      return (
                        <button
                          key={star}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={submittedRating > 0}
                          className={`mobile-star-rate__star ${active ? 'is-on' : ''}`}
                          onClick={() => setRouteRating(star)}
                          aria-label={`${star} 星`}
                        >
                          ★
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={routeRating <= 0 || submittedRating > 0}
                    onClick={submitRouteRating}
                  >
                    {submittedRating > 0 ? <CheckOutlined /> : '提交'}
                  </button>
                </div>
              </div>
            ) : null}

            <button
              className="mobile-primary-action"
              type="button"
              onClick={() => navigate(`/spot/${selectedSpot.id}`)}
            >
              进入讲解
              <RightOutlined />
            </button>
          </div>
        ) : null}
      </section>

      {mapStatus !== 'ready' ? (
        <div className="mobile-map-loading">
          <div>
            <LoadingOutlined />
            <strong>{mapStatus === 'error' ? '地图加载异常' : '地图准备中'}</strong>
            <span>{pageMessage}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function focusSpot(map: any, spot: GuideSpot, keepZoom = false) {
  if (!window.TMap || !map) return

  const position = new window.TMap.LatLng(spot.lat, spot.lng)
  map.setCenter(position)
  if (!keepZoom) {
    map.setZoom?.(16)
  }
}

// 不同 sheet 状态下底部 sheet 占据的高度（约），用于给路线让出底部空间
const SHEET_BOTTOM_PADDING: Record<SheetState, number> = {
  collapsed: 150,
  half: 360,
  expanded: 510
}

function fitMapToRoute(map: any, spots: GuideSpot[], bottomPadding = SHEET_BOTTOM_PADDING.collapsed) {
  if (!window.TMap || !map || spots.length === 0) return

  const lats = spots.map((spot) => spot.lat)
  const lngs = spots.map((spot) => spot.lng)

  if (typeof window.TMap.LatLngBounds === 'function' && typeof map.fitBounds === 'function') {
    const southWest = new window.TMap.LatLng(Math.min(...lats), Math.min(...lngs))
    const northEast = new window.TMap.LatLng(Math.max(...lats), Math.max(...lngs))
    const bounds = new window.TMap.LatLngBounds(southWest, northEast)
    // 顶栏 + 底部 sheet 各自让出空间，路线不会被浮层压住
    map.fitBounds(bounds, { padding: { top: 96, right: 48, bottom: bottomPadding, left: 48 } })
    return
  }

  map.setCenter(
    new window.TMap.LatLng(
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    )
  )
}

function createSvgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export default MobileMapPage
