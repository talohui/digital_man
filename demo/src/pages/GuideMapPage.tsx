import { ArrowLeftOutlined, EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons'
import { Modal, Rate } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  lingshanSceneRouteToGuideRouteMap,
  USE_LINGSHAN_PRESET_ROUTE_PATHS
} from '../data/lingshanMapData'
import { loadTMap } from '../lib/loadTMap'
import { buildPlannedRouteFromPath, buildWalkingRoute } from '../lib/routePlanning'
import { useGuideStore } from '../store/useGuideStore'
import { useChatStore } from '../store/useChatStore'

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'
type RouteStatus = 'idle' | 'loading' | 'ready' | 'fallback'

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
  const infoWindowRef = useRef<any>(null)
  const appliedQueryPoiIdRef = useRef<string | null>(null)
  const appliedQueryPoiFocusIdRef = useRef<string | null>(null)
  const appliedSceneRouteIdRef = useRef<string | null>(null)

  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const setSelectedSpotId = useGuideStore((state) => state.setSelectedSpotId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)

  const [mapStatus, setMapStatus] = useState<MapStatus>('idle')
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')
  const [pageMessage, setPageMessage] = useState('地图准备中...')
  const [showRoutePanel, setShowRoutePanel] = useState(false)

  const queryPoiId = searchParams.get('poi')?.trim() ?? ''
  const querySceneRouteId = searchParams.get('sceneRoute')?.trim() ?? ''
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
      mapRef.current?.destroy?.()
      mapRef.current = null
      markerLayerRef.current = null
      routeLayerRef.current = null
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
  }, [mapStatus, navigate, routeSpots, selectedSpot, setSelectedSpotId])

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
      setPageMessage(`${route.name}正在规划景区步行路线...`)

      const presetRoutePath = USE_LINGSHAN_PRESET_ROUTE_PATHS ? getLingshanPresetRoutePath(route.id) : undefined
      const hasPresetRoutePath = presetRoutePath !== undefined && presetRoutePath.path.length >= 2
      const plannedRoute = hasPresetRoutePath
        ? buildPlannedRouteFromPath(presetRoutePath.path)
        : await buildWalkingRoute(routeSpots)

      if (cancelled || !window.TMap || !mapRef.current) {
        return
      }

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
        setRouteStatus('fallback')
        setPageMessage(`${route.name}当前使用直线兜底连线，地图仍可正常导览。`)
        return
      }

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

export default GuideMapPage
