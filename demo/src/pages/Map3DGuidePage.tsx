import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { Map3DPerfPanel } from '../components/map3d/Map3DPerfPanel'
import { PoiCoordinateCalibrationPanel } from '../components/map3d/PoiCoordinateCalibrationPanel'
import {
  ScenicPoiBillboards,
  type ScenicPoiBillboardItem,
  type ScenicPoiBillboardMode
} from '../components/map3d/ScenicPoiBillboards'
import { guideSpots, scenicCenter, type GuideRoute, type LatLngPoint } from '../data/guideData'
import {
  getLingshanPoisForLayer,
  lingshanPois,
  type LingshanPoi,
  type LingshanPoiLayerMode
} from '../data/lingshanMapData'
import {
  getScenicPoiCoordinate,
  hasMapEnabledScenicPoi
} from '../data/scenicPoiCatalog'
import {
  getMapModelOverlayByPoiId,
  getMapModelOverlayInspectorId,
  getVisibleMapModelOverlays,
  type LingshanMapModelOverlay
} from '../data/lingshanMapModelOverlays'
import { resolveLandmarkLodRuntimeChoice } from '../data/lingshanLandmarkLod'
import { LINGSHAN_INK_MAP_BOUNDS } from '../data/lingshanInkMapBounds'
import {
  getDefaultScenicRouteId,
  getScenicRouteConfig,
  getScenicRouteOptions,
  resolveScenicRouteId,
  type ScenicRouteConfig
} from '../data/lingshanScenicRoutes'
import { useLandmarkModelInspector } from '../hooks/useLandmarkModelInspector'
import { loadTMap } from '../lib/loadTMap'
import { goToPoiFromBrowse, goToPoiFromRoute } from '../lib/mapGuideNavigation'
import {
  GLBRuntimeOrchestrator,
  type GLBRuntimeOrchestratorSnapshot
} from '../lib/map/GLBRuntimeOrchestrator'
import { GLBMemoryManager } from '../lib/map/GLBMemoryManager'
import { GLBSpatialController } from '../lib/map/GLBSpatialController'
import { LayerManager } from '../lib/map/LayerManager'
import { PoiLayerController, type PoiLayerKind } from '../lib/map/PoiLayerController'
import { SceneArbiter } from '../lib/map/SceneArbiter'
import { SceneStateManager, type SceneStateRecord } from '../lib/map/SceneStateManager'
import { SceneWindowManager } from '../lib/map/SceneWindowManager'
import {
  BUDDHA_REALM_TOUR_CONFIG,
  flyMap3DCamera,
  MAP_3D_GUIDE_CAMERA_PRESETS,
  SCENIC_CAMERA_BOUNDS,
  startBuddhaRealmTour,
  startBuddhaRealmTimelineTour,
  stopBuddhaRealmTour,
  type Map3DRouteTourFrame,
  type Map3DRouteTourPause,
  type Map3DCameraPreset,
  type Map3DCameraPresetId,
  type Map3DTourMode,
  type Map3DTourPlaybackRef,
  type Map3DTourStep,
  type Map3DTourStopReason
} from '../lib/map3dCamera'
import { createMap3DPerfRecorder, type Map3DLandmarkGlBDebugRow, type Map3DStartupStage } from '../lib/map3dPerf'
import { preloadMap3DLandmarkAssets } from '../lib/map3dPreload'
import { buildWalkingRoute, type PlannedRoute } from '../lib/routePlanning'
import { findNearestRoutePoint, findNextStop, formatDistanceMeters, haversineDistanceMeters } from '../lib/routeProgress'
import { useIsMobileViewport } from '../hooks/useIsMobileViewport'
import { useMapGuideUiStore } from '../store/useMapGuideUiStore'
import type { MapGuideState, PoiReturnStage, ScenicMapPresentation } from '../types/mapGuide'

type Map3DGuideStatus = 'idle' | 'loading' | 'ready' | 'error'
type RerouteStatus = 'idle' | 'off_route' | 'planning' | 'ready' | 'failed'
type GuideCameraMode = Map3DCameraPresetId
type Map3DGuideVariant = 'default' | 'prototype-a' | 'prototype-b' | 'prototype-c'
export type MapPresentationTransition =
  | 'idle'
  | 'destroying'
  | 'waiting-container'
  | 'initializing'
  | 'ready'
  | 'failed'
type CameraTransitionPhase =
  | 'idle'
  | 'flattening-3d'
  | 'switching-view-mode'
  | 'refreshing-tile-layer'
  | 'ready'
  | 'failed'

export type MapPresentationTransitionSnapshot = {
  presentation: ScenicMapPresentation
  transition: MapPresentationTransition
  isPresentationSwitching: boolean
  presentationSwitchError?: string
}
export type { ScenicMapPresentation } from '../types/mapGuide'
type MapInteractionKind = 'zoom' | 'drag' | 'move'
type CameraState = {
  center: LatLngPoint
  zoom: number
  pitch: number
  rotation: number
}
type ActualTencentCameraState = {
  viewMode: '2D' | '3D' | null
  rawPitch: number | null
  rawRotation: number | null
  center: LatLngPoint | null
  zoom: number | null
}
type PresentationApplyResult = {
  ok: boolean
  requestedPresentation: ScenicMapPresentation
  requestedCamera: CameraState
  actualCamera: ActualTencentCameraState
  error?: string
}
type CustomTileLayerRuntime = {
  attached: boolean
  visible: boolean
  refreshCount: number
  lastRefreshReason: string
}
type TencentPoiModeRuntime = {
  requested: boolean
  applied: boolean
  lastError?: string
}
type PoiLayerVisibility = {
  showGenericCustomPoi: boolean
  showRouteStopMarkers: boolean
  showRouteStateMarkers: boolean
}
type RouteCameraIntentSource = 'route-overview' | 'route-current'
type RouteCameraIntentStatus = 'idle' | 'applying' | 'completed' | 'superseded' | 'failed'
type RouteCameraIntentPhase =
  | 'idle'
  | 'applying-full-camera'
  | 'verifying-camera'
  | 'correcting-zoom'
  | 'verifying-final'
  | 'completed'
  | 'failed'
type RouteCameraIntentSnapshot = {
  generation: number
  source: RouteCameraIntentSource | null
  routeId: string | null
  target: CameraState | null
  rawTargetZoom: number | null
  effectiveTargetZoom: number | null
  configuredMinZoom: number | null
  configuredMaxZoom: number | null
  actualZoom: number | null
  zoomCorrectionApplied: boolean
  zoomCorrectionMethod: 'zoomTo' | 'setZoom' | null
  zoomCorrectionGeneration: number | null
  lastZoomWriter: { source: RouteCameraIntentSource; generation: number; value: number } | null
  phase: RouteCameraIntentPhase
  status: RouteCameraIntentStatus
  lastCompletedGeneration: number
  lastFailure?: string
}

const MAP_3D_GUIDE_MIN_BASEMAP_READY_MS = 1050
const MAP_3D_GUIDE_FALLBACK_BASEMAP_READY_MS = 3200
const MAP_3D_GUIDE_SLOW_READY_MS = 4800
const MAP_3D_GUIDE_CURTAIN_FADE_MS = 520

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

type InkOverlayCameraMode = 'off' | 'topdown' | 'reduced' | 'disabled3d'

type InkOverlayCameraState = {
  mode: InkOverlayCameraMode
  effectiveOpacity: number
  pitch: number
  rotation: number
  reason?: string
}

type InkOverlaySource = 'ai' | 'base' | 'jimeng'
type InkTileSource = 'v3'
type InkTileVariant = 'v3'
type InkTileTransformConfig = {
  tileDir: string
  sourceTransform: string
  flipX: boolean
  flipY: boolean
  rotate: 0 | 90 | 180 | 270
}

type InkOverlayAdjustments = {
  offsetX: number
  offsetY: number
  scaleX: number
  scaleY: number
}

type DecorSmokeReport = {
  markerCount: number
  fallbackCount: number
  assetUrls: string[]
}

type AssetLoadState = Record<string, 'loaded' | 'error'>
type InkMapBoundCorner = 'northWest' | 'northEast' | 'southEast' | 'southWest'
type InkMapBoundsDraft = Record<InkMapBoundCorner, LatLngPoint | null>

type TourWaypoint = LatLngPoint & {
  progress: number
  pathIndex: number
  bearing?: number
  nearbyLandmarkId?: string
  nearbyLandmarkLabel?: string
  speedMode: 'cruise' | 'slow' | 'pause'
  holdMs?: number
}

type BuddhaRealmTimelineTourConfig = {
  path: LatLngPoint[]
  cumulative: number[]
  totalDistance: number
  pauses: Map3DRouteTourPause[]
  durationMs: number
}

type SplitRouteByProgressResult = {
  traveledPath: LatLngPoint[]
  remainingPath: LatLngPoint[]
  currentPoint: LatLngPoint
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

const defaultScenicRouteConfig = getScenicRouteConfig(getDefaultScenicRouteId())
const demoGuideRoute = defaultScenicRouteConfig.guideRoute
const demoRoutePath = defaultScenicRouteConfig.geometry?.length ? defaultScenicRouteConfig.geometry : getRouteStopLocations(demoGuideRoute)
const defaultModelOverlay = getMapModelOverlayByPoiId('giant_buddha')
const offRouteOffset = { lat: 0.00105, lng: 0.00125 }
const routeCenter = getPathCenter(demoRoutePath) ?? scenicCenter
const tencentMapStyleMethodCandidates = ['setMapStyleId', 'setStyle', 'setMapStyle', 'setBaseMap']
const MAP_3D_GUIDE_STYLE_ID = 'style1'
const MAP_3D_GUIDE_RENDER_OPTIONS = {
  enableBloom: true
} as const
const MAP_3D_GUIDE_BASE_MAP = {
  type: 'vector',
  // Tencent native POIs are a separate vector feature. `all` must include it;
  // labels alone do not ask the SDK to render the POI icon/feature layer.
  features: ['base', 'building3d', 'point', 'label']
} as const
const MAP_3D_GUIDE_CORE_BASE_MAP = {
  type: 'vector',
  features: ['base', 'building3d']
} as const
const MAP_3D_GUIDE_EXPORT_BASE_MAP = {
  type: 'vector',
  features: ['base', 'building3d']
} as const
const INK_EXPORT_CAMERA_PADDING_PX = 96
const LINGSHAN_INK_OVERLAY_IMAGE_URLS: Record<InkOverlaySource, string> = {
  ai: '/map/ink/lingshan-ink-map-gpt-v1.png',
  base: '/map/ink/lingshan-ink-base-tencent.png',
  jimeng: '/map/ink/lingshan-ink-map-jimeng-v1.png'
}
const LINGSHAN_INK_OVERLAY_DEFAULT_OPACITY = 0.68
const LINGSHAN_INK_OVERLAY_COMPARE_OPACITY = 0.45
const LINGSHAN_INK_OVERLAY_TOPDOWN_PITCH_MAX = 8
const LINGSHAN_INK_OVERLAY_REDUCED_PITCH_MAX = 32
const LINGSHAN_INK_OVERLAY_REDUCED_MAX_OPACITY = 0.28
const LINGSHAN_INK_OVERLAY_DEFAULT_ADJUSTMENTS: InkOverlayAdjustments = {
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
  scaleY: 1
}
const MAP_LAYER_Z_INDEX = {
  TENCENT_CUSTOM_LAYER: 100,
  LOCAL_TILE_FALLBACK: 100,
  LOCAL_GROUND_FALLBACK: 99,
  DEBUG_LAYER: 999
} as const
const ENABLE_INK_TILES_BY_DEFAULT = true
const ENABLE_TENCENT_CUSTOM_LAYER = true
const TENCENT_CUSTOM_LAYER_NAME = '我的自定义图层1'
const TENCENT_CUSTOM_LAYER_ID = '6a4b665a9818'
const TENCENT_CUSTOM_LAYER_CONFIG = {
  minZoom: 15,
  maxZoom: 20,
  visible: true,
  zIndex: MAP_LAYER_Z_INDEX.TENCENT_CUSTOM_LAYER,
  opacity: 1
} as const
const TENCENT_CUSTOM_LAYER_INITIAL_ZOOM = 16
const MAP_3D_GUIDE_INITIAL_ZOOM = ENABLE_TENCENT_CUSTOM_LAYER ? TENCENT_CUSTOM_LAYER_INITIAL_ZOOM : SCENIC_CAMERA_BOUNDS.defaultZoom
const INK_2D_INITIAL_ZOOM = 16.35
const INK_2D_MIN_ZOOM = 15.2
const INK_2D_MAX_ZOOM = 18.25
const INK_2D_CAMERA_PRESET: Map3DCameraPreset = {
  id: 'routeOverview',
  label: '2D 导览',
  description: '正俯视水墨导览底图',
  zoom: 16.9,
  pitch: 0,
  rotation: 0,
  durationMs: 520
}
const MAP_PRESENTATION_CLOUD_MIN_MS = 650

// 仅调试备用，默认不用。正式页面使用腾讯地图平台托管自定义图层，不再依赖本地切片或自建瓦片服务。
const ENABLE_LOCAL_INK_TILE_FALLBACK = false
const LINGSHAN_INK_TILE_SOURCE_CONFIGS: Record<
  InkTileSource,
  {
    imageUrl: string
    tileUrlTemplate: string
    blankUrl: string
    label: string
    sourceWidth: number
    sourceHeight: number
    sourceImageStandard: boolean
    sourceImageWarning?: string
  }
> = {
  v3: {
    imageUrl: '/map/ink/lingshan-ink-map-v3.png',
    tileUrlTemplate: '/map/ink/tiles/v3/{z}/{x}/{y}.png',
    blankUrl: '/map/ink/tiles/empty.png',
    label: 'AI 水墨 v3',
    sourceWidth: 1254,
    sourceHeight: 1254,
    sourceImageStandard: false,
    sourceImageWarning: 'non-4096 validation source'
  }
}
const LINGSHAN_INK_TILE_VARIANT_CONFIGS: Record<InkTileVariant, InkTileTransformConfig> = {
  v3: {
    tileDir: 'v3',
    sourceTransform: 'flipY',
    flipX: false,
    flipY: true,
    rotate: 0
  }
}
const LINGSHAN_INK_TILE_ZOOM_LEVELS = [15, 16, 17, 18, 19, 20] as const
const LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM = 20
const LINGSHAN_INK_TILE_DISPLAY_MAX_ZOOM = 22
const LINGSHAN_INK_TILE_DEFAULT_OPACITY = 1
const LINGSHAN_INK_TILE_BOUNDARY_PADDING_RATIO = 0.08
const LINGSHAN_INK_TILE_NATIVE_REQUEST_TIMEOUT_MS = 1200
const INK_MAP_CENTER_LIMIT_RATIO = 0.66
const INK_MAP_VISUAL_BUFFER_RATIO = 0.98
const INK_MAP_MIN_ZOOM = TENCENT_CUSTOM_LAYER_CONFIG.minZoom
const INK_MAP_MAX_ZOOM = 18.85
const INK_MAP_DEBUG_MIN_ZOOM = 15.2
const INK_MAP_DEBUG_MAX_ZOOM = 21.4
const inkMapBoundCornerOrder: InkMapBoundCorner[] = ['northWest', 'northEast', 'southEast', 'southWest']
const inkMapBoundCornerLabels: Record<InkMapBoundCorner, string> = {
  northWest: 'northwest',
  northEast: 'northeast',
  southEast: 'southeast',
  southWest: 'southwest'
}
const inkMapBoundCornerShortLabels: Record<InkMapBoundCorner, string> = {
  northWest: 'NW',
  northEast: 'NE',
  southEast: 'SE',
  southWest: 'SW'
}
const MAP_3D_GUIDE_LOCAL_TMAP_HOST = '127.0.0.1'
const MAP_3D_GUIDE_LOCAL_TMAP_CANONICAL_HOST = 'localhost'
const MAP_3D_GUIDE_DECOR_STORAGE_KEY = 'lingshan-map-3d-guide-ink-decor-v1'
const scenicPoiBillboardConfigs: Array<{
  id: string
  description: string
  tier: ScenicPoiBillboardItem['tier']
  visualLiftPx: number
}> = [
  { id: 'giant_buddha', description: '庄严佛境核心', tier: 'core', visualLiftPx: 90 },
  { id: 'fan_gong', description: '东方佛教艺术殿堂', tier: 'core', visualLiftPx: 80 },
  { id: 'wuyin_tancheng', description: '藏式坛城圣境', tier: 'core', visualLiftPx: 76 },
  { id: 'xiangfu_temple', description: '古刹禅修空间', tier: 'core', visualLiftPx: 72 },
  { id: 'jiulong_guanyu', description: '佛诞圣景再现', tier: 'core', visualLiftPx: 58 },
  { id: 'lingshan_wall', description: '入境礼序地标', tier: 'core', visualLiftPx: 58 },
  { id: 'foshou_square', description: '祈福打卡之地', tier: 'secondary', visualLiftPx: 50 },
  { id: 'foqian_square', description: '瞻礼大佛前庭', tier: 'secondary', visualLiftPx: 50 },
  { id: 'puti_avenue', description: '通往佛境主轴', tier: 'secondary', visualLiftPx: 46 },
  { id: 'shengjing_square', description: '入园开阔序厅', tier: 'secondary', visualLiftPx: 46 },
  { id: 'sansheng_hall', description: '礼佛静心殿宇', tier: 'secondary', visualLiftPx: 60 },
  { id: 'baizi_mile', description: '欢喜弥勒景观', tier: 'secondary', visualLiftPx: 52 },
  { id: 'manfeilong_tower', description: '异域佛塔景观', tier: 'secondary', visualLiftPx: 60 }
]
const ENABLE_LANDMARK_GLB = true
const LANDMARK_GLB_LOAD_MODE = 'nearby-and-tour-focus'
const MAX_ACTIVE_LANDMARK_GLB = 4
const MAX_OVERVIEW_ACTIVE_LANDMARK_GLB = 8
const LANDMARK_PRELOAD_RADIUS_M = 650
const LANDMARK_MOBILE_PRELOAD_RADIUS_M = 900
const LANDMARK_KEEP_ALIVE_RADIUS_M = 900
const LANDMARK_RELEASE_RADIUS_M = 1400
const LANDMARK_OVERVIEW_ZOOM_THRESHOLD = 17.35
const LANDMARK_OVERVIEW_PRELOAD_RADIUS_M = 2600
const LANDMARK_OVERVIEW_KEEP_ALIVE_RADIUS_M = 2800
const LANDMARK_OVERVIEW_RELEASE_RADIUS_M = 3600
const PROTECT_TOUR_FOCUS_LANDMARKS = true
const LANDMARK_FORCE_LOW_DETAIL_GLB = true
const MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS = 34
const MOBILE_BUDDHA_TOUR_ROUTE_FRAME_MS = 72
const BUDDHA_TOUR_EARLY_PRELOAD_PROGRESS = 0.06
const map3DGuideVisualVariants: Record<Map3DGuideVariant, Map3DGuideVisualVariantConfig> = {
  default: {
    id: 'default',
    className: 'map-3d-guide-shell--default',
    kicker: '灵山胜境导览',
    title: '真实 3D 游线',
    subtitle: '金色丝带路线 · 下一站引导',
    statusTitle: '导览玉牌',
    stationPanelTitle: '当前路线核心站点',
    controlTitle: '导览控制台',
    decorStorageKey: MAP_3D_GUIDE_DECOR_STORAGE_KEY,
    decorStrategy: '标准路线唤醒水墨层'
  },
  'prototype-a': {
    id: 'prototype-a',
    className: 'map-3d-guide-shell--prototype-a',
    kicker: '视觉原型 A · 少量高质素材',
    title: '青绿佛境精品导览',
    subtitle: '核心地标资产 · 路线优先',
    statusTitle: '游线导览牌',
    stationPanelTitle: '当前路线节点',
    controlTitle: '精品导览控制',
    decorStorageKey: `${MAP_3D_GUIDE_DECOR_STORAGE_KEY}-prototype-a`,
    decorStrategy: '少量 CC0 透明 PNG 与内联水墨符号反复组合，画面克制、路线清晰。'
  },
  'prototype-b': {
    id: 'prototype-b',
    className: 'map-3d-guide-shell--prototype-b',
    kicker: '视觉原型 B · 高密度数字沙盘',
    title: '路线唤醒灵山画卷',
    subtitle: '密集园林铺陈 · 节点爆点',
    statusTitle: '沉浸导览牌',
    stationPanelTitle: '当前路线节点',
    controlTitle: '沙盘导览控制',
    decorStorageKey: `${MAP_3D_GUIDE_DECOR_STORAGE_KEY}-prototype-b`,
    decorStrategy: '更多 CC0 园林素材沿线铺陈，当前段和关键节点密度更高。'
  },
  'prototype-c': {
    id: 'prototype-c',
    className: 'map-3d-guide-shell--prototype-c',
    kicker: '视觉原型 C · 沉稳 3D 地标资产',
    title: '低模园林路线沙盘',
    subtitle: 'GLB 地标资产 · 地图坐标锚定',
    statusTitle: '3D 园林导览牌',
    stationPanelTitle: '园林化路线节点',
    controlTitle: '3D 园林导览控制',
    decorStorageKey: `${MAP_3D_GUIDE_DECOR_STORAGE_KEY}-prototype-c`,
    decorStrategy: '禁用 PNG 贴片，改用航拍参考 vegetation zones 生成高密度 Kenney CC0 低模自然 GLB 林带。'
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

const guideCameraPresets: Map3DCameraPreset[] = [
  MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate,
  MAP_3D_GUIDE_CAMERA_PRESETS.axisCruise,
  MAP_3D_GUIDE_CAMERA_PRESETS.routeOverview,
  MAP_3D_GUIDE_CAMERA_PRESETS.landmarkFocus,
  MAP_3D_GUIDE_CAMERA_PRESETS.closeInspect
]

export type Map3DGuideMapRuntime = {
  map: any
  TMap: any
  mapInstanceId: number
}

export type Map3DGuideCameraScope = 'scenic' | 'navigation'

type Map3DGuideExperienceProps = {
  variant?: Map3DGuideVariant
  guideState?: MapGuideState
  presentation?: ScenicMapPresentation
  onPresentationTransitionChange?: (snapshot: MapPresentationTransitionSnapshot) => void
  /** Optional extension point for prototype-only map overlays. */
  onMapRuntimeChange?: (runtime: Map3DGuideMapRuntime | null) => void
  /** Temporary map presentation override; never mutates the user's POI preference. */
  navigationPoiOverrideActive?: boolean
  /** Lets the standalone real-navigation page leave the scenic camera bounds. */
  cameraScope?: Map3DGuideCameraScope
  /**
   * Restores the Tencent runtime only for standalone prototype shells that do
   * not participate in the C-app map lifecycle. Kept opt-in so the regular
   * C-app route remains untouched while its map runtime is being refactored.
   */
  bootstrapMapRuntime?: boolean
}

function resolveScenicMapPresentation(
  explicitPresentation: ScenicMapPresentation | undefined,
  isMobileViewport: boolean
): ScenicMapPresentation {
  if (explicitPresentation) {
    return explicitPresentation
  }

  if (typeof window !== 'undefined') {
    const queryValue = new URLSearchParams(window.location.search).get('presentation')
    if (queryValue === 'scenic3d' || queryValue === 'ink2d') {
      return queryValue
    }
  }

  return isMobileViewport ? 'ink2d' : 'scenic3d'
}

function getInk2DCameraPreset(preset: Map3DCameraPreset): Map3DCameraPreset {
  const zoom = clampNumber(
    preset.id === 'overviewEstate' || preset.id === 'axisCruise' || preset.id === 'routeOverview'
      ? INK_2D_INITIAL_ZOOM
      : Math.min(preset.zoom, 17.45),
    INK_2D_MIN_ZOOM,
    INK_2D_MAX_ZOOM
  )

  return {
    ...preset,
    label: preset.id === 'routeOverview' ? INK_2D_CAMERA_PRESET.label : preset.label,
    description: INK_2D_CAMERA_PRESET.description,
    zoom,
    pitch: 0,
    rotation: 0,
    durationMs: Math.min(preset.durationMs ?? INK_2D_CAMERA_PRESET.durationMs, INK_2D_CAMERA_PRESET.durationMs)
  }
}

function getMapBaseMapConfig(options: { clean: boolean; showNativePoiLabels: boolean }) {
  if (options.clean) {
    return MAP_3D_GUIDE_EXPORT_BASE_MAP
  }
  return options.showNativePoiLabels ? MAP_3D_GUIDE_BASE_MAP : MAP_3D_GUIDE_CORE_BASE_MAP
}

function applyTencentBaseMapPoiMode(
  map: any,
  options: { clean: boolean; showNativePoiLabels: boolean }
): { applied: boolean; lastError?: string } {
  if (!map || typeof map.setBaseMap !== 'function') {
    return { applied: false, lastError: 'Tencent map setBaseMap is unavailable' }
  }

  try {
    map.setBaseMap(getMapBaseMapConfig(options))
    return { applied: true }
  } catch (error) {
    console.warn('[Map3D] Tencent base-map POI label switch unavailable', error)
    return {
      applied: false,
      lastError: error instanceof Error ? error.message : 'Tencent map setBaseMap failed'
    }
  }
}

const TENCENT_NATIVE_CONTROL_SELECTOR = [
  '.tmap-control',
  '.tmap-control-container',
  '.tmap-zoom-control',
  '.tmap-rotate-control',
  '.tmap-compass',
  '.tmap-scale-control',
  '.TMap-control',
  '.TMap-zoom',
  '.TMap-compass',
  '[class*="tmap" i][class*="zoom" i]',
  '[class*="tmap" i][class*="compass" i]',
  '[class*="tmap" i][class*="rotate" i]'
].join(', ')

function countVisibleTencentNativeMapControls(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(TENCENT_NATIVE_CONTROL_SELECTOR)).filter((element) => {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
  }).length
}

function resolvePoiLayerVisibility(input: {
  isRouteGuideView: boolean
}): PoiLayerVisibility {
  return {
    // Core/all selects the custom POI dataset; it must not double as a
    // visibility switch. Tencent native labels may coexist in all mode.
    showGenericCustomPoi: true,
    showRouteStopMarkers: input.isRouteGuideView,
    showRouteStateMarkers: input.isRouteGuideView
  }
}

type MapRuntimeErrorBoundaryProps = {
  children: ReactNode
  onError: (error: Error, info: ErrorInfo) => void
}

type MapRuntimeErrorBoundaryState = { error?: Error }

/** Limits an unexpected Tencent runtime render error to the map canvas area.
 * Page cards, the assistant and the presentation transition are outside it. */
class MapRuntimeErrorBoundary extends Component<MapRuntimeErrorBoundaryProps, MapRuntimeErrorBoundaryState> {
  state: MapRuntimeErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): MapRuntimeErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError(error, info)
  }

  render() {
    if (this.state.error) {
      return <div className="map-3d-guide-map-runtime-fallback" role="status">地图正在恢复，请稍候…</div>
    }
    return this.props.children
  }
}

export function Map3DGuideExperience({
  variant = 'default',
  guideState,
  presentation,
  onPresentationTransitionChange,
  onMapRuntimeChange,
  navigationPoiOverrideActive = false,
  cameraScope = 'scenic',
  bootstrapMapRuntime = true
}: Map3DGuideExperienceProps) {
  const navigate = useNavigate()
  const isMobileViewport = useIsMobileViewport()
  const effectiveGuideState = guideState ?? ({ viewMode: 'browse', xiaolingMode: 'browse' } satisfies MapGuideState)
  const poiVisibilityMode = useMapGuideUiStore((state) => state.poiVisibilityMode)
  const effectivePoiMode: LingshanPoiLayerMode = navigationPoiOverrideActive ? 'all' : poiVisibilityMode
  const serviceFacilitiesEnabled = useMapGuideUiStore((state) => state.serviceFacilitiesEnabled)
  const routeCardExpanded = useMapGuideUiStore((state) => state.routeCardExpanded)
  const mapFocusMode = useMapGuideUiStore((state) => state.mapFocusMode)
  const setSelectedPoiId = useMapGuideUiStore((state) => state.setSelectedPoiId)
  const visualVariant = map3DGuideVisualVariants[variant] ?? map3DGuideVisualVariants.default
  const requestedScenicMapPresentation = useMemo(
    () => resolveScenicMapPresentation(presentation, isMobileViewport),
    [isMobileViewport, presentation]
  )
  const [presentationFallback, setPresentationFallback] = useState<ScenicMapPresentation | null>(null)
  const scenicMapPresentation = presentationFallback ?? requestedScenicMapPresentation
  const isInk2DPresentation = scenicMapPresentation === 'ink2d'
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const onMapRuntimeChangeRef = useRef(onMapRuntimeChange)
  const presentationViewportRef = useRef<{ center: LatLngPoint; zoom: number } | null>(null)
  const camera2DStateRef = useRef<CameraState>({
    center: scenicCenter,
    zoom: INK_2D_INITIAL_ZOOM,
    pitch: 0,
    rotation: 0
  })
  const camera3DStateRef = useRef<CameraState>({
    center: scenicCenter,
    zoom: MAP_3D_GUIDE_INITIAL_ZOOM,
    pitch: MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.pitch,
    rotation: MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.rotation
  })
  const lastMeaningful3DCameraRef = useRef<CameraState | null>(null)
  const suppress3DCameraPersistenceRef = useRef(false)
  const cameraTransitionPhaseRef = useRef<CameraTransitionPhase>('idle')
  const cameraPersistenceDiagnosticsRef = useRef({
    lastPersistReason: '',
    lastRejectedPersistReason: ''
  })
  const presentationGenerationRef = useRef(0)
  const presentationSwitchGenerationRef = useRef(0)
  const mapAttemptGenerationRef = useRef(0)
  const mapInstanceGenerationCounterRef = useRef(0)
  const activeMapInstanceGenerationRef = useRef(0)
  const mapCreateCountRef = useRef(0)
  const mapDestroyCountRef = useRef(0)
  const contextLostCountRef = useRef(0)
  const hardRecoveryCountRef = useRef(0)
  const hardRecoveryRequestRef = useRef<(reason: string, error?: unknown) => void>(() => undefined)
  const [mapRuntimeGeneration, setMapRuntimeGeneration] = useState(0)
  const [mapContainerGeneration, setMapContainerGeneration] = useState(0)
  const [mapInstanceId, setMapInstanceId] = useState(0)
  const [lastMapError, setLastMapError] = useState('')
  const [genericCustomPoiVisibleCount, setGenericCustomPoiVisibleCount] = useState(0)
  const [routeStopMarkerCount, setRouteStopMarkerCount] = useState(0)
  const [routeStateMarkerCount, setRouteStateMarkerCount] = useState(0)
  const [nativeMapControlVisibleCount, setNativeMapControlVisibleCount] = useState(0)
  const [tencentPoiMode, setTencentPoiMode] = useState<TencentPoiModeRuntime>({
    requested: false,
    applied: false
  })

  useEffect(() => {
    onMapRuntimeChangeRef.current = onMapRuntimeChange
  }, [onMapRuntimeChange])
  const mapInstanceGenerationsRef = useRef<WeakMap<object, number>>(new WeakMap())
  const destroyedMapInstancesRef = useRef<WeakSet<object>>(new WeakSet())
  const activePresentationRef = useRef<ScenicMapPresentation>(scenicMapPresentation)
  const appliedPresentationRef = useRef<ScenicMapPresentation | null>(null)
  const initializedPresentationRef = useRef<ScenicMapPresentation | null>(null)
  const presentationCloudStartedAtRef = useRef(0)
  const presentationCloudHideTimerRef = useRef<number | null>(null)
  const isMapInstanceUsable = useCallback((candidate: any) => {
    return Boolean(
      candidate &&
      (typeof candidate === 'object' || typeof candidate === 'function') &&
      !destroyedMapInstancesRef.current.has(candidate)
    )
  }, [])
  const isMapInstanceCurrent = useCallback((candidate: any) => {
    if (!isMapInstanceUsable(candidate) || mapRef.current !== candidate) {
      return false
    }

    const instanceGeneration = mapInstanceGenerationsRef.current.get(candidate)
    return Boolean(instanceGeneration && instanceGeneration === activeMapInstanceGenerationRef.current)
  }, [isMapInstanceUsable])
  const routeLayerRef = useRef<any>(null)
  const tourRouteProgressLayerRef = useRef<any>(null)
  const poiMarkerLayerRef = useRef<any>(null)
  const userMarkerLayerRef = useRef<any>(null)
  const rerouteLayerRef = useRef<any>(null)
  const landmarkHighlightLayerRef = useRef<any>(null)
  const decorMarkerLayerRef = useRef<any>(null)
  const inkOverlayLayerRef = useRef<HTMLDivElement | null>(null)
  const inkTileLayerRef = useRef<any>(null)
  const tencentCustomLayerInitKeyRef = useRef('')
  const customTileLayerRuntimeRef = useRef<CustomTileLayerRuntime>({
    attached: false,
    visible: false,
    refreshCount: 0,
    lastRefreshReason: ''
  })
  const [customTileLayerRuntime, setCustomTileLayerRuntime] = useState<CustomTileLayerRuntime>(
    customTileLayerRuntimeRef.current
  )
  const inkTileGroundFallbackLayerRef = useRef<any>(null)
  const inkTileDomFallbackLayerRef = useRef<HTMLDivElement | null>(null)
  const formalInkBoundsMarkerLayerRef = useRef<any>(null)
  const formalInkBoundsBoundaryLayerRef = useRef<any>(null)
  const formalInkBoundsFillLayerRef = useRef<any>(null)
  const inkBoundsMarkerLayerRef = useRef<any>(null)
  const inkBoundsBoundaryLayerRef = useRef<any>(null)
  const gltfModelRefs = useRef<Map<string, any>>(new Map())
  const landmarkLastEvictedAtRef = useRef<Map<string, number>>(new Map())
  const landmarkLastLoadAttemptAtRef = useRef<Map<string, number>>(new Map())
  const landmarkLastLoadAllowReasonRef = useRef<Map<string, string>>(new Map())
  const landmarkLastLoadDenyReasonRef = useRef<Map<string, string>>(new Map())
  const cameraSequenceRef = useRef(0)
  const routeCameraIntentGenerationRef = useRef(0)
  const routeCameraProgrammaticMoveRef = useRef(false)
  const routeCameraIntentRef = useRef<RouteCameraIntentSnapshot>({
    generation: 0,
    source: null,
    routeId: null,
    target: null,
    rawTargetZoom: null,
    effectiveTargetZoom: null,
    configuredMinZoom: null,
    configuredMaxZoom: null,
    actualZoom: null,
    zoomCorrectionApplied: false,
    zoomCorrectionMethod: null,
    zoomCorrectionGeneration: null,
    lastZoomWriter: null,
    phase: 'idle',
    status: 'idle',
    lastCompletedGeneration: 0
  })
  const tourPlaybackRef = useRef<Map3DTourPlaybackRef['current']>(null)
  const buddhaTourUiFrameRef = useRef(0)
  const buddhaTourProgressBucketRef = useRef(-1)
  const buddhaTourFrameStatsRef = useRef({ lastAt: 0, averageFrameMs: 0 })
  const buddhaTourRouteProgressRef = useRef({
    isActive: false,
    lastRenderedAt: 0,
    lastEventBucket: 0,
    latestProgress: 0
  })
  const mapVisualReadyRef = useRef(false)
  const mapFirstIdleRef = useRef(false)
  const mapOverlaysStartedRef = useRef(false)
  const mapRoutePoiShownRef = useRef(false)
  const mapLoadingCurtainShownAtRef = useRef<number | null>(null)
  const mapInteractionRef = useRef<{
    isInteracting: boolean
    kind?: MapInteractionKind
    exitTimerId?: number
    lastInteractionAt: number
  }>({
    isInteracting: false,
    lastInteractionAt: 0
  })
  const currentZoomRef = useRef(isInk2DPresentation ? INK_2D_INITIAL_ZOOM : MAP_3D_GUIDE_INITIAL_ZOOM)
  const inkOverlayPerfSignatureRef = useRef('')
  const inkTilePerfSignatureRef = useRef('')
  const inkTileNativeRequestCountRef = useRef(0)
  const inkTileFallbackTimerRef = useRef<number | null>(null)
  const inkOverlayImageReadyRef = useRef(false)
  const inkOverlayLayerErrorRef = useRef('')
  const inkOverlayCameraStateRef = useRef<InkOverlayCameraState>({
    mode: 'off',
    effectiveOpacity: 0,
    pitch: 0,
    rotation: 0
  })
  const entryCameraPlayedRef = useRef(false)
  const debugDecor = useMemo(() => isQueryEnabled('debugDecor'), [])
  const debugPerf = useMemo(() => visualVariant.id === 'prototype-c' && isQueryEnabled('debugPerf'), [visualVariant.id])
  const debugPoiCalibration = useMemo(() => isQueryEnabled('debugPoiCalibration'), [])
  const debugInkBounds = false
  const exportInkBase = false
  const isInkCleanMode = debugInkBounds || exportInkBase
  const noMapBoundsDebugOverride = useMemo(() => debugPerf && isQueryEnabled('noMapBounds'), [debugPerf])
  const mapBoundsDisabledReason = cameraScope === 'navigation'
    ? 'navigationScope'
    : noMapBoundsDebugOverride
      ? 'debugPerfNoMapBounds'
      : 'none'
  const mapBoundsEnabled = (ENABLE_TENCENT_CUSTOM_LAYER || visualVariant.id === 'prototype-c') && !isInkCleanMode && mapBoundsDisabledReason === 'none'
  const mapMinZoom = isInk2DPresentation ? INK_2D_MIN_ZOOM : getEffectiveInkMapMinZoom(mapBoundsEnabled)
  const mapMaxZoom = isInk2DPresentation ? INK_2D_MAX_ZOOM : getEffectiveInkMapMaxZoom(mapBoundsEnabled)
  const showRoadCheck = false
  const cleanShot = false
  const shotGuide = false
  const captureFrame = false
  const inkUseSquareExportCamera = exportInkBase && (shotGuide || captureFrame || cleanShot)
  const inkOverlayEnabled = false
  const inkOverlayCompare = useMemo(() => inkOverlayEnabled && isQueryEnabled('inkCompare'), [inkOverlayEnabled])
  const inkOverlaySource = useMemo(() => getInkOverlaySourceFromQuery(), [])
  const inkOverlayImageUrl = LINGSHAN_INK_OVERLAY_IMAGE_URLS[inkOverlaySource]
  const inkOverlayOpacity = useMemo(() => getInkOverlayOpacityFromQuery(inkOverlayCompare), [inkOverlayCompare])
  const inkOverlayAdjustments = useMemo(() => getInkOverlayAdjustmentsFromQuery(), [])
  const inkTileSource = useMemo(() => getInkTileSourceFromQuery(), [])
  const inkTileVariant = useMemo(() => getInkTileVariantFromQuery(), [])
  const inkTileSourceConfig = getLingshanInkTileSourceConfig(inkTileSource, inkTileVariant)
  const noInkTilesOverride = useMemo(() => isQueryEnabled('noInkTiles'), [])
  const inkTilesEnabled = useMemo(
    () => ENABLE_INK_TILES_BY_DEFAULT && !noInkTilesOverride && (ENABLE_TENCENT_CUSTOM_LAYER || visualVariant.id === 'prototype-c'),
    [noInkTilesOverride, visualVariant.id]
  )
  const inkTileOpacity = useMemo(() => getInkTileOpacityFromQuery(), [])
  const [inkTileOpacityEffective, setInkTileOpacityEffective] = useState(() => getInkTileEffectiveOpacity(inkTileOpacity, currentZoomRef.current))
  const showInkBounds = false
  const shouldRedirectLocalTMapHost = useMemo(() => shouldUseCanonicalLocalhostForTMap(), [])
  const perfRecorder = useMemo(() => createMap3DPerfRecorder(debugPerf), [debugPerf])
  const layerManager = useMemo(() => new LayerManager(), [])
  const updateCustomTileLayerRuntime = useCallback((next: Partial<CustomTileLayerRuntime>) => {
    const snapshot = { ...customTileLayerRuntimeRef.current, ...next }
    customTileLayerRuntimeRef.current = snapshot
    setCustomTileLayerRuntime(snapshot)
  }, [])
  const refreshHostedCustomTileLayer = useCallback(
    async (targetMap: any, reason: string, isCurrent: () => boolean) => {
      const layer = inkTileLayerRef.current
      if (!layer || !isCurrent() || layerManager.getLayer('custom_tile') !== layer) {
        updateCustomTileLayerRuntime({ attached: false, visible: false, lastRefreshReason: `${reason}:layer-unavailable` })
        return false
      }

      try {
        if (typeof layer.setVisible === 'function') {
          layer.setVisible(false)
          await waitForMapAnimationFrames(isCurrent)
          if (!isCurrent()) {
            return false
          }
          layer.setVisible(true)
          updateCustomTileLayerRuntime({
            attached: true,
            visible: true,
            refreshCount: customTileLayerRuntimeRef.current.refreshCount + 1,
            lastRefreshReason: `${reason}:visibility-toggle`
          })
          return true
        }

        if (typeof layer.setMap === 'function') {
          layer.setMap(null)
          await waitForMapAnimationFrames(isCurrent)
          if (!isCurrent()) {
            return false
          }
          layer.setMap(targetMap)
          updateCustomTileLayerRuntime({
            attached: true,
            visible: true,
            refreshCount: customTileLayerRuntimeRef.current.refreshCount + 1,
            lastRefreshReason: `${reason}:map-reattach`
          })
          return true
        }
      } catch (error) {
        if (debugPerf) {
          console.warn('[Map3D] Tencent custom tile refresh failed', error)
        }
      }

      updateCustomTileLayerRuntime({ attached: true, visible: true, lastRefreshReason: `${reason}:unsupported` })
      return false
    },
    [debugPerf, layerManager, updateCustomTileLayerRuntime]
  )
  const poiLayerController = useMemo(
    () => new PoiLayerController(layerManager, isMapInstanceCurrent),
    [isMapInstanceCurrent, layerManager]
  )
  const glbRuntimeOrchestrator = useMemo(() => new GLBRuntimeOrchestrator(), [])
  const glbSpatialController = useMemo(() => new GLBSpatialController(), [])
  const glbMemoryManager = useMemo(() => new GLBMemoryManager(), [])
  const sceneArbiter = useMemo(() => new SceneArbiter(), [])
  const sceneArbiterRef = useRef(sceneArbiter)
  const sceneStateManagerRef = useRef<SceneStateManager | null>(null)
  const sceneWindowManager = useMemo(
    () =>
      new SceneWindowManager({
        setVisible: (modelId, visible) => {
          const decision = sceneArbiterRef.current.requestAction({
            type: visible ? 'show' : 'hide',
            modelId,
            context: {
              source: 'window',
              inWindow: visible,
              reason: 'scene-window-visibility'
            }
          })

          if (decision.allowed) {
            glbSpatialController.setVisible(modelId, visible)
          }
        },
        markUsed: (modelId) => glbMemoryManager.markUsed(modelId),
        release: (modelId) => {
          const decision = sceneArbiterRef.current.requestAction({
            type: 'dispose',
            modelId,
            context: {
              source: 'window',
              inWindow: false,
              reason: 'scene-window-release'
            }
          })

          if (!decision.allowed) {
            return
          }

          if (sceneStateManagerRef.current?.release(modelId)) {
            return
          }

          glbSpatialController.unregister(modelId)
          glbMemoryManager.unregister(modelId)
        }
      }),
    [glbMemoryManager, glbSpatialController]
  )
  const [glbRuntimeSnapshot, setGlbRuntimeSnapshot] = useState<GLBRuntimeOrchestratorSnapshot>(() =>
    glbRuntimeOrchestrator.getSnapshot()
  )
  useEffect(() => {
    sceneArbiterRef.current = sceneArbiter
  }, [sceneArbiter])
  const routeOptions = useMemo(() => getScenicRouteOptions(), [])
  const [currentRouteId, setCurrentRouteId] = useState(() => resolveScenicRouteId(effectiveGuideState.routeId ?? getInitialScenicRouteIdFromQuery()))
  const [routeSwitchCount, setRouteSwitchCount] = useState(0)
  const currentRouteConfig = useMemo(() => getScenicRouteConfig(currentRouteId), [currentRouteId])
  const currentGuideRoute = currentRouteConfig.guideRoute
  const currentRouteGeometry = currentRouteConfig.routeGeometry
  const currentRoutePath = useMemo(
    () =>
      currentRouteConfig.geometry?.length
        ? currentRouteConfig.geometry
        : getRouteStopLocations(currentGuideRoute),
    [currentGuideRoute, currentRouteConfig.geometry]
  )
  const currentRouteCenter = useMemo(() => getPathCenter(currentRoutePath) ?? scenicCenter, [currentRoutePath])
  const currentRouteCumulativeDistances = useMemo(() => buildPathCumulativeDistances(currentRoutePath), [currentRoutePath])
  const currentRouteHasSequenceOverlaps = useMemo(() => detectRouteSequenceOverlaps(currentRoutePath), [currentRoutePath])
  const currentProgressStep = Math.max(8, Math.round(currentRoutePath.length / 28))
  const currentInitialPosition = getRouteInitialPosition(currentRouteConfig, currentRoutePath)
  const currentAxisCruiseTarget =
    getPathCenter([
      currentRouteConfig.stops[0]?.location ?? currentInitialPosition,
      getRouteStopLocation('shengjing_square') ?? currentRouteCenter,
      getRouteStopLocation('foqian_square') ?? currentRouteCenter,
      getRouteStopLocation('giant_buddha') ?? currentRouteCenter
    ]) ?? currentRouteCenter
  const landmarkModelOverlays = useMemo(
    () => orderMapModelOverlaysForLoading(getVisibleMapModelOverlays()),
    []
  )
  const [mapStatus, setMapStatus] = useState<Map3DGuideStatus>('idle')
  const [presentationTransition, setPresentationTransition] = useState<MapPresentationTransition>('idle')
  const [cameraTransitionPhase, setCameraTransitionPhase] = useState<CameraTransitionPhase>('idle')
  const updateCameraTransitionPhase = useCallback((phase: CameraTransitionPhase) => {
    cameraTransitionPhaseRef.current = phase
    setCameraTransitionPhase(phase)
  }, [])
  const [presentationSwitchError, setPresentationSwitchError] = useState<string | undefined>()
  const [routeCameraIntentSnapshot, setRouteCameraIntentSnapshot] = useState<RouteCameraIntentSnapshot>(
    routeCameraIntentRef.current
  )
  const updateRouteCameraIntentSnapshot = useCallback((next: RouteCameraIntentSnapshot) => {
    routeCameraIntentRef.current = next
    setRouteCameraIntentSnapshot(next)
  }, [])
  const [presentationCloudPhase, setPresentationCloudPhase] = useState<'hidden' | 'covering' | 'opening'>('hidden')
  const [isMapCreated, setIsMapCreated] = useState(false)
  const [isMapIdle, setIsMapIdle] = useState(false)
  const [isMapVisualReady, setIsMapVisualReady] = useState(false)
  const [mapReadyTimedOut, setMapReadyTimedOut] = useState(false)
  const [loadingCurtainVisible, setLoadingCurtainVisible] = useState(true)
  const [startupStage, setStartupStage] = useState<Map3DStartupStage>('loadingSdk')
  const [mapInteractionSnapshot, setMapInteractionSnapshot] = useState<{
    isInteracting: boolean
    kind?: MapInteractionKind
    currentZoom: number
  }>({
    isInteracting: false,
    currentZoom: isInk2DPresentation ? INK_2D_INITIAL_ZOOM : MAP_3D_GUIDE_INITIAL_ZOOM
  })
  const [mapBoundsSnapshot, setMapBoundsSnapshot] = useState<{
    center: LatLngPoint
    zoom: number
  }>({
    center: routeCenter,
    zoom: isInk2DPresentation ? INK_2D_INITIAL_ZOOM : MAP_3D_GUIDE_INITIAL_ZOOM
  })
  const [pageMessage, setPageMessage] = useState('正在准备真实 3D 地图导览模式...')
  const [simulatedPosition, setSimulatedPosition] = useState<LatLngPoint>(currentInitialPosition)
  const [routePathIndex, setRoutePathIndex] = useState(0)
  const [selectedStopIndex, setSelectedStopIndex] = useState(0)
  const [rerouteStatus, setRerouteStatus] = useState<RerouteStatus>('idle')
  const [rerouteMessage, setRerouteMessage] = useState('尚未触发偏航重规划')
  const [reroutePlan, setReroutePlan] = useState<PlannedRoute | null>(null)
  const [showModelBeta, setShowModelBeta] = useState(false)
  const [modelStatus, setModelStatus] = useState('未开启')
  const [mobilePanelsCollapsed, setMobilePanelsCollapsed] = useState(() => isMobileViewport)
  const [activeCameraMode, setActiveCameraMode] = useState<GuideCameraMode>('overviewEstate')
  const [tourMode, setTourMode] = useState<Map3DTourMode | 'idle'>('idle')
  const [activeTourStepId, setActiveTourStepId] = useState<string | undefined>()
  const [tourPreloadStopIds, setTourPreloadStopIds] = useState<string[]>([])
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | undefined>()
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
  const [inkBoundsDraft, setInkBoundsDraft] = useState<InkMapBoundsDraft>(() => createEmptyInkMapBoundsDraft())
  const [inkBoundsCopyStatus, setInkBoundsCopyStatus] = useState('尚未复制')
  const [inkExportUiHidden, setInkExportUiHidden] = useState(false)
  const [inkOverlayLayerReady, setInkOverlayLayerReady] = useState(false)
  const [inkOverlayLayerError, setInkOverlayLayerError] = useState('')
  const [inkOverlayCameraSnapshot, setInkOverlayCameraSnapshot] = useState<InkOverlayCameraState>(() => inkOverlayCameraStateRef.current)
  const [inkTileDomFallbackActive, setInkTileDomFallbackActive] = useState(false)
  const [inkTileGroundFallbackActive, setInkTileGroundFallbackActive] = useState(false)

  useEffect(() => {
    setPresentationFallback(null)
  }, [requestedScenicMapPresentation])

  const isPresentationSwitching =
    presentationTransition === 'destroying' ||
    presentationTransition === 'waiting-container' ||
    presentationTransition === 'initializing'

  useLayoutEffect(() => {
    if (presentationCloudHideTimerRef.current !== null) {
      window.clearTimeout(presentationCloudHideTimerRef.current)
      presentationCloudHideTimerRef.current = null
    }

    if (isPresentationSwitching && initializedPresentationRef.current !== null) {
      if (presentationCloudPhase === 'hidden') {
        presentationCloudStartedAtRef.current = performance.now()
      }
      setPresentationCloudPhase('covering')
      return
    }

    if (presentationCloudPhase === 'covering' && (presentationTransition === 'ready' || presentationTransition === 'failed')) {
      const elapsed = performance.now() - presentationCloudStartedAtRef.current
      const waitMs = Math.max(0, MAP_PRESENTATION_CLOUD_MIN_MS - elapsed)
      presentationCloudHideTimerRef.current = window.setTimeout(() => {
        setPresentationCloudPhase('opening')
        presentationCloudHideTimerRef.current = window.setTimeout(() => {
          setPresentationCloudPhase('hidden')
          presentationCloudHideTimerRef.current = null
        }, 360)
      }, waitMs)
    }
  }, [isPresentationSwitching, presentationCloudPhase, presentationTransition])

  useEffect(() => {
    return () => {
      if (presentationCloudHideTimerRef.current !== null) {
        window.clearTimeout(presentationCloudHideTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    activePresentationRef.current = scenicMapPresentation
    if (debugPerf) {
      console.debug('[map-presentation]', {
        presentation: scenicMapPresentation,
        transition: presentationTransition,
        switching: isPresentationSwitching,
        error: presentationSwitchError
      })
    }
    onPresentationTransitionChange?.({
      presentation: scenicMapPresentation,
      transition: presentationTransition,
      isPresentationSwitching,
      presentationSwitchError
    })
  }, [debugPerf, isPresentationSwitching, onPresentationTransitionChange, presentationSwitchError, presentationTransition, scenicMapPresentation])

  useEffect(() => {
    const handleRuntimeError = (event: ErrorEvent) => {
      if (!isStaleTencentLayerError(event.error ?? event.message)) {
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation?.()
      if (debugPerf) {
        console.warn('[Map3D] ignored stale Tencent layer callback after map destroy', event.error ?? event.message)
      }
    }
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isStaleTencentLayerError(event.reason)) {
        return
      }
      event.preventDefault()
      if (debugPerf) {
        console.warn('[Map3D] ignored stale Tencent layer promise after map destroy', event.reason)
      }
    }

    window.addEventListener('error', handleRuntimeError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('error', handleRuntimeError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [debugPerf])

  useEffect(() => {
    hardRecoveryRequestRef.current = (reason, error) => {
      if (hardRecoveryCountRef.current >= 1) {
        setLastMapError(`地图硬恢复已执行过一次，忽略重复请求：${reason}`)
        return
      }

      const map = mapRef.current
      const center = map ? readMapCenterForProjection(map) : null
      const zoom = map ? readMapZoomForProjection(map) : null
      if (center && zoom !== null) {
        presentationViewportRef.current = { center, zoom }
      }

      hardRecoveryCountRef.current += 1
      contextLostCountRef.current += 1
      setLastMapError(error instanceof Error ? error.message : `地图硬恢复：${reason}`)
      setPresentationSwitchError(undefined)
      setPresentationTransition('destroying')
      setPresentationCloudPhase('covering')
      setMapStatus('loading')
      // The map-init effect owns the actual teardown. A new DOM container is
      // intentionally created only for this context-loss path.
      setMapContainerGeneration((value) => value + 1)
      setMapRuntimeGeneration((value) => value + 1)
    }

    return () => {
      hardRecoveryRequestRef.current = () => undefined
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const createDebugSnapshot = () => {
      const targetMap = mapRef.current
      const navigationMapDebug = (window as any).__LINGSHAN_NAVIGATION_MAP_DEBUG__ ?? {}
      const requestedCamera = scenicMapPresentation === 'ink2d' ? camera2DStateRef.current : camera3DStateRef.current
      const actualCamera = targetMap && isMapInstanceCurrent(targetMap)
        ? readActualTencentCameraState(targetMap)
        : emptyActualTencentCameraState()
      const effectiveCamera = cameraStateFromActual(actualCamera, requestedCamera, scenicMapPresentation)
      return {
        mapInstanceId,
        mapCreateCount: mapCreateCountRef.current,
        mapDestroyCount: mapDestroyCountRef.current,
        currentViewMode: actualCamera.viewMode,
        currentPresentation: scenicMapPresentation,
        presentation: {
          requested: requestedScenicMapPresentation,
          applied: appliedPresentationRef.current,
          initialized: initializedPresentationRef.current,
          transitionState: presentationTransition
        },
        cameraTransitionPhase,
        contextLostCount: contextLostCountRef.current,
        hardRecoveryCount: hardRecoveryCountRef.current,
        currentPoiLayerMode: effectivePoiMode,
        poiLayers: {
          mode: effectivePoiMode,
          genericCustomPoiVisibleCount,
          routeStopMarkerCount,
          routeStateMarkerCount,
          tencentNativePoiRequested: tencentPoiMode.requested,
          tencentNativePoiApplied: tencentPoiMode.applied
        },
        tencentPoiFeatureEnabled: effectivePoiMode === 'all',
        navigationPoiOverride: {
          active: navigationPoiOverrideActive,
          userSelectedPoiMode: poiVisibilityMode,
          effectivePoiMode
        },
        navigationMap: {
          selectedHeading: navigationMapDebug.selectedHeading,
          headingSource: navigationMapDebug.headingSource ?? 'unavailable',
          renderedHeading: navigationMapDebug.renderedHeading,
          navigationOverrideActive: navigationPoiOverrideActive,
          effectivePoiMode,
          localTestSelectionActive: navigationMapDebug.localTestSelectionActive ?? false,
          selectedTargetCoordinate: navigationMapDebug.selectedTargetCoordinate
        },
        tencentPoiMode,
        nativeMapControls: {
          requestedVisible: false,
          detectedVisibleCount: nativeMapControlVisibleCount
        },
        activeGlbCount: sceneArbiter.getSnapshot().activeModelCount,
        lastMapError,
        presentationSwitchError,
        camera: {
          requestedViewMode: scenicMapPresentation === 'ink2d' ? '2D' : '3D',
          actualViewMode: actualCamera.viewMode,
          requestedPitch: requestedCamera.pitch,
          actualPitch: actualCamera.rawPitch,
          rawPitch: actualCamera.rawPitch,
          effectivePitch: effectiveCamera.pitch,
          requestedRotation: requestedCamera.rotation,
          actualRotation: actualCamera.rawRotation,
          rawRotation: actualCamera.rawRotation,
          effectiveRotation: effectiveCamera.rotation,
          requestedCenter: requestedCamera.center,
          actualCenter: actualCamera.center,
          requestedZoom: requestedCamera.zoom,
          actualZoom: actualCamera.zoom
        },
        savedCameraStates: {
          lastMeaningful3D: lastMeaningful3DCameraRef.current,
          camera2D: camera2DStateRef.current,
          camera3D: camera3DStateRef.current
        },
        cameraPersistence: {
          suppressed: suppress3DCameraPersistenceRef.current,
          lastPersistReason: cameraPersistenceDiagnosticsRef.current.lastPersistReason,
          lastRejectedPersistReason: cameraPersistenceDiagnosticsRef.current.lastRejectedPersistReason
        },
        routeCameraIntent: {
          generation: routeCameraIntentRef.current.generation,
          source: routeCameraIntentRef.current.source,
          routeId: routeCameraIntentRef.current.routeId,
          targetCenter: routeCameraIntentRef.current.target?.center ?? null,
          targetZoom: routeCameraIntentRef.current.target?.zoom ?? null,
          rawTargetZoom: routeCameraIntentRef.current.rawTargetZoom,
          effectiveTargetZoom: routeCameraIntentRef.current.effectiveTargetZoom,
          actualZoom: routeCameraIntentRef.current.actualZoom,
          configuredMinZoom: routeCameraIntentRef.current.configuredMinZoom,
          configuredMaxZoom: routeCameraIntentRef.current.configuredMaxZoom,
          zoomCorrectionApplied: routeCameraIntentRef.current.zoomCorrectionApplied,
          zoomCorrectionMethod: routeCameraIntentRef.current.zoomCorrectionMethod,
          zoomCorrectionGeneration: routeCameraIntentRef.current.zoomCorrectionGeneration,
          lastZoomWriter: routeCameraIntentRef.current.lastZoomWriter,
          phase: routeCameraIntentRef.current.phase,
          targetPitch: routeCameraIntentRef.current.target?.pitch ?? null,
          targetRotation: routeCameraIntentRef.current.target?.rotation ?? null,
          status: routeCameraIntentRef.current.status,
          lastCompletedGeneration: routeCameraIntentRef.current.lastCompletedGeneration,
          lastFailure: routeCameraIntentRef.current.lastFailure
        },
        routeFocusContext: {
          mapFocusMode,
          currentStopIndex: selectedStopIndex,
          currentStopPoiId: currentRouteConfig.stops[selectedStopIndex]?.spotId,
          resolvedCurrentCoordinate: getRouteStopLocation(currentRouteConfig.stops[selectedStopIndex]?.spotId)
        },
        customTileLayer: customTileLayerRuntimeRef.current
      }
    }
    const debugSnapshot = createDebugSnapshot()
    window.__LINGSHAN_MAP_DEBUG__ = debugSnapshot
    window.LINGSHAN_MAP_DEBUG = debugSnapshot
    window.__GET_LINGSHAN_MAP_SNAPSHOT__ = createDebugSnapshot
  }, [
    customTileLayerRuntime,
    genericCustomPoiVisibleCount,
    glbRuntimeSnapshot.updatedAt,
    isMapInstanceCurrent,
    lastMapError,
    mapBoundsSnapshot,
    mapInstanceId,
    nativeMapControlVisibleCount,
    navigationPoiOverrideActive,
    effectivePoiMode,
    poiVisibilityMode,
    presentationSwitchError,
    presentationTransition,
    cameraTransitionPhase,
    requestedScenicMapPresentation,
    routeCameraIntentSnapshot,
    routeStateMarkerCount,
    routeStopMarkerCount,
    sceneArbiter,
    selectedStopIndex,
    scenicMapPresentation,
    tencentPoiMode
  ])

  useEffect(() => {
    const container = mapElementRef.current
    if (mapStatus !== 'ready' || !container || typeof MutationObserver === 'undefined') {
      setNativeMapControlVisibleCount(0)
      return
    }

    let frameId: number | undefined
    const syncVisibleCount = () => {
      frameId = undefined
      const nextCount = countVisibleTencentNativeMapControls(container)
      setNativeMapControlVisibleCount((current) => (current === nextCount ? current : nextCount))
    }
    const scheduleSync = () => {
      if (frameId !== undefined) {
        return
      }
      frameId = window.requestAnimationFrame(syncVisibleCount)
    }
    const observer = new MutationObserver(scheduleSync)
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    })
    scheduleSync()

    return () => {
      observer.disconnect()
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [mapInstanceId, mapStatus])

  const landmarkInspector = useLandmarkModelInspector({
    active:
      (visualVariant.id === 'prototype-c' || debugPerf) &&
      !isInkCleanMode &&
      !isInk2DPresentation &&
      appliedPresentationRef.current === 'scenic3d' &&
      cameraTransitionPhase === 'ready',
    layerManager,
    useLocalDrafts: debugPerf,
    map: mapRef.current,
    mapReady: mapStatus === 'ready',
    isMapCurrent: isMapInstanceCurrent,
    overlays: landmarkModelOverlays,
    perfRecorder,
    resolveLocation: getModelOverlayLocation,
    onFocusLandmark: ({ id, location }) => focusLandmarkCamera(id, location, true)
  })
  const landmarkInspectorRef = useRef(landmarkInspector)
  const landmarkRuntimeLoadGenerationRef = useRef(0)
  const landmarkRuntimeLoadTimersRef = useRef<number[]>([])

  const routeStops = currentRouteConfig.stops
  const isRouteGuideView = effectiveGuideState.viewMode === 'route' && Boolean(effectiveGuideState.routeId)
  const routeGuideStage = effectiveGuideState.routeStage ?? 'preview'
  const routeGuideStopIndex = clampRouteStopIndex(effectiveGuideState.stopIndex, routeStops.length)
  const requestedJoiningStopIndex = effectiveGuideState.joinStopIndex ?? getJoiningStopIndexFromQuery(routeStops.length)
  const joiningStopIndex =
    routeGuideStage === 'joining' && requestedJoiningStopIndex !== undefined
      ? clampRouteStopIndex(requestedJoiningStopIndex, routeStops.length)
      : undefined
  const effectiveRouteStopIndex = joiningStopIndex ?? routeGuideStopIndex
  const shouldRenderRoute = isRouteGuideView
  const shouldRenderRouteProgress =
    isRouteGuideView && (routeGuideStage === 'active' || routeGuideStage === 'arrived' || joiningStopIndex !== undefined)
  const effectiveMapFocusMode = routeGuideStage === 'preview' ? 'overview' : mapFocusMode
  const poiLayerMode: LingshanPoiLayerMode = effectivePoiMode
  const terminalStopId = routeStops[routeStops.length - 1]?.spotId

  useEffect(() => {
    if (!isRouteGuideView) {
      return
    }

    setSelectedStopIndex(effectiveRouteStopIndex)
    const position = getRouteStopLocation(routeStops[effectiveRouteStopIndex]?.spotId)
    if (position) {
      setSimulatedPosition(position)
      setRoutePathIndex(findNearestRoutePoint(position, currentRoutePath)?.nearestIndex ?? 0)
    }
  }, [currentRoutePath, effectiveRouteStopIndex, isRouteGuideView, routeStops])

  useEffect(() => {
    if (!isRouteGuideView || mapStatus !== 'ready' || !mapRef.current) {
      return
    }

    // presentation 改变的同一 render 内，route focus effect 不能抢占
    // 2D -> 3D 的已保存相机恢复；恢复完成后由用户/既有焦点逻辑继续接管。
    if (initializedPresentationRef.current && initializedPresentationRef.current !== scenicMapPresentation) {
      return
    }

    if (effectiveMapFocusMode === 'overview') {
      focusRouteOverview()
      return
    }

    focusRouteCurrent(currentRouteConfig.id, effectiveRouteStopIndex)
  }, [
    currentRouteConfig.id,
    currentRoutePath,
    effectiveRouteStopIndex,
    isInk2DPresentation,
    isRouteGuideView,
    effectiveMapFocusMode,
    mapStatus,
    routeStops,
    scenicMapPresentation
  ])
  const nearestRoutePoint = useMemo(
    () => findNearestRoutePoint(simulatedPosition, currentRoutePath),
    [currentRoutePath, simulatedPosition]
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
  const activeCameraPreset = MAP_3D_GUIDE_CAMERA_PRESETS[activeCameraMode] ?? MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate
  const isTourPlaying = tourMode !== 'idle'
  const protectedLandmarkIds = useMemo(() => {
    const ids = new Set<string>()

    if (!PROTECT_TOUR_FOCUS_LANDMARKS || tourMode !== 'buddhaRealmTour') {
      return ids
    }

    const protectedRouteIds = [
      activeTourStepId,
      ...tourPreloadStopIds,
      selectedStopId,
      nextStop.nextStopId ?? undefined
    ].filter((id): id is string => Boolean(id))

    protectedRouteIds.forEach((routeId) => {
      const landmarkId = resolveLandmarkInspectorIdFromRouteId(routeId, landmarkModelOverlays)
      if (landmarkId) {
        ids.add(landmarkId)
      }
    })

    if (ids.size > MAX_ACTIVE_LANDMARK_GLB) {
      return new Set(Array.from(ids).slice(0, MAX_ACTIVE_LANDMARK_GLB))
    }

    return ids
  }, [activeTourStepId, landmarkModelOverlays, nextStop.nextStopId, selectedStopId, tourMode, tourPreloadStopIds])
  const protectedSceneModelIds = useMemo(() => {
    const ids = new Set<string>()

    protectedLandmarkIds.forEach((id) => {
      ids.add(getLandmarkSceneModelId(id))
      const overlay = landmarkModelOverlays.find((item) => getMapModelOverlayInspectorId(item) === id)
      overlay?.companionModels?.forEach((companion) => {
        if (companion.enabled) {
          ids.add(getCompanionSceneModelId(id, companion.id))
        }
      })
    })

    return ids
  }, [landmarkModelOverlays, protectedLandmarkIds])
  const protectedSceneModelIdsRef = useRef(protectedSceneModelIds)
  useEffect(() => {
    protectedSceneModelIdsRef.current = protectedSceneModelIds
  }, [protectedSceneModelIds])
  const mapVisualReadyForOverlays = mapStatus === 'ready' && isMapVisualReady
  const canUseMapInteractions = mapVisualReadyForOverlays && !mapReadyTimedOut && !isInkCleanMode
  const isScenic3DModelsReady =
    !isInk2DPresentation && appliedPresentationRef.current === 'scenic3d' && cameraTransitionPhase === 'ready'
  const shouldRunGlbRuntime = visualVariant.id === 'prototype-c' && !isInkCleanMode && isScenic3DModelsReady

  useEffect(() => {
    landmarkInspectorRef.current = landmarkInspector
  }, [landmarkInspector])

  useEffect(() => {
    return () => glbRuntimeOrchestrator.destroy()
  }, [glbRuntimeOrchestrator])

  useEffect(() => {
    return glbRuntimeOrchestrator.subscribe((snapshot) => {
      setGlbRuntimeSnapshot(snapshot)
      perfRecorder.recordMapVisualEvent({
        type: 'glbRuntimeOrchestratorStateChanged',
        glbRuntimeEnabled: snapshot.enabled,
        glbRuntimePhase: snapshot.phase,
        glbRuntimeProfile: snapshot.profile,
        glbRuntimeLandmarkGate: snapshot.landmarkGate,
        glbRuntimeLandmarkDelayMs: snapshot.landmarkDelayMs,
        glbRuntimePendingTimerCount: snapshot.pendingTimerCount,
        reason: snapshot.reason
      })
    })
  }, [glbRuntimeOrchestrator, perfRecorder])

  useEffect(() => {
    glbRuntimeOrchestrator.update({
      enabled: shouldRunGlbRuntime,
      mapReady: mapStatus === 'ready',
      visualReady: mapVisualReadyForOverlays,
      inkCleanMode: isInkCleanMode,
      mobile: isMobileViewport,
      interactionLiteMode: mapInteractionSnapshot.isInteracting
    })
  }, [
    glbRuntimeOrchestrator,
    isInkCleanMode,
    isMobileViewport,
    mapInteractionSnapshot.isInteracting,
    mapStatus,
    mapVisualReadyForOverlays,
    shouldRunGlbRuntime
  ])

  useEffect(() => {
    landmarkRuntimeLoadTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    landmarkRuntimeLoadTimersRef.current = []
    landmarkRuntimeLoadGenerationRef.current += 1

    if (!ENABLE_LANDMARK_GLB || visualVariant.id !== 'prototype-c' || isInkCleanMode || !isScenic3DModelsReady) {
      if (isInk2DPresentation) {
        setModelStatus('移动端 2D 地图模式：核心地标 GLB 暂不加载')
      } else if (!isInkCleanMode) {
        setModelStatus('正式 3D 地标等待相机恢复')
      }
      return
    }

    if (!mapVisualReadyForOverlays) {
      setModelStatus('正式 3D 地标等待地图底图就绪')
      return
    }

    if (!glbRuntimeSnapshot.landmarkGate) {
      setModelStatus('正式 3D 地标等待运行时调度')
      return
    }

    const inspector = landmarkInspectorRef.current
    const mapCenter = mapBoundsSnapshot.center ?? currentRouteCenter
    const landmarkOverviewMode = mapInteractionSnapshot.currentZoom <= LANDMARK_OVERVIEW_ZOOM_THRESHOLD
    const activeBudgetBase = landmarkOverviewMode ? MAX_OVERVIEW_ACTIVE_LANDMARK_GLB : MAX_ACTIVE_LANDMARK_GLB
    const preloadRadius = landmarkOverviewMode
      ? LANDMARK_OVERVIEW_PRELOAD_RADIUS_M
      : isMobileViewport
        ? LANDMARK_MOBILE_PRELOAD_RADIUS_M
        : LANDMARK_PRELOAD_RADIUS_M
    const keepAliveRadius = landmarkOverviewMode ? LANDMARK_OVERVIEW_KEEP_ALIVE_RADIUS_M : LANDMARK_KEEP_ALIVE_RADIUS_M
    const releaseRadius = landmarkOverviewMode ? LANDMARK_OVERVIEW_RELEASE_RADIUS_M : LANDMARK_RELEASE_RADIUS_M
    const candidates = landmarkModelOverlays
      .map((overlay) => {
        const id = getMapModelOverlayInspectorId(overlay)
        const location = getModelOverlayLocation(overlay)

        return {
          id,
          overlay,
          location,
          distance: location ? haversineDistanceMeters(mapCenter, location) : Number.POSITIVE_INFINITY
        }
      })
      .filter((item) => item.location)
      .sort((a, b) => a.distance - b.distance)
    const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]))
    const lodChoiceById = new Map(
      candidates
        .map((candidate) => {
          return [
            candidate.id,
            resolveLandmarkLodRuntimeChoice(candidate.overlay, candidate.distance, {
              forceFar: LANDMARK_FORCE_LOW_DETAIL_GLB
            })
          ] as const
        })
        .filter((entry): entry is readonly [string, NonNullable<ReturnType<typeof resolveLandmarkLodRuntimeChoice>>] =>
          Boolean(entry[1])
        )
    )
    const desiredLandmarkIds = new Set<string>(protectedLandmarkIds)
    const primaryDesiredLandmarkIds = new Set<string>(protectedLandmarkIds)

    for (const candidate of candidates) {
      if (desiredLandmarkIds.size >= activeBudgetBase) {
        break
      }

      if (candidate.distance <= preloadRadius) {
        desiredLandmarkIds.add(candidate.id)
        primaryDesiredLandmarkIds.add(candidate.id)
      }
    }

    const nearestCandidate = candidates[0]
    if (
      !landmarkOverviewMode &&
      nearestCandidate &&
      desiredLandmarkIds.size < activeBudgetBase &&
      nearestCandidate.distance <= keepAliveRadius
    ) {
      desiredLandmarkIds.add(nearestCandidate.id)
      primaryDesiredLandmarkIds.add(nearestCandidate.id)
    }

    const inspectorItemsById = new Map(inspector.items.map((item) => [item.id, item]))
    const activeItems = inspector.items.filter((item) => item.status === 'loaded' || item.status === 'loading')
    const activeItemIds = new Set(activeItems.map((item) => item.id))
    const activeBudgetMax = Math.max(activeBudgetBase, protectedLandmarkIds.size)

    for (const item of activeItems
      .filter((item) => !protectedLandmarkIds.has(item.id) && !desiredLandmarkIds.has(item.id))
      .sort((a, b) => (candidateById.get(a.id)?.distance ?? Number.POSITIVE_INFINITY) - (candidateById.get(b.id)?.distance ?? Number.POSITIVE_INFINITY))) {
      if (desiredLandmarkIds.size >= activeBudgetMax) {
        break
      }

      const distance = candidateById.get(item.id)?.distance ?? Number.POSITIVE_INFINITY
      if (distance <= keepAliveRadius) {
        desiredLandmarkIds.add(item.id)
      }
    }

    const releaseIds = new Set<string>()
    const releaseReasons = new Map<string, string>()
    const markRelease = (id: string, reason: string) => {
      if (protectedLandmarkIds.has(id)) {
        return
      }
      releaseIds.add(id)
      releaseReasons.set(id, reason)
      desiredLandmarkIds.delete(id)
    }

    activeItems.forEach((item) => {
      const distance = candidateById.get(item.id)?.distance ?? Number.POSITIVE_INFINITY
      if (distance > releaseRadius) {
        markRelease(item.id, 'release-radius')
        return
      }

      if (!desiredLandmarkIds.has(item.id) && distance > keepAliveRadius) {
        markRelease(item.id, 'outside-keep-alive-window')
      }
    })

    const desiredInactiveIds = () => Array.from(desiredLandmarkIds).filter((id) => !activeItemIds.has(id))
    const activeCountAfterPlannedRelease = () => activeItems.filter((item) => !releaseIds.has(item.id)).length
    const evictableActiveItems = () =>
      activeItems
        .filter((item) => !releaseIds.has(item.id) && !protectedLandmarkIds.has(item.id) && !primaryDesiredLandmarkIds.has(item.id))
        .sort((a, b) => (candidateById.get(b.id)?.distance ?? 0) - (candidateById.get(a.id)?.distance ?? 0))

    while (activeCountAfterPlannedRelease() + desiredInactiveIds().length > activeBudgetMax) {
      const [evictable] = evictableActiveItems()
      if (!evictable) {
        break
      }
      markRelease(evictable.id, 'active-window-replace')
    }

    const unregisterSceneModelRecord = (modelId: string) => {
      sceneArbiter.releaseLoad(modelId)
      glbSpatialController.unregister(modelId)
      glbMemoryManager.unregister(modelId)
      sceneWindowManager.unregister(modelId)
      sceneStateManagerRef.current?.unregister(modelId)
      sceneArbiter.unregisterModel(modelId)
      layerManager.removeLayer(modelId)
    }

    const releaseLandmarkRuntime = (item: (typeof inspector.items)[number]) => {
      item.companions.forEach((companion) => {
        const companionModelId = getCompanionSceneModelId(item.id, companion.id)
        if (companion.status === 'loaded' || companion.status === 'loading') {
          inspector.unloadCompanionModel(item.id, companion.id)
        }
        unregisterSceneModelRecord(companionModelId)
      })

      const modelId = getLandmarkSceneModelId(item.id)
      if (item.status === 'loaded' || item.status === 'loading') {
        inspector.unloadLandmark(item.id)
      }
      unregisterSceneModelRecord(modelId)
      landmarkLastEvictedAtRef.current.set(item.id, Date.now())
    }

    const decisions = new Map<string, { allowed: boolean; reason?: string }>()
    const loadedNow: string[] = []
    const releasedNow: string[] = []
    const getLandmarkLoadOptions = (id: string) => {
      const lodChoice = lodChoiceById.get(id)
      return lodChoice
        ? {
            modelUrl: lodChoice.modelUrl,
            fileSizeLabel: lodChoice.sizeLabel,
            runtimeLabel: `${lodChoice.tier}:${lodChoice.source}`
          }
        : undefined
    }

    activeItems.forEach((item) => {
      if (!releaseIds.has(item.id)) {
        return
      }

      const modelId = getLandmarkSceneModelId(item.id)
      const releaseReason = releaseReasons.get(item.id) ?? 'landmark-window-release'
      const distance = candidateById.get(item.id)?.distance ?? Number.POSITIVE_INFINITY
      const decision = sceneArbiter.requestAction({
        type: 'dispose',
        modelId,
        context: {
          source: 'window',
          kind: 'landmark',
          protected: false,
          windowManaged: true,
          inWindow: false,
          estimatedMemoryMB: 36,
          sceneState: 'disposed',
          memoryState: 'disposed',
          reason: releaseReason
        }
      })
      decisions.set(item.id, { allowed: decision.allowed, reason: decision.allowed ? undefined : decision.reason })

      if (!decision.allowed) {
        return
      }

      releaseLandmarkRuntime(item)
      releasedNow.push(item.id)
      releaseReasons.set(item.id, `${releaseReason}${Number.isFinite(distance) ? `:${Math.round(distance)}m` : ''}`)
    })

    desiredLandmarkIds.forEach((id) => {
      const item = inspectorItemsById.get(id)

      if (!item) {
        return
      }

      const modelId = getLandmarkSceneModelId(id)
      const protectedModel = protectedLandmarkIds.has(id)

      if (item.status === 'loaded') {
        const decision = sceneArbiter.requestAction({
          type: 'show',
          modelId,
          context: {
            source: 'window',
            kind: 'landmark',
            protected: protectedModel,
            windowManaged: true,
            inWindow: true,
            visible: true,
            sceneState: 'visible',
            memoryState: 'active',
            estimatedMemoryMB: 36,
            reason: protectedModel ? 'tour-focus-landmark-visible' : 'nearby-landmark-visible'
          }
        })
        decisions.set(id, { allowed: decision.allowed, reason: decision.allowed ? undefined : decision.reason })
        if (decision.allowed) {
          inspector.loadLandmark(id, getLandmarkLoadOptions(id))
          sceneStateManagerRef.current?.rehydrate(modelId)
          glbSpatialController.setVisible(modelId, true)
        }
      } else if (item.status !== 'loading') {
        landmarkLastLoadAttemptAtRef.current.set(id, Date.now())
        const decision = sceneArbiter.requestAction({
          type: 'load',
          modelId,
          context: {
            source: 'window',
            kind: 'landmark',
            protected: protectedModel,
            windowManaged: true,
            inWindow: true,
            estimatedMemoryMB: 36,
            reason: protectedModel
              ? 'tour-focus-landmark-load'
              : releasedNow.length
                ? 'load-allowed-after-evict'
                : 'nearby-landmark-load'
          }
        })
        decisions.set(id, { allowed: decision.allowed, reason: decision.allowed ? undefined : decision.reason })
        if (decision.allowed) {
          const lodChoice = lodChoiceById.get(id)
          inspector.loadLandmark(id, getLandmarkLoadOptions(id))
          sceneArbiter.releaseLoad(modelId)
          loadedNow.push(id)
          landmarkLastLoadAllowReasonRef.current.set(
            id,
            `${decision.reason}${lodChoice ? `:${lodChoice.tier}` : ''}`
          )
          landmarkLastLoadDenyReasonRef.current.delete(id)
        } else {
          landmarkLastLoadDenyReasonRef.current.set(id, decision.reason)
        }
      }

      item.companions.forEach((companion) => {
        if (!companion.enabled) {
          return
        }

        const companionModelId = getCompanionSceneModelId(id, companion.id)
        const protectedCompanion = protectedSceneModelIds.has(companionModelId)

        if (companion.status === 'loaded') {
          const decision = sceneArbiter.requestAction({
            type: 'show',
            modelId: companionModelId,
            context: {
              source: 'window',
              kind: 'companion',
              protected: protectedCompanion,
              windowManaged: true,
              inWindow: true,
              visible: true,
              sceneState: 'visible',
              memoryState: 'active',
              estimatedMemoryMB: 2,
              reason: protectedCompanion ? 'tour-focus-companion-visible' : 'nearby-companion-visible'
            }
          })
          if (decision.allowed) {
            sceneStateManagerRef.current?.rehydrate(companionModelId)
            glbSpatialController.setVisible(companionModelId, true)
          }
          return
        }

        if (companion.status === 'loading') {
          return
        }

        const decision = sceneArbiter.requestAction({
          type: 'load',
          modelId: companionModelId,
          context: {
            source: 'window',
            kind: 'companion',
            protected: protectedCompanion,
            windowManaged: true,
            inWindow: true,
            estimatedMemoryMB: 2,
            reason: protectedCompanion ? 'tour-focus-companion-load' : 'nearby-companion-load'
          }
        })

        if (decision.allowed) {
          inspector.loadCompanionModel(id, companion.id)
          sceneArbiter.releaseLoad(companionModelId)
        }
      })
    })

    const activeSlotIds = Array.from(
      new Set([
        ...Array.from(protectedLandmarkIds),
        ...Array.from(desiredLandmarkIds),
        ...activeItems.filter((item) => !releaseIds.has(item.id) && desiredLandmarkIds.has(item.id)).map((item) => item.id)
      ])
    ).slice(0, activeBudgetMax)
    const activeBudgetUsed = activeItems.filter((item) => !releaseIds.has(item.id)).length + loadedNow.filter((id) => !activeItemIds.has(id)).length
    const debugRows: Map3DLandmarkGlBDebugRow[] = landmarkModelOverlays.map((overlay) => {
      const id = getMapModelOverlayInspectorId(overlay)
      const item = inspectorItemsById.get(id)
      const distance = candidateById.get(id)?.distance
      const protectedModel = protectedLandmarkIds.has(id)
      const desired = desiredLandmarkIds.has(id)
      const lodChoice = lodChoiceById.get(id)
      const shouldRelease =
        !protectedModel &&
        (releaseIds.has(id) || (distance !== undefined && distance > releaseRadius))
      const decision = decisions.get(id)
      const actualState =
        releaseIds.has(id) && decision?.allowed
          ? 'released'
          : item?.status === 'loaded'
          ? desired || protectedModel
            ? 'visible'
            : 'hidden'
          : item?.status === 'failed'
            ? 'error'
            : item?.status ?? 'unloaded'

      return {
        id,
        displayName: overlay.name,
        glbUrl: lodChoice?.modelUrl ?? overlay.modelUrl,
        desiredState: shouldRelease ? 'should-release' : desired ? 'should-load' : 'should-hide',
        actualState,
        arbiterDecision: decision ? (decision.allowed ? 'allow' : 'deny') : 'none',
        denyReason: decision?.allowed === false ? decision.reason : undefined,
        distanceToMapCenter: distance !== undefined && Number.isFinite(distance) ? Math.round(distance) : undefined,
        isTourFocus: protectedModel,
        isProtected: protectedModel,
        activeSlotIndex: activeSlotIds.indexOf(id) >= 0 ? activeSlotIds.indexOf(id) : undefined,
        activeBudgetUsed,
        activeBudgetMax,
        evictable: Boolean(item && (item.status === 'loaded' || item.status === 'loading') && !protectedModel && !desired),
        evictReason: releaseReasons.get(id),
        lastEvictedAt: landmarkLastEvictedAtRef.current.get(id),
        lastLoadAttemptAt: landmarkLastLoadAttemptAtRef.current.get(id),
        lastLoadAllowReason: landmarkLastLoadAllowReasonRef.current.get(id),
        lastLoadDenyReason: landmarkLastLoadDenyReasonRef.current.get(id),
        lastError: item?.error
      }
    })

    setModelStatus(
      `正式 3D 地标滚动窗口 · ${landmarkOverviewMode ? 'overview' : 'nearby'} · active ${activeBudgetUsed}/${activeBudgetMax}`
    )
    perfRecorder.recordMapVisualEvent({
      type: 'landmarkRuntimeLoadBatch',
      landmarkRuntimeBatchIndex: 0,
      landmarkRuntimeBatchCount: 1,
      landmarkRuntimeIds: loadedNow.length || releasedNow.length ? [...loadedNow, ...releasedNow.map((id) => `release:${id}`)] : Array.from(desiredLandmarkIds),
      landmarkGlbDebugRows: debugRows,
      reason: `${LANDMARK_GLB_LOAD_MODE}; ${landmarkOverviewMode ? 'overview-low-lod' : 'nearby-low-lod'}; protected=${Array.from(protectedLandmarkIds).join(',') || '-'}`
    })

    return () => {
      landmarkRuntimeLoadGenerationRef.current += 1
      landmarkRuntimeLoadTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      landmarkRuntimeLoadTimersRef.current = []
    }
  }, [
    glbMemoryManager,
    glbRuntimeSnapshot.landmarkGate,
    glbRuntimeSnapshot.phase,
    glbSpatialController,
    isInk2DPresentation,
    isInkCleanMode,
    isScenic3DModelsReady,
    landmarkInspector.items,
    landmarkModelOverlays,
    layerManager,
    mapBoundsSnapshot.center,
    mapInteractionSnapshot.currentZoom,
    mapVisualReadyForOverlays,
    isMobileViewport,
    perfRecorder,
    protectedLandmarkIds,
    protectedSceneModelIds,
    sceneArbiter,
    sceneWindowManager,
    visualVariant.id
  ])

  const tourStateLabel =
    tourMode === 'buddhaRealmTour'
      ? `沉浸导览中${activeTourStepId ? ` · ${getPoiDisplay(activeTourStepId)?.name ?? activeTourStepId}` : ''}`
      : '待命'
  const visibleCameraPresets = debugPerf
    ? guideCameraPresets
    : guideCameraPresets.filter((preset) => preset.id !== 'closeInspect')
  const routeProgressPercent = nearestRoutePoint
    ? Math.max(0, Math.min(100, Math.round(nearestRoutePoint.progressRatio * 100)))
    : 0
  const routeProgressRatio = routeProgressPercent / 100
  const nextInkBoundsCorner = getNextInkMapBoundsCorner(inkBoundsDraft)
  const inkBoundsComplete = inkMapBoundCornerOrder.every((corner) => Boolean(inkBoundsDraft[corner]))
  const inkExportUiSuppressed = inkExportUiHidden || cleanShot
  const configuredInkBoundsDraft = useMemo(() => getConfiguredInkBoundsDraft(), [])
  const showFormalInkBounds = ((isInkCleanMode && !cleanShot) || showInkBounds) && !inkExportUiHidden
  // Persistent cloud, mountain, haze and canvas mist layers were removed from
  // the production map. Only the short presentation transition remains.
  const edgeMistState = {
    level: 'normal' as const,
    reason: 'persistent-atmosphere-removed',
    strength: 0,
    nearInkBoundary: false,
    distanceToInkBoundary: 0
  }
  const clearMaskState = {
    mode: 'disabled' as const,
    size: 'wide' as const,
    center: 'none',
    shape: 'round' as const
  }
  const scenicPoiBillboards = useMemo<ScenicPoiBillboardItem[]>(
    () => {
      const billboardConfigs = new Map(scenicPoiBillboardConfigs.map((config) => [config.id, config]))

      routeStops.forEach((stop) => {
        if (billboardConfigs.has(stop.spotId)) {
          return
        }

        billboardConfigs.set(stop.spotId, {
          id: stop.spotId,
          description: currentRouteConfig.theme ?? '路线站点',
          tier: 'secondary',
          visualLiftPx: 44
        })
      })

      return Array.from(billboardConfigs.values())
        .map((config) => {
          const poi = lingshanPois.find((item) => item.id === config.id)

          if (!poi) {
            return null
          }

          return {
            id: poi.id,
            name: poi.name,
            description: config.description,
            tier: config.tier,
            position: getBestPoiLocation(poi),
            visualLiftPx: config.visualLiftPx
          }
        })
        .filter((item): item is ScenicPoiBillboardItem => Boolean(item))
    },
    [currentRouteConfig.theme, routeStops]
  )
  const tourPoiSuppressionEnabled = tourMode === 'buddhaRealmTour'
  const poiBillboardActiveId = normalizePoiBillboardActiveId(
    activeLandmarkId ?? activeTourStepId ?? (tourPoiSuppressionEnabled ? selectedStopId ?? nextStop.nextStopId : undefined) ?? undefined
  )
  const normalizedNextPoiBillboardId = nextStop.nextStopId ? normalizePoiBillboardActiveId(nextStop.nextStopId) : undefined
  const poiBillboardNextId =
    tourPoiSuppressionEnabled && normalizedNextPoiBillboardId && normalizedNextPoiBillboardId !== poiBillboardActiveId
      ? normalizedNextPoiBillboardId
      : undefined
  const poiBillboardMode = getPoiBillboardMode({
    currentZoom: mapInteractionSnapshot.currentZoom ?? activeCameraPreset.zoom,
    focus: Boolean(activeLandmarkId) || activeCameraMode === 'landmarkFocus',
    tourMode
  })
  const activePoiBillboardCount = [poiBillboardActiveId, poiBillboardNextId].filter(Boolean).length
  const mutedPoiBillboardCount = tourPoiSuppressionEnabled
    ? Math.max(0, scenicPoiBillboards.length - activePoiBillboardCount)
    : 0
  const activePoiLiftPx = scenicPoiBillboards.find((item) => item.id === poiBillboardActiveId)?.visualLiftPx ?? 0

  useEffect(() => {
    perfRecorder.recordMapVisualEvent({
      type: poiBillboardActiveId ? 'billboardHighlightEvent' : 'poiBillboardStateChanged',
      atmosphereMode: 'normal',
      atmosphereVisible: false,
      poiBillboardCount: scenicPoiBillboards.length,
      poiBillboardMode,
      activePoiBillboardId: poiBillboardActiveId ?? null,
      horizonMaskEnabled: false,
      horizonMaskIntensity: 0,
      activePoiCount: activePoiBillboardCount,
      mutedPoiCount: mutedPoiBillboardCount,
      waterHintsEnabled: false,
      waterHintsCount: 0,
      tourPoiSuppressionEnabled,
      dynamicMistEnabled: false,
      dynamicMistCanvasActive: false,
      dynamicMistQuality: 'off',
      dynamicMistDegraded: false,
      dynamicMistRecoveryState: 'disabled',
      skyOptionsAnimated: false,
      enableDynamicMistDebugOverride: false,
      coreClearMaskEnabled: false,
      poiLiftMode: 'raised',
      activePoiLiftPx,
      currentZoom: roundNumber(mapBoundsSnapshot.zoom, 2),
      mapBoundsEnabled,
      mapBoundsDisabledReason,
      mapCenterLimitBounds: formatInkMapBoundsForPerf(getScaledInkMapBounds(INK_MAP_CENTER_LIMIT_RATIO)),
      mapVisualBufferBounds: formatInkMapBoundsForPerf(getScaledInkMapBounds(INK_MAP_VISUAL_BUFFER_RATIO)),
      currentMapCenter: formatLatLngForPerf(mapBoundsSnapshot.center),
      mapMinZoom,
      mapMaxZoom,
      zoomLimited: isZoomNearLimit(mapBoundsSnapshot.zoom, mapMinZoom, mapMaxZoom),
      edgeMistLevel: edgeMistState.level,
      edgeMistReason: edgeMistState.reason,
      edgeMistStrength: edgeMistState.strength,
      nearInkBoundary: edgeMistState.nearInkBoundary,
      distanceToInkBoundary: edgeMistState.distanceToInkBoundary,
      clearMaskMode: clearMaskState.mode,
      clearMaskSize: clearMaskState.size,
      clearMaskCenter: clearMaskState.center,
      clearMaskShape: clearMaskState.shape,
      cameraPresetTightened: true,
      noMapBoundsDebugOverride
    })
  }, [
    activePoiBillboardCount,
    activePoiLiftPx,
    mapBoundsDisabledReason,
    mapBoundsEnabled,
    mapBoundsSnapshot.center,
    mapBoundsSnapshot.zoom,
    mapMaxZoom,
    mapMinZoom,
    mutedPoiBillboardCount,
    noMapBoundsDebugOverride,
    perfRecorder,
    poiBillboardActiveId,
    poiBillboardMode,
    scenicPoiBillboards.length,
    tourPoiSuppressionEnabled
  ])

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
    perfRecorder.setRouteState({
      currentRouteId: currentRouteConfig.id,
      currentRouteName: currentRouteConfig.name,
      routeStopCount: routeStops.length,
      currentStopId: selectedStopId,
      nextStopId: nextStop.nextStopId ?? undefined,
      routeGeometryPointCount: currentRouteGeometry?.pointCount ?? currentRoutePath.length,
      tourStatus: tourMode === 'buddhaRealmTour' ? 'playing' : 'idle',
      routeSwitchCount,
      routeGeometryMode: currentRouteConfig.routeGeometryMode,
      guideDataRouteSource: currentRouteConfig.guideDataRouteSource,
      unmappedGuideStopCount: currentRouteConfig.unmappedGuideStopCount
    })
  }, [
    currentRouteConfig,
    currentRouteGeometry?.pointCount,
    currentRoutePath.length,
    nextStop.nextStopId,
    perfRecorder,
    routeStops.length,
    routeSwitchCount,
    selectedStopId,
    tourMode
  ])
  const prototypeName =
    visualVariant.id === 'prototype-a' ? 'A' : visualVariant.id === 'prototype-b' ? 'B' : visualVariant.id === 'prototype-c' ? 'C' : '默认'
  const configuredAssetUrls = useMemo(
    () => Array.from(new Set(decorOverlays.flatMap((decor) => (decor.assetUrl ? [decor.assetUrl] : [])))),
    [decorOverlays]
  )
  const loadedAssetCount = configuredAssetUrls.filter((assetUrl) => assetLoadState[assetUrl] === 'loaded').length
  const failedAssetUrls = configuredAssetUrls.filter((assetUrl) => assetLoadState[assetUrl] === 'error')
  const spatialLandmarkOverlayLookup = useMemo(() => {
    const lookup = new Map<string, LingshanMapModelOverlay>()
    landmarkModelOverlays.forEach((overlay) => {
      lookup.set(`model_landmark:${getMapModelOverlayInspectorId(overlay)}`, overlay)
    })
    return lookup
  }, [landmarkModelOverlays])
  const sceneStateReleaseModelRef = useRef<(modelId: string, record: SceneStateRecord) => void>(() => undefined)
  const sceneStateLoadModelRef = useRef<
    (modelId: string, record: SceneStateRecord) => Promise<boolean | void> | boolean | void
  >(() => false)
  const sceneStateReleaseModel = useCallback(
    (modelId: string, _record: SceneStateRecord) => {
      if (modelId.startsWith('model_landmark_companion:')) {
        const companionKey = modelId.slice('model_landmark_companion:'.length)
        const [parentId, companionId] = companionKey.split('::')

        if (parentId && companionId) {
          landmarkInspectorRef.current.unloadCompanionModel(parentId, companionId)
          return
        }
      }

      if (modelId.startsWith('model_landmark:')) {
        const landmarkId = modelId.slice('model_landmark:'.length)

        if (landmarkId) {
          landmarkInspectorRef.current.unloadLandmark(landmarkId)
          return
        }
      }

      glbSpatialController.unregister(modelId)
      glbMemoryManager.unregister(modelId)
      layerManager.removeLayer(modelId)
    },
    [glbMemoryManager, glbSpatialController, layerManager]
  )
  const sceneStateLoadModel = useCallback(
    (modelId: string, _record: SceneStateRecord) => {
      if (modelId.startsWith('model_landmark_companion:')) {
        const companionKey = modelId.slice('model_landmark_companion:'.length)
        const [parentId, companionId] = companionKey.split('::')

        if (parentId && companionId) {
          landmarkInspectorRef.current.loadCompanionModel(parentId, companionId)
          return true
        }
      }

      if (modelId.startsWith('model_landmark:')) {
        const landmarkId = modelId.slice('model_landmark:'.length)

        if (landmarkId) {
          landmarkInspectorRef.current.loadLandmark(landmarkId)
          return true
        }
      }

      return false
    },
    []
  )
  const sceneStateManager = useMemo(
    () =>
      new SceneStateManager({
        setVisible: (modelId, visible) => {
          const decision = sceneArbiterRef.current.requestAction({
            type: visible ? 'show' : 'hide',
            modelId,
            context: {
              source: 'state',
              protected: protectedSceneModelIdsRef.current.has(modelId),
              sceneState: visible ? 'visible' : 'hidden',
              reason: 'scene-state-visibility'
            }
          })

          if (decision.allowed) {
            glbSpatialController.setVisible(modelId, visible)
          }
        },
        release: (modelId, record) => {
          const decision = sceneArbiterRef.current.requestAction({
            type: 'dispose',
            modelId,
            context: {
              source: 'state',
              kind: record.kind,
              protected: protectedSceneModelIdsRef.current.has(modelId),
              sceneState: 'disposed',
              memoryState: 'disposed',
              reason: 'scene-state-release'
            }
          })

          if (decision.allowed) {
            sceneStateReleaseModelRef.current(modelId, record)
          }
        },
        load: (modelId, record) => {
          const decision = sceneArbiterRef.current.requestAction({
            type: 'rehydrate',
            modelId,
            context: {
              source: 'state',
              kind: record.kind,
              protected: protectedSceneModelIdsRef.current.has(modelId),
              sceneState: record.state,
              estimatedMemoryMB: record.kind === 'landmark' ? 36 : record.kind === 'companion' ? 2 : 8,
              reason: 'scene-state-rehydrate'
            }
          })

          if (!decision.allowed) {
            return false
          }

          const result = sceneStateLoadModelRef.current(modelId, record)
          Promise.resolve(result).finally(() => {
            sceneArbiterRef.current.releaseLoad(modelId)
          })
          return result
        }
      }),
    [glbSpatialController]
  )
  useEffect(() => {
    sceneStateReleaseModelRef.current = sceneStateReleaseModel
  }, [sceneStateReleaseModel])
  useEffect(() => {
    sceneStateLoadModelRef.current = sceneStateLoadModel
  }, [sceneStateLoadModel])
  useEffect(() => {
    sceneStateManagerRef.current = sceneStateManager

    return () => {
      if (sceneStateManagerRef.current === sceneStateManager) {
        sceneStateManagerRef.current = null
      }
    }
  }, [sceneStateManager])
  useEffect(() => {
    glbSpatialController.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !isInk2DPresentation,
      mobile: isMobileViewport,
      intervalMs: 200,
      protectedModelIds: protectedSceneModelIds
    })
  }, [glbSpatialController, isInk2DPresentation, isInkCleanMode, isMobileViewport, mapStatus, protectedSceneModelIds, visualVariant.id])

  useEffect(() => {
    glbMemoryManager.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !isInk2DPresentation,
      maxActiveModels: 80,
      ttlMs: 60000,
      sweepIntervalMs: 5000,
      protectedModelIds: protectedSceneModelIds
    })
  }, [glbMemoryManager, isInk2DPresentation, isInkCleanMode, mapStatus, protectedSceneModelIds, visualVariant.id])

  useEffect(() => {
    sceneArbiter.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !isInk2DPresentation,
      maxActiveGLB: 80,
      memoryPressureThresholdMB: 360,
      debounceMs: 300
    })
  }, [isInk2DPresentation, isInkCleanMode, mapStatus, sceneArbiter, visualVariant.id])

  useEffect(() => {
    return sceneArbiter.subscribe((snapshot) => {
      perfRecorder.recordMapVisualEvent({
        type: 'sceneArbiterStateChanged',
        arbiterDecisionCount: snapshot.decisionCount,
        arbiterDeniedCount: snapshot.deniedCount,
        arbiterLoadThrottleCount: snapshot.loadThrottleCount,
        arbiterConflictResolveCount: snapshot.conflictResolveCount,
        arbiterActiveLoadCount: snapshot.activeLoadCount,
        arbiterActiveModelCount: snapshot.activeModelCount,
        arbiterMemoryPressureEstimateMB: snapshot.memoryPressureEstimateMB
      })
    })
  }, [perfRecorder, sceneArbiter])

  useEffect(() => {
    return () => sceneArbiter.destroy()
  }, [sceneArbiter])

  useEffect(() => {
    return glbMemoryManager.subscribe((snapshot) => {
      perfRecorder.recordMapVisualEvent({
        type: 'glbMemoryManagerStateChanged',
        glbActiveCount: snapshot.activeCount,
        glbCachedCount: snapshot.cachedCount,
        glbDisposedCount: snapshot.disposedCount,
        glbSoftDetachedCount: snapshot.softDetachedCount,
        glbMemoryEstimateMB: snapshot.memoryEstimateMB,
        glbMemoryMaxActive: snapshot.maxActiveModels,
        glbMemoryTtlMs: snapshot.ttlMs
      })
    })
  }, [glbMemoryManager, perfRecorder])

  useEffect(() => {
    sceneWindowManager.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !isInk2DPresentation && tourMode === 'buddhaRealmTour',
      activeWindowMeters: 300,
      forwardWindowMeters: 800,
      behindProgressWindow: 0.035,
      updateIntervalMs: 1000,
      protectedModelIds: protectedSceneModelIds
    })
  }, [isInk2DPresentation, isInkCleanMode, mapStatus, protectedSceneModelIds, sceneWindowManager, tourMode, visualVariant.id])

  useEffect(() => {
    sceneStateManager.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !isInk2DPresentation && tourMode === 'buddhaRealmTour',
      activeWindowMeters: 300,
      forwardWindowMeters: 800,
      behindProgressWindow: 0.035,
      rehydrateDebounceMs: 300,
      protectedModelIds: protectedSceneModelIds
    })
  }, [isInk2DPresentation, isInkCleanMode, mapStatus, protectedSceneModelIds, sceneStateManager, tourMode, visualVariant.id])

  useEffect(() => {
    return sceneWindowManager.subscribe((snapshot) => {
      perfRecorder.recordMapVisualEvent({
        type: 'sceneWindowManagerStateChanged',
        windowActiveCount: snapshot.activeCount,
        windowVisibleCount: snapshot.visibleCount,
        windowDisposedCount: snapshot.disposedCount,
        windowBehindCount: snapshot.behindCount,
        windowCachedCount: snapshot.cachedCount,
        sceneMemoryPressureEstimate: snapshot.memoryPressureEstimate
      })
    })
  }, [perfRecorder, sceneWindowManager])

  useEffect(() => {
    return sceneStateManager.subscribe((snapshot) => {
      perfRecorder.recordMapVisualEvent({
        type: 'sceneStateManagerStateChanged',
        sceneStateLoaded: snapshot.loadedCount,
        sceneStateVisible: snapshot.visibleCount,
        sceneStateDisposed: snapshot.disposedCount,
        sceneStateRehydrated: snapshot.rehydratedCount,
        sceneStateCached: snapshot.cachedCount,
        sceneStateHidden: snapshot.hiddenCount,
        sceneStateActiveLoads: snapshot.activeLoadCount,
        sceneCacheHitRate: snapshot.cacheHitRate
      })
    })
  }, [perfRecorder, sceneStateManager])

  useEffect(() => {
    return () => sceneStateManager.destroy()
  }, [sceneStateManager])

  useEffect(() => {
    return layerManager.subscribe((snapshot) => {
      const activeSpatialModels = new Set<string>()

      snapshot.forEach((layer) => {
        const model = layerManager.getLayer(layer.name)

        if (!model) {
          return
        }

        if (layer.name.startsWith('model_landmark_companion:')) {
          const isProtectedModel = protectedSceneModelIds.has(layer.name)
          const companionKey = layer.name.slice('model_landmark_companion:'.length)
          const [parentId, companionId] = companionKey.split('::')
          const parentOverlay = spatialLandmarkOverlayLookup.get(`model_landmark:${parentId}`)
          const companion = parentOverlay?.companionModels?.find((item) => item.id === companionId)
          const parentLocation = parentOverlay ? getModelOverlayLocation(parentOverlay) : null

          if (!parentLocation) {
            return
          }

          activeSpatialModels.add(layer.name)
          glbSpatialController.register(layer.name, model, parentLocation, {
            kind: 'companion'
          })
          glbMemoryManager.register(layer.name, model, {
            kind: 'companion',
            estimatedMemoryMB: 2
          })
          sceneWindowManager.register(layer.name, model, parentLocation, {
            kind: 'companion',
            estimatedMemoryMB: 2,
            routeProgress: getSceneWindowRouteProgress(parentLocation, currentRoutePath, currentRouteCumulativeDistances)
          })
          sceneStateManager.register(layer.name, {
            glbUrl: companion?.modelUrl,
            position: parentLocation,
            model,
            kind: 'companion',
            routeProgress: getSceneWindowRouteProgress(parentLocation, currentRoutePath, currentRouteCumulativeDistances)
          })
          sceneArbiter.registerModel({
            modelId: layer.name,
            kind: 'companion',
            estimatedMemoryMB: 2
          })
          sceneArbiter.requestAction({
            type: 'show',
            modelId: layer.name,
            context: {
              source: 'runtime',
              kind: 'companion',
              protected: isProtectedModel,
              visible: true,
              inWindow: true,
              sceneState: 'visible',
              memoryState: 'active',
              estimatedMemoryMB: 2,
              reason: 'layer-manager-register'
            }
          })
          sceneArbiter.releaseLoad(layer.name)
          return
        }

        if (layer.name.startsWith('model_landmark:')) {
          const isProtectedModel = protectedSceneModelIds.has(layer.name)
          const overlay = spatialLandmarkOverlayLookup.get(layer.name)
          const location = overlay ? getModelOverlayLocation(overlay) : null

          if (!overlay || !location) {
            return
          }

          activeSpatialModels.add(layer.name)
          glbSpatialController.register(layer.name, model, location, {
            kind: 'landmark'
          })
          glbMemoryManager.register(layer.name, model, {
            kind: 'landmark',
            estimatedMemoryMB: 36
          })
          sceneWindowManager.register(layer.name, model, location, {
            kind: 'landmark',
            estimatedMemoryMB: 36,
            routeProgress: getSceneWindowRouteProgress(location, currentRoutePath, currentRouteCumulativeDistances)
          })
          sceneStateManager.register(layer.name, {
            glbUrl: overlay.modelUrl,
            position: location,
            model,
            kind: 'landmark',
            routeProgress: getSceneWindowRouteProgress(location, currentRoutePath, currentRouteCumulativeDistances)
          })
          sceneArbiter.registerModel({
            modelId: layer.name,
            kind: 'landmark',
            estimatedMemoryMB: 36
          })
          sceneArbiter.requestAction({
            type: 'show',
            modelId: layer.name,
            context: {
              source: 'runtime',
              kind: 'landmark',
              protected: isProtectedModel,
              visible: true,
              inWindow: true,
              sceneState: 'visible',
              memoryState: 'active',
              estimatedMemoryMB: 36,
              reason: 'layer-manager-register'
            }
          })
          sceneArbiter.releaseLoad(layer.name)
        }
      })

      glbSpatialController.syncRegisteredModelIds(activeSpatialModels)
      glbMemoryManager.syncRegisteredModelIds(activeSpatialModels)
      sceneWindowManager.syncRegisteredModelIds(activeSpatialModels)
      sceneArbiter.syncRegisteredModelIds(activeSpatialModels)
    })
  }, [
    currentRouteCumulativeDistances,
    currentRoutePath,
    glbMemoryManager,
    glbSpatialController,
    layerManager,
    protectedSceneModelIds,
    sceneArbiter,
    sceneStateManager,
    sceneWindowManager,
    spatialLandmarkOverlayLookup,
    perfRecorder
  ])

  useEffect(() => {
    return layerManager.subscribe((snapshot) => {
      perfRecorder.recordMapVisualEvent({
        type: 'layerManagerStateChanged',
        layerManagerCount: snapshot.length,
        layerManagerActiveLayers: snapshot.filter((layer) => layer.visible).map((layer) => layer.name),
        layerManagerSnapshot: snapshot.map((layer) => `${layer.name}:${layer.visible ? 'visible' : 'hidden'}:${layer.order}`).join(', ')
      })
    })
  }, [layerManager, perfRecorder])

  useEffect(() => {
    if (!mapVisualReadyForOverlays || startupStage === 'ready') {
      return
    }

    setStartupStage('ready')
    perfRecorder.recordMapVisualEvent({
      type: 'startupStageChanged',
      startupStage: 'ready',
      reason: 'overlays-ready'
    })
  }, [mapVisualReadyForOverlays, perfRecorder, startupStage, visualVariant.id])

  useEffect(() => {
    if (!shouldRedirectLocalTMapHost) {
      return
    }

    setStartupStage('loadingSdk')
    setPageMessage('正在切换到 localhost 以加载腾讯底图...')
    perfRecorder.recordMapVisualEvent({
      type: 'startupStageChanged',
      startupStage: 'loadingSdk',
      reason: 'canonical-localhost-for-tencent-map'
    })

    const nextUrl = buildCanonicalLocalhostUrl()
    if (nextUrl) {
      window.location.replace(nextUrl)
    }
  }, [perfRecorder, shouldRedirectLocalTMapHost])

  useEffect(() => {
    if (!bootstrapMapRuntime || shouldRedirectLocalTMapHost) {
      return
    }

    const generation = ++presentationGenerationRef.current
    const initialPresentation = activePresentationRef.current
    const abortController = new AbortController()
    let cancelled = false
    let createdMap: any = null
    let readyTimer: number | null = null
    let readyFallbackTimer: number | null = null
    let slowTimer: number | null = null
    let curtainTimer: number | null = null
    let readyRafIds: number[] = []
    let visualReadyScheduled = false
    let mapCreatedAt = 0
    const mapEventCleanups: Array<() => void> = []
    const interactionCleanups: Array<() => void> = []
    const isCurrentGeneration = () => !cancelled && generation === presentationGenerationRef.current

    const recordStartupStage = (stage: Map3DStartupStage, reason: string) => {
      setStartupStage(stage)
      perfRecorder.recordMapVisualEvent({
        type: 'startupStageChanged',
        startupStage: stage,
        reason
      })
    }

    const clearTimersAndListeners = () => {
      if (readyTimer !== null) window.clearTimeout(readyTimer)
      if (readyFallbackTimer !== null) window.clearTimeout(readyFallbackTimer)
      if (slowTimer !== null) window.clearTimeout(slowTimer)
      if (curtainTimer !== null) window.clearTimeout(curtainTimer)
      readyTimer = null
      readyFallbackTimer = null
      slowTimer = null
      curtainTimer = null
      readyRafIds.forEach((id) => window.cancelAnimationFrame(id))
      readyRafIds = []
      mapEventCleanups.splice(0).forEach((cleanup) => cleanup())
      interactionCleanups.splice(0).forEach((cleanup) => cleanup())
    }

    const clearOverlayRefs = () => {
      routeLayerRef.current = null
      tourRouteProgressLayerRef.current = null
      poiMarkerLayerRef.current = null
      userMarkerLayerRef.current = null
      rerouteLayerRef.current = null
      landmarkHighlightLayerRef.current = null
      decorMarkerLayerRef.current = null
      formalInkBoundsMarkerLayerRef.current = null
      formalInkBoundsBoundaryLayerRef.current = null
      formalInkBoundsFillLayerRef.current = null
      inkBoundsMarkerLayerRef.current = null
      inkBoundsBoundaryLayerRef.current = null
      inkTileLayerRef.current = null
      inkTileGroundFallbackLayerRef.current = null
      tencentCustomLayerInitKeyRef.current = ''
      updateCustomTileLayerRuntime({
        attached: false,
        visible: false,
        lastRefreshReason: 'standalone-map-destroyed'
      })
    }

    const disposeMap = () => {
      const map = createdMap
      clearTimersAndListeners()
      if (!map || !isMapInstanceUsable(map)) {
        createdMap = null
        return
      }

      if (mapRef.current === map) {
        onMapRuntimeChangeRef.current?.(null)
        mapRef.current = null
      }
      gltfModelRefs.current = new Map()
      sceneWindowManager.destroy()
      glbMemoryManager.destroy()
      glbSpatialController.destroy()
      poiLayerController.destroy()
      layerManager.destroy()
      clearOverlayRefs()
      destroyedMapInstancesRef.current.add(map)
      mapInstanceGenerationsRef.current.delete(map)
      activeMapInstanceGenerationRef.current = 0

      try {
        map.destroy?.()
        mapDestroyCountRef.current += 1
      } catch (error) {
        if (debugPerf) {
          console.warn('[map-validation] map destroy ignored', error)
        }
      }
      createdMap = null
    }

    const markVisualReady = (reason: string) => {
      if (!isCurrentGeneration() || !createdMap || !isMapInstanceCurrent(createdMap) || mapVisualReadyRef.current) {
        return
      }

      mapVisualReadyRef.current = true
      if (slowTimer !== null) {
        window.clearTimeout(slowTimer)
        slowTimer = null
      }
      setIsMapIdle(true)
      setIsMapVisualReady(true)
      setMapReadyTimedOut(false)
      initializedPresentationRef.current = initialPresentation
      appliedPresentationRef.current = initialPresentation
      setPresentationTransition('ready')
      updateCameraTransitionPhase('ready')
      setPresentationSwitchError(undefined)
      recordStartupStage('baseMapReady', reason)
      setPageMessage('腾讯地图与真实定位验证已就绪')
      perfRecorder.recordMapVisualEvent({ type: 'mapVisualReady', reason })

      curtainTimer = window.setTimeout(() => {
        if (!isCurrentGeneration()) return
        setLoadingCurtainVisible(false)
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
        perfRecorder.recordMapVisualEvent({
          type: 'loadingCurtainHidden',
          curtainDurationMs: mapLoadingCurtainShownAtRef.current === null
            ? undefined
            : Math.round(now - mapLoadingCurtainShownAtRef.current)
        })
      }, MAP_3D_GUIDE_CURTAIN_FADE_MS)
    }

    const scheduleVisualReady = (reason: string) => {
      if (
        !isCurrentGeneration() ||
        !createdMap ||
        !isMapInstanceCurrent(createdMap) ||
        mapVisualReadyRef.current ||
        visualReadyScheduled
      ) {
        return
      }

      visualReadyScheduled = true
      if (!mapFirstIdleRef.current) {
        mapFirstIdleRef.current = true
        setIsMapIdle(true)
        perfRecorder.recordMapVisualEvent({ type: 'mapFirstIdle', reason })
      }
      perfRecorder.recordMapVisualEvent({ type: 'baseMapEventReceived', reason })
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const remainingDelay = Math.max(0, MAP_3D_GUIDE_MIN_BASEMAP_READY_MS - (now - mapCreatedAt))
      readyTimer = window.setTimeout(() => {
        readyRafIds = [window.requestAnimationFrame(() => {
          const secondRaf = window.requestAnimationFrame(() => markVisualReady(reason))
          readyRafIds.push(secondRaf)
        })]
      }, remainingDelay)
    }

    async function initStandaloneMap() {
      const mapElement = mapElementRef.current
      if (!mapElement || !isCurrentGeneration()) return

      setMapStatus('loading')
      setPresentationTransition('waiting-container')
      updateCameraTransitionPhase('idle')
      setIsMapCreated(false)
      setIsMapIdle(false)
      setIsMapVisualReady(false)
      setMapReadyTimedOut(false)
      setLoadingCurtainVisible(true)
      mapVisualReadyRef.current = false
      mapFirstIdleRef.current = false
      mapOverlaysStartedRef.current = false
      mapRoutePoiShownRef.current = false
      entryCameraPlayedRef.current = false
      mapLoadingCurtainShownAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
      setPageMessage('正在加载腾讯地图真实底座...')
      recordStartupStage('loadingSdk', 'standalone-validation-init')
      perfRecorder.markStageStart('mapInit')
      perfRecorder.recordMapVisualEvent({ type: 'loadingCurtainShown' })
      perfRecorder.recordMapVisualEvent({ type: 'tmapScriptLoadStarted', reason: 'standalone-validation' })

      const containerReady = await waitForMapContainerLayout(mapElement, isCurrentGeneration, abortController.signal)
      if (!containerReady || !isCurrentGeneration()) {
        throw new Error('地图容器尚未完成布局')
      }

      setPresentationTransition('initializing')
      slowTimer = window.setTimeout(() => {
        if (!isCurrentGeneration() || mapVisualReadyRef.current) return
        setMapReadyTimedOut(true)
        setPageMessage('地图底图加载较慢，正在继续连接腾讯地图')
        recordStartupStage('slow', 'standalone-visual-ready-timeout')
      }, MAP_3D_GUIDE_SLOW_READY_MS)

      const TMap = await loadTMap()
      if (!isCurrentGeneration() || !mapElementRef.current) return
      perfRecorder.recordMapVisualEvent({ type: 'tmapScriptLoaded', reason: 'standalone-validation' })
      recordStartupStage('creatingMap', 'standalone-tmap-loaded')

      const preservedViewport = presentationViewportRef.current
      const initialViewMode = initialPresentation === 'ink2d' ? '2D' : '3D'
      mapCreatedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const map = new TMap.Map(mapElementRef.current, {
        center: new TMap.LatLng(
          preservedViewport?.center.lat ?? scenicCenter.lat,
          preservedViewport?.center.lng ?? scenicCenter.lng
        ),
        zoom: preservedViewport?.zoom ?? (initialPresentation === 'ink2d' ? INK_2D_INITIAL_ZOOM : MAP_3D_GUIDE_INITIAL_ZOOM),
        minZoom: INK_2D_MIN_ZOOM,
        maxZoom: INK_MAP_MAX_ZOOM,
        viewMode: initialViewMode,
        pitch: initialViewMode === '2D' ? 0 : MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.pitch,
        rotation: initialViewMode === '2D' ? 0 : MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.rotation,
        mapStyleId: MAP_3D_GUIDE_STYLE_ID,
        showControl: false,
        baseMap: getMapBaseMapConfig({ clean: false, showNativePoiLabels: poiLayerMode === 'all' }),
        renderOptions: MAP_3D_GUIDE_RENDER_OPTIONS
      })

      if (!isCurrentGeneration()) {
        try { map?.destroy?.() } catch { /* stale constructor result */ }
        return
      }

      createdMap = map
      const mapInstanceGeneration = ++mapInstanceGenerationCounterRef.current
      mapInstanceGenerationsRef.current.set(map, mapInstanceGeneration)
      activeMapInstanceGenerationRef.current = mapInstanceGeneration
      mapRef.current = map
      onMapRuntimeChangeRef.current?.({ map, TMap, mapInstanceId: mapInstanceGeneration })
      layerManager.init(map)
      poiLayerController.init(map)
      glbSpatialController.init(map)
      glbMemoryManager.init(map)
      sceneWindowManager.init()
      mapCreateCountRef.current += 1
      setMapInstanceId(mapInstanceGeneration)
      setIsMapCreated(true)
      setMapStyleSupport(inspectMapStyleSupport(map, TMap))
      setMapStatus('ready')
      setPageMessage('正在等待腾讯底图首帧...')
      recordStartupStage('waitingBaseMap', 'standalone-map-created')
      perfRecorder.markStageEnd('mapInit')
      perfRecorder.recordMapVisualEvent({ type: 'mapCreated' })

      ;['idle', 'tilesloaded', 'rendercomplete'].forEach((eventName) => {
        const handler = () => scheduleVisualReady(eventName)
        map.on?.(eventName, handler)
        mapEventCleanups.push(() => map.off?.(eventName, handler))
      })
      readyFallbackTimer = window.setTimeout(
        () => scheduleVisualReady('standalone-ready-fallback'),
        MAP_3D_GUIDE_FALLBACK_BASEMAP_READY_MS
      )

      const interactionEndEvents = ['zoomend', 'dragend', 'moveend', 'idle']
      interactionEndEvents.forEach((eventName) => {
        const handler = () => {
          if (!isCurrentGeneration() || !isMapInstanceCurrent(map)) return
          updateCurrentMapZoomSnapshot()
          scheduleMapInteractionLiteExit(
            eventName === 'zoomend' ? 'zoom' : eventName === 'dragend' ? 'drag' : 'move',
            eventName
          )
        }
        map.on?.(eventName, handler)
        interactionCleanups.push(() => map.off?.(eventName, handler))
      })
    }

    void initStandaloneMap().catch((error) => {
      if (!isCurrentGeneration()) return
      const message = error instanceof Error ? error.message : '腾讯地图加载失败'
      perfRecorder.markStageEnd('mapInit')
      setLastMapError(message)
      setMapStatus('error')
      setMapReadyTimedOut(true)
      setIsMapVisualReady(false)
      setLoadingCurtainVisible(true)
      setPresentationSwitchError(message)
      setPresentationTransition('failed')
      updateCameraTransitionPhase('failed')
      setPageMessage(message)
      recordStartupStage('failed', 'standalone-map-load-error')
      perfRecorder.recordMapVisualEvent({ type: 'mapFailed', reason: 'standalone-map-load-error' })
    })

    return () => {
      cancelled = true
      abortController.abort()
      presentationGenerationRef.current += 1
      mapAttemptGenerationRef.current += 1
      if (mapInteractionRef.current.exitTimerId !== undefined) {
        window.clearTimeout(mapInteractionRef.current.exitTimerId)
        mapInteractionRef.current.exitTimerId = undefined
      }
      disposeMap()
    }
  }, [
    bootstrapMapRuntime,
    debugPerf,
    glbMemoryManager,
    glbSpatialController,
    isMapInstanceCurrent,
    isMapInstanceUsable,
    layerManager,
    mapRuntimeGeneration,
    perfRecorder,
    poiLayerController,
    sceneWindowManager,
    shouldRedirectLocalTMapHost,
    updateCameraTransitionPhase,
    updateCustomTileLayerRuntime
  ])

  useEffect(() => {
    const targetMap = mapRef.current
    const targetGeneration = targetMap ? mapInstanceGenerationsRef.current.get(targetMap) : undefined
    const previousPresentation = initializedPresentationRef.current
    if (
      !targetMap ||
      !targetGeneration ||
      !isMapInstanceCurrent(targetMap) ||
      mapStatus !== 'ready' ||
      previousPresentation === null ||
      previousPresentation === scenicMapPresentation
    ) {
      return
    }

    const transitionGeneration = ++presentationSwitchGenerationRef.current
    const abortController = new AbortController()
    let cancelled = false
    const isCurrentTransition = () =>
      !cancelled &&
      transitionGeneration === presentationSwitchGenerationRef.current &&
      isMapInstanceCurrent(targetMap) &&
      mapInstanceGenerationsRef.current.get(targetMap) === targetGeneration

    const apply = async () => {
      setPresentationTransition('waiting-container')
      setPresentationSwitchError(undefined)
      const container = mapElementRef.current
      if (!container || !(await waitForMapContainerLayout(container, isCurrentTransition, abortController.signal)) || !isCurrentTransition()) {
        return
      }

      setPresentationTransition('initializing')
      try {
        const switchingFrom3DTo2D = previousPresentation === 'scenic3d' && scenicMapPresentation === 'ink2d'
        suppress3DCameraPersistenceRef.current = true
        if (switchingFrom3DTo2D) {
          const real3DCamera = readActualTencentCameraState(targetMap)
          if (real3DCamera.viewMode === '3D') {
            const savedCamera = cameraStateFromActual(real3DCamera, camera3DStateRef.current, 'scenic3d')
            camera3DStateRef.current = savedCamera
            lastMeaningful3DCameraRef.current = savedCamera
            cameraPersistenceDiagnosticsRef.current.lastPersistReason = 'before-flattening-3d-to-2d'
          } else {
            cameraPersistenceDiagnosticsRef.current.lastRejectedPersistReason =
              `before-flattening: view-mode-${real3DCamera.viewMode ?? 'unknown'}`
          }
        }
        const currentCamera = readMapCameraState(targetMap, scenicCenter)
        if (previousPresentation === 'ink2d') {
          camera2DStateRef.current = currentCamera
        }
        const targetCamera: CameraState = scenicMapPresentation === 'ink2d'
          ? {
              center: currentCamera.center,
              zoom: currentCamera.zoom,
              pitch: 0,
              rotation: 0
            }
          : lastMeaningful3DCameraRef.current ?? camera3DStateRef.current
        const presentationResult = await applyPresentationToExistingMap({
          map: targetMap,
          TMap: window.TMap,
          presentation: scenicMapPresentation,
          requestedCamera: targetCamera,
          isCurrent: isCurrentTransition,
          onPhase: updateCameraTransitionPhase
        })
        if (!presentationResult.ok) {
          throw new Error(presentationResult.error ?? '腾讯地图视图模式验证失败')
        }
        if (scenicMapPresentation === 'ink2d') {
          updateCameraTransitionPhase('refreshing-tile-layer')
          await refreshHostedCustomTileLayer(targetMap, 'presentation-verified-2d', isCurrentTransition)
        }
        if (!isCurrentTransition()) {
          return
        }
        const verifiedCamera = cameraStateFromActual(presentationResult.actualCamera, targetCamera, scenicMapPresentation)
        if (scenicMapPresentation === 'ink2d') {
          camera2DStateRef.current = verifiedCamera
        } else {
          camera3DStateRef.current = verifiedCamera
          lastMeaningful3DCameraRef.current = verifiedCamera
          cameraPersistenceDiagnosticsRef.current.lastPersistReason = 'verified-3d-restore'
        }
        initializedPresentationRef.current = scenicMapPresentation
        appliedPresentationRef.current = scenicMapPresentation
        setPresentationTransition('ready')
        updateCameraTransitionPhase('ready')
        suppress3DCameraPersistenceRef.current = false
        perfRecorder.recordMapVisualEvent({
          type: 'scenicMapPresentationChanged',
          scenicMapPresentation,
          reason: 'single-map-runtime-switch'
        })
      } catch (error) {
        if (!isCurrentTransition()) {
          return
        }
        const message = error instanceof Error ? error.message : '地图视角切换失败'
        setLastMapError(message)
        setPresentationSwitchError(message)
        setPresentationTransition('failed')
        updateCameraTransitionPhase('failed')
        const restoredPresentation = previousPresentation
        const restoreCamera = previousPresentation === 'ink2d' ? camera2DStateRef.current : camera3DStateRef.current
        const restoreResult = await applyPresentationToExistingMap({
          map: targetMap,
          TMap: window.TMap,
          presentation: restoredPresentation,
          requestedCamera: restoreCamera,
          isCurrent: isCurrentTransition,
          onPhase: () => undefined
        })
        if (restoreResult.ok && isCurrentTransition()) {
          initializedPresentationRef.current = restoredPresentation
          appliedPresentationRef.current = restoredPresentation
          const verifiedRestoreCamera = cameraStateFromActual(restoreResult.actualCamera, restoreCamera, restoredPresentation)
          if (restoredPresentation === 'ink2d') {
            camera2DStateRef.current = verifiedRestoreCamera
          } else {
            camera3DStateRef.current = verifiedRestoreCamera
            lastMeaningful3DCameraRef.current = verifiedRestoreCamera
            cameraPersistenceDiagnosticsRef.current.lastPersistReason = 'verified-3d-failure-restore'
          }
          setPresentationFallback(restoredPresentation)
          replaceMapPresentationInUrl(navigate, restoredPresentation)
        }
        suppress3DCameraPersistenceRef.current = false
      }
    }

    void apply()
    return () => {
      cancelled = true
      abortController.abort()
      presentationSwitchGenerationRef.current += 1
      suppress3DCameraPersistenceRef.current = false
    }
  }, [
    isMapInstanceCurrent,
    mapStatus,
    navigate,
    perfRecorder,
    refreshHostedCustomTileLayer,
    scenicMapPresentation,
    updateCameraTransitionPhase
  ])

  useEffect(() => {
    if (mapStatus !== 'ready' || entryCameraPlayedRef.current || isInkCleanMode || cameraScope === 'navigation') {
      return
    }

    entryCameraPlayedRef.current = true
    if (isRouteGuideView) {
      // Route state owns its camera through mapFocusMode. Do not overwrite a
      // route-fit camera with the generic estate entry preset.
      return
    }

    const entryTarget = scenicCenter

    if (isInk2DPresentation) {
      setActiveCameraMode('routeOverview')
      moveMapCamera(entryTarget, INK_2D_CAMERA_PRESET)
      return
    }

    setActiveCameraMode('overviewEstate')
    moveMapCamera(entryTarget, MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate)
  }, [cameraScope, isInk2DPresentation, isInkCleanMode, isRouteGuideView, mapStatus])

  useEffect(() => {
    if (!isInkCleanMode || mapStatus !== 'ready' || !mapRef.current || !window.TMap) {
      return
    }

    stopActiveTour('interrupted')
    const inkExportCamera = getConfiguredInkBoundsCamera(mapElementRef.current, { squareViewport: inkUseSquareExportCamera })
    applyInkCleanMapCamera(
      mapRef.current,
      window.TMap,
      inkExportCamera?.center ?? routeCenter,
      inkExportCamera?.zoom ?? SCENIC_CAMERA_BOUNDS.defaultZoom
    )
    setActiveCameraMode('overviewEstate')
  }, [inkUseSquareExportCamera, isInkCleanMode, mapStatus])

  useEffect(() => {
    if (!mapVisualReadyForOverlays || mapOverlaysStartedRef.current) {
      return
    }

    mapOverlaysStartedRef.current = true
    setStartupStage('overlaysReady')
    perfRecorder.recordMapVisualEvent({
      type: 'startupStageChanged',
      startupStage: 'overlaysReady',
      reason: 'visual-ready-overlays'
    })
    perfRecorder.recordMapVisualEvent({
      type: 'overlaysStart',
      reason: 'visual-ready'
    })
  }, [mapVisualReadyForOverlays, perfRecorder])

  useEffect(() => {
    const targetMap = mapRef.current
    if (mapStatus !== 'ready' || !targetMap || !isMapInstanceCurrent(targetMap)) {
      return
    }

    const showNativePoiLabels = poiLayerMode === 'all'
    const poiModeResult = applyTencentBaseMapPoiMode(targetMap, {
      clean: isInkCleanMode,
      showNativePoiLabels
    })
    setTencentPoiMode({
      requested: showNativePoiLabels,
      applied: showNativePoiLabels && poiModeResult.applied,
      lastError: poiModeResult.lastError
    })

    if (isRouteGuideView || poiLayerMode !== 'all') {
      return
    }

    const handleNativePoiClick = (event: any) => {
      if (!isMapInstanceCurrent(targetMap)) {
        return
      }
      const nativePoi = event?.poi ?? event?.poiInfo ?? event?.detail?.poi ?? event?.detail?.poiInfo
      if (!nativePoi) {
        return
      }
      // All-POI mode deliberately belongs to the Tencent base map. Unknown
      // and known native labels share the same lightweight, non-navigating
      // response until their public detail content is complete.
      setPageMessage('该景点详情正在完善')
    }

    targetMap.on?.('click', handleNativePoiClick)
    return () => {
      if (isMapInstanceUsable(targetMap)) {
        targetMap.off?.('click', handleNativePoiClick)
      }
    }
  }, [isInkCleanMode, isMapInstanceCurrent, isMapInstanceUsable, isRouteGuideView, mapStatus, poiLayerMode])

  useEffect(() => {
    const targetMap = mapRef.current
    if (mapStatus !== 'ready' || !targetMap || !isMapInstanceCurrent(targetMap)) {
      return
    }

    const handleManualMapClick = () => {
      if (debugInkBounds) {
        return
      }

      if (tourPlaybackRef.current) {
        stopActiveTour('interrupted')
      }
    }

    targetMap.on?.('click', handleManualMapClick)

    return () => {
      if (isMapInstanceUsable(targetMap)) {
        targetMap.off?.('click', handleManualMapClick)
      }
    }
  }, [debugInkBounds, isMapInstanceCurrent, isMapInstanceUsable, mapStatus])

  useEffect(() => {
    formalInkBoundsMarkerLayerRef.current?.setMap?.(null)
    formalInkBoundsBoundaryLayerRef.current?.setMap?.(null)
    formalInkBoundsFillLayerRef.current?.setMap?.(null)
    formalInkBoundsMarkerLayerRef.current = null
    formalInkBoundsBoundaryLayerRef.current = null
    formalInkBoundsFillLayerRef.current = null

    if (!showFormalInkBounds || !mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      return
    }

    const formalBounds = getConfiguredInkBoundsDraft()
    const cornerPath = inkMapBoundCornerOrder.map((corner) => formalBounds[corner]).filter((point): point is LatLngPoint => Boolean(point))
    const boundaryPath = getInkBoundsBoundaryPath(formalBounds)

    if (cornerPath.length >= 4 && window.TMap.MultiPolygon && window.TMap.PolygonStyle) {
      formalInkBoundsFillLayerRef.current = new window.TMap.MultiPolygon({
        map: mapRef.current,
        styles: {
          formalInkBoundsFill: new window.TMap.PolygonStyle({
            color: 'rgba(201, 168, 106, 0.10)',
            borderColor: 'rgba(31, 59, 49, 0.42)',
            borderWidth: 2,
            showBorder: true,
            borderDashArray: [10, 8]
          })
        },
        geometries: [
          {
            id: 'formal-ink-map-bounds-fill',
            styleId: 'formalInkBoundsFill',
            paths: cornerPath.map(toTMapLatLng),
            rank: 82,
            properties: {
              title: '水墨底图正式覆盖范围 / 4096×4096'
            }
          }
        ]
      })
    }

    if (boundaryPath.length >= 2 && window.TMap.MultiPolyline && window.TMap.PolylineStyle) {
      formalInkBoundsBoundaryLayerRef.current = new window.TMap.MultiPolyline({
        map: mapRef.current,
        styles: {
          formalInkBounds: new window.TMap.PolylineStyle({
            color: 'rgba(201, 168, 106, 0.92)',
            width: 4,
            borderWidth: 2,
            borderColor: 'rgba(31, 59, 49, 0.55)',
            lineCap: 'round',
            borderDashArray: [10, 8]
          })
        },
        geometries: [
          {
            id: 'formal-ink-map-bounds-outline',
            styleId: 'formalInkBounds',
            paths: boundaryPath.map(toTMapLatLng),
            rank: 86,
            properties: {
              title: '水墨底图正式覆盖范围 / 4096×4096'
            }
          }
        ]
      })
    }

    formalInkBoundsMarkerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: Object.fromEntries(
        inkMapBoundCornerOrder.map((corner) => [
          corner,
          new window.TMap.MarkerStyle({
            width: 42,
            height: 34,
            anchor: { x: 21, y: 17 },
            src: createSvgDataUrl(formalInkBoundsCornerSvg(inkMapBoundCornerShortLabels[corner]))
          })
        ])
      ),
      geometries: inkMapBoundCornerOrder.map((corner) => ({
        id: `formal-ink-bound-${corner}`,
        styleId: corner,
        position: toTMapLatLng(formalBounds[corner] as LatLngPoint),
        rank: 92,
        properties: {
          title: inkMapBoundCornerLabels[corner]
        }
      }))
    })

    return () => {
      formalInkBoundsMarkerLayerRef.current?.setMap?.(null)
      formalInkBoundsBoundaryLayerRef.current?.setMap?.(null)
      formalInkBoundsFillLayerRef.current?.setMap?.(null)
      formalInkBoundsMarkerLayerRef.current = null
      formalInkBoundsBoundaryLayerRef.current = null
      formalInkBoundsFillLayerRef.current = null
    }
  }, [mapVisualReadyForOverlays, showFormalInkBounds])

  useEffect(() => {
    const recordInkOverlayEvent = (event: {
      inkOverlayEnabled: boolean
      inkOverlayLayerReady: boolean
      inkOverlayLayerMode: 'native' | 'dom' | 'none'
      inkOverlayLayerError?: string
      inkOverlayCameraMode: InkOverlayCameraMode
      inkOverlayEffectiveOpacity: number
      inkOverlaySuppressedReason?: string
    }) => {
      const payload = {
        type: 'inkOverlayStateChanged' as const,
        inkOverlaySource,
        inkOverlayImageUrl,
        inkOverlayOpacity,
        inkOverlayOffsetX: inkOverlayAdjustments.offsetX,
        inkOverlayOffsetY: inkOverlayAdjustments.offsetY,
        inkOverlayScaleX: inkOverlayAdjustments.scaleX,
        inkOverlayScaleY: inkOverlayAdjustments.scaleY,
        inkOverlayCompare,
        inkOverlayBounds: formatConfiguredInkBoundsForPerf(),
        ...event
      }
      const signature = JSON.stringify(payload)

      if (signature === inkOverlayPerfSignatureRef.current) {
        return
      }

      inkOverlayPerfSignatureRef.current = signature
      perfRecorder.recordMapVisualEvent(payload)
    }

    if (!inkOverlayEnabled) {
      inkOverlayImageReadyRef.current = false
      inkOverlayLayerErrorRef.current = ''
      const offCameraState: InkOverlayCameraState = {
        mode: 'off',
        effectiveOpacity: 0,
        pitch: 0,
        rotation: 0
      }
      updateInkOverlayCameraSnapshot(offCameraState, inkOverlayCameraStateRef, setInkOverlayCameraSnapshot)
      setInkOverlayLayerReady(false)
      setInkOverlayLayerError('')
      recordInkOverlayEvent({
        inkOverlayEnabled: false,
        inkOverlayLayerReady: false,
        inkOverlayLayerMode: 'none',
        inkOverlayCameraMode: offCameraState.mode,
        inkOverlayEffectiveOpacity: offCameraState.effectiveOpacity
      })
      return
    }

    if (!mapVisualReadyForOverlays || !mapRef.current || !window.TMap || !mapElementRef.current) {
      return
    }

    let rafId = 0
    const scheduleUpdate = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      rafId = window.requestAnimationFrame(() => {
        const cameraState = getInkOverlayCameraState(mapRef.current, inkOverlayOpacity)
        updateInkOverlayCameraSnapshot(cameraState, inkOverlayCameraStateRef, setInkOverlayCameraSnapshot)

        if (inkOverlayLayerRef.current) {
          inkOverlayLayerRef.current.dataset.cameraMode = cameraState.mode
          inkOverlayLayerRef.current.style.opacity = String(cameraState.effectiveOpacity)
        }

        if (cameraState.mode === 'disabled3d') {
          if (inkOverlayLayerRef.current) {
            inkOverlayLayerRef.current.style.display = 'none'
          }
          recordInkOverlayEvent({
            inkOverlayEnabled: true,
            inkOverlayLayerReady: inkOverlayImageReadyRef.current,
            inkOverlayLayerMode: 'dom',
            inkOverlayLayerError: inkOverlayLayerErrorRef.current || undefined,
            inkOverlayCameraMode: cameraState.mode,
            inkOverlayEffectiveOpacity: cameraState.effectiveOpacity,
            inkOverlaySuppressedReason: cameraState.reason
          })
          return
        }

        const result = positionInkOverlayDomLayer({
          layer: inkOverlayLayerRef.current,
          map: mapRef.current,
          TMap: window.TMap,
          mapElement: mapElementRef.current,
          adjustments: inkOverlayAdjustments
        })

        if (!result.ok) {
          setInkOverlayLayerError(result.error)
          inkOverlayLayerErrorRef.current = result.error
          recordInkOverlayEvent({
            inkOverlayEnabled: true,
            inkOverlayLayerReady: false,
            inkOverlayLayerError: result.error,
            inkOverlayLayerMode: result.mode,
            inkOverlayCameraMode: cameraState.mode,
            inkOverlayEffectiveOpacity: cameraState.effectiveOpacity,
            inkOverlaySuppressedReason: cameraState.reason
          })
          return
        }

        if (inkOverlayLayerRef.current) {
          inkOverlayLayerRef.current.style.opacity = String(cameraState.effectiveOpacity)
        }

        recordInkOverlayEvent({
          inkOverlayEnabled: true,
          inkOverlayLayerReady: inkOverlayImageReadyRef.current,
          inkOverlayLayerError: inkOverlayLayerErrorRef.current || undefined,
          inkOverlayLayerMode: result.mode,
          inkOverlayCameraMode: cameraState.mode,
          inkOverlayEffectiveOpacity: cameraState.effectiveOpacity,
          inkOverlaySuppressedReason: cameraState.reason
        })
      })
    }

    scheduleUpdate()

    const mapEvents = ['idle', 'move', 'moving', 'zoom', 'zoom_changed', 'rotate', 'pitch', 'bounds_changed', 'resize']
    mapEvents.forEach((eventName) => mapRef.current?.on?.(eventName, scheduleUpdate))
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      mapEvents.forEach((eventName) => mapRef.current?.off?.(eventName, scheduleUpdate))
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [inkOverlayAdjustments, inkOverlayCompare, inkOverlayEnabled, inkOverlayImageUrl, inkOverlayOpacity, inkOverlaySource, mapVisualReadyForOverlays, perfRecorder])

  useEffect(() => {
    // 官方托管图层只跟地图 ready / 启用状态绑定，不跟本地瓦片 opacity/source 绑定，避免普通重渲染重复 createCustomLayer。
    const targetMap = mapRef.current
    const targetMapGeneration = targetMap ? mapInstanceGenerationsRef.current.get(targetMap) : undefined
    let ownedLayer: any = null
    const isTargetMapCurrent = () =>
      Boolean(
        targetMap &&
        targetMapGeneration &&
        isMapInstanceCurrent(targetMap) &&
        mapInstanceGenerationsRef.current.get(targetMap) === targetMapGeneration
      )
    const recordInkTileEvent = (event: {
      inkTilesEnabled: boolean
      inkTileLayerReady: boolean
      inkTileLayerError?: string
      mapBoundaryEnabled?: boolean
    }) => {
      const zoomFade = getInkTileZoomFade(currentZoomRef.current)
      const useHostedTencentLayer = ENABLE_TENCENT_CUSTOM_LAYER
      const currentEffectiveOpacity = useHostedTencentLayer
        ? TENCENT_CUSTOM_LAYER_CONFIG.opacity
        : getInkTileEffectiveOpacity(inkTileOpacity, currentZoomRef.current)
      const currentOpacityBase = useHostedTencentLayer ? TENCENT_CUSTOM_LAYER_CONFIG.opacity : inkTileOpacity
      const currentZoomFade = useHostedTencentLayer ? 1 : zoomFade
      const usingFallbackZoom = Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM
      const payload = {
        type: 'inkTileLayerStateChanged' as const,
        inkTileDefaultEnabled: ENABLE_INK_TILES_BY_DEFAULT,
        noInkTilesOverride,
        inkTileOpacity: currentEffectiveOpacity,
        inkTileOpacityBase: currentOpacityBase,
        inkTileOpacityEffective: currentEffectiveOpacity,
        inkTileZoomFade: currentZoomFade,
        inkTileUrlTemplate: useHostedTencentLayer ? `tencent-custom-layer:${TENCENT_CUSTOM_LAYER_ID}` : inkTileSourceConfig.tileUrlTemplate,
        inkTileEmptyUrl: useHostedTencentLayer ? undefined : inkTileSourceConfig.blankUrl,
        inkTileZoomLevels: useHostedTencentLayer
          ? [TENCENT_CUSTOM_LAYER_CONFIG.minZoom, TENCENT_CUSTOM_LAYER_CONFIG.maxZoom]
          : [...LINGSHAN_INK_TILE_ZOOM_LEVELS],
        inkTileMaxNativeZoom: useHostedTencentLayer ? TENCENT_CUSTOM_LAYER_CONFIG.maxZoom : LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileUsingFallbackZoom: useHostedTencentLayer ? false : usingFallbackZoom,
        inkTileFallbackFromZ: !useHostedTencentLayer && usingFallbackZoom ? Math.floor(currentZoomRef.current) : undefined,
        inkTileFallbackToZ: useHostedTencentLayer ? undefined : LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileBounds: formatConfiguredInkBoundsForPerf(),
        inkTileMode: event.inkTilesEnabled ? (useHostedTencentLayer ? ('tencent-custom-layer' as const) : ('web-mercator-local' as const)) : ('none' as const),
        inkTileSource,
        inkTileXRangeByZoom: useHostedTencentLayer ? undefined : formatLingshanInkTileXRangeByZoom(),
        inkTileYRangeByZoom: useHostedTencentLayer ? undefined : formatLingshanInkTileYRangeByZoom(),
        sourceImageWidth: useHostedTencentLayer ? undefined : inkTileSourceConfig.sourceWidth,
        sourceImageHeight: useHostedTencentLayer ? undefined : inkTileSourceConfig.sourceHeight,
        sourceImageStandard: useHostedTencentLayer ? undefined : inkTileSourceConfig.sourceImageStandard,
        sourceImageWarning: useHostedTencentLayer ? undefined : inkTileSourceConfig.sourceImageWarning,
        ...event
      }
      const signature = JSON.stringify(payload)

      if (signature === inkTilePerfSignatureRef.current) {
        return
      }

      inkTilePerfSignatureRef.current = signature
      perfRecorder.recordMapVisualEvent(payload)
    }

    const cleanupLayer = () => {
      if (inkTileFallbackTimerRef.current !== null) {
        window.clearTimeout(inkTileFallbackTimerRef.current)
        inkTileFallbackTimerRef.current = null
      }
      const layer = ownedLayer ?? (isTargetMapCurrent() ? inkTileLayerRef.current : null)

      if (!layer) {
        updateCustomTileLayerRuntime({ attached: false, visible: false, lastRefreshReason: 'layer-cleanup' })
        return
      }

      if (!targetMap || !isMapInstanceUsable(targetMap)) {
        if (inkTileLayerRef.current === layer) {
          inkTileLayerRef.current = null
          tencentCustomLayerInitKeyRef.current = ''
        }
        updateCustomTileLayerRuntime({ attached: false, visible: false, lastRefreshReason: 'stale-layer-cleanup' })
        ownedLayer = null
        return
      }

      const managedName = layerManager.getLayer('custom_tile') === layer
        ? 'custom_tile'
        : layerManager.getLayer('custom_tile_fallback') === layer
          ? 'custom_tile_fallback'
          : undefined

      if (managedName) {
        layerManager.removeLayer(managedName, layer)
      } else {
        try {
          layer.setMap?.(null)
        } catch {
          // Some Tencent layer versions only expose map.removeLayer/destroy.
        }

        try {
          targetMap.removeLayer?.(layer)
        } catch {
          // Optional cleanup path.
        }

        try {
          layer.destroy?.()
        } catch {
          // Optional cleanup path.
        }
      }

      if (inkTileLayerRef.current === layer) {
        inkTileLayerRef.current = null
        tencentCustomLayerInitKeyRef.current = ''
      }
      updateCustomTileLayerRuntime({ attached: false, visible: false, lastRefreshReason: 'layer-cleanup' })
      ownedLayer = null
    }

    cleanupLayer()
    inkTileNativeRequestCountRef.current = 0

    if (!inkTilesEnabled) {
      setInkTileDomFallbackActive(false)
      recordInkTileEvent({
        inkTilesEnabled: false,
        inkTileLayerReady: false,
        mapBoundaryEnabled: false
      })
      return
    }

    if (!mapVisualReadyForOverlays || !targetMap || !isTargetMapCurrent() || !window.TMap) {
      setInkTileDomFallbackActive(false)
      recordInkTileEvent({
        inkTilesEnabled: true,
        inkTileLayerReady: false,
        mapBoundaryEnabled: false
      })
      return
    }

    const ImageTileLayer = window.TMap?.ImageTileLayer
    const createCustomLayer = ImageTileLayer?.createCustomLayer

    if (ENABLE_TENCENT_CUSTOM_LAYER) {
      let disposed = false
      const removeDetachedLayer = (layer: any) => {
        if (!layer) {
          return
        }

        // Once Tencent Map has been destroyed its layer APIs can dereference
        // an internal null layer registry (`getLayer`). The map destroy already
        // owns that cleanup, so stale promise results are simply abandoned.
        if (!targetMap || !isMapInstanceUsable(targetMap)) {
          return
        }

        try {
          layer.setMap?.(null)
        } catch {
          // Optional cleanup path.
        }

        try {
          targetMap?.removeLayer?.(layer)
        } catch {
          // Optional cleanup path.
        }

        try {
          layer.destroy?.()
        } catch {
          // Optional cleanup path.
        }
      }
      const cleanupHostedLayer = () => {
        disposed = true
        cleanupLayer()
      }

      const customLayerInitKey = `${TENCENT_CUSTOM_LAYER_ID}:${TENCENT_CUSTOM_LAYER_CONFIG.minZoom}:${TENCENT_CUSTOM_LAYER_CONFIG.maxZoom}`

      if (typeof createCustomLayer !== 'function') {
        const message = 'TMap.ImageTileLayer.createCustomLayer 不可用，无法加载腾讯托管自定义图层'
        console.error('[Map3D] 腾讯官方自定义图层加载失败:', TENCENT_CUSTOM_LAYER_ID, {
          reason: 'createCustomLayer 不可用',
          layerName: TENCENT_CUSTOM_LAYER_NAME,
          ImageTileLayer
        })
        setInkTileDomFallbackActive(false)
        recordInkTileEvent({
          inkTilesEnabled: true,
          inkTileLayerReady: false,
          inkTileLayerError: message,
          mapBoundaryEnabled: true
        })
        return cleanupHostedLayer
      }

      try {
        setInkTileDomFallbackActive(false)
        console.log('[Map3D] 开始加载腾讯官方自定义图层:', TENCENT_CUSTOM_LAYER_ID, {
          layerName: TENCENT_CUSTOM_LAYER_NAME,
          config: TENCENT_CUSTOM_LAYER_CONFIG
        })

        const attachHostedLayer = (layer: any) => {
          if (disposed || !isTargetMapCurrent()) {
            removeDetachedLayer(layer)
            return
          }

          if (!layer) {
            console.error('[Map3D] 腾讯官方自定义图层加载失败:', TENCENT_CUSTOM_LAYER_ID, {
              reason: 'createCustomLayer 返回空对象',
              layerName: TENCENT_CUSTOM_LAYER_NAME
            })
            recordInkTileEvent({
              inkTilesEnabled: true,
              inkTileLayerReady: false,
              inkTileLayerError: '腾讯托管自定义图层创建返回空对象',
              mapBoundaryEnabled: true
            })
            return
          }

          ownedLayer = layer
          inkTileLayerRef.current = layer
          tencentCustomLayerInitKeyRef.current = customLayerInitKey
          layerManager.registerLayer('custom_tile', layer, targetMap)
          updateCustomTileLayerRuntime({ attached: true, visible: true, lastRefreshReason: 'custom-layer-attached' })

          try {
            layer.setOpacity?.(TENCENT_CUSTOM_LAYER_CONFIG.opacity)
          } catch {
            // Constructor opacity covers the common path.
          }

          console.log('[Map3D] 腾讯官方自定义图层加载成功:', TENCENT_CUSTOM_LAYER_ID, {
            layerName: TENCENT_CUSTOM_LAYER_NAME,
            initKey: tencentCustomLayerInitKeyRef.current,
            layer
          })
          recordInkTileEvent({
            inkTilesEnabled: true,
            inkTileLayerReady: true,
            mapBoundaryEnabled: true
          })
        }

        const maybeLayer = createCustomLayer.call(ImageTileLayer, {
          layerId: TENCENT_CUSTOM_LAYER_ID,
          map: targetMap,
          ...TENCENT_CUSTOM_LAYER_CONFIG
        })

        if (maybeLayer && typeof maybeLayer.then === 'function') {
          maybeLayer.then(attachHostedLayer).catch((error: unknown) => {
            if (disposed || !isTargetMapCurrent()) {
              return
            }

            const message = error instanceof Error ? error.message : '腾讯托管自定义图层创建失败'
            console.error('[Map3D] 腾讯官方自定义图层加载失败:', TENCENT_CUSTOM_LAYER_ID, {
              layerName: TENCENT_CUSTOM_LAYER_NAME,
              error
            })
            recordInkTileEvent({
              inkTilesEnabled: true,
              inkTileLayerReady: false,
              inkTileLayerError: message,
              mapBoundaryEnabled: true
            })
          })
        } else {
          attachHostedLayer(maybeLayer)
        }
      } catch (error) {
        cleanupLayer()
        const message = error instanceof Error ? error.message : '腾讯托管自定义图层创建失败'
        console.error('[Map3D] 腾讯官方自定义图层加载失败:', TENCENT_CUSTOM_LAYER_ID, {
          reason: 'createCustomLayer 抛出异常',
          layerName: TENCENT_CUSTOM_LAYER_NAME,
          error
        })
        recordInkTileEvent({
          inkTilesEnabled: true,
          inkTileLayerReady: false,
          inkTileLayerError: message,
          mapBoundaryEnabled: true
        })
      }

      return cleanupHostedLayer
    }

    if (!ENABLE_LOCAL_INK_TILE_FALLBACK) {
      setInkTileDomFallbackActive(false)
      recordInkTileEvent({
        inkTilesEnabled: true,
        inkTileLayerReady: false,
        inkTileLayerError: '本地自建水墨瓦片 fallback 已关闭',
        mapBoundaryEnabled: false
      })
      return cleanupLayer
    }

    // 仅调试备用，默认不用。只有手动关闭 ENABLE_TENCENT_CUSTOM_LAYER 并开启 ENABLE_LOCAL_INK_TILE_FALLBACK 时才会走本地 getTileUrl。
    if (typeof ImageTileLayer !== 'function') {
      const allowSingleImageFallback = shouldAllowInkTileSingleImageFallback(targetMap)
      setInkTileDomFallbackActive(allowSingleImageFallback)
      recordInkTileEvent({
        inkTilesEnabled: true,
        inkTileLayerReady: false,
        inkTileLayerError: allowSingleImageFallback
          ? 'TMap.ImageTileLayer 不可用，已启用俯视整图 fallback'
          : 'TMap.ImageTileLayer 不可用；当前为 3D 倾斜视角，已禁用整图 fallback',
        mapBoundaryEnabled: false
      })
      return
    }

    try {
      setInkTileDomFallbackActive(false)
      const layer = new ImageTileLayer({
        map: targetMap,
        minZoom: LINGSHAN_INK_TILE_ZOOM_LEVELS[0],
        maxZoom: Math.max(LINGSHAN_INK_TILE_DISPLAY_MAX_ZOOM, SCENIC_CAMERA_BOUNDS.maxZoom),
        maxDataZoom: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        tileSize: 256,
        opacity: getInkTileEffectiveOpacity(inkTileOpacity, currentZoomRef.current),
        visible: true,
        zIndex: MAP_LAYER_Z_INDEX.LOCAL_TILE_FALLBACK,
        isMainThreadLoaded: true,
        getTileUrl: (...args: unknown[]) => {
          inkTileNativeRequestCountRef.current += 1
          return getLingshanInkTileUrlFromArgs(args, inkTileSourceConfig)
        },
        tileUrl: (...args: unknown[]) => {
          inkTileNativeRequestCountRef.current += 1
          return getLingshanInkTileUrlFromArgs(args, inkTileSourceConfig)
        }
      })

      ownedLayer = layer
      inkTileLayerRef.current = layer
      layerManager.registerLayer('custom_tile_fallback', layer, targetMap)

      try {
        layer.setOpacity?.(getInkTileEffectiveOpacity(inkTileOpacity, currentZoomRef.current))
      } catch {
        // Optional opacity API; constructor opacity covers the common path.
      }

      try {
        if (typeof layer.setMap === 'function') {
          layer.setMap(targetMap)
        } else {
          targetMap?.addLayer?.(layer)
        }
      } catch {
        targetMap?.addLayer?.(layer)
      }

      recordInkTileEvent({
        inkTilesEnabled: true,
        inkTileLayerReady: true,
        mapBoundaryEnabled: true
      })

      inkTileFallbackTimerRef.current = window.setTimeout(() => {
        inkTileFallbackTimerRef.current = null
        if (!inkTilesEnabled || inkTileNativeRequestCountRef.current > 0) {
          return
        }

        if (!isTargetMapCurrent()) {
          return
        }
        const allowSingleImageFallback = shouldAllowInkTileSingleImageFallback(targetMap)
        setInkTileDomFallbackActive(allowSingleImageFallback)
        recordInkTileEvent({
          inkTilesEnabled: true,
          inkTileLayerReady: true,
          inkTileLayerError: allowSingleImageFallback
            ? '未观察到 TMap tile 请求，已启用俯视整图 fallback'
            : '未观察到 TMap tile 请求；当前为 3D 倾斜视角，已禁用整图 fallback',
          mapBoundaryEnabled: true
        })
      }, LINGSHAN_INK_TILE_NATIVE_REQUEST_TIMEOUT_MS)
    } catch (error) {
      cleanupLayer()
      setInkTileDomFallbackActive(shouldAllowInkTileSingleImageFallback(targetMap))
      recordInkTileEvent({
        inkTilesEnabled: true,
        inkTileLayerReady: false,
        inkTileLayerError: error instanceof Error ? error.message : '本地水墨瓦片图层创建失败',
        mapBoundaryEnabled: false
      })
    }

    return cleanupLayer
  }, [inkTilesEnabled, isMapInstanceCurrent, isMapInstanceUsable, layerManager, mapVisualReadyForOverlays, noInkTilesOverride, perfRecorder, updateCustomTileLayerRuntime])

  useEffect(() => {
    if (!inkTilesEnabled) {
      setInkTileOpacityEffective(getInkTileEffectiveOpacity(inkTileOpacity, currentZoomRef.current))
      return
    }

    const targetMap = mapRef.current
    if (!targetMap || !isMapInstanceCurrent(targetMap)) {
      return
    }

    let rafId = 0
    const updateOpacity = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        if (!isMapInstanceCurrent(targetMap)) {
          return
        }
        const zoom = readMapZoomForProjection(targetMap) ?? currentZoomRef.current
        const nextOpacity = ENABLE_TENCENT_CUSTOM_LAYER ? TENCENT_CUSTOM_LAYER_CONFIG.opacity : getInkTileEffectiveOpacity(inkTileOpacity, zoom)
        setInkTileOpacityEffective((current) => (Math.abs(current - nextOpacity) < 0.001 ? current : nextOpacity))

        try {
          inkTileLayerRef.current?.setOpacity?.(nextOpacity)
        } catch {
          // Constructor opacity and DOM fallback still cover rendering.
        }

        try {
          inkTileGroundFallbackLayerRef.current?.setOpacity?.(nextOpacity)
        } catch {
          // Optional API.
        }

        if (inkTileDomFallbackLayerRef.current) {
          inkTileDomFallbackLayerRef.current.style.opacity = String(nextOpacity)
        }
      })
    }

    updateOpacity()

    const mapEvents = ['idle', 'zoom', 'zoom_changed', 'zoomend']
    mapEvents.forEach((eventName) => targetMap.on?.(eventName, updateOpacity))

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      if (isMapInstanceUsable(targetMap)) {
        mapEvents.forEach((eventName) => targetMap.off?.(eventName, updateOpacity))
      }
    }
  }, [inkTileOpacity, inkTilesEnabled, isMapInstanceCurrent, isMapInstanceUsable, mapVisualReadyForOverlays])

  useEffect(() => {
    const targetMap = mapRef.current
    if (!mapVisualReadyForOverlays || !targetMap || !isMapInstanceCurrent(targetMap)) {
      return
    }

    let rafId = 0
    const updateSnapshot = (reason = 'map-camera-event') => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        if (!isMapInstanceCurrent(targetMap)) {
          return
        }
        const actualCamera = readActualTencentCameraState(targetMap)
        const center = actualCamera.center ?? routeCenter
        const zoom = actualCamera.zoom ?? currentZoomRef.current
        const cameraState: CameraState = {
          center,
          zoom,
          pitch: actualCamera.rawPitch ?? readMapPitch(targetMap),
          rotation: actualCamera.rawRotation ?? readMapRotation(targetMap)
        }
        // Keep independent camera snapshots while the long-lived TMap
        // instance moves. Switching presentation restores orientation from
        // these refs without rebuilding the map or its overlays.
        if (initializedPresentationRef.current === 'ink2d') {
          camera2DStateRef.current = { ...cameraState, pitch: 0, rotation: 0 }
        } else if (
          initializedPresentationRef.current === 'scenic3d' &&
          appliedPresentationRef.current === 'scenic3d' &&
          actualCamera.viewMode === '3D' &&
          cameraTransitionPhaseRef.current === 'ready' &&
          !suppress3DCameraPersistenceRef.current &&
          !routeCameraProgrammaticMoveRef.current
        ) {
          camera3DStateRef.current = cameraState
          lastMeaningful3DCameraRef.current = cameraState
          cameraPersistenceDiagnosticsRef.current.lastPersistReason = reason
        } else if (initializedPresentationRef.current === 'scenic3d') {
          cameraPersistenceDiagnosticsRef.current.lastRejectedPersistReason = suppress3DCameraPersistenceRef.current
            ? `${reason}:suppressed`
            : routeCameraProgrammaticMoveRef.current
              ? `${reason}:route-camera-intent`
            : actualCamera.viewMode !== '3D'
              ? `${reason}:view-mode-${actualCamera.viewMode ?? 'unknown'}`
              : cameraTransitionPhaseRef.current !== 'ready'
                ? `${reason}:phase-${cameraTransitionPhaseRef.current}`
                : `${reason}:presentation-not-applied`
        }

        setMapBoundsSnapshot((current) =>
          Math.abs(current.center.lat - center.lat) < 0.000001 &&
          Math.abs(current.center.lng - center.lng) < 0.000001 &&
          Math.abs(current.zoom - zoom) < 0.01
            ? current
            : {
                center,
                zoom
              }
        )
      })
    }

    const mapEvents = ['idle', 'dragend', 'moveend', 'zoomend', 'bounds_changed', 'center_changed']
    const eventHandlers = mapEvents.map((eventName) => {
      const handler = () => updateSnapshot(eventName)
      targetMap.on?.(eventName, handler)
      return { eventName, handler }
    })
    updateSnapshot('initial-snapshot')

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      if (isMapInstanceUsable(targetMap)) {
        eventHandlers.forEach(({ eventName, handler }) => targetMap.off?.(eventName, handler))
      }
    }
  }, [isMapInstanceCurrent, isMapInstanceUsable, mapVisualReadyForOverlays])

  useEffect(() => {
    const targetMap = mapRef.current
    if (!mapBoundsEnabled || !mapVisualReadyForOverlays || !targetMap || !isMapInstanceCurrent(targetMap)) {
      return
    }

    let rafId = 0
    const scheduleCorrection = (reason: string) => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        if (isMapInstanceCurrent(targetMap)) {
          clampScenicCameraBounds(reason)
        }
      })
    }

    const handlers = ['idle', 'dragend', 'moveend', 'zoomend'].map((eventName) => {
      const handler = () => scheduleCorrection(eventName)
      targetMap.on?.(eventName, handler)
      return { eventName, handler }
    })
    scheduleCorrection('map-bounds-ready')

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      if (isMapInstanceUsable(targetMap)) {
        handlers.forEach(({ eventName, handler }) => targetMap.off?.(eventName, handler))
      }
    }
  }, [isMapInstanceCurrent, isMapInstanceUsable, mapBoundsEnabled, mapVisualReadyForOverlays])

  useEffect(() => {
    if (!inkTilesEnabled || !inkTileDomFallbackActive || !mapVisualReadyForOverlays || !mapRef.current) {
      return
    }

    let rafId = 0
    const disableTiltedFallback = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        if (shouldAllowInkTileSingleImageFallback(mapRef.current)) {
          return
        }

        setInkTileDomFallbackActive(false)
        perfRecorder.recordMapVisualEvent({
          type: 'inkTileLayerStateChanged',
          inkTilesEnabled: true,
          inkTileOpacity: inkTileOpacityEffective,
          inkTileOpacityBase: inkTileOpacity,
          inkTileOpacityEffective,
          inkTileZoomFade: getInkTileZoomFade(currentZoomRef.current),
          inkTileUrlTemplate: inkTileSourceConfig.tileUrlTemplate,
          inkTileZoomLevels: [...LINGSHAN_INK_TILE_ZOOM_LEVELS],
          inkTileMaxNativeZoom: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
          inkTileUsingFallbackZoom: Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
          inkTileFallbackFromZ:
            Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM ? Math.floor(currentZoomRef.current) : undefined,
          inkTileFallbackToZ: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
          inkTileBounds: formatConfiguredInkBoundsForPerf(),
          inkTileMode: 'web-mercator-local',
          inkTileLayerReady: Boolean(inkTileLayerRef.current),
          inkTileLayerError: '3D 倾斜视角已自动关闭整图 fallback',
          mapBoundaryEnabled: true
        })
      })
    }

    const mapEvents = ['idle', 'moveend', 'zoomend', 'rotate', 'pitch', 'bounds_changed']
    mapEvents.forEach((eventName) => mapRef.current?.on?.(eventName, disableTiltedFallback))
    disableTiltedFallback()

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      mapEvents.forEach((eventName) => mapRef.current?.off?.(eventName, disableTiltedFallback))
    }
  }, [inkTileDomFallbackActive, inkTileOpacity, inkTileOpacityEffective, inkTileSourceConfig.tileUrlTemplate, inkTilesEnabled, mapVisualReadyForOverlays, perfRecorder])

  useEffect(() => {
    const cleanupGroundFallback = () => {
      const layer = inkTileGroundFallbackLayerRef.current

      if (!layer) {
        return
      }

      try {
        layer.setMap?.(null)
      } catch {
        // Optional cleanup path.
      }

      try {
        layer.destroy?.()
      } catch {
        // Optional cleanup path.
      }

      inkTileGroundFallbackLayerRef.current = null
    }

    cleanupGroundFallback()
    setInkTileGroundFallbackActive(false)

    if (!inkTilesEnabled || !inkTileDomFallbackActive || !mapVisualReadyForOverlays || !mapRef.current || !window.TMap) {
      return
    }

    const ImageGroundLayer = window.TMap.ImageGroundLayer
    const LatLngBounds = window.TMap.LatLngBounds

    if (typeof ImageGroundLayer !== 'function' || typeof LatLngBounds !== 'function') {
      return cleanupGroundFallback
    }

    const extent = getConfiguredInkBoundsExtent()

    try {
      const bounds = new LatLngBounds(new window.TMap.LatLng(extent.south, extent.west), new window.TMap.LatLng(extent.north, extent.east))
      const layer = new ImageGroundLayer({
        map: mapRef.current,
        bounds,
        src: inkTileSourceConfig.imageUrl,
        minZoom: SCENIC_CAMERA_BOUNDS.minZoom,
        maxZoom: SCENIC_CAMERA_BOUNDS.maxZoom,
        visible: true,
        zIndex: MAP_LAYER_Z_INDEX.LOCAL_GROUND_FALLBACK,
        opacity: inkTileOpacityEffective
      })

      inkTileGroundFallbackLayerRef.current = layer
      setInkTileGroundFallbackActive(true)

      try {
        layer.setMap?.(mapRef.current)
      } catch {
        // Constructor map option covers the common path.
      }

      perfRecorder.recordMapVisualEvent({
        type: 'inkTileLayerStateChanged',
        inkTilesEnabled: true,
        inkTileOpacity: inkTileOpacityEffective,
        inkTileOpacityBase: inkTileOpacity,
        inkTileOpacityEffective,
        inkTileZoomFade: getInkTileZoomFade(currentZoomRef.current),
        inkTileUrlTemplate: inkTileSourceConfig.tileUrlTemplate,
        inkTileZoomLevels: [...LINGSHAN_INK_TILE_ZOOM_LEVELS],
        inkTileMaxNativeZoom: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileUsingFallbackZoom: Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileFallbackFromZ:
          Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM ? Math.floor(currentZoomRef.current) : undefined,
        inkTileFallbackToZ: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileBounds: formatConfiguredInkBoundsForPerf(),
        inkTileMode: 'web-mercator-local',
        inkTileLayerReady: true,
        inkTileLayerError: 'ImageGroundLayer fallback 显示中',
        mapBoundaryEnabled: true
      })
    } catch (error) {
      cleanupGroundFallback()
      setInkTileGroundFallbackActive(false)
      perfRecorder.recordMapVisualEvent({
        type: 'inkTileLayerStateChanged',
        inkTilesEnabled: true,
        inkTileOpacity: inkTileOpacityEffective,
        inkTileOpacityBase: inkTileOpacity,
        inkTileOpacityEffective,
        inkTileZoomFade: getInkTileZoomFade(currentZoomRef.current),
        inkTileUrlTemplate: inkTileSourceConfig.tileUrlTemplate,
        inkTileZoomLevels: [...LINGSHAN_INK_TILE_ZOOM_LEVELS],
        inkTileMaxNativeZoom: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileUsingFallbackZoom: Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileFallbackFromZ:
          Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM ? Math.floor(currentZoomRef.current) : undefined,
        inkTileFallbackToZ: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
        inkTileBounds: formatConfiguredInkBoundsForPerf(),
        inkTileMode: 'web-mercator-local',
        inkTileLayerReady: false,
        inkTileLayerError: error instanceof Error ? error.message : 'ImageGroundLayer fallback 创建失败',
        mapBoundaryEnabled: true
      })
    }

    return cleanupGroundFallback
  }, [inkTileDomFallbackActive, inkTileOpacity, inkTileOpacityEffective, inkTileSourceConfig.imageUrl, inkTileSourceConfig.tileUrlTemplate, inkTilesEnabled, mapVisualReadyForOverlays, perfRecorder])

  useEffect(() => {
    if (
      !inkTilesEnabled ||
      !inkTileDomFallbackActive ||
      inkTileGroundFallbackActive ||
      !mapVisualReadyForOverlays ||
      !mapRef.current ||
      !window.TMap ||
      !mapElementRef.current
    ) {
      return
    }

    let rafId = 0
    const scheduleUpdate = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        const result = positionInkOverlayDomLayer({
          layer: inkTileDomFallbackLayerRef.current,
          map: mapRef.current,
          TMap: window.TMap,
          mapElement: mapElementRef.current,
          adjustments: LINGSHAN_INK_OVERLAY_DEFAULT_ADJUSTMENTS
        })

        if (inkTileDomFallbackLayerRef.current) {
          inkTileDomFallbackLayerRef.current.style.opacity = String(inkTileOpacityEffective)
        }

        if (!result.ok) {
          perfRecorder.recordMapVisualEvent({
            type: 'inkTileLayerStateChanged',
            inkTilesEnabled: true,
            inkTileOpacity: inkTileOpacityEffective,
            inkTileOpacityBase: inkTileOpacity,
            inkTileOpacityEffective,
            inkTileZoomFade: getInkTileZoomFade(currentZoomRef.current),
            inkTileUrlTemplate: inkTileSourceConfig.tileUrlTemplate,
            inkTileZoomLevels: [...LINGSHAN_INK_TILE_ZOOM_LEVELS],
            inkTileMaxNativeZoom: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
            inkTileUsingFallbackZoom: Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
            inkTileFallbackFromZ:
              Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM ? Math.floor(currentZoomRef.current) : undefined,
            inkTileFallbackToZ: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
            inkTileBounds: formatConfiguredInkBoundsForPerf(),
            inkTileMode: 'web-mercator-local',
            inkTileLayerReady: false,
            inkTileLayerError: result.error,
            mapBoundaryEnabled: true
          })
        }
      })
    }

    scheduleUpdate()

    const mapEvents = ['idle', 'move', 'moving', 'zoom', 'zoom_changed', 'rotate', 'pitch', 'bounds_changed', 'resize']
    mapEvents.forEach((eventName) => mapRef.current?.on?.(eventName, scheduleUpdate))
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      mapEvents.forEach((eventName) => mapRef.current?.off?.(eventName, scheduleUpdate))
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [inkTileDomFallbackActive, inkTileGroundFallbackActive, inkTileOpacity, inkTileOpacityEffective, inkTileSourceConfig.tileUrlTemplate, inkTilesEnabled, mapVisualReadyForOverlays, perfRecorder])

  useEffect(() => {
    if (!debugInkBounds || !mapVisualReadyForOverlays || !mapRef.current) {
      return
    }

    const handleInkBoundsClick = (event: any) => {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      const point = extractMapEventLatLng(event)

      if (!point) {
        return
      }

      setInkBoundsDraft((current) => {
        const targetCorner = getNextInkMapBoundsCorner(current) ?? 'southWest'

        return {
          ...current,
          [targetCorner]: point
        }
      })
      setInkBoundsCopyStatus('已记录角点，继续点击下一角')
    }

    mapRef.current.on?.('click', handleInkBoundsClick)

    return () => {
      mapRef.current?.off?.('click', handleInkBoundsClick)
    }
  }, [debugInkBounds, mapVisualReadyForOverlays])

  useEffect(() => {
    inkBoundsMarkerLayerRef.current?.setMap?.(null)
    inkBoundsBoundaryLayerRef.current?.setMap?.(null)
    inkBoundsMarkerLayerRef.current = null
    inkBoundsBoundaryLayerRef.current = null

    if (!debugInkBounds || !mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      return
    }

    const capturedCorners = inkMapBoundCornerOrder.filter((corner) => Boolean(inkBoundsDraft[corner]))

    if (capturedCorners.length) {
      inkBoundsMarkerLayerRef.current = new window.TMap.MultiMarker({
        map: mapRef.current,
        styles: {
          inkCorner: new window.TMap.MarkerStyle({
            width: 34,
            height: 34,
            anchor: { x: 17, y: 17 },
            src: createSvgDataUrl(inkBoundsCornerSvg())
          })
        },
        geometries: capturedCorners.map((corner) => ({
          id: `ink-bound-${corner}`,
          styleId: 'inkCorner',
          position: toTMapLatLng(inkBoundsDraft[corner] as LatLngPoint),
          rank: 92,
          properties: {
            title: inkMapBoundCornerLabels[corner]
          }
        }))
      })
    }

    const boundaryPath = getInkBoundsBoundaryPath(inkBoundsDraft)

    if (boundaryPath.length >= 2 && window.TMap.MultiPolyline && window.TMap.PolylineStyle) {
      inkBoundsBoundaryLayerRef.current = new window.TMap.MultiPolyline({
        map: mapRef.current,
        styles: {
          inkBounds: new window.TMap.PolylineStyle({
            color: 'rgba(47, 143, 122, 0.86)',
            width: 4,
            borderWidth: 2,
            borderColor: 'rgba(245, 241, 232, 0.92)',
            lineCap: 'round'
          })
        },
        geometries: [
          {
            id: 'ink-map-bounds-outline',
            styleId: 'inkBounds',
            paths: boundaryPath.map(toTMapLatLng)
          }
        ]
      })
    }

    return () => {
      inkBoundsMarkerLayerRef.current?.setMap?.(null)
      inkBoundsBoundaryLayerRef.current?.setMap?.(null)
      inkBoundsMarkerLayerRef.current = null
      inkBoundsBoundaryLayerRef.current = null
    }
  }, [debugInkBounds, inkBoundsDraft, mapVisualReadyForOverlays])

  useEffect(() => {
    if (!debugDecor) {
      return
    }

    window.localStorage.setItem(visualVariant.decorStorageKey, JSON.stringify(decorOverlays))
  }, [debugDecor, decorOverlays, visualVariant.decorStorageKey])

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
    if (isInkCleanMode || !shouldRenderRoute) {
      layerManager.removeLayer('route', routeLayerRef.current)
      routeLayerRef.current = null
      return
    }

    const targetMap = mapRef.current
    if (!mapVisualReadyForOverlays || !window.TMap || !targetMap || !isMapInstanceCurrent(targetMap)) {
      return
    }

    perfRecorder.markStageStart('routeDraw')
    layerManager.removeLayer('route', routeLayerRef.current)
    // Route layers must stay above optional ink map tile layers.
    const routeLayer = new window.TMap.MultiPolyline({
      map: targetMap,
      styles: {
        previewOuter: new window.TMap.PolylineStyle({
          color: 'rgba(255, 247, 218, 0.90)',
          width: 15,
          borderWidth: 0,
          lineCap: 'round'
        }),
        previewBorder: new window.TMap.PolylineStyle({
          color: '#9C6A12',
          width: 10,
          borderWidth: 0,
          lineCap: 'round'
        }),
        previewInner: new window.TMap.PolylineStyle({
          color: '#F0B82E',
          width: 6,
          borderWidth: 0,
          lineCap: 'round'
        }),
        completedOuter: new window.TMap.PolylineStyle({
          color: '#E6E1D7',
          width: 12,
          borderWidth: 0,
          lineCap: 'round'
        }),
        completedInner: new window.TMap.PolylineStyle({
          color: '#9E9A91',
          width: 7,
          borderWidth: 0,
          lineCap: 'round'
        }),
        remainingOuter: new window.TMap.PolylineStyle({
          color: 'rgba(255, 247, 218, 0.90)',
          width: 14,
          borderWidth: 0,
          lineCap: 'round'
        }),
        remainingBorder: new window.TMap.PolylineStyle({
          color: '#9C6A12',
          width: 9,
          borderWidth: 0,
          lineCap: 'round'
        }),
        remainingInner: new window.TMap.PolylineStyle({
          color: '#E5A91B',
          width: 5,
          borderWidth: 0,
          lineCap: 'round'
        }),
        beforeJoinOuter: new window.TMap.PolylineStyle({
          color: '#F0EDE6',
          width: 11,
          borderWidth: 0,
          lineCap: 'round'
        }),
        beforeJoinInner: new window.TMap.PolylineStyle({
          color: '#C8C1B4',
          width: 6,
          borderWidth: 0,
          lineCap: 'round'
        }),
        activeRouteHalo: new window.TMap.PolylineStyle({
          color: 'rgba(255, 247, 218, 0.78)',
          width: 18,
          borderWidth: 0,
          lineCap: 'round'
        }),
        activeRoute: new window.TMap.PolylineStyle({
          color: '#E5A91B',
          width: 8,
          borderWidth: 3,
          borderColor: '#9C6A12',
          lineCap: 'round'
        })
      },
      geometries: buildGuideRouteGeometries()
    })
    routeLayerRef.current = routeLayer
    layerManager.registerLayer('route', routeLayer, targetMap)
    perfRecorder.markStageEnd('routeDraw')

    return () => {
      layerManager.removeLayer('route', routeLayer)
      if (routeLayerRef.current === routeLayer) {
        routeLayerRef.current = null
      }
    }
  }, [
    currentRouteId,
    currentRoutePath,
    isInkCleanMode,
    isMapInstanceCurrent,
    layerManager,
    mapVisualReadyForOverlays,
    nextStop.nextStopId,
    perfRecorder,
    routePathIndex,
    routeStops,
    selectedStopId,
    effectiveRouteStopIndex,
    joiningStopIndex,
    shouldRenderRoute,
    shouldRenderRouteProgress,
    tourMode
  ])

  function getActiveRoutePath(currentStopId?: string | null, nextStopId?: string | null) {
    const currentLocation = getRouteStopLocation(currentStopId)
    const nextLocation = getRouteStopLocation(nextStopId)

    if (!currentLocation || !nextLocation) {
      return []
    }

    const startIndex = findNearestRoutePoint(currentLocation, currentRoutePath)?.nearestIndex ?? 0
    const endIndex = findNearestRoutePoint(nextLocation, currentRoutePath)?.nearestIndex ?? startIndex
    const fromIndex = Math.min(startIndex, endIndex)
    const toIndex = Math.max(startIndex, endIndex)
    const segment = currentRoutePath.slice(fromIndex, toIndex + 1)

    if (segment.length > 1) {
      return segment
    }

    return [currentLocation, nextLocation]
  }

  function buildGuideRouteGeometries() {
    const routeGeometryIdPrefix = `${currentRouteId}-route`

    if (!shouldRenderRouteProgress) {
      return [
        {
          id: `${routeGeometryIdPrefix}-preview-outer`,
          styleId: 'previewOuter',
          paths: currentRoutePath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-preview-border`,
          styleId: 'previewBorder',
          paths: currentRoutePath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-preview-inner`,
          styleId: 'previewInner',
          paths: currentRoutePath.map(toTMapLatLng)
        }
      ]
    }

    const progressLocation = getRouteStopLocation(routeStops[effectiveRouteStopIndex]?.spotId)
    const progressIndex = progressLocation
      ? findNearestRoutePoint(progressLocation, currentRoutePath)?.nearestIndex ?? routePathIndex
      : routePathIndex
    const completedPath = currentRoutePath.slice(0, Math.min(currentRoutePath.length, progressIndex + 1))
    const remainingPath = currentRoutePath.slice(Math.max(0, progressIndex))
    const activePath = getActiveRoutePath(selectedStopId, nextStop.nextStopId)
    const showActiveSegment = tourMode !== 'buddhaRealmTour'
    const completedOuterStyle = joiningStopIndex !== undefined ? 'beforeJoinOuter' : 'completedOuter'
    const completedInnerStyle = joiningStopIndex !== undefined ? 'beforeJoinInner' : 'completedInner'
    const geometries = [
        {
          id: `${routeGeometryIdPrefix}-remaining-outer`,
          styleId: 'remainingOuter',
          paths: remainingPath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-remaining-border`,
          styleId: 'remainingBorder',
          paths: remainingPath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-remaining-inner`,
          styleId: 'remainingInner',
          paths: remainingPath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-completed-outer`,
          styleId: completedOuterStyle,
          paths: completedPath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-completed-inner`,
          styleId: completedInnerStyle,
          paths: completedPath.map(toTMapLatLng)
        }
      ]

    if (showActiveSegment && activePath.length > 1) {
      geometries.push(
        {
          id: `${routeGeometryIdPrefix}-active-halo`,
          styleId: 'activeRouteHalo',
          paths: activePath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-active`,
          styleId: 'activeRoute',
          paths: activePath.map(toTMapLatLng)
        }
      )
    }

    return geometries
  }

  function startTourRouteProgressOverlay() {
    buddhaTourRouteProgressRef.current = {
      isActive: true,
      lastRenderedAt: 0,
      lastEventBucket: 0,
      latestProgress: 0
    }
    updateTourRouteProgressOverlay(0, { force: true, recordUpdate: false })

    const split = splitRouteByProgress(currentRoutePath, 0, currentRouteCumulativeDistances)
    perfRecorder.recordTourEvent({
      type: 'routeProgressStarted',
      mode: 'buddhaRealmTour',
      progress: 0,
      traveledPointCount: split.traveledPath.length,
      remainingPointCount: split.remainingPath.length,
      currentLat: split.currentPoint.lat,
      currentLng: split.currentPoint.lng,
      source: 'tourProgress',
      routeHasOverlaps: currentRouteHasSequenceOverlaps
    })
  }

  function updateTourRouteProgressOverlay(
    progress: number,
    options: {
      force?: boolean
      recordUpdate?: boolean
    } = {}
  ) {
    if (!mapRef.current || !window.TMap || !buddhaTourRouteProgressRef.current.isActive) {
      return
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const routeProgressFrameMs = isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : 34

    const split = isMobileViewport
      ? splitRouteByProgress(currentRoutePath, progress, currentRouteCumulativeDistances)
      : undefined

    if (isMobileViewport && split) {
      updateSimulatedUserMarkerPosition(split.currentPoint)
      buddhaTourRouteProgressRef.current.latestProgress = progress
    }

    if (!options.force && now - buddhaTourRouteProgressRef.current.lastRenderedAt < routeProgressFrameMs) {
      buddhaTourRouteProgressRef.current.latestProgress = progress
      return
    }

    const renderedSplit = split ?? splitRouteByProgress(currentRoutePath, progress, currentRouteCumulativeDistances)
    updateSimulatedUserMarkerPosition(renderedSplit.currentPoint)

    if (isMobileViewport) {
      tourRouteProgressLayerRef.current?.setMap?.(null)
      tourRouteProgressLayerRef.current = null
    } else {
      renderTourRouteProgressOverlay(renderedSplit)
    }

    buddhaTourRouteProgressRef.current.lastRenderedAt = now
    buddhaTourRouteProgressRef.current.latestProgress = progress

    if (options.recordUpdate === false) {
      return
    }

    const progressBucket = Math.floor(clampNumber(progress, 0, 1) * 10)

    if (progressBucket > buddhaTourRouteProgressRef.current.lastEventBucket && progressBucket >= 0 && progressBucket <= 10) {
      buddhaTourRouteProgressRef.current.lastEventBucket = progressBucket
      perfRecorder.recordTourEvent({
        type: 'routeProgressUpdate',
        mode: 'buddhaRealmTour',
        progress,
        traveledPointCount: renderedSplit.traveledPath.length,
        remainingPointCount: renderedSplit.remainingPath.length,
        currentLat: renderedSplit.currentPoint.lat,
        currentLng: renderedSplit.currentPoint.lng,
        source: 'tourProgress',
        routeHasOverlaps: currentRouteHasSequenceOverlaps
      })
    }
  }

  function finishTourRouteProgressOverlay(reason: Map3DTourStopReason) {
    const routeProgressState = buddhaTourRouteProgressRef.current

    if (!routeProgressState.isActive) {
      resetTourRouteProgressOverlay(false)
      return
    }

    const isCompleted = reason === 'completed'
    const progress = isCompleted ? 1 : routeProgressState.latestProgress
    const split = splitRouteByProgress(currentRoutePath, progress, currentRouteCumulativeDistances)

    perfRecorder.recordTourEvent({
      type: isCompleted ? 'routeProgressCompleted' : 'routeProgressStopped',
      mode: 'buddhaRealmTour',
      progress,
      traveledPointCount: split.traveledPath.length,
      remainingPointCount: split.remainingPath.length,
      currentLat: split.currentPoint.lat,
      currentLng: split.currentPoint.lng,
      source: 'tourProgress',
      routeHasOverlaps: currentRouteHasSequenceOverlaps,
      reason
    })

    resetTourRouteProgressOverlay(true)
  }

  function resetTourRouteProgressOverlay(recordReset = true) {
    tourRouteProgressLayerRef.current?.setMap?.(null)
    tourRouteProgressLayerRef.current = null
    buddhaTourRouteProgressRef.current = {
      isActive: false,
      lastRenderedAt: 0,
      lastEventBucket: 0,
      latestProgress: 0
    }
    if (!recordReset) {
      return
    }

    perfRecorder.recordTourEvent({
      type: 'routeProgressOverlayReset',
      mode: 'buddhaRealmTour',
      source: 'tourProgress',
      routeHasOverlaps: currentRouteHasSequenceOverlaps
    })
  }

  function renderTourRouteProgressOverlay(split: SplitRouteByProgressResult) {
    const geometries = buildTourRouteProgressGeometries(split)

    if (!geometries.length) {
      tourRouteProgressLayerRef.current?.setMap?.(null)
      tourRouteProgressLayerRef.current = null
      return
    }

    const existingLayer = tourRouteProgressLayerRef.current

    if (existingLayer && typeof existingLayer.setGeometries === 'function') {
      existingLayer.setGeometries(geometries)
      return
    }

    if (existingLayer && typeof existingLayer.updateGeometries === 'function') {
      existingLayer.updateGeometries(geometries)
      return
    }

    existingLayer?.setMap?.(null)
    tourRouteProgressLayerRef.current = new window.TMap.MultiPolyline({
      map: mapRef.current,
      styles: buildTourRouteProgressStyles(),
      geometries
    })
  }

  function updateSimulatedUserMarkerPosition(position: LatLngPoint) {
    const layer = userMarkerLayerRef.current

    if (!layer || !window.TMap) {
      return
    }

    const geometries = [
      {
        id: 'simulated-user',
        styleId: 'user',
        position: toTMapLatLng(position)
      }
    ]

    if (typeof layer.setGeometries === 'function') {
      layer.setGeometries(geometries)
      return
    }

    if (typeof layer.updateGeometries === 'function') {
      layer.updateGeometries(geometries)
    }
  }

  function buildTourRouteProgressGeometries(split: SplitRouteByProgressResult) {
    const geometries = []

    if (split.remainingPath.length > 1) {
      geometries.push(
        {
          id: 'buddha-realm-route-remaining-halo',
          styleId: 'tourRouteRemainingHalo',
          paths: split.remainingPath.map(toTMapLatLng)
        },
        {
          id: 'buddha-realm-route-remaining',
          styleId: 'tourRouteRemaining',
          paths: split.remainingPath.map(toTMapLatLng)
        }
      )
    }

    if (split.traveledPath.length > 1) {
      geometries.push(
        {
          id: 'buddha-realm-route-traveled-halo',
          styleId: 'tourRouteTraveledHalo',
          paths: split.traveledPath.map(toTMapLatLng)
        },
        {
          id: 'buddha-realm-route-traveled',
          styleId: 'tourRouteTraveled',
          paths: split.traveledPath.map(toTMapLatLng)
        }
      )
    }

    return geometries
  }

  function buildTourRouteProgressStyles() {
    return {
      tourRouteRemainingHalo: new window.TMap.PolylineStyle({
        color: 'rgba(230, 221, 199, 0.26)',
        width: 24,
        borderWidth: 0,
        lineCap: 'round'
      }),
      tourRouteRemaining: new window.TMap.PolylineStyle({
        color: 'rgba(241, 189, 62, 0.84)',
        width: 9,
        borderWidth: 3,
        borderColor: 'rgba(255, 250, 226, 0.72)',
        lineCap: 'round'
      }),
      tourRouteTraveledHalo: new window.TMap.PolylineStyle({
        color: 'rgba(214, 207, 188, 0.24)',
        width: 20,
        borderWidth: 0,
        lineCap: 'round'
      }),
      tourRouteTraveled: new window.TMap.PolylineStyle({
        color: 'rgba(166, 161, 147, 0.70)',
        width: 8,
        borderWidth: 2,
        borderColor: 'rgba(244, 241, 224, 0.46)',
        lineCap: 'round'
      })
    }
  }

  useEffect(() => {
    if (isInkCleanMode) {
      decorMarkerLayerRef.current?.setMap?.(null)
      decorMarkerLayerRef.current = null
      setDecorSmokeReport({
        markerCount: 0,
        fallbackCount: 0,
        assetUrls: []
      })
      return
    }

    const targetMap = mapRef.current
    if (!mapVisualReadyForOverlays || !window.TMap || !targetMap || !isMapInstanceCurrent(targetMap)) {
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
  }, [assetLoadState, debugDecor, decorOverlays, isInkCleanMode, mapVisualReadyForOverlays, reroutePlan, rerouteStatus, routePathIndex, visualVariant.id])

  useEffect(() => {
    if (isInkCleanMode) {
      poiLayerController.clear()
      poiMarkerLayerRef.current = null
      setGenericCustomPoiVisibleCount(0)
      setRouteStopMarkerCount(0)
      setRouteStateMarkerCount(0)
      return
    }

    const targetMap = mapRef.current
    if (!mapVisualReadyForOverlays || !window.TMap || !targetMap || !isMapInstanceCurrent(targetMap)) {
      return
    }

    perfRecorder.markStageStart('poiInit')
    const currentStopId = routeStops[effectiveRouteStopIndex]?.spotId
    const nextStopId = nextStop.nextStopId
    const routeStopIds = new Set(routeStops.map((stop) => stop.spotId))
    const layerVisibility = resolvePoiLayerVisibility({
      isRouteGuideView
    })
    // Expanded active/arrived cards intentionally narrow the marker field;
    // collapsed cards restore every numbered station without moving the map.
    const routeProgressMode = shouldRenderRouteProgress && routeCardExpanded
    const routeContextPois = routeProgressMode
      ? getRouteProgressPois(currentStopId, nextStopId ?? undefined, 3)
      : []
    const layerPois = Array.from(
      new Map(
        [
          ...getLingshanPoisForLayer(poiLayerMode),
          ...(serviceFacilitiesEnabled ? getLingshanPoisForLayer('services') : [])
        ].map((poi) => [poi.id, poi])
      ).values()
    )
    const genericPois = !isRouteGuideView
      ? layerPois
      : navigationPoiOverrideActive
        ? layerPois.filter((poi) => !routeStopIds.has(poi.id))
        : routeContextPois.filter((poi) => !routeStopIds.has(poi.id))

    const genericStyles: Record<string, any> = {}
    const genericGeometries = layerVisibility.showGenericCustomPoi
      ? genericPois.map((poi) => {
          const styleId = isRouteGuideView ? `context-${poi.id}` : `browse-${poi.id}`
          const isContextPoi = isRouteGuideView
          genericStyles[styleId] = new window.TMap.MarkerStyle({
            width: isContextPoi ? 92 : 96,
            height: isContextPoi ? 38 : 42,
            anchor: isContextPoi ? { x: 46, y: 34 } : { x: 48, y: 37 },
            src: createSvgDataUrl(
              browsePoiMarkerSvg(poi.name, !isContextPoi && poi.assetBindingPriority === 'core_3d', isContextPoi)
            )
          })
          return {
            id: poi.id,
            styleId,
            position: toTMapLatLng(getBestPoiLocation(poi)),
            rank: 50,
            properties: { title: poi.name }
          }
        })
      : []

    const routeStopStyles: Record<string, any> = {}
    const routeStopGeometries = layerVisibility.showRouteStopMarkers
      ? routeStops.flatMap((stop, index) => {
          const location = getRouteStopLocation(stop.spotId)
          if (!location) {
            return []
          }
          const display = getPoiDisplay(stop.spotId)
          const styleId = `route-stop-${index}`
          const size = stop.spotId === terminalStopId ? 42 : 34
          routeStopStyles[styleId] = new window.TMap.MarkerStyle({
            width: size,
            height: size + 8,
            anchor: { x: size / 2, y: size + 6 },
            src: createSvgDataUrl(routePoiMarkerSvg(stop.spotId === terminalStopId ? 'terminal' : 'route', index + 1))
          })
          return [{
            id: stop.spotId,
            styleId,
            position: toTMapLatLng(location),
            rank: 70,
            properties: { title: `${index + 1}. ${display?.name ?? stop.spotId}` }
          }]
        })
      : []

    const routeStateStyles: Record<string, any> = {}
    const routeStateMarkers = [
      { poiId: currentStopId, state: 'current' as const },
      { poiId: nextStopId, state: 'next' as const }
    ].filter((item, index, items) => Boolean(item.poiId) && items.findIndex((candidate) => candidate.poiId === item.poiId) === index)
    const routeStateGeometries = layerVisibility.showRouteStateMarkers
      ? routeStateMarkers.flatMap(({ poiId, state }) => {
          if (!poiId) {
            return []
          }
          const stopIndex = routeStops.findIndex((stop) => stop.spotId === poiId)
          const location = getRouteStopLocation(poiId)
          if (stopIndex < 0 || !location) {
            return []
          }
          const size = state === 'current' ? 44 : 40
          const styleId = `route-state-${state}-${stopIndex}`
          routeStateStyles[styleId] = new window.TMap.MarkerStyle({
            width: size,
            height: size + 8,
            anchor: { x: size / 2, y: size + 6 },
            src: createSvgDataUrl(routePoiMarkerSvg(state, stopIndex + 1))
          })
          return [{
            id: poiId,
            styleId,
            position: toTMapLatLng(location),
            rank: 90,
            properties: { title: `${stopIndex + 1}. ${getPoiDisplay(poiId)?.name ?? poiId}` }
          }]
        })
      : []

    const handlePoiMarkerClick = (event: any) => {
      const poiId = event?.geometry?.id ?? event?.geometryId ?? event?.id
      if (typeof poiId !== 'string' || !hasMapEnabledScenicPoi(poiId)) {
        return
      }

      setSelectedPoiId(poiId)
      if (!isRouteGuideView) {
        goToPoiFromBrowse(navigate, poiId, scenicMapPresentation)
        return
      }

      const stopIndex = routeStops.findIndex((stop) => stop.spotId === poiId)
      goToPoiFromRoute(navigate, poiId, {
        routeId: currentRouteId,
        poiStopIndex: stopIndex >= 0 ? stopIndex : effectiveRouteStopIndex,
        returnStage: getPoiReturnStage(routeGuideStage),
        returnStopIndex: effectiveRouteStopIndex,
        presentation: scenicMapPresentation
      })
    }
    const updatePoiLayer = (
      kind: PoiLayerKind,
      key: Record<string, unknown>,
      styles: Record<string, any>,
      geometries: any[]
    ) => {
      if (!geometries.length) {
        poiLayerController.clear(kind)
        return null
      }
      return poiLayerController.update({
        kind,
        key: JSON.stringify(key),
        build: (map) => ({
          layer: new window.TMap.MultiMarker({ map, styles, geometries }),
          onClick: handlePoiMarkerClick
        })
      })
    }

    const genericPoiLayer = updatePoiLayer(
      'generic',
      {
        mode: poiLayerMode,
        presentation: scenicMapPresentation,
        route: isRouteGuideView,
        navigationOverrideActive: navigationPoiOverrideActive,
        services: serviceFacilitiesEnabled,
        poiIds: genericGeometries.map((item) => item.id)
      },
      genericStyles,
      genericGeometries
    )
    const routeStopLayer = updatePoiLayer(
      'routeStops',
      { routeId: currentRouteId, poiIds: routeStopGeometries.map((item) => item.id) },
      routeStopStyles,
      routeStopGeometries
    )
    const routeStateLayer = updatePoiLayer(
      'routeState',
      {
        routeId: currentRouteId,
        currentStopId,
        nextStopId,
        stage: routeGuideStage,
        poiIds: routeStateGeometries.map((item) => item.id)
      },
      routeStateStyles,
      routeStateGeometries
    )
    poiMarkerLayerRef.current = genericPoiLayer
    setGenericCustomPoiVisibleCount(genericPoiLayer ? genericGeometries.length : 0)
    setRouteStopMarkerCount(routeStopLayer ? routeStopGeometries.length : 0)
    setRouteStateMarkerCount(routeStateLayer ? routeStateGeometries.length : 0)
    perfRecorder.markStageEnd('poiInit')
    if (!mapRoutePoiShownRef.current) {
      mapRoutePoiShownRef.current = true
      perfRecorder.recordMapVisualEvent({
        type: 'routePoiShown',
        reason: 'visual-ready'
      })
    }
  }, [
    currentRouteId,
    effectiveRouteStopIndex,
    isInkCleanMode,
    isMapInstanceCurrent,
    isRouteGuideView,
    mapVisualReadyForOverlays,
    navigate,
    navigationPoiOverrideActive,
    nextStop.nextStopId,
    perfRecorder,
    poiLayerController,
    poiLayerMode,
    routeCardExpanded,
    routeGuideStage,
    routeStops,
    scenicMapPresentation,
    setSelectedPoiId,
    serviceFacilitiesEnabled,
    shouldRenderRouteProgress,
    terminalStopId,
    poiVisibilityMode
  ])

  useEffect(() => {
    if (isInkCleanMode) {
      userMarkerLayerRef.current?.setMap?.(null)
      userMarkerLayerRef.current = null
      return
    }

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      return
    }

    const geometries = [
      {
        id: 'simulated-user',
        styleId: 'user',
        position: toTMapLatLng(simulatedPosition)
      }
    ]

    if (userMarkerLayerRef.current && typeof userMarkerLayerRef.current.setGeometries === 'function') {
      userMarkerLayerRef.current.setGeometries(geometries)
      return
    }

    if (userMarkerLayerRef.current && typeof userMarkerLayerRef.current.updateGeometries === 'function') {
      userMarkerLayerRef.current.updateGeometries(geometries)
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
      geometries
    })

    return () => {
      userMarkerLayerRef.current?.setMap?.(null)
      userMarkerLayerRef.current = null
    }
  }, [isInkCleanMode, mapVisualReadyForOverlays, simulatedPosition])

  useEffect(() => {
    landmarkHighlightLayerRef.current?.setMap?.(null)
    landmarkHighlightLayerRef.current = null

    if (isInkCleanMode || !mapVisualReadyForOverlays || !window.TMap || !mapRef.current || !activeLandmarkId) {
      return
    }

    const location = getRouteStopLocation(activeLandmarkId)

    if (!location) {
      return
    }

    const size = activeLandmarkId === 'giant_buddha' ? 96 : activeLandmarkId === 'fan_gong' || activeLandmarkId === 'wuyin_tancheng' ? 86 : 74
    const display = getPoiDisplay(activeLandmarkId)

    landmarkHighlightLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: {
        activeLandmark: new window.TMap.MarkerStyle({
          width: size,
          height: size,
          anchor: { x: size / 2, y: size / 2 },
          src: createSvgDataUrl(activeLandmarkHaloSvg(size))
        })
      },
      geometries: [
        {
          id: `active-landmark-${activeLandmarkId}`,
          styleId: 'activeLandmark',
          position: toTMapLatLng(location),
          rank: 62,
          properties: {
            title: display?.name ?? activeLandmarkId
          }
        }
      ]
    })

    return () => {
      landmarkHighlightLayerRef.current?.setMap?.(null)
      landmarkHighlightLayerRef.current = null
    }
  }, [activeLandmarkId, isInkCleanMode, mapVisualReadyForOverlays])

  useEffect(() => {
    if (isInkCleanMode) {
      rerouteLayerRef.current?.setMap?.(null)
      rerouteLayerRef.current = null
      return
    }

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
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
  }, [isInkCleanMode, mapVisualReadyForOverlays, reroutePlan])

  useEffect(() => {
    layerManager.removeLayer('model_default_giant_buddha_beta', gltfModelRefs.current.get(defaultModelOverlay?.poiId ?? ''))
    gltfModelRefs.current = new Map()

    if (visualVariant.id === 'prototype-c') {
      if (debugPerf && showModelBeta) {
        setModelStatus('正式 runtime 地标已自动加载；候选切换请使用运行时诊断面板')
      }
      return
    }

    if (!showModelBeta) {
      setModelStatus('未开启')
      return
    }

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      setModelStatus('等待地图就绪')
      return
    }

    if (!window.TMap.model?.GLTFModel) {
      setModelStatus('模型配置或 GLTFModel 不可用')
      return
    }

    if (!defaultModelOverlay?.modelUrl) {
      setModelStatus('灵山大佛模型配置缺失')
      return
    }

    const anchor = getModelOverlayLocation(defaultModelOverlay)

    if (!anchor) {
      setModelStatus('灵山大佛模型锚点缺失')
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
      if (!layerManager.registerLayer('model_default_giant_buddha_beta', model, mapRef.current)) {
        clearGltfModel(model)
        setModelStatus('地图实例已切换，已取消旧模型加载')
        return
      }
      gltfModelRefs.current.set(defaultModelOverlay.poiId, model)
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
      layerManager.removeLayer('model_default_giant_buddha_beta', gltfModelRefs.current.get(defaultModelOverlay.poiId))
      gltfModelRefs.current = new Map()
    }
  }, [debugPerf, layerManager, mapVisualReadyForOverlays, showModelBeta, visualVariant.id])

  const moveToStop = (nextIndex: number) => {
    stopActiveTour('manual')
    const boundedIndex = Math.max(0, Math.min(routeStops.length - 1, nextIndex))
    const stop = routeStops[boundedIndex]
    const location = getRouteStopLocation(stop.spotId)

    if (!location) {
      return
    }

    setSelectedStopIndex(boundedIndex)
    setSimulatedPosition(location)
    setRoutePathIndex(findNearestRoutePoint(location, currentRoutePath)?.nearestIndex ?? 0)
    setRerouteStatus('idle')
    setReroutePlan(null)
    setRerouteMessage('已回到主题路线')
    focusLandmarkCamera(stop.spotId, location)
  }

  const moveToNextImmersiveStop = () => {
    const nextIndex = Math.min(routeStops.length - 1, selectedStopIndex + 1)
    const preloadStops = routeStops.slice(selectedStopIndex, Math.min(routeStops.length, selectedStopIndex + 3))
    const preloadLandmarkIds = preloadStops
      .map((stop) => resolveLandmarkInspectorIdFromRouteId(stop.spotId, landmarkModelOverlays))
      .filter((id): id is string => Boolean(id))

    preloadMap3DLandmarkAssets(preloadLandmarkIds)
    setTourPreloadStopIds(preloadStops.map((stop) => stop.spotId))
    moveToStop(nextIndex)
  }

  const simulateForward = () => {
    stopActiveTour('manual')
    const nextIndex = Math.min(currentRoutePath.length - 1, routePathIndex + currentProgressStep)
    const nextPosition = currentRoutePath[nextIndex]
    const inferredStopIndex = getNearestStopIndex(nextPosition, routeStops)

    setRoutePathIndex(nextIndex)
    setSelectedStopIndex(inferredStopIndex)
    setSimulatedPosition(nextPosition)
    setRerouteStatus('idle')
    setReroutePlan(null)
    setRerouteMessage('已沿金色路线模拟前进')
    focusMap(nextPosition, 18, routeStops[inferredStopIndex]?.spotId)
  }

  const returnToRoute = () => {
    stopActiveTour('manual')
    const nearest = nearestRoutePoint?.nearestPoint ?? currentRoutePath[routePathIndex] ?? currentInitialPosition
    const nearestIndex = nearestRoutePoint?.nearestIndex ?? routePathIndex

    setRoutePathIndex(nearestIndex)
    setSelectedStopIndex(getNearestStopIndex(nearest, routeStops))
    setSimulatedPosition(nearest)
    setRerouteStatus('idle')
    setReroutePlan(null)
    setRerouteMessage('已回到主路线')
    focusMap(nearest, 18, routeStops[getNearestStopIndex(nearest, routeStops)]?.spotId)
  }

  const switchScenicRoute = (routeId: string) => {
    if (routeId === currentRouteId) {
      return
    }

    const nextRouteConfig = getScenicRouteConfig(routeId)
    const nextRoutePath = nextRouteConfig.geometry?.length
      ? nextRouteConfig.geometry
      : getRouteStopLocations(nextRouteConfig.guideRoute)
    const nextInitialPosition = getRouteInitialPosition(nextRouteConfig, nextRoutePath)

    stopActiveTour('replaced')
    resetTourRouteProgressOverlay(false)
    clearActiveLandmarkHighlight()
    setCurrentRouteId(nextRouteConfig.id)
    setRouteSwitchCount((count) => count + 1)
    setSelectedStopIndex(0)
    setSimulatedPosition(nextInitialPosition)
    setRoutePathIndex(findNearestRoutePoint(nextInitialPosition, nextRoutePath)?.nearestIndex ?? 0)
    setRerouteStatus('idle')
    setReroutePlan(null)
    setRerouteMessage(`已切换至${nextRouteConfig.name}`)
    setActiveCameraMode('routeOverview')
    setActiveTourStepId(undefined)
    setPageMessage(`${nextRouteConfig.name}已就绪`)
    focusRouteOverview(nextRoutePath, nextInitialPosition, nextRouteConfig.id)
  }

  useEffect(() => {
    if (effectiveGuideState.viewMode !== 'route' || !effectiveGuideState.routeId) {
      return
    }

    const nextRouteId = resolveScenicRouteId(effectiveGuideState.routeId)
    if (nextRouteId !== currentRouteId) {
      switchScenicRoute(nextRouteId)
    }
  }, [currentRouteId, effectiveGuideState.routeId, effectiveGuideState.viewMode])

  const simulateDeviation = async () => {
    stopActiveTour('manual')
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
    focusMap(offRoutePosition, 18, targetStopId)

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

  function getRouteOverviewPreset(routePath: LatLngPoint[]) {
    return buildRouteOverviewCameraPreset(routePath, mapElementRef.current, {
      minZoom: mapMinZoom,
      maxZoom: mapMaxZoom,
      presentation: scenicMapPresentation
    })
  }

  const applyGuideCamera = (mode: GuideCameraMode) => {
    stopActiveTour('manual')
    if (mode === 'routeOverview') {
      focusRouteOverview()
      return
    }
    const preset =
      MAP_3D_GUIDE_CAMERA_PRESETS[mode] ?? MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate
    const target =
      mode === 'overviewEstate'
        ? currentRouteCenter
        : mode === 'axisCruise'
          ? currentAxisCruiseTarget
          : mode === 'closeInspect'
              ? getRouteStopLocation(selectedStopId) ?? getRouteStopLocation(nextStop.nextStopId) ?? simulatedPosition
              : mode === 'landmarkFocus'
                ? getRouteStopLocation(selectedStopId) ?? getRouteStopLocation(nextStop.nextStopId) ?? simulatedPosition
                : simulatedPosition
    const targetPoiId =
      mode === 'landmarkFocus' || mode === 'closeInspect'
        ? selectedStopId ?? nextStop.nextStopId
        : undefined

    setActiveCameraMode(mode)
    moveMapCamera(target, preset, {
      targetPoiId,
      twoStage: mode === 'landmarkFocus' || mode === 'closeInspect'
    })
  }

  function applyRouteCameraIntent(
    source: RouteCameraIntentSource,
    routeId: string,
    target: LatLngPoint,
    preset: Map3DCameraPreset
  ) {
    const map = mapRef.current
    if (!map || !window.TMap) {
      return
    }

    const generation = ++routeCameraIntentGenerationRef.current
    const previousIntent = routeCameraIntentRef.current
    const zoomConstraints = getRouteCameraZoomConstraints(map)
    const rawTargetZoom = preset.zoom
    const effectiveTargetZoom =
      source === 'route-overview'
        ? clampNumber(rawTargetZoom, zoomConstraints.minZoom, zoomConstraints.maxZoom)
        : rawTargetZoom
    const targetCamera: CameraState = {
      center: target,
      zoom: effectiveTargetZoom,
      pitch: preset.pitch,
      rotation: preset.rotation
    }
    const intent: RouteCameraIntentSnapshot = {
      generation,
      source,
      routeId,
      target: targetCamera,
      rawTargetZoom,
      effectiveTargetZoom,
      configuredMinZoom: zoomConstraints.minZoom,
      configuredMaxZoom: zoomConstraints.maxZoom,
      actualZoom: null,
      zoomCorrectionApplied: false,
      zoomCorrectionMethod: null,
      zoomCorrectionGeneration: null,
      lastZoomWriter: null,
      phase: 'applying-full-camera',
      status: 'applying',
      lastCompletedGeneration: previousIntent.lastCompletedGeneration
    }
    let intentSnapshot: RouteCameraIntentSnapshot = intent
    updateRouteCameraIntentSnapshot(intentSnapshot)
    routeCameraProgrammaticMoveRef.current = true
    // Cancels any delayed second-stage callback left by an earlier generic
    // landmark/overview camera command before this route intent takes over.
    cameraSequenceRef.current += 1
    stopActiveTour('manual')

    try {
      map.stop?.()
    } catch {
      // Tencent GL does not expose stop() in every WebView build; generation
      // checks below remain the authoritative cancellation mechanism.
    }

    const isCurrentIntent = () =>
      routeCameraIntentGenerationRef.current === generation && isMapInstanceCurrent(map)
    const complete = async () => {
      try {
        const cameraTarget = {
          center: new window.TMap.LatLng(target.lat, target.lng),
          zoom: effectiveTargetZoom,
          pitch: preset.pitch,
          rotation: preset.rotation
        }
        if (typeof map.easeTo === 'function') {
          map.easeTo(cameraTarget, { duration: preset.durationMs })
        } else {
          map.setCenter?.(cameraTarget.center)
          map.setZoom?.(cameraTarget.zoom)
          map.setPitch?.(cameraTarget.pitch)
          map.setRotation?.(cameraTarget.rotation)
        }
        intentSnapshot = {
          ...intentSnapshot,
          phase: 'verifying-camera',
          lastZoomWriter: {
            source,
            generation,
            value: effectiveTargetZoom
          }
        }
        updateRouteCameraIntentSnapshot(intentSnapshot)

        let result = await waitForRouteCameraIntentTarget({
          map,
          target: targetCamera,
          requireOrientation: scenicMapPresentation === 'scenic3d',
          requireZoom: source !== 'route-overview',
          isCurrent: isCurrentIntent,
          timeoutMs: Math.max(1600, preset.durationMs + 900)
        })
        if (!isCurrentIntent()) {
          return
        }
        if (!result.matched) {
          routeCameraProgrammaticMoveRef.current = false
          updateRouteCameraIntentSnapshot({
            ...intentSnapshot,
            phase: 'failed',
            status: 'failed',
            actualZoom: result.camera.zoom,
            lastCompletedGeneration: routeCameraIntentRef.current.lastCompletedGeneration,
            lastFailure: `相机未到达目标：${describeRouteCameraMismatch(result.camera, targetCamera)}`
          })
          return
        }

        if (
          source === 'route-overview' &&
          (result.camera.zoom === null || Math.abs(result.camera.zoom - effectiveTargetZoom) > 0.1)
        ) {
          if (!isCurrentIntent()) {
            return
          }
          let correctionMethod: 'zoomTo' | 'setZoom' = 'setZoom'
          try {
            // A completed easeTo can retain the previous close-up zoom in QQ
            // WebView. Stop it before this intent owns the explicit zoom fix.
            map.stop?.()
            if (typeof map.zoomTo === 'function') {
              map.zoomTo(effectiveTargetZoom, { duration: 200 })
              correctionMethod = 'zoomTo'
            } else {
              map.setZoom?.(effectiveTargetZoom)
            }
          } catch {
            correctionMethod = 'setZoom'
            map.setZoom?.(effectiveTargetZoom)
          }
          intentSnapshot = {
            ...intentSnapshot,
            phase: 'correcting-zoom',
            actualZoom: result.camera.zoom,
            zoomCorrectionApplied: true,
            zoomCorrectionMethod: correctionMethod,
            zoomCorrectionGeneration: generation,
            lastZoomWriter: {
              source,
              generation,
              value: effectiveTargetZoom
            }
          }
          updateRouteCameraIntentSnapshot(intentSnapshot)
          intentSnapshot = { ...intentSnapshot, phase: 'verifying-final' }
          updateRouteCameraIntentSnapshot(intentSnapshot)
          if (correctionMethod === 'zoomTo') {
            result = await waitForRouteCameraIntentTarget({
              map,
              target: targetCamera,
              requireOrientation: scenicMapPresentation === 'scenic3d',
              requireZoom: true,
              isCurrent: isCurrentIntent,
              timeoutMs: 420
            })
            if (!isCurrentIntent()) {
              return
            }
            if (!result.matched) {
              // Some QQ WebView builds accept zoomTo without applying it. A
              // single direct setZoom is the terminal fallback for this intent.
              map.setZoom?.(effectiveTargetZoom)
              correctionMethod = 'setZoom'
              intentSnapshot = {
                ...intentSnapshot,
                actualZoom: result.camera.zoom,
                zoomCorrectionMethod: correctionMethod,
                lastZoomWriter: {
                  source,
                  generation,
                  value: effectiveTargetZoom
                }
              }
              updateRouteCameraIntentSnapshot(intentSnapshot)
            }
          }
          if (!result.matched || correctionMethod === 'setZoom') {
            result = await waitForRouteCameraIntentTarget({
              map,
              target: targetCamera,
              requireOrientation: scenicMapPresentation === 'scenic3d',
              requireZoom: true,
              isCurrent: isCurrentIntent,
              timeoutMs: 900
            })
          }
          if (!isCurrentIntent()) {
            return
          }
          if (!result.matched) {
            routeCameraProgrammaticMoveRef.current = false
            updateRouteCameraIntentSnapshot({
              ...intentSnapshot,
              phase: 'failed',
              status: 'failed',
              actualZoom: result.camera.zoom,
              lastCompletedGeneration: routeCameraIntentRef.current.lastCompletedGeneration,
              lastFailure: `缩放修正后未到达目标：${describeRouteCameraMismatch(result.camera, targetCamera)}`
            })
            return
          }
        }

        routeCameraProgrammaticMoveRef.current = false
        const actualCamera = cameraStateFromActual(result.camera, targetCamera, scenicMapPresentation)
        if (scenicMapPresentation === 'scenic3d' && result.camera.viewMode === '3D') {
          camera3DStateRef.current = actualCamera
          lastMeaningful3DCameraRef.current = actualCamera
          cameraPersistenceDiagnosticsRef.current.lastPersistReason = `route-camera-intent:${source}:${generation}`
        } else if (scenicMapPresentation === 'ink2d') {
          camera2DStateRef.current = actualCamera
        }
        currentZoomRef.current = actualCamera.zoom
        setMapInteractionSnapshot((current) => ({ ...current, currentZoom: actualCamera.zoom }))
        setMapBoundsSnapshot({ center: actualCamera.center, zoom: actualCamera.zoom })
        updateRouteCameraIntentSnapshot({
          ...intentSnapshot,
          phase: 'completed',
          status: 'completed',
          actualZoom: result.camera.zoom,
          lastCompletedGeneration: generation
        })
        perfRecorder.recordCameraEvent({
          cameraPreset: preset.id,
          targetPoiId: source === 'route-current' ? currentRouteConfig.stops[effectiveRouteStopIndex]?.spotId : undefined,
          durationMs: preset.durationMs,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString()
        })
      } catch (error) {
        if (!isCurrentIntent()) {
          return
        }
        routeCameraProgrammaticMoveRef.current = false
        updateRouteCameraIntentSnapshot({
          ...intentSnapshot,
          phase: 'failed',
          status: 'failed',
          lastCompletedGeneration: routeCameraIntentRef.current.lastCompletedGeneration,
          lastFailure: error instanceof Error ? error.message : '路线相机命令失败'
        })
      }
    }

    void complete()
  }

  const focusRouteOverview = (
    path = currentRoutePath,
    fallback = currentInitialPosition,
    routeId = currentRouteConfig.id
  ) => {
    const routePath = path.length >= 2 ? path : getRouteStopLocations(currentGuideRoute)
    setActiveCameraMode('routeOverview')
    applyRouteCameraIntent(
      'route-overview',
      routeId,
      getRouteOverviewTarget(routePath) ?? fallback,
      getRouteOverviewPreset(routePath)
    )
  }

  const focusRouteCurrent = (routeId = currentRouteConfig.id, stopIndex = effectiveRouteStopIndex) => {
    const route = getScenicRouteConfig(routeId)
    const stop = route.stops[clampRouteStopIndex(stopIndex, route.stops.length)]
    const target = stop?.location ?? getRouteStopLocation(stop?.spotId)
    if (!target) {
      return
    }
    setActiveCameraMode('landmarkFocus')
    applyRouteCameraIntent(
      'route-current',
      route.id,
      target,
      isInk2DPresentation ? getInk2DCameraPreset(MAP_3D_GUIDE_CAMERA_PRESETS.landmarkFocus) : MAP_3D_GUIDE_CAMERA_PRESETS.landmarkFocus
    )
  }

  const focusMap = (position: LatLngPoint, zoom?: number, targetPoiId?: string) => {
    stopActiveTour('manual')
    const preset = {
      ...MAP_3D_GUIDE_CAMERA_PRESETS.guideFollow,
      zoom: zoom ?? MAP_3D_GUIDE_CAMERA_PRESETS.guideFollow.zoom
    }
    setActiveCameraMode('guideFollow')
    moveMapCamera(position, preset, { targetPoiId })
  }

  function focusLandmarkCamera(id: string, position: LatLngPoint, closeInspect = false) {
    stopActiveTour('manual')
    const preset = buildLandmarkCameraPreset(id, closeInspect)
    setActiveCameraMode(closeInspect ? 'closeInspect' : 'landmarkFocus')
    moveMapCamera(position, preset, {
      targetPoiId: id,
      targetLandmarkId: id,
      twoStage: true
    })
  }

  const moveMapCamera = (
    position: LatLngPoint,
    preset: Map3DCameraPreset,
    options: { targetPoiId?: string; targetLandmarkId?: string; twoStage?: boolean } = {}
  ) => {
    const map = mapRef.current

    if (!map || !window.TMap) {
      return
    }

    const effectivePreset = isInk2DPresentation ? getInk2DCameraPreset(preset) : preset

    flyMap3DCamera({
      map,
      TMap: window.TMap,
      target: position,
      preset: effectivePreset,
      sequenceRef: cameraSequenceRef,
      targetPoiId: options.targetPoiId,
      targetLandmarkId: options.targetLandmarkId,
      twoStage: isInk2DPresentation ? false : options.twoStage,
      onComplete: (event) => perfRecorder.recordCameraEvent(event)
    })
  }

  function setActiveLandmarkHighlight(id?: string) {
    setActiveLandmarkId(id)
  }

  function clearActiveLandmarkHighlight() {
    setActiveLandmarkId(undefined)
  }

  function stopActiveTour(reason: Map3DTourStopReason = 'manual') {
    const hadPlayback = Boolean(tourPlaybackRef.current)
    stopBuddhaRealmTour(tourPlaybackRef, reason)

    if (hadPlayback) {
      setTourMode('idle')
      setActiveTourStepId(undefined)
      clearActiveLandmarkHighlight()
    }
  }

  function startMapInteractionLiteMode(kind: MapInteractionKind) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const zoom = readCurrentMapZoom() ?? currentZoomRef.current

    currentZoomRef.current = zoom

    if (mapInteractionRef.current.exitTimerId !== undefined) {
      window.clearTimeout(mapInteractionRef.current.exitTimerId)
      mapInteractionRef.current.exitTimerId = undefined
    }

    const wasInteracting = mapInteractionRef.current.isInteracting
    mapInteractionRef.current = {
      isInteracting: true,
      kind,
      lastInteractionAt: now
    }

    if (!wasInteracting) {
      stopActiveTour('interrupted')
      if (buddhaTourRouteProgressRef.current.isActive) {
        resetTourRouteProgressOverlay(true)
      }
      clearActiveLandmarkHighlight()
      perfRecorder.recordMapVisualEvent({
        type: 'mapInteractionStarted',
        interactionKind: kind,
        currentZoom: zoom
      })
    }

    setMapInteractionSnapshot((current) =>
      current.isInteracting === true && current.kind === kind && Math.abs(current.currentZoom - zoom) < 0.02
        ? current
        : {
            isInteracting: true,
            kind,
            currentZoom: zoom
          }
    )

    scheduleMapInteractionLiteExit(kind, 'debounced')
  }

  function scheduleMapInteractionLiteExit(kind: MapInteractionKind, reason: string) {
    if (mapInteractionRef.current.exitTimerId !== undefined) {
      window.clearTimeout(mapInteractionRef.current.exitTimerId)
    }

    mapInteractionRef.current.exitTimerId = window.setTimeout(() => {
      const zoom = updateCurrentMapZoomSnapshot()
      const wasInteracting = mapInteractionRef.current.isInteracting
      mapInteractionRef.current = {
        isInteracting: false,
        lastInteractionAt: typeof performance !== 'undefined' ? performance.now() : Date.now()
      }
      setMapInteractionSnapshot((current) =>
        !current.isInteracting && Math.abs(current.currentZoom - zoom) < 0.02
          ? current
          : {
              isInteracting: false,
              currentZoom: zoom
            }
      )

      if (wasInteracting) {
        perfRecorder.recordMapVisualEvent({
          type: 'mapInteractionEnded',
          interactionKind: kind,
          currentZoom: zoom,
          reason
        })
      }

      clampScenicCameraBounds(reason)
    }, SCENIC_CAMERA_BOUNDS.interactionIdleDelayMs)
  }

  function updateCurrentMapZoomSnapshot() {
    const zoom = readCurrentMapZoom() ?? currentZoomRef.current
    currentZoomRef.current = zoom
    setMapInteractionSnapshot((current) =>
      Math.abs(current.currentZoom - zoom) < 0.02
        ? current
        : {
            ...current,
            currentZoom: zoom
          }
    )
    return zoom
  }

  function readCurrentMapZoom() {
    const map = mapRef.current
    const zoom = typeof map?.getZoom === 'function' ? Number(map.getZoom()) : Number.NaN
    return Number.isFinite(zoom) ? zoom : undefined
  }

  function readCurrentMapCenter(): LatLngPoint | undefined {
    const map = mapRef.current
    const center = typeof map?.getCenter === 'function' ? map.getCenter() : undefined

    if (!center) {
      return undefined
    }

    const lat = typeof center.getLat === 'function' ? Number(center.getLat()) : Number(center.lat)
    const lng = typeof center.getLng === 'function' ? Number(center.getLng()) : Number(center.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return undefined
    }

    return { lat, lng }
  }

  function clampScenicCameraBounds(reason: string) {
    const map = mapRef.current

    if (!map || !window.TMap || !mapBoundsEnabled || tourMode === 'buddhaRealmTour' || routeCameraProgrammaticMoveRef.current) {
      return
    }

    const requestedZoom = readCurrentMapZoom()
    const currentCenter = readCurrentMapCenter()
    const clampedZoom =
      requestedZoom !== undefined
        ? clampNumber(requestedZoom, mapMinZoom, mapMaxZoom)
        : undefined
    const clampedCenter = currentCenter ? clampPointToBounds(currentCenter, getScaledInkMapBounds(INK_MAP_CENTER_LIMIT_RATIO)) : undefined
    const zoomChanged = requestedZoom !== undefined && clampedZoom !== undefined && Math.abs(requestedZoom - clampedZoom) > 0.01
    const centerChanged = currentCenter && clampedCenter && haversineDistanceMeters(currentCenter, clampedCenter) > 2

    if (!zoomChanged && !centerChanged) {
      return
    }

    const nextCenter = clampedCenter ?? currentCenter
    const nextZoom = clampedZoom ?? requestedZoom

    if (nextZoom !== undefined) {
      currentZoomRef.current = nextZoom
      setMapInteractionSnapshot((current) => ({
        ...current,
        currentZoom: nextZoom
      }))
    }

    if (nextCenter) {
      setMapBoundsSnapshot({
        center: nextCenter,
        zoom: nextZoom ?? requestedZoom ?? currentZoomRef.current
      })
    }

    const correctionLabel =
      centerChanged && zoomChanged
        ? `${reason}: center+zoom`
        : centerChanged
          ? `${reason}: center`
          : `${reason}: zoom`

    perfRecorder.recordMapVisualEvent({
      type: 'zoomClamped',
      currentZoom: nextZoom,
      requestedZoom,
      clampedZoom: nextZoom,
      reason,
      mapBoundsEnabled,
      mapBoundsDisabledReason,
      mapCenterLimitBounds: formatInkMapBoundsForPerf(getScaledInkMapBounds(INK_MAP_CENTER_LIMIT_RATIO)),
      mapVisualBufferBounds: formatInkMapBoundsForPerf(getScaledInkMapBounds(INK_MAP_VISUAL_BUFFER_RATIO)),
      currentMapCenter: nextCenter ? formatLatLngForPerf(nextCenter) : undefined,
      mapMinZoom,
      mapMaxZoom,
      zoomLimited: zoomChanged,
      edgeMistLevel: edgeMistState.level,
      edgeMistReason: edgeMistState.reason,
      edgeMistStrength: edgeMistState.strength,
      nearInkBoundary: edgeMistState.nearInkBoundary,
      distanceToInkBoundary: edgeMistState.distanceToInkBoundary,
      clearMaskMode: clearMaskState.mode,
      clearMaskSize: clearMaskState.size,
      clearMaskCenter: clearMaskState.center,
      clearMaskShape: clearMaskState.shape,
      cameraPresetTightened: true,
      lastBoundsCorrection: correctionLabel,
      noMapBoundsDebugOverride
    })

    if (typeof map.easeTo === 'function' && nextCenter) {
      const cameraOptions: { center: any; zoom?: number } = {
        center: new window.TMap.LatLng(nextCenter.lat, nextCenter.lng)
      }

      if (nextZoom !== undefined) {
        cameraOptions.zoom = nextZoom
      }

      map.easeTo(
        cameraOptions,
        { duration: SCENIC_CAMERA_BOUNDS.clampDurationMs }
      )
      return
    }

    if (nextCenter && typeof map.setCenter === 'function') {
      map.setCenter(new window.TMap.LatLng(nextCenter.lat, nextCenter.lng))
    }

    if (nextZoom !== undefined && typeof map.setZoom === 'function') {
      map.setZoom(nextZoom)
    }
  }

  function handleTourStopped({
    mode,
    reason
  }: {
    mode: Map3DTourMode
    reason: Map3DTourStopReason
  }) {
    const isCompleted = reason === 'completed'
    perfRecorder.recordTourEvent({
      type: isCompleted ? 'tourCompleted' : 'tourStopped',
      mode,
      reason,
      activeLandmarkId
    })
    if (mode === 'buddhaRealmTour') {
      finishTourRouteProgressOverlay(reason)
    }
    setTourMode('idle')
    setActiveTourStepId(undefined)
    setTourPreloadStopIds([])
    clearActiveLandmarkHighlight()
  }

  function handleBuddhaRealmTimelineFrame(frame: Map3DRouteTourFrame, elapsedMs: number) {
    const now = Date.now()
    const perfNow = typeof performance !== 'undefined' ? performance.now() : now
    const frameStats = buddhaTourFrameStatsRef.current

    if (frameStats.lastAt > 0) {
      const frameMs = Math.max(1, perfNow - frameStats.lastAt)
      frameStats.averageFrameMs = frameStats.averageFrameMs
        ? frameStats.averageFrameMs * 0.9 + frameMs * 0.1
        : frameMs
    }

    frameStats.lastAt = perfNow

    if (now - buddhaTourUiFrameRef.current > BUDDHA_REALM_TOUR_CONFIG.uiFrameThrottleMs || frame.progress >= 0.995) {
      const activeId = frame.nearbyLandmarkId
      setTourMode('buddhaRealmTour')
      setActiveCameraMode(activeId ? 'landmarkFocus' : 'guideFollow')
      setActiveTourStepId(activeId)
      const frameRouteIndex = clampNumber(
        frame.routeProgressIndex ?? Math.round(frame.progress * Math.max(0, currentRoutePath.length - 1)),
        0,
        Math.max(0, currentRoutePath.length - 1)
      )
      const routePoint = currentRoutePath[frameRouteIndex] ?? currentRoutePath[0]

      if (routePoint) {
        const preloadStopCount = frame.progress < BUDDHA_TOUR_EARLY_PRELOAD_PROGRESS ? 2 : 3
        const nextPreloadStopIds = getTourPreloadStopIdsByProgress({
          progress: frame.progress,
          routeStops,
          routePath: currentRoutePath,
          cumulative: currentRouteCumulativeDistances,
          count: preloadStopCount
        })
        const nextPreloadLandmarkIds = nextPreloadStopIds
          .map((id) => resolveLandmarkInspectorIdFromRouteId(id, landmarkModelOverlays))
          .filter((id): id is string => Boolean(id))

        preloadMap3DLandmarkAssets(nextPreloadLandmarkIds)

        setTourPreloadStopIds((current) =>
          areStringArraysEqual(current, nextPreloadStopIds) ? current : nextPreloadStopIds
        )

        const nextStopIndex = getNearestStopIndex(routePoint, routeStops)

        if (isMobileViewport) {
          updateSimulatedUserMarkerPosition(routePoint)
        } else {
          setRoutePathIndex(frameRouteIndex)
          setSimulatedPosition(routePoint)
          setSelectedStopIndex(nextStopIndex)
        }
      }

      if (activeId) {
        setActiveLandmarkHighlight(activeId)
      } else {
        clearActiveLandmarkHighlight()
      }

      buddhaTourUiFrameRef.current = now
    }
    updateTourRouteProgressOverlay(frame.progress)
    sceneWindowManager.update({
      cameraPosition: {
        lat: frame.lat,
        lng: frame.lng
      },
      progress: frame.progress
    })
    sceneStateManager.update({
      cameraPosition: {
        lat: frame.lat,
        lng: frame.lng
      },
      progress: frame.progress
    })

    const progressBucket = Math.floor(frame.progress * 10)

    if (progressBucket > buddhaTourProgressBucketRef.current && progressBucket >= 0 && progressBucket <= 10) {
      buddhaTourProgressBucketRef.current = progressBucket
      perfRecorder.recordTourEvent({
        type: 'tourProgress',
        mode: 'buddhaRealmTour',
        progress: frame.progress,
        targetLat: frame.lat,
        targetLng: frame.lng,
        bearing: frame.bearing,
        nearbyLandmarkId: frame.nearbyLandmarkId,
        activeLandmarkId: frame.nearbyLandmarkId,
        cameraPreset: frame.nearbyLandmarkId ? 'landmarkFocus' : 'guideFollow',
        durationMs: Math.round(elapsedMs),
        smoothingEnabled: frame.smoothingEnabled,
        lookAheadProgress: frame.lookAheadProgress,
        lateralOffsetMeters: frame.lateralOffsetMeters,
        tourCameraTightenMode: frame.tourCameraTightenMode,
        tourCameraTightenStrength: frame.tourCameraTightenStrength,
        tourProfile: isMobileViewport ? 'mobile-stable' : 'desktop-cinematic',
        tourCameraUpdateFps: roundNumber(1000 / (isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : BUDDHA_REALM_TOUR_CONFIG.minFrameMs), 1),
        tourMarkerUpdateFps: roundNumber(1000 / (isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : 34), 1),
        tourCameraSmoothed: true,
        tourBoundsClampPaused: true,
        averageFrameMs: frameStats.averageFrameMs ? roundNumber(frameStats.averageFrameMs, 1) : undefined,
        estimatedFps: frameStats.averageFrameMs ? roundNumber(1000 / frameStats.averageFrameMs, 1) : undefined
      })
    }
  }

  function startBuddhaRealmTourPlayback() {
    if (isInk2DPresentation) {
      moveToNextImmersiveStop()
      return
    }

    if (tourMode === 'buddhaRealmTour') {
      stopActiveTour('userStop')
      return
    }

    if (!canUseMapInteractions || !mapRef.current || !window.TMap) {
      return
    }

    const timelineTour = buildBuddhaRealmTimelineTourConfig(currentRoutePath, routeStops)
    stopActiveTour('replaced')
    resetTourRouteProgressOverlay(false)
    const initialPreloadStopIds = getTourPreloadStopIdsByProgress({
      progress: 0,
      routeStops,
      routePath: currentRoutePath,
      cumulative: currentRouteCumulativeDistances,
      count: 2
    })
    const initialPreloadLandmarkIds = initialPreloadStopIds
      .map((id) => resolveLandmarkInspectorIdFromRouteId(id, landmarkModelOverlays))
      .filter((id): id is string => Boolean(id))

    preloadMap3DLandmarkAssets(initialPreloadLandmarkIds)
    setTourMode('buddhaRealmTour')
    setActiveTourStepId(undefined)
    setTourPreloadStopIds(initialPreloadStopIds)
    clearActiveLandmarkHighlight()
    buddhaTourUiFrameRef.current = 0
    buddhaTourProgressBucketRef.current = -1
    buddhaTourFrameStatsRef.current = { lastAt: 0, averageFrameMs: 0 }

    if (timelineTour) {
      const tourProfile = isMobileViewport ? 'mobile-stable' : 'desktop-cinematic'

      startBuddhaRealmTimelineTour({
        map: mapRef.current,
        TMap: window.TMap,
        sequenceRef: cameraSequenceRef,
        playbackRef: tourPlaybackRef,
        durationMs: timelineTour.durationMs,
        pauses: timelineTour.pauses,
        minFrameMs: isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : BUDDHA_REALM_TOUR_CONFIG.minFrameMs,
        getSpeedMultiplier: (progress) => getBuddhaRealmTimelineSpeed(progress, timelineTour.pauses),
        getFrame: createBuddhaRealmTimelineFrameSampler(timelineTour, tourProfile),
        onStarted: ({ durationMs, pauseCount }) => {
          startTourRouteProgressOverlay()
          setActiveCameraMode('guideFollow')
          perfRecorder.recordTourEvent({
            type: 'tourStarted',
            mode: 'buddhaRealmTour',
            stepCount: pauseCount,
            durationMs,
            smoothingEnabled: true,
            lookAheadProgress: BUDDHA_REALM_TOUR_CONFIG.lookAheadProgress.cruise,
            lateralOffsetMeters: BUDDHA_REALM_TOUR_CONFIG.lateralOffsetMeters.cruise,
            tourProfile,
            tourCameraUpdateFps: roundNumber(1000 / (isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : BUDDHA_REALM_TOUR_CONFIG.minFrameMs), 1),
            tourMarkerUpdateFps: roundNumber(1000 / (isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : 34), 1),
            tourCameraSmoothed: true,
            tourBoundsClampPaused: true
          })
        },
        onFrame: ({ frame, elapsedMs }) => handleBuddhaRealmTimelineFrame(frame, elapsedMs),
        onLandmarkPause: ({ pause, frame }) => {
          setActiveCameraMode('landmarkFocus')
          setTourMode('buddhaRealmTour')
          setActiveTourStepId(pause.nearbyLandmarkId)
          setActiveLandmarkHighlight(pause.nearbyLandmarkId)
          perfRecorder.recordTourEvent({
            type: 'tourLandmarkPause',
            mode: 'buddhaRealmTour',
            stepId: pause.id,
            stepLabel: pause.label,
            progress: frame.progress,
            targetLat: frame.lat,
            targetLng: frame.lng,
            bearing: frame.bearing,
            nearbyLandmarkId: pause.nearbyLandmarkId,
            activeLandmarkId: pause.nearbyLandmarkId,
            cameraPreset: 'landmarkFocus',
            durationMs: pause.holdMs,
            smoothingEnabled: frame.smoothingEnabled,
            lookAheadProgress: frame.lookAheadProgress,
            lateralOffsetMeters: frame.lateralOffsetMeters,
            tourCameraTightenMode: frame.tourCameraTightenMode,
            tourCameraTightenStrength: frame.tourCameraTightenStrength,
            tourProfile: isMobileViewport ? 'mobile-stable' : 'desktop-cinematic',
            tourCameraUpdateFps: roundNumber(1000 / (isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : BUDDHA_REALM_TOUR_CONFIG.minFrameMs), 1),
            tourMarkerUpdateFps: roundNumber(1000 / (isMobileViewport ? MOBILE_BUDDHA_TOUR_CAMERA_FRAME_MS : 34), 1),
            tourCameraSmoothed: true,
            tourBoundsClampPaused: true,
            averageFrameMs: buddhaTourFrameStatsRef.current.averageFrameMs
              ? roundNumber(buddhaTourFrameStatsRef.current.averageFrameMs, 1)
              : undefined,
            estimatedFps: buddhaTourFrameStatsRef.current.averageFrameMs
              ? roundNumber(1000 / buddhaTourFrameStatsRef.current.averageFrameMs, 1)
              : undefined
          })
        },
        onStopped: handleTourStopped
      })
      return
    }

    const steps = buildBuddhaRealmPoiFallbackSteps(routeStops, currentRouteCenter)

    startBuddhaRealmTour({
      map: mapRef.current,
      TMap: window.TMap,
      steps,
      sequenceRef: cameraSequenceRef,
      playbackRef: tourPlaybackRef,
      onStarted: ({ stepCount }) => {
        perfRecorder.recordTourEvent({
          type: 'tourStarted',
          mode: 'buddhaRealmTour',
          stepCount
        })
      },
      onStep: ({ step, stepIndex, stepCount, preset }) => {
        const activeId = step.activeLandmarkId ?? step.nearbyLandmarkId ?? step.targetLandmarkId
        const stepRouteIndex = step.routeProgressIndex ?? Math.round((step.progress ?? 0) * (currentRoutePath.length - 1))
        const stepStopIndex = getNearestStopIndex(step.target, routeStops)
        setTourMode('buddhaRealmTour')
        setActiveTourStepId(activeId)
        setActiveCameraMode(preset.id)
        setRoutePathIndex(stepRouteIndex)
        setSelectedStopIndex(stepStopIndex)
        setSimulatedPosition(currentRoutePath[stepRouteIndex] ?? step.target)
        sceneWindowManager.update({
          cameraPosition: step.target,
          progress: step.progress
        })
        sceneStateManager.update({
          cameraPosition: step.target,
          progress: step.progress
        })
        if (activeId) {
          setActiveLandmarkHighlight(activeId)
        } else {
          clearActiveLandmarkHighlight()
        }
        perfRecorder.recordTourEvent({
          type: step.speedMode === 'pause' ? 'tourLandmarkPause' : 'tourWaypoint',
          mode: 'buddhaRealmTour',
          stepId: step.id,
          stepLabel: step.label,
          stepIndex,
          stepCount,
          activeLandmarkId: activeId,
          nearbyLandmarkId: step.nearbyLandmarkId,
          progress: step.progress,
          targetLat: step.target.lat,
          targetLng: step.target.lng,
          bearing: step.bearing,
          cameraPreset: preset.id,
          targetPoiId: step.targetPoiId,
          targetLandmarkId: step.targetLandmarkId,
          durationMs: preset.durationMs
        })
      },
      onCameraComplete: (event) => perfRecorder.recordCameraEvent(event),
      onStopped: handleTourStopped
    })
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
      `routePathIndex=${routePathIndex}/${Math.max(0, currentRoutePath.length - 1)}`,
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

  const copyInkBoundsConfig = async () => {
    const ok = await copyText(buildInkBoundsExportSnippet(inkBoundsDraft))
    setInkBoundsCopyStatus(ok ? '已复制四角经纬度配置' : '复制失败，请查看浏览器权限')
  }

  const clearInkBoundsDraft = () => {
    setInkBoundsDraft(createEmptyInkMapBoundsDraft())
    setInkBoundsCopyStatus('已清空，请从 northwest 重新点击')
  }

  const prepareInkBaseScreenshot = () => {
    setInkExportUiHidden(true)
  }

  const mobilePanelToggleLabel = mobilePanelsCollapsed ? '展开' : '收起'
  const mobilePanelSummary = `${currentStop?.name ?? '路线中段'} → ${nextStopPoi?.name ?? '路线终点'}`
  const handleMobileGuideSummaryKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setMobilePanelsCollapsed((collapsed) => !collapsed)
    }
  }

  useEffect(() => {
    if (!inkExportUiHidden) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInkExportUiHidden(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [inkExportUiHidden])

  return (
    <main
      className={`map-3d-guide-shell ${visualVariant.className} ${''} ${
        debugPerf ? 'map-3d-guide-shell--debug-perf' : ''
      } ${debugInkBounds ? 'map-3d-guide-shell--debug-ink-bounds' : ''} ${
        exportInkBase ? 'map-3d-guide-shell--export-ink-base' : ''
      } ${shotGuide ? 'map-3d-guide-shell--ink-shot-guide' : ''} ${
        captureFrame || cleanShot ? 'map-3d-guide-shell--ink-capture-frame' : ''
      } ${captureFrame ? 'map-3d-guide-shell--ink-capture-frame-guide' : ''} ${
        cleanShot ? 'map-3d-guide-shell--clean-shot' : ''
      } ${isInkCleanMode ? 'map-3d-guide-shell--ink-clean-mode' : ''} ${
        inkExportUiSuppressed ? 'is-ink-export-ui-hidden' : ''
      } ${
        isMapVisualReady ? 'is-map-visual-ready' : 'is-map-visual-loading'
      } ${
        loadingCurtainVisible ? 'is-loading-curtain-visible' : ''
      } ${mapReadyTimedOut ? 'is-map-ready-timeout' : ''} ${
        mobilePanelsCollapsed ? 'map-3d-guide-shell--mobile-panels-collapsed' : ''
      } ${isInk2DPresentation ? 'map-3d-guide-shell--ink2d' : 'map-3d-guide-shell--scenic3d'}`}
      data-map-presentation={scenicMapPresentation}
      data-presentation-transition={presentationTransition}
      data-presentation-switching={isPresentationSwitching ? 'true' : 'false'}
      data-presentation-switch-error={presentationSwitchError ?? ''}
      data-presentation-cloud={presentationCloudPhase}
      data-map-view-mode={effectiveGuideState.viewMode}
      data-map-camera-scope={cameraScope}
      data-route-id={effectiveGuideState.routeId}
      data-route-stage={effectiveGuideState.routeStage}
      data-route-stop-index={effectiveGuideState.stopIndex}
      data-xiaoling-mode={effectiveGuideState.xiaolingMode}
    >
      <MapRuntimeErrorBoundary
        key={`map-runtime-${mapContainerGeneration}`}
        onError={(error, info) => {
          console.error('[Map3D] map runtime render error', error, info)
          setLastMapError(error.message)
          hardRecoveryRequestRef.current('map-runtime-error-boundary', error)
        }}
      >
        <div key={`tmap-container-${mapContainerGeneration}`} ref={mapElementRef} className="map-3d-guide-map" />
      </MapRuntimeErrorBoundary>
      {inkTilesEnabled && inkTileDomFallbackActive && !inkTileGroundFallbackActive ? (
        <div
          ref={inkTileDomFallbackLayerRef}
          className="map-3d-guide-ink-overlay map-3d-guide-ink-tile-fallback"
          style={{ opacity: inkTileOpacityEffective }}
          aria-hidden="true"
        >
          <img
            src={inkTileSourceConfig.imageUrl}
            alt=""
            draggable={false}
            onLoad={() => {
              perfRecorder.recordMapVisualEvent({
                type: 'inkTileLayerStateChanged',
                inkTilesEnabled: true,
                inkTileOpacity: inkTileOpacityEffective,
                inkTileOpacityBase: inkTileOpacity,
                inkTileOpacityEffective,
                inkTileZoomFade: getInkTileZoomFade(currentZoomRef.current),
                inkTileUrlTemplate: inkTileSourceConfig.tileUrlTemplate,
                inkTileZoomLevels: [...LINGSHAN_INK_TILE_ZOOM_LEVELS],
                inkTileMaxNativeZoom: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
                inkTileUsingFallbackZoom: Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
                inkTileFallbackFromZ:
                  Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM ? Math.floor(currentZoomRef.current) : undefined,
                inkTileFallbackToZ: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
                inkTileBounds: formatConfiguredInkBoundsForPerf(),
                inkTileMode: 'web-mercator-local',
                inkTileLayerReady: true,
                inkTileLayerError: 'DOM fallback 显示中',
                mapBoundaryEnabled: true
              })
            }}
            onError={() => {
              perfRecorder.recordMapVisualEvent({
                type: 'inkTileLayerStateChanged',
                inkTilesEnabled: true,
                inkTileOpacity: inkTileOpacityEffective,
                inkTileOpacityBase: inkTileOpacity,
                inkTileOpacityEffective,
                inkTileZoomFade: getInkTileZoomFade(currentZoomRef.current),
                inkTileUrlTemplate: inkTileSourceConfig.tileUrlTemplate,
                inkTileZoomLevels: [...LINGSHAN_INK_TILE_ZOOM_LEVELS],
                inkTileMaxNativeZoom: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
                inkTileUsingFallbackZoom: Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
                inkTileFallbackFromZ:
                  Math.floor(currentZoomRef.current) > LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM ? Math.floor(currentZoomRef.current) : undefined,
                inkTileFallbackToZ: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM,
                inkTileBounds: formatConfiguredInkBoundsForPerf(),
                inkTileMode: 'web-mercator-local',
                inkTileLayerReady: false,
                inkTileLayerError: `DOM fallback 图片未找到：${inkTileSourceConfig.imageUrl}`,
                mapBoundaryEnabled: true
              })
            }}
          />
        </div>
      ) : null}
      {inkOverlayEnabled ? (
        <div
          ref={inkOverlayLayerRef}
          className="map-3d-guide-ink-overlay"
          data-camera-mode={inkOverlayCameraSnapshot.mode}
          style={{ opacity: inkOverlayCameraSnapshot.effectiveOpacity }}
          aria-hidden="true"
        >
          <img
            src={inkOverlayImageUrl}
            alt=""
            draggable={false}
            onLoad={() => {
              inkOverlayImageReadyRef.current = true
              inkOverlayLayerErrorRef.current = ''
              setInkOverlayLayerReady(true)
              setInkOverlayLayerError('')
              perfRecorder.recordMapVisualEvent({
                type: 'inkOverlayStateChanged',
                inkOverlayEnabled: true,
                inkOverlaySource,
                inkOverlayImageUrl,
                inkOverlayOpacity,
                inkOverlayOffsetX: inkOverlayAdjustments.offsetX,
                inkOverlayOffsetY: inkOverlayAdjustments.offsetY,
                inkOverlayScaleX: inkOverlayAdjustments.scaleX,
                inkOverlayScaleY: inkOverlayAdjustments.scaleY,
                inkOverlayCompare,
                inkOverlayBounds: formatConfiguredInkBoundsForPerf(),
                inkOverlayLayerReady: true,
                inkOverlayLayerMode: 'dom',
                inkOverlayCameraMode: inkOverlayCameraStateRef.current.mode,
                inkOverlayEffectiveOpacity: inkOverlayCameraStateRef.current.effectiveOpacity,
                inkOverlaySuppressedReason: inkOverlayCameraStateRef.current.reason
              })
            }}
            onError={() => {
              const error = `图片未找到：${inkOverlayImageUrl}`
              inkOverlayImageReadyRef.current = false
              inkOverlayLayerErrorRef.current = error
              setInkOverlayLayerReady(false)
              setInkOverlayLayerError(error)
              perfRecorder.recordMapVisualEvent({
                type: 'inkOverlayStateChanged',
                inkOverlayEnabled: true,
                inkOverlaySource,
                inkOverlayImageUrl,
                inkOverlayOpacity,
                inkOverlayOffsetX: inkOverlayAdjustments.offsetX,
                inkOverlayOffsetY: inkOverlayAdjustments.offsetY,
                inkOverlayScaleX: inkOverlayAdjustments.scaleX,
                inkOverlayScaleY: inkOverlayAdjustments.scaleY,
                inkOverlayCompare,
                inkOverlayBounds: formatConfiguredInkBoundsForPerf(),
                inkOverlayLayerReady: false,
                inkOverlayLayerError: error,
                inkOverlayLayerMode: 'dom',
                inkOverlayCameraMode: inkOverlayCameraStateRef.current.mode,
                inkOverlayEffectiveOpacity: inkOverlayCameraStateRef.current.effectiveOpacity,
                inkOverlaySuppressedReason: inkOverlayCameraStateRef.current.reason
              })
            }}
          />
        </div>
      ) : null}
      {inkOverlayEnabled ? (
        <div className="map-3d-guide-ink-overlay-note" aria-live="polite">
          <strong>水墨单图验证</strong>
          <span>{getInkOverlayCameraModeLabel(inkOverlayCameraSnapshot.mode)}</span>
          <small>
            {getInkOverlaySourceLabel(inkOverlaySource)}
            {inkOverlayCompare ? ' · 半透明对照' : ''} · offset {inkOverlayAdjustments.offsetX}/{inkOverlayAdjustments.offsetY} · scale{' '}
            {inkOverlayAdjustments.scaleX}/{inkOverlayAdjustments.scaleY}
          </small>
          <small>DOM overlay 仅用于正北俯视校验；3D 视角会自动降级或隐藏。</small>
        </div>
      ) : null}
      {presentationCloudPhase !== 'hidden' && typeof document !== 'undefined'
        ? createPortal(
            <div
              className={`map-presentation-cloud map-presentation-cloud--${presentationCloudPhase}`}
              role="status"
              aria-live="polite"
              aria-label="地图视角切换中"
            >
              <span className="map-presentation-cloud__bank map-presentation-cloud__bank--left" />
              <span className="map-presentation-cloud__bank map-presentation-cloud__bank--center" />
              <span className="map-presentation-cloud__bank map-presentation-cloud__bank--right" />
              <span className="map-presentation-cloud__label">正在切换地图视角</span>
            </div>,
            document.body
          )
        : null}
      <ScenicPoiBillboards
        map={mapRef.current}
        mapReady={
          visualVariant.id === 'prototype-c' &&
          mapVisualReadyForOverlays &&
          !isInkCleanMode &&
          !isInk2DPresentation &&
          (isRouteGuideView || poiLayerMode === 'core')
        }
        items={scenicPoiBillboards}
        mode={poiBillboardMode}
        activeId={poiBillboardActiveId}
        nextId={poiBillboardNextId}
        suppressInactive={tourPoiSuppressionEnabled}
        layerManager={layerManager}
        onSelectPoi={(id) => {
          const stopIndex = routeStops.findIndex((stop) => stop.spotId === id)
          const poi = lingshanPois.find((item) => item.id === id)

          if (hasMapEnabledScenicPoi(id)) {
            setSelectedPoiId(id)
            stopActiveTour('manual')
            if (poi) {
              setActiveLandmarkId(id)
              focusLandmarkCamera(id, getBestPoiLocation(poi), false)
            }
            if (effectiveGuideState.viewMode === 'route' && effectiveGuideState.routeId) {
              goToPoiFromRoute(navigate, id, {
                routeId: effectiveGuideState.routeId,
                poiStopIndex: stopIndex >= 0 ? stopIndex : effectiveRouteStopIndex,
                returnStage: getPoiReturnStage(routeGuideStage),
                returnStopIndex: effectiveRouteStopIndex,
                presentation: scenicMapPresentation
              })
            } else {
              goToPoiFromBrowse(navigate, id, scenicMapPresentation)
            }
            return
          }

          if (stopIndex >= 0) {
            moveToStop(stopIndex)
            return
          }

          if (poi) {
            stopActiveTour('manual')
            setActiveLandmarkId(id)
            focusLandmarkCamera(id, getBestPoiLocation(poi), false)
          }
        }}
      />
      <PoiCoordinateCalibrationPanel
        enabled={debugPoiCalibration}
        map={mapRef.current}
        mapReady={mapVisualReadyForOverlays}
        isCurrentMap={isMapInstanceCurrent}
      />
      {exportInkBase && showRoadCheck && !inkExportUiSuppressed ? (
        <div className="map-3d-guide-ink-road-check" aria-hidden="true">
          道路校验占位层 · 后续根据导出底图人工/半自动提取
        </div>
      ) : null}
      {exportInkBase && shotGuide && !inkExportUiSuppressed ? (
        <div className="map-3d-guide-shot-guide-frame" aria-hidden="true">
          <strong>截图范围：4096×4096 水墨底图</strong>
          <span>确认范围后，请切换 cleanShot 截取同一地图区域</span>
        </div>
      ) : null}
      {exportInkBase && shotGuide && !inkExportUiSuppressed ? (
        <div className="map-3d-guide-shot-guide-warning">
          当前浏览器窗口不是 1:1 时，请使用固定导出画布或调整窗口为正方形。
        </div>
      ) : null}
      {exportInkBase && captureFrame && !inkExportUiSuppressed ? (
        <div className="map-3d-guide-capture-frame-note">
          <strong>固定 1:1 导出画布</strong>
          <span>请只截取中间正方形地图容器；后续可放大到 4096×4096 或用设备像素比导出。</span>
        </div>
      ) : null}
      {loadingCurtainVisible ? (
        <div className={`map-3d-guide-loading-curtain ${isMapVisualReady ? 'is-hiding' : ''}`} aria-live="polite">
          <div>
            <strong>
              {mapReadyTimedOut
                ? startupStage === 'failed'
                  ? '地图底图加载失败'
                  : '地图底图加载较慢'
                : isMapCreated
                  ? isMapIdle
                    ? '正在柔化沙盘视野'
                    : '正在展开佛境沙盘'
                  : '正在连接腾讯底图'}
            </strong>
            <span>
              {mapReadyTimedOut
                ? startupStage === 'failed'
                  ? '已保留浅色佛境兜底，可重新加载地图'
                  : '正在继续展开佛境沙盘，底图可见后再显示路线与核心地标'
                : startupStage === 'loadingSdk'
                  ? '加载腾讯地图 SDK'
                  : startupStage === 'creatingMap'
                    ? '创建地图实例与初始视角'
                    : startupStage === 'waitingBaseMap'
                      ? '等待底图瓦片完成首帧渲染'
                      : '加载地图底图与核心地标'}
            </span>
            {mapReadyTimedOut ? (
              <div className="map-3d-guide-loading-curtain__actions">
                <button type="button" onClick={() => setPageMessage('继续等待腾讯底图稳定渲染...')}>
                  继续等待
                </button>
                <button type="button" onClick={() => window.location.reload()}>
                  重新加载地图
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {debugInkBounds && !inkExportUiSuppressed ? (
        <aside className="map-3d-guide-ink-tool map-3d-guide-ink-tool--bounds">
          <div className="map-3d-guide-ink-tool__header">
            <strong>水墨底图四角拾取</strong>
            <span>{nextInkBoundsCorner ? `下一角：${inkMapBoundCornerLabels[nextInkBoundsCorner]}` : '四角已完成'}</span>
          </div>
          <p>依次点击 northwest、northeast、southeast、southwest。暖金框为当前正式边界，青绿点为正在重选的新边界。</p>
          <div className="map-3d-guide-ink-tool__bounds-note">正式边界参考 · 水墨底图正式覆盖范围 / 4096×4096</div>
          <dl>
            {inkMapBoundCornerOrder.map((corner) => {
              const point = configuredInkBoundsDraft[corner]
              return (
                <div key={`formal-${corner}`}>
                  <dt>{inkMapBoundCornerShortLabels[corner]}</dt>
                  <dd>{point ? `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}` : '未配置'}</dd>
                </div>
              )
            })}
          </dl>
          <div className="map-3d-guide-ink-tool__bounds-note">正在拾取的新边界</div>
          <dl>
            {inkMapBoundCornerOrder.map((corner) => {
              const point = inkBoundsDraft[corner]
              return (
                <div key={corner}>
                  <dt>{inkMapBoundCornerLabels[corner]}</dt>
                  <dd>{point ? `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}` : '待点击'}</dd>
                </div>
              )
            })}
          </dl>
          <div className="map-3d-guide-ink-tool__actions">
            <button type="button" onClick={copyInkBoundsConfig} disabled={!inkBoundsComplete}>
              复制四角 JSON
            </button>
            <button type="button" onClick={clearInkBoundsDraft}>
              清空重选
            </button>
          </div>
          <small>{inkBoundsCopyStatus}</small>
        </aside>
      ) : null}
      {exportInkBase && !inkExportUiSuppressed ? (
        <aside className="map-3d-guide-ink-tool map-3d-guide-ink-tool--export">
          <div className="map-3d-guide-ink-tool__header">
            <strong>腾讯无 POI 底图导出</strong>
            <span>{showRoadCheck ? 'road check 占位已开' : 'exportInkBase=1'}</span>
          </div>
          <p>当前为正北俯视导出模式：已使用正式 V2 水墨边界，并隐藏项目 GLB、路线、POI 题签和佛境氛围层。</p>
          <div className="map-3d-guide-ink-tool__bounds-note">水墨底图正式覆盖范围 / 4096×4096</div>
          <dl>
            {inkMapBoundCornerOrder.map((corner) => {
              const point = configuredInkBoundsDraft[corner]
              return (
                <div key={`export-${corner}`}>
                  <dt>{inkMapBoundCornerShortLabels[corner]}</dt>
                  <dd>{point ? `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}` : '未配置'}</dd>
                </div>
              )
            })}
          </dl>
          <ul>
            <li>建议浏览器缩放 100%，用 DevTools 截取地图区域。</li>
            <li>如需 4096×4096，可使用设备模式设置视口后截图。</li>
            <li>检查边界：当前页面显示暖金边界框。</li>
            <li>对齐校验：先打开 `inkSource=base` 贴回腾讯原始底图，再切 `inkSource=ai` / `inkSource=jimeng` 比较生成图是否漂移。</li>
            <li>半透明对照：追加 `inkCompare=1`；临时微调可用 `inkOffsetX/Y` 与 `inkScaleX/Y`，不改正式边界。</li>
            <li>查看截图范围：打开 `?exportInkBase=1&shotGuide=1`。</li>
            <li>固定正方形画布：打开 `?exportInkBase=1&captureFrame=1`。</li>
            <li>干净截图：打开 `?exportInkBase=1&cleanShot=1`。</li>
            <li>本页仍用于无 POI 底图导出；本地瓦片仅调试备用，默认不启用。</li>
          </ul>
          <div className="map-3d-guide-ink-tool__actions">
            <button type="button" onClick={prepareInkBaseScreenshot}>
              准备截图
            </button>
            <button type="button" onClick={() => window.location.assign('/map-3d-guide-c?debugInkBounds=1')}>
              去拾取四角
            </button>
          </div>
          <small>准备截图后按 Esc 恢复 UI。</small>
        </aside>
      ) : null}
      {(
        <header className="map-3d-guide-mobile-topbar">
          <div>
            <strong>灵山胜境 AI 导览</strong>
            <span>{currentRouteConfig.name} · {tourMode === 'buddhaRealmTour' ? '沉浸导览中' : guideStateText}</span>
          </div>
          <button type="button" onClick={() => setMobilePanelsCollapsed((collapsed) => !collapsed)} aria-expanded={!mobilePanelsCollapsed}>
            {mobilePanelToggleLabel}
          </button>
        </header>
      )}
      {(
        <section className={`map-3d-guide-mobile-guide ${mobilePanelsCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
          <div
            className="map-3d-guide-mobile-guide__summary"
            role="button"
            tabIndex={0}
            aria-expanded={!mobilePanelsCollapsed}
            onClick={() => setMobilePanelsCollapsed((collapsed) => !collapsed)}
            onKeyDown={handleMobileGuideSummaryKeyDown}
          >
            <div>
              <span>当前站</span>
              <strong>{currentStop?.name ?? '路线中段'}</strong>
            </div>
            <div>
              <span>下一站</span>
              <strong>{nextStopPoi?.name ?? '路线终点'}</strong>
            </div>
            <div>
              <span>距离</span>
              <strong>{distanceToNextStopText}</strong>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                moveToNextImmersiveStop()
              }}
              disabled={!canUseMapInteractions}
            >
              沉浸切换
            </button>
          </div>

          {!mobilePanelsCollapsed ? (
            <div className="map-3d-guide-mobile-guide__drawer">
              <div className="map-3d-guide-mobile-guide__handle" aria-hidden="true" />
              <div className="map-3d-guide-mobile-guide__section map-3d-guide-mobile-guide__route-head">
                <div>
                  <span>当前路线</span>
                  <strong>{currentRouteConfig.name}</strong>
                  <small>{currentRouteConfig.subtitle} · {currentRouteConfig.guideRoute.durationLabel}</small>
                </div>
                <button type="button" onClick={() => setMobilePanelsCollapsed(true)}>
                  收起
                </button>
              </div>

              <div className="map-3d-guide-mobile-guide__routes" aria-label="移动端路线切换">
                {routeOptions.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    className={route.id === currentRouteConfig.id ? 'is-active' : ''}
                    onClick={() => switchScenicRoute(route.id)}
                    disabled={!canUseMapInteractions && mapStatus !== 'ready'}
                  >
                    <strong>{route.name}</strong>
                    <span>{route.theme}</span>
                  </button>
                ))}
              </div>

              <div className="map-3d-guide-mobile-guide__stations" aria-label="移动端站点切换">
                {routeStops.map((stop, index) => {
                  const poi = getPoiDisplay(stop.spotId)
                  const active = index === selectedStopIndex
                  const isNext = stop.spotId === nextStop.nextStopId

                  return (
                    <button
                      key={stop.spotId}
                      type="button"
                      className={[active ? 'is-active' : '', isNext ? 'is-next' : ''].filter(Boolean).join(' ')}
                      onClick={() => moveToStop(index)}
                    >
                      <span>{index + 1}</span>
                      {poi?.name ?? stop.spotId}
                    </button>
                  )
                })}
              </div>

              <div className="map-3d-guide-mobile-guide__camera" aria-label="移动端相机控制">
                {visibleCameraPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={preset.id === activeCameraMode ? 'is-active' : ''}
                    onClick={() => applyGuideCamera(preset.id)}
                    disabled={!canUseMapInteractions}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="map-3d-guide-mobile-guide__status">
                <span>{mobilePanelSummary}</span>
                <span>进度 {routeProgressPercent}%</span>
                <span>{isTourPlaying ? tourStateLabel : guideStateText}</span>
              </div>

              <div className="map-3d-guide-mobile-guide__actions">
                <button type="button" onClick={() => moveToStop(selectedStopIndex - 1)}>
                  上一站
                </button>
                <button type="button" onClick={() => moveToStop(selectedStopIndex + 1)}>
                  下一站
                </button>
                <button type="button" onClick={returnToRoute}>
                  回到路线
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}
      {(
        <section className="map-3d-guide-hero">
          <div className="map-3d-guide-kicker">{visualVariant.kicker}</div>
          <h1>{visualVariant.title}</h1>
          <p>{currentRouteConfig.name} · {visualVariant.subtitle}</p>
          <div className="map-3d-guide-top-actions">
            <button type="button" onClick={() => navigate('/map')}>
              进入真实地图
            </button>
            <button type="button" onClick={() => navigate('/scenic-3d-map-prototype')}>
              进入文化沙盘
            </button>
          </div>
        </section>
      )}

      {(
        <section className="map-3d-guide-routes" aria-label="3D 导览路线切换">
          <div className="map-3d-guide-routes__header">
            <strong>主题路线</strong>
            <span>{currentRouteConfig.subtitle} · {currentRouteConfig.theme}</span>
          </div>
          <div className="map-3d-guide-routes__list">
            {routeOptions.map((route) => (
              <button
                key={route.id}
                type="button"
                className={route.id === currentRouteConfig.id ? 'is-active' : ''}
                onClick={() => switchScenicRoute(route.id)}
                disabled={!canUseMapInteractions && mapStatus !== 'ready'}
              >
                <strong>{route.name}</strong>
                <span>{route.theme} · {route.durationLabel}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="map-3d-guide-camera">
        <div>
          <strong>导览相机</strong>
          <span>{activeCameraPreset.description}</span>
        </div>
        <div className="map-3d-guide-camera__buttons">
          {visibleCameraPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={preset.id === activeCameraMode ? 'is-active' : ''}
              onClick={() => applyGuideCamera(preset.id)}
              disabled={!canUseMapInteractions}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={moveToNextImmersiveStop}
            disabled={!canUseMapInteractions}
          >
            沉浸切换
          </button>
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
                  max={Math.max(0, currentRoutePath.length - 1)}
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

      {debugPerf ? <Map3DPerfPanel landmarkInspector={landmarkInspector} recorder={perfRecorder} /> : null}

      <aside className="map-3d-guide-status">
        <span className="map-3d-guide-beta">Beta</span>
        <h2>{visualVariant.statusTitle}</h2>
        {null}
        <dl>
          <div>
            <dt>当前路线</dt>
            <dd>{currentRouteConfig.name}</dd>
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
          <div>
            <dt>导览状态</dt>
            <dd>{tourStateLabel}</dd>
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

        {debugPerf ? (
          <label className="map-3d-guide-model-toggle">
            <input
              type="checkbox"
              checked={showModelBeta}
              onChange={(event) => setShowModelBeta(event.target.checked)}
            />
            <span>地标调试入口</span>
          </label>
        ) : (
          <p className="map-3d-guide-model-state">正式 3D 地标自动加载</p>
        )}
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
            <strong>3D 渲染状态</strong>
            <span>
              enableBloom：{MAP_3D_GUIDE_RENDER_OPTIONS.enableBloom ? '开启，泛光实验中' : '关闭'}
            </span>
            <span>persistent fog / mountain / canvas mist：已移除</span>
            <span>仅 2D / 3D 切换时显示短暂云层转场。</span>
            <p>
              腾讯地图平台托管自定义图层已默认启用：{TENCENT_CUSTOM_LAYER_NAME}（layerId {TENCENT_CUSTOM_LAYER_ID}）；
              `noInkTiles=1` 可临时回到腾讯原底图。
            </p>
          </div>
        </details>
      </aside>

      {(
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
      )}

      {(
      <footer className="map-3d-guide-controlbar">
        <div className="map-3d-guide-progress">
          <span style={{ width: `${routeProgressPercent}%` }} />
        </div>
        <div className="map-3d-guide-controlbar__meta">
          <strong>{visualVariant.controlTitle}</strong>
          <div className="map-3d-guide-console-grid">
            <span>
              <em>当前路线</em>
              {currentRouteConfig.name}
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
            <span>
              <em>导览状态</em>
              {isTourPlaying ? tourStateLabel : '待命'}
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
      )}

      <style>{map3DGuideCss}</style>
    </main>
  )
}

function buildLandmarkCameraPreset(id: string, closeInspect: boolean): Map3DCameraPreset {
  const base = closeInspect ? MAP_3D_GUIDE_CAMERA_PRESETS.closeInspect : MAP_3D_GUIDE_CAMERA_PRESETS.landmarkFocus
  const largeLandmarks = new Set(['giant_buddha', 'fan_gong', 'wuyin_tancheng', 'xiangfu_temple', 'sansheng_hall'])
  const plazaLandmarks = new Set(['foshou_square', 'foqian_square', 'shengjing_square'])
  const compactLandmarks = new Set(['baizi_mile', 'manlong_flying_tower', 'manfeilong_tower'])
  const zoom = closeInspect
    ? compactLandmarks.has(id)
      ? 19.72
      : plazaLandmarks.has(id)
        ? 19.45
        : 19.15
    : largeLandmarks.has(id)
      ? 18.42
      : plazaLandmarks.has(id)
        ? 18.82
        : compactLandmarks.has(id)
          ? 19.15
          : base.zoom

  return {
    ...base,
    zoom
  }
}

function buildBuddhaRealmTimelineTourConfig(
  routePath: LatLngPoint[],
  routeStops: GuideRoute['stops']
): BuddhaRealmTimelineTourConfig | null {
  if (routePath.length < 2) {
    return null
  }

  const path = buildBuddhaRealmTourCameraPath(routePath)
  const cumulative = buildPathCumulativeDistances(path)
  const totalDistance = cumulative[cumulative.length - 1] ?? 0

  if (totalDistance <= 0) {
    return null
  }

  const pauses = buildBuddhaRealmInterestPoints(path, cumulative, totalDistance, routeStops).map((landmark) => ({
    id: `buddha-realm-pause-${landmark.id}`,
    label: landmark.label,
    progress: landmark.progress,
    holdMs: landmark.holdMs,
    nearbyLandmarkId: landmark.id
  }))
  const durationMs = clampNumber(
    Math.round(totalDistance * BUDDHA_REALM_TOUR_CONFIG.durationPerMeterMs),
    BUDDHA_REALM_TOUR_CONFIG.minDurationMs,
    BUDDHA_REALM_TOUR_CONFIG.maxDurationMs
  )

  return {
    path,
    cumulative,
    totalDistance,
    pauses,
    durationMs
  }
}

function buildBuddhaRealmTourCameraPath(routePath: LatLngPoint[]) {
  const deduped = routePath.reduce<LatLngPoint[]>((points, point) => {
    const previous = points[points.length - 1]
    if (!previous || haversineDistanceMeters(previous, point) >= 2) {
      points.push(point)
    }
    return points
  }, [])

  const cleaned: LatLngPoint[] = []

  for (let index = 0; index < deduped.length; index += 1) {
    const current = deduped[index]
    const previous = cleaned[cleaned.length - 1]
    const next = deduped[index + 1]

    if (previous && next) {
      const previousToCurrent = haversineDistanceMeters(previous, current)
      const currentToNext = haversineDistanceMeters(current, next)
      const previousToNext = haversineDistanceMeters(previous, next)
      const isOutAndBack =
        previousToNext <= 6 &&
        previousToCurrent <= 95 &&
        currentToNext <= 95 &&
        Math.abs(previousToCurrent - currentToNext) <= Math.max(8, previousToCurrent * 0.24)

      if (isOutAndBack) {
        index += 1
        continue
      }
    }

    cleaned.push(current)
  }

  return cleaned.length >= 2 ? cleaned : routePath
}

function createBuddhaRealmTimelineFrameSampler(
  config: BuddhaRealmTimelineTourConfig,
  profile: 'desktop-cinematic' | 'mobile-stable' = 'desktop-cinematic'
) {
  let smoothedBearing: number | undefined
  const mobileStable = profile === 'mobile-stable'

  return (
    progress: number,
    context: {
      elapsedMs: number
      isPaused: boolean
      pauseElapsedMs: number
      activeLandmarkId?: string
    }
  ): Map3DRouteTourFrame => {
    const sample = sampleRouteAtProgress(config, progress)
    const nearbyPause = getNearbyTourPause(config.pauses, progress, context.activeLandmarkId)
    const landmarkInfluence = nearbyPause
      ? 1 - smoothstep(
          0,
          BUDDHA_REALM_TOUR_CONFIG.landmarkInfluenceProgress,
          Math.abs(progress - nearbyPause.progress)
        )
      : 0
    const lookAheadProgress = context.isPaused
      ? BUDDHA_REALM_TOUR_CONFIG.lookAheadProgress.slow
      : lerpNumber(
          BUDDHA_REALM_TOUR_CONFIG.lookAheadProgress.cruise,
          BUDDHA_REALM_TOUR_CONFIG.lookAheadProgress.slow,
          landmarkInfluence
        )
    const lookAheadSample = sampleRouteAtProgress(config, Math.min(1, progress + lookAheadProgress))
    const lookAheadBearing = isSameLatLngPoint(sample, lookAheadSample)
      ? sample.bearing
      : getBearingDegrees(sample, lookAheadSample)
    const targetBearing = lookAheadBearing ?? sample.bearing ?? smoothedBearing ?? 0
    smoothedBearing =
      smoothedBearing === undefined
        ? targetBearing
        : lerpAngle(
            smoothedBearing,
            targetBearing,
            (context.isPaused ? 0.032 : lerpNumber(0.082, 0.052, landmarkInfluence)) * (mobileStable ? 0.78 : 1)
          )
    const baseLateralOffsetMeters = context.isPaused
      ? BUDDHA_REALM_TOUR_CONFIG.lateralOffsetMeters.pause
      : lerpNumber(
          BUDDHA_REALM_TOUR_CONFIG.lateralOffsetMeters.cruise,
          BUDDHA_REALM_TOUR_CONFIG.lateralOffsetMeters.slow,
          landmarkInfluence
        )
    const midRouteTighten =
      smoothstep(0.1, 0.22, progress) *
      (1 - smoothstep(0.78, 0.94, progress))
    const tourCameraTightenMode = context.isPaused ? 'pause' : midRouteTighten > 0.45 ? 'tight' : 'open'
    const lateralOffsetMeters = context.isPaused
      ? mobileStable
        ? Math.min(3.5, baseLateralOffsetMeters)
        : baseLateralOffsetMeters
      : mobileStable
        ? lerpNumber(Math.min(8, baseLateralOffsetMeters * 0.52), 4, midRouteTighten)
        : lerpNumber(baseLateralOffsetMeters, Math.max(4, baseLateralOffsetMeters * 0.38), midRouteTighten)
    const sideCenter = offsetLatLngByBearing(sample, smoothedBearing + 90, lateralOffsetMeters)
    const pausePhase = context.pauseElapsedMs / 1000
    const pauseDriftMeters = context.isPaused && !mobileStable
      ? Math.sin(pausePhase * 0.78) * BUDDHA_REALM_TOUR_CONFIG.pauseDriftCenterMeters
      : 0
    const cameraCenter = pauseDriftMeters
      ? offsetLatLngByBearing(sideCenter, smoothedBearing + 178 + Math.sin(pausePhase * 0.52) * 16, pauseDriftMeters)
      : sideCenter
    const pauseDriftRotation = context.isPaused && !mobileStable
      ? Math.sin(pausePhase * 0.58) * BUDDHA_REALM_TOUR_CONFIG.pauseDriftRotationDeg
      : 0
    const pauseDriftZoom = context.isPaused && !mobileStable
      ? Math.sin(Math.min(Math.PI, pausePhase * Math.PI * 0.72)) * BUDDHA_REALM_TOUR_CONFIG.pauseDriftZoom
      : 0
    const pauseDriftPitch = context.isPaused && !mobileStable ? Math.sin(pausePhase * 0.64) * 0.18 : 0
    const routeBreathing = mobileStable ? 0 : Math.sin(progress * Math.PI * 3.4) * 0.035
    const baseZoom = mobileStable ? lerpNumber(18.08, 18.24, midRouteTighten) : lerpNumber(17.92, 18.32, midRouteTighten)
    const basePitch = mobileStable ? lerpNumber(58.2, 60.4, midRouteTighten) : lerpNumber(59.2, 62.8, midRouteTighten)
    const landmarkZoomInfluence = mobileStable ? landmarkInfluence * 0.18 : landmarkInfluence * 0.48
    const landmarkPitchInfluence = mobileStable ? landmarkInfluence * 1.35 : landmarkInfluence * 4.2

    return {
      t: context.elapsedMs,
      lat: cameraCenter.lat,
      lng: cameraCenter.lng,
      bearing: roundNumber(smoothedBearing, 1),
      zoom: roundNumber(baseZoom + routeBreathing + landmarkZoomInfluence + pauseDriftZoom, 3),
      pitch: roundNumber(
        basePitch + (mobileStable ? 0 : Math.sin(progress * Math.PI * 2.4) * 0.35) + landmarkPitchInfluence + pauseDriftPitch,
        2
      ),
      rotation: normalizeRotation(getRouteCameraRotation(smoothedBearing) + pauseDriftRotation),
      progress: roundNumber(progress, 4),
      routeProgressIndex: sample.pathIndex,
      nearbyLandmarkId: nearbyPause?.nearbyLandmarkId,
      smoothingEnabled: true,
      lookAheadProgress: roundNumber(lookAheadProgress, 4),
      lateralOffsetMeters: roundNumber(lateralOffsetMeters, 1),
      tourCameraTightenMode,
      tourCameraTightenStrength: roundNumber(midRouteTighten, 3)
    }
  }
}

function getBuddhaRealmTimelineSpeed(progress: number, pauses: Map3DRouteTourPause[]) {
  const opening = progress < 0.07 ? lerpNumber(0.42, 1, smoothstep(0, 0.07, progress)) : 1
  const ending = progress > 0.94 ? lerpNumber(1, 0.52, smoothstep(0.94, 1, progress)) : 1
  const landmarkSlowdown = pauses.reduce((slowest, pause) => {
    const distance = Math.abs(progress - pause.progress)

    if (distance > BUDDHA_REALM_TOUR_CONFIG.landmarkSlowRadiusProgress) {
      return slowest
    }

    const influence = 1 - smoothstep(0, BUDDHA_REALM_TOUR_CONFIG.landmarkSlowRadiusProgress, distance)
    return Math.min(slowest, lerpNumber(1, 0.26, influence))
  }, 1)

  return opening * ending * landmarkSlowdown
}

function sampleRouteAtProgress(config: BuddhaRealmTimelineTourConfig, progress: number) {
  const distance = clampNumber(progress, 0, 1) * config.totalDistance
  const point = getPointAtPathDistance(config.path, config.cumulative, distance)
  const nearest = findNearestRoutePoint(point, config.path)

  return {
    ...point,
    pathIndex: nearest?.nearestIndex ?? 0,
    bearing: getSmoothedPathBearing(
      config.path,
      config.cumulative,
      distance,
      clampNumber(config.totalDistance * BUDDHA_REALM_TOUR_CONFIG.bearingWindowProgress, 36, 92)
    )
  }
}

function getNearbyTourPause(pauses: Map3DRouteTourPause[], progress: number, activeLandmarkId?: string) {
  if (activeLandmarkId) {
    const activePause = pauses.find((pause) => pause.nearbyLandmarkId === activeLandmarkId)

    if (activePause) {
      return activePause
    }
  }

  return pauses.find((pause) => Math.abs(progress - pause.progress) <= BUDDHA_REALM_TOUR_CONFIG.landmarkInfluenceProgress)
}

function buildBuddhaRealmTourSteps(
  routePath: LatLngPoint[],
  routeStops: GuideRoute['stops'],
  fallbackRouteCenter: LatLngPoint
): Map3DTourStep[] {
  if (routePath.length > 1) {
    return buildRouteFollowingBuddhaRealmTourSteps(routePath)
  }

  return buildBuddhaRealmPoiFallbackSteps(routeStops, fallbackRouteCenter)
}

function buildRouteFollowingBuddhaRealmTourSteps(path: LatLngPoint[]): Map3DTourStep[] {
  const waypoints = buildBuddhaRealmTourWaypoints(path)

  return waypoints.map((waypoint, index) => {
    const isPause = waypoint.speedMode === 'pause'
    const isSlow = waypoint.speedMode === 'slow'
    const label = waypoint.nearbyLandmarkLabel ?? `巡游路段 ${Math.round(waypoint.progress * 100)}%`
    const rotation = waypoint.bearing !== undefined
      ? getRouteCameraRotation(waypoint.bearing)
      : -30

    return {
      id: `buddha-realm-route-${index + 1}`,
      label,
      target: {
        lat: waypoint.lat,
        lng: waypoint.lng
      },
      progress: roundNumber(waypoint.progress, 3),
      bearing: waypoint.bearing,
      nearbyLandmarkId: waypoint.nearbyLandmarkId,
      speedMode: waypoint.speedMode,
      activeLandmarkId: waypoint.nearbyLandmarkId,
      targetPoiId: waypoint.nearbyLandmarkId,
      targetLandmarkId: waypoint.nearbyLandmarkId,
      presetId: isPause ? 'landmarkFocus' : 'guideFollow',
      zoom: isPause ? 18.34 : isSlow ? 18.04 : 17.74 + Math.sin(index * 0.7) * 0.08,
      pitch: isPause ? 64 : isSlow ? 63 : 59 + (index % 3) * 1.4,
      rotation,
      durationMs: isPause ? 1120 : isSlow ? 860 : 620,
      holdMs: waypoint.holdMs ?? (isPause ? 1500 : isSlow ? 180 : 45),
      routeProgressIndex: waypoint.pathIndex,
      twoStage: false
    }
  })
}

function buildBuddhaRealmPoiFallbackSteps(
  routeStops: GuideRoute['stops'],
  fallbackRouteCenter: LatLngPoint
): Map3DTourStep[] {
  const previewPoints = routeStops
    .map((stop) => ({
      stop,
      location: getRouteStopLocation(stop.spotId)
    }))
    .filter((item): item is { stop: GuideRoute['stops'][number]; location: LatLngPoint } => Boolean(item.location))

  if (!previewPoints.length) {
    return [
      {
        id: 'buddha-realm-route-center',
        label: '路线总览',
        target: fallbackRouteCenter,
        presetId: 'routeOverview',
        zoom: 17.38,
        pitch: 58,
        rotation: -30,
        durationMs: 1200,
        holdMs: 900,
        twoStage: false
      }
    ]
  }

  const sampledStops = sampleTourFallbackStops(previewPoints)

  return sampledStops.map((item, index) => {
    const display = getPoiDisplay(item.stop.spotId)
    const previous = sampledStops[Math.max(0, index - 1)]?.location ?? item.location
    const next = sampledStops[Math.min(sampledStops.length - 1, index + 1)]?.location ?? item.location
    const isEndpoint = index === 0 || index === sampledStops.length - 1

    return {
      id: `buddha-realm-${item.stop.spotId}`,
      label: display?.name ?? item.stop.spotId,
      target: item.location,
      activeLandmarkId: item.stop.spotId,
      targetPoiId: item.stop.spotId,
      targetLandmarkId: item.stop.spotId,
      presetId: isEndpoint ? 'routeOverview' : 'landmarkFocus',
      zoom: isEndpoint ? 17.42 : getFallbackTourStopZoom(item.stop.spotId),
      pitch: isEndpoint ? 58 : 63,
      rotation: getRouteTourRotation(previous, next, index),
      durationMs: isEndpoint ? 1180 : 1450,
      holdMs: getLandmarkPauseMs(item.stop.spotId),
      twoStage: !isEndpoint
    }
  })
}

function sampleTourFallbackStops<T extends { stop: GuideRoute['stops'][number]; location: LatLngPoint }>(items: T[]): T[] {
  if (items.length <= 7) {
    return items
  }

  const priorityIds = new Set([
    'jiulong_guanyu',
    'foshou_square',
    'xiangfu_temple',
    'foqian_square',
    'giant_buddha',
    'fan_gong',
    'wuyin_tancheng',
    'baizi_mile',
    'puti_avenue',
    'lingshan_jingshe'
  ])
  const selected = new Set<number>([0, items.length - 1])

  items.forEach((item, index) => {
    if (priorityIds.has(item.stop.spotId)) {
      selected.add(index)
    }
  })

  while (selected.size < Math.min(7, items.length)) {
    const largestGap = Array.from(selected)
      .sort((a, b) => a - b)
      .reduce(
        (best, index, orderedIndex, ordered) => {
          const nextIndex = ordered[orderedIndex + 1]
          const gap = nextIndex !== undefined ? nextIndex - index : 0
          return gap > best.gap ? { gap, index, nextIndex } : best
        },
        { gap: 0, index: 0, nextIndex: undefined as number | undefined }
      )

    if (largestGap.nextIndex === undefined || largestGap.gap <= 1) {
      break
    }

    selected.add(Math.round((largestGap.index + largestGap.nextIndex) / 2))
  }

  return Array.from(selected)
    .sort((a, b) => a - b)
    .map((index) => items[index])
}

function getFallbackTourStopZoom(spotId: string) {
  const largeLandmarks = new Set(['giant_buddha', 'fan_gong', 'wuyin_tancheng', 'xiangfu_temple'])

  return largeLandmarks.has(spotId) ? 18.24 : 18.42
}

function getLandmarkPauseMs(spotId: string) {
  const pauseMs: Record<string, number> = {
    giant_buddha: BUDDHA_REALM_TOUR_CONFIG.landmarkPauseMs.buddha,
    fan_gong: BUDDHA_REALM_TOUR_CONFIG.landmarkPauseMs.fanGong,
    wuyin_tancheng: BUDDHA_REALM_TOUR_CONFIG.landmarkPauseMs.wuyin,
    foshou_square: BUDDHA_REALM_TOUR_CONFIG.landmarkPauseMs.foshou,
    shengjing_square: BUDDHA_REALM_TOUR_CONFIG.landmarkPauseMs.entry,
    south_gate: BUDDHA_REALM_TOUR_CONFIG.landmarkPauseMs.entry,
    jiulong_guanyu: 1700,
    xiangfu_temple: 1700,
    foqian_square: 1450,
    baizi_mile: 1350,
    puti_avenue: 1250,
    lingshan_jingshe: 1450
  }

  return pauseMs[spotId] ?? 1300
}

function buildBuddhaRealmTourWaypoints(path: LatLngPoint[]): TourWaypoint[] {
  if (path.length < 2) {
    return []
  }

  const cumulative = buildPathCumulativeDistances(path)
  const totalDistance = cumulative[cumulative.length - 1] ?? 0
  const sampleMeters = totalDistance > 3200 ? 185 : totalDistance > 1800 ? 145 : 110
  const turnCandidates = buildTurnTourCandidates(path, cumulative, totalDistance)
  const candidates: Array<{ distance: number; speedMode: TourWaypoint['speedMode']; nearbyLandmarkId?: string; nearbyLandmarkLabel?: string; holdMs?: number }> = [
    { distance: 0, speedMode: 'cruise' },
    { distance: totalDistance, speedMode: 'cruise' },
    ...turnCandidates
  ]

  for (let distance = sampleMeters; distance < totalDistance; distance += sampleMeters) {
    candidates.push({ distance, speedMode: 'cruise' })
  }

  const landmarks = buildBuddhaRealmInterestPoints(path, cumulative, totalDistance)
  landmarks.forEach((landmark) => {
    const pauseDistance = cumulative[landmark.pathIndex] ?? landmark.distance
    candidates.push(
      {
        distance: Math.max(0, pauseDistance - 105),
        speedMode: 'slow',
        nearbyLandmarkId: landmark.id,
        nearbyLandmarkLabel: landmark.label
      },
      {
        distance: pauseDistance,
        speedMode: 'pause',
        nearbyLandmarkId: landmark.id,
        nearbyLandmarkLabel: landmark.label,
        holdMs: landmark.holdMs
      },
      {
        distance: Math.min(totalDistance, pauseDistance + 82),
        speedMode: 'slow',
        nearbyLandmarkId: landmark.id,
        nearbyLandmarkLabel: landmark.label
      }
    )
  })

  const priority: Record<TourWaypoint['speedMode'], number> = {
    pause: 3,
    slow: 2,
    cruise: 1
  }
  const deduped = candidates
    .filter((candidate) => Number.isFinite(candidate.distance))
    .sort((a, b) => a.distance - b.distance || priority[b.speedMode] - priority[a.speedMode])
    .reduce<typeof candidates>((items, candidate) => {
      const previous = items[items.length - 1]

      if (previous && Math.abs(previous.distance - candidate.distance) < 28) {
        if (priority[candidate.speedMode] > priority[previous.speedMode]) {
          items[items.length - 1] = candidate
        }
        return items
      }

      items.push(candidate)
      return items
    }, [])

  const waypoints = deduped.map((candidate) => {
    const point = getPointAtPathDistance(path, cumulative, candidate.distance)
    const pathIndex = findNearestRoutePoint(point, path)?.nearestIndex ?? 0
    const progress = totalDistance > 0 ? candidate.distance / totalDistance : 0
    const bearing = getSmoothedPathBearing(path, cumulative, candidate.distance)

    return {
      ...point,
      progress: clampNumber(progress, 0, 1),
      pathIndex,
      bearing,
      nearbyLandmarkId: candidate.nearbyLandmarkId,
      nearbyLandmarkLabel: candidate.nearbyLandmarkLabel,
      speedMode: candidate.speedMode,
      holdMs: candidate.holdMs
    }
  })

  return smoothTourWaypointBearings(waypoints)
}

function buildBuddhaRealmInterestPoints(
  path: LatLngPoint[],
  cumulative: number[],
  totalDistance: number,
  routeStops?: GuideRoute['stops']
) {
  const stopIds = routeStops?.map((stop) => stop.spotId) ?? [
    'shengjing_square',
    'foshou_square',
    'fan_gong',
    'wuyin_tancheng',
    'giant_buddha'
  ]
  const priorityIds = new Set([
    'shengjing_square',
    'jiulong_guanyu',
    'foshou_square',
    'xiangfu_temple',
    'foqian_square',
    'giant_buddha',
    'fan_gong',
    'wuyin_tancheng',
    'baizi_mile',
    'puti_avenue',
    'lingshan_jingshe'
  ])
  const specs = stopIds
    .filter((id, index) => index === 0 || index === stopIds.length - 1 || priorityIds.has(id))
    .map((id) => ({
      id,
      label: getPoiDisplay(id)?.name ?? id,
      holdMs: getLandmarkPauseMs(id)
    }))

  return specs
    .map((spec) => {
      const location = getRouteStopLocation(spec.id)
      const nearest = location ? findNearestRoutePoint(location, path) : null

      if (!location || !nearest) {
        return null
      }

      return {
        ...spec,
        location,
        pathIndex: nearest.nearestIndex,
        progress: totalDistance > 0 ? clampNumber(cumulative[nearest.nearestIndex] / totalDistance, 0, 1) : nearest.progressRatio,
        distance: cumulative[nearest.nearestIndex] ?? 0
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.progress - b.progress)
}

function buildTurnTourCandidates(path: LatLngPoint[], cumulative: number[], totalDistance: number) {
  const candidates: Array<{ distance: number; speedMode: TourWaypoint['speedMode'] }> = []

  for (let index = 1; index < path.length - 1; index += 1) {
    const before = getBearingDegrees(path[index - 1], path[index])
    const after = getBearingDegrees(path[index], path[index + 1])
    const delta = Math.abs(normalizeRotation(after - before))

    if (delta > 28) {
      candidates.push({
        distance: Math.max(0, Math.min(totalDistance, cumulative[index] ?? 0)),
        speedMode: 'cruise'
      })
    }
  }

  return candidates
}

function buildPathCumulativeDistances(path: LatLngPoint[]) {
  const cumulative = [0]

  for (let index = 1; index < path.length; index += 1) {
    cumulative[index] = cumulative[index - 1] + haversineDistanceMeters(path[index - 1], path[index])
  }

  return cumulative
}

function getPointAtPathDistance(path: LatLngPoint[], cumulative: number[], distance: number): LatLngPoint {
  if (!path.length) {
    return routeCenter
  }

  if (distance <= 0) {
    return path[0]
  }

  const totalDistance = cumulative[cumulative.length - 1] ?? 0

  if (distance >= totalDistance) {
    return path[path.length - 1]
  }

  for (let index = 1; index < cumulative.length; index += 1) {
    const segmentEndDistance = cumulative[index]

    if (segmentEndDistance < distance) {
      continue
    }

    const segmentStartDistance = cumulative[index - 1]
    const segmentLength = Math.max(1, segmentEndDistance - segmentStartDistance)
    const ratio = clampNumber((distance - segmentStartDistance) / segmentLength, 0, 1)

    return {
      lat: lerpNumber(path[index - 1].lat, path[index].lat, ratio),
      lng: lerpNumber(path[index - 1].lng, path[index].lng, ratio)
    }
  }

  return path[path.length - 1]
}

function splitRouteByProgress(
  path: LatLngPoint[],
  progress: number,
  cumulative: number[] = buildPathCumulativeDistances(path)
): SplitRouteByProgressResult {
  if (!path.length) {
    return {
      traveledPath: [],
      remainingPath: [],
      currentPoint: routeCenter
    }
  }

  if (path.length === 1) {
    return {
      traveledPath: [path[0]],
      remainingPath: [path[0]],
      currentPoint: path[0]
    }
  }

  const totalDistance = cumulative[cumulative.length - 1] ?? 0

  if (totalDistance <= 0) {
    return {
      traveledPath: [path[0]],
      remainingPath: [...path],
      currentPoint: path[0]
    }
  }

  const boundedProgress = clampNumber(progress, 0, 1)
  const targetDistance = totalDistance * boundedProgress

  if (targetDistance <= 0) {
    return {
      traveledPath: [path[0]],
      remainingPath: [...path],
      currentPoint: path[0]
    }
  }

  if (targetDistance >= totalDistance) {
    const currentPoint = path[path.length - 1]
    return {
      traveledPath: [...path],
      remainingPath: [currentPoint],
      currentPoint
    }
  }

  let segmentIndex = 1

  for (; segmentIndex < cumulative.length; segmentIndex += 1) {
    if (cumulative[segmentIndex] >= targetDistance) {
      break
    }
  }

  segmentIndex = Math.max(1, Math.min(path.length - 1, segmentIndex))
  const segmentStartDistance = cumulative[segmentIndex - 1] ?? 0
  const segmentEndDistance = cumulative[segmentIndex] ?? segmentStartDistance
  const segmentLength = segmentEndDistance - segmentStartDistance
  const ratio = segmentLength > 0
    ? clampNumber((targetDistance - segmentStartDistance) / segmentLength, 0, 1)
    : 0
  const start = path[segmentIndex - 1]
  const end = path[segmentIndex]
  const currentPoint = {
    lat: lerpNumber(start.lat, end.lat, ratio),
    lng: lerpNumber(start.lng, end.lng, ratio)
  }
  const traveledPath = path.slice(0, segmentIndex)
  appendRouteSplitPoint(traveledPath, currentPoint)
  const remainingPath = [currentPoint]

  for (const point of path.slice(segmentIndex)) {
    appendRouteSplitPoint(remainingPath, point)
  }

  return {
    traveledPath,
    remainingPath,
    currentPoint
  }
}

function appendRouteSplitPoint(path: LatLngPoint[], point: LatLngPoint) {
  const lastPoint = path[path.length - 1]

  if (!lastPoint || !isSameLatLngPoint(lastPoint, point)) {
    path.push(point)
  }
}

function detectRouteSequenceOverlaps(path: LatLngPoint[]) {
  const segmentKeys = new Set<string>()

  for (let index = 1; index < path.length; index += 1) {
    const from = getRouteOverlapPointKey(path[index - 1])
    const to = getRouteOverlapPointKey(path[index])
    const segmentKey = [from, to].sort().join('|')

    if (segmentKeys.has(segmentKey)) {
      return true
    }

    segmentKeys.add(segmentKey)
  }

  return false
}

function getRouteOverlapPointKey(point: LatLngPoint) {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
}

function getSmoothedPathBearing(path: LatLngPoint[], cumulative: number[], distance: number, windowMeters = 42) {
  const totalDistance = cumulative[cumulative.length - 1] ?? 0
  const from = getPointAtPathDistance(path, cumulative, Math.max(0, distance - windowMeters))
  const to = getPointAtPathDistance(path, cumulative, Math.min(totalDistance, distance + windowMeters))

  if (isSameLatLngPoint(from, to)) {
    return undefined
  }

  return getBearingDegrees(from, to)
}

function smoothTourWaypointBearings(waypoints: TourWaypoint[]) {
  let previousBearing: number | undefined

  return waypoints.map((waypoint) => {
    if (waypoint.bearing === undefined || previousBearing === undefined) {
      previousBearing = waypoint.bearing ?? previousBearing
      return waypoint
    }

    const delta = normalizeRotation(waypoint.bearing - previousBearing)
    const smoothedBearing = (previousBearing + clampNumber(delta, -18, 18) + 360) % 360
    previousBearing = smoothedBearing

    return {
      ...waypoint,
      bearing: roundNumber(smoothedBearing, 1)
    }
  })
}

function getRouteTourRotation(from: LatLngPoint, to: LatLngPoint, index: number) {
  if (isSameLatLngPoint(from, to)) {
    return -30 + (index % 3) * 8
  }

  const bearing = getBearingDegrees(from, to)
  return getRouteCameraRotation(bearing)
}

function getRouteCameraRotation(bearing: number) {
  return normalizeRotation(24 - bearing)
}

function lerpAngle(current: number, target: number, alpha: number) {
  const delta = normalizeRotation(target - current)
  return (current + delta * clampNumber(alpha, 0, 1) + 360) % 360
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }

  const t = clampNumber((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function getBearingDegrees(from: LatLngPoint, to: LatLngPoint) {
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const lngDelta = toRadians(to.lng - from.lng)
  const y = Math.sin(lngDelta) * Math.cos(toLat)
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(lngDelta)
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

function normalizeRotation(value: number) {
  let rotation = value

  while (rotation > 180) {
    rotation -= 360
  }

  while (rotation < -180) {
    rotation += 360
  }

  return roundNumber(rotation, 1)
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI
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

function getRouteOverviewTarget(path: LatLngPoint[]) {
  if (!path.length) {
    return scenicCenter
  }

  const bounds = getPathBounds(path)
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  }
}

function getPathBounds(path: LatLngPoint[]) {
  return path.reduce(
    (bounds, point) => ({
      north: Math.max(bounds.north, point.lat),
      south: Math.min(bounds.south, point.lat),
      east: Math.max(bounds.east, point.lng),
      west: Math.min(bounds.west, point.lng)
    }),
    {
      north: Number.NEGATIVE_INFINITY,
      south: Number.POSITIVE_INFINITY,
      east: Number.NEGATIVE_INFINITY,
      west: Number.POSITIVE_INFINITY
    }
  )
}

function buildRouteOverviewCameraPreset(
  routePath: LatLngPoint[],
  viewport: HTMLElement | null,
  options: {
    minZoom: number
    maxZoom: number
    presentation: ScenicMapPresentation
  }
): Map3DCameraPreset {
  const base = MAP_3D_GUIDE_CAMERA_PRESETS.routeOverview
  if (routePath.length < 2) {
    return options.presentation === 'ink2d' ? getInk2DCameraPreset(base) : base
  }

  const bounds = getPathBounds(routePath)
  const northWest = latLngToWorldPixel({ lat: bounds.north, lng: bounds.west }, 0)
  const southEast = latLngToWorldPixel({ lat: bounds.south, lng: bounds.east }, 0)
  const routeWorldWidth = Math.max(1, Math.abs(southEast.x - northWest.x))
  const routeWorldHeight = Math.max(1, Math.abs(southEast.y - northWest.y))
  const viewportWidth = Math.max(320, Number(viewport?.clientWidth) || 390)
  const viewportHeight = Math.max(320, Number(viewport?.clientHeight) || 760)
  const horizontalPadding = options.presentation === 'ink2d' ? 52 : 96
  const verticalPadding = options.presentation === 'ink2d' ? 140 : 180
  const availableWidth = Math.max(160, viewportWidth - horizontalPadding * 2)
  const availableHeight = Math.max(160, viewportHeight - verticalPadding * 2)
  const rawZoom = Math.log2(Math.min(availableWidth / routeWorldWidth, availableHeight / routeWorldHeight))
  const perspectiveCompensation = options.presentation === 'scenic3d' ? 0.58 : 0.08
  const zoom = clampNumber(rawZoom - perspectiveCompensation, options.minZoom, options.maxZoom)
  const preset: Map3DCameraPreset = {
    ...base,
    zoom,
    durationMs: options.presentation === 'scenic3d' ? 980 : 520
  }

  return options.presentation === 'ink2d' ? getInk2DCameraPreset(preset) : preset
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

function getRouteInitialPosition(routeConfig: ScenicRouteConfig, routePath: LatLngPoint[]) {
  return routeConfig.stops[0]?.location ?? getRouteStopLocation(routeConfig.guideRoute.stops[0]?.spotId) ?? routePath[0] ?? scenicCenter
}

function normalizePoiBillboardActiveId(id?: string) {
  if (!id) {
    return undefined
  }

  const alias: Record<string, string> = {
    lingshan_dazhaobi: 'lingshan_wall',
    manlong_flying_tower: 'manfeilong_tower'
  }

  return alias[id] ?? id
}

function getLandmarkSceneModelId(id: string) {
  return `model_landmark:${id}`
}

function getCompanionSceneModelId(parentId: string, companionId: string) {
  return `model_landmark_companion:${parentId}::${companionId}`
}

function resolveLandmarkInspectorIdFromRouteId(routeId: string | undefined, overlays: LingshanMapModelOverlay[]) {
  if (!routeId) {
    return undefined
  }

  const overlay = overlays.find(
    (item) => item.poiId === routeId || getMapModelOverlayInspectorId(item) === routeId
  )

  return overlay ? getMapModelOverlayInspectorId(overlay) : undefined
}

function getPoiBillboardMode({
  currentZoom,
  focus,
  tourMode
}: {
  currentZoom?: number
  focus: boolean
  tourMode: Map3DTourMode | 'idle'
}): ScenicPoiBillboardMode {
  if (focus || tourMode === 'buddhaRealmTour') {
    return 'activeTag'
  }

  const zoom = currentZoom ?? MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.zoom

  if (zoom >= 18.35) {
    return 'activeTag'
  }

  if (zoom >= 17.35) {
    return 'titleTag'
  }

  return 'dot'
}

function getModelOverlayLocation(overlay: LingshanMapModelOverlay): LatLngPoint | null {
  const catalogCoordinate = getScenicPoiCoordinate(overlay.poiId)
  if (catalogCoordinate) {
    return catalogCoordinate
  }
  const poi = lingshanPois.find((item) => item.id === overlay.poiId)

  if (!poi) {
    return getRouteStopLocation(overlay.poiId)
  }

  return overlay.positionSource === 'displayLocation'
    ? poi.displayLocation ?? poi.navLocation
    : poi.navLocation ?? poi.displayLocation
}

function getSceneWindowRouteProgress(
  position: LatLngPoint,
  routePath: LatLngPoint[],
  cumulativeDistances: number[]
) {
  if (!routePath.length || !cumulativeDistances.length) {
    return undefined
  }

  const nearest = findNearestRoutePoint(position, routePath)
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1] ?? 0

  if (!nearest || totalDistance <= 0) {
    return undefined
  }

  return clampNumber((cumulativeDistances[nearest.nearestIndex] ?? 0) / totalDistance, 0, 1)
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

function getTourPreloadStopIdsByProgress({
  progress,
  routeStops,
  routePath,
  cumulative,
  count
}: {
  progress: number
  routeStops: GuideRoute['stops']
  routePath: LatLngPoint[]
  cumulative: number[]
  count: number
}) {
  const totalDistance = cumulative[cumulative.length - 1] ?? 0
  const stopProgress = routeStops
    .map((stop, index) => {
      const location = getRouteStopLocation(stop.spotId)
      const nearest = location ? findNearestRoutePoint(location, routePath) : null
      const routeProgress =
        nearest && totalDistance > 0
          ? clampNumber((cumulative[nearest.nearestIndex] ?? 0) / totalDistance, 0, 1)
          : index / Math.max(1, routeStops.length - 1)

      return {
        id: stop.spotId,
        index,
        progress: routeProgress
      }
    })
    .sort((a, b) => a.progress - b.progress || a.index - b.index)

  const startIndex = stopProgress.findIndex((stop) => stop.progress >= progress - 0.018)
  const normalizedStartIndex = startIndex < 0 ? Math.max(0, stopProgress.length - count) : startIndex

  return stopProgress
    .slice(normalizedStartIndex, normalizedStartIndex + count)
    .map((stop) => stop.id)
}

function toTMapLatLng(point: LatLngPoint) {
  return new window.TMap.LatLng(point.lat, point.lng)
}

function createEmptyInkMapBoundsDraft(): InkMapBoundsDraft {
  return {
    northWest: null,
    northEast: null,
    southEast: null,
    southWest: null
  }
}

function getConfiguredInkBoundsDraft(): InkMapBoundsDraft {
  return {
    northWest: LINGSHAN_INK_MAP_BOUNDS.northWest,
    northEast: LINGSHAN_INK_MAP_BOUNDS.northEast,
    southEast: LINGSHAN_INK_MAP_BOUNDS.southEast,
    southWest: LINGSHAN_INK_MAP_BOUNDS.southWest
  }
}

function getNextInkMapBoundsCorner(bounds: InkMapBoundsDraft) {
  return inkMapBoundCornerOrder.find((corner) => !bounds[corner])
}

function getInkBoundsBoundaryPath(bounds: InkMapBoundsDraft) {
  const points = inkMapBoundCornerOrder.map((corner) => bounds[corner]).filter((point): point is LatLngPoint => Boolean(point))

  if (points.length >= 4) {
    return [...points, points[0]]
  }

  return points
}

function buildInkBoundsExportSnippet(bounds: InkMapBoundsDraft) {
  const resolvePoint = (corner: InkMapBoundCorner) => bounds[corner] ?? { lat: 0, lng: 0 }

  return [
    'export const LINGSHAN_INK_MAP_BOUNDS = {',
    `  northWest: ${formatInkBoundsPoint(resolvePoint('northWest'))},`,
    `  northEast: ${formatInkBoundsPoint(resolvePoint('northEast'))},`,
    `  southEast: ${formatInkBoundsPoint(resolvePoint('southEast'))},`,
    `  southWest: ${formatInkBoundsPoint(resolvePoint('southWest'))}`,
    '} as const'
  ].join('\n')
}

function formatInkBoundsPoint(point: LatLngPoint) {
  return `{ lat: ${Number(point.lat.toFixed(6))}, lng: ${Number(point.lng.toFixed(6))} }`
}

function formatConfiguredInkBoundsForPerf() {
  return inkMapBoundCornerOrder
    .map((corner) => {
      const point = LINGSHAN_INK_MAP_BOUNDS[corner]
      return `${inkMapBoundCornerShortLabels[corner]}:${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
    })
    .join(' | ')
}

function getConfiguredInkBoundsCenter() {
  const bounds = LINGSHAN_INK_MAP_BOUNDS
  const points = [bounds.northWest, bounds.northEast, bounds.southEast, bounds.southWest]
  const hasConfiguredBounds = points.every((point) => Math.abs(point.lat) > 0.000001 && Math.abs(point.lng) > 0.000001)

  if (!hasConfiguredBounds) {
    return null
  }

  return {
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length
  }
}

function getInkOverlaySourceFromQuery(): InkOverlaySource {
  if (typeof window === 'undefined') {
    return 'ai'
  }

  const value = new URLSearchParams(window.location.search).get('inkSource')

  if (value === 'base' || value === 'jimeng') {
    return value
  }

  return 'ai'
}

function getInkTileSourceFromQuery(): InkTileSource {
  return 'v3'
}

function getInkTileVariantFromQuery(): InkTileVariant {
  return 'v3'
}

function getLingshanInkTileSourceConfig(source: InkTileSource, variant: InkTileVariant) {
  const sourceConfig = LINGSHAN_INK_TILE_SOURCE_CONFIGS[source]

  const variantConfig = LINGSHAN_INK_TILE_VARIANT_CONFIGS[variant]

  return {
    ...sourceConfig,
    ...variantConfig,
    variant,
    tileUrlTemplate: `/map/ink/tiles/${variantConfig.tileDir}/{z}/{x}/{y}.png`
  }
}

function getInkOverlaySourceLabel(source: InkOverlaySource) {
  if (source === 'base') {
    return '腾讯原始底图'
  }

  if (source === 'jimeng') {
    return '即梦水墨图'
  }

  return 'GPT 水墨图'
}

function getInkOverlayOpacityFromQuery(compareMode = false) {
  if (typeof window === 'undefined') {
    return compareMode ? LINGSHAN_INK_OVERLAY_COMPARE_OPACITY : LINGSHAN_INK_OVERLAY_DEFAULT_OPACITY
  }

  const rawValue = new URLSearchParams(window.location.search).get('inkOpacity')
  const value = rawValue !== null ? Number(rawValue) : Number.NaN

  if (!Number.isFinite(value)) {
    return compareMode ? LINGSHAN_INK_OVERLAY_COMPARE_OPACITY : LINGSHAN_INK_OVERLAY_DEFAULT_OPACITY
  }

  return clampNumber(value, 0.05, 1)
}

function getInkOverlayAdjustmentsFromQuery(): InkOverlayAdjustments {
  if (typeof window === 'undefined') {
    return LINGSHAN_INK_OVERLAY_DEFAULT_ADJUSTMENTS
  }

  return {
    offsetX: roundNumber(getQueryNumber('inkOffsetX', LINGSHAN_INK_OVERLAY_DEFAULT_ADJUSTMENTS.offsetX, -240, 240), 2),
    offsetY: roundNumber(getQueryNumber('inkOffsetY', LINGSHAN_INK_OVERLAY_DEFAULT_ADJUSTMENTS.offsetY, -240, 240), 2),
    scaleX: roundNumber(getQueryNumber('inkScaleX', LINGSHAN_INK_OVERLAY_DEFAULT_ADJUSTMENTS.scaleX, 0.85, 1.15), 4),
    scaleY: roundNumber(getQueryNumber('inkScaleY', LINGSHAN_INK_OVERLAY_DEFAULT_ADJUSTMENTS.scaleY, 0.85, 1.15), 4)
  }
}

function getQueryNumber(name: string, fallback: number, min: number, max: number) {
  const value = Number(new URLSearchParams(window.location.search).get(name))
  return Number.isFinite(value) ? clampNumber(value, min, max) : fallback
}

function getInkTileOpacityFromQuery() {
  if (typeof window === 'undefined') {
    return LINGSHAN_INK_TILE_DEFAULT_OPACITY
  }

  const rawValue = new URLSearchParams(window.location.search).get('inkTileOpacity')
  const value = rawValue !== null ? Number(rawValue) : Number.NaN

  if (!Number.isFinite(value)) {
    return LINGSHAN_INK_TILE_DEFAULT_OPACITY
  }

  return clampNumber(value, 0.05, 1)
}

function getInkTileZoomFade(zoom: number) {
  if (!Number.isFinite(zoom)) {
    return 1
  }

  if (zoom >= 22) {
    return 0.7
  }

  if (zoom >= 21) {
    return 0.85
  }

  return 1
}

function getInkTileEffectiveOpacity(baseOpacity: number, zoom: number) {
  return roundNumber(clampNumber(baseOpacity, 0.05, 1) * getInkTileZoomFade(zoom), 4)
}

function getLingshanInkTileUrlFromArgs(
  args: unknown[],
  sourceConfig: ReturnType<typeof getLingshanInkTileSourceConfig>
) {
  const tile = parseImageTileLayerArgs(args)
  const resolvedTile = tile ? resolveLingshanInkTileRequest(tile.x, tile.y, tile.z) : null

  if (!resolvedTile) {
    return sourceConfig.blankUrl
  }

  return sourceConfig.tileUrlTemplate
    .replace('{z}', String(resolvedTile.z))
    .replace('{x}', String(resolvedTile.x))
    .replace('{y}', String(resolvedTile.y))
}

function parseImageTileLayerArgs(args: unknown[]): { x: number; y: number; z: number } | null {
  const first = args[0] as any

  if (first && typeof first === 'object') {
    const x = Number(first.x ?? first.tileX ?? first.col ?? (typeof first.getX === 'function' ? first.getX() : Number.NaN))
    const y = Number(first.y ?? first.tileY ?? first.row ?? (typeof first.getY === 'function' ? first.getY() : Number.NaN))
    const z = Number(first.z ?? first.zoom ?? first.level ?? args[1])

    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return {
        x: Math.trunc(x),
        y: Math.trunc(y),
        z: Math.trunc(z)
      }
    }
  }

  if (args.length >= 3) {
    const x = Number(args[0])
    const y = Number(args[1])
    const z = Number(args[2])

    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return {
        x: Math.trunc(x),
        y: Math.trunc(y),
        z: Math.trunc(z)
      }
    }
  }

  return null
}

function isLingshanInkTileInRange(x: number, y: number, z: number) {
  if (!LINGSHAN_INK_TILE_ZOOM_LEVELS.includes(z as (typeof LINGSHAN_INK_TILE_ZOOM_LEVELS)[number])) {
    return false
  }

  const range = getLingshanInkTileRange(z)
  return x >= range.minX && x <= range.maxX && y >= range.minY && y <= range.maxY
}

function resolveLingshanInkTileRequest(x: number, y: number, z: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return null
  }

  const minZoom = LINGSHAN_INK_TILE_ZOOM_LEVELS[0]

  if (z < minZoom) {
    return null
  }

  if (z <= LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM) {
    return isLingshanInkTileInRange(x, y, z) ? { x, y, z } : null
  }

  const factor = 2 ** (z - LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM)
  const fallbackX = Math.floor(x / factor)
  const fallbackY = Math.floor(y / factor)

  return isLingshanInkTileInRange(fallbackX, fallbackY, LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM)
    ? {
        x: fallbackX,
        y: fallbackY,
        z: LINGSHAN_INK_TILE_MAX_NATIVE_ZOOM
      }
    : null
}

function getLingshanInkTileRange(z: number) {
  const bounds = getConfiguredInkBoundsExtent()
  const corners = [
    { lat: bounds.north, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
    { lat: bounds.south, lng: bounds.east },
    { lat: bounds.south, lng: bounds.west }
  ].map((point) => latLngToWorldPixel(point, z))
  const minX = Math.floor(Math.min(...corners.map((point) => point.x)) / 256)
  const maxX = Math.floor((Math.max(...corners.map((point) => point.x)) - 0.000001) / 256)
  const minY = Math.floor(Math.min(...corners.map((point) => point.y)) / 256)
  const maxY = Math.floor((Math.max(...corners.map((point) => point.y)) - 0.000001) / 256)

  return { minX, maxX, minY, maxY }
}

function formatLingshanInkTileXRangeByZoom() {
  return LINGSHAN_INK_TILE_ZOOM_LEVELS.map((zoom) => {
    const range = getLingshanInkTileRange(zoom)
    return `z${zoom}:${range.minX}-${range.maxX}`
  }).join(' | ')
}

function formatLingshanInkTileYRangeByZoom() {
  return LINGSHAN_INK_TILE_ZOOM_LEVELS.map((zoom) => {
    const range = getLingshanInkTileRange(zoom)
    return `z${zoom}:${range.minY}-${range.maxY}`
  }).join(' | ')
}

function getConfiguredInkBoundsExtent() {
  const points = [
    LINGSHAN_INK_MAP_BOUNDS.northWest,
    LINGSHAN_INK_MAP_BOUNDS.northEast,
    LINGSHAN_INK_MAP_BOUNDS.southEast,
    LINGSHAN_INK_MAP_BOUNDS.southWest
  ]

  return {
    north: Math.max(...points.map((point) => point.lat)),
    south: Math.min(...points.map((point) => point.lat)),
    east: Math.max(...points.map((point) => point.lng)),
    west: Math.min(...points.map((point) => point.lng))
  }
}

function getExpandedInkMapBounds(paddingRatio: number) {
  const bounds = getConfiguredInkBoundsExtent()
  const latPadding = (bounds.north - bounds.south) * paddingRatio
  const lngPadding = (bounds.east - bounds.west) * paddingRatio

  return {
    north: bounds.north + latPadding,
    south: bounds.south - latPadding,
    east: bounds.east + lngPadding,
    west: bounds.west - lngPadding
  }
}

function getScaledInkMapBounds(ratio: number) {
  const bounds = getConfiguredInkBoundsExtent()
  const centerLat = (bounds.north + bounds.south) / 2
  const centerLng = (bounds.east + bounds.west) / 2
  const latHalf = ((bounds.north - bounds.south) * ratio) / 2
  const lngHalf = ((bounds.east - bounds.west) * ratio) / 2

  return {
    north: centerLat + latHalf,
    south: centerLat - latHalf,
    east: centerLng + lngHalf,
    west: centerLng - lngHalf
  }
}

function clampPointToBounds(point: LatLngPoint, bounds: { north: number; south: number; east: number; west: number }) {
  return {
    lat: roundNumber(clampNumber(point.lat, bounds.south, bounds.north), 6),
    lng: roundNumber(clampNumber(point.lng, bounds.west, bounds.east), 6)
  }
}

function getEffectiveInkMapMinZoom(enabled: boolean) {
  return enabled ? INK_MAP_MIN_ZOOM : INK_MAP_DEBUG_MIN_ZOOM
}

function getEffectiveInkMapMaxZoom(enabled: boolean) {
  return enabled ? INK_MAP_MAX_ZOOM : INK_MAP_DEBUG_MAX_ZOOM
}

function isZoomNearLimit(zoom: number, minZoom: number, maxZoom: number) {
  if (!Number.isFinite(zoom)) {
    return false
  }

  return zoom <= minZoom + 0.04 || zoom >= maxZoom - 0.04
}

function formatInkMapBoundsForPerf(bounds: { north: number; south: number; east: number; west: number }) {
  return `N${bounds.north.toFixed(6)} S${bounds.south.toFixed(6)} E${bounds.east.toFixed(6)} W${bounds.west.toFixed(6)}`
}

function formatLatLngForPerf(point: LatLngPoint) {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
}

function shouldAllowInkTileSingleImageFallback(map: any) {
  return readMapPitch(map) <= LINGSHAN_INK_OVERLAY_TOPDOWN_PITCH_MAX
}

function getInkOverlayCameraState(map: any, targetOpacity: number): InkOverlayCameraState {
  const pitch = readMapPitch(map)
  const rotation = normalizeRotation(readMapRotation(map))

  if (pitch <= LINGSHAN_INK_OVERLAY_TOPDOWN_PITCH_MAX) {
    return {
      mode: 'topdown',
      effectiveOpacity: targetOpacity,
      pitch: roundNumber(pitch, 2),
      rotation: roundNumber(rotation, 2)
    }
  }

  if (pitch <= LINGSHAN_INK_OVERLAY_REDUCED_PITCH_MAX) {
    return {
      mode: 'reduced',
      effectiveOpacity: Math.min(targetOpacity, LINGSHAN_INK_OVERLAY_REDUCED_MAX_OPACITY),
      pitch: roundNumber(pitch, 2),
      rotation: roundNumber(rotation, 2),
      reason: 'tilted-camera'
    }
  }

  return {
    mode: 'disabled3d',
    effectiveOpacity: 0,
    pitch: roundNumber(pitch, 2),
    rotation: roundNumber(rotation, 2),
    reason: '3d-camera'
  }
}

function updateInkOverlayCameraSnapshot(
  next: InkOverlayCameraState,
  ref: { current: InkOverlayCameraState },
  setSnapshot: (value: InkOverlayCameraState) => void
) {
  const current = ref.current
  const unchanged =
    current.mode === next.mode &&
    Math.abs(current.effectiveOpacity - next.effectiveOpacity) < 0.005 &&
    Math.abs(current.pitch - next.pitch) < 0.1 &&
    Math.abs(current.rotation - next.rotation) < 0.1 &&
    current.reason === next.reason

  if (unchanged) {
    return
  }

  ref.current = next
  setSnapshot(next)
}

function readMapPitch(map: any) {
  const candidates = [
    () => map?.getPitch?.(),
    () => map?.getView?.()?.pitch,
    () => map?.getCamera?.()?.pitch,
    () => map?.pitch
  ]

  for (const candidate of candidates) {
    try {
      const value = Number(candidate())

      if (Number.isFinite(value)) {
        return value
      }
    } catch {
      // Tencent GL camera getters vary between versions; try the next candidate.
    }
  }

  return MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.pitch
}

function readMapRotation(map: any) {
  const candidates = [
    () => map?.getRotation?.(),
    () => map?.getBearing?.(),
    () => map?.getView?.()?.rotation,
    () => map?.getView?.()?.bearing,
    () => map?.getCamera?.()?.rotation,
    () => map?.getCamera?.()?.bearing,
    () => map?.rotation,
    () => map?.bearing
  ]

  for (const candidate of candidates) {
    try {
      const value = Number(candidate())

      if (Number.isFinite(value)) {
        return value
      }
    } catch {
      // Tencent GL camera getters vary between versions; try the next candidate.
    }
  }

  return 0
}

function getInkOverlayCameraModeLabel(mode: InkOverlayCameraMode) {
  if (mode === 'topdown') {
    return '俯视对齐中'
  }

  if (mode === 'reduced') {
    return '倾斜视角已降透明'
  }

  if (mode === 'disabled3d') {
    return '3D 视角已隐藏'
  }

  return '未启用'
}

function getConfiguredInkBoundsCamera(viewport?: HTMLElement | null, options: { squareViewport?: boolean } = {}) {
  const center = getConfiguredInkBoundsCenter()

  if (!center) {
    return null
  }

  const bounds = LINGSHAN_INK_MAP_BOUNDS
  const lats = [bounds.northWest.lat, bounds.northEast.lat, bounds.southEast.lat, bounds.southWest.lat]
  const lngs = [bounds.northWest.lng, bounds.northEast.lng, bounds.southEast.lng, bounds.southWest.lng]
  const widthMeters = haversineDistanceMeters(
    { lat: center.lat, lng: Math.min(...lngs) },
    { lat: center.lat, lng: Math.max(...lngs) }
  )
  const heightMeters = haversineDistanceMeters(
    { lat: Math.min(...lats), lng: center.lng },
    { lat: Math.max(...lats), lng: center.lng }
  )
  const rawViewportWidth = Math.max(320, Number(viewport?.clientWidth) || 1440)
  const rawViewportHeight = Math.max(320, Number(viewport?.clientHeight) || 1440)
  const squareViewportSide = Math.min(rawViewportWidth, rawViewportHeight)
  const cameraViewportWidth = options.squareViewport ? squareViewportSide : rawViewportWidth
  const cameraViewportHeight = options.squareViewport ? squareViewportSide : rawViewportHeight
  const viewportWidth = Math.max(320, cameraViewportWidth - INK_EXPORT_CAMERA_PADDING_PX * 2)
  const viewportHeight = Math.max(320, cameraViewportHeight - INK_EXPORT_CAMERA_PADDING_PX * 2)
  const requiredMetersPerPixel = Math.max(widthMeters / viewportWidth, heightMeters / viewportHeight)
  const mercatorMetersPerPixelAtZoom0 = 156543.03392 * Math.cos((center.lat * Math.PI) / 180)
  const rawZoom =
    requiredMetersPerPixel > 0 && Number.isFinite(requiredMetersPerPixel)
      ? Math.log2(mercatorMetersPerPixelAtZoom0 / requiredMetersPerPixel)
      : SCENIC_CAMERA_BOUNDS.minZoom

  return {
    center,
    zoom: clampNumber(rawZoom, SCENIC_CAMERA_BOUNDS.minZoom, SCENIC_CAMERA_BOUNDS.maxZoom)
  }
}

function positionInkOverlayDomLayer({
  layer,
  map,
  TMap,
  mapElement,
  adjustments
}: {
  layer: HTMLDivElement | null
  map: any
  TMap: any
  mapElement: HTMLElement | null
  adjustments: InkOverlayAdjustments
}): { ok: true; mode: 'dom' } | { ok: false; mode: 'dom' | 'none'; error: string } {
  if (!layer || !map || !TMap || !mapElement) {
    return { ok: false, mode: 'none', error: 'ink overlay DOM 或地图实例未就绪' }
  }

  const shellRect = mapElement.parentElement?.getBoundingClientRect()
  const mapRect = mapElement.getBoundingClientRect()
  const offsetX = shellRect ? mapRect.left - shellRect.left : 0
  const offsetY = shellRect ? mapRect.top - shellRect.top : 0
  const bounds = LINGSHAN_INK_MAP_BOUNDS
  const points = [bounds.northWest, bounds.northEast, bounds.southEast, bounds.southWest]
  const projected = points.map((point) => projectLatLngToMapContainer(map, TMap, point, mapElement)).filter((point): point is { x: number; y: number } => Boolean(point))

  if (projected.length !== points.length) {
    layer.style.display = 'none'
    return { ok: false, mode: 'dom', error: '无法把水墨边界投影到地图容器' }
  }

  const minX = Math.min(...projected.map((point) => point.x))
  const maxX = Math.max(...projected.map((point) => point.x))
  const minY = Math.min(...projected.map((point) => point.y))
  const maxY = Math.max(...projected.map((point) => point.y))
  const width = Math.max(2, maxX - minX)
  const height = Math.max(2, maxY - minY)
  const adjustedWidth = Math.max(2, width * adjustments.scaleX)
  const adjustedHeight = Math.max(2, height * adjustments.scaleY)
  const centerX = minX + width / 2
  const centerY = minY + height / 2
  const adjustedLeft = centerX - adjustedWidth / 2 + adjustments.offsetX
  const adjustedTop = centerY - adjustedHeight / 2 + adjustments.offsetY

  layer.style.display = 'block'
  layer.style.left = `${offsetX + adjustedLeft}px`
  layer.style.top = `${offsetY + adjustedTop}px`
  layer.style.width = `${adjustedWidth}px`
  layer.style.height = `${adjustedHeight}px`
  return { ok: true, mode: 'dom' }
}

function projectLatLngToMapContainer(map: any, TMap: any, point: LatLngPoint, mapElement: HTMLElement) {
  const latLng = new TMap.LatLng(point.lat, point.lng)
  const projection = typeof map?.getProjection === 'function' ? map.getProjection() : undefined
  const candidates = [
    () => map?.projectToContainer?.(latLng),
    () => map?.projectToContainerPixel?.(latLng),
    () => map?.latLngToContainerPoint?.(latLng),
    () => map?.fromLatLngToContainerPixel?.(latLng),
    () => projection?.latLngToContainerPixel?.(latLng),
    () => projection?.fromLatLngToContainerPixel?.(latLng),
    () => projection?.projectToContainer?.(latLng)
  ]

  for (const candidate of candidates) {
    try {
      const projected = normalizeProjectedPoint(candidate())

      if (projected) {
        return projected
      }
    } catch {
      // Projection APIs differ between Tencent JS GL versions; try the next candidate.
    }
  }

  return projectLatLngToMapContainerWithMercator(map, point, mapElement)
}

function normalizeProjectedPoint(value: any): { x: number; y: number } | null {
  if (!value) {
    return null
  }

  const x =
    typeof value.getX === 'function'
      ? Number(value.getX())
      : typeof value.x === 'number'
        ? Number(value.x)
        : typeof value.left === 'number'
          ? Number(value.left)
          : Array.isArray(value)
            ? Number(value[0])
            : Number.NaN
  const y =
    typeof value.getY === 'function'
      ? Number(value.getY())
      : typeof value.y === 'number'
        ? Number(value.y)
        : typeof value.top === 'number'
          ? Number(value.top)
          : Array.isArray(value)
            ? Number(value[1])
            : Number.NaN

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null
  }

  return { x, y }
}

function projectLatLngToMapContainerWithMercator(map: any, point: LatLngPoint, mapElement: HTMLElement) {
  const center = readMapCenterForProjection(map) ?? getConfiguredInkBoundsCenter() ?? routeCenter
  const zoom = readMapZoomForProjection(map) ?? SCENIC_CAMERA_BOUNDS.defaultZoom
  const pointPixel = latLngToWorldPixel(point, zoom)
  const centerPixel = latLngToWorldPixel(center, zoom)

  return {
    x: mapElement.clientWidth / 2 + pointPixel.x - centerPixel.x,
    y: mapElement.clientHeight / 2 + pointPixel.y - centerPixel.y
  }
}

function readMapCenterForProjection(map: any): LatLngPoint | null {
  let center: any
  try {
    center = typeof map?.getCenter === 'function' ? map.getCenter() : undefined
  } catch {
    return null
  }

  if (!center) {
    return null
  }

  const lat = typeof center.getLat === 'function' ? Number(center.getLat()) : Number(center.lat)
  const lng = typeof center.getLng === 'function' ? Number(center.getLng()) : Number(center.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

function readMapZoomForProjection(map: any) {
  let zoom = Number.NaN
  try {
    zoom = typeof map?.getZoom === 'function' ? Number(map.getZoom()) : Number.NaN
  } catch {
    return null
  }
  return Number.isFinite(zoom) ? zoom : null
}

function latLngToWorldPixel(point: LatLngPoint, zoom: number) {
  const sinLat = Math.sin((point.lat * Math.PI) / 180)
  const clampedSinLat = clampNumber(sinLat, -0.9999, 0.9999)
  const scale = 256 * 2 ** zoom

  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + clampedSinLat) / (1 - clampedSinLat)) / (4 * Math.PI)) * scale
  }
}

/**
 * QQ's embedded browser can mount the React shell before its map container has
 * a measurable layout. Wait for two paint frames and an actual rectangle,
 * rather than guessing with a fixed startup delay.
 */
function waitForMapContainerLayout(element: HTMLElement, isCurrent: () => boolean, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    let firstFrame = 0
    let secondFrame = 0
    let pollTimer: number | undefined
    let deadlineTimer: number | undefined
    let observer: ResizeObserver | undefined

    const hasUsableSize = () => {
      const rect = element.getBoundingClientRect()
      return rect.width >= 120 && rect.height >= 120
    }
    const cleanup = () => {
      if (firstFrame) window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
      if (pollTimer !== undefined) window.clearInterval(pollTimer)
      if (deadlineTimer !== undefined) window.clearTimeout(deadlineTimer)
      observer?.disconnect()
      signal?.removeEventListener('abort', handleAbort)
    }
    const finish = (ready: boolean) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(ready)
    }
    const handleAbort = () => finish(false)
    const check = () => {
      if (!isCurrent()) {
        finish(false)
        return
      }
      if (hasUsableSize()) {
        finish(true)
      }
    }
    const beginObservation = () => {
      check()
      if (settled) return
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(check)
        observer.observe(element)
      }
      pollTimer = window.setInterval(check, 80)
      deadlineTimer = window.setTimeout(() => finish(false), 2200)
    }

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(beginObservation)
    })
    signal?.addEventListener('abort', handleAbort, { once: true })
    if (signal?.aborted) {
      finish(false)
    }
  })
}

function inkBoundsCornerSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="14" fill="rgba(245,241,232,.92)" stroke="#2f8f7a" stroke-width="3"/>
    <circle cx="17" cy="17" r="5" fill="#1f3b31"/>
  </svg>`
}

function formalInkBoundsCornerSvg(label: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="34" viewBox="0 0 42 34">
    <rect x="3" y="5" width="36" height="24" rx="12" fill="rgba(245,241,232,.94)" stroke="#c9a86a" stroke-width="3"/>
    <circle cx="12" cy="17" r="4" fill="#1f3b31"/>
    <text x="24" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#1f3b31">${label}</text>
  </svg>`
}

function applyInkCleanMapCamera(map: any, TMap: any, center: LatLngPoint, zoom: number) {
  const targetCenter = new TMap.LatLng(center.lat, center.lng)
  const cameraOptions = {
    center: targetCenter,
    zoom,
    pitch: 0,
    rotation: 0,
    bearing: 0
  }

  try {
    if (typeof map?.easeTo === 'function') {
      map.easeTo(cameraOptions, { duration: 0 })
    }
  } catch {
    // Optional camera methods differ between Tencent GL versions; fall through to direct setters.
  }

  try {
    if (typeof map?.setCenter === 'function') {
      map.setCenter(targetCenter)
    }
    if (typeof map?.setZoom === 'function') {
      map.setZoom(zoom)
    }
    if (typeof map?.setPitch === 'function') {
      map.setPitch(0)
    }
    if (typeof map?.setRotation === 'function') {
      map.setRotation(0)
    }
    if (typeof map?.setBearing === 'function') {
      map.setBearing(0)
    }
  } catch {
    // The constructor already requests the same clean camera; unsupported setters are safe to ignore.
  }
}

function readMapCameraState(map: any, fallbackCenter: LatLngPoint): CameraState {
  return {
    center: readMapCenterForProjection(map) ?? fallbackCenter,
    zoom: readMapZoomForProjection(map) ?? MAP_3D_GUIDE_INITIAL_ZOOM,
    pitch: readMapPitch(map),
    rotation: readMapRotation(map)
  }
}

function emptyActualTencentCameraState(): ActualTencentCameraState {
  return { viewMode: null, rawPitch: null, rawRotation: null, center: null, zoom: null }
}

function normalizeTencentViewMode(value: unknown): '2D' | '3D' | null {
  const normalized = String(value ?? '').trim().toUpperCase()
  return normalized === '2D' || normalized === '3D' ? normalized : null
}

function readActualTencentCameraState(map: any): ActualTencentCameraState {
  const readNumber = (getter: (() => unknown) | undefined) => {
    try {
      const value = Number(getter?.())
      return Number.isFinite(value) ? value : null
    } catch {
      return null
    }
  }

  let viewMode: '2D' | '3D' | null = null
  try {
    viewMode = typeof map?.getViewMode === 'function' ? normalizeTencentViewMode(map.getViewMode()) : null
  } catch {
    viewMode = null
  }

  return {
    viewMode,
    rawPitch: readNumber(typeof map?.getPitch === 'function' ? () => map.getPitch() : undefined),
    rawRotation: readNumber(typeof map?.getRotation === 'function' ? () => map.getRotation() : undefined),
    center: readMapCenterForProjection(map),
    zoom: readMapZoomForProjection(map)
  }
}

function cameraStateFromActual(
  actual: ActualTencentCameraState,
  fallback: CameraState,
  presentation: ScenicMapPresentation
): CameraState {
  return {
    center: actual.center ?? fallback.center,
    zoom: actual.zoom ?? fallback.zoom,
    // QQ WebView can retain the prior 3D camera values in getPitch/getRotation
    // after getViewMode() has already switched to 2D. The 2D effective camera
    // is therefore deterministic and does not mirror those stale raw getters.
    pitch: presentation === 'ink2d' ? 0 : actual.rawPitch ?? fallback.pitch,
    rotation: presentation === 'ink2d' ? 0 : actual.rawRotation ?? fallback.rotation
  }
}

function waitForMapAnimationFrames(isCurrent: () => boolean) {
  return new Promise<boolean>((resolve) => {
    if (!isCurrent()) {
      resolve(false)
      return
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve(isCurrent()))
    })
  })
}

function circularRotationDistance(left: number, right: number) {
  const distance = Math.abs(((left - right + 540) % 360) - 180)
  return Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY
}

function waitForCameraOrientation(
  map: any,
  expectedPitch: number,
  expectedRotation: number,
  isCurrent: () => boolean,
  timeoutMs = 900
) {
  return new Promise<{ matched: boolean; camera: ActualTencentCameraState }>((resolve) => {
    let settled = false
    let timer: number | undefined
    let pollTimer: number | undefined
    const eventNames = ['pitchend', 'rotateend', 'idle']
    const handlers: Array<{ eventName: string; handler: () => void }> = []
    const finish = (matched: boolean) => {
      if (settled) {
        return
      }
      settled = true
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer)
      }
      handlers.forEach(({ eventName, handler }) => {
        try {
          map?.off?.(eventName, handler)
        } catch {
          // The map can be destroyed while this presentation transition exits.
        }
      })
      resolve({ matched, camera: readActualTencentCameraState(map) })
    }
    const check = () => {
      if (!isCurrent()) {
        finish(false)
        return
      }
      const camera = readActualTencentCameraState(map)
      const pitchMatched = camera.rawPitch !== null && Math.abs(camera.rawPitch - expectedPitch) <= 0.75
      const rotationMatched =
        camera.rawRotation !== null && circularRotationDistance(camera.rawRotation, expectedRotation) <= 0.75
      if (pitchMatched && rotationMatched) {
        finish(true)
      }
    }

    eventNames.forEach((eventName) => {
      const handler = () => check()
      handlers.push({ eventName, handler })
      try {
        map?.on?.(eventName, handler)
      } catch {
        // Polling below is the portable fallback for embedded WebViews.
      }
    })
    pollTimer = window.setInterval(check, 48)
    timer = window.setTimeout(() => finish(false), timeoutMs)
    void waitForMapAnimationFrames(isCurrent).then(() => check())
    check()
  })
}

function waitForRouteCameraIntentTarget(options: {
  map: any
  target: CameraState
  requireOrientation: boolean
  requireZoom: boolean
  isCurrent: () => boolean
  timeoutMs: number
}) {
  const { map, target, requireOrientation, requireZoom, isCurrent, timeoutMs } = options
  return new Promise<{ matched: boolean; camera: ActualTencentCameraState }>((resolve) => {
    let settled = false
    let timeoutId: number | undefined
    let pollId: number | undefined
    const eventNames = ['idle', 'moveend', 'zoomend', 'pitchend', 'rotateend']
    const handlers: Array<{ eventName: string; handler: () => void }> = []
    const finish = (matched: boolean) => {
      if (settled) {
        return
      }
      settled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
      if (pollId !== undefined) {
        window.clearInterval(pollId)
      }
      handlers.forEach(({ eventName, handler }) => {
        try {
          map?.off?.(eventName, handler)
        } catch {
          // The current intent owns cleanup even if Tencent has already detached the map.
        }
      })
      resolve({ matched, camera: readActualTencentCameraState(map) })
    }
    const check = () => {
      if (!isCurrent()) {
        finish(false)
        return
      }
      const camera = readActualTencentCameraState(map)
      const centerMatched =
        camera.center !== null && haversineDistanceMeters(camera.center, target.center) <= 14
      const zoomMatched =
        !requireZoom || (camera.zoom !== null && Math.abs(camera.zoom - target.zoom) <= 0.1)
      const pitchMatched =
        !requireOrientation || (camera.rawPitch !== null && Math.abs(camera.rawPitch - target.pitch) <= 0.9)
      const rotationMatched =
        !requireOrientation ||
        (camera.rawRotation !== null && circularRotationDistance(camera.rawRotation, target.rotation) <= 0.9)
      if (centerMatched && zoomMatched && pitchMatched && rotationMatched) {
        finish(true)
      }
    }

    eventNames.forEach((eventName) => {
      const handler = () => check()
      handlers.push({ eventName, handler })
      try {
        map?.on?.(eventName, handler)
      } catch {
        // Polling covers embedded SDK builds with incomplete event support.
      }
    })
    pollId = window.setInterval(check, 48)
    timeoutId = window.setTimeout(() => finish(false), timeoutMs)
    check()
  })
}

function describeRouteCameraMismatch(camera: ActualTencentCameraState, target: CameraState) {
  const centerDistance = camera.center ? Math.round(haversineDistanceMeters(camera.center, target.center)) : 'unknown'
  const zoom = camera.zoom === null ? 'unknown' : camera.zoom.toFixed(2)
  const pitch = camera.rawPitch === null ? 'unknown' : camera.rawPitch.toFixed(2)
  const rotation = camera.rawRotation === null ? 'unknown' : camera.rawRotation.toFixed(2)
  return `center ${centerDistance}m / zoom ${zoom} / pitch ${pitch} / rotation ${rotation}`
}

function getRouteCameraZoomConstraints(map: any) {
  const readConstraint = (getter: unknown) => {
    try {
      const value = Number(typeof getter === 'function' ? getter() : Number.NaN)
      return Number.isFinite(value) ? value : undefined
    } catch {
      return undefined
    }
  }
  // These fallbacks are the values used by the long-lived TMap constructor.
  // The hosted ImageTileLayer has its own 15–20 coverage range, but it does
  // not control the map camera's legal zoom interval.
  const reportedMin = readConstraint(map?.getMinZoom?.bind(map))
  const reportedMax = readConstraint(map?.getMaxZoom?.bind(map))
  const minZoom = Math.max(INK_2D_MIN_ZOOM, reportedMin ?? INK_2D_MIN_ZOOM)
  const maxZoom = Math.min(INK_MAP_MAX_ZOOM, reportedMax ?? INK_MAP_MAX_ZOOM)

  return maxZoom >= minZoom
    ? { minZoom, maxZoom }
    : { minZoom: INK_2D_MIN_ZOOM, maxZoom: INK_MAP_MAX_ZOOM }
}

function waitForTencentMapRender(map: any, isCurrent: () => boolean, timeoutMs = 700) {
  return new Promise<boolean>((resolve) => {
    let settled = false
    let timer: number | undefined
    const eventNames = ['rendercomplete', 'idle', 'tilesloaded']
    const handlers: Array<{ eventName: string; handler: () => void }> = []
    const finish = (rendered: boolean) => {
      if (settled) {
        return
      }
      settled = true
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
      handlers.forEach(({ eventName, handler }) => {
        try {
          map?.off?.(eventName, handler)
        } catch {
          // The owner generation may have been destroyed during transition.
        }
      })
      resolve(rendered && isCurrent())
    }
    if (!isCurrent()) {
      finish(false)
      return
    }
    eventNames.forEach((eventName) => {
      const handler = () => finish(true)
      handlers.push({ eventName, handler })
      try {
        map?.on?.(eventName, handler)
      } catch {
        // A short frame/timeout fallback still validates real getters below.
      }
    })
    void waitForMapAnimationFrames(isCurrent).then((current) => {
      if (!current) {
        finish(false)
      }
    })
    timer = window.setTimeout(() => finish(isCurrent()), timeoutMs)
  })
}

async function applyPresentationToExistingMap(options: {
  map: any
  TMap: any
  presentation: ScenicMapPresentation
  requestedCamera: CameraState
  isCurrent: () => boolean
  onPhase?: (phase: CameraTransitionPhase) => void
}): Promise<PresentationApplyResult> {
  const { map, TMap, presentation, requestedCamera, isCurrent, onPhase } = options
  const requestedViewMode = presentation === 'ink2d' ? '2D' : '3D'
  const targetCamera: CameraState = {
    center: requestedCamera.center,
    zoom: requestedViewMode === '2D'
      ? clampNumber(requestedCamera.zoom, INK_2D_MIN_ZOOM, INK_2D_MAX_ZOOM)
      : clampNumber(requestedCamera.zoom, INK_MAP_MIN_ZOOM, INK_MAP_MAX_ZOOM),
    pitch: requestedViewMode === '2D' ? 0 : requestedCamera.pitch,
    rotation: requestedViewMode === '2D' ? 0 : requestedCamera.rotation
  }
  const failed = (error: string): PresentationApplyResult => ({
    ok: false,
    requestedPresentation: presentation,
    requestedCamera: targetCamera,
    actualCamera: readActualTencentCameraState(map),
    error
  })

  if (!map || !TMap?.LatLng || !isCurrent()) {
    return failed('地图实例在视图模式切换前不可用')
  }
  if (typeof map.setViewMode !== 'function' || typeof map.getViewMode !== 'function') {
    return failed('当前腾讯地图 SDK 未提供可验证的 setViewMode/getViewMode API')
  }

  const currentCamera = readActualTencentCameraState(map)
  if (requestedViewMode === '2D' && currentCamera.viewMode === '3D') {
    onPhase?.('flattening-3d')
    const flattenTarget = {
      center: new TMap.LatLng(targetCamera.center.lat, targetCamera.center.lng),
      zoom: targetCamera.zoom,
      pitch: 0,
      rotation: 0,
      bearing: 0
    }
    let usedEaseTo = false
    try {
      if (typeof map.easeTo === 'function') {
        map.easeTo(flattenTarget, { duration: 280 })
        usedEaseTo = true
      }
    } catch {
      usedEaseTo = false
    }
    if (!usedEaseTo) {
      try {
        map.setCenter?.(flattenTarget.center)
        map.setZoom?.(flattenTarget.zoom)
        map.setPitch?.(0)
        map.setRotation?.(0)
        map.setBearing?.(0)
      } catch {
        // The verification below decides whether the 3D camera actually flattened.
      }
    }

    const flattened = await waitForCameraOrientation(map, 0, 0, isCurrent)
    if (!isCurrent()) {
      return failed('地图实例已过期，忽略 3D 相机拍平结果')
    }
    if (!flattened.matched) {
      return {
        ok: false,
        requestedPresentation: presentation,
        requestedCamera: targetCamera,
        actualCamera: flattened.camera,
        error: `3D 相机拍平超时：raw pitch ${flattened.camera.rawPitch ?? 'unknown'} / raw rotation ${flattened.camera.rawRotation ?? 'unknown'}`
      }
    }
  }

  onPhase?.('switching-view-mode')
  try {
    map.setViewMode(requestedViewMode)
    map.setPitchable?.(requestedViewMode === '3D')
    map.setRotatable?.(requestedViewMode === '3D')
  } catch (error) {
    return failed(error instanceof Error ? error.message : '腾讯地图 setViewMode 调用失败')
  }

  // Do not wait for a tile success signal here. On QQ WebView a failed image
  // request can coexist with a successful view-mode transition.
  await waitForTencentMapRender(map, isCurrent)
  if (!isCurrent()) {
    return failed('地图实例已过期，忽略视图模式切换结果')
  }

  const modeCamera = readActualTencentCameraState(map)
  if (modeCamera.viewMode !== requestedViewMode) {
    return {
      ok: false,
      requestedPresentation: presentation,
      requestedCamera: targetCamera,
      actualCamera: modeCamera,
      error: `腾讯地图真实视图未收敛：期望 ${requestedViewMode}，实际 ${modeCamera.viewMode ?? 'unknown'}`
    }
  }

  const target = {
    center: new TMap.LatLng(targetCamera.center.lat, targetCamera.center.lng),
    zoom: targetCamera.zoom,
    pitch: targetCamera.pitch,
    rotation: targetCamera.rotation,
    bearing: 0
  }
  let usedEaseTo = false
  try {
    // QQ WebView ignores pitch changes after entering 2D. The 3D -> 2D path
    // above applies and verifies those values while the map is still 3D.
    if (requestedViewMode === '3D' && typeof map.easeTo === 'function') {
      map.easeTo(target, { duration: 280 })
      usedEaseTo = true
    }
    if (!usedEaseTo) {
      map.setCenter?.(target.center)
      map.setZoom?.(target.zoom)
      if (requestedViewMode === '3D') {
        map.setPitch?.(target.pitch)
        map.setRotation?.(target.rotation)
        map.setBearing?.(0)
      }
    }
  } catch {
    // A view mode already verified by getViewMode() remains valid even when a
    // WebView ignores an optional camera setter.
  }

  if (requestedViewMode === '3D') {
    const restored = await waitForCameraOrientation(map, targetCamera.pitch, targetCamera.rotation, isCurrent)
    if (!isCurrent()) {
      return failed('地图实例已过期，忽略 3D 相机恢复结果')
    }
    if (!restored.matched) {
      return {
        ok: false,
        requestedPresentation: presentation,
        requestedCamera: targetCamera,
        actualCamera: restored.camera,
        error: `3D 相机恢复超时：raw pitch ${restored.camera.rawPitch ?? 'unknown'} / raw rotation ${restored.camera.rawRotation ?? 'unknown'}`
      }
    }
  } else {
    await waitForMapAnimationFrames(isCurrent)
  }
  if (!isCurrent()) {
    return failed('地图实例已过期，忽略视图模式切换结果')
  }

  const actualCamera = readActualTencentCameraState(map)
  const viewModeMatches = actualCamera.viewMode === requestedViewMode
  const ok = viewModeMatches

  return {
    ok,
    requestedPresentation: presentation,
    requestedCamera: targetCamera,
    actualCamera,
    error: ok
      ? undefined
      : `腾讯地图真实视图未收敛：期望 ${requestedViewMode}，实际 ${actualCamera.viewMode ?? 'unknown'}`
  }
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

function orderMapModelOverlaysForLoading(overlays: LingshanMapModelOverlay[]) {
  const priorityWeight: Record<LingshanMapModelOverlay['priority'], number> = {
    high: 0,
    medium: 1,
    low: 2
  }

  return overlays
    .map((overlay, index) => ({ overlay, index }))
    .sort((a, b) => priorityWeight[a.overlay.priority] - priorityWeight[b.overlay.priority] || a.index - b.index)
    .map((item) => item.overlay)
}

function isQueryEnabled(name: string) {
  if (typeof window === 'undefined') {
    return false
  }

  const value = new URLSearchParams(window.location.search).get(name)
  return value === '1' || value === 'true'
}

function isStaleTencentLayerError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /cannot read properties of null.*getLayer/i.test(message) || /null.*getLayer/i.test(message)
}

function clampRouteStopIndex(stopIndex: number | undefined, stopCount: number) {
  if (!stopCount) {
    return 0
  }

  return Math.min(Math.max(stopIndex ?? 0, 0), stopCount - 1)
}

/** Temporary compatibility for the pending shared `joining` state contract. */
function getJoiningStopIndexFromQuery(stopCount: number) {
  if (typeof window === 'undefined') {
    return undefined
  }

  const params = new URLSearchParams(window.location.search)
  if (params.get('stage') !== 'joining') {
    return undefined
  }

  const joinStop = Number(params.get('joinStop'))
  if (!Number.isInteger(joinStop) || joinStop <= 0) {
    return 0
  }

  return clampRouteStopIndex(joinStop - 1, stopCount)
}

function getPoiReturnStage(stage: string): PoiReturnStage {
  return stage === 'joining' || stage === 'active' || stage === 'arrived' ? stage : 'preview'
}

function getRouteProgressPois(currentStopId?: string, nextStopId?: string, nearbyCoreLimit = 3) {
  const selectedIds = new Set([currentStopId, nextStopId].filter((id): id is string => Boolean(id)))
  const current = lingshanPois.find((poi) => poi.id === currentStopId)
  const next = lingshanPois.find((poi) => poi.id === nextStopId)
  const focus = current && next
    ? {
        lat: (current.displayLocation.lat + next.displayLocation.lat) / 2,
        lng: (current.displayLocation.lng + next.displayLocation.lng) / 2
      }
    : current?.displayLocation ?? next?.displayLocation ?? scenicCenter
  const nearbyCore = getLingshanPoisForLayer('core')
    .filter((poi) => !selectedIds.has(poi.id))
    .sort((a, b) => haversineDistanceMeters(focus, a.displayLocation) - haversineDistanceMeters(focus, b.displayLocation))
    .slice(0, nearbyCoreLimit)

  return [
    ...lingshanPois.filter((poi) => selectedIds.has(poi.id)),
    ...nearbyCore
  ]
}

function getInitialScenicRouteIdFromQuery() {
  if (typeof window === 'undefined') {
    return getDefaultScenicRouteId()
  }

  const params = new URLSearchParams(window.location.search)
  const routeId = params.get('routeId') ?? params.get('guideRouteId') ?? params.get('scenicRouteId')

  if (!routeId) {
    return getDefaultScenicRouteId()
  }

  const knownRouteIds = new Set(getScenicRouteOptions().map((route) => route.id))
  return knownRouteIds.has(routeId) ? routeId : getDefaultScenicRouteId()
}

function replaceMapPresentationInUrl(navigate: ReturnType<typeof useNavigate>, presentation: ScenicMapPresentation) {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  if (url.searchParams.get('presentation') === presentation) {
    return
  }

  url.searchParams.set('presentation', presentation)
  navigate(`${url.pathname}${url.search}${url.hash}`, { replace: true })
}

function shouldUseCanonicalLocalhostForTMap() {
  return typeof window !== 'undefined' && window.location.hostname === MAP_3D_GUIDE_LOCAL_TMAP_HOST
}

function buildCanonicalLocalhostUrl() {
  if (typeof window === 'undefined') {
    return ''
  }

  const url = new URL(window.location.href)
  url.hostname = MAP_3D_GUIDE_LOCAL_TMAP_CANONICAL_HOST
  return url.toString()
}

function isSameLatLngPoint(a: LatLngPoint | undefined, b: LatLngPoint | undefined) {
  if (!a || !b) {
    return false
  }

  return Math.abs(a.lat - b.lat) < 0.000001 && Math.abs(a.lng - b.lng) < 0.000001
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => value === right[index])
}

function extractMapEventLatLng(event: any): LatLngPoint | null {
  const rawPoint =
    event?.latLng ??
    event?.position ??
    event?.geometry?.position ??
    event?.geometry?.paths?.[0] ??
    event?.lngLat ??
    event
  const latValue = typeof rawPoint?.getLat === 'function' ? rawPoint.getLat() : rawPoint?.lat
  const lngValue = typeof rawPoint?.getLng === 'function' ? rawPoint.getLng() : rawPoint?.lng

  if (typeof latValue !== 'number' || typeof lngValue !== 'number') {
    return null
  }

  return {
    lat: roundNumber(latValue, 6),
    lng: roundNumber(lngValue, 6)
  }
}

function getPolygonBounds(vertices: LatLngPoint[]) {
  return vertices.reduce(
    (bounds, vertex) => ({
      minLat: Math.min(bounds.minLat, vertex.lat),
      maxLat: Math.max(bounds.maxLat, vertex.lat),
      minLng: Math.min(bounds.minLng, vertex.lng),
      maxLng: Math.max(bounds.maxLng, vertex.lng)
    }),
    {
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY
    }
  )
}

function isPointInPolygon(point: LatLngPoint, vertices: LatLngPoint[]) {
  let inside = false
  let previous = vertices.length - 1

  for (let current = 0; current < vertices.length; current += 1) {
    const currentVertex = vertices[current]
    const previousVertex = vertices[previous]
    const intersects =
      currentVertex.lng > point.lng !== previousVertex.lng > point.lng &&
      point.lat <
        ((previousVertex.lat - currentVertex.lat) * (point.lng - currentVertex.lng)) /
          (previousVertex.lng - currentVertex.lng || Number.EPSILON) +
          currentVertex.lat

    if (intersects) {
      inside = !inside
    }

    previous = current
  }

  return inside
}

function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function seeded01(seed: number, index: number, salt: number) {
  const value = Math.sin((seed + index * 1013 + salt * 9176) * 0.000001) * 10000
  return value - Math.floor(value)
}

function lerpNumber(min: number, max: number, value: number) {
  return min + (max - min) * value
}

function editorVertexSvg(fill: string, stroke: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="7" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <circle cx="12" cy="12" r="2.6" fill="${stroke}" opacity=".9"/>
  </svg>`
}

function clampScenicCenter(center: LatLngPoint) {
  const distance = haversineDistanceMeters(routeCenter, center)

  if (!Number.isFinite(distance) || distance <= SCENIC_CAMERA_BOUNDS.maxCenterDistanceMeters) {
    return center
  }

  const ratio = SCENIC_CAMERA_BOUNDS.maxCenterDistanceMeters / distance

  return {
    lat: roundNumber(routeCenter.lat + (center.lat - routeCenter.lat) * ratio, 6),
    lng: roundNumber(routeCenter.lng + (center.lng - routeCenter.lng) * ratio, 6)
  }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function roundNumber(value: number, precision: number) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
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
      note: spec.note ?? '沿文化探秘路线生成的水墨导览装饰。'
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
    note: spec.note ?? '沿文化探秘路线生成的水墨导览装饰。'
  }
}

function offsetLatLngMeters(origin: LatLngPoint, eastMeters: number, northMeters: number): LatLngPoint {
  const metersPerDegreeLat = 111_320
  const metersPerDegreeLng = 111_320 * Math.cos(origin.lat * (Math.PI / 180))

  return {
    lat: origin.lat + northMeters / metersPerDegreeLat,
    lng: origin.lng + eastMeters / metersPerDegreeLng
  }
}

function offsetLatLngByBearing(origin: LatLngPoint, bearing: number, meters: number): LatLngPoint {
  const radians = toRadians(bearing)
  return offsetLatLngMeters(origin, Math.sin(radians) * meters, Math.cos(radians) * meters)
}

function colorWithOpacity(color: string, opacity: number) {
  const normalized = color.replace('#', '')
  if (normalized.length !== 6) {
    return `rgba(42, 86, 62, ${opacity})`
  }

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
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
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined

  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // Fall through to textarea fallback.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.focus({ preventScroll: true })
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  let copiedByEvent = false
  const handleCopy = (event: ClipboardEvent) => {
    event.clipboardData?.setData('text/plain', text)
    event.preventDefault()
    copiedByEvent = true
  }

  document.addEventListener('copy', handleCopy)

  try {
    const copiedByCommand = typeof document.execCommand === 'function' ? document.execCommand('copy') : false
    return copiedByCommand || copiedByEvent
  } finally {
    document.removeEventListener('copy', handleCopy)
    document.body.removeChild(textarea)
  }
}

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function activeLandmarkHaloSvg(size: number) {
  const gold = '#D6B46A'
  const paper = '#E6DDC7'
  const jade = '#8FAF9B'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>
      <filter id="softHalo" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.2"/>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="34" fill="none" stroke="${gold}" stroke-width="4" opacity=".42" filter="url(#softHalo)">
      <animate attributeName="r" values="29;36;29" dur="2.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".22;.48;.22" dur="2.4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="50" cy="50" r="22" fill="rgba(214,180,106,.10)" stroke="${paper}" stroke-width="2" opacity=".72"/>
    <circle cx="50" cy="50" r="8" fill="${paper}" stroke="${gold}" stroke-width="2.5" opacity=".9"/>
    <path d="M50 13v9M50 78v9M13 50h9M78 50h9" stroke="${jade}" stroke-width="3" stroke-linecap="round" opacity=".42"/>
  </svg>`
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
      jade: '#B7842A',
      gold: '#E7D09A',
      paper: '#fff8df',
      glow: 'rgba(231, 208, 154, .34)',
      text: '#79551A',
      badge: ''
    },
    current: {
      jade: '#9C6815',
      gold: '#F2C14E',
      paper: '#fff4c7',
      glow: 'rgba(255, 217, 106, .58)',
      text: '#6c3f08',
      badge: '当前'
    },
    next: {
      jade: '#F2C14E',
      gold: '#9C6815',
      paper: '#fff8df',
      glow: 'rgba(242, 193, 78, .48)',
      text: '#79551A',
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

function browsePoiMarkerSvg(name: string, isCore: boolean, subdued = false) {
  const label = escapeSvgText(name.length > 8 ? `${name.slice(0, 8)}…` : name)
  const ink = isCore ? '#1f5a4d' : '#52776c'
  const paper = subdued ? 'rgba(245,241,232,.82)' : 'rgba(255,250,235,.94)'
  const gold = isCore ? '#c9a86a' : '#b9aa87'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="42" viewBox="0 0 96 42">
    <defs><filter id="s" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="rgba(22,56,47,.22)"/></filter></defs>
    <g filter="url(#s)" opacity="${subdued ? '.78' : '1'}">
      <circle cx="13" cy="20" r="8" fill="${ink}" stroke="#f7edd5" stroke-width="2"/>
      <path d="M13 15.5v9M8.5 20h9" stroke="#f7edd5" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M24 7h62l5 13-5 13H24l-5-13 5-13Z" fill="${paper}" stroke="${gold}" stroke-width="1.5"/>
      <text x="56" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="${ink}">${label}</text>
    </g>
  </svg>`
}

function escapeSvgText(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character)
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
  background:
    radial-gradient(circle at 50% 42%, rgba(242, 235, 216, .92), rgba(221, 233, 217, .88) 52%, rgba(207, 222, 209, .96) 100%),
    #dde9d9;
  opacity: .98;
  filter: none;
}

.map-presentation-cloud {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  overflow: hidden;
  pointer-events: auto;
  background: rgba(241, 240, 228, .18);
  opacity: 1;
  transition: opacity 360ms ease;
}

.map-3d-guide-map-runtime-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #e8eadf;
  color: #365348;
  font-size: 14px;
}

.map-presentation-cloud--opening {
  opacity: 0;
  pointer-events: none;
}

.map-presentation-cloud__bank {
  position: absolute;
  top: -18%;
  bottom: -18%;
  width: 64%;
  background:
    radial-gradient(circle at 28% 26%, rgba(255,255,255,.98) 0 12%, transparent 29%),
    radial-gradient(circle at 58% 42%, rgba(245,244,233,.96) 0 18%, transparent 38%),
    radial-gradient(circle at 36% 70%, rgba(226,232,218,.92) 0 16%, transparent 36%);
  filter: blur(12px);
  will-change: transform, opacity;
}

.map-presentation-cloud__bank--left {
  left: -12%;
  animation: map-presentation-cloud-left 820ms cubic-bezier(.2,.72,.2,1) both;
}

.map-presentation-cloud__bank--center {
  left: 18%;
  width: 66%;
  opacity: .82;
  animation: map-presentation-cloud-center 860ms cubic-bezier(.2,.72,.2,1) both;
}

.map-presentation-cloud__bank--right {
  right: -12%;
  transform: scaleX(-1);
  animation: map-presentation-cloud-right 820ms cubic-bezier(.2,.72,.2,1) both;
}

.map-presentation-cloud--opening .map-presentation-cloud__bank--left {
  transform: translateX(-72%);
}

.map-presentation-cloud--opening .map-presentation-cloud__bank--center {
  transform: translateY(-48%) scale(.88);
  opacity: 0;
}

.map-presentation-cloud--opening .map-presentation-cloud__bank--right {
  transform: translateX(72%) scaleX(-1);
}

.map-presentation-cloud__label {
  position: absolute;
  left: 50%;
  top: 52%;
  transform: translate(-50%, -50%);
  color: #365348;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
  text-shadow: 0 1px 8px rgba(255,255,255,.96);
  transition: opacity 180ms ease;
}

.map-presentation-cloud--opening .map-presentation-cloud__label {
  opacity: 0;
}

@keyframes map-presentation-cloud-left {
  from { transform: translateX(-58%); opacity: .45; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes map-presentation-cloud-center {
  from { transform: translateY(20%) scale(.84); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: .82; }
}

@keyframes map-presentation-cloud-right {
  from { transform: translateX(58%) scaleX(-1); opacity: .45; }
  to { transform: translateX(0) scaleX(-1); opacity: 1; }
}

.map-3d-guide-ink-overlay {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  display: none;
  overflow: hidden;
  mix-blend-mode: multiply;
  transform-origin: 0 0;
}

.map-3d-guide-ink-overlay[data-camera-mode="reduced"] {
  mix-blend-mode: soft-light;
}

.map-3d-guide-ink-overlay[data-camera-mode="disabled3d"],
.map-3d-guide-ink-overlay[data-camera-mode="off"] {
  display: none !important;
}

.map-3d-guide-ink-tile-fallback {
  z-index: 1;
  mix-blend-mode: multiply;
}

.map-3d-guide-ink-tile-fallback img {
  filter: saturate(.86) contrast(.92) brightness(1.06);
}

.map-3d-guide-ink-overlay img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
  -webkit-user-drag: none;
  filter: saturate(.82) contrast(.9) brightness(1.08);
}

.map-3d-guide-ink-overlay[data-camera-mode="reduced"] img {
  filter: saturate(.64) contrast(.82) brightness(1.16);
}

.map-3d-guide-ink-overlay-note {
  position: absolute;
  left: 50%;
  bottom: 24px;
  z-index: 18;
  transform: translateX(-50%);
  width: min(420px, calc(100vw - 32px));
  padding: 10px 14px;
  border: 1px solid rgba(201, 168, 106, .45);
  border-radius: 14px;
  background: rgba(245, 241, 232, .9);
  box-shadow: 0 14px 34px rgba(33, 58, 49, .13);
  color: #1f3b31;
  pointer-events: none;
  display: grid;
  gap: 3px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.map-3d-guide-ink-overlay-note strong {
  font-size: 13px;
  letter-spacing: 0;
}

.map-3d-guide-ink-overlay-note span {
  font-size: 12px;
  font-weight: 700;
  color: #8b6a2d;
}

.map-3d-guide-ink-overlay-note small {
  font-size: 11px;
  line-height: 1.35;
  color: rgba(31, 59, 49, .68);
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

.map-3d-guide-shell.is-map-visual-loading .map-3d-guide-skin {
  mix-blend-mode: normal;
  opacity: .20;
}

.map-3d-guide-shell.is-map-visual-loading .map-3d-guide-mist {
  opacity: .62;
}

.map-3d-guide-shell.is-map-visual-loading .map-3d-guide-paperedge {
  box-shadow: inset 0 0 42px rgba(91, 117, 84, .08);
  opacity: .44;
}

.map-3d-guide-atmosphere {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
  opacity: .94;
  --buddha-clear-mask: radial-gradient(ellipse at 52% 54%, transparent 0 40%, rgba(0, 0, 0, .34) 55%, #000 74%);
  transition: opacity 700ms ease;
}

.map-3d-guide-atmosphere > div {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 900ms ease, transform 900ms ease;
}

.map-3d-guide-atmosphere__sky {
  height: 50%;
  bottom: auto;
  background:
    radial-gradient(ellipse at 52% 2%, rgba(245, 241, 232, .72), rgba(234, 230, 210, .36) 34%, transparent 76%),
    radial-gradient(ellipse at 18% 8%, rgba(45, 74, 62, .22), transparent 44%),
    radial-gradient(ellipse at 82% 6%, rgba(31, 59, 49, .20), transparent 42%),
    linear-gradient(180deg, rgba(45, 74, 62, .42), rgba(245, 241, 232, .36) 40%, rgba(126, 157, 139, .18) 74%, transparent 100%);
  filter: blur(3px);
  opacity: .82;
}

.map-3d-guide-atmosphere__ink-horizon {
  height: 54%;
  bottom: auto;
  background:
    radial-gradient(ellipse at 8% 43%, rgba(31, 59, 49, .48), transparent 24%),
    radial-gradient(ellipse at 27% 35%, rgba(45, 74, 62, .44), transparent 27%),
    radial-gradient(ellipse at 54% 39%, rgba(70, 99, 83, .40), transparent 26%),
    radial-gradient(ellipse at 78% 34%, rgba(31, 59, 49, .42), transparent 24%),
    radial-gradient(ellipse at 96% 42%, rgba(45, 74, 62, .34), transparent 20%),
    linear-gradient(180deg, rgba(31, 59, 49, .36), rgba(126, 157, 139, .26) 50%, transparent 94%);
  clip-path: polygon(0 19%, 10% 28%, 18% 21%, 26% 31%, 36% 22%, 48% 34%, 58% 26%, 68% 37%, 80% 24%, 90% 32%, 100% 21%, 100% 100%, 0 100%);
  filter: blur(18px);
  mix-blend-mode: multiply;
  opacity: .74;
  transform: translateY(-8%);
}

.map-3d-guide-atmosphere__forest {
  inset: 34% -6% 0;
  background:
    radial-gradient(ellipse at 4% 70%, rgba(31, 59, 49, .42), transparent 25%),
    radial-gradient(ellipse at 18% 66%, rgba(45, 74, 62, .30), transparent 20%),
    radial-gradient(ellipse at 82% 62%, rgba(31, 59, 49, .32), transparent 22%),
    radial-gradient(ellipse at 96% 74%, rgba(45, 74, 62, .40), transparent 25%),
    radial-gradient(ellipse at 50% 96%, rgba(31, 59, 49, .28), transparent 32%),
    linear-gradient(90deg, rgba(45, 74, 62, .28), transparent 24%, transparent 76%, rgba(45, 74, 62, .26));
  filter: blur(24px);
  mix-blend-mode: multiply;
  opacity: .58;
}

.map-3d-guide-atmosphere__water {
  inset: 34% 8% 18%;
  background:
    radial-gradient(ellipse at 39% 58%, rgba(182, 213, 201, .24), rgba(245, 241, 232, .12) 28%, transparent 52%),
    radial-gradient(ellipse at 57% 46%, rgba(126, 157, 139, .18), rgba(245, 241, 232, .10) 30%, transparent 58%),
    radial-gradient(ellipse at 70% 61%, rgba(182, 213, 201, .16), transparent 44%),
    repeating-radial-gradient(ellipse at 52% 54%, rgba(245, 241, 232, .12) 0 2px, transparent 2px 18px);
  filter: blur(8px);
  mix-blend-mode: screen;
  opacity: .22;
  transform: rotate(-8deg);
}

.map-3d-guide-atmosphere__dynamic-mist {
  position: absolute;
  inset: -4%;
  width: 108%;
  height: 108%;
  pointer-events: none;
  opacity: .56;
  mix-blend-mode: soft-light;
  filter: blur(.2px) saturate(.92);
  transform: translateZ(0);
}

.map-3d-guide-atmosphere__edge {
  background:
    radial-gradient(ellipse at 52% 54%, transparent 34%, rgba(245, 241, 226, .36) 58%, rgba(31, 59, 49, .46) 100%),
    linear-gradient(90deg, rgba(31, 59, 49, .42), rgba(245, 241, 226, .22) 18%, transparent 35%, transparent 65%, rgba(245, 241, 226, .24) 82%, rgba(31, 59, 49, .40)),
    linear-gradient(180deg, rgba(31, 59, 49, .38), rgba(245, 241, 226, .16) 22%, transparent 48%, rgba(245, 241, 226, .18) 76%, rgba(31, 59, 49, .38));
  opacity: .94;
}

.map-3d-guide-atmosphere--edge-strong .map-3d-guide-atmosphere__edge {
  background:
    radial-gradient(ellipse at 52% 54%, transparent 25%, rgba(245, 241, 226, .48) 50%, rgba(31, 59, 49, .62) 100%),
    linear-gradient(90deg, rgba(31, 59, 49, .58), rgba(245, 241, 226, .34) 20%, transparent 38%, transparent 62%, rgba(245, 241, 226, .34) 80%, rgba(31, 59, 49, .56)),
    linear-gradient(180deg, rgba(31, 59, 49, .52), rgba(245, 241, 226, .24) 24%, transparent 46%, rgba(245, 241, 226, .26) 74%, rgba(31, 59, 49, .52));
  opacity: 1;
}

.map-3d-guide-atmosphere--edge-strong .map-3d-guide-atmosphere__forest {
  opacity: .88;
}

.map-3d-guide-atmosphere--edge-strong .map-3d-guide-atmosphere__ink-horizon {
  opacity: .88;
}

.map-3d-guide-atmosphere--edge-strong .map-3d-guide-atmosphere__vignette {
  opacity: .88;
}

.map-3d-guide-atmosphere__forest,
.map-3d-guide-atmosphere__water,
.map-3d-guide-atmosphere__dynamic-mist,
.map-3d-guide-atmosphere__edge,
.map-3d-guide-atmosphere__route,
.map-3d-guide-atmosphere__glow,
.map-3d-guide-atmosphere__gold-dust,
.map-3d-guide-atmosphere__vignette {
  -webkit-mask-image: var(--buddha-clear-mask);
  mask-image: var(--buddha-clear-mask);
}

.map-3d-guide-atmosphere--clear-wide {
  --buddha-clear-mask: radial-gradient(ellipse at 52% 54%, transparent 0 40%, rgba(0, 0, 0, .34) 55%, #000 74%);
}

.map-3d-guide-atmosphere--clear-balanced {
  --buddha-clear-mask: radial-gradient(ellipse at 52% 54%, transparent 0 34%, rgba(0, 0, 0, .42) 50%, #000 68%);
}

.map-3d-guide-atmosphere--clear-compact {
  --buddha-clear-mask: radial-gradient(ellipse at 52% 55%, transparent 0 28%, rgba(0, 0, 0, .50) 44%, #000 62%);
}

.map-3d-guide-atmosphere--clear-route-ellipse.map-3d-guide-atmosphere--clear-balanced {
  --buddha-clear-mask: radial-gradient(ellipse 48% 34% at 52% 56%, transparent 0 58%, rgba(0, 0, 0, .46) 75%, #000 100%);
}

.map-3d-guide-atmosphere--clear-route-ellipse.map-3d-guide-atmosphere--clear-compact {
  --buddha-clear-mask: radial-gradient(ellipse 44% 30% at 52% 56%, transparent 0 54%, rgba(0, 0, 0, .54) 72%, #000 100%);
}

.map-3d-guide-atmosphere__route {
  inset: 22% 10% 16%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 58% 62%, rgba(245, 241, 226, .34), rgba(142, 173, 154, .16) 36%, transparent 70%),
    radial-gradient(ellipse at 36% 54%, rgba(214, 180, 106, .12), transparent 58%);
  filter: blur(18px);
  opacity: .28;
  transform: rotate(-8deg);
}

.map-3d-guide-atmosphere__glow {
  inset: 20% 18% 20%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 52% 44%, rgba(201, 168, 106, .13), transparent 42%),
    radial-gradient(circle at 42% 58%, rgba(126, 157, 139, .16), transparent 52%);
  filter: blur(20px);
  opacity: .34;
}

.map-3d-guide-atmosphere__gold-dust {
  background:
    radial-gradient(circle at 72% 18%, rgba(201, 168, 106, .13) 0 1px, transparent 2px),
    radial-gradient(circle at 82% 24%, rgba(201, 168, 106, .10) 0 1px, transparent 2px),
    radial-gradient(circle at 67% 34%, rgba(245, 241, 232, .13) 0 1px, transparent 2px);
  background-size: 72px 72px, 92px 92px, 116px 116px;
  opacity: .26;
}

.map-3d-guide-atmosphere__vignette {
  background:
    radial-gradient(ellipse at center, transparent 48%, rgba(126, 157, 139, .16) 72%, rgba(31, 59, 49, .34) 100%);
  mix-blend-mode: multiply;
  opacity: .62;
}

.map-3d-guide-atmosphere--intro {
  opacity: .98;
}

.map-3d-guide-atmosphere--intro .map-3d-guide-atmosphere__sky {
  opacity: .74;
}

.map-3d-guide-atmosphere--intro .map-3d-guide-atmosphere__ink-horizon {
  opacity: .64;
}

.map-3d-guide-atmosphere--intro .map-3d-guide-atmosphere__edge {
  opacity: .88;
}

.map-3d-guide-atmosphere--intro .map-3d-guide-atmosphere__dynamic-mist {
  opacity: .68;
}

.map-3d-guide-atmosphere--normal {
  opacity: .76;
}

.map-3d-guide-atmosphere--normal .map-3d-guide-atmosphere__dynamic-mist {
  opacity: .48;
}

.map-3d-guide-atmosphere--normal .map-3d-guide-atmosphere__water {
  opacity: .18;
}

.map-3d-guide-atmosphere--tour {
  opacity: .90;
}

.map-3d-guide-atmosphere--tour .map-3d-guide-atmosphere__route {
  opacity: .58;
  transform: rotate(-8deg) scale(1.06);
}

.map-3d-guide-atmosphere--tour .map-3d-guide-atmosphere__ink-horizon {
  opacity: .56;
}

.map-3d-guide-atmosphere--tour .map-3d-guide-atmosphere__forest {
  opacity: .50;
}

.map-3d-guide-atmosphere--tour .map-3d-guide-atmosphere__water {
  opacity: .26;
}

.map-3d-guide-atmosphere--tour .map-3d-guide-atmosphere__dynamic-mist {
  opacity: .50;
}

.map-3d-guide-atmosphere--tour .map-3d-guide-atmosphere__glow {
  opacity: .46;
}

.map-3d-guide-atmosphere--focus {
  opacity: .82;
}

.map-3d-guide-atmosphere--focus .map-3d-guide-atmosphere__glow {
  opacity: .56;
  transform: scale(.92);
}

.map-3d-guide-shell--ink-clean-mode .map-3d-guide-skin,
.map-3d-guide-shell--ink-clean-mode .map-3d-guide-mist,
.map-3d-guide-shell--ink-clean-mode .map-3d-guide-paperedge {
  display: none;
}

.map-3d-guide-shell--ink2d .map-3d-guide-skin,
.map-3d-guide-shell--ink2d .map-3d-guide-mist,
.map-3d-guide-shell--ink2d .map-3d-guide-paperedge {
  display: none;
}

.map-3d-guide-shell--ink2d .map-3d-guide-map {
  opacity: 1;
  filter: none;
}

/* showControl:false is the primary API-level switch. QQ WebView can still
   inject its own TMap control DOM, so this map-container-only fallback keeps
   native zoom/compass chrome out of both 2D and 3D without touching the
   application's portal-based tool rail. */
.map-3d-guide-map .tmap-control,
.map-3d-guide-map .tmap-control-container,
.map-3d-guide-map .tmap-zoom-control,
.map-3d-guide-map .tmap-rotate-control,
.map-3d-guide-map .tmap-compass,
.map-3d-guide-map .tmap-scale-control,
.map-3d-guide-map .TMap-control,
.map-3d-guide-map .TMap-zoom,
.map-3d-guide-map .TMap-compass,
.map-3d-guide-map [class*="tmap" i][class*="zoom" i],
.map-3d-guide-map [class*="tmap" i][class*="compass" i],
.map-3d-guide-map [class*="tmap" i][class*="rotate" i] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

.map-3d-guide-shell.is-ink-export-ui-hidden > :not(.map-3d-guide-map) {
  display: none !important;
}

.map-3d-guide-shell--ink-capture-frame {
  background: #111914;
}

.map-3d-guide-shell--ink-capture-frame .map-3d-guide-map {
  inset: auto;
  left: 50%;
  top: 50%;
  width: min(100vw, 100vh, 1536px);
  height: min(100vw, 100vh, 1536px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
}

.map-3d-guide-shell--ink-capture-frame-guide .map-3d-guide-map {
  box-shadow: 0 0 0 2px rgba(201, 168, 106, .72), 0 22px 80px rgba(0, 0, 0, .34);
}

.map-3d-guide-shell--clean-shot .map-3d-guide-map,
.map-3d-guide-shell--ink-capture-frame.is-ink-export-ui-hidden .map-3d-guide-map {
  box-shadow: none;
}

.map-3d-guide-shot-guide-frame {
  position: absolute;
  z-index: 17;
  left: 50%;
  top: 50%;
  width: min(calc(100vw - 64px), calc(100vh - 64px), 1536px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 2px dashed rgba(201, 168, 106, .94);
  box-shadow: inset 0 0 0 1px rgba(31, 59, 49, .56), 0 0 0 9999px rgba(17, 25, 20, .18);
  pointer-events: none;
}

.map-3d-guide-shot-guide-frame strong,
.map-3d-guide-shot-guide-frame span {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: min(520px, calc(100% - 32px));
  text-align: center;
  color: #1f3b31;
  background: rgba(245, 241, 232, .92);
  border: 1px solid rgba(201, 168, 106, .58);
  border-radius: 999px;
  padding: 7px 12px;
}

.map-3d-guide-shot-guide-frame strong {
  top: 12px;
  font-size: 14px;
}

.map-3d-guide-shot-guide-frame span {
  bottom: 12px;
  color: rgba(31, 59, 49, .74);
  font-size: 12px;
}

.map-3d-guide-shot-guide-warning,
.map-3d-guide-capture-frame-note {
  position: absolute;
  z-index: 18;
  left: 24px;
  bottom: 24px;
  width: min(380px, calc(100vw - 48px));
  padding: 12px 14px;
  border: 1px solid rgba(201, 168, 106, .46);
  border-radius: 8px;
  background: rgba(245, 241, 232, .92);
  color: rgba(31, 59, 49, .78);
  box-shadow: 0 18px 46px rgba(31, 59, 49, .14);
  font-weight: 700;
}

.map-3d-guide-capture-frame-note {
  display: grid;
  gap: 4px;
}

.map-3d-guide-capture-frame-note strong {
  color: #1f3b31;
}

.map-3d-guide-capture-frame-note span {
  line-height: 1.5;
}

.map-3d-guide-ink-tool {
  position: absolute;
  z-index: 18;
  left: 24px;
  top: 24px;
  width: min(380px, calc(100vw - 48px));
  padding: 16px;
  border: 1px solid rgba(201, 168, 106, .46);
  border-radius: 8px;
  background: rgba(245, 241, 232, .92);
  box-shadow: 0 18px 46px rgba(31, 59, 49, .16);
  color: #1f3b31;
  pointer-events: auto;
}

.map-3d-guide-ink-tool--export {
  left: auto;
  right: 24px;
}

.map-3d-guide-ink-tool__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.map-3d-guide-ink-tool__header strong {
  font-size: 16px;
}

.map-3d-guide-ink-tool__header span,
.map-3d-guide-ink-tool small,
.map-3d-guide-ink-tool p,
.map-3d-guide-ink-tool li {
  color: rgba(31, 59, 49, .72);
  line-height: 1.55;
}

.map-3d-guide-ink-tool__bounds-note {
  margin-top: 10px;
  color: #7a5d1f;
  font-size: 12px;
  font-weight: 800;
}

.map-3d-guide-ink-tool dl {
  display: grid;
  gap: 6px;
  margin: 12px 0;
}

.map-3d-guide-ink-tool dl div {
  display: grid;
  grid-template-columns: 94px 1fr;
  gap: 10px;
  padding: 7px 9px;
  border-radius: 6px;
  background: rgba(255, 252, 238, .62);
}

.map-3d-guide-ink-tool dt {
  font-weight: 800;
  color: #2d4a3e;
}

.map-3d-guide-ink-tool dd {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #1f3b31;
}

.map-3d-guide-ink-tool__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 8px;
}

.map-3d-guide-ink-tool button {
  border: 1px solid rgba(201, 168, 106, .62);
  border-radius: 6px;
  background: rgba(255, 252, 238, .88);
  color: #1f3b31;
  font-weight: 800;
  padding: 8px 12px;
}

.map-3d-guide-ink-tool button:disabled {
  opacity: .46;
}

.map-3d-guide-ink-road-check {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  display: grid;
  place-items: end center;
  padding: 28px;
  color: rgba(31, 59, 49, .76);
  font-weight: 800;
  background:
    repeating-linear-gradient(0deg, transparent 0 96px, rgba(169, 71, 63, .10) 96px 98px),
    repeating-linear-gradient(90deg, transparent 0 96px, rgba(169, 71, 63, .10) 96px 98px);
}

.map-3d-guide-loading-curtain {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-items: center;
  pointer-events: none;
  background:
    radial-gradient(circle at 52% 38%, rgba(255, 251, 230, .86), rgba(242, 235, 216, .72) 34%, transparent 58%),
    radial-gradient(circle at 28% 62%, rgba(221, 233, 217, .78), transparent 42%),
    linear-gradient(135deg, rgba(242, 235, 216, .92), rgba(221, 233, 217, .86));
  opacity: 1;
  transition: opacity 520ms ease, visibility 520ms ease;
}

.map-3d-guide-loading-curtain.is-hiding {
  opacity: 0;
  visibility: hidden;
}

.map-3d-guide-loading-curtain > div {
  display: grid;
  gap: 7px;
  min-width: 240px;
  max-width: min(360px, calc(100vw - 48px));
  padding: 15px 18px;
  border: 1px solid rgba(143, 175, 155, .28);
  border-radius: 10px;
  background: rgba(255, 252, 238, .64);
  color: #2d4f43;
  text-align: center;
  box-shadow: 0 24px 70px rgba(46, 74, 54, .12), inset 0 0 0 1px rgba(255,255,255,.46);
  backdrop-filter: blur(16px);
  pointer-events: auto;
}

.map-3d-guide-loading-curtain strong {
  color: #24483d;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 18px;
  letter-spacing: 0;
}

.map-3d-guide-loading-curtain span {
  color: #627568;
  font-size: 12px;
  line-height: 1.5;
}

.map-3d-guide-loading-curtain__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 5px;
}

.map-3d-guide-loading-curtain__actions button {
  border: 1px solid rgba(143, 175, 155, .40);
  border-radius: 7px;
  background: rgba(255, 252, 238, .78);
  color: #2d4f43;
  cursor: pointer;
  font-size: 12px;
  padding: 7px 10px;
}

.map-3d-guide-loading-curtain__actions button:hover {
  background: rgba(255, 248, 223, .95);
  border-color: rgba(214, 180, 106, .58);
}

.map-3d-guide-shell.is-map-ready-timeout .map-3d-guide-loading-curtain > div {
  border-color: rgba(214, 180, 106, .46);
  background: rgba(255, 249, 229, .72);
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
.map-3d-guide-shell--prototype-a .map-3d-guide-routes,
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
.map-3d-guide-shell--prototype-b .map-3d-guide-routes,
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
  filter: none;
}

.map-3d-guide-shell--prototype-c.map-3d-guide-shell--ink2d .map-3d-guide-map {
  opacity: 1;
  filter: none;
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
.map-3d-guide-shell--prototype-c .map-3d-guide-routes,
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
.map-3d-guide-routes,
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
.map-3d-guide-routes button,
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

.map-3d-guide-routes {
  top: 174px;
  left: 18px;
  width: 330px;
  max-width: calc(100vw - 36px);
  padding: 12px;
  border-radius: 10px;
}

.map-3d-guide-routes__header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 9px;
}

.map-3d-guide-routes__header strong {
  color: #25463b;
}

.map-3d-guide-routes__header span {
  color: #798276;
  font-size: 12px;
  text-align: right;
}

.map-3d-guide-routes__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.map-3d-guide-routes button {
  display: grid;
  gap: 2px;
  min-height: 52px;
  padding: 7px 8px;
  text-align: left;
  border-radius: 8px;
}

.map-3d-guide-routes button strong {
  color: inherit;
  font-size: 12px;
}

.map-3d-guide-routes button span {
  color: rgba(74, 88, 76, .72);
  font-size: 11px;
  line-height: 1.25;
}

.map-3d-guide-routes button.is-active {
  border-color: rgba(213, 166, 45, .70);
  background: linear-gradient(135deg, rgba(255, 244, 202, .98), rgba(230, 246, 238, .94));
  color: #7a4f0f;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.58);
}

.map-3d-guide-camera {
  top: 348px;
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

.map-3d-guide-decor-debug {
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

.map-3d-guide-debug-exit {
  width: 100%;
  margin: 0 0 10px;
}

.map-3d-guide-perf-panel {
  position: absolute;
  right: 24px;
  bottom: 106px;
  z-index: 25;
  width: min(360px, calc(100vw - 32px));
  max-height: min(58vh, 560px);
  overflow: auto;
  padding: 12px;
  border: 1px solid rgba(50, 88, 75, .18);
  border-radius: 16px;
  background: rgba(250, 252, 238, .92);
  color: #24483c;
  box-shadow: 0 18px 48px rgba(20, 45, 36, .18), inset 0 0 0 1px rgba(255,255,255,.58);
  backdrop-filter: blur(16px);
}

.map-3d-guide-perf-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.map-3d-guide-perf-panel__header div {
  display: grid;
  gap: 2px;
}

.map-3d-guide-perf-panel__header strong {
  color: #24483c;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 16px;
}

.map-3d-guide-perf-panel__header span,
.map-3d-guide-perf-panel small {
  color: rgba(36, 72, 60, .68);
  font-size: 11px;
  font-weight: 800;
}

.map-3d-guide-perf-panel button {
  border: 1px solid rgba(160, 125, 48, .24);
  border-radius: 10px;
  background: rgba(255, 249, 229, .86);
  color: #735016;
  font-weight: 900;
}

.map-3d-guide-perf-panel__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  margin: 0;
}

.map-3d-guide-perf-panel__summary div {
  display: grid;
  gap: 2px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .42);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.62);
}

.map-3d-guide-perf-panel__summary dt {
  color: rgba(36, 72, 60, .62);
  font-size: 11px;
  font-weight: 800;
}

.map-3d-guide-perf-panel__summary dd {
  margin: 0;
  color: #24483c;
  font-size: 13px;
  font-weight: 950;
}

.map-3d-guide-perf-panel__details {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.map-3d-guide-perf-panel__details section {
  padding: 9px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .34);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.58);
}

.map-3d-guide-perf-panel__details h3 {
  margin: 0 0 6px;
  color: #24483c;
  font-size: 12px;
}

.map-3d-guide-perf-panel__details ol {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-left: 18px;
}

.map-3d-guide-perf-panel__details li {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.map-3d-guide-perf-panel__details li span {
  overflow: hidden;
  color: #24483c;
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-3d-guide-perf-panel__details p {
  margin: 0;
  color: rgba(36, 72, 60, .62);
  font-size: 12px;
}

.map-3d-guide-perf-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.map-3d-guide-perf-panel__manual-copy {
  width: 100%;
  min-height: 92px;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid rgba(50, 88, 75, .20);
  border-radius: 10px;
  background: rgba(255, 255, 255, .58);
  color: #24483c;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 11px;
  resize: vertical;
}

.map-3d-guide-landmark-inspector {
  display: grid;
  gap: 8px;
}

.map-3d-guide-landmark-inspector__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.map-3d-guide-landmark-inspector__heading h3 {
  margin: 0 0 4px;
}

.map-3d-guide-landmark-inspector__heading p {
  margin: 0;
}

.map-3d-guide-landmark-inspector__heading span {
  flex: 0 0 auto;
  color: #735016;
  font-size: 11px;
  font-weight: 900;
}

.map-3d-guide-landmark-inspector__list {
  display: grid;
  gap: 7px;
  max-height: 300px;
  overflow: auto;
  padding-right: 2px;
}

.map-3d-guide-landmark-inspector__item {
  display: grid;
  gap: 7px;
  padding: 8px;
  border: 1px solid rgba(50, 88, 75, .14);
  border-radius: 12px;
  background: rgba(255, 255, 255, .38);
}

.map-3d-guide-landmark-inspector__item.is-loaded {
  border-color: rgba(46, 130, 93, .28);
  background: rgba(231, 246, 232, .55);
}

.map-3d-guide-landmark-inspector__item.is-failed {
  border-color: rgba(170, 80, 50, .30);
  background: rgba(255, 238, 228, .58);
}

.map-3d-guide-landmark-inspector__item.is-calibrating {
  border-color: rgba(184, 135, 37, .55);
  background: rgba(255, 249, 222, .68);
  box-shadow: 0 0 0 2px rgba(204, 158, 58, .12);
}

.map-3d-guide-landmark-inspector__item strong,
.map-3d-guide-landmark-inspector__item small,
.map-3d-guide-landmark-inspector__item code {
  display: block;
}

.map-3d-guide-landmark-inspector__item code {
  overflow: hidden;
  color: rgba(36, 72, 60, .72);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-3d-guide-landmark-inspector__item .is-error {
  color: #9b3b1f;
}

.map-3d-guide-landmark-inspector__item .is-warning {
  color: #8a5d12;
}

.map-3d-guide-landmark-inspector__variants {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
}

.map-3d-guide-landmark-inspector__variants span {
  color: rgba(36, 72, 60, .68);
  font-size: 11px;
  font-weight: 800;
}

.map-3d-guide-landmark-inspector__variants button.is-active {
  border-color: rgba(46, 130, 93, .42);
  background: rgba(216, 242, 224, .78);
  color: #24483c;
}

.map-3d-guide-landmark-inspector__variants small {
  flex-basis: 100%;
  color: rgba(138, 93, 18, .86);
}

.map-3d-guide-landmark-inspector__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.map-3d-guide-landmark-inspector__actions button:disabled {
  cursor: not-allowed;
  opacity: .42;
}

.map-3d-guide-landmark-inspector__hint {
  margin: 0;
  color: rgba(36, 72, 60, .72);
  font-size: 12px;
}

.map-3d-guide-landmark-calibration {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(184, 135, 37, .30);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(255, 252, 231, .78), rgba(238, 248, 234, .64));
}

.map-3d-guide-landmark-calibration__title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.map-3d-guide-landmark-calibration__title h3,
.map-3d-guide-landmark-calibration__title strong,
.map-3d-guide-landmark-calibration__title small,
.map-3d-guide-landmark-calibration > code {
  display: block;
}

.map-3d-guide-landmark-calibration__title h3 {
  margin: 0 0 4px;
}

.map-3d-guide-landmark-calibration > code {
  overflow: hidden;
  color: rgba(36, 72, 60, .72);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-3d-guide-landmark-calibration__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.map-3d-guide-landmark-calibration__grid label {
  display: grid;
  gap: 4px;
  color: rgba(36, 72, 60, .72);
  font-size: 11px;
  font-weight: 800;
}

.map-3d-guide-landmark-calibration__grid input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(50, 88, 75, .20);
  border-radius: 8px;
  padding: 7px 8px;
  background: rgba(255, 255, 255, .72);
  color: #24483c;
}

.map-3d-guide-landmark-calibration__quick,
.map-3d-guide-landmark-calibration__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.map-3d-guide-landmark-calibration p {
  margin: 0;
  color: rgba(36, 72, 60, .72);
  font-size: 11px;
}

.map-3d-guide-decor-debug__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.map-3d-guide-decor-debug__header div,
.map-3d-guide-decor-debug label {
  display: grid;
  gap: 5px;
}

.map-3d-guide-decor-debug strong {
  color: #24483c;
  font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
  font-size: 15px;
}

.map-3d-guide-decor-debug span,
.map-3d-guide-decor-debug label,
.map-3d-guide-decor-debug p,
.map-3d-guide-decor-debug small {
  color: #68746c;
  font-size: 12px;
  line-height: 1.45;
}

.map-3d-guide-decor-debug select,
.map-3d-guide-decor-debug input {
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

.map-3d-guide-decor-debug button {
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

.map-3d-guide-decor-debug button.is-active {
  border-color: rgba(42, 96, 72, .50);
  background: rgba(218, 238, 220, .94);
  color: #245640;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.62);
}

.map-3d-guide-decor-debug__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.map-3d-guide-decor-debug p {
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

.map-3d-guide-routes button:disabled,
.map-3d-guide-camera button:disabled,
.map-3d-guide-controlbar button:disabled {
  cursor: wait;
  opacity: .58;
}

.map-3d-guide-mobile-topbar,
.map-3d-guide-mobile-guide {
  display: none;
}

@media (max-width: 880px) {
  .map-3d-guide-mobile-topbar {
    position: absolute;
    top: calc(10px + env(safe-area-inset-top, 0px));
    left: 12px;
    right: 12px;
    z-index: 16;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 7px 10px 7px 13px;
    border: 1px solid rgba(201, 168, 106, .44);
    border-radius: 12px;
    background:
      linear-gradient(135deg, rgba(31, 59, 49, .92), rgba(45, 74, 62, .84));
    color: #f5f1e8;
    box-shadow: 0 12px 34px rgba(18, 39, 32, .22), inset 0 0 0 1px rgba(255,255,255,.08);
    backdrop-filter: blur(14px);
  }

  .map-3d-guide-mobile-topbar div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .map-3d-guide-mobile-topbar strong {
    overflow: hidden;
    color: #fff7df;
    font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
    font-size: 15px;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-3d-guide-mobile-topbar span {
    overflow: hidden;
    color: rgba(245, 241, 232, .72);
    font-size: 11px;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-3d-guide-mobile-topbar button {
    flex: 0 0 auto;
    min-height: 32px;
    border: 1px solid rgba(201, 168, 106, .52);
    border-radius: 9px;
    padding: 0 11px;
    background: rgba(255, 247, 223, .12);
    color: #fff7df;
    font-size: 12px;
    font-weight: 900;
  }

  .map-3d-guide-hero,
  .map-3d-guide-routes,
  .map-3d-guide-camera,
  .map-3d-guide-status,
  .map-3d-guide-pois,
  .map-3d-guide-controlbar {
    display: none;
  }

  .map-3d-guide-mobile-guide {
    position: absolute;
    left: 12px;
    right: 12px;
    z-index: 16;
    display: block;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    color: #1f3b31;
  }

  .map-3d-guide-mobile-guide button {
    border: 1px solid rgba(143, 101, 28, .22);
    border-radius: 9px;
    background: rgba(255, 249, 229, .86);
    color: #6f4a12;
    font-weight: 900;
  }

  .map-3d-guide-mobile-guide__summary {
    display: grid;
    grid-template-columns: 1fr 1fr minmax(54px, .7fr) auto;
    gap: 7px;
    align-items: center;
    min-height: 62px;
    padding: 8px 9px;
    border: 1px solid rgba(201, 168, 106, .58);
    border-radius: 12px;
    background:
      linear-gradient(135deg, rgba(255, 250, 232, .96), rgba(229, 240, 231, .94));
    box-shadow: 0 16px 42px rgba(18, 39, 32, .24), inset 0 0 0 1px rgba(255,255,255,.62);
    backdrop-filter: blur(14px);
  }

  .map-3d-guide-mobile-guide__summary div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .map-3d-guide-mobile-guide__summary span {
    color: rgba(31, 59, 49, .58);
    font-size: 10px;
    font-weight: 900;
  }

  .map-3d-guide-mobile-guide__summary strong {
    overflow: hidden;
    color: #1f3b31;
    font-size: 13px;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-3d-guide-mobile-guide__summary > button {
    min-width: 74px;
    min-height: 42px;
    padding: 0 9px;
    background: #1f3b31;
    border-color: rgba(201, 168, 106, .46);
    color: #fff7df;
  }

  .map-3d-guide-mobile-guide__summary > button.is-active {
    background: #7b2f1f;
    color: #fff7df;
  }

  .map-3d-guide-mobile-guide__drawer {
    display: grid;
    gap: 10px;
    max-height: min(48vh, 420px);
    margin-top: 8px;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 8px 10px 12px;
    border: 1px solid rgba(201, 168, 106, .46);
    border-radius: 12px;
    background:
      linear-gradient(180deg, rgba(255, 250, 232, .98), rgba(242, 238, 220, .96));
    box-shadow: 0 20px 54px rgba(18, 39, 32, .28), inset 0 0 0 1px rgba(255,255,255,.62);
    backdrop-filter: blur(18px);
  }

  .map-3d-guide-mobile-guide__handle {
    justify-self: center;
    width: 42px;
    height: 4px;
    border-radius: 999px;
    background: rgba(31, 59, 49, .24);
  }

  .map-3d-guide-mobile-guide__section,
  .map-3d-guide-mobile-guide__route-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .map-3d-guide-mobile-guide__route-head div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .map-3d-guide-mobile-guide__route-head span,
  .map-3d-guide-mobile-guide__route-head small {
    color: rgba(31, 59, 49, .58);
    font-size: 11px;
    font-weight: 800;
  }

  .map-3d-guide-mobile-guide__route-head strong {
    color: #1f3b31;
    font-family: "Songti SC", "STSong", "Noto Serif SC", serif;
    font-size: 17px;
  }

  .map-3d-guide-mobile-guide__route-head button {
    min-height: 32px;
    padding: 0 11px;
  }

  .map-3d-guide-mobile-guide__routes,
  .map-3d-guide-mobile-guide__camera {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .map-3d-guide-mobile-guide__routes button,
  .map-3d-guide-mobile-guide__camera button {
    display: grid;
    gap: 2px;
    min-height: 42px;
    padding: 6px 8px;
    text-align: left;
  }

  .map-3d-guide-mobile-guide__routes button span {
    overflow: hidden;
    color: rgba(31, 59, 49, .58);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-3d-guide-mobile-guide__routes button.is-active,
  .map-3d-guide-mobile-guide__camera button.is-active,
  .map-3d-guide-mobile-guide__stations button.is-active {
    border-color: rgba(201, 168, 106, .72);
    background: linear-gradient(135deg, rgba(255, 239, 181, .98), rgba(239, 247, 235, .94));
    color: #6f4a12;
  }

  .map-3d-guide-mobile-guide__stations {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .map-3d-guide-mobile-guide__stations button {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 34px;
    padding: 0 10px 0 7px;
    color: #24483c;
  }

  .map-3d-guide-mobile-guide__stations button span {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 7px;
    background: rgba(31, 59, 49, .12);
    font-size: 11px;
  }

  .map-3d-guide-mobile-guide__stations button.is-next {
    border-color: rgba(20, 118, 110, .32);
    background: rgba(229, 246, 239, .92);
  }

  .map-3d-guide-mobile-guide__status {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .map-3d-guide-mobile-guide__status span {
    padding: 5px 8px;
    border-radius: 8px;
    background: rgba(31, 59, 49, .08);
    color: rgba(31, 59, 49, .68);
    font-size: 11px;
    font-weight: 900;
  }

  .map-3d-guide-mobile-guide__actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .map-3d-guide-mobile-guide__actions button {
    min-height: 36px;
  }
}

@media (max-width: 360px) {
  .map-3d-guide-mobile-guide__summary {
    grid-template-columns: 1fr 1fr auto;
  }

  .map-3d-guide-mobile-guide__summary div:nth-child(3) {
    display: none;
  }
}
`

function Map3DGuidePage() {
  return <Map3DGuideExperience />
}

export default Map3DGuidePage
