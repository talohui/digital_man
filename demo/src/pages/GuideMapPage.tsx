import { ArrowLeftOutlined, EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons'
import { Modal, Rate } from 'antd'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { captureRateRoute } from '../lib/analytics'
import {
  getDefaultSpotId,
  getGuideRouteById,
  getGuideSpotById,
  getGuideRouteSpots,
  guideRoutes,
  guideSpots,
  scenicCenter,
  type GuideSpot,
  type LatLngPoint
} from '../data/guideData'
import {
  getLingshanPresetRoutePath,
  lingshanPois,
  lingshanSceneRoutes,
  lingshanSceneRouteToGuideRouteMap,
  USE_LINGSHAN_PRESET_ROUTE_PATHS
} from '../data/lingshanMapData'
import { loadTMap } from '../lib/loadTMap'
import { buildPlannedRouteFromPath, buildWalkingRoute, type PlannedRoute } from '../lib/routePlanning'
import { useGuideStore } from '../store/useGuideStore'
import { useChatStore } from '../store/useChatStore'

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'
type RouteStatus = 'idle' | 'loading' | 'ready' | 'fallback'
type RouteDiagnostics = {
  pathPointCount: number
  distanceMeters: number
  durationMinutes: number
  usedFallback: boolean
  fallbackReason?: string
}
type RouteSource = 'unknown' | 'tencent_walking' | 'preset' | 'fallback'

const QUERY_POI_FOCUS_ZOOM = 17

const scenicMarkerIcon = createSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(27,94,32,0.18)"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <path d="M24 2c-10.493 0-19 8.507-19 19 0 13.703 15.52 27.033 18.159 29.188a1 1 0 0 0 1.282 0C27.48 48.033 43 34.703 43 21 43 10.507 34.493 2 24 2Z" fill="#0D9488" stroke="#ffffff" stroke-width="2"/>
      <circle cx="24" cy="21" r="7.5" fill="#ffffff"/>
    </g>
  </svg>
`)

const activeMarkerIcon = createSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="54" height="62" viewBox="0 0 54 62">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="rgba(217,119,6,0.26)"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <path d="M27 3c-11.598 0-21 9.402-21 21 0 14.831 17.353 29.355 20.301 31.742a1.1 1.1 0 0 0 1.398 0C30.647 53.355 48 38.831 48 24 48 12.402 38.598 3 27 3Z" fill="#D97706" stroke="#fffdf7" stroke-width="2"/>
      <circle cx="27" cy="24" r="8.5" fill="#fffdf7"/>
    </g>
  </svg>
`)

function GuideMapPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const sceneRouteDebugLayerRef = useRef<any>(null)
  const infoWindowRef = useRef<any>(null)
  const appliedQueryPoiIdRef = useRef<string | null>(null)
  const appliedQueryPoiFocusIdRef = useRef<string | null>(null)
  const appliedSceneRouteIdRef = useRef<string | null>(null)
  const showCurrentRouteRef = useRef(true)

  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const setSelectedSpotId = useGuideStore((state) => state.setSelectedSpotId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)

  const [mapStatus, setMapStatus] = useState<MapStatus>('idle')
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')
  const [pageMessage, setPageMessage] = useState('地图准备中...')
  const [showRoutePanel, setShowRoutePanel] = useState(false)
  const [routeDiagnostics, setRouteDiagnostics] = useState<RouteDiagnostics | null>(null)
  const [currentPlannedRouteForDebug, setCurrentPlannedRouteForDebug] = useState<PlannedRoute | null>(null)
  const [routeExportMessage, setRouteExportMessage] = useState('')
  const [routeSource, setRouteSource] = useState<RouteSource>('unknown')

  const queryPoiId = searchParams.get('poi')?.trim() ?? ''
  const querySceneRouteId = searchParams.get('sceneRoute')?.trim() ?? ''
  const queryDebugSceneRoute = searchParams.get('debugSceneRoute')?.trim().toLowerCase() ?? ''
  const isSceneRouteDebugEnabled = Boolean(querySceneRouteId) && (queryDebugSceneRoute === '1' || queryDebugSceneRoute === 'true')
  const [showPoiMarkers, setShowPoiMarkers] = useState(true)
  const [showCurrentRoute, setShowCurrentRoute] = useState(true)
  const [showSceneRouteDebugLine, setShowSceneRouteDebugLine] = useState(isSceneRouteDebugEnabled)
  const [showRouteDiagnosticsPanel, setShowRouteDiagnosticsPanel] = useState(isSceneRouteDebugEnabled)
  const shouldShowSceneRouteDebugLine = Boolean(querySceneRouteId) && showSceneRouteDebugLine
  const queryPoiSpot = queryPoiId ? guideSpots.find((spot) => spot.id === queryPoiId) : undefined
  const queryPoiRoute = queryPoiSpot
    ? guideRoutes.find((item) => item.stops.some((stop) => stop.spotId === queryPoiSpot.id))
    : undefined
  const querySceneGuideRouteId = querySceneRouteId ? lingshanSceneRouteToGuideRouteMap[querySceneRouteId] : undefined
  const querySceneGuideRoute = querySceneGuideRouteId
    ? guideRoutes.find((item) => item.id === querySceneGuideRouteId)
    : undefined
  const route = getGuideRouteById(activeRouteId)
  const sceneId = `map:${route.id}`
  const routeSpots = useMemo(() => getGuideRouteSpots(route.id), [route.id])
  const sceneRouteDebugPath = useMemo(
    () => (querySceneRouteId ? getSceneRouteDebugPath(querySceneRouteId) : []),
    [querySceneRouteId]
  )
  const selectedSpot = getGuideSpotById(selectedSpotId || getDefaultSpotId(route.id))
  const selectedIndex = route.stops.findIndex((stop) => stop.spotId === selectedSpot.id)

  const focusQueryPoiOnce = (spot: GuideSpot) => {
    if (appliedQueryPoiFocusIdRef.current === spot.id) {
      return
    }

    focusQueryPoiSpot(mapRef.current, infoWindowRef.current, spot)
    appliedQueryPoiFocusIdRef.current = spot.id
  }

  useEffect(() => {
    showCurrentRouteRef.current = showCurrentRoute
    routeLayerRef.current?.setMap?.(showCurrentRoute && mapRef.current ? mapRef.current : null)
  }, [mapStatus, showCurrentRoute])

  useEffect(() => {
    setShowSceneRouteDebugLine(isSceneRouteDebugEnabled)
    setShowRouteDiagnosticsPanel(isSceneRouteDebugEnabled)
  }, [isSceneRouteDebugEnabled, querySceneRouteId])

  useEffect(() => {
    setActiveScene(sceneId, { routeName: route.name })
  }, [route.name, sceneId, setActiveScene])

  useEffect(() => {
    if (!queryPoiSpot) {
      return
    }

    if (appliedQueryPoiIdRef.current === queryPoiSpot.id) {
      return
    }

    appliedQueryPoiFocusIdRef.current = null

    if (queryPoiRoute && queryPoiRoute.id !== activeRouteId) {
      setActiveRouteId(queryPoiRoute.id)
    }

    if (selectedSpotId !== queryPoiSpot.id) {
      setSelectedSpotId(queryPoiSpot.id)
    }

    appliedQueryPoiIdRef.current = queryPoiSpot.id
  }, [activeRouteId, queryPoiRoute, queryPoiSpot, selectedSpotId, setActiveRouteId, setSelectedSpotId])

  useEffect(() => {
    if (!querySceneRouteId || queryPoiSpot) {
      return
    }

    if (appliedSceneRouteIdRef.current === querySceneRouteId) {
      return
    }

    if (querySceneGuideRoute && querySceneGuideRoute.id !== activeRouteId) {
      setActiveRouteId(querySceneGuideRoute.id)
    }

    appliedSceneRouteIdRef.current = querySceneRouteId
  }, [activeRouteId, queryPoiSpot, querySceneGuideRoute, querySceneRouteId, setActiveRouteId])

  useEffect(() => {
    if (!route.stops.some((stop) => stop.spotId === selectedSpotId)) {
      setSelectedSpotId(getDefaultSpotId(route.id))
    }
  }, [route, selectedSpotId, setSelectedSpotId])

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      if (!mapElementRef.current) {
        return
      }

      setMapStatus('loading')
      setPageMessage('正在加载腾讯地图底座...')

      try {
        const TMap = await loadTMap()

        if (cancelled || !mapElementRef.current) {
          return
        }

        const center = new TMap.LatLng(scenicCenter.lat, scenicCenter.lng)
        const map = new TMap.Map(mapElementRef.current, {
          center,
          zoom: 16,
          pitch: 0,
          rotation: 0
        })
        mapRef.current = map

        infoWindowRef.current = new TMap.InfoWindow({
          map,
          position: center,
          content: '',
          offset: { x: 0, y: -42 }
        })
        infoWindowRef.current.close()

        setMapStatus('ready')
        setPageMessage('地图已就绪，开始绘制路线。')
      } catch (error) {
        const message = error instanceof Error ? error.message : '腾讯地图初始化失败。'
        setMapStatus('error')
        setPageMessage(message)
      }
    }

    void initMap()

    return () => {
      cancelled = true
      infoWindowRef.current?.close?.()
      sceneRouteDebugLayerRef.current?.setMap?.(null)
      mapRef.current?.destroy?.()
      mapRef.current = null
      markerLayerRef.current = null
      routeLayerRef.current = null
      sceneRouteDebugLayerRef.current = null
      infoWindowRef.current = null
    }
  }, [])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    markerLayerRef.current?.setMap?.(null)
    infoWindowRef.current?.close?.()

    markerLayerRef.current = new window.TMap.MultiMarker({
      map: showPoiMarkers ? mapRef.current : null,
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
        properties: {
          title: spot.name,
          intro: spot.intro
        }
      }))
    })

    markerLayerRef.current.on('click', (event: any) => {
      const spotId = event.geometry?.id

      if (!spotId) {
        return
      }

      setSelectedSpotId(spotId)
      navigate(`/spot/${spotId}`)
    })

    focusSpot(mapRef.current, infoWindowRef.current, selectedSpot)
  }, [mapStatus, navigate, routeSpots, selectedSpot, setSelectedSpotId, showPoiMarkers])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    sceneRouteDebugLayerRef.current?.setMap?.(null)
    sceneRouteDebugLayerRef.current = null

    if (!shouldShowSceneRouteDebugLine || sceneRouteDebugPath.length < 2) {
      return
    }

    sceneRouteDebugLayerRef.current = new window.TMap.MultiPolyline({
      map: mapRef.current,
      styles: {
        sceneRouteDebug: new window.TMap.PolylineStyle({
          color: '#D97706',
          width: 4,
          borderWidth: 1,
          borderColor: 'rgba(255, 246, 219, 0.82)',
          lineCap: 'round'
        })
      },
      geometries: [
        {
          id: `scene-route-debug:${querySceneRouteId}`,
          styleId: 'sceneRouteDebug',
          paths: sceneRouteDebugPath.map((point) => new window.TMap.LatLng(point.lat, point.lng))
        }
      ]
    })

    return () => {
      sceneRouteDebugLayerRef.current?.setMap?.(null)
      sceneRouteDebugLayerRef.current = null
    }
  }, [mapStatus, querySceneRouteId, sceneRouteDebugPath, shouldShowSceneRouteDebugLine])

  useEffect(() => {
    if (mapStatus !== 'ready' || !queryPoiSpot || selectedSpot.id !== queryPoiSpot.id) {
      return
    }

    focusQueryPoiOnce(queryPoiSpot)
  }, [mapStatus, queryPoiSpot, selectedSpot.id])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current || routeSpots.length < 2) {
      return
    }

    let cancelled = false

    async function renderRoute() {
      setRouteStatus('loading')
      setRouteDiagnostics(null)
      setCurrentPlannedRouteForDebug(null)
      setRouteExportMessage('')
      setRouteSource('unknown')
      setPageMessage(`${route.name}正在规划景区步行路线...`)

      const presetRoutePath = USE_LINGSHAN_PRESET_ROUTE_PATHS ? getLingshanPresetRoutePath(route.id) : undefined
      const hasPresetRoutePath = presetRoutePath !== undefined && presetRoutePath.path.length >= 2
      const plannedRoute = hasPresetRoutePath
        ? buildPlannedRouteFromPath(presetRoutePath.path)
        : await buildWalkingRoute(routeSpots)

      if (cancelled || !window.TMap || !mapRef.current) {
        return
      }

      setRouteDiagnostics({
        pathPointCount: plannedRoute.path.length,
        distanceMeters: plannedRoute.distanceMeters,
        durationMinutes: plannedRoute.durationMinutes,
        usedFallback: plannedRoute.usedFallback,
        fallbackReason: plannedRoute.fallbackReason
      })
      setCurrentPlannedRouteForDebug(plannedRoute)

      routeLayerRef.current?.setMap?.(null)
      routeLayerRef.current = new window.TMap.MultiPolyline({
        map: showCurrentRouteRef.current ? mapRef.current : null,
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

      if (
        queryPoiSpot &&
        selectedSpot.id === queryPoiSpot.id &&
        route.stops.some((stop) => stop.spotId === queryPoiSpot.id)
      ) {
        focusQueryPoiOnce(queryPoiSpot)
      } else {
        fitMapToRoute(mapRef.current, routeSpots)
      }

      if (plannedRoute.usedFallback) {
        setRouteSource('fallback')
        setRouteStatus('fallback')
        setPageMessage(`${route.name}当前使用直线兜底连线，地图仍可正常导览。`)
        return
      }

      setRouteSource(hasPresetRoutePath ? 'preset' : 'tencent_walking')
      setRouteStatus('ready')
      setPageMessage(hasPresetRoutePath ? `${route.name}已按园区预设路线绘制完成。` : `${route.name}已按腾讯步行规划绘制完成。`)
    }

    void renderRoute()

    return () => {
      cancelled = true
    }
  }, [mapStatus, queryPoiSpot, route, routeSpots])

  const [rateOpen, setRateOpen] = useState(false)
  const [rateStars, setRateStars] = useState(0)

  const closeRate = (submitted: boolean) => {
    if (submitted && rateStars > 0) captureRateRoute(route.id, rateStars)
    setRateOpen(false)
    setRateStars(0)
    navigate('/')
  }

  const handleRouteSwitch = (routeId: string) => {
    setActiveRouteId(routeId)
    setShowRoutePanel(false)
  }

  const handlePreviewOpen = () => {
    navigate(`/spot/${selectedSpot.id}`)
  }

  const buildWalkingRoutePathExportPayload = () => {
    if (!currentPlannedRouteForDebug) {
      return null
    }

    return {
      routeId: activeRouteId,
      sceneRoute: querySceneRouteId,
      generatedAt: new Date().toISOString(),
      source: 'tencent_walking_runtime',
      pointCount: currentPlannedRouteForDebug.path.length,
      distanceMeters: currentPlannedRouteForDebug.distanceMeters,
      durationMinutes: currentPlannedRouteForDebug.durationMinutes,
      usedFallback: currentPlannedRouteForDebug.usedFallback,
      fallbackReason: currentPlannedRouteForDebug.fallbackReason ?? null,
      path: currentPlannedRouteForDebug.path
    }
  }

  const handleCopyWalkingRoutePathJson = async () => {
    const payload = buildWalkingRoutePathExportPayload()

    if (!payload) {
      setRouteExportMessage('路线尚未生成')
      return
    }

    const jsonText = JSON.stringify(payload, null, 2)

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('当前浏览器不支持 Clipboard API')
      }

      await navigator.clipboard.writeText(jsonText)
      setRouteExportMessage('已复制')
    } catch {
      console.log('[GuideMapPage] walking route path JSON', jsonText)
      setRouteExportMessage('复制失败，已输出到控制台。')
    }
  }

  const handleDownloadWalkingRoutePathJson = () => {
    const payload = buildWalkingRoutePathExportPayload()

    if (!payload) {
      setRouteExportMessage('路线尚未生成')
      return
    }

    const jsonText = JSON.stringify(payload, null, 2)
    const fileName = `${querySceneRouteId || activeRouteId}.tencent-walking.json`

    try {
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      setRouteExportMessage('已生成下载文件')
    } catch {
      console.log('[GuideMapPage] walking route path JSON', jsonText)
      setRouteExportMessage('下载失败，已输出到控制台。')
    }
  }

  const selectedNarrative = route.stops.find((stop) => stop.spotId === selectedSpot.id)?.narrative ?? selectedSpot.intro

  return (
    <div className="guide-map-shell">
      <div ref={mapElementRef} className="map-underlay" />

      <div className="ui-overlay guide-map-overlay">
        <div className="guide-map-topbar">
          <div className="glass-card guide-map-pill">
            <button className="guide-icon-button" onClick={() => setRateOpen(true)}>
              <ArrowLeftOutlined />
            </button>
            <div className="guide-map-pill__body">
              <strong>{route.name}</strong>
              <span>{route.durationLabel}</span>
            </div>
            <button className="guide-route-switch-button" onClick={() => setShowRoutePanel((current) => !current)}>
              切路线
            </button>
          </div>
        </div>

        {showRoutePanel ? (
          <div className="glass-card guide-route-panel">
            <p>切换路线</p>
            {guideRoutes.map((item) => (
              <button
                key={item.id}
                className={`guide-route-panel__item ${item.id === route.id ? 'is-active' : ''}`}
                onClick={() => handleRouteSwitch(item.id)}
              >
                <span>{item.name}</span>
                <small>{item.id === route.id ? '当前路线' : item.durationLabel}</small>
              </button>
            ))}
          </div>
        ) : null}

        <section
          className="glass-card"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 328,
            maxWidth: 'calc(100vw - 40px)',
            padding: '14px 16px',
            color: '#26443a',
            pointerEvents: 'auto'
          }}
        >
          <p style={{ margin: '0 0 4px', color: '#0f766e', fontSize: 12, fontWeight: 800 }}>
            腾讯地图增强模式
          </p>
          <h1 style={{ margin: '0 0 8px', color: '#173b33', fontSize: 20, lineHeight: 1.25 }}>
            真实地图导览模式
          </h1>
          <p style={{ margin: '0 0 12px', color: '#4b635c', fontSize: 12, lineHeight: 1.6 }}>
            基于腾讯地图底图显示真实 POI、路线和导航兜底；沉浸式体验可切换到 3D 导览地图。
          </p>
          <button
            type="button"
            onClick={() => navigate('/scenic-3d-map')}
            style={{
              width: '100%',
              minHeight: 38,
              marginBottom: 12,
              border: 0,
              borderRadius: 12,
              background: '#0d9488',
              color: '#fffaf0',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 800,
              boxShadow: '0 12px 24px rgba(13, 148, 136, 0.18)'
            }}
          >
            进入 3D 导览地图
          </button>

          <div style={{ marginBottom: 12, paddingTop: 10, borderTop: '1px solid rgba(13, 148, 136, 0.12)' }}>
            <strong style={{ display: 'block', marginBottom: 8, color: '#244d43', fontSize: 13 }}>图层开关</strong>
            <label style={getLayerToggleStyle()}>
              <input
                type="checkbox"
                checked={showPoiMarkers}
                onChange={(event) => setShowPoiMarkers(event.target.checked)}
              />
              <span>显示 POI 标记</span>
            </label>
            <label style={getLayerToggleStyle()}>
              <input
                type="checkbox"
                checked={showCurrentRoute}
                onChange={(event) => setShowCurrentRoute(event.target.checked)}
              />
              <span>显示当前路线</span>
            </label>
            <label style={getLayerToggleStyle(!querySceneRouteId)}>
              <input
                type="checkbox"
                checked={showSceneRouteDebugLine}
                disabled={!querySceneRouteId}
                onChange={(event) => setShowSceneRouteDebugLine(event.target.checked)}
              />
              <span>显示 sceneRoute 调试线</span>
            </label>
            <label style={getLayerToggleStyle()}>
              <input
                type="checkbox"
                checked={showRouteDiagnosticsPanel}
                onChange={(event) => setShowRouteDiagnosticsPanel(event.target.checked)}
              />
              <span>显示路线诊断信息</span>
            </label>
          </div>

          <div style={{ marginBottom: 10, padding: 10, borderRadius: 12, background: 'rgba(255, 255, 255, 0.58)' }}>
            <strong style={{ display: 'block', marginBottom: 6, color: '#244d43', fontSize: 13 }}>路线状态</strong>
            <div style={{ display: 'grid', gap: 3, color: '#4b635c', fontSize: 12, lineHeight: 1.5 }}>
              <span>当前真实路线：{route.name}</span>
              <span>路线来源：{getRouteSourceLabel(routeSource)}</span>
              <span>usedFallback：{routeDiagnostics ? (routeDiagnostics.usedFallback ? 'true' : 'false') : '-'}</span>
              <span>
                距离 / 耗时：
                {routeDiagnostics ? `${routeDiagnostics.distanceMeters} 米 / ${routeDiagnostics.durationMinutes} 分钟` : '生成中'}
              </span>
              {routeDiagnostics?.fallbackReason ? <span>fallbackReason：{routeDiagnostics.fallbackReason}</span> : null}
            </div>
          </div>

          <p style={{ margin: 0, color: '#6b7f77', fontSize: 11, lineHeight: 1.55 }}>
            调试入口：访问 <code>/map?sceneRoute=xxx&amp;debugSceneRoute=1</code> 可打开骨架线、诊断信息和路线 path 导出能力。
          </p>
        </section>

        {showRouteDiagnosticsPanel ? (
          <div
            className="glass-card"
            style={{
              position: 'absolute',
              top: 86,
              left: 20,
              maxWidth: 360,
              padding: '12px 14px',
              color: '#4b3b17',
              fontSize: 12,
              lineHeight: 1.6,
              pointerEvents: 'auto'
            }}
          >
            <strong style={{ display: 'block', marginBottom: 4, color: '#9a5a08' }}>路线诊断信息</strong>
            <span>
              {querySceneRouteId
                ? '金色线为 3D sceneRoute 的 POI 骨架连线，不代表真实步行道路。蓝绿色路线为腾讯 walking 或当前真实地图路线。'
                : '当前显示 plannedRoute 诊断信息。带 sceneRoute 查询参数进入时，可额外查看 3D 路线骨架线。'}
            </span>
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid rgba(154, 90, 8, 0.18)',
                color: '#58451d'
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4, color: '#73510e' }}>plannedRoute 诊断</strong>
              {routeDiagnostics ? (
                <div style={{ display: 'grid', gap: 2 }}>
                  <span>activeRouteId：{route.id}</span>
                  <span>query sceneRoute：{querySceneRouteId || '-'}</span>
                  <span>path 点数：{routeDiagnostics.pathPointCount}</span>
                  <span>距离：{routeDiagnostics.distanceMeters} 米</span>
                  <span>耗时：{routeDiagnostics.durationMinutes} 分钟</span>
                  <span>usedFallback：{routeDiagnostics.usedFallback ? 'true' : 'false'}</span>
                  <span>
                    路线来源：
                    {routeDiagnostics.usedFallback ? '存在 fallback 直线兜底段或整条路线兜底' : '腾讯 walking route 成功'}
                  </span>
                  {routeDiagnostics.fallbackReason ? <span>fallbackReason：{routeDiagnostics.fallbackReason}</span> : null}
                </div>
              ) : (
                <span>路线生成中...</span>
              )}
            </div>
            {isSceneRouteDebugEnabled ? (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid rgba(154, 90, 8, 0.18)'
                }}
              >
                <p style={{ margin: '0 0 8px', color: '#665326' }}>
                  可复制或下载腾讯 walking 路线 path JSON，下载后的 JSON 可暂存到 tmp/route-exports，后续整理为 routeGeometry 候选数据。该 path 是经纬度点串，不能直接作为 Three.js 坐标，需要再经过 geoToScenePosition 或后续路线映射。
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 6
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCopyWalkingRoutePathJson}
                    disabled={!currentPlannedRouteForDebug}
                    style={getRouteExportButtonStyle(Boolean(currentPlannedRouteForDebug))}
                  >
                    复制腾讯路线 path JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadWalkingRoutePathJson}
                    disabled={!currentPlannedRouteForDebug}
                    style={getRouteExportButtonStyle(Boolean(currentPlannedRouteForDebug))}
                  >
                    下载腾讯路线 path JSON
                  </button>
                </div>
                {routeExportMessage ? (
                  <span style={{ display: 'block', marginTop: 6, color: '#7a4b08' }}>{routeExportMessage}</span>
                ) : null}
              </div>
            ) : null}
            {shouldShowSceneRouteDebugLine && sceneRouteDebugPath.length < 2 ? (
              <span style={{ display: 'block', marginTop: 4, color: '#8a4f0b' }}>当前 sceneRoute 未找到可绘制的骨架线。</span>
            ) : null}
          </div>
        ) : null}

        <div className="guide-map-bottom">
          <div className="glass-card guide-spot-drawer">
            <div className="guide-spot-drawer__head">
              <div>
                <span className="guide-spot-drawer__kicker">
                  第 {selectedIndex + 1} 站 / 共 {route.stops.length} 站
                </span>
                <h2>{selectedSpot.name}</h2>
              </div>
              <span className={`guide-status-pill ${routeStatus === 'fallback' ? 'guide-status-pill--warn' : 'guide-status-pill--ok'}`}>
                {routeStatus === 'loading' ? <LoadingOutlined /> : null}
                {routeStatus === 'fallback' ? '兜底路线' : '路线已加载'}
              </span>
            </div>

            <p className="guide-spot-drawer__desc">{selectedSpot.intro}</p>
            <p className="guide-spot-drawer__narrative">{selectedNarrative}</p>

            <div className="guide-route-card__tags">
              {route.tags.map((tag) => (
                <span key={tag} className="guide-route-card__tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="guide-spot-strip">
              {route.stops.map((stop) => {
                const spot = getGuideSpotById(stop.spotId)
                return (
                  <button
                    key={stop.spotId}
                    className={`guide-spot-strip__item ${spot.id === selectedSpot.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedSpotId(spot.id)
                      focusSpot(mapRef.current, infoWindowRef.current, spot)
                    }}
                  >
                    {spot.name}
                  </button>
                )
              })}
            </div>

            <div className="guide-spot-drawer__actions">
              <button className="btn-secondary" onClick={() => fitMapToRoute(mapRef.current, routeSpots)}>
                回到整条路线
              </button>
              <button className="btn-primary" onClick={handlePreviewOpen}>
                进入数字人讲解
              </button>
            </div>

            <p className="guide-map-message">{pageMessage}</p>
          </div>
        </div>
      </div>

      {mapStatus !== 'ready' ? (
        <div className="guide-map-loading">
          <div className="glass-card guide-map-loading__card">
            <h2>地图准备中</h2>
            <p>{pageMessage}</p>
          </div>
        </div>
      ) : null}

      <Modal
        open={rateOpen}
        title={null}
        footer={null}
        closable={false}
        centered
        width={420}
        onCancel={() => closeRate(false)}
        maskClosable
      >
        <div className="rate-modal">
          <p className="rate-modal__eyebrow">本次导览反馈</p>
          <h3 className="rate-modal__title">{route.name} 给你的体验如何?</h3>
          <p className="rate-modal__sub">你的评分会同步影响管理大屏的满意度指标</p>
          <div className="rate-modal__rate">
            <Rate value={rateStars} onChange={setRateStars} allowClear={false} style={{ fontSize: 36 }} />
            <span className="rate-modal__hint">
              {['', '不太满意', '一般', '还行', '满意', '非常满意'][rateStars] || '点亮星星给个评价'}
            </span>
          </div>
          <div className="rate-modal__actions">
            <button className="rate-modal__skip" onClick={() => closeRate(false)}>跳过</button>
            <button
              className="btn-primary rate-modal__submit"
              onClick={() => closeRate(true)}
              disabled={rateStars === 0}
            >
              提交并返回
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function getSceneRouteDebugPath(sceneRouteId: string): LatLngPoint[] {
  const sceneRoute = lingshanSceneRoutes.find((item) => item.id === sceneRouteId)

  if (!sceneRoute) {
    return []
  }

  return sceneRoute.poiSequence
    .map((poiId) => {
      const lingshanPoi = lingshanPois.find((poi) => poi.id === poiId)

      if (lingshanPoi) {
        return lingshanPoi.displayLocation
      }

      const guideSpot = guideSpots.find((spot) => spot.id === poiId)

      if (!guideSpot) {
        return null
      }

      return {
        lat: guideSpot.lat,
        lng: guideSpot.lng
      }
    })
    .filter((point): point is LatLngPoint => point !== null)
}

function focusSpot(map: any, infoWindow: any, spot: GuideSpot) {
  if (!window.TMap || !map || !infoWindow) {
    return
  }

  const position = new window.TMap.LatLng(spot.lat, spot.lng)
  map.setCenter(position)
  infoWindow.setPosition(position)
  infoWindow.setContent(renderInfoWindowContent(spot))
  infoWindow.open()
}

function focusQueryPoiSpot(map: any, infoWindow: any, spot: GuideSpot) {
  focusSpot(map, infoWindow, spot)

  if (map && typeof map.setZoom === 'function') {
    map.setZoom(QUERY_POI_FOCUS_ZOOM)
  }
}

function fitMapToRoute(map: any, spots: GuideSpot[]) {
  if (!window.TMap || !map || spots.length === 0) {
    return
  }

  const lats = spots.map((spot) => spot.lat)
  const lngs = spots.map((spot) => spot.lng)

  if (typeof window.TMap.LatLngBounds === 'function' && typeof map.fitBounds === 'function') {
    const southWest = new window.TMap.LatLng(Math.min(...lats), Math.min(...lngs))
    const northEast = new window.TMap.LatLng(Math.max(...lats), Math.max(...lngs))
    const bounds = new window.TMap.LatLngBounds(southWest, northEast)
    map.fitBounds(bounds, { padding: 96 })
    return
  }

  map.setCenter(new window.TMap.LatLng((Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2))
}

function renderInfoWindowContent(spot: GuideSpot) {
  return `
    <div style="max-width:240px;padding:8px 10px;color:#244235;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="font-size:15px;font-weight:700;">${spot.name}</div>
      <div style="margin-top:6px;font-size:13px;line-height:1.6;">${spot.intro}</div>
      <div style="margin-top:8px;font-size:12px;color:#0D9488;">建议停留 ${spot.stayMinutes} 分钟</div>
    </div>
  `
}

function createSvgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function getRouteExportButtonStyle(enabled: boolean): CSSProperties {
  return {
    width: '100%',
    minHeight: 34,
    border: '1px solid rgba(154, 90, 8, 0.28)',
    borderRadius: 10,
    background: enabled ? 'rgba(255, 246, 219, 0.92)' : 'rgba(255, 255, 255, 0.46)',
    color: enabled ? '#7a4b08' : '#9a8d6b',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 12,
    fontWeight: 800
  }
}

function getRouteSourceLabel(routeSource: RouteSource) {
  switch (routeSource) {
    case 'tencent_walking':
      return '腾讯 walking route'
    case 'preset':
      return '预设路线'
    case 'fallback':
      return 'fallback 兜底'
    default:
      return '路线生成中'
  }
}

function getLayerToggleStyle(disabled = false): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
    color: disabled ? '#9aa8a1' : '#38584f',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12,
    fontWeight: 700
  }
}

export default GuideMapPage
