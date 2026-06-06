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
type GuideCameraMode = 'overview' | 'current' | 'next' | 'focus' | 'topdown' | 'guide'

type GuideCameraPreset = {
  id: GuideCameraMode
  label: string
  description: string
  zoom: number
  pitch: number
  rotation: number
}

type IllustratedPoiPlacard = {
  poiId: string
  x: number
  y: number
  tone?: 'jade' | 'gold' | 'temple' | 'terminal'
}

const demoGuideRoute = guideRoutes.find((route) => route.id === 'historical_culture') ?? guideRoutes[0]
const demoRouteGeometry = getLingshanRouteGeometryByGuideRouteId('historical_culture')
const demoRoutePath = demoRouteGeometry?.path.length ? demoRouteGeometry.path : getRouteStopLocations(demoGuideRoute)
const demoPlannedRoute = buildPlannedRouteFromPath(demoRoutePath)
const initialPosition = getRouteStopLocation(demoGuideRoute.stops[0]?.spotId) ?? demoRoutePath[0] ?? scenicCenter
const defaultModelOverlay = getMapModelOverlayByPoiId('giant_buddha')
const progressStep = Math.max(8, Math.round(demoRoutePath.length / 28))
const offRouteOffset = { lat: 0.00105, lng: 0.00125 }
const routeCenter = getPathCenter(demoRoutePath) ?? scenicCenter

const illustratedPoiPlacards: IllustratedPoiPlacard[] = [
  { poiId: 'south_gate', x: 16, y: 78, tone: 'jade' },
  { poiId: 'lingshan_wall', x: 24, y: 70, tone: 'jade' },
  { poiId: 'shengjing_square', x: 33, y: 62, tone: 'gold' },
  { poiId: 'foshou_square', x: 42, y: 55, tone: 'jade' },
  { poiId: 'xiangfu_temple', x: 52, y: 48, tone: 'temple' },
  { poiId: 'xingtan_square', x: 60, y: 42, tone: 'jade' },
  { poiId: 'foqian_square', x: 67, y: 36, tone: 'gold' },
  { poiId: 'giant_buddha', x: 73, y: 28, tone: 'gold' },
  { poiId: 'fan_gong', x: 79, y: 43, tone: 'temple' },
  { poiId: 'wuyin_tancheng', x: 70, y: 55, tone: 'temple' },
  { poiId: 'sansheng_hall', x: 61, y: 64, tone: 'jade' },
  { poiId: 'exit', x: 52, y: 76, tone: 'terminal' }
]

const guideCameraPresets: GuideCameraPreset[] = [
  {
    id: 'overview',
    label: '路线总览',
    description: '俯瞰历史文化主线',
    zoom: 17.1,
    pitch: 54,
    rotation: -25
  },
  {
    id: 'current',
    label: '当前站点',
    description: '靠近模拟当前位置',
    zoom: 19,
    pitch: 65,
    rotation: -18
  },
  {
    id: 'next',
    label: '下一站',
    description: '提前看下一处景点',
    zoom: 19.2,
    pitch: 64,
    rotation: 12
  },
  {
    id: 'focus',
    label: '景点聚焦',
    description: '聚焦当前文化节点',
    zoom: 20,
    pitch: 67,
    rotation: 28
  },
  {
    id: 'topdown',
    label: '俯视检查',
    description: '检查路线和站点关系',
    zoom: 18.1,
    pitch: 0,
    rotation: 0
  },
  {
    id: 'guide',
    label: '导览视角',
    description: '回到跟随导览视角',
    zoom: 18.7,
    pitch: 65,
    rotation: -28
  }
]

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
  const [activeCameraMode, setActiveCameraMode] = useState<GuideCameraMode>('guide')

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
  const selectedStopId = routeStops[selectedStopIndex]?.spotId
  const activeCameraPreset = guideCameraPresets.find((preset) => preset.id === activeCameraMode) ?? guideCameraPresets[0]
  const routeProgressPercent = nearestRoutePoint
    ? Math.max(0, Math.min(100, Math.round(nearestRoutePoint.progressRatio * 100)))
    : 0
  const distanceToRoute = nearestRoutePoint?.distanceMeters ?? 0
  const deviationLabel =
    rerouteStatus === 'ready'
      ? '已规划至下一站'
      : rerouteStatus === 'planning'
        ? '正在重规划'
        : distanceToRoute > 80
          ? '已偏航'
          : '沿主路线'
  const guideStateText =
    rerouteStatus === 'ready'
      ? '已规划至下一站'
      : rerouteStatus === 'planning'
        ? '正在重规划'
        : rerouteStatus === 'failed'
          ? '重规划待确认'
          : distanceToRoute > 80
            ? '已偏航'
            : '沿主路线'
  const distanceToNextStopText = nextStop.distanceToNextStopMeters
    ? formatDistanceMeters(nextStop.distanceToNextStopMeters)
    : '待估算'

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
        routeShadow: new window.TMap.PolylineStyle({
          color: 'rgba(74, 54, 18, 0.24)',
          width: 32,
          borderWidth: 0,
          lineCap: 'round'
        }),
        routeAura: new window.TMap.PolylineStyle({
          color: 'rgba(255, 228, 118, 0.42)',
          width: 26,
          borderWidth: 0,
          lineCap: 'round'
        }),
        routeGlow: new window.TMap.PolylineStyle({
          color: 'rgba(247, 178, 47, 0.74)',
          width: 17,
          borderWidth: 0,
          lineCap: 'round'
        }),
        mainRoute: new window.TMap.PolylineStyle({
          color: '#FFD45A',
          width: 10,
          borderWidth: 5,
          borderColor: 'rgba(255, 250, 222, 0.98)',
          lineCap: 'round'
        }),
        routeCore: new window.TMap.PolylineStyle({
          color: 'rgba(117, 75, 11, 0.86)',
          width: 3,
          borderWidth: 0,
          lineCap: 'round'
        })
      },
      geometries: [
        {
          id: 'historical-culture-route-shadow',
          styleId: 'routeShadow',
          paths: demoRoutePath.map(toTMapLatLng)
        },
        {
          id: 'historical-culture-route-aura',
          styleId: 'routeAura',
          paths: demoRoutePath.map(toTMapLatLng)
        },
        {
          id: 'historical-culture-route-glow',
          styleId: 'routeGlow',
          paths: demoRoutePath.map(toTMapLatLng)
        },
        {
          id: 'historical-culture-main-route',
          styleId: 'mainRoute',
          paths: demoRoutePath.map(toTMapLatLng)
        },
        {
          id: 'historical-culture-route-core',
          styleId: 'routeCore',
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
    const currentStopId = routeStops[selectedStopIndex]?.spotId
    const nextStopId = nextStop.nextStopId
    const markerStyles = routeStops.reduce<Record<string, any>>((styles, stop, index) => {
      const state =
        stop.spotId === terminalStopId
          ? 'terminal'
          : stop.spotId === currentStopId
            ? 'current'
            : stop.spotId === nextStopId
              ? 'next'
              : 'route'
      const styleId = `poi-${index}-${state}`
      const size = state === 'current' ? 44 : state === 'next' ? 40 : state === 'terminal' ? 42 : 34

      styles[styleId] = new window.TMap.MarkerStyle({
        width: size,
        height: size + 8,
        anchor: { x: size / 2, y: size + 6 },
        src: createSvgDataUrl(routePoiMarkerSvg(state, index + 1))
      })

      return styles
    }, {})
    const poiGeometries = lingshanPois
      .filter((poi) => routeStopIds.has(poi.id))
      .map((poi) => {
        const stopIndex = routeStops.findIndex((stop) => stop.spotId === poi.id)
        const state =
          poi.id === terminalStopId
            ? 'terminal'
            : poi.id === currentStopId
              ? 'current'
              : poi.id === nextStopId
                ? 'next'
                : 'route'

        return {
          id: poi.id,
          styleId: `poi-${stopIndex}-${state}`,
          position: toTMapLatLng(getBestPoiLocation(poi)),
          properties: {
            title: `${stopIndex + 1}. ${poi.name}`
          }
        }
      })

    poiMarkerLayerRef.current?.setMap?.(null)
    poiMarkerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: markerStyles,
      geometries: poiGeometries
    })

    return () => {
      poiMarkerLayerRef.current?.setMap?.(null)
      poiMarkerLayerRef.current = null
    }
  }, [mapStatus, nextStop.nextStopId, routeStops, selectedStopIndex, terminalStopId])

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
        rerouteHalo: new window.TMap.PolylineStyle({
          color: 'rgba(20, 184, 166, 0.24)',
          width: 24,
          borderWidth: 0,
          lineCap: 'round'
        }),
        rerouteGlow: new window.TMap.PolylineStyle({
          color: 'rgba(45, 212, 191, 0.58)',
          width: 14,
          borderWidth: 0,
          lineCap: 'round'
        }),
        reroute: new window.TMap.PolylineStyle({
          color: '#0EAEA4',
          width: 8,
          borderWidth: 4,
          borderColor: 'rgba(255, 255, 232, 0.94)',
          lineCap: 'round'
        })
      },
      geometries: [
        {
          id: 'temporary-reroute-halo',
          styleId: 'rerouteHalo',
          paths: reroutePlan.path.map(toTMapLatLng)
        },
        {
          id: 'temporary-reroute-glow',
          styleId: 'rerouteGlow',
          paths: reroutePlan.path.map(toTMapLatLng)
        },
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
    setRerouteMessage(`正在为你规划临时路线至下一站：${targetName}`)
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
          : `临时重规划至下一站：${targetName}，约 ${formatDistanceMeters(plannedRoute.distanceMeters)} / ${plannedRoute.durationMinutes} 分钟`
      )
    } catch (error) {
      setRerouteStatus('failed')
      setRerouteMessage(error instanceof Error ? error.message : '重规划失败')
    }
  }

  const applyGuideCamera = (mode: GuideCameraMode) => {
    const preset = guideCameraPresets.find((item) => item.id === mode) ?? guideCameraPresets[0]
    const target =
      mode === 'overview'
        ? routeCenter
        : mode === 'current'
          ? getRouteStopLocation(selectedStopId) ?? simulatedPosition
          : mode === 'next'
            ? getRouteStopLocation(nextStop.nextStopId) ?? simulatedPosition
            : mode === 'focus'
              ? getRouteStopLocation(selectedStopId) ?? getRouteStopLocation(nextStop.nextStopId) ?? simulatedPosition
              : mode === 'topdown'
                ? routeCenter
                : simulatedPosition

    setActiveCameraMode(mode)
    moveMapCamera(target, preset)
  }

  const focusMap = (position: LatLngPoint, zoom?: number) => {
    setActiveCameraMode('guide')
    moveMapCamera(position, {
      id: 'guide',
      label: '导览视角',
      description: '跟随模拟位置',
      zoom: zoom ?? 18,
      pitch: 64,
      rotation: -28
    })
  }

  const moveMapCamera = (position: LatLngPoint, preset: GuideCameraPreset) => {
    const map = mapRef.current

    if (!map || !window.TMap) {
      return
    }

    const center = new window.TMap.LatLng(position.lat, position.lng)

    if (typeof map.easeTo === 'function') {
      map.easeTo(
        {
          center,
          zoom: preset.zoom,
          pitch: preset.pitch,
          rotation: preset.rotation
        },
        { duration: 420 }
      )
      return
    }

    map.setCenter?.(center)
    if (typeof map.setZoom === 'function') {
      map.setZoom(preset.zoom)
    }
    map.setPitch?.(preset.pitch)
    map.setRotation?.(preset.rotation)
  }

  return (
    <main className="map-3d-guide-shell">
      <div ref={mapElementRef} className="map-3d-guide-map" />
      <div className="map-3d-guide-skin" aria-hidden="true" />
      <div className="map-3d-guide-mist" aria-hidden="true" />
      <div className="map-3d-guide-waterwash" aria-hidden="true" />
      <div className="map-3d-guide-mountainveil" aria-hidden="true" />
      <div className="map-3d-guide-focuswash" aria-hidden="true" />
      <div className="map-3d-guide-paperedge" aria-hidden="true" />
      <div className="map-3d-guide-illustration" aria-hidden="true">
        <svg viewBox="0 0 1000 700" role="img" aria-label="灵山胜境艺术化导览地图">
          <defs>
            <linearGradient id="mountainInk" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#d8e9cf" stopOpacity=".86" />
              <stop offset=".55" stopColor="#6d9a79" stopOpacity=".62" />
              <stop offset="1" stopColor="#234f42" stopOpacity=".42" />
            </linearGradient>
            <linearGradient id="waterInk" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#d7f3ef" stopOpacity=".86" />
              <stop offset=".54" stopColor="#4f9ab0" stopOpacity=".64" />
              <stop offset="1" stopColor="#1c4b60" stopOpacity=".58" />
            </linearGradient>
            <linearGradient id="routeRibbon" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#8c5b14" />
              <stop offset=".18" stopColor="#ffe9a2" />
              <stop offset=".5" stopColor="#d6a832" />
              <stop offset=".78" stopColor="#fff1b5" />
              <stop offset="1" stopColor="#9b6818" />
            </linearGradient>
            <filter id="softRouteGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="paperNoise">
              <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="9" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="table" tableValues="0 .16" />
              </feComponentTransfer>
            </filter>
          </defs>

          <rect width="1000" height="700" fill="#f4efdc" opacity=".18" />
          <rect width="1000" height="700" filter="url(#paperNoise)" opacity=".65" />

          <path className="map-3d-guide-ink-water" d="M670 90c128 34 214 106 246 210 30 100-10 214-108 282-92 64-225 58-314 8-87-50-122-141-86-226 32-76 28-154 100-210 42-32 96-54 162-64Z" fill="url(#waterInk)" />
          <path className="map-3d-guide-ink-waterline" d="M690 142c80 22 154 64 190 132M623 508c96 42 199 38 285-22M514 250c-58 64-70 135-28 202" fill="none" />

          <path className="map-3d-guide-ink-mountain" d="M-20 130c84-74 177-94 279-62 57 18 107 16 160-2 66-22 138-9 206 44-96 52-155 102-207 161-75-58-141-70-226-38-74 28-137 5-212-103Z" fill="url(#mountainInk)" />
          <path className="map-3d-guide-ink-mountain" d="M-12 628c91-84 195-116 312-88 80 19 152 0 231-44 58-32 122-40 205-12-96 69-159 121-218 178H-12Z" fill="url(#mountainInk)" opacity=".72" />
          <path className="map-3d-guide-ink-ridge" d="M84 134c86 38 150 43 218 16M146 612c88-44 162-50 247-26M480 584c66-54 132-76 220-72" fill="none" />

          <ellipse className="map-3d-guide-core-light" cx="555" cy="392" rx="300" ry="220" />
          <ellipse className="map-3d-guide-buddha-light" cx="735" cy="204" rx="116" ry="92" />

          <g className="map-3d-guide-art-buildings">
            <path d="M196 505h110l24 38-22 40H184l-25-40Z" />
            <path d="M304 438h132l32 48-32 45H282l-30-45Z" />
            <path d="M482 333h116l30 42-27 47H460l-28-46Z" />
            <path d="M642 238h126l35 50-30 48H611l-31-50Z" />
            <path d="M746 368h116l28 44-27 43H723l-27-43Z" />
            <path d="M636 500h126l30 44-30 46H610l-28-44Z" />
          </g>

          <path className="map-3d-guide-art-route-halo" d="M165 546 C236 505 302 464 370 424 S506 337 596 283 S716 214 760 164" />
          <path className="map-3d-guide-art-route-glow" d="M165 546 C236 505 302 464 370 424 S506 337 596 283 S716 214 760 164" />
          <path className="map-3d-guide-art-route" d="M165 546 C236 505 302 464 370 424 S506 337 596 283 S716 214 760 164" />
          <path className="map-3d-guide-art-route-core" d="M165 546 C236 505 302 464 370 424 S506 337 596 283 S716 214 760 164" />

          <g className="map-3d-guide-buddha-symbol">
            <circle cx="760" cy="164" r="45" />
            <path d="M760 101c18 27 28 52 28 78 0 35-15 63-28 82-13-19-28-47-28-82 0-26 10-51 28-78Z" />
            <path d="M712 188c26 3 42 17 51 44-33-6-52-19-51-44Z" />
            <path d="M809 188c-1 25-18 38-51 44 9-27 25-41 51-44Z" />
          </g>
        </svg>
      </div>

      <div className="map-3d-guide-placards" aria-label="灵山胜境核心景点标签">
        {illustratedPoiPlacards.map((placard) => {
          const stopIndex = routeStops.findIndex((stop) => stop.spotId === placard.poiId)
          const poi = getPoiDisplay(placard.poiId)
          const state =
            placard.poiId === terminalStopId
              ? 'terminal'
              : placard.poiId === selectedStopId
                ? 'current'
                : placard.poiId === nextStop.nextStopId
                  ? 'next'
                  : placard.tone ?? 'jade'

          if (!poi || stopIndex < 0) {
            return null
          }

          return (
            <button
              key={placard.poiId}
              type="button"
              className={`map-3d-guide-placard map-3d-guide-placard--${state}`}
              style={{ left: `${placard.x}%`, top: `${placard.y}%` }}
              onClick={() => moveToStop(stopIndex)}
            >
              <span>{state === 'current' ? '今' : state === 'next' ? '次' : state === 'terminal' ? '终' : stopIndex + 1}</span>
              <strong>{poi.name}</strong>
            </button>
          )
        })}
      </div>

      <section className="map-3d-guide-hero">
        <div className="map-3d-guide-kicker">灵山胜境定制导览 Beta</div>
        <h1>灵山胜境 · 真实 3D 导览</h1>
        <p>{demoGuideRoute.name} · 金色游线 · 景点模型 · 偏航重规划演示</p>
        <div className="map-3d-guide-top-actions">
          <button type="button" onClick={() => navigate('/map')}>
            进入真实地图
          </button>
          <button type="button" onClick={() => navigate('/scenic-3d-map')}>
            进入文化沙盘
          </button>
        </div>
      </section>

      <section className="map-3d-guide-camera">
        <div>
          <strong>导览相机</strong>
          <span>{activeCameraPreset.description}</span>
        </div>
        <div className="map-3d-guide-camera__buttons">
          {guideCameraPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={preset.id === activeCameraMode ? 'is-active' : ''}
              onClick={() => applyGuideCamera(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <aside className="map-3d-guide-status">
        <span className="map-3d-guide-beta">Beta</span>
        <h2>灵山导览牌</h2>
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
        <strong>历史文化核心站点</strong>
        <div>
          {routeStops.map((stop, index) => {
            const poi = getPoiDisplay(stop.spotId)
            const active = index === selectedStopIndex
            const isNext = stop.spotId === nextStop.nextStopId
            const isTerminal = stop.spotId === terminalStopId

            return (
              <button
                key={stop.spotId}
                type="button"
                className={[
                  active ? 'is-active' : '',
                  isNext ? 'is-next' : '',
                  isTerminal ? 'is-terminal' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => moveToStop(index)}
              >
                <span>{index + 1}</span>
                {poi?.name ?? stop.spotId}
                {active ? <small>当前</small> : null}
                {isNext ? <small>下一站</small> : null}
                {isTerminal ? <small>终点</small> : null}
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
          <strong>导览控制台</strong>
          <div className="map-3d-guide-console-grid">
            <span>
              <em>当前路线</em>
              {demoGuideRoute.name}
            </span>
            <span>
              <em>当前站点</em>
              {currentStop?.name ?? '路线中段'}
            </span>
            <span>
              <em>下一站</em>
              {nextStopPoi?.name ?? '路线终点'}
            </span>
            <span>
              <em>距下一站</em>
              约 {distanceToNextStopText}
            </span>
            <span>
              <em>当前状态</em>
              {guideStateText}
            </span>
          </div>
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

function getPathCenter(path: LatLngPoint[]) {
  if (!path.length) {
    return null
  }

  const center = path.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: center.lat / path.length,
    lng: center.lng / path.length
  }
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

function routePoiMarkerSvg(state: 'route' | 'current' | 'next' | 'terminal', index: number) {
  const palette = {
    route: {
      jade: '#1f5a4d',
      gold: '#f0cf72',
      paper: '#fff8df',
      glow: 'rgba(240, 207, 114, .28)',
      text: '#20483f',
      label: String(index)
    },
    current: {
      jade: '#7a4f0f',
      gold: '#ffd96a',
      paper: '#fff4c7',
      glow: 'rgba(255, 217, 106, .46)',
      text: '#6c3f08',
      label: '今'
    },
    next: {
      jade: '#0f766e',
      gold: '#b7f3df',
      paper: '#e8fff7',
      glow: 'rgba(45, 212, 191, .34)',
      text: '#0f5f56',
      label: '次'
    },
    terminal: {
      jade: '#8b2f17',
      gold: '#ffc261',
      paper: '#fff0d5',
      glow: 'rgba(251, 146, 60, .38)',
      text: '#7c2d12',
      label: '终'
    }
  }[state]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="rgba(32,44,35,.30)"/>
      </filter>
    </defs>
    <ellipse cx="24" cy="28" rx="21" ry="22" fill="${palette.glow}"/>
    <g filter="url(#shadow)">
      <path d="M24 54s17-14.4 17-31A17 17 0 0 0 7 23c0 16.6 17 31 17 31Z" fill="${palette.jade}" stroke="rgba(255,255,255,.92)" stroke-width="2.4"/>
      <path d="M24 9c5.2 3.6 8.2 8 8.2 12.8 0 6.3-4.8 11.4-8.2 13.4-3.4-2-8.2-7.1-8.2-13.4C15.8 17 18.8 12.6 24 9Z" fill="${palette.paper}" opacity=".96"/>
      <path d="M13.2 23.4c5.2.5 8.1 2.8 10.8 9.2-6.5-.8-10.1-3.6-10.8-9.2Z" fill="${palette.gold}" opacity=".92"/>
      <path d="M35.8 23.4c-.7 5.6-4.3 8.4-10.8 9.2 2.7-6.4 5.6-8.7 10.8-9.2Z" fill="${palette.gold}" opacity=".92"/>
      <circle cx="24" cy="23" r="10.4" fill="${palette.paper}" stroke="${palette.gold}" stroke-width="2"/>
      <text x="24" y="27" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="900" fill="${palette.text}">${palette.label}</text>
    </g>
  </svg>`
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
  opacity: .68;
  filter: saturate(.62) sepia(.24) contrast(.90) brightness(1.08);
}

.map-3d-guide-skin,
.map-3d-guide-mist,
.map-3d-guide-waterwash,
.map-3d-guide-mountainveil,
.map-3d-guide-focuswash,
.map-3d-guide-paperedge {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.map-3d-guide-skin {
  background:
    radial-gradient(ellipse at 44% 54%, rgba(255, 236, 155, .16), transparent 18%),
    radial-gradient(circle at 22% 18%, rgba(247, 231, 172, .42), transparent 28%),
    radial-gradient(circle at 77% 26%, rgba(83, 131, 113, .30), transparent 30%),
    linear-gradient(90deg, rgba(249, 246, 229, .62), transparent 24%, transparent 72%, rgba(33, 71, 62, .30)),
    linear-gradient(180deg, rgba(245, 241, 221, .50), transparent 38%, rgba(22, 61, 52, .28));
  mix-blend-mode: multiply;
}

.map-3d-guide-mist {
  background:
    linear-gradient(135deg, rgba(255,255,255,.26), transparent 30%),
    repeating-linear-gradient(100deg, rgba(255,255,255,.08) 0 2px, transparent 2px 22px);
  opacity: .64;
}

.map-3d-guide-waterwash {
  background:
    radial-gradient(ellipse at 70% 74%, rgba(85, 164, 181, .36), transparent 36%),
    radial-gradient(ellipse at 82% 58%, rgba(123, 199, 207, .20), transparent 28%),
    linear-gradient(135deg, transparent 46%, rgba(89, 150, 159, .18));
  mix-blend-mode: color;
}

.map-3d-guide-mountainveil {
  background:
    radial-gradient(ellipse at 18% 8%, rgba(59, 105, 81, .24), transparent 32%),
    radial-gradient(ellipse at 86% 12%, rgba(43, 92, 75, .20), transparent 34%),
    linear-gradient(180deg, rgba(63, 112, 82, .18), transparent 44%);
  filter: blur(1px);
}

.map-3d-guide-focuswash {
  background:
    radial-gradient(ellipse at 48% 56%, transparent 0 30%, rgba(244, 238, 216, .18) 48%, rgba(42, 67, 55, .22) 100%),
    linear-gradient(90deg, rgba(244, 238, 216, .34), transparent 24%, transparent 72%, rgba(34, 63, 54, .18));
  mix-blend-mode: multiply;
}

.map-3d-guide-paperedge {
  background:
    radial-gradient(ellipse at center, transparent 48%, rgba(250, 246, 226, .30) 70%, rgba(83, 68, 35, .18) 100%),
    linear-gradient(90deg, rgba(250, 246, 226, .40), transparent 18%, transparent 82%, rgba(250, 246, 226, .40));
  box-shadow: inset 0 0 96px rgba(81, 65, 34, .18);
}

.map-3d-guide-illustration {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  opacity: .94;
}

.map-3d-guide-illustration svg {
  width: 100%;
  height: 100%;
  display: block;
}

.map-3d-guide-ink-water {
  filter: drop-shadow(0 22px 34px rgba(19, 73, 89, .16));
}

.map-3d-guide-ink-waterline {
  stroke: rgba(237, 253, 250, .46);
  stroke-width: 8;
  stroke-linecap: round;
}

.map-3d-guide-ink-mountain {
  filter: drop-shadow(0 18px 30px rgba(25, 67, 50, .14));
}

.map-3d-guide-ink-ridge {
  stroke: rgba(31, 78, 60, .22);
  stroke-width: 9;
  stroke-linecap: round;
}

.map-3d-guide-core-light {
  fill: rgba(255, 243, 186, .30);
  filter: blur(12px);
}

.map-3d-guide-buddha-light {
  fill: rgba(252, 210, 94, .36);
  filter: blur(10px);
}

.map-3d-guide-art-buildings path {
  fill: rgba(241, 239, 224, .76);
  stroke: rgba(121, 98, 52, .28);
  stroke-width: 4;
  filter: drop-shadow(0 12px 18px rgba(34, 48, 38, .12));
}

.map-3d-guide-art-route-halo,
.map-3d-guide-art-route-glow,
.map-3d-guide-art-route,
.map-3d-guide-art-route-core {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.map-3d-guide-art-route-halo {
  stroke: rgba(255, 231, 128, .25);
  stroke-width: 78;
  filter: url(#softRouteGlow);
}

.map-3d-guide-art-route-glow {
  stroke: rgba(218, 159, 36, .54);
  stroke-width: 42;
}

.map-3d-guide-art-route {
  stroke: url(#routeRibbon);
  stroke-width: 22;
  filter: drop-shadow(0 8px 14px rgba(117, 75, 11, .22));
}

.map-3d-guide-art-route-core {
  stroke: rgba(255, 249, 218, .86);
  stroke-width: 6;
}

.map-3d-guide-buddha-symbol circle {
  fill: rgba(255, 237, 164, .76);
  stroke: rgba(142, 91, 18, .34);
  stroke-width: 5;
  filter: drop-shadow(0 12px 20px rgba(117, 75, 11, .25));
}

.map-3d-guide-buddha-symbol path {
  fill: rgba(180, 119, 28, .72);
  stroke: rgba(255, 248, 217, .75);
  stroke-width: 3;
}

.map-3d-guide-placards {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.map-3d-guide-placard {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transform: translate(-50%, -50%);
  min-height: 32px;
  max-width: 132px;
  padding: 5px 9px 5px 6px;
  border: 1px solid rgba(255,255,255,.70);
  border-radius: 10px 10px 12px 12px;
  background: linear-gradient(135deg, rgba(253, 248, 224, .94), rgba(222, 239, 226, .88));
  box-shadow: 0 12px 24px rgba(29, 55, 47, .18), inset 0 0 0 1px rgba(255,255,255,.62);
  color: #24483c;
  font-size: 12px;
  font-weight: 900;
  pointer-events: auto;
  cursor: pointer;
}

.map-3d-guide-placard::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -13px;
  width: 2px;
  height: 13px;
  background: rgba(125, 95, 38, .42);
  transform: translateX(-50%);
}

.map-3d-guide-placard span {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1f5a4d;
  color: #fff9dc;
  font-size: 11px;
}

.map-3d-guide-placard strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-3d-guide-placard--current {
  background: linear-gradient(135deg, rgba(255, 230, 148, .98), rgba(255, 247, 214, .94));
  color: #75470c;
  border-color: rgba(255, 235, 166, .94);
  box-shadow: 0 0 0 5px rgba(246, 203, 86, .22), 0 16px 30px rgba(132, 87, 18, .24);
}

.map-3d-guide-placard--current span {
  background: #d6a832;
  color: #fffbe6;
}

.map-3d-guide-placard--next {
  background: linear-gradient(135deg, rgba(216, 252, 244, .96), rgba(255, 248, 217, .90));
  color: #0f5f56;
  border-color: rgba(104, 220, 196, .78);
  box-shadow: 0 0 0 5px rgba(45, 212, 191, .15), 0 14px 28px rgba(15, 118, 110, .18);
}

.map-3d-guide-placard--next span {
  background: #0f766e;
}

.map-3d-guide-placard--terminal {
  background: linear-gradient(135deg, rgba(255, 222, 181, .98), rgba(255, 245, 219, .94));
  color: #7c2d12;
  border-color: rgba(251, 146, 60, .70);
  box-shadow: 0 0 0 5px rgba(251, 146, 60, .16), 0 14px 28px rgba(124, 45, 18, .18);
}

.map-3d-guide-placard--terminal span {
  background: #8b2f17;
}

.map-3d-guide-placard--temple {
  background: linear-gradient(135deg, rgba(245, 239, 222, .96), rgba(220, 236, 224, .88));
  color: #415142;
}

.map-3d-guide-hero,
.map-3d-guide-camera,
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
.map-3d-guide-camera button,
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

.map-3d-guide-camera {
  top: 178px;
  left: 18px;
  width: 380px;
  max-width: calc(100vw - 36px);
  padding: 14px;
  border-radius: 18px;
}

.map-3d-guide-camera > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.map-3d-guide-camera strong {
  color: #25463b;
}

.map-3d-guide-camera span {
  color: #798276;
  font-size: 12px;
  text-align: right;
}

.map-3d-guide-camera__buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.map-3d-guide-camera button {
  min-height: 32px;
  padding: 0 8px;
  border-radius: 12px;
  font-size: 12px;
}

.map-3d-guide-camera button.is-active {
  border-color: rgba(213, 166, 45, .70);
  background: linear-gradient(135deg, rgba(255, 244, 202, .98), rgba(230, 246, 238, .94));
  color: #7a4f0f;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.58);
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
  padding: 12px;
  border-radius: 14px;
  background: rgba(233, 244, 237, .75);
  color: #1e5749;
  font-size: 12px;
  border: 1px solid rgba(31, 90, 77, .12);
}

.map-3d-guide-deviation--planning,
.map-3d-guide-deviation--off_route {
  background: rgba(255, 247, 214, .86);
  color: #8a5a0a;
}

.map-3d-guide-deviation--ready {
  background:
    linear-gradient(135deg, rgba(220, 252, 241, .92), rgba(255, 250, 219, .78));
  color: #0f766e;
  border-color: rgba(20, 184, 166, .38);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.64), 0 10px 24px rgba(15, 118, 110, .12);
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
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  background: linear-gradient(135deg, rgba(255, 238, 168, .98), rgba(255, 250, 226, .96));
  border-color: rgba(213, 166, 45, .72);
  box-shadow: 0 0 0 3px rgba(246, 203, 86, .18), 0 8px 22px rgba(154, 106, 22, .12);
}

.map-3d-guide-pois button.is-active span {
  background: #d6a832;
  color: #fff9db;
}

.map-3d-guide-pois button.is-next {
  color: #0f5f56;
  border-color: rgba(20, 148, 134, .40);
  background: rgba(224, 249, 243, .92);
  box-shadow: 0 0 0 3px rgba(45, 212, 191, .12);
}

.map-3d-guide-pois button.is-next span {
  background: #0f766e;
  color: #e9fffa;
}

.map-3d-guide-pois button.is-terminal {
  color: #8a3512;
  border-color: rgba(182, 83, 24, .40);
  background: rgba(255, 238, 214, .94);
}

.map-3d-guide-pois button.is-terminal span {
  background: #8b2f17;
  color: #fff3d8;
}

.map-3d-guide-pois button small {
  padding: 2px 5px;
  border-radius: 999px;
  background: rgba(255,255,255,.68);
  font-size: 10px;
  font-weight: 900;
}

.map-3d-guide-controlbar {
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(255, 249, 228, .94), rgba(231, 247, 239, .90));
  border-color: rgba(213, 166, 45, .28);
}

.map-3d-guide-progress {
  grid-column: 1 / -1;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(32, 79, 70, .12);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.72);
}

.map-3d-guide-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2c6f5d, #e4af2f, #ffe08a);
  box-shadow: 0 0 18px rgba(228, 175, 47, .48);
}

.map-3d-guide-controlbar__meta {
  display: grid;
  gap: 8px;
  color: #6a756d;
  font-size: 12px;
}

.map-3d-guide-controlbar__meta strong {
  color: #24483c;
  font-size: 14px;
}

.map-3d-guide-console-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(112px, 1fr));
  gap: 8px;
}

.map-3d-guide-console-grid span {
  display: grid;
  gap: 3px;
  min-height: 48px;
  padding: 9px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .50);
  color: #24483c;
  font-size: 13px;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.60);
}

.map-3d-guide-console-grid em {
  color: #8a6a28;
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
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
  .map-3d-guide-camera,
  .map-3d-guide-status,
  .map-3d-guide-pois,
  .map-3d-guide-controlbar {
    left: 12px;
    right: 12px;
    width: auto;
    max-width: none;
  }

  .map-3d-guide-status {
    top: 266px;
  }

  .map-3d-guide-camera {
    top: 172px;
  }

  .map-3d-guide-camera__buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-3d-guide-pois {
    display: block;
    bottom: 206px;
    max-height: 124px;
    overflow: auto;
  }

  .map-3d-guide-pois div {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .map-3d-guide-pois button {
    flex: 0 0 auto;
  }

  .map-3d-guide-controlbar {
    grid-template-columns: 1fr;
    max-height: 42vh;
    overflow: auto;
  }

  .map-3d-guide-console-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-3d-guide-controlbar__actions {
    justify-content: flex-start;
  }
}
`

export default Map3DGuidePage
