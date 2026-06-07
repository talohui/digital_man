import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { guideRoutes, guideSpots, scenicCenter, type GuideRoute, type LatLngPoint } from '../data/guideData'
import {
  getDefaultMap3DGardenAssets,
  type LingshanMap3DGardenAsset
} from '../data/lingshanMap3DGardenAssets'
import { lingshanPois, type LingshanPoi } from '../data/lingshanMapData'
import { getMapModelOverlayByPoiId, type LingshanMapModelOverlay } from '../data/lingshanMapModelOverlays'
import { getLingshanRouteGeometryByGuideRouteId } from '../data/lingshanRouteGeometries'
import { loadTMap } from '../lib/loadTMap'
import { buildPlannedRouteFromPath, buildWalkingRoute, type PlannedRoute } from '../lib/routePlanning'
import { findNearestRoutePoint, findNextStop, formatDistanceMeters, haversineDistanceMeters } from '../lib/routeProgress'

type Map3DGuideStatus = 'idle' | 'loading' | 'ready' | 'error'
type RerouteStatus = 'idle' | 'off_route' | 'planning' | 'ready' | 'failed'
type GuideCameraMode = 'overview' | 'current' | 'next' | 'focus' | 'topdown' | 'guide'
type Map3DGuideVariant = 'default' | 'prototype-a' | 'prototype-b' | 'prototype-c'

type GuideCameraPreset = {
  id: GuideCameraMode
  label: string
  description: string
  zoom: number
  pitch: number
  rotation: number
}

type MapStyleSupportReport = {
  mapMethods: Record<string, boolean>
  mapRelatedMethods: string[]
  tmapStyleKeys: string[]
  tmapRelatedKeys: string[]
}

type InkDecorKind =
  | 'pine'
  | 'willow'
  | 'water'
  | 'courtyard'
  | 'bridge'
  | 'stone'
  | 'mist'
  | 'lotus'
  | 'glow'
  | 'stair'

type InkDecorOverlay = {
  id: string
  kind: InkDecorKind
  name: string
  position: LatLngPoint
  routeIndex: number
  size: number
  rotation: number
  opacity: number
  zIndex: number
  assetUrl?: string
  assetSource?: 'kenney_foliage_pack' | 'opengameart_lotus_flowers'
  note?: string
}

type RenderedInkDecorOverlay = InkDecorOverlay & {
  styleId: string
  active: boolean
}

type DecorSmokeReport = {
  markerCount: number
  fallbackCount: number
  assetUrls: string[]
}

type AssetLoadState = Record<string, 'loaded' | 'error'>

type GardenModelReport = {
  createdCount: number
  visibleCount: number
  unavailable: boolean
  assetUrls: string[]
  loadedIds: string[]
  errorIds: string[]
}

type Map3DGuideVisualVariantConfig = {
  id: Map3DGuideVariant
  className: string
  kicker: string
  title: string
  subtitle: string
  statusTitle: string
  stationPanelTitle: string
  controlTitle: string
  decorStorageKey: string
  decorStrategy: string
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
const tencentMapStyleMethodCandidates = ['setMapStyleId', 'setStyle', 'setMapStyle', 'setBaseMap']
const MAP_3D_GUIDE_STYLE_ID = 'style1'
const MAP_3D_GUIDE_RENDER_OPTIONS = {
  enableBloom: true
  // fogOptions / skyOptions need confirmed Tencent JS API GL field shapes before enabling.
} as const
const MAP_3D_GUIDE_BASE_MAP = {
  type: 'vector',
  features: ['base', 'building3d', 'label']
} as const
const MAP_3D_GUIDE_DECOR_STORAGE_KEY = 'lingshan-map-3d-guide-ink-decor-v1'
const MAP_3D_GUIDE_GARDEN_STORAGE_KEY = 'lingshan-map-3d-guide-garden-assets-v4-dense-grove'
const map3DGuideVisualVariants: Record<Map3DGuideVariant, Map3DGuideVisualVariantConfig> = {
  default: {
    id: 'default',
    className: 'map-3d-guide-shell--default',
    kicker: '灵山胜境导览',
    title: '真实 3D 游线',
    subtitle: `${demoGuideRoute.name} · 金色丝带路线 · 下一站引导`,
    statusTitle: '导览玉牌',
    stationPanelTitle: '历史文化核心站点',
    controlTitle: '导览控制台',
    decorStorageKey: MAP_3D_GUIDE_DECOR_STORAGE_KEY,
    decorStrategy: '标准路线唤醒水墨层'
  },
  'prototype-a': {
    id: 'prototype-a',
    className: 'map-3d-guide-shell--prototype-a',
    kicker: '视觉原型 A · 少量高质素材',
    title: '青绿佛境精品导览',
    subtitle: `${demoGuideRoute.name} · 稀疏园林资产 · 路线优先`,
    statusTitle: '游线导览牌',
    stationPanelTitle: '核心文化节点',
    controlTitle: '精品导览控制',
    decorStorageKey: `${MAP_3D_GUIDE_DECOR_STORAGE_KEY}-prototype-a`,
    decorStrategy: '少量 CC0 透明 PNG 与内联水墨符号反复组合，画面克制、路线清晰。'
  },
  'prototype-b': {
    id: 'prototype-b',
    className: 'map-3d-guide-shell--prototype-b',
    kicker: '视觉原型 B · 高密度数字沙盘',
    title: '路线唤醒灵山画卷',
    subtitle: `${demoGuideRoute.name} · 密集园林铺陈 · 节点爆点`,
    statusTitle: '沉浸导览牌',
    stationPanelTitle: '路线唤醒节点',
    controlTitle: '沙盘导览控制',
    decorStorageKey: `${MAP_3D_GUIDE_DECOR_STORAGE_KEY}-prototype-b`,
    decorStrategy: '更多 CC0 园林素材沿线铺陈，当前段和关键节点密度更高。'
  },
  'prototype-c': {
    id: 'prototype-c',
    className: 'map-3d-guide-shell--prototype-c',
    kicker: '视觉原型 C · 沉稳 3D 园林资产',
    title: '低模园林路线沙盘',
    subtitle: `${demoGuideRoute.name} · GLB 园林资产 · 地图坐标锚定`,
    statusTitle: '3D 园林导览牌',
    stationPanelTitle: '园林化历史文化节点',
    controlTitle: '3D 园林导览控制',
    decorStorageKey: `${MAP_3D_GUIDE_DECOR_STORAGE_KEY}-prototype-c`,
    decorStrategy: '禁用 PNG 贴片，改用高密度 Kenney CC0 低模自然 GLB 资产沿路线锚定。'
  }
}
const inkDecorKinds: InkDecorKind[] = [
  'pine',
  'willow',
  'water',
  'courtyard',
  'bridge',
  'stone',
  'mist',
  'lotus',
  'glow',
  'stair'
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

export function Map3DGuideExperience({ variant = 'default' }: { variant?: Map3DGuideVariant }) {
  const navigate = useNavigate()
  const visualVariant = map3DGuideVisualVariants[variant] ?? map3DGuideVisualVariants.default
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const poiMarkerLayerRef = useRef<any>(null)
  const userMarkerLayerRef = useRef<any>(null)
  const rerouteLayerRef = useRef<any>(null)
  const decorMarkerLayerRef = useRef<any>(null)
  const gltfModelRef = useRef<any>(null)
  const gardenModelRefs = useRef<Map<string, any>>(new Map())
  const debugDecor = useMemo(() => isQueryEnabled('debugDecor'), [])
  const debugGarden = useMemo(() => visualVariant.id === 'prototype-c' && isQueryEnabled('debugGarden'), [visualVariant.id])
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
  const [mapStyleSupport, setMapStyleSupport] = useState<MapStyleSupportReport>({
    mapMethods: Object.fromEntries(tencentMapStyleMethodCandidates.map((name) => [name, false])),
    mapRelatedMethods: [],
    tmapStyleKeys: [],
    tmapRelatedKeys: []
  })
  const [decorOverlays, setDecorOverlays] = useState<InkDecorOverlay[]>(() => loadStoredDecorOverlays(visualVariant.id))
  const [selectedDecorId, setSelectedDecorId] = useState(() => loadStoredDecorOverlays(visualVariant.id)[0]?.id ?? '')
  const [decorCopyStatus, setDecorCopyStatus] = useState('尚未导出')
  const [decorSmokeReport, setDecorSmokeReport] = useState<DecorSmokeReport>({
    markerCount: 0,
    fallbackCount: 0,
    assetUrls: []
  })
  const [assetLoadState, setAssetLoadState] = useState<AssetLoadState>({})
  const [gardenAssets, setGardenAssets] = useState<LingshanMap3DGardenAsset[]>(() => loadStoredGardenAssets(visualVariant.id))
  const [selectedGardenId, setSelectedGardenId] = useState(() => loadStoredGardenAssets(visualVariant.id)[0]?.id ?? '')
  const [gardenCopyStatus, setGardenCopyStatus] = useState('尚未导出')
  const [gardenModelReport, setGardenModelReport] = useState<GardenModelReport>({
    createdCount: 0,
    visibleCount: 0,
    unavailable: false,
    assetUrls: [],
    loadedIds: [],
    errorIds: []
  })

  const routeStops = demoGuideRoute.stops
  const terminalStopId = routeStops[routeStops.length - 1]?.spotId
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
  const routeProgressRatio = routeProgressPercent / 100
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
  const prototypeLabel =
    visualVariant.id === 'prototype-a'
      ? 'Prototype A 已启用'
      : visualVariant.id === 'prototype-b'
        ? 'Prototype B 已启用'
        : visualVariant.id === 'prototype-c'
          ? 'Prototype C 已启用'
        : ''
  const prototypeName =
    visualVariant.id === 'prototype-a' ? 'A' : visualVariant.id === 'prototype-b' ? 'B' : visualVariant.id === 'prototype-c' ? 'C' : '默认'
  const configuredAssetUrls = useMemo(
    () => Array.from(new Set(decorOverlays.flatMap((decor) => (decor.assetUrl ? [decor.assetUrl] : [])))),
    [decorOverlays]
  )
  const loadedAssetCount = configuredAssetUrls.filter((assetUrl) => assetLoadState[assetUrl] === 'loaded').length
  const failedAssetUrls = configuredAssetUrls.filter((assetUrl) => assetLoadState[assetUrl] === 'error')
  const selectedGardenAsset = gardenAssets.find((asset) => asset.id === selectedGardenId) ?? gardenAssets[0]

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
          rotation: -28,
          mapStyleId: MAP_3D_GUIDE_STYLE_ID,
          baseMap: MAP_3D_GUIDE_BASE_MAP,
          renderOptions: MAP_3D_GUIDE_RENDER_OPTIONS
        })
        mapRef.current = map
        setMapStyleSupport(inspectMapStyleSupport(map, TMap))
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
      decorMarkerLayerRef.current?.setMap?.(null)
      clearGltfModel(gltfModelRef.current)
      gltfModelRef.current = null
      clearGardenModels(gardenModelRefs.current)
      mapRef.current?.destroy?.()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!debugDecor) {
      return
    }

    window.localStorage.setItem(visualVariant.decorStorageKey, JSON.stringify(decorOverlays))
  }, [debugDecor, decorOverlays, visualVariant.decorStorageKey])

  useEffect(() => {
    if (!debugGarden || visualVariant.id !== 'prototype-c') {
      return
    }

    window.localStorage.setItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY, JSON.stringify(gardenAssets))
  }, [debugGarden, gardenAssets, visualVariant.id])

  useEffect(() => {
    if (visualVariant.id === 'default' || typeof window === 'undefined') {
      return
    }

    const assetUrls = Array.from(new Set(decorOverlays.flatMap((decor) => (decor.assetUrl ? [decor.assetUrl] : []))))

    assetUrls.forEach((assetUrl) => {
      if (assetLoadState[assetUrl]) {
        return
      }

      const image = new Image()
      image.onload = () => {
        setAssetLoadState((current) => ({ ...current, [assetUrl]: 'loaded' }))
      }
      image.onerror = () => {
        setAssetLoadState((current) => ({ ...current, [assetUrl]: 'error' }))
      }
      image.src = assetUrl
    })
  }, [assetLoadState, decorOverlays, visualVariant.id])

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    routeLayerRef.current?.setMap?.(null)
    routeLayerRef.current = new window.TMap.MultiPolyline({
      map: mapRef.current,
      styles: {
        routeShadow: new window.TMap.PolylineStyle({
          color: 'rgba(74, 54, 18, 0.18)',
          width: 30,
          borderWidth: 0,
          lineCap: 'round'
        }),
        routeAura: new window.TMap.PolylineStyle({
          color: 'rgba(255, 226, 132, 0.30)',
          width: 23,
          borderWidth: 0,
          lineCap: 'round'
        }),
        routeGlow: new window.TMap.PolylineStyle({
          color: 'rgba(236, 176, 56, 0.66)',
          width: 15,
          borderWidth: 0,
          lineCap: 'round'
        }),
        mainRoute: new window.TMap.PolylineStyle({
          color: '#f1bd3e',
          width: 9,
          borderWidth: 4,
          borderColor: 'rgba(255, 250, 226, 0.96)',
          lineCap: 'round'
        }),
        routeCore: new window.TMap.PolylineStyle({
          color: 'rgba(110, 68, 7, 0.82)',
          width: 2,
          borderWidth: 0,
          lineCap: 'round'
        }),
        completedRoute: new window.TMap.PolylineStyle({
          color: 'rgba(49, 90, 74, 0.42)',
          width: 7,
          borderWidth: 2,
          borderColor: 'rgba(244, 241, 224, 0.74)',
          lineCap: 'round'
        }),
        activeRouteHalo: new window.TMap.PolylineStyle({
          color: 'rgba(255, 220, 105, 0.58)',
          width: 22,
          borderWidth: 0,
          lineCap: 'round'
        }),
        activeRoute: new window.TMap.PolylineStyle({
          color: '#ffe38c',
          width: 11,
          borderWidth: 5,
          borderColor: 'rgba(121, 79, 12, 0.40)',
          lineCap: 'round'
        })
      },
      geometries: buildGuideRouteGeometries()
    })

    return () => {
      routeLayerRef.current?.setMap?.(null)
      routeLayerRef.current = null
    }
  }, [mapStatus, nextStop.nextStopId, routePathIndex, selectedStopId])

  function getActiveRoutePath(currentStopId?: string | null, nextStopId?: string | null) {
    const currentLocation = getRouteStopLocation(currentStopId)
    const nextLocation = getRouteStopLocation(nextStopId)

    if (!currentLocation || !nextLocation) {
      return []
    }

    const startIndex = findNearestRoutePoint(currentLocation, demoRoutePath)?.nearestIndex ?? 0
    const endIndex = findNearestRoutePoint(nextLocation, demoRoutePath)?.nearestIndex ?? startIndex
    const fromIndex = Math.min(startIndex, endIndex)
    const toIndex = Math.max(startIndex, endIndex)
    const segment = demoRoutePath.slice(fromIndex, toIndex + 1)

    if (segment.length > 1) {
      return segment
    }

    return [currentLocation, nextLocation]
  }

  function buildGuideRouteGeometries() {
    const completedPath = demoRoutePath.slice(0, Math.min(demoRoutePath.length, routePathIndex + 1))
    const activePath = getActiveRoutePath(selectedStopId, nextStop.nextStopId)
    const geometries = [
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

    if (completedPath.length > 1) {
      geometries.push({
        id: 'historical-culture-completed-route',
        styleId: 'completedRoute',
        paths: completedPath.map(toTMapLatLng)
      })
    }

    if (activePath.length > 1) {
      geometries.push(
        {
          id: 'historical-culture-active-route-halo',
          styleId: 'activeRouteHalo',
          paths: activePath.map(toTMapLatLng)
        },
        {
          id: 'historical-culture-active-route',
          styleId: 'activeRoute',
          paths: activePath.map(toTMapLatLng)
        }
      )
    }

    return geometries
  }

  useEffect(() => {
    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      return
    }

    const awakenedDecor = buildVisibleDecorGeometries(decorOverlays, {
      routePathIndex,
      debugDecor,
      rerouteActive: rerouteStatus === 'planning' || rerouteStatus === 'ready' || rerouteStatus === 'off_route',
      variant: visualVariant.id
    })
    const rerouteDecor = buildRerouteDecorGeometries(reroutePlan)
    const allDecor = [...awakenedDecor, ...rerouteDecor]

    decorMarkerLayerRef.current?.setMap?.(null)

    if (!allDecor.length) {
      decorMarkerLayerRef.current = null
      setDecorSmokeReport({
        markerCount: 0,
        fallbackCount: 0,
        assetUrls: []
      })
      return
    }

    const assetUrls = Array.from(new Set(allDecor.flatMap((decor) => (decor.assetUrl ? [decor.assetUrl] : []))))
    const fallbackCount = allDecor.filter((decor) => !decor.assetUrl || assetLoadState[decor.assetUrl] === 'error').length

    decorMarkerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: Object.fromEntries(
        allDecor.map((decor) => [
          decor.styleId,
          new window.TMap.MarkerStyle({
            width: decor.size,
            height: decor.size,
            anchor: { x: decor.size / 2, y: decor.size / 2 },
            src: decor.assetUrl && assetLoadState[decor.assetUrl] !== 'error'
              ? decor.assetUrl
              : createSvgDataUrl(inkDecorSvg(decor.kind, {
                  size: decor.size,
                  opacity: decor.opacity,
                  rotation: decor.rotation,
                  active: decor.active
                }))
          })
        ])
      ),
      geometries: allDecor.map((decor) => ({
        id: decor.id,
        styleId: decor.styleId,
        position: toTMapLatLng(decor.position),
        rank: decor.zIndex,
        properties: {
          title: decor.name
        }
      }))
    })

    setDecorSmokeReport({
      markerCount: allDecor.length,
      fallbackCount,
      assetUrls
    })

    return () => {
      decorMarkerLayerRef.current?.setMap?.(null)
      decorMarkerLayerRef.current = null
    }
  }, [assetLoadState, debugDecor, decorOverlays, mapStatus, reroutePlan, rerouteStatus, routePathIndex, visualVariant.id])

  useEffect(() => {
    clearGardenModels(gardenModelRefs.current)
    gardenModelRefs.current = new Map()

    if (visualVariant.id !== 'prototype-c') {
      setGardenModelReport({
        createdCount: 0,
        visibleCount: 0,
        unavailable: false,
        assetUrls: [],
        loadedIds: [],
        errorIds: []
      })
      return
    }

    if (mapStatus !== 'ready' || !window.TMap || !mapRef.current) {
      setGardenModelReport((current) => ({
        ...current,
        createdCount: 0,
        visibleCount: 0,
        unavailable: false
      }))
      return
    }

    const visibleAssets = getVisibleGardenAssets(gardenAssets, {
      debugGarden,
      routeProgressRatio,
      rerouteActive: rerouteStatus === 'planning' || rerouteStatus === 'ready' || rerouteStatus === 'off_route'
    })
    const assetUrls = Array.from(new Set(visibleAssets.map((asset) => asset.assetUrl)))

    if (!window.TMap.model?.GLTFModel) {
      setGardenModelReport({
        createdCount: 0,
        visibleCount: visibleAssets.length,
        unavailable: true,
        assetUrls,
        loadedIds: [],
        errorIds: []
      })
      return
    }

    const models = new Map<string, any>()
    const immediateErrors: string[] = []

    visibleAssets.forEach((asset) => {
      try {
        const model = new window.TMap.model.GLTFModel({
          id: `map-3d-guide-garden-${asset.id}`,
          map: mapRef.current,
          url: asset.assetUrl,
          position: new window.TMap.LatLng(asset.location.lat, asset.location.lng, asset.height),
          rotation: [0, asset.yaw, 0],
          scale: asset.scale
        })
        if (typeof model.setOpacity === 'function') {
          model.setOpacity(asset.opacity)
        }
        models.set(asset.id, model)

        if (typeof model.on === 'function') {
          model.on('loaded', () => {
            setGardenModelReport((current) => ({
              ...current,
              loadedIds: uniqueStrings([...current.loadedIds, asset.id])
            }))
          })
          model.on('error', () => {
            setGardenModelReport((current) => ({
              ...current,
              errorIds: uniqueStrings([...current.errorIds, asset.id])
            }))
          })
        }
      } catch {
        immediateErrors.push(asset.id)
      }
    })

    gardenModelRefs.current = models
    setGardenModelReport({
      createdCount: models.size,
      visibleCount: visibleAssets.length,
      unavailable: false,
      assetUrls,
      loadedIds: [],
      errorIds: immediateErrors
    })

    return () => {
      clearGardenModels(gardenModelRefs.current)
      gardenModelRefs.current = new Map()
    }
  }, [debugGarden, gardenAssets, mapStatus, rerouteStatus, routeProgressRatio, visualVariant.id])

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

  const selectedDecor = decorOverlays.find((decor) => decor.id === selectedDecorId) ?? decorOverlays[0]

  const updateSelectedDecor = (patch: Partial<InkDecorOverlay>) => {
    if (!selectedDecor) {
      return
    }

    setDecorOverlays((items) =>
      items.map((decor) =>
        decor.id === selectedDecor.id
          ? {
              ...decor,
              ...patch,
              position: patch.position ?? decor.position
            }
          : decor
      )
    )
  }

  const resetDecorConfig = () => {
    const defaults = buildDefaultDecorOverlays(visualVariant.id)
    setDecorOverlays(defaults)
    setSelectedDecorId(defaults[0]?.id ?? '')
    window.localStorage.removeItem(visualVariant.decorStorageKey)
    setDecorCopyStatus('已恢复默认装饰配置')
  }

  const copyDecorConfig = async () => {
    const snippet = `export const lingshanMapDecorOverlays = ${JSON.stringify(decorOverlays, null, 2)} as const\n`
    const ok = await copyText(snippet)
    setDecorCopyStatus(ok ? '已复制 TS 配置片段' : '复制失败，请查看浏览器权限')
  }

  const copyDecorSummary = async () => {
    const summary = [
      `debugDecor=${debugDecor ? '1' : '0'}`,
      `decorCount=${decorOverlays.length}`,
      `routePathIndex=${routePathIndex}/${Math.max(0, demoRoutePath.length - 1)}`,
      `selectedDecor=${selectedDecor?.id ?? 'none'}`,
      `visibleDecor=${buildVisibleDecorGeometries(decorOverlays, {
        routePathIndex,
        debugDecor,
        rerouteActive: rerouteStatus === 'planning' || rerouteStatus === 'ready' || rerouteStatus === 'off_route',
        variant: visualVariant.id
      }).length}`,
      `rerouteDecor=${buildRerouteDecorGeometries(reroutePlan).length}`
    ].join('\n')
    const ok = await copyText(summary)
    setDecorCopyStatus(ok ? '已复制调试摘要' : '复制失败，请查看浏览器权限')
  }

  const updateSelectedGardenAsset = (patch: Partial<LingshanMap3DGardenAsset>) => {
    if (!selectedGardenAsset) {
      return
    }

    setGardenAssets((items) =>
      items.map((asset) =>
        asset.id === selectedGardenAsset.id
          ? {
              ...asset,
              ...patch,
              location: patch.location ?? asset.location
            }
          : asset
      )
    )
  }

  const resetGardenConfig = () => {
    const defaults = getDefaultMap3DGardenAssets()
    setGardenAssets(defaults)
    setSelectedGardenId(defaults[0]?.id ?? '')
    window.localStorage.removeItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY)
    setGardenCopyStatus('已恢复默认高密度 Kenney 树群配置')
  }

  const copyGardenConfig = async () => {
    const snippet = `export const lingshanMap3DGardenAssets = ${JSON.stringify(gardenAssets, null, 2)} as const\n`
    const ok = await copyText(snippet)
    setGardenCopyStatus(ok ? '已复制 3D 园林 TS 配置片段' : '复制失败，请查看浏览器权限')
  }

  const copyGardenSummary = async () => {
    const summary = [
      `debugGarden=${debugGarden ? '1' : '0'}`,
      `variant=${visualVariant.id}`,
      `gardenAssetCount=${gardenAssets.length}`,
      `visibleAssets=${gardenModelReport.visibleCount}`,
      `createdModels=${gardenModelReport.createdCount}`,
      `selectedGarden=${selectedGardenAsset?.id ?? 'none'}`,
      `selectedScale=${selectedGardenAsset?.scale ?? 'none'}`,
      `selectedHeight=${selectedGardenAsset?.height ?? 'none'}`,
      `selectedYaw=${selectedGardenAsset?.yaw ?? 'none'}`,
      `GLTFModelUnavailable=${gardenModelReport.unavailable ? 'true' : 'false'}`
    ].join('\n')
    const ok = await copyText(summary)
    setGardenCopyStatus(ok ? '已复制 3D 园林调试摘要' : '复制失败，请查看浏览器权限')
  }

  return (
    <main className={`map-3d-guide-shell ${visualVariant.className}`}>
      <div ref={mapElementRef} className="map-3d-guide-map" />
      <div className="map-3d-guide-skin" aria-hidden="true" />
      <div className="map-3d-guide-mist" aria-hidden="true" />
      <div className="map-3d-guide-paperedge" aria-hidden="true" />
      {prototypeLabel ? <div className="map-3d-guide-prototype-badge">{prototypeLabel}</div> : null}

      <section className="map-3d-guide-hero">
        <div className="map-3d-guide-kicker">{visualVariant.kicker}</div>
        <h1>{visualVariant.title}</h1>
        <p>{visualVariant.subtitle}</p>
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

      {debugDecor ? (
        <section className="map-3d-guide-decor-debug">
          <div className="map-3d-guide-decor-debug__header">
            <div>
              <strong>水墨装饰调试</strong>
              <span>{visualVariant.decorStrategy} · 路线唤醒进度：{routeProgressPercent}%</span>
            </div>
            <button type="button" onClick={copyDecorConfig}>
              复制 TS 配置
            </button>
          </div>

          <label>
            装饰点
            <select
              value={selectedDecor?.id ?? ''}
              onChange={(event) => setSelectedDecorId(event.target.value)}
            >
              {decorOverlays.map((decor) => (
                <option key={decor.id} value={decor.id}>
                  {decor.name} · {decor.kind}
                </option>
              ))}
            </select>
          </label>

          {selectedDecor ? (
            <div className="map-3d-guide-decor-debug__grid">
              <label>
                类型
                <select
                  value={selectedDecor.kind}
                  onChange={(event) => updateSelectedDecor({ kind: event.target.value as InkDecorKind })}
                >
                  {inkDecorKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                纬度
                <input
                  type="number"
                  step="0.000001"
                  value={selectedDecor.position.lat}
                  onChange={(event) =>
                    updateSelectedDecor({
                      position: {
                        ...selectedDecor.position,
                        lat: Number(event.target.value)
                      }
                    })
                  }
                />
              </label>
              <label>
                经度
                <input
                  type="number"
                  step="0.000001"
                  value={selectedDecor.position.lng}
                  onChange={(event) =>
                    updateSelectedDecor({
                      position: {
                        ...selectedDecor.position,
                        lng: Number(event.target.value)
                      }
                    })
                  }
                />
              </label>
              <label>
                缩放
                <input
                  type="number"
                  min="20"
                  max="180"
                  value={selectedDecor.size}
                  onChange={(event) => updateSelectedDecor({ size: Number(event.target.value) })}
                />
              </label>
              <label>
                旋转
                <input
                  type="number"
                  min="-180"
                  max="180"
                  value={selectedDecor.rotation}
                  onChange={(event) => updateSelectedDecor({ rotation: Number(event.target.value) })}
                />
              </label>
              <label>
                透明度
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedDecor.opacity}
                  onChange={(event) => updateSelectedDecor({ opacity: Number(event.target.value) })}
                />
              </label>
              <label>
                显现索引
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, demoRoutePath.length - 1)}
                  value={selectedDecor.routeIndex}
                  onChange={(event) => updateSelectedDecor({ routeIndex: Number(event.target.value) })}
                />
              </label>
              <label>
                层级
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={selectedDecor.zIndex}
                  onChange={(event) => updateSelectedDecor({ zIndex: Number(event.target.value) })}
                />
              </label>
            </div>
          ) : null}

          <div className="map-3d-guide-decor-debug__actions">
            <button type="button" onClick={copyDecorSummary}>
              复制调试摘要
            </button>
            <button type="button" onClick={resetDecorConfig}>
              恢复默认
            </button>
          </div>
          <p>
            调整会自动保存到 localStorage。装饰点使用 TMap Marker，经纬度锚定，随地图平移、缩放、旋转移动。
          </p>
          <small>{decorCopyStatus}</small>
        </section>
      ) : null}

      {debugGarden ? (
        <section className="map-3d-guide-garden-debug">
          <div className="map-3d-guide-decor-debug__header">
            <div>
              <strong>3D 园林资产调试</strong>
              <span>
                prototype-c · 已创建模型 {gardenModelReport.createdCount}/{gardenModelReport.visibleCount} · 路线进度 {routeProgressPercent}%
              </span>
            </div>
            <button type="button" onClick={copyGardenConfig}>
              复制 TS 配置
            </button>
          </div>

          <label>
            3D 资产
            <select
              value={selectedGardenAsset?.id ?? ''}
              onChange={(event) => setSelectedGardenId(event.target.value)}
            >
              {gardenAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} · {asset.kind}
                </option>
              ))}
            </select>
          </label>

          {selectedGardenAsset ? (
            <div className="map-3d-guide-decor-debug__grid">
              <label>
                纬度
                <input
                  type="number"
                  step="0.000001"
                  value={selectedGardenAsset.location.lat}
                  onChange={(event) =>
                    updateSelectedGardenAsset({
                      location: {
                        ...selectedGardenAsset.location,
                        lat: Number(event.target.value)
                      }
                    })
                  }
                />
              </label>
              <label>
                经度
                <input
                  type="number"
                  step="0.000001"
                  value={selectedGardenAsset.location.lng}
                  onChange={(event) =>
                    updateSelectedGardenAsset({
                      location: {
                        ...selectedGardenAsset.location,
                        lng: Number(event.target.value)
                      }
                    })
                  }
                />
              </label>
              <label>
                scale
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={selectedGardenAsset.scale}
                  onChange={(event) => updateSelectedGardenAsset({ scale: Number(event.target.value) })}
                />
              </label>
              <label>
                height
                <input
                  type="number"
                  min="-50"
                  max="300"
                  value={selectedGardenAsset.height}
                  onChange={(event) => updateSelectedGardenAsset({ height: Number(event.target.value) })}
                />
              </label>
              <label>
                yaw
                <input
                  type="number"
                  min="-180"
                  max="180"
                  value={selectedGardenAsset.yaw}
                  onChange={(event) => updateSelectedGardenAsset({ yaw: Number(event.target.value) })}
                />
              </label>
              <label>
                opacity
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedGardenAsset.opacity}
                  onChange={(event) => updateSelectedGardenAsset({ opacity: Number(event.target.value) })}
                />
              </label>
              <label>
                显现进度
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedGardenAsset.routeFraction}
                  onChange={(event) => updateSelectedGardenAsset({ routeFraction: Number(event.target.value) })}
                />
              </label>
              <label>
                可见
                <select
                  value={selectedGardenAsset.visible ? 'true' : 'false'}
                  onChange={(event) => updateSelectedGardenAsset({ visible: event.target.value === 'true' })}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label>
                优先级
                <select
                  value={selectedGardenAsset.priority}
                  onChange={(event) => updateSelectedGardenAsset({ priority: event.target.value as LingshanMap3DGardenAsset['priority'] })}
                >
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
              </label>
            </div>
          ) : null}

          <div className="map-3d-guide-decor-debug__actions">
            <button type="button" onClick={copyGardenSummary}>
              复制调试摘要
            </button>
            <button type="button" onClick={resetGardenConfig}>
              恢复默认
            </button>
          </div>
          <p>
            3D 园林资产使用 TMap.model.GLTFModel，经纬度锚定并随腾讯地图相机移动。调参会自动保存到新版 localStorage；如果仍看到旧 19 点配置，请点击“恢复默认”切回高密度树群配置。
          </p>
          <p>
            {gardenModelReport.unavailable
              ? '当前 TMap.model.GLTFModel 不可用，模型不会创建。'
              : `素材：${gardenModelReport.assetUrls.length} 个 URL，loaded ${gardenModelReport.loadedIds.length}，error ${gardenModelReport.errorIds.length}`}
          </p>
          <small>{gardenCopyStatus}</small>
        </section>
      ) : null}

      <aside className="map-3d-guide-status">
        <span className="map-3d-guide-beta">Beta</span>
        <h2>{visualVariant.statusTitle}</h2>
        <dl>
          <div>
            <dt>当前路线</dt>
            <dd>{demoGuideRoute.name}</dd>
          </div>
          <div>
            <dt>当前站点</dt>
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
            <dt>当前状态</dt>
            <dd>{guideStateText}</dd>
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

        <details className="map-3d-guide-dev-diagnostics">
          <summary>开发诊断</summary>
          {visualVariant.id === 'prototype-a' || visualVariant.id === 'prototype-b' ? (
            <div className="map-3d-guide-style-audit">
              <strong>视觉原型烟测</strong>
              <span>当前原型类型：{prototypeName}</span>
              <span>配置装饰点数量：{decorOverlays.length}</span>
              <span>本次创建 marker 数量：{decorSmokeReport.markerCount}</span>
              <span>内联 SVG fallback 数量：{decorSmokeReport.fallbackCount}</span>
              <span>
                素材访问：{loadedAssetCount}/{configuredAssetUrls.length} loaded
                {failedAssetUrls.length ? `，404/失败 ${failedAssetUrls.length}` : '，未发现 404'}
              </span>
              <p>A/B 原型当前为装饰冒烟测试模式：装饰尺寸和透明度已临时提高，便于肉眼确认图层渲染。</p>
              {decorSmokeReport.assetUrls.length ? (
                <ul>
                  {decorSmokeReport.assetUrls.map((assetUrl) => (
                    <li key={assetUrl}>
                      <code>{assetUrl}</code>
                      <em>{assetLoadState[assetUrl] === 'error' ? 'error' : assetLoadState[assetUrl] === 'loaded' ? 'loaded' : 'checking'}</em>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {visualVariant.id === 'prototype-c' ? (
            <div className="map-3d-guide-style-audit">
              <strong>3D 园林资产烟测</strong>
              <span>当前原型类型：C</span>
              <span>配置 3D 资产数量：{gardenAssets.length}</span>
              <span>已唤醒资产数量：{gardenModelReport.visibleCount}</span>
              <span>成功创建 GLTFModel：{gardenModelReport.createdCount}</span>
              <span>GLTFModel 可用：{gardenModelReport.unavailable ? 'false' : 'true'}</span>
              <span>loaded 事件：{gardenModelReport.loadedIds.length}</span>
              <span>error 事件：{gardenModelReport.errorIds.length}</span>
              <p>C 版禁用 PNG/SVG 贴片装饰，使用项目自制低模 GLB 园林资产作为地图坐标锚定层。</p>
              {gardenModelReport.assetUrls.length ? (
                <ul>
                  {gardenModelReport.assetUrls.map((assetUrl) => (
                    <li key={assetUrl}>
                      <code>{assetUrl}</code>
                      <em>
                        {gardenModelReport.errorIds.some((id) => gardenAssets.find((asset) => asset.id === id)?.assetUrl === assetUrl)
                          ? 'error'
                          : gardenModelReport.loadedIds.some((id) => gardenAssets.find((asset) => asset.id === id)?.assetUrl === assetUrl)
                            ? 'loaded'
                            : 'created'}
                      </em>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <div className="map-3d-guide-style-audit">
            <strong>个性化地图样式</strong>
            <span>当前 mapStyleId：{MAP_3D_GUIDE_STYLE_ID}</span>
            <span>状态：已生效 / 已绑定 JavaScript API GL key。</span>
            <span>当前底图：已恢复稳定底图配置，优先保证路线和导览元素可见。</span>
            <span>官方文档确认：mapStyleId 应在 new TMap.Map(...) 初始化参数中传入。</span>
            <span>根因：此前不生效是因为样式绑定到了地图 SDK，不是当前 JavaScript API GL key。</span>
            <ul>
              {tencentMapStyleMethodCandidates.map((method) => (
                <li key={method}>
                  <code>{method}</code>
                  <em>{mapStyleSupport.mapMethods[method] ? 'true' : 'false'}</em>
                </li>
              ))}
            </ul>
            {mapStyleSupport.mapRelatedMethods.length || mapStyleSupport.tmapRelatedKeys.length ? (
              <small>
                相关探测：
                {[...mapStyleSupport.mapRelatedMethods, ...mapStyleSupport.tmapRelatedKeys].slice(0, 6).join(', ')}
              </small>
            ) : null}
            <p>
              如果样式未生效，请检查浏览器 Console 是否出现样式未绑定、无效 ID、默认样式显示、
              custom map 或 mapStyleId 相关提示。
            </p>
            <p>
              绑定到 JavaScript API GL / Web key 后，style1 已在 /map-3d-guide 生效。
            </p>
            <p>腾讯个性化地图样式是当前底图风格化主方案，固定大面积艺术覆盖层不再作为主方案。</p>
            <p>当前需使用普通矢量底图验证 mapStyleId；hybrid / satellite 底图可能不支持自定义样式。</p>
            <p>离线样式包不适合直接接入 Web JS GL 页面，仅作为资源和配色参考。</p>
            <p>
              {hasConfirmedMapStyleSupport(mapStyleSupport)
                ? '检测到可能的样式接入方法，需提供官方 styleId 或确认参数后再启用。'
                : '当前未发现明确 JS API GL 运行时样式方法，暂以轻量滤镜和地图锚定元素实现风格化。'}
            </p>
          </div>

          <div className="map-3d-guide-render-audit">
            <strong>3D 氛围实验</strong>
            <span>
              enableBloom：{MAP_3D_GUIDE_RENDER_OPTIONS.enableBloom ? '开启，泛光实验中' : '关闭'}
            </span>
            <span>fogOptions：未配置，等待确认 Tencent JS API GL 字段</span>
            <span>skyOptions：未配置，等待确认 Tencent JS API GL 字段</span>
            <p>本阶段仅实验腾讯地图原生 3D 渲染氛围，不使用固定大图层覆盖地图。</p>
          </div>
        </details>
      </aside>

      <section className="map-3d-guide-pois">
        <strong>{visualVariant.stationPanelTitle}</strong>
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
          <strong>{visualVariant.controlTitle}</strong>
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

function inspectMapStyleSupport(map: any, TMap?: any): MapStyleSupportReport {
  if (!map) {
    return {
      mapMethods: Object.fromEntries(tencentMapStyleMethodCandidates.map((name) => [name, false])),
      mapRelatedMethods: [],
      tmapStyleKeys: [],
      tmapRelatedKeys: []
    }
  }

  const methodNames = new Set<string>()
  let target = map

  while (target && target !== Object.prototype) {
    Object.getOwnPropertyNames(target).forEach((name) => {
      if (typeof map[name] === 'function') {
        methodNames.add(name)
      }
    })
    target = Object.getPrototypeOf(target)
  }

  const mapMethods = Object.fromEntries(
    tencentMapStyleMethodCandidates.map((name) => [name, methodNames.has(name)])
  )
  const mapRelatedMethods = Array.from(methodNames)
    .filter((name) => /(style|basemap|baseMap|theme|skin)/i.test(name))
    .sort()
  const tmapKeys = TMap ? Object.getOwnPropertyNames(TMap) : []
  const tmapStyleKeys = tmapKeys
    .filter((name) => /(style|mapStyle|basemap|baseMap|theme|skin)/i.test(name))
    .sort()
  const tmapRelatedKeys = tmapStyleKeys.filter((name) => typeof TMap?.[name] === 'function' || typeof TMap?.[name] === 'object')

  return {
    mapMethods,
    mapRelatedMethods,
    tmapStyleKeys,
    tmapRelatedKeys
  }
}

function hasConfirmedMapStyleSupport(report: MapStyleSupportReport) {
  return (
    Object.values(report.mapMethods).some(Boolean) ||
    report.mapRelatedMethods.length > 0 ||
    report.tmapRelatedKeys.length > 0
  )
}

function clearGltfModel(model: any) {
  model?.setMap?.(null)
  model?.remove?.()
  model?.destroy?.()
}

function clearGardenModels(models: Map<string, any>) {
  models.forEach((model) => clearGltfModel(model))
  models.clear()
}

function isQueryEnabled(name: string) {
  if (typeof window === 'undefined') {
    return false
  }

  const value = new URLSearchParams(window.location.search).get(name)
  return value === '1' || value === 'true'
}

function loadStoredGardenAssets(variant: Map3DGuideVariant = 'default') {
  const defaults = getDefaultMap3DGardenAssets()

  if (variant !== 'prototype-c' || typeof window === 'undefined') {
    return defaults
  }

  try {
    const stored = window.localStorage.getItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY)

    if (!stored) {
      return defaults
    }

    const parsed = JSON.parse(stored) as LingshanMap3DGardenAsset[]

    if (!Array.isArray(parsed) || !parsed.length) {
      return defaults
    }

    return parsed.map((asset) => ({
      ...asset,
      location: { ...asset.location }
    }))
  } catch {
    return defaults
  }
}

function loadStoredDecorOverlays(variant: Map3DGuideVariant = 'default') {
  if (typeof window === 'undefined') {
    return buildDefaultDecorOverlays(variant)
  }

  try {
    const stored = window.localStorage.getItem(map3DGuideVisualVariants[variant].decorStorageKey)

    if (!stored) {
      return buildDefaultDecorOverlays(variant)
    }

    const parsed = JSON.parse(stored) as InkDecorOverlay[]

    if (!Array.isArray(parsed) || !parsed.length) {
      return buildDefaultDecorOverlays(variant)
    }

    return parsed
  } catch {
    return buildDefaultDecorOverlays(variant)
  }
}

function buildDefaultDecorOverlays(variant: Map3DGuideVariant = 'default'): InkDecorOverlay[] {
  if (variant === 'prototype-a') {
    return buildPrototypeADecorOverlays()
  }

  if (variant === 'prototype-b') {
    return buildPrototypeBDecorOverlays()
  }

  if (variant === 'prototype-c') {
    return []
  }

  const specs: Array<{
    id: string
    kind: InkDecorKind
    name: string
    fraction: number
    latOffset: number
    lngOffset: number
    size: number
    rotation: number
    opacity: number
    zIndex: number
    note?: string
  }> = [
    { id: 'ink-south-gate-mist', kind: 'mist', name: '南门晨雾', fraction: 0.03, latOffset: -0.00018, lngOffset: 0.00008, size: 116, rotation: -12, opacity: 0.62, zIndex: 10 },
    { id: 'ink-wall-pine', kind: 'pine', name: '照壁松影', fraction: 0.09, latOffset: 0.00016, lngOffset: -0.00012, size: 86, rotation: -8, opacity: 0.8, zIndex: 18 },
    { id: 'ink-square-courtyard', kind: 'courtyard', name: '胜境院落', fraction: 0.15, latOffset: -0.0001, lngOffset: 0.00018, size: 102, rotation: 10, opacity: 0.72, zIndex: 16 },
    { id: 'ink-square-glow', kind: 'glow', name: '广场金光', fraction: 0.19, latOffset: 0.00012, lngOffset: 0.00004, size: 92, rotation: 0, opacity: 0.66, zIndex: 15 },
    { id: 'ink-bridge-water', kind: 'water', name: '桥畔水墨', fraction: 0.25, latOffset: -0.00022, lngOffset: 0.00018, size: 132, rotation: -18, opacity: 0.58, zIndex: 8 },
    { id: 'ink-bridge', kind: 'bridge', name: '游线小桥', fraction: 0.29, latOffset: -0.00005, lngOffset: 0.00022, size: 74, rotation: -18, opacity: 0.82, zIndex: 20 },
    { id: 'ink-nine-lotus', kind: 'lotus', name: '九龙莲光', fraction: 0.35, latOffset: 0.00012, lngOffset: -0.00012, size: 88, rotation: 0, opacity: 0.8, zIndex: 22 },
    { id: 'ink-nine-willow', kind: 'willow', name: '九龙柳影', fraction: 0.39, latOffset: -0.00017, lngOffset: 0.00008, size: 92, rotation: 16, opacity: 0.72, zIndex: 18 },
    { id: 'ink-step-approach', kind: 'stair', name: '登佛石阶', fraction: 0.47, latOffset: 0.00006, lngOffset: -0.00016, size: 82, rotation: 26, opacity: 0.76, zIndex: 19 },
    { id: 'ink-buddha-halo', kind: 'glow', name: '大佛佛光', fraction: 0.55, latOffset: 0.00006, lngOffset: 0.00002, size: 136, rotation: 0, opacity: 0.72, zIndex: 12 },
    { id: 'ink-buddha-stone', kind: 'stone', name: '佛前山石', fraction: 0.58, latOffset: -0.00012, lngOffset: -0.00018, size: 74, rotation: -22, opacity: 0.78, zIndex: 18 },
    { id: 'ink-fan-gong-courtyard', kind: 'courtyard', name: '梵宫院影', fraction: 0.68, latOffset: 0.00018, lngOffset: 0.00012, size: 118, rotation: -9, opacity: 0.7, zIndex: 16 },
    { id: 'ink-fan-gong-mist', kind: 'mist', name: '梵宫薄雾', fraction: 0.72, latOffset: -0.00016, lngOffset: 0.00005, size: 124, rotation: 8, opacity: 0.54, zIndex: 9 },
    { id: 'ink-tancheng-water', kind: 'water', name: '坛城水意', fraction: 0.81, latOffset: 0.00014, lngOffset: -0.0002, size: 124, rotation: 12, opacity: 0.56, zIndex: 8 },
    { id: 'ink-tancheng-lotus', kind: 'lotus', name: '坛城莲印', fraction: 0.86, latOffset: -0.00008, lngOffset: 0.00014, size: 82, rotation: 0, opacity: 0.76, zIndex: 22 },
    { id: 'ink-exit-pine', kind: 'pine', name: '出口松影', fraction: 0.94, latOffset: 0.00012, lngOffset: -0.0001, size: 84, rotation: 12, opacity: 0.68, zIndex: 18 }
  ]

  return specs.map((spec) => {
    const routeIndex = Math.max(0, Math.min(demoRoutePath.length - 1, Math.round(spec.fraction * (demoRoutePath.length - 1))))
    const anchor = demoRoutePath[routeIndex] ?? routeCenter

    return {
      id: spec.id,
      kind: spec.kind,
      name: spec.name,
      position: {
        lat: Number((anchor.lat + spec.latOffset).toFixed(6)),
        lng: Number((anchor.lng + spec.lngOffset).toFixed(6))
      },
      routeIndex,
      size: spec.size,
      rotation: spec.rotation,
      opacity: spec.opacity,
      zIndex: spec.zIndex,
      note: spec.note ?? '沿历史文化路线生成的水墨导览装饰。'
    }
  })
}

function buildPrototypeADecorOverlays(): InkDecorOverlay[] {
  const specs: DecorSpec[] = [
    {
      id: 'a-south-gate-pine-screen',
      kind: 'pine',
      name: '南门松影屏',
      fraction: 0.05,
      latOffset: -0.00016,
      lngOffset: 0.00014,
      size: 76,
      rotation: -8,
      opacity: 0.82,
      zIndex: 18,
      assetUrl: '/assets/map-3d-guide/shared/foliagePack_004.png',
      assetSource: 'kenney_foliage_pack',
      note: 'A 版少量高质量 CC0 树木素材，作为入园导览边界。'
    },
    {
      id: 'a-lingshan-wall-rock',
      kind: 'stone',
      name: '照壁山石',
      fraction: 0.12,
      latOffset: 0.00014,
      lngOffset: -0.00012,
      size: 74,
      rotation: 12,
      opacity: 0.74,
      zIndex: 17,
      assetUrl: '/assets/map-3d-guide/shared/foliagePack_049.png',
      assetSource: 'kenney_foliage_pack',
      note: 'A 版以小型山石锚定照壁节点，不遮挡主路线。'
    },
    {
      id: 'a-shengjing-lotus',
      kind: 'lotus',
      name: '胜境莲印',
      fraction: 0.2,
      latOffset: -0.0001,
      lngOffset: 0.00018,
      size: 82,
      rotation: 0,
      opacity: 0.78,
      zIndex: 22,
      assetUrl: '/assets/map-3d-guide/shared/lotus_0282.png',
      assetSource: 'opengameart_lotus_flowers',
      note: 'A 版用单枚 CC0 莲花强化广场节点。'
    },
    {
      id: 'a-jiulong-tree',
      kind: 'willow',
      name: '九龙树影',
      fraction: 0.35,
      latOffset: 0.00014,
      lngOffset: -0.00016,
      size: 78,
      rotation: -10,
      opacity: 0.8,
      zIndex: 18,
      assetUrl: '/assets/map-3d-guide/shared/foliagePack_027.png',
      assetSource: 'kenney_foliage_pack',
      note: 'A 版在九龙灌浴附近使用一处树影，不堆叠素材。'
    },
    {
      id: 'a-buddha-halo',
      kind: 'glow',
      name: '大佛暖光',
      fraction: 0.55,
      latOffset: 0.00004,
      lngOffset: 0.00002,
      size: 132,
      rotation: 0,
      opacity: 0.7,
      zIndex: 12,
      note: 'A 版保留内联 SVG 佛光，GLB Beta 开启时仍不遮挡模型主体。'
    },
    {
      id: 'a-buddha-pine',
      kind: 'pine',
      name: '佛前青松',
      fraction: 0.59,
      latOffset: -0.00012,
      lngOffset: -0.00015,
      size: 82,
      rotation: 9,
      opacity: 0.78,
      zIndex: 18,
      assetUrl: '/assets/map-3d-guide/shared/foliagePack_007.png',
      assetSource: 'kenney_foliage_pack',
      note: 'A 版将树木素材作为大佛前景框景。'
    },
    {
      id: 'a-fan-gong-courtyard',
      kind: 'courtyard',
      name: '梵宫院影',
      fraction: 0.69,
      latOffset: 0.00016,
      lngOffset: 0.0001,
      size: 108,
      rotation: -9,
      opacity: 0.7,
      zIndex: 16,
      note: 'A 版用自绘院落符号补充建筑气质。'
    },
    {
      id: 'a-tancheng-lotus',
      kind: 'lotus',
      name: '坛城莲影',
      fraction: 0.84,
      latOffset: -0.0001,
      lngOffset: 0.00014,
      size: 76,
      rotation: 8,
      opacity: 0.76,
      zIndex: 22,
      assetUrl: '/assets/map-3d-guide/shared/lotus_3996.png',
      assetSource: 'opengameart_lotus_flowers',
      note: 'A 版在终段用莲花形成收束，不增加画面噪声。'
    }
  ]

  return specs.map(materializeDecorSpec)
}

function buildPrototypeBDecorOverlays(): InkDecorOverlay[] {
  const specs: DecorSpec[] = [
    { id: 'b-south-gate-mist-1', kind: 'mist', name: '南门雾门一', fraction: 0.025, latOffset: -0.00016, lngOffset: 0.0001, size: 112, rotation: -16, opacity: 0.58, zIndex: 9 },
    { id: 'b-south-gate-pine-1', kind: 'pine', name: '南门松阵一', fraction: 0.045, latOffset: 0.00013, lngOffset: -0.00012, size: 76, rotation: -8, opacity: 0.82, zIndex: 18, assetUrl: '/assets/map-3d-guide/shared/foliagePack_004.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-south-gate-pine-2', kind: 'pine', name: '南门松阵二', fraction: 0.065, latOffset: -0.00018, lngOffset: 0.00018, size: 70, rotation: 12, opacity: 0.72, zIndex: 17, assetUrl: '/assets/map-3d-guide/shared/foliagePack_007.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-wall-rock-1', kind: 'stone', name: '照壁山石一', fraction: 0.105, latOffset: 0.00014, lngOffset: -0.00014, size: 68, rotation: 16, opacity: 0.76, zIndex: 17, assetUrl: '/assets/map-3d-guide/shared/foliagePack_049.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-wall-leaves', kind: 'willow', name: '照壁叶影', fraction: 0.125, latOffset: -0.00012, lngOffset: 0.00018, size: 86, rotation: -24, opacity: 0.62, zIndex: 15, assetUrl: '/assets/map-3d-guide/shared/foliagePack_leaves_001.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-square-courtyard-1', kind: 'courtyard', name: '胜境院影一', fraction: 0.165, latOffset: -0.0001, lngOffset: 0.00018, size: 104, rotation: 8, opacity: 0.72, zIndex: 16 },
    { id: 'b-square-glow-1', kind: 'glow', name: '胜境金光一', fraction: 0.185, latOffset: 0.0001, lngOffset: 0.00003, size: 96, rotation: 0, opacity: 0.68, zIndex: 14 },
    { id: 'b-square-lotus-1', kind: 'lotus', name: '胜境莲光一', fraction: 0.205, latOffset: -0.00015, lngOffset: -0.00013, size: 72, rotation: 8, opacity: 0.7, zIndex: 22, assetUrl: '/assets/map-3d-guide/shared/lotus_0282.png', assetSource: 'opengameart_lotus_flowers' },
    { id: 'b-bridge-water-1', kind: 'water', name: '桥畔水意一', fraction: 0.245, latOffset: -0.00022, lngOffset: 0.00018, size: 134, rotation: -18, opacity: 0.58, zIndex: 8 },
    { id: 'b-bridge-1', kind: 'bridge', name: '路线小桥一', fraction: 0.285, latOffset: -0.00006, lngOffset: 0.00022, size: 76, rotation: -18, opacity: 0.82, zIndex: 20 },
    { id: 'b-water-lotus-1', kind: 'lotus', name: '水边莲影一', fraction: 0.305, latOffset: 0.00016, lngOffset: 0.00016, size: 66, rotation: -12, opacity: 0.7, zIndex: 21, assetUrl: '/assets/map-3d-guide/shared/lotus_7692.png', assetSource: 'opengameart_lotus_flowers' },
    { id: 'b-jiulong-tree-1', kind: 'pine', name: '九龙树阵一', fraction: 0.34, latOffset: 0.00013, lngOffset: -0.00013, size: 82, rotation: -8, opacity: 0.82, zIndex: 18, assetUrl: '/assets/map-3d-guide/shared/foliagePack_027.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-jiulong-lotus-1', kind: 'lotus', name: '九龙莲光一', fraction: 0.36, latOffset: -0.00012, lngOffset: 0.0001, size: 84, rotation: 0, opacity: 0.8, zIndex: 22, assetUrl: '/assets/map-3d-guide/shared/lotus_3996.png', assetSource: 'opengameart_lotus_flowers' },
    { id: 'b-jiulong-glow-1', kind: 'glow', name: '九龙光点一', fraction: 0.38, latOffset: 0.00018, lngOffset: 0.00005, size: 72, rotation: 0, opacity: 0.62, zIndex: 14 },
    { id: 'b-approach-stair-1', kind: 'stair', name: '登佛石阶一', fraction: 0.455, latOffset: 0.00006, lngOffset: -0.00016, size: 82, rotation: 26, opacity: 0.78, zIndex: 19 },
    { id: 'b-approach-rock-1', kind: 'stone', name: '登佛山石一', fraction: 0.485, latOffset: -0.00015, lngOffset: 0.00012, size: 70, rotation: -18, opacity: 0.72, zIndex: 17, assetUrl: '/assets/map-3d-guide/shared/foliagePack_058.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-buddha-halo-1', kind: 'glow', name: '大佛佛光一', fraction: 0.545, latOffset: 0.00004, lngOffset: 0.00002, size: 148, rotation: 0, opacity: 0.74, zIndex: 12 },
    { id: 'b-buddha-pine-1', kind: 'pine', name: '佛前青松一', fraction: 0.565, latOffset: -0.00014, lngOffset: -0.00018, size: 84, rotation: 8, opacity: 0.8, zIndex: 18, assetUrl: '/assets/map-3d-guide/shared/foliagePack_007.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-buddha-pine-2', kind: 'pine', name: '佛前青松二', fraction: 0.585, latOffset: 0.00018, lngOffset: -0.00008, size: 78, rotation: -14, opacity: 0.76, zIndex: 18, assetUrl: '/assets/map-3d-guide/shared/foliagePack_011.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-buddha-lotus-1', kind: 'lotus', name: '佛前莲影一', fraction: 0.6, latOffset: -0.00006, lngOffset: 0.00017, size: 74, rotation: 10, opacity: 0.76, zIndex: 21, assetUrl: '/assets/map-3d-guide/shared/lotus_0282.png', assetSource: 'opengameart_lotus_flowers' },
    { id: 'b-temple-mist-1', kind: 'mist', name: '禅寺薄雾一', fraction: 0.625, latOffset: -0.00017, lngOffset: 0.00012, size: 118, rotation: 14, opacity: 0.5, zIndex: 8 },
    { id: 'b-temple-courtyard-1', kind: 'courtyard', name: '禅寺院影一', fraction: 0.645, latOffset: 0.00016, lngOffset: 0.0001, size: 98, rotation: -10, opacity: 0.68, zIndex: 16 },
    { id: 'b-fan-gong-courtyard-1', kind: 'courtyard', name: '梵宫院影一', fraction: 0.685, latOffset: 0.00018, lngOffset: 0.00012, size: 118, rotation: -9, opacity: 0.72, zIndex: 16 },
    { id: 'b-fan-gong-tree-1', kind: 'pine', name: '梵宫树影一', fraction: 0.705, latOffset: -0.00016, lngOffset: 0.00005, size: 76, rotation: 14, opacity: 0.74, zIndex: 18, assetUrl: '/assets/map-3d-guide/shared/foliagePack_041.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-fan-gong-mist-1', kind: 'mist', name: '梵宫云雾一', fraction: 0.725, latOffset: -0.00018, lngOffset: 0.00016, size: 124, rotation: 8, opacity: 0.54, zIndex: 9 },
    { id: 'b-route-glow-1', kind: 'glow', name: '路线光点一', fraction: 0.755, latOffset: 0.0001, lngOffset: -0.00012, size: 68, rotation: 0, opacity: 0.56, zIndex: 13 },
    { id: 'b-tancheng-water-1', kind: 'water', name: '坛城水意一', fraction: 0.805, latOffset: 0.00014, lngOffset: -0.0002, size: 124, rotation: 12, opacity: 0.56, zIndex: 8 },
    { id: 'b-tancheng-lotus-1', kind: 'lotus', name: '坛城莲印一', fraction: 0.835, latOffset: -0.00008, lngOffset: 0.00014, size: 82, rotation: 0, opacity: 0.78, zIndex: 22, assetUrl: '/assets/map-3d-guide/shared/lotus_3996.png', assetSource: 'opengameart_lotus_flowers' },
    { id: 'b-tancheng-lotus-2', kind: 'lotus', name: '坛城莲印二', fraction: 0.86, latOffset: 0.00016, lngOffset: 0.00006, size: 70, rotation: -18, opacity: 0.72, zIndex: 21, assetUrl: '/assets/map-3d-guide/shared/lotus_7692.png', assetSource: 'opengameart_lotus_flowers' },
    { id: 'b-exit-pine-1', kind: 'pine', name: '出口松影一', fraction: 0.925, latOffset: 0.00012, lngOffset: -0.0001, size: 84, rotation: 12, opacity: 0.7, zIndex: 18, assetUrl: '/assets/map-3d-guide/shared/foliagePack_004.png', assetSource: 'kenney_foliage_pack' },
    { id: 'b-exit-mist-1', kind: 'mist', name: '出口归雾一', fraction: 0.955, latOffset: -0.00014, lngOffset: 0.00014, size: 112, rotation: -10, opacity: 0.5, zIndex: 8 },
    { id: 'b-exit-glow-1', kind: 'glow', name: '出口暖光一', fraction: 0.975, latOffset: 0.00006, lngOffset: 0.00002, size: 86, rotation: 0, opacity: 0.62, zIndex: 14 }
  ]

  return specs.map((spec) => ({
    ...materializeDecorSpec({
      ...spec,
      note: spec.note ?? 'B 版高密度路线唤醒装饰，仍使用腾讯地图经纬度锚定。'
    })
  }))
}

type DecorSpec = {
  id: string
  kind: InkDecorKind
  name: string
  fraction: number
  latOffset: number
  lngOffset: number
  size: number
  rotation: number
  opacity: number
  zIndex: number
  assetUrl?: string
  assetSource?: InkDecorOverlay['assetSource']
  note?: string
}

function materializeDecorSpec(spec: DecorSpec): InkDecorOverlay {
  const routeIndex = Math.max(0, Math.min(demoRoutePath.length - 1, Math.round(spec.fraction * (demoRoutePath.length - 1))))
  const anchor = demoRoutePath[routeIndex] ?? routeCenter

  return {
    id: spec.id,
    kind: spec.kind,
    name: spec.name,
    position: {
      lat: Number((anchor.lat + spec.latOffset).toFixed(6)),
      lng: Number((anchor.lng + spec.lngOffset).toFixed(6))
    },
    routeIndex,
    size: spec.size,
    rotation: spec.rotation,
    opacity: spec.opacity,
    zIndex: spec.zIndex,
    assetUrl: spec.assetUrl,
    assetSource: spec.assetSource,
    note: spec.note ?? '沿历史文化路线生成的水墨导览装饰。'
  }
}

function getVisibleGardenAssets(
  assets: LingshanMap3DGardenAsset[],
  options: {
    debugGarden: boolean
    routeProgressRatio: number
    rerouteActive: boolean
  }
) {
  const progress = Math.max(0, Math.min(1, options.routeProgressRatio))

  return assets
    .filter((asset) => asset.visible)
    .map((asset) => {
      if (options.debugGarden) {
        return { ...asset, opacity: Math.max(asset.opacity, 0.92) }
      }

      const distanceFromProgress = asset.routeFraction - progress
      const isCurrentBand = Math.abs(distanceFromProgress) <= 0.12
      const isPassed = distanceFromProgress < -0.12
      const isAhead = distanceFromProgress > 0.12
      const priorityOpacityBoost = asset.priority === 'high' ? 0.08 : asset.priority === 'medium' ? 0.04 : 0
      const rerouteDimming = options.rerouteActive && asset.priority === 'low' ? 0.76 : 1
      const bandOpacity = isCurrentBand ? 0.94 : isPassed ? 0.72 : isAhead ? 0.46 : 0.62
      const opacity = Number(Math.max(0.34, Math.min(1, (bandOpacity + priorityOpacityBoost) * rerouteDimming * asset.opacity)).toFixed(3))
      const scaleBoost = isCurrentBand ? 1.12 : isPassed ? 1.02 : isAhead ? 0.94 : 1

      return {
        ...asset,
        opacity,
        scale: Math.round(asset.scale * scaleBoost)
      }
    })
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

function buildVisibleDecorGeometries(
  decorOverlays: InkDecorOverlay[],
  options: {
    routePathIndex: number
    debugDecor: boolean
    rerouteActive: boolean
    variant: Map3DGuideVariant
  }
): RenderedInkDecorOverlay[] {
  const fadeRange = Math.max(10, Math.round(demoRoutePath.length / 8))
  const smokeScale = options.variant === 'prototype-b' ? 2.5 : options.variant === 'prototype-a' ? 1.8 : 1
  const smokeVisible = options.variant !== 'default'

  return decorOverlays
    .map((decor) => {
      const rawProgress = options.debugDecor
        ? 1
        : Math.max(0, Math.min(1, (options.routePathIndex - decor.routeIndex + fadeRange) / fadeRange))
      const progress = smokeVisible ? 1 : rawProgress
      const rerouteDimming = options.rerouteActive ? 0.58 : 1
      const baseOpacity = smokeVisible ? Math.max(0.85, decor.opacity) : decor.opacity
      const opacity = Number((baseOpacity * progress * rerouteDimming).toFixed(3))
      const size = Math.max(20, Math.round(decor.size * (0.72 + progress * 0.28) * smokeScale))
      const zIndex = smokeVisible ? Math.max(24, decor.zIndex) : decor.zIndex

      return {
        ...decor,
        opacity,
        size,
        styleId: `${decor.id}-${decor.kind}-${size}-${Math.round(opacity * 100)}-${decor.rotation}`,
        zIndex,
        active: progress > 0.92
      }
    })
    .filter((decor) => decor.opacity > 0.04)
}

function buildRerouteDecorGeometries(reroutePlan: PlannedRoute | null): RenderedInkDecorOverlay[] {
  if (!reroutePlan || reroutePlan.path.length < 2) {
    return []
  }

  return [0.28, 0.55, 0.78].map((fraction, index) => {
    const routeIndex = Math.max(0, Math.min(reroutePlan.path.length - 1, Math.round(fraction * (reroutePlan.path.length - 1))))
    const anchor = reroutePlan.path[routeIndex]
    const size = index === 1 ? 118 : 92
    const opacity = index === 1 ? 0.72 : 0.52

    return {
      id: `reroute-ink-mist-${index + 1}`,
      kind: 'mist',
      name: `重规划水雾 ${index + 1}`,
      position: anchor,
      routeIndex,
      size,
      rotation: index === 0 ? -16 : index === 1 ? 10 : 24,
      opacity,
      zIndex: 12,
      styleId: `reroute-ink-mist-${index + 1}-${size}`,
      active: true,
      note: '偏航重规划路线附近的青蓝水墨提示。'
    }
  })
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to textarea fallback.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function inkDecorSvg(
  kind: InkDecorKind,
  options: {
    size: number
    opacity: number
    rotation: number
    active: boolean
  }
) {
  const pulse = options.active ? 1 : 0.72
  const ink = '#173e35'
  const jade = '#2d6b5b'
  const paleJade = '#8fb7a2'
  const water = '#72aeb5'
  const gold = '#d6a832'
  const paper = '#fff8df'
  const opacity = Math.max(0, Math.min(1, options.opacity))
  const transform = `rotate(${options.rotation} 64 64)`

  const shape = {
    pine: `
      <g transform="${transform}">
        <path d="M62 105c6-24 6-46 2-76" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".62"/>
        <path d="M66 22c-25 15-33 33-38 48 18-10 31-13 52-9-8-10-10-23-14-39Z" fill="${jade}" opacity=".78"/>
        <path d="M65 38c-24 7-39 20-48 39 24-11 45-11 71-4-10-9-16-20-23-35Z" fill="${paleJade}" opacity=".66"/>
        <path d="M70 56c-19 8-31 19-40 37 23-9 41-8 62-.4-8-9-14-21-22-36.6Z" fill="${ink}" opacity=".34"/>
      </g>`,
    willow: `
      <g transform="${transform}">
        <path d="M48 22c18 10 26 27 24 72" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity=".45"/>
        ${[34, 44, 54, 64, 74, 84].map((x, index) => `<path d="M${x} 30c${index % 2 ? 14 : 10} 18 ${index % 2 ? 9 : 4} 42-4 68" fill="none" stroke="${jade}" stroke-width="3" stroke-linecap="round" opacity="${0.38 + index * 0.04}"/>`).join('')}
        <ellipse cx="70" cy="92" rx="33" ry="10" fill="${paleJade}" opacity=".16"/>
      </g>`,
    water: `
      <g transform="${transform}">
        <path d="M16 65c17-24 39-28 66-20 17 5 25 2 34-7-5 23-23 42-51 45-22 2-39-5-49-18Z" fill="${water}" opacity=".34"/>
        <path d="M20 67c22 7 40 7 61-3 12-6 23-10 35-7" fill="none" stroke="${paper}" stroke-width="3" stroke-linecap="round" opacity=".58"/>
        <path d="M33 79c20 5 37 4 56-5" fill="none" stroke="${jade}" stroke-width="2" stroke-linecap="round" opacity=".36"/>
      </g>`,
    courtyard: `
      <g transform="${transform}">
        <path d="M27 82h76l-8 18H35l-8-18Z" fill="${ink}" opacity=".20"/>
        <path d="M26 58l38-24 39 24H26Z" fill="${gold}" opacity=".60"/>
        <path d="M35 58h58v28H35z" fill="${paper}" opacity=".82" stroke="${ink}" stroke-width="3"/>
        <path d="M42 65h12v20M61 65h12v20M80 65h8v20" stroke="${jade}" stroke-width="3" stroke-linecap="round" opacity=".70"/>
        <path d="M25 58h80" stroke="${ink}" stroke-width="4" stroke-linecap="round" opacity=".46"/>
      </g>`,
    bridge: `
      <g transform="${transform}">
        <path d="M24 74c18-32 62-32 80 0" fill="none" stroke="${gold}" stroke-width="8" stroke-linecap="round" opacity=".70"/>
        <path d="M31 75c16-20 50-20 66 0" fill="none" stroke="${paper}" stroke-width="5" stroke-linecap="round" opacity=".78"/>
        <path d="M32 83h64" stroke="${ink}" stroke-width="4" stroke-linecap="round" opacity=".38"/>
        <path d="M40 70v16M55 60v25M73 60v25M88 70v16" stroke="${ink}" stroke-width="3" stroke-linecap="round" opacity=".34"/>
      </g>`,
    stone: `
      <g transform="${transform}">
        <path d="M37 91c-13-20-5-47 23-60 24 13 34 38 21 62-17 8-31 8-44-2Z" fill="${ink}" opacity=".30"/>
        <path d="M54 31c20 13 27 35 19 55" fill="none" stroke="${paper}" stroke-width="3" stroke-linecap="round" opacity=".46"/>
        <path d="M34 95c19 10 48 9 69-1" stroke="${jade}" stroke-width="4" stroke-linecap="round" opacity=".20"/>
      </g>`,
    mist: `
      <g transform="${transform}">
        <path d="M16 62c16-12 31-12 45 0 13 11 29 11 51-2" fill="none" stroke="${water}" stroke-width="8" stroke-linecap="round" opacity=".30"/>
        <path d="M14 79c24-11 42-11 61 0 12 7 24 6 38-3" fill="none" stroke="${paper}" stroke-width="7" stroke-linecap="round" opacity=".52"/>
        <path d="M31 95c20-8 38-7 59 1" fill="none" stroke="${jade}" stroke-width="5" stroke-linecap="round" opacity=".20"/>
      </g>`,
    lotus: `
      <g transform="${transform}">
        <ellipse cx="64" cy="75" rx="33" ry="10" fill="${water}" opacity=".18"/>
        <path d="M64 35c11 13 14 28 0 45-14-17-11-32 0-45Z" fill="${paper}" stroke="${gold}" stroke-width="3" opacity=".84"/>
        <path d="M42 47c17 4 27 14 30 33-20-4-30-15-30-33Z" fill="${paleJade}" stroke="${gold}" stroke-width="2" opacity=".72"/>
        <path d="M86 47c0 18-10 29-30 33 3-19 13-29 30-33Z" fill="${paleJade}" stroke="${gold}" stroke-width="2" opacity=".72"/>
        <circle cx="64" cy="72" r="7" fill="${gold}" opacity=".88"/>
      </g>`,
    glow: `
      <g transform="${transform}">
        <circle cx="64" cy="64" r="40" fill="${gold}" opacity=".16"/>
        <circle cx="64" cy="64" r="23" fill="${gold}" opacity=".18"/>
        <path d="M64 22v18M64 88v18M22 64h18M88 64h18M35 35l12 12M81 81l12 12M93 35 81 47M47 81 35 93" stroke="${gold}" stroke-width="4" stroke-linecap="round" opacity=".42"/>
        <circle cx="64" cy="64" r="8" fill="${paper}" stroke="${gold}" stroke-width="3" opacity=".86"/>
      </g>`,
    stair: `
      <g transform="${transform}">
        <path d="M32 88h64M38 76h52M44 64h40M50 52h28M56 40h16" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".36"/>
        <path d="M31 90c22 9 45 8 66-1" stroke="${gold}" stroke-width="3" stroke-linecap="round" opacity=".50"/>
        <path d="M52 33c8 4 16 4 24 0" stroke="${jade}" stroke-width="4" stroke-linecap="round" opacity=".36"/>
      </g>`
  }[kind]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}" viewBox="0 0 128 128">
    <defs>
      <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.4"/>
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="rgba(21, 49, 42, .18)"/>
      </filter>
    </defs>
    <g opacity="${opacity}" filter="url(#shadow)">
      <circle cx="64" cy="68" r="${42 * pulse}" fill="rgba(255,248,223,.18)" filter="url(#soft)"/>
      ${shape}
    </g>
  </svg>`
}

function routePoiMarkerSvg(state: 'route' | 'current' | 'next' | 'terminal', index: number) {
  const palette = {
    route: {
      jade: '#1f5a4d',
      gold: '#f0cf72',
      paper: '#fff8df',
      glow: 'rgba(240, 207, 114, .28)',
      text: '#20483f',
      badge: ''
    },
    current: {
      jade: '#7a4f0f',
      gold: '#ffd96a',
      paper: '#fff4c7',
      glow: 'rgba(255, 217, 106, .58)',
      text: '#6c3f08',
      badge: '当前'
    },
    next: {
      jade: '#0f766e',
      gold: '#b7f3df',
      paper: '#e8fff7',
      glow: 'rgba(45, 212, 191, .42)',
      text: '#0f5f56',
      badge: '下一'
    },
    terminal: {
      jade: '#8b2f17',
      gold: '#ffc261',
      paper: '#fff0d5',
      glow: 'rgba(251, 146, 60, .38)',
      text: '#7c2d12',
      badge: '终点'
    }
  }[state]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="rgba(32,44,35,.30)"/>
      </filter>
    </defs>
    <ellipse cx="24" cy="28" rx="22" ry="23" fill="${palette.glow}"/>
    <g filter="url(#shadow)">
      <path d="M24 54s17-14.4 17-31A17 17 0 0 0 7 23c0 16.6 17 31 17 31Z" fill="${palette.jade}" stroke="rgba(255,255,255,.92)" stroke-width="2.4"/>
      <path d="M24 9c5.2 3.6 8.2 8 8.2 12.8 0 6.3-4.8 11.4-8.2 13.4-3.4-2-8.2-7.1-8.2-13.4C15.8 17 18.8 12.6 24 9Z" fill="${palette.paper}" opacity=".96"/>
      <path d="M13.2 23.4c5.2.5 8.1 2.8 10.8 9.2-6.5-.8-10.1-3.6-10.8-9.2Z" fill="${palette.gold}" opacity=".92"/>
      <path d="M35.8 23.4c-.7 5.6-4.3 8.4-10.8 9.2 2.7-6.4 5.6-8.7 10.8-9.2Z" fill="${palette.gold}" opacity=".92"/>
      <circle cx="24" cy="23" r="10.4" fill="${palette.paper}" stroke="${palette.gold}" stroke-width="2"/>
      <text x="24" y="27" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="900" fill="${palette.text}">${index}</text>
      ${
        palette.badge
          ? `<rect x="11" y="3" width="26" height="12" rx="6" fill="${palette.gold}" stroke="rgba(255,255,255,.92)" stroke-width="1"/>
             <text x="24" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="900" fill="${palette.text}">${palette.badge}</text>`
          : ''
      }
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
  opacity: .98;
  filter: saturate(.84) sepia(.08) contrast(.96) brightness(1.04);
}

.map-3d-guide-skin,
.map-3d-guide-mist,
.map-3d-guide-paperedge {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.map-3d-guide-skin {
  background:
    linear-gradient(90deg, rgba(250, 247, 231, .18), transparent 22%, transparent 78%, rgba(24, 70, 58, .10)),
    linear-gradient(180deg, rgba(248, 242, 219, .10), transparent 45%, rgba(25, 72, 61, .08));
  mix-blend-mode: multiply;
  opacity: .66;
}

.map-3d-guide-mist {
  background:
    radial-gradient(circle at 55% 40%, rgba(255, 252, 235, .07), transparent 34%),
    linear-gradient(135deg, rgba(255,255,255,.10), transparent 30%),
    repeating-linear-gradient(100deg, rgba(255,255,255,.028) 0 1px, transparent 1px 24px);
  opacity: .44;
}

.map-3d-guide-paperedge {
  background:
    radial-gradient(ellipse at center, transparent 58%, rgba(250, 246, 226, .15) 80%, rgba(52, 75, 61, .12) 100%),
    linear-gradient(90deg, rgba(250, 246, 226, .14), transparent 16%, transparent 84%, rgba(250, 246, 226, .14));
  box-shadow: inset 0 0 88px rgba(55, 70, 47, .13);
}

.map-3d-guide-prototype-badge {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 7;
  transform: translateX(-50%);
  padding: 7px 13px;
  border: 1px solid rgba(214, 168, 50, .62);
  border-radius: 999px;
  background: rgba(255, 247, 218, .94);
  color: #7a4f0f;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 12px 32px rgba(22, 54, 43, .16), inset 0 0 0 1px rgba(255,255,255,.66);
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.map-3d-guide-shell--prototype-a .map-3d-guide-map {
  filter: saturate(.72) sepia(.14) contrast(.98) brightness(1.06);
}

.map-3d-guide-shell--prototype-a .map-3d-guide-skin {
  background:
    linear-gradient(90deg, rgba(252, 247, 226, .24), transparent 24%, transparent 76%, rgba(26, 67, 57, .12)),
    linear-gradient(180deg, rgba(251, 246, 225, .12), transparent 42%, rgba(29, 66, 55, .10));
  opacity: .72;
}

.map-3d-guide-shell--prototype-a .map-3d-guide-mist {
  background:
    radial-gradient(circle at 54% 39%, rgba(255, 251, 228, .10), transparent 31%),
    linear-gradient(135deg, rgba(255,255,255,.12), transparent 28%),
    repeating-linear-gradient(100deg, rgba(255,255,255,.022) 0 1px, transparent 1px 28px);
  opacity: .38;
}

.map-3d-guide-shell--prototype-a .map-3d-guide-hero,
.map-3d-guide-shell--prototype-a .map-3d-guide-camera,
.map-3d-guide-shell--prototype-a .map-3d-guide-status,
.map-3d-guide-shell--prototype-a .map-3d-guide-pois,
.map-3d-guide-shell--prototype-a .map-3d-guide-controlbar {
  background:
    linear-gradient(135deg, rgba(255, 252, 237, .94), rgba(235, 246, 236, .86));
  border-color: rgba(182, 150, 78, .34);
  box-shadow: 0 24px 68px rgba(19, 42, 34, .16), inset 0 0 0 1px rgba(255,255,255,.58);
}

.map-3d-guide-shell--prototype-a .map-3d-guide-hero {
  width: 314px;
  border-left-color: rgba(178, 132, 38, .74);
}

.map-3d-guide-shell--prototype-a .map-3d-guide-camera {
  width: 314px;
}

.map-3d-guide-shell--prototype-a .map-3d-guide-status {
  width: 312px;
}

.map-3d-guide-shell--prototype-a .map-3d-guide-pois {
  width: 390px;
}

.map-3d-guide-shell--prototype-a .map-3d-guide-console-grid {
  grid-template-columns: repeat(5, minmax(102px, 1fr));
}

.map-3d-guide-shell--prototype-b .map-3d-guide-map {
  filter: saturate(.92) sepia(.12) contrast(1.02) brightness(1.03);
}

.map-3d-guide-shell--prototype-b .map-3d-guide-skin {
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 228, 142, .12), transparent 30%),
    linear-gradient(90deg, rgba(252, 245, 218, .20), transparent 20%, transparent 74%, rgba(23, 84, 75, .16)),
    linear-gradient(180deg, rgba(251, 244, 218, .10), transparent 45%, rgba(20, 84, 78, .14));
  opacity: .80;
}

.map-3d-guide-shell--prototype-b .map-3d-guide-mist {
  background:
    radial-gradient(circle at 48% 42%, rgba(255, 226, 120, .10), transparent 28%),
    radial-gradient(circle at 64% 56%, rgba(45, 212, 191, .09), transparent 25%),
    linear-gradient(135deg, rgba(255,255,255,.13), transparent 26%),
    repeating-linear-gradient(96deg, rgba(255,255,255,.032) 0 1px, transparent 1px 20px);
  opacity: .54;
}

.map-3d-guide-shell--prototype-b .map-3d-guide-hero,
.map-3d-guide-shell--prototype-b .map-3d-guide-camera,
.map-3d-guide-shell--prototype-b .map-3d-guide-status,
.map-3d-guide-shell--prototype-b .map-3d-guide-pois,
.map-3d-guide-shell--prototype-b .map-3d-guide-controlbar {
  background:
    linear-gradient(135deg, rgba(255, 248, 224, .94), rgba(224, 247, 241, .88));
  border-color: rgba(216, 169, 53, .42);
  box-shadow: 0 28px 76px rgba(13, 53, 47, .20), inset 0 0 0 1px rgba(255,255,255,.58);
}

.map-3d-guide-shell--prototype-b .map-3d-guide-hero {
  border-left-color: rgba(226, 174, 42, .88);
}

.map-3d-guide-shell--prototype-b .map-3d-guide-status {
  border-right-color: rgba(15, 118, 110, .72);
}

.map-3d-guide-shell--prototype-b .map-3d-guide-progress span {
  background: linear-gradient(90deg, #0f766e, #d6a832, #ffe38c, #2dd4bf);
  box-shadow: 0 0 20px rgba(45, 212, 191, .24), 0 0 18px rgba(228, 175, 47, .38);
}

.map-3d-guide-shell--prototype-b .map-3d-guide-deviation--ready {
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.64), 0 12px 30px rgba(20, 184, 166, .18);
}

.map-3d-guide-shell--prototype-c .map-3d-guide-map {
  filter: saturate(.70) sepia(.10) contrast(.98) brightness(1.02);
}

.map-3d-guide-shell--prototype-c .map-3d-guide-skin {
  background:
    linear-gradient(90deg, rgba(250, 247, 228, .18), transparent 25%, transparent 75%, rgba(20, 54, 46, .12)),
    linear-gradient(180deg, rgba(246, 241, 220, .08), transparent 46%, rgba(24, 58, 49, .10));
  opacity: .62;
}

.map-3d-guide-shell--prototype-c .map-3d-guide-mist {
  background:
    radial-gradient(circle at 52% 38%, rgba(255, 249, 220, .07), transparent 30%),
    radial-gradient(circle at 62% 61%, rgba(80, 120, 101, .06), transparent 28%),
    linear-gradient(135deg, rgba(255,255,255,.10), transparent 32%),
    repeating-linear-gradient(104deg, rgba(255,255,255,.022) 0 1px, transparent 1px 32px);
  opacity: .36;
}

.map-3d-guide-shell--prototype-c .map-3d-guide-hero,
.map-3d-guide-shell--prototype-c .map-3d-guide-camera,
.map-3d-guide-shell--prototype-c .map-3d-guide-status,
.map-3d-guide-shell--prototype-c .map-3d-guide-pois,
.map-3d-guide-shell--prototype-c .map-3d-guide-controlbar {
  background:
    linear-gradient(135deg, rgba(252, 248, 230, .94), rgba(226, 238, 226, .88));
  border-color: rgba(126, 112, 71, .34);
  box-shadow: 0 28px 72px rgba(21, 41, 35, .18), inset 0 0 0 1px rgba(255,255,255,.56);
}

.map-3d-guide-shell--prototype-c .map-3d-guide-hero {
  border-left-color: rgba(116, 99, 52, .78);
}

.map-3d-guide-shell--prototype-c .map-3d-guide-status {
  border-right-color: rgba(48, 83, 67, .70);
}

.map-3d-guide-shell--prototype-c .map-3d-guide-progress span {
  background: linear-gradient(90deg, #264f43, #9f8535, #d5bd70);
  box-shadow: 0 0 18px rgba(122, 102, 45, .32);
}

.map-3d-guide-hero,
.map-3d-guide-camera,
.map-3d-guide-status,
.map-3d-guide-pois,
.map-3d-guide-controlbar {
  position: absolute;
  z-index: 5;
  border: 1px solid rgba(216, 185, 111, .42);
  background:
    linear-gradient(135deg, rgba(255, 252, 238, .93), rgba(236, 248, 239, .86));
  box-shadow: 0 24px 70px rgba(20, 45, 36, .18), inset 0 0 0 1px rgba(255,255,255,.54);
  backdrop-filter: blur(20px);
}

.map-3d-guide-hero {
  top: 18px;
  left: 18px;
  width: 330px;
  max-width: calc(100vw - 36px);
  padding: 15px 18px 16px;
  border-radius: 10px;
  border-left: 5px solid rgba(205, 157, 48, .82);
}

.map-3d-guide-kicker,
.map-3d-guide-beta {
  color: #9a6a16;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .06em;
}

.map-3d-guide-hero h1 {
  margin: 7px 0 8px;
  color: #203f36;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 25px;
  line-height: 1.18;
  letter-spacing: 0;
}

.map-3d-guide-hero p {
  margin: 0;
  color: #5f6e65;
  font-size: 12px;
  line-height: 1.5;
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
  border-radius: 10px;
  min-height: 34px;
  padding: 0 12px;
  font-weight: 850;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.42);
}

.map-3d-guide-top-actions button:last-child {
  border-color: rgba(30, 91, 76, .22);
  color: #1d5b4c;
  background: rgba(234, 246, 239, .84);
}

.map-3d-guide-camera {
  top: 178px;
  left: 18px;
  width: 330px;
  max-width: calc(100vw - 36px);
  padding: 14px;
  border-radius: 10px;
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
  border-radius: 10px;
  border-right: 5px solid rgba(33, 91, 75, .58);
}

.map-3d-guide-decor-debug,
.map-3d-guide-garden-debug {
  position: absolute;
  z-index: 6;
  top: 320px;
  left: 18px;
  width: 340px;
  max-width: calc(100vw - 36px);
  max-height: calc(100vh - 360px);
  overflow: auto;
  padding: 13px;
  border: 1px solid rgba(28, 82, 72, .20);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(250, 252, 238, .95), rgba(226, 244, 237, .90));
  box-shadow: 0 24px 60px rgba(20, 45, 36, .18), inset 0 0 0 1px rgba(255,255,255,.55);
  backdrop-filter: blur(18px);
}

.map-3d-guide-garden-debug {
  border-color: rgba(83, 89, 67, .24);
  background:
    linear-gradient(135deg, rgba(250, 247, 232, .96), rgba(229, 238, 224, .92));
}

.map-3d-guide-decor-debug__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.map-3d-guide-decor-debug__header div,
.map-3d-guide-decor-debug label,
.map-3d-guide-garden-debug label {
  display: grid;
  gap: 5px;
}

.map-3d-guide-decor-debug strong,
.map-3d-guide-garden-debug strong {
  color: #24483c;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 15px;
}

.map-3d-guide-decor-debug span,
.map-3d-guide-decor-debug label,
.map-3d-guide-decor-debug p,
.map-3d-guide-decor-debug small,
.map-3d-guide-garden-debug span,
.map-3d-guide-garden-debug label,
.map-3d-guide-garden-debug p,
.map-3d-guide-garden-debug small {
  color: #68746c;
  font-size: 12px;
  line-height: 1.45;
}

.map-3d-guide-decor-debug select,
.map-3d-guide-decor-debug input,
.map-3d-guide-garden-debug select,
.map-3d-guide-garden-debug input {
  width: 100%;
  min-height: 30px;
  border: 1px solid rgba(50, 88, 75, .18);
  border-radius: 8px;
  background: rgba(255, 252, 238, .88);
  color: #24483c;
  padding: 0 8px;
}

.map-3d-guide-decor-debug__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.map-3d-guide-decor-debug button,
.map-3d-guide-garden-debug button {
  border: 1px solid rgba(143, 101, 28, .24);
  border-radius: 9px;
  background: rgba(255, 249, 229, .90);
  color: #6f4a12;
  min-height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.map-3d-guide-decor-debug__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.map-3d-guide-decor-debug p,
.map-3d-guide-garden-debug p {
  margin: 10px 0 4px;
}

.map-3d-guide-status h2 {
  margin: 4px 0 12px;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 21px;
  color: #21473b;
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
  padding: 8px 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .38);
  border: 1px solid rgba(213, 166, 45, .10);
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
  overflow-wrap: anywhere;
}

.map-3d-guide-style-audit,
.map-3d-guide-render-audit {
  display: grid;
  gap: 7px;
  margin-top: 12px;
  padding: 10px 11px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .48);
  border: 1px solid rgba(94, 112, 102, .12);
  color: #5c665f;
  font-size: 11px;
}

.map-3d-guide-style-audit strong,
.map-3d-guide-render-audit strong {
  color: #24483c;
  font-size: 12px;
}

.map-3d-guide-style-audit ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.map-3d-guide-style-audit li {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 7px;
  border-radius: 10px;
  background: rgba(246, 242, 224, .62);
}

.map-3d-guide-style-audit code {
  color: #6f4a12;
  font-size: 10px;
}

.map-3d-guide-style-audit em {
  color: #1f5a4d;
  font-style: normal;
  font-weight: 900;
}

.map-3d-guide-style-audit small,
.map-3d-guide-style-audit p,
.map-3d-guide-render-audit p {
  margin: 0;
  line-height: 1.45;
}

.map-3d-guide-deviation {
  display: grid;
  gap: 4px;
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(233, 244, 237, .75);
  color: #1e5749;
  font-size: 12px;
  border: 1px solid rgba(31, 90, 77, .12);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.42);
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
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(255, 247, 218, .54);
  border: 1px solid rgba(213, 166, 45, .16);
}

.map-3d-guide-model-state {
  margin: 7px 0 0;
  color: #7a6d5c;
  font-size: 12px;
}

.map-3d-guide-dev-diagnostics {
  margin-top: 12px;
  border-top: 1px solid rgba(94, 112, 102, .12);
}

.map-3d-guide-dev-diagnostics summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  color: #6d756e;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  list-style: none;
}

.map-3d-guide-dev-diagnostics summary::-webkit-details-marker {
  display: none;
}

.map-3d-guide-dev-diagnostics summary::after {
  content: "展开";
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 249, 229, .72);
  color: #8a6a28;
  font-size: 11px;
}

.map-3d-guide-dev-diagnostics[open] summary::after {
  content: "收起";
}

.map-3d-guide-pois {
  left: 18px;
  bottom: 118px;
  width: 430px;
  max-width: calc(100vw - 36px);
  padding: 12px;
  border-radius: 10px;
}

.map-3d-guide-pois strong {
  display: block;
  margin-bottom: 8px;
  color: #24483c;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
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
  border-radius: 9px;
}

.map-3d-guide-pois button span {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-right: 4px;
  border-radius: 6px;
  background: rgba(32, 79, 70, .14);
  color: #1d5b4c;
  font-size: 11px;
  font-weight: 900;
}

.map-3d-guide-pois button.is-active {
  color: #7b4f0f;
  background: linear-gradient(135deg, rgba(255, 238, 168, .98), rgba(255, 250, 226, .96));
  border-color: rgba(213, 166, 45, .72);
  box-shadow: 0 0 0 3px rgba(246, 203, 86, .18), 0 8px 22px rgba(154, 106, 22, .14);
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
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(255, 249, 228, .94), rgba(231, 247, 239, .92));
  border-color: rgba(213, 166, 45, .28);
  border-top: 3px solid rgba(214, 168, 50, .72);
}

.map-3d-guide-progress {
  grid-column: 1 / -1;
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(32, 79, 70, .12);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.72);
}

.map-3d-guide-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2b6c5c, #d6a832, #ffe38c);
  box-shadow: 0 0 16px rgba(228, 175, 47, .42);
}

.map-3d-guide-controlbar__meta {
  display: grid;
  gap: 8px;
  color: #6a756d;
  font-size: 12px;
}

.map-3d-guide-controlbar__meta strong {
  color: #24483c;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 15px;
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
  border-radius: 10px;
  background: rgba(255, 255, 255, .50);
  color: #24483c;
  font-size: 13px;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.60), 0 6px 18px rgba(39, 70, 58, .06);
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

.map-3d-guide-controlbar__actions button:nth-child(4) {
  border-color: rgba(182, 83, 24, .38);
  color: #8a3512;
  background: rgba(255, 239, 219, .92);
}

.map-3d-guide-controlbar__actions button:nth-child(5) {
  border-color: rgba(20, 148, 134, .34);
  color: #0f5f56;
  background: rgba(224, 249, 243, .92);
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

function Map3DGuidePage() {
  return <Map3DGuideExperience />
}

export default Map3DGuidePage
