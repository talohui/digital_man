import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { guideRoutes, guideSpots, scenicCenter, type GuideRoute, type LatLngPoint } from '../data/guideData'
import { lingshanPois, type LingshanPoi } from '../data/lingshanMapData'
import { getMapModelOverlayByPoiId, type LingshanMapModelOverlay } from '../data/lingshanMapModelOverlays'
import { getLingshanRouteGeometryByGuideRouteId } from '../data/lingshanRouteGeometries'
import { loadTMap } from '../lib/loadTMap'
import { buildPlannedRouteFromPath, buildWalkingRoute, type PlannedRoute } from '../lib/routePlanning'
import { findNearestRoutePoint, findNextStop, formatDistanceMeters, haversineDistanceMeters } from '../lib/routeProgress'

type Map3DGuideStatus = 'idle' | 'loading' | 'ready' | 'error'
type RerouteStatus = 'idle' | 'off_route' | 'planning' | 'ready' | 'failed'

const demoGuideRoute = guideRoutes.find((route) => route.id === 'historical_culture') ?? guideRoutes[0]
const demoRouteGeometry = getLingshanRouteGeometryByGuideRouteId('historical_culture')
const demoRoutePath = demoRouteGeometry?.path.length ? demoRouteGeometry.path : getRouteStopLocations(demoGuideRoute)
const demoPlannedRoute = buildPlannedRouteFromPath(demoRoutePath)
const initialPosition = getRouteStopLocation(demoGuideRoute.stops[0]?.spotId) ?? demoRoutePath[0] ?? scenicCenter
const defaultModelOverlay = getMapModelOverlayByPoiId('giant_buddha')
const progressStep = Math.max(8, Math.round(demoRoutePath.length / 28))
const offRouteOffset = { lat: 0.00105, lng: 0.00125 }

function Map3DGuidePage() {
  const navigate = useNavigate()
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const poiMarkerLayerRef = useRef<any>(null)
  const userMarkerLayerRef = useRef<any>(null)
  const rerouteLayerRef = useRef<any>(null)
  const gltfModelRef = useRef<any>(null)
  const [mapStatus, setMapStatus] = useState<Map3DGuideStatus>('idle')
  const [pageMessage, setPageMessage] = useState('正在准备真实 3D 地图导览模式...')
  const [simulatedPosition, setSimulatedPosition] = useState<LatLngPoint>(initialPosition)
  const [routePathIndex, setRoutePathIndex] = useState(0)
  const [selectedStopIndex, setSelectedStopIndex] = useState(0)
  const [rerouteStatus, setRerouteStatus] = useState<RerouteStatus>('idle')
  const [rerouteMessage, setRerouteMessage] = useState('尚未触发偏航重规划')
  const [reroutePlan, setReroutePlan] = useState<PlannedRoute | null>(null)
  const [showModelBeta, setShowModelBeta] = useState(false)
  const [modelStatus, setModelStatus] = useState('未开启')

  const routeStops = demoGuideRoute.stops
  const terminalStopId = routeStops[routeStops.length - 1]?.spotId
  const terminalPoi = getPoiDisplay(terminalStopId)
  const nearestRoutePoint = useMemo(
    () => findNearestRoutePoint(simulatedPosition, demoRoutePath),
    [simulatedPosition]
  )
  const nextStop = useMemo(
    () =>
      findNextStop(simulatedPosition, routeStops, (spotId) => {
        const location = getRouteStopLocation(spotId)
        const display = getPoiDisplay(spotId)

        if (!location || !display) {
          return undefined
        }

        return {
          id: spotId,
          name: display.name,
          ...location
        }
      }),
    [routeStops, simulatedPosition]
  )
  const nextStopPoi = getPoiDisplay(nextStop.nextStopId)
  const currentStop = getPoiDisplay(routeStops[selectedStopIndex]?.spotId)
  const routeProgressPercent = nearestRoutePoint
    ? Math.max(0, Math.min(100, Math.round(nearestRoutePoint.progressRatio * 100)))
    : 0
  const distanceToRoute = nearestRoutePoint?.distanceMeters ?? 0
  const deviationLabel =
    rerouteStatus === 'ready'
      ? '已重规划到下一站'
      : rerouteStatus === 'planning'
        ? '正在重规划'
        : distanceToRoute > 80
          ? '可能偏航'
          : '路线附近'

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      if (!mapElementRef.current) {
        return
      }

      setMapStatus('loading')
      setPageMessage('正在加载腾讯地图真实底座...')

      try {
        const TMap = await loadTMap()

        if (cancelled || !mapElementRef.current) {
          return
        }

        const map = new TMap.Map(mapElementRef.current, {
          center: new TMap.LatLng(initialPosition.lat, initialPosition.lng),
          zoom: 17.8,
          pitch: 64,
          rotation: -28
        })
        mapRef.current = map
        setMapStatus('ready')
        setPageMessage('真实 3D 地图导览模式已就绪')
      } catch (error) {
        setMapStatus('error')
        setPageMessage(error instanceof Error ? error.message : '腾讯地图加载失败')
      }
    }

    void initMap()

    return () => {
      cancelled = true
      routeLayerRef.current?.setMap?.(null)
      poiMarkerLayerRef.current?.setMap?.(null)
      userMarkerLayerRef.current?.setMap?.(null)
      rerouteLayerRef.current?.setMap?.(null)
      clearGltfModel(gltfModelRef.current)
      gltfModelRef.current = null
      mapRef.current?.destroy?.()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    routeLayerRef.current?.setMap?.(null)
    routeLayerRef.current = new window.TMap.MultiPolyline({
      map: mapRef.current,
      styles: {
        mainRoute: new window.TMap.PolylineStyle({
          color: '#D5A62D',
          width: 8,
          borderWidth: 3,
          borderColor: 'rgba(255, 252, 231, 0.92)',
          lineCap: 'round'
        })
      },
      geometries: [
        {
          id: 'historical-culture-main-route',
          styleId: 'mainRoute',
          paths: demoRoutePath.map(toTMapLatLng)
        }
      ]
    })

    return () => {
      routeLayerRef.current?.setMap?.(null)
      routeLayerRef.current = null
    }
  }, [mapStatus])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    const routeStopIds = new Set(routeStops.map((stop) => stop.spotId))
    const poiGeometries = lingshanPois
      .filter((poi) => routeStopIds.has(poi.id))
      .map((poi, index) => ({
        id: poi.id,
        styleId: poi.id === terminalStopId ? 'terminalPoi' : 'routePoi',
        position: toTMapLatLng(getBestPoiLocation(poi)),
        properties: {
          title: `${index + 1}. ${poi.name}`
        }
      }))

    poiMarkerLayerRef.current?.setMap?.(null)
    poiMarkerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: {
        routePoi: new window.TMap.MarkerStyle({
          width: 30,
          height: 34,
          anchor: { x: 15, y: 34 },
          src: createSvgDataUrl(routePoiMarkerSvg('#204f46', '#f4d77b'))
        }),
        terminalPoi: new window.TMap.MarkerStyle({
          width: 34,
          height: 38,
          anchor: { x: 17, y: 38 },
          src: createSvgDataUrl(routePoiMarkerSvg('#7c2d12', '#f7c948'))
        })
      },
      geometries: poiGeometries
    })

    return () => {
      poiMarkerLayerRef.current?.setMap?.(null)
      poiMarkerLayerRef.current = null
    }
  }, [mapStatus, routeStops, terminalStopId])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    userMarkerLayerRef.current?.setMap?.(null)
    userMarkerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: {
        user: new window.TMap.MarkerStyle({
          width: 44,
          height: 44,
          anchor: { x: 22, y: 22 },
          src: createSvgDataUrl(userLocationSvg())
        })
      },
      geometries: [
        {
          id: 'simulated-user',
          styleId: 'user',
          position: toTMapLatLng(simulatedPosition)
        }
      ]
    })

    return () => {
      userMarkerLayerRef.current?.setMap?.(null)
      userMarkerLayerRef.current = null
    }
  }, [mapStatus, simulatedPosition])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    rerouteLayerRef.current?.setMap?.(null)
    rerouteLayerRef.current = null

    if (!reroutePlan || reroutePlan.path.length < 2) {
      return
    }

    rerouteLayerRef.current = new window.TMap.MultiPolyline({
      map: mapRef.current,
      styles: {
        reroute: new window.TMap.PolylineStyle({
          color: '#23B8B0',
          width: 7,
          borderWidth: 2,
          borderColor: 'rgba(230, 255, 250, 0.92)',
          lineCap: 'round'
        })
      },
      geometries: [
        {
          id: 'temporary-reroute-to-next-stop',
          styleId: 'reroute',
          paths: reroutePlan.path.map(toTMapLatLng)
        }
      ]
    })

    return () => {
      rerouteLayerRef.current?.setMap?.(null)
      rerouteLayerRef.current = null
    }
  }, [mapStatus, reroutePlan])

  useEffect(() => {
    clearGltfModel(gltfModelRef.current)
    gltfModelRef.current = null

    if (!showModelBeta) {
      setModelStatus('未开启')
      return
    }

    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      setModelStatus('等待地图就绪')
      return
    }

    if (!defaultModelOverlay?.modelUrl || !window.TMap.model?.GLTFModel) {
      setModelStatus('模型配置或 GLTFModel 不可用')
      return
    }

    const anchor = getModelOverlayLocation(defaultModelOverlay)

    if (!anchor) {
      setModelStatus('模型锚点缺失')
      return
    }

    try {
      const model = new window.TMap.model.GLTFModel({
        id: 'map-3d-guide-giant-buddha-beta',
        map: mapRef.current,
        url: defaultModelOverlay.modelUrl,
        position: new window.TMap.LatLng(anchor.lat, anchor.lng, defaultModelOverlay.height),
        rotation: defaultModelOverlay.rotation,
        scale: defaultModelOverlay.scale
      })
      gltfModelRef.current = model
      setModelStatus('正在加载灵山大佛 GLB Beta')

      if (typeof model.on === 'function') {
        model.on('loaded', () => setModelStatus('灵山大佛 GLB Beta 已加载'))
        model.on('error', () => setModelStatus('模型加载失败，已保留地图导览'))
      } else {
        setModelStatus('已创建模型覆盖物')
      }
    } catch {
      setModelStatus('模型创建失败，已保留地图导览')
    }

    return () => {
      clearGltfModel(gltfModelRef.current)
      gltfModelRef.current = null
    }
  }, [mapStatus, showModelBeta])

  const moveToStop = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(routeStops.length - 1, nextIndex))
    const stop = routeStops[boundedIndex]
    const location = getRouteStopLocation(stop.spotId)

    if (!location) {
      return
    }

    setSelectedStopIndex(boundedIndex)
    setSimulatedPosition(location)
    setRoutePathIndex(findNearestRoutePoint(location, demoRoutePath)?.nearestIndex ?? 0)
    setRerouteStatus('idle')
    setReroutePlan(null)
    setRerouteMessage('已回到主题路线')
    focusMap(location, 18.4)
  }

  const simulateForward = () => {
    const nextIndex = Math.min(demoRoutePath.length - 1, routePathIndex + progressStep)
    const nextPosition = demoRoutePath[nextIndex]
    const inferredStopIndex = getNearestStopIndex(nextPosition, routeStops)

    setRoutePathIndex(nextIndex)
    setSelectedStopIndex(inferredStopIndex)
    setSimulatedPosition(nextPosition)
    setRerouteStatus('idle')
    setReroutePlan(null)
    setRerouteMessage('已沿金色路线模拟前进')
    focusMap(nextPosition, 18)
  }

  const returnToRoute = () => {
    const nearest = nearestRoutePoint?.nearestPoint ?? demoRoutePath[routePathIndex] ?? initialPosition
    const nearestIndex = nearestRoutePoint?.nearestIndex ?? routePathIndex

    setRoutePathIndex(nearestIndex)
    setSelectedStopIndex(getNearestStopIndex(nearest, routeStops))
    setSimulatedPosition(nearest)
    setRerouteStatus('idle')
    setReroutePlan(null)
    setRerouteMessage('已回到主路线')
    focusMap(nearest, 18)
  }

  const simulateDeviation = async () => {
    const base = simulatedPosition
    const offRoutePosition = {
      lat: Number((base.lat + offRouteOffset.lat).toFixed(6)),
      lng: Number((base.lng + offRouteOffset.lng).toFixed(6))
    }
    const targetStopId = nextStop.nextStopId ?? routeStops[Math.min(selectedStopIndex + 1, routeStops.length - 1)]?.spotId
    const target = getRouteStopLocation(targetStopId)
    const targetName = getPoiDisplay(targetStopId)?.name ?? '下一站'

    setSimulatedPosition(offRoutePosition)
    setRerouteStatus('planning')
    setReroutePlan(null)
    setRerouteMessage(`正在重规划：偏航位置 -> ${targetName}`)
    focusMap(offRoutePosition, 18)

    if (!target) {
      setRerouteStatus('failed')
      setRerouteMessage('下一站位置缺失，无法重规划。')
      return
    }

    try {
      const plannedRoute = await buildWalkingRoute([offRoutePosition, target])
      setReroutePlan(plannedRoute)
      setRerouteStatus(plannedRoute.usedFallback ? 'failed' : 'ready')
      setRerouteMessage(
        plannedRoute.usedFallback
          ? `重规划失败，已显示兜底线：${plannedRoute.fallbackReason ?? '未知原因'}`
          : `已重规划到 ${targetName}，约 ${formatDistanceMeters(plannedRoute.distanceMeters)} / ${plannedRoute.durationMinutes} 分钟`
      )
    } catch (error) {
      setRerouteStatus('failed')
      setRerouteMessage(error instanceof Error ? error.message : '重规划失败')
    }
  }

  const focusMap = (position: LatLngPoint, zoom?: number) => {
    const map = mapRef.current

    if (!map || !window.TMap) {
      return
    }

    const center = new window.TMap.LatLng(position.lat, position.lng)

    if (typeof map.easeTo === 'function') {
      map.easeTo(
        {
          center,
          zoom: zoom ?? 18,
          pitch: 64,
          rotation: -28
        },
        { duration: 420 }
      )
      return
    }

    map.setCenter?.(center)
    if (zoom && typeof map.setZoom === 'function') {
      map.setZoom(zoom)
    }
    map.setPitch?.(64)
    map.setRotation?.(-28)
  }

  return (
    <main className="map-3d-guide-shell">
      <div ref={mapElementRef} className="map-3d-guide-map" />
      <div className="map-3d-guide-skin" aria-hidden="true" />
      <div className="map-3d-guide-mist" aria-hidden="true" />

      <section className="map-3d-guide-hero">
        <div className="map-3d-guide-kicker">真实 3D 地图导览 Beta</div>
        <h1>灵山胜境真实 3D 地图导览</h1>
        <p>{demoGuideRoute.name} · 腾讯真实底图 + 金色导览线 + GLB 景点模型</p>
        <div className="map-3d-guide-top-actions">
          <button type="button" onClick={() => navigate('/map')}>
            进入真实地图
          </button>
          <button type="button" onClick={() => navigate('/scenic-3d-map')}>
            进入文化沙盘
          </button>
        </div>
      </section>

      <aside className="map-3d-guide-status">
        <span className="map-3d-guide-beta">Beta</span>
        <h2>导览状态</h2>
        <dl>
          <div>
            <dt>当前路线</dt>
            <dd>{demoGuideRoute.name}</dd>
          </div>
          <div>
            <dt>当前位置</dt>
            <dd>{currentStop?.name ?? '路线中段'}</dd>
          </div>
          <div>
            <dt>下一站</dt>
            <dd>{nextStopPoi?.name ?? '路线终点'}</dd>
          </div>
          <div>
            <dt>距离下一站</dt>
            <dd>{nextStop.distanceToNextStopMeters ? formatDistanceMeters(nextStop.distanceToNextStopMeters) : '待估算'}</dd>
          </div>
          <div>
            <dt>路线进度</dt>
            <dd>{routeProgressPercent}%</dd>
          </div>
          <div>
            <dt>终点</dt>
            <dd>{terminalPoi?.name ?? '景区出口'}</dd>
          </div>
        </dl>

        <div className={`map-3d-guide-deviation map-3d-guide-deviation--${rerouteStatus}`}>
          <strong>{deviationLabel}</strong>
          <span>{rerouteMessage}</span>
          {reroutePlan ? (
            <small>
              临时路线：{formatDistanceMeters(reroutePlan.distanceMeters)} / {reroutePlan.durationMinutes} 分钟
            </small>
          ) : null}
        </div>

        <label className="map-3d-guide-model-toggle">
          <input
            type="checkbox"
            checked={showModelBeta}
            onChange={(event) => setShowModelBeta(event.target.checked)}
          />
          <span>显示 3D 景点模型 Beta</span>
        </label>
        <p className="map-3d-guide-model-state">{modelStatus}</p>
      </aside>

      <section className="map-3d-guide-pois">
        <strong>核心 POI</strong>
        <div>
          {routeStops.map((stop, index) => {
            const poi = getPoiDisplay(stop.spotId)
            const active = index === selectedStopIndex

            return (
              <button
                key={stop.spotId}
                type="button"
                className={active ? 'is-active' : ''}
                onClick={() => moveToStop(index)}
              >
                <span>{index + 1}</span>
                {poi?.name ?? stop.spotId}
              </button>
            )
          })}
        </div>
      </section>

      <footer className="map-3d-guide-controlbar">
        <div className="map-3d-guide-progress">
          <span style={{ width: `${routeProgressPercent}%` }} />
        </div>
        <div className="map-3d-guide-controlbar__meta">
          <strong>{pageMessage}</strong>
          <span>
            地图状态：{mapStatus} · 距主路线 {formatDistanceMeters(distanceToRoute)}
          </span>
        </div>
        <div className="map-3d-guide-controlbar__actions">
          <button type="button" onClick={() => moveToStop(selectedStopIndex - 1)}>
            上一站
          </button>
          <button type="button" onClick={() => moveToStop(selectedStopIndex + 1)}>
            下一站
          </button>
          <button type="button" onClick={simulateForward}>
            模拟前进
          </button>
          <button type="button" onClick={simulateDeviation} disabled={rerouteStatus === 'planning'}>
            模拟偏航
          </button>
          <button type="button" onClick={returnToRoute}>
            回到路线
          </button>
        </div>
      </footer>

      <style>{map3DGuideCss}</style>
    </main>
  )
}

function getRouteStopLocations(route: GuideRoute) {
  return route.stops
    .map((stop) => getRouteStopLocation(stop.spotId))
    .filter((location): location is LatLngPoint => Boolean(location))
}

function getRouteStopLocation(spotId?: string | null): LatLngPoint | null {
  if (!spotId) {
    return null
  }

  const poi = lingshanPois.find((item) => item.id === spotId)

  if (poi) {
    return getBestPoiLocation(poi)
  }

  const guideSpot = guideSpots.find((spot) => spot.id === spotId)

  return guideSpot ? { lat: guideSpot.lat, lng: guideSpot.lng } : null
}

function getPoiDisplay(spotId?: string | null) {
  if (!spotId) {
    return null
  }

  const poi = lingshanPois.find((item) => item.id === spotId)

  if (poi) {
    return {
      name: poi.name,
      intro: poi.intro
    }
  }

  const guideSpot = guideSpots.find((spot) => spot.id === spotId)

  return guideSpot
    ? {
        name: guideSpot.name,
        intro: guideSpot.intro
      }
    : null
}

function getBestPoiLocation(poi: LingshanPoi) {
  return poi.navLocation ?? poi.displayLocation
}

function getModelOverlayLocation(overlay: LingshanMapModelOverlay): LatLngPoint | null {
  const poi = lingshanPois.find((item) => item.id === overlay.poiId)

  if (!poi) {
    return getRouteStopLocation(overlay.poiId)
  }

  return overlay.positionSource === 'displayLocation'
    ? poi.displayLocation ?? poi.navLocation
    : poi.navLocation ?? poi.displayLocation
}

function getNearestStopIndex(position: LatLngPoint, routeStops: GuideRoute['stops']) {
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY

  routeStops.forEach((stop, index) => {
    const location = getRouteStopLocation(stop.spotId)

    if (!location) {
      return
    }

    const distance = haversineDistanceMeters(position, location)

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })

  return nearestIndex
}

function toTMapLatLng(point: LatLngPoint) {
  return new window.TMap.LatLng(point.lat, point.lng)
}

function clearGltfModel(model: any) {
  model?.setMap?.(null)
  model?.remove?.()
  model?.destroy?.()
}

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function routePoiMarkerSvg(fill: string, accent: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 34 40"><path d="M17 39s13-12.2 13-24A13 13 0 0 0 4 15c0 11.8 13 24 13 24Z" fill="${fill}" stroke="rgba(255,255,255,.92)" stroke-width="2"/><circle cx="17" cy="15" r="6" fill="${accent}"/></svg>`
}

function userLocationSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="rgba(20,184,166,.22)" stroke="rgba(240,253,250,.94)" stroke-width="2"/><circle cx="22" cy="22" r="8" fill="#0f766e" stroke="#fef3c7" stroke-width="3"/><path d="M22 5l4 11-4 3-4-3 4-11Z" fill="#d6a832"/></svg>'
}

const map3DGuideCss = `
.map-3d-guide-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #e8eadf;
  color: #19372f;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.map-3d-guide-map {
  position: absolute;
  inset: 0;
  filter: saturate(.72) sepia(.18) contrast(.92) brightness(1.05);
}

.map-3d-guide-skin,
.map-3d-guide-mist {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.map-3d-guide-skin {
  background:
    radial-gradient(circle at 22% 18%, rgba(247, 231, 172, .34), transparent 28%),
    radial-gradient(circle at 77% 26%, rgba(83, 131, 113, .22), transparent 30%),
    linear-gradient(90deg, rgba(249, 246, 229, .55), transparent 24%, transparent 72%, rgba(33, 71, 62, .20)),
    linear-gradient(180deg, rgba(245, 241, 221, .42), transparent 38%, rgba(22, 61, 52, .20));
  mix-blend-mode: multiply;
}

.map-3d-guide-mist {
  background:
    linear-gradient(135deg, rgba(255,255,255,.32), transparent 36%),
    repeating-linear-gradient(100deg, rgba(255,255,255,.08) 0 2px, transparent 2px 22px);
}

.map-3d-guide-hero,
.map-3d-guide-status,
.map-3d-guide-pois,
.map-3d-guide-controlbar {
  position: absolute;
  z-index: 5;
  border: 1px solid rgba(255, 255, 255, .62);
  background: rgba(255, 252, 239, .88);
  box-shadow: 0 24px 70px rgba(23, 44, 38, .16);
  backdrop-filter: blur(18px);
}

.map-3d-guide-hero {
  top: 18px;
  left: 18px;
  width: 380px;
  max-width: calc(100vw - 36px);
  padding: 18px 20px;
  border-radius: 18px;
}

.map-3d-guide-kicker,
.map-3d-guide-beta {
  color: #9a6a16;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
}

.map-3d-guide-hero h1 {
  margin: 7px 0 8px;
  color: #203f36;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 28px;
  line-height: 1.18;
  letter-spacing: 0;
}

.map-3d-guide-hero p {
  margin: 0;
  color: #5f6e65;
  font-size: 13px;
  line-height: 1.55;
}

.map-3d-guide-top-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.map-3d-guide-top-actions button,
.map-3d-guide-controlbar button,
.map-3d-guide-pois button {
  border: 1px solid rgba(143, 101, 28, .24);
  background: rgba(255, 249, 229, .86);
  color: #6f4a12;
  border-radius: 999px;
  min-height: 34px;
  padding: 0 12px;
  font-weight: 850;
  cursor: pointer;
}

.map-3d-guide-top-actions button:last-child {
  border-color: rgba(30, 91, 76, .22);
  color: #1d5b4c;
  background: rgba(234, 246, 239, .84);
}

.map-3d-guide-status {
  top: 18px;
  right: 18px;
  width: 330px;
  max-width: calc(100vw - 36px);
  padding: 16px;
  border-radius: 18px;
}

.map-3d-guide-status h2 {
  margin: 4px 0 12px;
  font-size: 20px;
  color: #25463b;
}

.map-3d-guide-status dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.map-3d-guide-status dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(94, 112, 102, .10);
}

.map-3d-guide-status dt {
  color: #758078;
  font-size: 12px;
}

.map-3d-guide-status dd {
  margin: 0;
  color: #213f36;
  font-size: 13px;
  font-weight: 900;
  text-align: right;
}

.map-3d-guide-deviation {
  display: grid;
  gap: 4px;
  margin-top: 12px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(233, 244, 237, .75);
  color: #1e5749;
  font-size: 12px;
}

.map-3d-guide-deviation--planning,
.map-3d-guide-deviation--off_route {
  background: rgba(255, 247, 214, .86);
  color: #8a5a0a;
}

.map-3d-guide-deviation--ready {
  background: rgba(220, 252, 241, .82);
  color: #0f766e;
}

.map-3d-guide-deviation--failed {
  background: rgba(254, 226, 226, .82);
  color: #991b1b;
}

.map-3d-guide-model-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: #5f4212;
  font-size: 13px;
  font-weight: 900;
}

.map-3d-guide-model-state {
  margin: 7px 0 0;
  color: #7a6d5c;
  font-size: 12px;
}

.map-3d-guide-pois {
  left: 18px;
  bottom: 118px;
  width: 430px;
  max-width: calc(100vw - 36px);
  padding: 12px;
  border-radius: 18px;
}

.map-3d-guide-pois strong {
  display: block;
  margin-bottom: 8px;
  color: #24483c;
}

.map-3d-guide-pois div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.map-3d-guide-pois button {
  min-height: 30px;
  padding: 0 9px;
  font-size: 12px;
}

.map-3d-guide-pois button span {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-right: 4px;
  border-radius: 50%;
  background: rgba(32, 79, 70, .14);
  color: #1d5b4c;
}

.map-3d-guide-pois button.is-active {
  color: #7b4f0f;
  background: rgba(255, 240, 196, .98);
  border-color: rgba(213, 166, 45, .6);
}

.map-3d-guide-controlbar {
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 20px;
}

.map-3d-guide-progress {
  grid-column: 1 / -1;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(32, 79, 70, .14);
}

.map-3d-guide-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2c6f5d, #d6a832);
}

.map-3d-guide-controlbar__meta {
  display: grid;
  gap: 3px;
  color: #6a756d;
  font-size: 12px;
}

.map-3d-guide-controlbar__meta strong {
  color: #24483c;
  font-size: 14px;
}

.map-3d-guide-controlbar__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.map-3d-guide-controlbar button:disabled {
  cursor: wait;
  opacity: .58;
}

@media (max-width: 880px) {
  .map-3d-guide-hero,
  .map-3d-guide-status,
  .map-3d-guide-pois,
  .map-3d-guide-controlbar {
    left: 12px;
    right: 12px;
    width: auto;
    max-width: none;
  }

  .map-3d-guide-status {
    top: 188px;
  }

  .map-3d-guide-pois {
    display: none;
  }

  .map-3d-guide-controlbar {
    grid-template-columns: 1fr;
    max-height: 42vh;
    overflow: auto;
  }

  .map-3d-guide-controlbar__actions {
    justify-content: flex-start;
  }
}
`

export default Map3DGuidePage
