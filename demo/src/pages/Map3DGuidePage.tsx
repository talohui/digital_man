import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  BuddhaRealmAtmosphere,
  type BuddhaRealmAtmosphereMode,
  type BuddhaRealmClearMaskShape,
  type BuddhaRealmClearMaskSize
} from '../components/map3d/BuddhaRealmAtmosphere'
import type { DynamicInkMistStatus } from '../components/map3d/DynamicInkMistCanvas'
import { Map3DPerfPanel } from '../components/map3d/Map3DPerfPanel'
import {
  ScenicPoiBillboards,
  type ScenicPoiBillboardItem,
  type ScenicPoiBillboardMode
} from '../components/map3d/ScenicPoiBillboards'
import { guideSpots, scenicCenter, type GuideRoute, type LatLngPoint } from '../data/guideData'
import type {
  Map3DGardenAssetKind,
  Map3DGardenAssetPriority,
  LingshanMap3DForestPatch,
  LingshanMap3DGardenAsset
} from '../data/lingshanMap3DGardenAssets'
import { lingshanPois, type LingshanPoi } from '../data/lingshanMapData'
import {
  getMapModelOverlayByPoiId,
  getMapModelOverlayInspectorId,
  getVisibleMapModelOverlays,
  type LingshanMapModelOverlay
} from '../data/lingshanMapModelOverlays'
import { LINGSHAN_INK_MAP_BOUNDS } from '../data/lingshanInkMapBounds'
import {
  getDefaultScenicRouteId,
  getScenicRouteConfig,
  getScenicRouteOptions,
  type ScenicRouteConfig
} from '../data/lingshanScenicRoutes'
import { useLandmarkModelInspector } from '../hooks/useLandmarkModelInspector'
import { loadTMap } from '../lib/loadTMap'
import {
  GLBRuntimeOrchestrator,
  type GLBRuntimeOrchestratorSnapshot
} from '../lib/map/GLBRuntimeOrchestrator'
import { GLBMemoryManager } from '../lib/map/GLBMemoryManager'
import { GLBSpatialController } from '../lib/map/GLBSpatialController'
import { LayerManager } from '../lib/map/LayerManager'
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
import { buildWalkingRoute, type PlannedRoute } from '../lib/routePlanning'
import { findNearestRoutePoint, findNextStop, formatDistanceMeters, haversineDistanceMeters } from '../lib/routeProgress'
import { useIsMobileViewport } from '../hooks/useIsMobileViewport'

type Map3DGuideStatus = 'idle' | 'loading' | 'ready' | 'error'
type RerouteStatus = 'idle' | 'off_route' | 'planning' | 'ready' | 'failed'
type GuideCameraMode = Map3DCameraPresetId
type Map3DGuideVariant = 'default' | 'prototype-a' | 'prototype-b' | 'prototype-c'
type MapInteractionKind = 'zoom' | 'drag' | 'move'
type GardenLodState = {
  opacity: number
  visibleTier: 'none' | 'reduced' | 'full'
  isInteracting: boolean
  currentZoom?: number
}
type GardenModelReport = {
  createdCount: number
  visibleCount: number
  patchCount: number
  patchFallback: boolean
  unavailable: boolean
  assetUrls: string[]
  loadedIds: string[]
  errorIds: string[]
}

// Tree GLB system removed due to mobile memory pressure.
const lingshanMap3DForestPatches: LingshanMap3DForestPatch[] = []

function getDefaultMap3DGardenAssets(): LingshanMap3DGardenAsset[] {
  return []
}

function getLegacyMap3DGardenAssets(): LingshanMap3DGardenAsset[] {
  return []
}

function getMap3DGardenAssetUrl(_kind: Map3DGardenAssetKind) {
  return ''
}

function getMap3DGardenLicenseId() {
  return 'tree-glb-system-removed'
}

function normalizeLingshanTreeAssetScale<T extends LingshanMap3DGardenAsset>(asset: T): T {
  return asset
}

function normalizeLingshanTreeScaleRange(_kind: Map3DGardenAssetKind, scaleMin: number, scaleMax: number) {
  return { scaleMin, scaleMax }
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

type GardenAssetFilterState = {
  zoneId: string
  kind: string
  priority: string
  visible: string
}

type GardenBatchAdjustState = {
  scaleMultiplier: number
  heightDelta: number
  opacityDelta: number
  latOffset: number
  lngOffset: number
}

type GardenEditorZoneKind = 'forest' | 'axis_grove' | 'water_edge' | 'node_green'
type GardenKeepoutReason = string
type GardenEditorMode = 'inspect' | 'drawVegetation' | 'drawKeepout' | 'addAsset'
type GardenAssetSourceMode = 'manual' | 'legacy'
type TreeCandidateType =
  | 'fluffy_bodhi_grove'
  | 'fluffy_round_tree'
  | 'fluffy_tree_mix'
  | 'bushy_canopy_tree'
  | 'dense_shrub_cluster'
  | 'soft_forest_clump'
type TreeCandidateClusterMode = 'single' | 'smallCluster' | 'mediumCluster' | 'backgroundGrove'
type TreeCandidateLabClickMode = 'idle' | 'addCluster' | 'compareSet'

type TreeCandidateLabParams = {
  count: number
  radiusMeters: number
  minDistanceMeters: number
  scaleMin: number
  scaleMax: number
  heightOffset: number
  randomSeed: number
}

type TreeCandidateLabState = {
  selectedCandidateType: TreeCandidateType
  clusterMode: TreeCandidateClusterMode
  params: TreeCandidateLabParams
  testTrees: LingshanMap3DGardenAsset[]
  defaultGardenHidden: boolean
  landmarkReferenceLoaded: boolean
}

type GardenAssetRatios = Partial<Record<Map3DGardenAssetKind, number>>

type GardenEditorVegetationZone = {
  id: string
  name: string
  kind: GardenEditorZoneKind
  vertices: LatLngPoint[]
  density: number
  assetPool: Map3DGardenAssetKind[]
  assetRatios: GardenAssetRatios
  minScale: number
  maxScale: number
  minHeight: number
  maxHeight: number
  opacity: number
  priority: Map3DGardenAssetPriority
  visible: boolean
}

type GardenEditorKeepoutZone = {
  id: string
  name: string
  reason: GardenKeepoutReason
  vertices: LatLngPoint[]
  visible: boolean
}

type GardenEditorState = {
  zones: GardenEditorVegetationZone[]
  keepouts: GardenEditorKeepoutZone[]
  previewAssets: LingshanMap3DGardenAsset[]
  appliedAssets: LingshanMap3DGardenAsset[]
}

type GardenDraftPolygon = {
  mode: 'vegetation' | 'keepout'
  vertices: LatLngPoint[]
} | null

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
const LINGSHAN_NATIVE_SKY_OPTIONS = {
  color: '#EAF0E6',
  brightness: 0.82,
  animated: true
} as const
const LINGSHAN_NATIVE_FOG_OPTIONS = {
  color: '#DDE8DF'
} as const
const MAP_3D_GUIDE_RENDER_OPTIONS = {
  enableBloom: true,
  skyOptions: LINGSHAN_NATIVE_SKY_OPTIONS,
  fogOptions: LINGSHAN_NATIVE_FOG_OPTIONS
} as const
const MAP_3D_GUIDE_BASE_MAP = {
  type: 'vector',
  features: ['base', 'building3d', 'label']
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
const TENCENT_CUSTOM_LAYER_ID = '6a3283c42271'
const TENCENT_CUSTOM_LAYER_CONFIG = {
  minZoom: 15,
  maxZoom: 20,
  visible: true,
  zIndex: MAP_LAYER_Z_INDEX.TENCENT_CUSTOM_LAYER,
  opacity: 1
} as const
const TENCENT_CUSTOM_LAYER_INITIAL_ZOOM = 16
const MAP_3D_GUIDE_INITIAL_ZOOM = ENABLE_TENCENT_CUSTOM_LAYER ? TENCENT_CUSTOM_LAYER_INITIAL_ZOOM : SCENIC_CAMERA_BOUNDS.defaultZoom

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
const INK_MAP_MAX_ZOOM = TENCENT_CUSTOM_LAYER_CONFIG.maxZoom
const INK_MAP_DEBUG_MIN_ZOOM = 15.2
const INK_MAP_DEBUG_MAX_ZOOM = 21.4
const INK_MAP_EDGE_MIST_ZOOM_THRESHOLD = 18.08
const INK_MAP_EDGE_MIST_GAP_RATIO = 0.26
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
const MAP_3D_GUIDE_GARDEN_STORAGE_KEY = 'lingshan-map-3d-guide-garden-assets-v8-manual-trees'
const MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY = 'lingshan-map-3d-guide-garden-editor-v1'
const TREE_CANDIDATE_LAB_STORAGE_KEY = 'lingshan_tree_candidate_lab_draft_v1'
const MAP_3D_GUIDE_LOCALHOST_TRANSFER_PREFIX = 'lingshan-map-3d-guide-localhost-transfer:'
const MAP_3D_GUIDE_LOCALHOST_TRANSFER_KEYS = [
  MAP_3D_GUIDE_GARDEN_STORAGE_KEY,
  MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY,
  TREE_CANDIDATE_LAB_STORAGE_KEY
] as const
const TREE_CANDIDATE_LAB_ZONE_ID = 'tree-candidate-lab'
const recommendedTreeCandidateTypes: TreeCandidateType[] = ['fluffy_bodhi_grove']
const legacyTreeCandidateTypes: TreeCandidateType[] = [
  'fluffy_round_tree',
  'fluffy_tree_mix',
  'bushy_canopy_tree',
  'dense_shrub_cluster',
  'soft_forest_clump'
]
const treeCandidateTypes: TreeCandidateType[] = [
  ...recommendedTreeCandidateTypes,
  ...legacyTreeCandidateTypes
]
const treeCandidateLabels: Record<TreeCandidateType, string> = {
  fluffy_bodhi_grove: '毛茸茸菩提树团',
  fluffy_round_tree: 'fluffy_round_tree',
  fluffy_tree_mix: 'fluffy_tree_mix',
  bushy_canopy_tree: 'bushy_canopy_tree',
  dense_shrub_cluster: 'dense_shrub_cluster',
  soft_forest_clump: 'soft_forest_clump'
}
const treeCandidateDescriptions: Record<TreeCandidateType, string> = {
  fluffy_bodhi_grove: '主树团候选；适合背景林、边界林、地标侧后方树群。',
  fluffy_round_tree: 'Kenney legacy 圆冠矮树候选。',
  fluffy_tree_mix: 'Kenney legacy 块状圆冠树候选。',
  bushy_canopy_tree: 'Kenney legacy 深绿橡树冠候选。',
  dense_shrub_cluster: 'Kenney legacy 大灌木候选。',
  soft_forest_clump: 'Kenney legacy 深绿树候选。'
}
const treeCandidateRecommendedModes: Record<TreeCandidateType, TreeCandidateClusterMode[]> = {
  fluffy_bodhi_grove: ['smallCluster', 'mediumCluster', 'backgroundGrove'],
  fluffy_round_tree: ['single', 'smallCluster', 'mediumCluster', 'backgroundGrove'],
  fluffy_tree_mix: ['single', 'smallCluster', 'mediumCluster', 'backgroundGrove'],
  bushy_canopy_tree: ['single', 'smallCluster', 'mediumCluster', 'backgroundGrove'],
  dense_shrub_cluster: ['single', 'smallCluster', 'mediumCluster', 'backgroundGrove'],
  soft_forest_clump: ['single', 'smallCluster', 'mediumCluster', 'backgroundGrove']
}
const treeCandidateTypesForCompare = treeCandidateTypes
const treeCandidateLegacyDefaults: Record<TreeCandidateClusterMode, TreeCandidateLabParams> = {
  single: {
    count: 1,
    radiusMeters: 0,
    minDistanceMeters: 0,
    scaleMin: 84,
    scaleMax: 94,
    heightOffset: 2.2,
    randomSeed: 1207
  },
  smallCluster: {
    count: 4,
    radiusMeters: 10,
    minDistanceMeters: 3,
    scaleMin: 78,
    scaleMax: 98,
    heightOffset: 2.1,
    randomSeed: 2401
  },
  mediumCluster: {
    count: 8,
    radiusMeters: 18,
    minDistanceMeters: 4,
    scaleMin: 74,
    scaleMax: 106,
    heightOffset: 2,
    randomSeed: 3613
  },
  backgroundGrove: {
    count: 14,
    radiusMeters: 36,
    minDistanceMeters: 6,
    scaleMin: 66,
    scaleMax: 116,
    heightOffset: 1.8,
    randomSeed: 4817
  }
}
const treeCandidateBodhiGroveDefaults: Record<TreeCandidateClusterMode, TreeCandidateLabParams> = {
  single: {
    count: 1,
    radiusMeters: 0,
    minDistanceMeters: 0,
    scaleMin: 48,
    scaleMax: 74.4,
    heightOffset: 0,
    randomSeed: 9201
  },
  smallCluster: {
    count: 3,
    radiusMeters: 14,
    minDistanceMeters: 8,
    scaleMin: 48,
    scaleMax: 74.4,
    heightOffset: 0,
    randomSeed: 9301
  },
  mediumCluster: {
    count: 5,
    radiusMeters: 26,
    minDistanceMeters: 10,
    scaleMin: 48,
    scaleMax: 74.4,
    heightOffset: 0,
    randomSeed: 9401
  },
  backgroundGrove: {
    count: 8,
    radiusMeters: 48,
    minDistanceMeters: 14,
    scaleMin: 48,
    scaleMax: 74.4,
    heightOffset: 0,
    randomSeed: 9501
  }
}
const treeCandidateRecommendedDefaults: Record<TreeCandidateType, Record<TreeCandidateClusterMode, TreeCandidateLabParams>> = {
  fluffy_bodhi_grove: treeCandidateBodhiGroveDefaults,
  fluffy_round_tree: treeCandidateLegacyDefaults,
  fluffy_tree_mix: treeCandidateLegacyDefaults,
  bushy_canopy_tree: treeCandidateLegacyDefaults,
  dense_shrub_cluster: treeCandidateLegacyDefaults,
  soft_forest_clump: treeCandidateLegacyDefaults
}
const treeCandidateClusterDefaults: Record<TreeCandidateClusterMode, TreeCandidateLabParams> = treeCandidateBodhiGroveDefaults
const coreLandmarkReferenceIds = [
  'giant_buddha',
  'fan_gong',
  'puti_avenue',
  'jiulong_guanyu',
  'lingshan_dazhaobi',
  'wuyin_tancheng',
  'foshou_square',
  'foqian_square',
  'xiangfu_temple',
  'sansheng_hall',
  'baizi_mile',
  'manlong_flying_tower',
  'shengjing_square'
]
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
const LANDMARK_PRELOAD_RADIUS_M = 650
const LANDMARK_KEEP_ALIVE_RADIUS_M = 900
const LANDMARK_RELEASE_RADIUS_M = 1400
const PROTECT_TOUR_FOCUS_LANDMARKS = true
const treeCandidateClusterLabels: Record<TreeCandidateClusterMode, string> = {
  single: '单棵',
  smallCluster: '小树团',
  mediumCluster: '中树团',
  backgroundGrove: '背景林团'
}
const defaultGardenFilters: GardenAssetFilterState = {
  zoneId: 'all',
  kind: 'all',
  priority: 'all',
  visible: 'all'
}
const defaultGardenBatchAdjust: GardenBatchAdjustState = {
  scaleMultiplier: 1.08,
  heightDelta: 0,
  opacityDelta: 0.05,
  latOffset: 0,
  lngOffset: 0
}
const gardenAssetKindOptions: Map3DGardenAssetKind[] = [
  'pine_cluster',
  'mixed_grove',
  'bamboo_grove',
  'forest_edge',
  'shrub_mass',
  'rock_cluster',
  'stone_mass',
  'fluffy_round_tree',
  'bushy_canopy_tree',
  'dense_shrub_cluster',
  'soft_forest_clump',
  'fluffy_tree_mix'
]
const defaultEditorAssetPool: Map3DGardenAssetKind[] = ['pine_cluster', 'mixed_grove', 'forest_edge', 'shrub_mass', 'rock_cluster']
const defaultEditorAssetRatios: GardenAssetRatios = {
  pine_cluster: 40,
  mixed_grove: 24,
  forest_edge: 16,
  shrub_mass: 14,
  rock_cluster: 6
}
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
    subtitle: '稀疏园林资产 · 路线优先',
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
    kicker: '视觉原型 C · 沉稳 3D 园林资产',
    title: '低模园林路线沙盘',
    subtitle: 'GLB 园林资产 · 地图坐标锚定',
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

export function Map3DGuideExperience({ variant = 'default' }: { variant?: Map3DGuideVariant }) {
  const navigate = useNavigate()
  const isMobileViewport = useIsMobileViewport()
  const visualVariant = map3DGuideVisualVariants[variant] ?? map3DGuideVisualVariants.default
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const tourRouteProgressLayerRef = useRef<any>(null)
  const poiMarkerLayerRef = useRef<any>(null)
  const userMarkerLayerRef = useRef<any>(null)
  const rerouteLayerRef = useRef<any>(null)
  const landmarkHighlightLayerRef = useRef<any>(null)
  const decorMarkerLayerRef = useRef<any>(null)
  const forestPatchLayerRef = useRef<any>(null)
  const inkOverlayLayerRef = useRef<HTMLDivElement | null>(null)
  const inkTileLayerRef = useRef<any>(null)
  const tencentCustomLayerInitKeyRef = useRef('')
  const inkTileGroundFallbackLayerRef = useRef<any>(null)
  const inkTileDomFallbackLayerRef = useRef<HTMLDivElement | null>(null)
  const formalInkBoundsMarkerLayerRef = useRef<any>(null)
  const formalInkBoundsBoundaryLayerRef = useRef<any>(null)
  const formalInkBoundsFillLayerRef = useRef<any>(null)
  const inkBoundsMarkerLayerRef = useRef<any>(null)
  const inkBoundsBoundaryLayerRef = useRef<any>(null)
  const gardenEditorPolygonLayerRef = useRef<any>(null)
  const gardenEditorVertexLayerRef = useRef<any>(null)
  const gardenPreviewMarkerLayerRef = useRef<any>(null)
  const gardenAssetEditMarkerLayerRef = useRef<any>(null)
  const treeCandidateMarkerLayerRef = useRef<any>(null)
  const treeCandidateEditMarkerLayerRef = useRef<any>(null)
  const gltfModelRefs = useRef<Map<string, any>>(new Map())
  const landmarkLastEvictedAtRef = useRef<Map<string, number>>(new Map())
  const landmarkLastLoadAttemptAtRef = useRef<Map<string, number>>(new Map())
  const landmarkLastLoadAllowReasonRef = useRef<Map<string, string>>(new Map())
  const landmarkLastLoadDenyReasonRef = useRef<Map<string, string>>(new Map())
  const cameraSequenceRef = useRef(0)
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
  const currentZoomRef = useRef(MAP_3D_GUIDE_INITIAL_ZOOM)
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
  // Tree GLB system removed due to memory pressure; debugGarden/Tree Candidate Lab is no longer active.
  const debugGarden = false
  const debugPerf = useMemo(() => visualVariant.id === 'prototype-c' && isQueryEnabled('debugPerf'), [visualVariant.id])
  const enableDynamicMistDebugOverride = useMemo(() => debugPerf && isQueryEnabled('enableDynamicMist'), [debugPerf])
  const debugInkBounds = false
  const exportInkBase = false
  const isInkCleanMode = debugInkBounds || exportInkBase
  const noMapBoundsDebugOverride = useMemo(() => debugPerf && isQueryEnabled('noMapBounds'), [debugPerf])
  const mapBoundsDisabledReason = debugGarden
    ? 'debugGarden'
    : noMapBoundsDebugOverride
      ? 'debugPerfNoMapBounds'
      : 'none'
  const mapBoundsEnabled = (ENABLE_TENCENT_CUSTOM_LAYER || visualVariant.id === 'prototype-c') && !isInkCleanMode && mapBoundsDisabledReason === 'none'
  const mapMinZoom = getEffectiveInkMapMinZoom(mapBoundsEnabled)
  const mapMaxZoom = getEffectiveInkMapMaxZoom(mapBoundsEnabled)
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
  const [currentRouteId, setCurrentRouteId] = useState(() => getInitialScenicRouteIdFromQuery())
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
  const landmarkModelOverlays = useMemo(() => {
    const overlays = getVisibleMapModelOverlays()

    if (!debugGarden) {
      return orderMapModelOverlaysForLoading(overlays)
    }

    const coreIds = new Set(coreLandmarkReferenceIds)
    return orderMapModelOverlaysForLoading(
      overlays.filter((overlay) => coreIds.has(getMapModelOverlayInspectorId(overlay)))
    )
  }, [debugGarden])
  const [mapStatus, setMapStatus] = useState<Map3DGuideStatus>('idle')
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
    currentZoom: MAP_3D_GUIDE_INITIAL_ZOOM
  })
  const [mapBoundsSnapshot, setMapBoundsSnapshot] = useState<{
    center: LatLngPoint
    zoom: number
  }>({
    center: routeCenter,
    zoom: MAP_3D_GUIDE_INITIAL_ZOOM
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
  const [gardenAssets, setGardenAssets] = useState<LingshanMap3DGardenAsset[]>(() => loadStoredGardenAssets(visualVariant.id))
  const [gardenAssetSourceMode, setGardenAssetSourceMode] = useState<GardenAssetSourceMode>('manual')
  const [selectedGardenId, setSelectedGardenId] = useState(() => (debugGarden ? '' : loadStoredGardenAssets(visualVariant.id)[0]?.id ?? ''))
  const [gardenFilters, setGardenFilters] = useState<GardenAssetFilterState>(defaultGardenFilters)
  const [gardenBatchAdjust, setGardenBatchAdjust] = useState<GardenBatchAdjustState>(defaultGardenBatchAdjust)
  const [forestPatchesVisible, setForestPatchesVisible] = useState(false)
  const [gardenEditorMode, setGardenEditorMode] = useState<GardenEditorMode>('inspect')
  const [gardenEditorState, setGardenEditorState] = useState<GardenEditorState>(() => loadStoredGardenEditorState())
  const [gardenEditorUsesStoredDraft, setGardenEditorUsesStoredDraft] = useState(() => hasStoredGardenEditorDraft())
  const [gardenDraftPolygon, setGardenDraftPolygon] = useState<GardenDraftPolygon>(null)
  const [selectedEditorZoneId, setSelectedEditorZoneId] = useState('')
  const [selectedKeepoutZoneId, setSelectedKeepoutZoneId] = useState('')
  const [selectedGardenVertexId, setSelectedGardenVertexId] = useState('')
  const [gardenAssetEditDraft, setGardenAssetEditDraft] = useState<LingshanMap3DGardenAsset | null>(null)
  const [editorAddAssetKind, setEditorAddAssetKind] = useState<Map3DGardenAssetKind>('pine_cluster')
  const [gardenCopyStatus, setGardenCopyStatus] = useState('尚未导出')
  const [treeCandidateLabState, setTreeCandidateLabState] = useState<TreeCandidateLabState>(() => loadTreeCandidateLabDraft(debugGarden))
  const [treeCandidateLabClickMode, setTreeCandidateLabClickMode] = useState<TreeCandidateLabClickMode>(() => (debugGarden ? 'addCluster' : 'idle'))
  const [selectedTreeCandidateId, setSelectedTreeCandidateId] = useState('')
  const [gardenPatchReport, setGardenPatchReport] = useState({ patchCount: 0, patchFallback: false })
  const [inkBoundsDraft, setInkBoundsDraft] = useState<InkMapBoundsDraft>(() => createEmptyInkMapBoundsDraft())
  const [inkBoundsCopyStatus, setInkBoundsCopyStatus] = useState('尚未复制')
  const [inkExportUiHidden, setInkExportUiHidden] = useState(false)
  const [inkOverlayLayerReady, setInkOverlayLayerReady] = useState(false)
  const [inkOverlayLayerError, setInkOverlayLayerError] = useState('')
  const [inkOverlayCameraSnapshot, setInkOverlayCameraSnapshot] = useState<InkOverlayCameraState>(() => inkOverlayCameraStateRef.current)
  const [inkTileDomFallbackActive, setInkTileDomFallbackActive] = useState(false)
  const [inkTileGroundFallbackActive, setInkTileGroundFallbackActive] = useState(false)
  const [dynamicMistStatus, setDynamicMistStatus] = useState<DynamicInkMistStatus>({
    canvasActive: false,
    degraded: false,
    quality: 'off',
    recoveryState: 'disabled'
  })
  const landmarkInspector = useLandmarkModelInspector({
    active: (visualVariant.id === 'prototype-c' || debugPerf || debugGarden) && !isInkCleanMode,
    layerManager,
    useLocalDrafts: debugPerf || debugGarden,
    map: mapRef.current,
    mapReady: mapStatus === 'ready',
    overlays: landmarkModelOverlays,
    perfRecorder,
    resolveLocation: getModelOverlayLocation,
    onFocusLandmark: ({ id, location }) => focusLandmarkCamera(id, location, true)
  })
  const landmarkInspectorRef = useRef(landmarkInspector)
  const landmarkRuntimeLoadGenerationRef = useRef(0)
  const landmarkRuntimeLoadTimersRef = useRef<number[]>([])

  const routeStops = currentRouteConfig.stops
  const terminalStopId = routeStops[routeStops.length - 1]?.spotId
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

    const currentId = resolveLandmarkInspectorIdFromRouteId(activeTourStepId ?? selectedStopId, landmarkModelOverlays)
    const nextId = resolveLandmarkInspectorIdFromRouteId(nextStop.nextStopId ?? undefined, landmarkModelOverlays)

    if (currentId) {
      ids.add(currentId)
    }

    if (nextId) {
      ids.add(nextId)
    }

    return ids
  }, [activeTourStepId, landmarkModelOverlays, nextStop.nextStopId, selectedStopId, tourMode])
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
  const shouldRunGlbRuntime = visualVariant.id === 'prototype-c' && !isInkCleanMode
  const baseShouldLoadGardenAssets = false
  const shouldLoadGardenAssets = false
  const gardenLodState = useMemo(
    () =>
      getGardenLodState({
        currentZoom: mapInteractionSnapshot.currentZoom,
        debugGarden,
        isInteracting: mapInteractionSnapshot.isInteracting
      }),
    [debugGarden, mapInteractionSnapshot.currentZoom, mapInteractionSnapshot.isInteracting]
  )

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
        glbRuntimeGardenGate: false,
        glbRuntimeLandmarkDelayMs: snapshot.landmarkDelayMs,
        glbRuntimeGardenDelayMs: 0,
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
      debugGarden,
      inkCleanMode: isInkCleanMode,
      mobile: isMobileViewport,
      interactionLiteMode: mapInteractionSnapshot.isInteracting
    })
  }, [
    debugGarden,
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

    if (!ENABLE_LANDMARK_GLB || visualVariant.id !== 'prototype-c' || debugGarden || isInkCleanMode) {
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
    const desiredLandmarkIds = new Set<string>(protectedLandmarkIds)

    for (const candidate of candidates) {
      if (desiredLandmarkIds.size >= MAX_ACTIVE_LANDMARK_GLB) {
        break
      }

      if (candidate.distance <= LANDMARK_PRELOAD_RADIUS_M) {
        desiredLandmarkIds.add(candidate.id)
      }
    }

    const inspectorItemsById = new Map(inspector.items.map((item) => [item.id, item]))
    const activeItems = inspector.items.filter((item) => item.status === 'loaded' || item.status === 'loading')
    const activeItemIds = new Set(activeItems.map((item) => item.id))
    const activeBudgetMax = Math.max(MAX_ACTIVE_LANDMARK_GLB, protectedLandmarkIds.size)

    for (const item of activeItems
      .filter((item) => !protectedLandmarkIds.has(item.id) && !desiredLandmarkIds.has(item.id))
      .sort((a, b) => (candidateById.get(a.id)?.distance ?? Number.POSITIVE_INFINITY) - (candidateById.get(b.id)?.distance ?? Number.POSITIVE_INFINITY))) {
      if (desiredLandmarkIds.size >= activeBudgetMax) {
        break
      }

      const distance = candidateById.get(item.id)?.distance ?? Number.POSITIVE_INFINITY
      if (distance <= LANDMARK_KEEP_ALIVE_RADIUS_M) {
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
    }

    activeItems.forEach((item) => {
      const distance = candidateById.get(item.id)?.distance ?? Number.POSITIVE_INFINITY
      if (distance > LANDMARK_RELEASE_RADIUS_M) {
        markRelease(item.id, 'release-radius')
        return
      }

      if (!desiredLandmarkIds.has(item.id) && distance > LANDMARK_KEEP_ALIVE_RADIUS_M) {
        markRelease(item.id, 'outside-keep-alive-window')
      }
    })

    const desiredInactiveIds = () => Array.from(desiredLandmarkIds).filter((id) => !activeItemIds.has(id))
    const activeCountAfterPlannedRelease = () => activeItems.filter((item) => !releaseIds.has(item.id)).length
    const evictableActiveItems = () =>
      activeItems
        .filter((item) => !releaseIds.has(item.id) && !protectedLandmarkIds.has(item.id) && !desiredLandmarkIds.has(item.id))
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
          source: 'orchestrator',
          kind: 'landmark',
          protected: false,
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
            source: 'orchestrator',
            kind: 'landmark',
            protected: protectedModel,
            visible: true,
            sceneState: 'visible',
            memoryState: 'active',
            estimatedMemoryMB: 36,
            reason: protectedModel ? 'tour-focus-landmark-visible' : 'nearby-landmark-visible'
          }
        })
        decisions.set(id, { allowed: decision.allowed, reason: decision.allowed ? undefined : decision.reason })
        if (decision.allowed) {
          sceneStateManagerRef.current?.rehydrate(modelId)
          glbSpatialController.setVisible(modelId, true)
        }
      } else if (item.status !== 'loading') {
        landmarkLastLoadAttemptAtRef.current.set(id, Date.now())
        const decision = sceneArbiter.requestAction({
          type: 'load',
          modelId,
          context: {
            source: 'orchestrator',
            kind: 'landmark',
            protected: protectedModel,
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
          inspector.loadLandmark(id)
          sceneArbiter.releaseLoad(modelId)
          loadedNow.push(id)
          landmarkLastLoadAllowReasonRef.current.set(id, decision.reason)
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
              source: 'orchestrator',
              kind: 'companion',
              protected: protectedCompanion,
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
            source: 'orchestrator',
            kind: 'companion',
            protected: protectedCompanion,
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
      const shouldRelease =
        !protectedModel &&
        (releaseIds.has(id) || (distance !== undefined && distance > LANDMARK_RELEASE_RADIUS_M))
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
        glbUrl: overlay.modelUrl,
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
      `正式 3D 地标滚动窗口 · active ${activeBudgetUsed}/${activeBudgetMax}`
    )
    perfRecorder.recordMapVisualEvent({
      type: 'landmarkRuntimeLoadBatch',
      landmarkRuntimeBatchIndex: 0,
      landmarkRuntimeBatchCount: 1,
      landmarkRuntimeIds: loadedNow.length || releasedNow.length ? [...loadedNow, ...releasedNow.map((id) => `release:${id}`)] : Array.from(desiredLandmarkIds),
      landmarkGlbDebugRows: debugRows,
      reason: `${LANDMARK_GLB_LOAD_MODE}; protected=${Array.from(protectedLandmarkIds).join(',') || '-'}`
    })

    return () => {
      landmarkRuntimeLoadGenerationRef.current += 1
      landmarkRuntimeLoadTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      landmarkRuntimeLoadTimersRef.current = []
    }
  }, [
    debugGarden,
    glbMemoryManager,
    glbRuntimeSnapshot.landmarkGate,
    glbRuntimeSnapshot.phase,
    glbSpatialController,
    isInkCleanMode,
    landmarkInspector.items,
    landmarkModelOverlays,
    layerManager,
    mapBoundsSnapshot.center,
    mapVisualReadyForOverlays,
    perfRecorder,
    protectedLandmarkIds,
    protectedSceneModelIds,
    sceneArbiter,
    sceneWindowManager,
    visualVariant.id
  ])

  const tourStateLabel =
    tourMode === 'buddhaRealmTour'
      ? `佛境巡游中${activeTourStepId ? ` · ${getPoiDisplay(activeTourStepId)?.name ?? activeTourStepId}` : ''}`
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
  const atmosphereMode: BuddhaRealmAtmosphereMode = !isMapVisualReady
    ? 'intro'
    : tourMode === 'buddhaRealmTour'
      ? 'tour'
      : activeLandmarkId || activeCameraMode === 'landmarkFocus'
        ? 'focus'
        : 'normal'
  const debugGardenDynamicMistDisabled = debugGarden && !enableDynamicMistDebugOverride
  const dynamicMistEnabled =
    visualVariant.id === 'prototype-c' &&
    !isInkCleanMode &&
    isMapVisualReady &&
    (!debugGarden || enableDynamicMistDebugOverride)
  const edgeMistState = useMemo(
    () =>
      getInkMapEdgeMistState({
        center: mapBoundsSnapshot.center,
        disabledReason: mapBoundsDisabledReason,
        enabled: mapBoundsEnabled,
        zoom: mapBoundsSnapshot.zoom
      }),
    [mapBoundsDisabledReason, mapBoundsEnabled, mapBoundsSnapshot.center, mapBoundsSnapshot.zoom]
  )
  const clearMaskState = useMemo(
    () =>
      getBuddhaRealmClearMaskState({
        edgeMistLevel: edgeMistState.level,
        enabled: mapBoundsEnabled,
        mode: atmosphereMode,
        tourActive: tourMode === 'buddhaRealmTour'
      }),
    [atmosphereMode, edgeMistState.level, mapBoundsEnabled, tourMode]
  )
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
      atmosphereMode,
      atmosphereVisible: visualVariant.id === 'prototype-c',
      poiBillboardCount: scenicPoiBillboards.length,
      poiBillboardMode,
      activePoiBillboardId: poiBillboardActiveId ?? null,
      horizonMaskEnabled: visualVariant.id === 'prototype-c',
      horizonMaskIntensity: atmosphereMode === 'intro' ? 0.72 : atmosphereMode === 'tour' ? 0.66 : 0.54,
      activePoiCount: activePoiBillboardCount,
      mutedPoiCount: mutedPoiBillboardCount,
      waterHintsEnabled: visualVariant.id === 'prototype-c',
      waterHintsCount: 3,
      tourPoiSuppressionEnabled,
      dynamicMistEnabled,
      dynamicMistCanvasActive: dynamicMistStatus.canvasActive,
      dynamicMistQuality: dynamicMistStatus.quality,
      dynamicMistDegraded: dynamicMistStatus.degraded,
      dynamicMistDegradeReason: dynamicMistStatus.degradeReason,
      dynamicMistFpsEstimate: dynamicMistStatus.fpsEstimate,
      dynamicMistFrameMs: dynamicMistStatus.frameMs,
      dynamicMistRecoveryState: dynamicMistStatus.recoveryState,
      dynamicMistSpeedScale: dynamicMistStatus.speedScale,
      dynamicMistContrastScale: dynamicMistStatus.contrastScale,
      skyOptionsAnimated: LINGSHAN_NATIVE_SKY_OPTIONS.animated,
      enableDynamicMistDebugOverride,
      debugGardenDynamicMistDisabled,
      coreClearMaskEnabled: visualVariant.id === 'prototype-c',
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
    atmosphereMode,
    clearMaskState.center,
    clearMaskState.mode,
    clearMaskState.shape,
    clearMaskState.size,
    debugGardenDynamicMistDisabled,
    dynamicMistEnabled,
    dynamicMistStatus.canvasActive,
    dynamicMistStatus.degradeReason,
    dynamicMistStatus.degraded,
    dynamicMistStatus.fpsEstimate,
    dynamicMistStatus.frameMs,
    dynamicMistStatus.quality,
    dynamicMistStatus.recoveryState,
    dynamicMistStatus.speedScale,
    dynamicMistStatus.contrastScale,
    edgeMistState.level,
    edgeMistState.distanceToInkBoundary,
    edgeMistState.nearInkBoundary,
    edgeMistState.reason,
    edgeMistState.strength,
    mapBoundsDisabledReason,
    mapBoundsEnabled,
    mapBoundsSnapshot.center,
    mapBoundsSnapshot.zoom,
    mapMaxZoom,
    mapMinZoom,
    mutedPoiBillboardCount,
    noMapBoundsDebugOverride,
    enableDynamicMistDebugOverride,
    perfRecorder,
    poiBillboardActiveId,
    poiBillboardMode,
    scenicPoiBillboards.length,
    tourPoiSuppressionEnabled,
    visualVariant.id
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
  const selectedGardenAsset = selectedGardenId ? gardenAssets.find((asset) => asset.id === selectedGardenId) : undefined
  const selectedGardenAssetDraft = selectedGardenAsset && gardenAssetEditDraft?.id === selectedGardenId ? gardenAssetEditDraft : selectedGardenAsset
  const selectedTreeCandidateAsset = selectedTreeCandidateId
    ? treeCandidateLabState.testTrees.find((asset) => asset.id === selectedTreeCandidateId)
    : undefined
  const selectedEditorZone = selectedEditorZoneId ? gardenEditorState.zones.find((zone) => zone.id === selectedEditorZoneId) : undefined
  const selectedKeepoutZone = selectedKeepoutZoneId ? gardenEditorState.keepouts.find((zone) => zone.id === selectedKeepoutZoneId) : undefined
  const filteredGardenAssets = useMemo(
    () => gardenAssets.filter((asset) => matchesGardenFilters(asset, gardenFilters)),
    [gardenAssets, gardenFilters]
  )
  const defaultGardenHidden = true
  const testTreeAssets: LingshanMap3DGardenAsset[] = []
  const overlayGardenAssets: LingshanMap3DGardenAsset[] = []
  const spatialGardenAssetLookup = useMemo(() => {
    const lookup = new Map<string, LingshanMap3DGardenAsset>()
    return lookup
  }, [])
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
              estimatedMemoryMB: record.kind === 'landmark' ? 36 : record.kind === 'tree' ? 1.2 : record.kind === 'companion' ? 2 : 8,
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
  const liveDefaultGardenOverlayCount = 0
  const liveTestTreeOverlayCount = 0
  const gardenModelReport: GardenModelReport = {
    createdCount: 0,
    visibleCount: 0,
    patchCount: 0,
    patchFallback: false,
    unavailable: false,
    assetUrls: [],
    loadedIds: [],
    errorIds: []
  }

  useEffect(() => {
    glbSpatialController.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !debugGarden,
      mobile: isMobileViewport,
      intervalMs: 200,
      protectedModelIds: protectedSceneModelIds
    })
  }, [debugGarden, glbSpatialController, isInkCleanMode, isMobileViewport, mapStatus, protectedSceneModelIds, visualVariant.id])

  useEffect(() => {
    glbMemoryManager.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !debugGarden,
      maxActiveModels: 80,
      ttlMs: 60000,
      sweepIntervalMs: 5000,
      protectedModelIds: protectedSceneModelIds
    })
  }, [debugGarden, glbMemoryManager, isInkCleanMode, mapStatus, protectedSceneModelIds, visualVariant.id])

  useEffect(() => {
    sceneArbiter.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !debugGarden,
      maxActiveGLB: 80,
      memoryPressureThresholdMB: 360,
      debounceMs: 300
    })
  }, [debugGarden, isInkCleanMode, mapStatus, sceneArbiter, visualVariant.id])

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
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !debugGarden && tourMode === 'buddhaRealmTour',
      activeWindowMeters: 300,
      forwardWindowMeters: 800,
      behindProgressWindow: 0.035,
      updateIntervalMs: 1000,
      protectedModelIds: protectedSceneModelIds
    })
  }, [debugGarden, isInkCleanMode, mapStatus, protectedSceneModelIds, sceneWindowManager, tourMode, visualVariant.id])

  useEffect(() => {
    sceneStateManager.configure({
      enabled: visualVariant.id === 'prototype-c' && mapStatus === 'ready' && !isInkCleanMode && !debugGarden && tourMode === 'buddhaRealmTour',
      activeWindowMeters: 300,
      forwardWindowMeters: 800,
      behindProgressWindow: 0.035,
      rehydrateDebounceMs: 300,
      protectedModelIds: protectedSceneModelIds
    })
  }, [debugGarden, isInkCleanMode, mapStatus, protectedSceneModelIds, sceneStateManager, tourMode, visualVariant.id])

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
    gardenLodState,
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
      reason: visualVariant.id === 'prototype-c' ? 'tree-glb-removed' : 'overlays-ready'
    })
  }, [mapVisualReadyForOverlays, perfRecorder, startupStage, visualVariant.id])

  const focusMapOnVertices = (vertices: LatLngPoint[]) => {
    const center = getPathCenter(vertices)

    if (!center || !vertices.length) {
      return
    }

    const bounds = getPolygonBounds(vertices)
    const diagonalMeters = haversineDistanceMeters(
      { lat: bounds.minLat, lng: bounds.minLng },
      { lat: bounds.maxLat, lng: bounds.maxLng }
    )
    const zoom = diagonalMeters > 520 ? 17.25 : diagonalMeters > 260 ? 18 : 18.7

    moveMapCamera(center, {
      id: 'routeOverview',
      label: '编辑视角',
      description: '聚焦当前编辑区域',
      zoom,
      pitch: 42,
      rotation: activeCameraPreset.rotation,
      durationMs: 700
    })
  }

  const selectEditorZone = (zoneId: string) => {
    const zone = gardenEditorState.zones.find((item) => item.id === zoneId)
    setSelectedEditorZoneId(zoneId)
    setSelectedKeepoutZoneId('')
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    setSelectedGardenVertexId('')

    if (zone) {
      focusMapOnVertices(zone.vertices)
    }
  }

  const selectKeepoutZone = (zoneId: string) => {
    const zone = gardenEditorState.keepouts.find((item) => item.id === zoneId)
    setSelectedKeepoutZoneId(zoneId)
    setSelectedEditorZoneId('')
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    setSelectedGardenVertexId('')

    if (zone) {
      focusMapOnVertices(zone.vertices)
    }
  }

  const selectGardenAssetForEditing = (assetId: string) => {
    const asset = gardenAssets.find((item) => item.id === assetId)
    setSelectedGardenId(assetId)
    setSelectedEditorZoneId('')
    setSelectedKeepoutZoneId('')
    setSelectedGardenVertexId('')
    setGardenAssetEditDraft(asset ? cloneGardenAsset(asset) : null)

    if (asset) {
      moveMapCamera(asset.location, {
        id: 'closeInspect',
        label: '资产编辑',
        description: '聚焦当前资产点',
        zoom: 19.2,
        pitch: 54,
        rotation: activeCameraPreset.rotation,
        durationMs: 720
      })
    }
  }

  const updateGardenAssetEditDraft = (patch: Partial<LingshanMap3DGardenAsset>) => {
    setGardenAssetEditDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        ...patch,
        location: patch.location ?? current.location
      }
    })
  }

  const persistGardenDraft = (nextEditorState: GardenEditorState, nextAssets: LingshanMap3DGardenAsset[]) => {
    window.localStorage.setItem(MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY, JSON.stringify(nextEditorState))
    window.localStorage.setItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY, JSON.stringify(nextAssets))
    setGardenEditorUsesStoredDraft(true)
  }

  const completeDraftGardenPolygon = (extraPoint?: LatLngPoint | null) => {
    setGardenDraftPolygon((current) => {
      if (!current) {
        setGardenCopyStatus('当前没有正在绘制的多边形')
        return current
      }

      const vertices = extraPoint && !isSameLatLngPoint(current.vertices[current.vertices.length - 1], extraPoint)
        ? [...current.vertices, extraPoint]
        : current.vertices

      if (vertices.length < 3) {
        setGardenCopyStatus('至少需要 3 个顶点才能完成多边形')
        return current
      }

      if (current.mode === 'vegetation') {
        const zone = createEditorVegetationZone(vertices, gardenEditorState.zones.length)
        setGardenEditorState((state) => ({
          ...state,
          zones: [...state.zones, zone]
        }))
        setSelectedEditorZoneId(zone.id)
        setSelectedKeepoutZoneId('')
        setGardenCopyStatus(`已创建 vegetation zone：${zone.name}`)
      } else {
        const keepout = createEditorKeepoutZone(vertices, gardenEditorState.keepouts.length)
        setGardenEditorState((state) => ({
          ...state,
          keepouts: [...state.keepouts, keepout]
        }))
        setSelectedKeepoutZoneId(keepout.id)
        setSelectedEditorZoneId('')
        setGardenCopyStatus(`已创建 keepout zone：${keepout.name}`)
      }

      setGardenEditorMode('inspect')
      setSelectedGardenVertexId('')
      return null
    })
  }

  useEffect(() => {
    if (!shouldRedirectLocalTMapHost) {
      return
    }

    stashLocalhostTransferDrafts()
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
    if (shouldRedirectLocalTMapHost) {
      return
    }

    let cancelled = false
    let visualReadyTimer: number | null = null
    let visualReadyFallbackTimer: number | null = null
    let visualTimeoutTimer: number | null = null
    let curtainHideTimer: number | null = null
    let visualReadyRafIds: number[] = []
    let visualReadyScheduled = false
    let mapCreatedAt = 0
    const mapVisualEventCleanups: Array<() => void> = []
    const mapInteractionEventCleanups: Array<() => void> = []

    const recordStartupStage = (stage: Map3DStartupStage, reason: string) => {
      setStartupStage(stage)
      perfRecorder.recordMapVisualEvent({
        type: 'startupStageChanged',
        startupStage: stage,
        reason
      })
    }

    const recordCurtainHidden = () => {
      const shownAt = mapLoadingCurtainShownAtRef.current
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      perfRecorder.recordMapVisualEvent({
        type: 'loadingCurtainHidden',
        curtainDurationMs: shownAt !== null ? Math.round(now - shownAt) : undefined
      })
    }

    const markMapVisualReady = (reason: string) => {
      if (cancelled || mapVisualReadyRef.current) {
        return
      }

      mapVisualReadyRef.current = true
      if (visualTimeoutTimer !== null) {
        window.clearTimeout(visualTimeoutTimer)
        visualTimeoutTimer = null
      }
      if (visualReadyFallbackTimer !== null) {
        window.clearTimeout(visualReadyFallbackTimer)
        visualReadyFallbackTimer = null
      }
      setIsMapVisualReady(true)
      setMapReadyTimedOut(false)
      recordStartupStage('baseMapReady', reason)
      setPageMessage('真实 3D 地图导览模式已就绪')
      perfRecorder.recordMapVisualEvent({
        type: 'mapVisualReady',
        reason
      })
      curtainHideTimer = window.setTimeout(() => {
        if (cancelled) {
          return
        }
        setLoadingCurtainVisible(false)
        recordCurtainHidden()
      }, MAP_3D_GUIDE_CURTAIN_FADE_MS)
    }

    const scheduleMapVisualReady = (reason: string) => {
      if (cancelled || mapVisualReadyRef.current || visualReadyScheduled) {
        return
      }

      perfRecorder.recordMapVisualEvent({
        type: 'baseMapEventReceived',
        reason
      })

      if (!mapFirstIdleRef.current) {
        mapFirstIdleRef.current = true
        setIsMapIdle(true)
        perfRecorder.recordMapVisualEvent({
          type: 'mapFirstIdle',
          reason
        })
      }

      visualReadyScheduled = true
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const remainingDelay = Math.max(0, MAP_3D_GUIDE_MIN_BASEMAP_READY_MS - (now - mapCreatedAt))

      visualReadyTimer = window.setTimeout(() => {
        visualReadyRafIds = [
          window.requestAnimationFrame(() => {
            const secondRafId = window.requestAnimationFrame(() => {
              markMapVisualReady(reason)
            })
            visualReadyRafIds = [...visualReadyRafIds, secondRafId]
          })
        ]
      }, remainingDelay)
    }

    async function initMap() {
      if (!mapElementRef.current) {
        return
      }

      setMapStatus('loading')
      recordStartupStage('loadingSdk', 'init')
      setIsMapCreated(false)
      setIsMapIdle(false)
      setIsMapVisualReady(false)
      setMapReadyTimedOut(false)
      setLoadingCurtainVisible(true)
      mapVisualReadyRef.current = false
      mapFirstIdleRef.current = false
      mapOverlaysStartedRef.current = false
      mapRoutePoiShownRef.current = false
      mapLoadingCurtainShownAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
      setPageMessage('正在加载腾讯地图真实底座...')
      perfRecorder.markStageStart('mapInit')
      perfRecorder.recordMapVisualEvent({
        type: 'loadingCurtainShown'
      })
      perfRecorder.recordMapVisualEvent({
        type: 'tmapScriptLoadStarted',
        reason: 'loadTMap'
      })

      visualTimeoutTimer = window.setTimeout(() => {
        if (cancelled || mapVisualReadyRef.current) {
          return
        }

        setMapReadyTimedOut(true)
        setPageMessage('地图底图加载较慢，正在继续展开佛境沙盘')
        recordStartupStage('slow', 'visual-ready-timeout')
        perfRecorder.recordMapVisualEvent({
          type: 'mapReadyTimedOut',
          reason: 'visual-ready-timeout'
        })
        perfRecorder.recordMapVisualEvent({
          type: 'mapSlow',
          reason: 'visual-ready-timeout'
        })
      }, MAP_3D_GUIDE_SLOW_READY_MS)

      try {
        const TMap = await loadTMap()
        perfRecorder.recordMapVisualEvent({
          type: 'tmapScriptLoaded',
          reason: 'loadTMap'
        })
        recordStartupStage('creatingMap', 'tmap-loaded')

        if (cancelled || !mapElementRef.current) {
          return
        }

        mapCreatedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const inkExportCamera = isInkCleanMode
          ? getConfiguredInkBoundsCamera(mapElementRef.current, { squareViewport: inkUseSquareExportCamera })
          : null
        const exportMapCenter = inkExportCamera?.center ?? routeCenter
        const map = new TMap.Map(mapElementRef.current, {
          center: new TMap.LatLng(exportMapCenter.lat, exportMapCenter.lng),
          zoom: inkExportCamera?.zoom ?? MAP_3D_GUIDE_INITIAL_ZOOM,
          minZoom: mapMinZoom,
          maxZoom: mapMaxZoom,
          pitch: isInkCleanMode ? 0 : MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.pitch,
          rotation: isInkCleanMode ? 0 : MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate.rotation,
          mapStyleId: MAP_3D_GUIDE_STYLE_ID,
          baseMap: isInkCleanMode ? MAP_3D_GUIDE_EXPORT_BASE_MAP : MAP_3D_GUIDE_BASE_MAP,
          renderOptions: MAP_3D_GUIDE_RENDER_OPTIONS
        })
        mapRef.current = map
        layerManager.init(map)
        glbSpatialController.init(map)
        glbMemoryManager.init(map)
        sceneWindowManager.init()
        const nativeSkyResult = applyLingshanNativeSkyOptions(map)
        setIsMapCreated(true)
        perfRecorder.recordMapVisualEvent({
          type: 'mapCreated'
        })
        perfRecorder.recordMapVisualEvent({
          type: 'nativeSkyConfigured',
          nativeSkyEnabled: true,
          nativeSkyApplied: nativeSkyResult.skyApplied,
          nativeFogApplied: nativeSkyResult.fogApplied,
          nativeSkyColor: LINGSHAN_NATIVE_SKY_OPTIONS.color,
          nativeFogColor: LINGSHAN_NATIVE_FOG_OPTIONS.color,
          skyOptionsAnimated: LINGSHAN_NATIVE_SKY_OPTIONS.animated,
          reason: nativeSkyResult.error ?? 'constructor-render-options'
        })
        perfRecorder.recordMapVisualEvent({
          type: 'initialCameraApplied',
          reason: 'constructor-camera'
        })
        recordStartupStage('waitingBaseMap', 'map-created')
        setMapStyleSupport(inspectMapStyleSupport(map, TMap))
        setMapStatus('ready')
        setPageMessage('正在展开佛境沙盘底图...')
        perfRecorder.markStageEnd('mapInit')

        const visualReadyEventNames = ['idle', 'tilesloaded', 'rendercomplete']
        visualReadyEventNames.forEach((eventName) => {
          const handler = () => scheduleMapVisualReady(eventName)
          map.on?.(eventName, handler)
          mapVisualEventCleanups.push(() => map.off?.(eventName, handler))
        })
        visualReadyFallbackTimer = window.setTimeout(() => {
          scheduleMapVisualReady('fallback-localhost-ready-delay')
        }, MAP_3D_GUIDE_FALLBACK_BASEMAP_READY_MS)

        const mapElement = mapElementRef.current

        if (mapElement) {
          const handleWheel = () => startMapInteractionLiteMode('zoom')
          const handlePointerDown = () => startMapInteractionLiteMode('drag')
          const handleTouchStart = () => startMapInteractionLiteMode('move')
          const handlePointerUp = () => scheduleMapInteractionLiteExit('drag', 'pointerup')
          const handleTouchEnd = () => scheduleMapInteractionLiteExit('move', 'touchend')

          mapElement.addEventListener('wheel', handleWheel, { passive: true })
          mapElement.addEventListener('pointerdown', handlePointerDown, { passive: true })
          mapElement.addEventListener('touchstart', handleTouchStart, { passive: true })
          window.addEventListener('pointerup', handlePointerUp)
          window.addEventListener('touchend', handleTouchEnd)
          mapInteractionEventCleanups.push(() => {
            mapElement.removeEventListener('wheel', handleWheel)
            mapElement.removeEventListener('pointerdown', handlePointerDown)
            mapElement.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('pointerup', handlePointerUp)
            window.removeEventListener('touchend', handleTouchEnd)
          })
        }

        const interactionEndEventNames = ['zoomend', 'dragend', 'moveend', 'idle']
        interactionEndEventNames.forEach((eventName) => {
          const handler = () => {
            updateCurrentMapZoomSnapshot()
            scheduleMapInteractionLiteExit(eventName === 'zoomend' ? 'zoom' : eventName === 'dragend' ? 'drag' : 'move', eventName)
            clampScenicCameraBounds(eventName)
          }
          map.on?.(eventName, handler)
          mapInteractionEventCleanups.push(() => map.off?.(eventName, handler))
        })
      } catch (error) {
        perfRecorder.markStageEnd('mapInit')
        setMapStatus('error')
        if (visualTimeoutTimer !== null) {
          window.clearTimeout(visualTimeoutTimer)
          visualTimeoutTimer = null
        }
        setMapReadyTimedOut(true)
        setIsMapVisualReady(false)
        setLoadingCurtainVisible(true)
        recordStartupStage('failed', 'map-load-error')
        setPageMessage(error instanceof Error ? error.message : '腾讯地图加载失败')
        perfRecorder.recordMapVisualEvent({
          type: 'mapReadyTimedOut',
          reason: 'map-load-error'
        })
        perfRecorder.recordMapVisualEvent({
          type: 'mapFailed',
          reason: 'map-load-error'
        })
      }
    }

    void initMap()

    return () => {
      cancelled = true
      if (visualReadyTimer !== null) {
        window.clearTimeout(visualReadyTimer)
      }
      if (visualReadyFallbackTimer !== null) {
        window.clearTimeout(visualReadyFallbackTimer)
      }
      if (visualTimeoutTimer !== null) {
        window.clearTimeout(visualTimeoutTimer)
      }
      if (curtainHideTimer !== null) {
        window.clearTimeout(curtainHideTimer)
      }
      visualReadyRafIds.forEach((id) => window.cancelAnimationFrame(id))
      mapVisualEventCleanups.forEach((cleanup) => cleanup())
      mapInteractionEventCleanups.forEach((cleanup) => cleanup())
      if (mapInteractionRef.current.exitTimerId !== undefined) {
        window.clearTimeout(mapInteractionRef.current.exitTimerId)
        mapInteractionRef.current.exitTimerId = undefined
      }
      routeLayerRef.current?.setMap?.(null)
      tourRouteProgressLayerRef.current?.setMap?.(null)
      poiMarkerLayerRef.current?.setMap?.(null)
      userMarkerLayerRef.current?.setMap?.(null)
      rerouteLayerRef.current?.setMap?.(null)
      landmarkHighlightLayerRef.current?.setMap?.(null)
      decorMarkerLayerRef.current?.setMap?.(null)
      forestPatchLayerRef.current?.setMap?.(null)
      formalInkBoundsMarkerLayerRef.current?.setMap?.(null)
      formalInkBoundsBoundaryLayerRef.current?.setMap?.(null)
      formalInkBoundsFillLayerRef.current?.setMap?.(null)
      inkBoundsMarkerLayerRef.current?.setMap?.(null)
      inkBoundsBoundaryLayerRef.current?.setMap?.(null)
      gardenEditorPolygonLayerRef.current?.setMap?.(null)
      gardenEditorVertexLayerRef.current?.setMap?.(null)
      gardenPreviewMarkerLayerRef.current?.setMap?.(null)
      clearGltfModels(gltfModelRefs.current)
      gltfModelRefs.current = new Map()
      sceneWindowManager.destroy()
      glbMemoryManager.destroy()
      glbSpatialController.destroy()
      layerManager.destroy()
      stopBuddhaRealmTour(tourPlaybackRef, 'unmount')
      mapRef.current?.destroy?.()
      mapRef.current = null
    }
  }, [glbMemoryManager, glbSpatialController, inkUseSquareExportCamera, isInkCleanMode, layerManager, mapMaxZoom, mapMinZoom, perfRecorder, sceneWindowManager, shouldRedirectLocalTMapHost])

  useEffect(() => {
    if (mapStatus !== 'ready' || entryCameraPlayedRef.current || debugGarden || isInkCleanMode) {
      return
    }

    entryCameraPlayedRef.current = true
    setActiveCameraMode('overviewEstate')
    moveMapCamera(currentRouteCenter, MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate)
  }, [currentRouteCenter, debugGarden, isInkCleanMode, mapStatus])

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
    if (mapStatus !== 'ready' || !mapRef.current) {
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

    mapRef.current.on?.('click', handleManualMapClick)

    return () => {
      mapRef.current?.off?.('click', handleManualMapClick)
    }
  }, [debugInkBounds, mapStatus])

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
      const layer = inkTileLayerRef.current

      if (!layer) {
        return
      }

      try {
        layer.setMap?.(null)
      } catch {
        // Some Tencent layer versions only expose map.removeLayer/destroy.
      }

      try {
        mapRef.current?.removeLayer?.(layer)
      } catch {
        // Optional cleanup path.
      }

      try {
        layer.destroy?.()
      } catch {
        // Optional cleanup path.
      }

      inkTileLayerRef.current = null
      tencentCustomLayerInitKeyRef.current = ''
      layerManager.removeLayer('custom_tile')
      layerManager.removeLayer('custom_tile_fallback')
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

    if (!mapVisualReadyForOverlays || !mapRef.current || !window.TMap) {
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

        try {
          layer.setMap?.(null)
        } catch {
          // Optional cleanup path.
        }

        try {
          mapRef.current?.removeLayer?.(layer)
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
          if (disposed) {
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

          inkTileLayerRef.current = layer
          tencentCustomLayerInitKeyRef.current = customLayerInitKey
          layerManager.registerLayer('custom_tile', layer)

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
          map: mapRef.current,
          ...TENCENT_CUSTOM_LAYER_CONFIG
        })

        if (maybeLayer && typeof maybeLayer.then === 'function') {
          maybeLayer.then(attachHostedLayer).catch((error: unknown) => {
            if (disposed) {
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
      const allowSingleImageFallback = shouldAllowInkTileSingleImageFallback(mapRef.current)
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
        map: mapRef.current,
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

      inkTileLayerRef.current = layer
      layerManager.registerLayer('custom_tile_fallback', layer)

      try {
        layer.setOpacity?.(getInkTileEffectiveOpacity(inkTileOpacity, currentZoomRef.current))
      } catch {
        // Optional opacity API; constructor opacity covers the common path.
      }

      try {
        if (typeof layer.setMap === 'function') {
          layer.setMap(mapRef.current)
        } else {
          mapRef.current?.addLayer?.(layer)
        }
      } catch {
        mapRef.current?.addLayer?.(layer)
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

        const allowSingleImageFallback = shouldAllowInkTileSingleImageFallback(mapRef.current)
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
      setInkTileDomFallbackActive(shouldAllowInkTileSingleImageFallback(mapRef.current))
      recordInkTileEvent({
        inkTilesEnabled: true,
        inkTileLayerReady: false,
        inkTileLayerError: error instanceof Error ? error.message : '本地水墨瓦片图层创建失败',
        mapBoundaryEnabled: false
      })
    }

    return cleanupLayer
  }, [inkTilesEnabled, layerManager, mapVisualReadyForOverlays, noInkTilesOverride, perfRecorder])

  useEffect(() => {
    if (!inkTilesEnabled) {
      setInkTileOpacityEffective(getInkTileEffectiveOpacity(inkTileOpacity, currentZoomRef.current))
      return
    }

    let rafId = 0
    const updateOpacity = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        const zoom = readMapZoomForProjection(mapRef.current) ?? currentZoomRef.current
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
    mapEvents.forEach((eventName) => mapRef.current?.on?.(eventName, updateOpacity))

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      mapEvents.forEach((eventName) => mapRef.current?.off?.(eventName, updateOpacity))
    }
  }, [inkTileOpacity, inkTilesEnabled, mapVisualReadyForOverlays])

  useEffect(() => {
    if (!mapVisualReadyForOverlays || !mapRef.current) {
      return
    }

    let rafId = 0
    const updateSnapshot = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        const center = readMapCenterForProjection(mapRef.current) ?? routeCenter
        const zoom = readMapZoomForProjection(mapRef.current) ?? currentZoomRef.current

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

    const mapEvents = ['idle', 'dragend', 'moveend', 'zoomend']
    mapEvents.forEach((eventName) => mapRef.current?.on?.(eventName, updateSnapshot))
    updateSnapshot()

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      mapEvents.forEach((eventName) => mapRef.current?.off?.(eventName, updateSnapshot))
    }
  }, [mapVisualReadyForOverlays])

  useEffect(() => {
    if (!mapBoundsEnabled || !mapVisualReadyForOverlays || !mapRef.current) {
      return
    }

    let rafId = 0
    const scheduleCorrection = (reason: string) => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => clampScenicCameraBounds(reason))
    }

    const handlers = ['idle', 'dragend', 'moveend', 'zoomend'].map((eventName) => {
      const handler = () => scheduleCorrection(eventName)
      mapRef.current?.on?.(eventName, handler)
      return { eventName, handler }
    })
    scheduleCorrection('map-bounds-ready')

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      handlers.forEach(({ eventName, handler }) => mapRef.current?.off?.(eventName, handler))
    }
  }, [mapBoundsEnabled, mapVisualReadyForOverlays])

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
    if (!debugGarden || visualVariant.id !== 'prototype-c' || !gardenEditorUsesStoredDraft) {
      return
    }

    window.localStorage.setItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY, JSON.stringify(gardenAssets))
  }, [debugGarden, gardenAssets, gardenEditorUsesStoredDraft, visualVariant.id])

  useEffect(() => {
    if (!debugGarden || visualVariant.id !== 'prototype-c' || !gardenEditorUsesStoredDraft) {
      return
    }

    window.localStorage.setItem(MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY, JSON.stringify(gardenEditorState))
  }, [debugGarden, gardenEditorState, gardenEditorUsesStoredDraft, visualVariant.id])

  useEffect(() => {
    if (!debugGarden || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(TREE_CANDIDATE_LAB_STORAGE_KEY, JSON.stringify(treeCandidateLabState))
  }, [debugGarden, treeCandidateLabState])

  useEffect(() => {
    if (isInkCleanMode || !debugGarden || !mapVisualReadyForOverlays || treeCandidateLabState.landmarkReferenceLoaded) {
      return
    }

    loadCoreLandmarkReferences()
  }, [debugGarden, isInkCleanMode, mapVisualReadyForOverlays, treeCandidateLabState.landmarkReferenceLoaded])

  useEffect(() => {
    if (!debugGarden) {
      return
    }

    perfRecorder.recordMapVisualEvent({
      type: 'treeCandidateLabEnabled',
      defaultGardenHidden: treeCandidateLabState.defaultGardenHidden,
      landmarkReferenceLoaded: treeCandidateLabState.landmarkReferenceLoaded,
      testTreeCount: treeCandidateLabState.testTrees.length,
      candidateType: treeCandidateLabState.selectedCandidateType,
      clusterMode: treeCandidateLabState.clusterMode,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      liveDefaultGardenOverlayCount,
      liveTestTreeOverlayCount,
      defaultGardenAssetCount: gardenAssets.length
    })
  }, [
    debugGarden,
    gardenAssets.length,
    liveDefaultGardenOverlayCount,
    liveTestTreeOverlayCount,
    perfRecorder,
    treeCandidateLabState.clusterMode,
    treeCandidateLabState.defaultGardenHidden,
    treeCandidateLabState.landmarkReferenceLoaded,
    treeCandidateLabState.selectedCandidateType,
    treeCandidateLabState.testTrees.length
  ])

  useEffect(() => {
    if (isInkCleanMode || !debugGarden || visualVariant.id !== 'prototype-c' || !mapVisualReadyForOverlays || !mapRef.current) {
      return
    }

    const handleMapClick = (event: any) => {
      const point = extractMapEventLatLng(event)

      if (!point) {
        return
      }

      if (gardenEditorMode === 'drawVegetation') {
        setGardenDraftPolygon((current) => ({
          mode: 'vegetation',
          vertices: [...(current?.mode === 'vegetation' ? current.vertices : []), point]
        }))
        setGardenCopyStatus('已添加 vegetation zone 顶点')
        return
      }

      if (gardenEditorMode === 'drawKeepout') {
        setGardenDraftPolygon((current) => ({
          mode: 'keepout',
          vertices: [...(current?.mode === 'keepout' ? current.vertices : []), point]
        }))
        setGardenCopyStatus('已添加 keepout zone 顶点')
        return
      }

      if (gardenEditorMode === 'addAsset') {
        const asset = createSingleEditorAsset(point, editorAddAssetKind, gardenEditorState.previewAssets.length)
        setGardenEditorState((current) => ({
          ...current,
          previewAssets: [...current.previewAssets, asset]
        }))
        setSelectedGardenId('')
        setGardenCopyStatus(`已添加单个资产：${asset.name}`)
        return
      }

      if (treeCandidateLabClickMode === 'addCluster') {
        addTreeCandidateCluster(point)
        return
      }

      if (treeCandidateLabClickMode === 'compareSet') {
        addTreeCandidateCompareSet(point)
      }
    }

    const handleMapDoubleClick = (event: any) => {
      if (gardenEditorMode !== 'drawVegetation' && gardenEditorMode !== 'drawKeepout') {
        return
      }

      event?.preventDefault?.()
      completeDraftGardenPolygon(extractMapEventLatLng(event))
    }

    mapRef.current.on?.('click', handleMapClick)
    mapRef.current.on?.('dblclick', handleMapDoubleClick)

    return () => {
      mapRef.current?.off?.('click', handleMapClick)
      mapRef.current?.off?.('dblclick', handleMapDoubleClick)
    }
  }, [
    addTreeCandidateCluster,
    addTreeCandidateCompareSet,
    completeDraftGardenPolygon,
    debugGarden,
    isInkCleanMode,
    editorAddAssetKind,
    gardenEditorMode,
    gardenEditorState.previewAssets.length,
    mapVisualReadyForOverlays,
    treeCandidateLabClickMode,
    visualVariant.id
  ])

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
    if (isInkCleanMode) {
      routeLayerRef.current?.setMap?.(null)
      layerManager.removeLayer('route')
      routeLayerRef.current = null
      return
    }

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      return
    }

    perfRecorder.markStageStart('routeDraw')
    routeLayerRef.current?.setMap?.(null)
    layerManager.removeLayer('route')
    // Route layers must stay above optional ink map tile layers.
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
    layerManager.registerLayer('route', routeLayerRef.current)
    perfRecorder.markStageEnd('routeDraw')

    return () => {
      routeLayerRef.current?.setMap?.(null)
      layerManager.removeLayer('route')
      routeLayerRef.current = null
    }
  }, [
    currentRouteId,
    currentRoutePath,
    isInkCleanMode,
    layerManager,
    mapVisualReadyForOverlays,
    nextStop.nextStopId,
    perfRecorder,
    routePathIndex,
    selectedStopId,
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
    const completedPath = currentRoutePath.slice(0, Math.min(currentRoutePath.length, routePathIndex + 1))
    const activePath = getActiveRoutePath(selectedStopId, nextStop.nextStopId)
    const showStandardProgress = tourMode !== 'buddhaRealmTour'
    const routeGeometryIdPrefix = `${currentRouteId}-route`
    const geometries = [
        {
          id: `${routeGeometryIdPrefix}-shadow`,
          styleId: 'routeShadow',
          paths: currentRoutePath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-aura`,
          styleId: 'routeAura',
          paths: currentRoutePath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-glow`,
          styleId: 'routeGlow',
          paths: currentRoutePath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-main`,
          styleId: 'mainRoute',
          paths: currentRoutePath.map(toTMapLatLng)
        },
        {
          id: `${routeGeometryIdPrefix}-core`,
          styleId: 'routeCore',
          paths: currentRoutePath.map(toTMapLatLng)
        }
      ]

    if (showStandardProgress && completedPath.length > 1) {
      geometries.push({
        id: `${routeGeometryIdPrefix}-completed`,
        styleId: 'completedRoute',
        paths: completedPath.map(toTMapLatLng)
      })
    }

    if (showStandardProgress && activePath.length > 1) {
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

    if (!options.force && now - buddhaTourRouteProgressRef.current.lastRenderedAt < 34) {
      buddhaTourRouteProgressRef.current.latestProgress = progress
      return
    }

    const split = splitRouteByProgress(currentRoutePath, progress, currentRouteCumulativeDistances)
    renderTourRouteProgressOverlay(split)
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
        traveledPointCount: split.traveledPath.length,
        remainingPointCount: split.remainingPath.length,
        currentLat: split.currentPoint.lat,
        currentLng: split.currentPoint.lng,
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

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
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
    forestPatchLayerRef.current?.setMap?.(null)
    forestPatchLayerRef.current = null

    if (isInkCleanMode || visualVariant.id !== 'prototype-c' || !debugGarden || !forestPatchesVisible) {
      setGardenPatchReport({
        patchCount: 0,
        patchFallback: false
      })
      return
    }

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      return
    }

    const visiblePatches = lingshanMap3DForestPatches.filter((patch) => patch.visible)

    try {
      if (window.TMap.MultiPolygon && window.TMap.PolygonStyle) {
        forestPatchLayerRef.current = new window.TMap.MultiPolygon({
          map: mapRef.current,
          styles: Object.fromEntries(
            visiblePatches.map((patch) => [
              patch.id,
              new window.TMap.PolygonStyle({
                color: colorWithOpacity(patch.color, getForestPatchOpacity(patch, {
                  debugGarden,
                  routeProgressRatio,
                  rerouteActive: rerouteStatus === 'planning' || rerouteStatus === 'ready' || rerouteStatus === 'off_route'
                })),
                showBorder: false
              })
            ])
          ),
          geometries: visiblePatches.map((patch) => ({
            id: patch.id,
            styleId: patch.id,
            paths: buildForestPatchPath(patch),
            rank: 1
          }))
        })
        setGardenPatchReport({
          patchCount: visiblePatches.length,
          patchFallback: false
        })
        return () => {
          forestPatchLayerRef.current?.setMap?.(null)
          forestPatchLayerRef.current = null
        }
      }

      forestPatchLayerRef.current = new window.TMap.MultiMarker({
        map: mapRef.current,
        styles: Object.fromEntries(
          visiblePatches.map((patch) => {
            const opacity = getForestPatchOpacity(patch, {
              debugGarden,
              routeProgressRatio,
              rerouteActive: rerouteStatus === 'planning' || rerouteStatus === 'ready' || rerouteStatus === 'off_route'
            })
            const width = Math.max(80, Math.round(patch.radiusX * 1.15))
            const height = Math.max(50, Math.round(patch.radiusY * 1.15))
            return [
              patch.id,
              new window.TMap.MarkerStyle({
                width,
                height,
                anchor: { x: width / 2, y: height / 2 },
                src: createSvgDataUrl(forestPatchSvg({
                  color: patch.color,
                  opacity,
                  rotation: patch.rotation,
                  width,
                  height
                }))
              })
            ]
          })
        ),
        geometries: visiblePatches.map((patch) => ({
          id: patch.id,
          styleId: patch.id,
          position: toTMapLatLng(patch.center),
          rank: patch.priority === 'high' ? 3 : patch.priority === 'medium' ? 2 : 1,
          properties: {
            title: patch.name
          }
        }))
      })
      setGardenPatchReport({
        patchCount: visiblePatches.length,
        patchFallback: true
      })
    } catch {
      setGardenPatchReport({
        patchCount: 0,
        patchFallback: true
      })
    }

    return () => {
      forestPatchLayerRef.current?.setMap?.(null)
      forestPatchLayerRef.current = null
    }
  }, [debugGarden, forestPatchesVisible, isInkCleanMode, mapVisualReadyForOverlays, rerouteStatus, routeProgressRatio, visualVariant.id])

  useEffect(() => {
    gardenEditorPolygonLayerRef.current?.setMap?.(null)
    gardenEditorVertexLayerRef.current?.setMap?.(null)
    gardenPreviewMarkerLayerRef.current?.setMap?.(null)
    gardenEditorPolygonLayerRef.current = null
    gardenEditorVertexLayerRef.current = null
    gardenPreviewMarkerLayerRef.current = null

    if (isInkCleanMode || !debugGarden || visualVariant.id !== 'prototype-c' || !mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      return
    }

    const polygonItems = buildGardenEditorPolygonItems(
      gardenEditorState,
      gardenDraftPolygon,
      selectedEditorZoneId,
      selectedKeepoutZoneId
    )

    if (polygonItems.length && window.TMap.MultiPolygon && window.TMap.PolygonStyle) {
      gardenEditorPolygonLayerRef.current = new window.TMap.MultiPolygon({
        map: mapRef.current,
        styles: Object.fromEntries(
          polygonItems.map((item) => [
            item.id,
            new window.TMap.PolygonStyle({
              color: item.fill,
              borderColor: item.border,
              borderWidth: 2,
              showBorder: true,
              ...(item.dashed ? { borderDashArray: [8, 6] } : {})
            })
          ])
        ),
        geometries: polygonItems.map((item) => ({
          id: item.id,
          styleId: item.id,
          paths: item.vertices.map(toTMapLatLng),
          rank: item.type === 'keepout' ? 29 : 28,
          properties: {
            title: item.name
          }
        }))
      })
    }

    const vertices = buildGardenEditorVertexItems(
      gardenEditorState,
      gardenDraftPolygon,
      selectedEditorZoneId,
      selectedKeepoutZoneId
    )
    if (vertices.length) {
      gardenEditorVertexLayerRef.current = new window.TMap.MultiMarker({
        map: mapRef.current,
        enableDragging: true,
        styles: {
          vegetationVertex: new window.TMap.MarkerStyle({
            width: 20,
            height: 20,
            anchor: { x: 10, y: 10 },
            src: createSvgDataUrl(editorVertexSvg('#2f7a4d', '#f9f0cf'))
          }),
          keepoutVertex: new window.TMap.MarkerStyle({
            width: 20,
            height: 20,
            anchor: { x: 10, y: 10 },
            src: createSvgDataUrl(editorVertexSvg('#b45309', '#fff7ed'))
          }),
          draftVertex: new window.TMap.MarkerStyle({
            width: 22,
            height: 22,
            anchor: { x: 11, y: 11 },
            src: createSvgDataUrl(editorVertexSvg('#2563eb', '#eff6ff'))
          })
        },
        geometries: vertices.map((vertex) => ({
          id: vertex.id,
          styleId: vertex.styleId,
          position: toTMapLatLng(vertex.position),
          draggable: true,
          rank: 40,
          properties: {
            title: vertex.id
          }
        }))
      })

      const handleVertexDragEnd = (event: any) => {
        const id = event?.geometry?.id ?? event?.geometry?.properties?.title ?? event?.id
        const point = extractMapEventLatLng(event)
        if (!id || !point) {
          return
        }
        updateGardenEditorVertex(String(id), point)
      }
      gardenEditorVertexLayerRef.current.on?.('dragend', handleVertexDragEnd)
      gardenEditorVertexLayerRef.current.on?.('click', (event: any) => {
        const id = event?.geometry?.id ?? event?.geometry?.properties?.title ?? event?.id
        if (id) {
          setSelectedGardenVertexId(String(id))
        }
      })
    }

    const previewAssets = gardenEditorState.previewAssets.filter((asset) => asset.visible)
    if (previewAssets.length) {
      gardenPreviewMarkerLayerRef.current = new window.TMap.MultiMarker({
        map: mapRef.current,
        styles: Object.fromEntries(
          gardenAssetKindOptions.map((kind) => [
            kind,
            new window.TMap.MarkerStyle({
              width: kind.includes('rock') || kind.includes('stone') ? 24 : 28,
              height: kind.includes('rock') || kind.includes('stone') ? 24 : 28,
              anchor: {
                x: kind.includes('rock') || kind.includes('stone') ? 12 : 14,
                y: kind.includes('rock') || kind.includes('stone') ? 12 : 14
              },
              src: createSvgDataUrl(gardenPreviewPointSvg(kind))
            })
          ])
        ),
        geometries: previewAssets.map((asset) => ({
          id: `preview-${asset.id}`,
          styleId: asset.kind,
          position: toTMapLatLng(asset.location),
          rank: 34,
          properties: {
            title: asset.name
          }
        }))
      })
    }

    return () => {
      gardenEditorPolygonLayerRef.current?.setMap?.(null)
      gardenEditorVertexLayerRef.current?.setMap?.(null)
      gardenPreviewMarkerLayerRef.current?.setMap?.(null)
      gardenEditorPolygonLayerRef.current = null
      gardenEditorVertexLayerRef.current = null
      gardenPreviewMarkerLayerRef.current = null
    }
  }, [debugGarden, gardenDraftPolygon, gardenEditorState, isInkCleanMode, mapVisualReadyForOverlays, selectedEditorZoneId, selectedKeepoutZoneId, visualVariant.id])

  useEffect(() => {
    gardenAssetEditMarkerLayerRef.current?.setMap?.(null)
    gardenAssetEditMarkerLayerRef.current = null

    if (
      !debugGarden ||
      isInkCleanMode ||
      visualVariant.id !== 'prototype-c' ||
      !mapVisualReadyForOverlays ||
      !window.TMap ||
      !mapRef.current ||
      !selectedGardenAssetDraft
    ) {
      return
    }

    gardenAssetEditMarkerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      enableDragging: true,
      styles: {
        assetEditVertex: new window.TMap.MarkerStyle({
          width: 26,
          height: 26,
          anchor: { x: 13, y: 13 },
          src: createSvgDataUrl(editorVertexSvg('#7c3aed', '#f5f3ff'))
        })
      },
      geometries: [
        {
          id: `asset:${selectedGardenAssetDraft.id}`,
          styleId: 'assetEditVertex',
          position: toTMapLatLng(selectedGardenAssetDraft.location),
          draggable: true,
          rank: 45,
          properties: {
            title: selectedGardenAssetDraft.name
          }
        }
      ]
    })

    const handleAssetDragEnd = (event: any) => {
      const point = extractMapEventLatLng(event)

      if (!point) {
        return
      }

      updateGardenAssetEditDraft({
        location: {
          lat: roundNumber(point.lat, 6),
          lng: roundNumber(point.lng, 6)
        }
      })
      setGardenCopyStatus('已移动资产编辑点，点击“保存当前资产修改”后写入本地草稿')
    }

    gardenAssetEditMarkerLayerRef.current.on?.('dragend', handleAssetDragEnd)

    return () => {
      gardenAssetEditMarkerLayerRef.current?.setMap?.(null)
      gardenAssetEditMarkerLayerRef.current = null
    }
  }, [debugGarden, isInkCleanMode, mapVisualReadyForOverlays, selectedGardenAssetDraft, visualVariant.id])

  useEffect(() => {
    treeCandidateMarkerLayerRef.current?.setMap?.(null)
    treeCandidateEditMarkerLayerRef.current?.setMap?.(null)
    treeCandidateMarkerLayerRef.current = null
    treeCandidateEditMarkerLayerRef.current = null

    if (
      !debugGarden ||
      isInkCleanMode ||
      visualVariant.id !== 'prototype-c' ||
      !mapVisualReadyForOverlays ||
      !window.TMap ||
      !mapRef.current ||
      !treeCandidateLabState.testTrees.length
    ) {
      return
    }

    const visibleTestTrees = treeCandidateLabState.testTrees.filter((asset) => asset.visible)

    if (visibleTestTrees.length) {
      treeCandidateMarkerLayerRef.current = new window.TMap.MultiMarker({
        map: mapRef.current,
        styles: {
          testTree: new window.TMap.MarkerStyle({
            width: 22,
            height: 22,
            anchor: { x: 11, y: 11 },
            src: createSvgDataUrl(editorVertexSvg('#6f8e73', '#fff7d6'))
          }),
          selectedTestTree: new window.TMap.MarkerStyle({
            width: 26,
            height: 26,
            anchor: { x: 13, y: 13 },
            src: createSvgDataUrl(editorVertexSvg('#d6b46a', '#fff7d6'))
          })
        },
        geometries: visibleTestTrees.map((asset) => ({
          id: asset.id,
          styleId: asset.id === selectedTreeCandidateId ? 'selectedTestTree' : 'testTree',
          position: toTMapLatLng(asset.location),
          rank: asset.id === selectedTreeCandidateId ? 48 : 42,
          properties: {
            title: asset.name
          }
        }))
      })

      treeCandidateMarkerLayerRef.current.on?.('click', (event: any) => {
        event?.stopPropagation?.()
        event?.preventDefault?.()
        const id = event?.geometry?.id ?? event?.geometry?.properties?.title ?? event?.id
        if (id) {
          setSelectedTreeCandidateId(String(id))
          setGardenCopyStatus('已选中测试树，可在基础摆树面板调参数或拖动紫色点')
        }
      })
    }

    if (selectedTreeCandidateAsset) {
      treeCandidateEditMarkerLayerRef.current = new window.TMap.MultiMarker({
        map: mapRef.current,
        enableDragging: true,
        styles: {
          testTreeEdit: new window.TMap.MarkerStyle({
            width: 30,
            height: 30,
            anchor: { x: 15, y: 15 },
            src: createSvgDataUrl(editorVertexSvg('#7c3aed', '#f5f3ff'))
          })
        },
        geometries: [
          {
            id: `tree-candidate:${selectedTreeCandidateAsset.id}`,
            styleId: 'testTreeEdit',
            position: toTMapLatLng(selectedTreeCandidateAsset.location),
            draggable: true,
            rank: 50,
            properties: {
              title: selectedTreeCandidateAsset.name
            }
          }
        ]
      })

      const handleTestTreeDragEnd = (event: any) => {
        const point = extractMapEventLatLng(event)

        if (!point) {
          return
        }

        updateSelectedTreeCandidateAsset({
          location: {
            lat: roundNumber(point.lat, 6),
            lng: roundNumber(point.lng, 6)
          }
        })
        setGardenCopyStatus('已移动选中测试树')
      }

      treeCandidateEditMarkerLayerRef.current.on?.('dragend', handleTestTreeDragEnd)
    }

    return () => {
      treeCandidateMarkerLayerRef.current?.setMap?.(null)
      treeCandidateEditMarkerLayerRef.current?.setMap?.(null)
      treeCandidateMarkerLayerRef.current = null
      treeCandidateEditMarkerLayerRef.current = null
    }
  }, [
    debugGarden,
    isInkCleanMode,
    mapVisualReadyForOverlays,
    selectedTreeCandidateAsset,
    selectedTreeCandidateId,
    treeCandidateLabState.testTrees,
    visualVariant.id
  ])

  useEffect(() => {
    if (isInkCleanMode) {
      poiMarkerLayerRef.current?.setMap?.(null)
      layerManager.removeLayer('poi_route')
      poiMarkerLayerRef.current = null
      return
    }

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
      return
    }

    perfRecorder.markStageStart('poiInit')
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
    layerManager.removeLayer('poi_route')
    poiMarkerLayerRef.current = new window.TMap.MultiMarker({
      map: mapRef.current,
      styles: markerStyles,
      geometries: poiGeometries
    })
    layerManager.registerLayer('poi_route', poiMarkerLayerRef.current)
    perfRecorder.markStageEnd('poiInit')
    if (!mapRoutePoiShownRef.current) {
      mapRoutePoiShownRef.current = true
      perfRecorder.recordMapVisualEvent({
        type: 'routePoiShown',
        reason: 'visual-ready'
      })
    }

    return () => {
      poiMarkerLayerRef.current?.setMap?.(null)
      layerManager.removeLayer('poi_route')
      poiMarkerLayerRef.current = null
    }
  }, [isInkCleanMode, layerManager, mapVisualReadyForOverlays, nextStop.nextStopId, perfRecorder, routeStops, selectedStopIndex, terminalStopId])

  useEffect(() => {
    if (isInkCleanMode) {
      userMarkerLayerRef.current?.setMap?.(null)
      userMarkerLayerRef.current = null
      return
    }

    if (!mapVisualReadyForOverlays || !window.TMap || !mapRef.current) {
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
    clearGltfModels(gltfModelRefs.current)
    gltfModelRefs.current = new Map()
    layerManager.removeLayer('model_default_giant_buddha_beta')

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
      gltfModelRefs.current.set(defaultModelOverlay.poiId, model)
      layerManager.registerLayer('model_default_giant_buddha_beta', model)
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
      clearGltfModels(gltfModelRefs.current)
      gltfModelRefs.current = new Map()
      layerManager.removeLayer('model_default_giant_buddha_beta')
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
    moveMapCamera(getPathCenter(nextRoutePath) ?? nextInitialPosition, MAP_3D_GUIDE_CAMERA_PRESETS.routeOverview)
  }

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

  const applyGuideCamera = (mode: GuideCameraMode) => {
    stopActiveTour('manual')
    const preset = MAP_3D_GUIDE_CAMERA_PRESETS[mode] ?? MAP_3D_GUIDE_CAMERA_PRESETS.overviewEstate
    const target =
      mode === 'overviewEstate'
        ? currentRouteCenter
        : mode === 'axisCruise'
          ? currentAxisCruiseTarget
          : mode === 'routeOverview'
            ? currentRouteCenter
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

    flyMap3DCamera({
      map,
      TMap: window.TMap,
      target: position,
      preset,
      sequenceRef: cameraSequenceRef,
      targetPoiId: options.targetPoiId,
      targetLandmarkId: options.targetLandmarkId,
      twoStage: options.twoStage,
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

    if (!map || !window.TMap || !mapBoundsEnabled) {
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
        setRoutePathIndex(frameRouteIndex)
        setSimulatedPosition(routePoint)
        setSelectedStopIndex(getNearestStopIndex(routePoint, routeStops))
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
        averageFrameMs: frameStats.averageFrameMs ? roundNumber(frameStats.averageFrameMs, 1) : undefined,
        estimatedFps: frameStats.averageFrameMs ? roundNumber(1000 / frameStats.averageFrameMs, 1) : undefined
      })
    }
  }

  function startBuddhaRealmTourPlayback() {
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
    setTourMode('buddhaRealmTour')
    setActiveTourStepId(undefined)
    clearActiveLandmarkHighlight()
    buddhaTourUiFrameRef.current = 0
    buddhaTourProgressBucketRef.current = -1
    buddhaTourFrameStatsRef.current = { lastAt: 0, averageFrameMs: 0 }

    if (timelineTour) {
      startBuddhaRealmTimelineTour({
        map: mapRef.current,
        TMap: window.TMap,
        sequenceRef: cameraSequenceRef,
        playbackRef: tourPlaybackRef,
        durationMs: timelineTour.durationMs,
        pauses: timelineTour.pauses,
        getSpeedMultiplier: (progress) => getBuddhaRealmTimelineSpeed(progress, timelineTour.pauses),
        getFrame: createBuddhaRealmTimelineFrameSampler(timelineTour),
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
            lateralOffsetMeters: BUDDHA_REALM_TOUR_CONFIG.lateralOffsetMeters.cruise
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

  const saveGardenAssetEditDraft = () => {
    if (!selectedGardenAssetDraft) {
      setGardenCopyStatus('请先选择一个资产点')
      return
    }

    const nextAssets = gardenAssets.map((asset) =>
      asset.id === selectedGardenAssetDraft.id ? cloneGardenAsset(selectedGardenAssetDraft) : asset
    )
    const nextEditorState = {
      ...gardenEditorState,
      previewAssets: gardenEditorState.previewAssets.map((asset) =>
        asset.id === selectedGardenAssetDraft.id ? cloneGardenAsset(selectedGardenAssetDraft) : asset
      ),
      appliedAssets: gardenEditorState.appliedAssets.map((asset) =>
        asset.id === selectedGardenAssetDraft.id ? cloneGardenAsset(selectedGardenAssetDraft) : asset
      )
    }

    setGardenAssets(nextAssets)
    setGardenEditorState(nextEditorState)
    setGardenAssetEditDraft(cloneGardenAsset(selectedGardenAssetDraft))
    persistGardenDraft(nextEditorState, nextAssets)
    setGardenCopyStatus(`已保存当前资产修改：${selectedGardenAssetDraft.name}`)
  }

  const deleteSelectedGardenAsset = () => {
    if (!selectedGardenAsset) {
      setGardenCopyStatus('请先选择一个资产点')
      return
    }

    if (!window.confirm(`确认删除资产点“${selectedGardenAsset.name}”？此操作会写入本地草稿。`)) {
      return
    }

    const nextAssets = gardenAssets.filter((asset) => asset.id !== selectedGardenAsset.id)
    const nextEditorState = {
      ...gardenEditorState,
      previewAssets: gardenEditorState.previewAssets.filter((asset) => asset.id !== selectedGardenAsset.id),
      appliedAssets: gardenEditorState.appliedAssets.filter((asset) => asset.id !== selectedGardenAsset.id)
    }

    setGardenAssets(nextAssets)
    setGardenEditorState(nextEditorState)
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    persistGardenDraft(nextEditorState, nextAssets)
    setGardenCopyStatus(`已删除资产点：${selectedGardenAsset.name}`)
  }

  function loadCoreLandmarkReferences() {
    coreLandmarkReferenceIds.forEach((id) => {
      const item = landmarkInspector.items.find((inspectorItem) => inspectorItem.id === id)

      if (item) {
        if (item.status !== 'loaded' && item.status !== 'loading') {
          const modelId = `model_landmark:${id}`
          const decision = sceneArbiter.requestAction({
            type: 'load',
            modelId,
            context: {
              source: 'runtime',
              kind: 'landmark',
              estimatedMemoryMB: 36,
              reason: 'core-reference-load'
            }
          })

          if (decision.allowed) {
            landmarkInspector.loadLandmark(id)
            sceneArbiter.releaseLoad(modelId)
          }
        }

        item.companions.forEach((companion) => {
          if (!companion.enabled || companion.status === 'loaded' || companion.status === 'loading') {
            return
          }

          const companionModelId = `model_landmark_companion:${id}::${companion.id}`
          const companionDecision = sceneArbiter.requestAction({
            type: 'load',
            modelId: companionModelId,
            context: {
              source: 'runtime',
              kind: 'companion',
              estimatedMemoryMB: 2,
              reason: 'core-reference-companion-load'
            }
          })

          if (companionDecision.allowed) {
            landmarkInspector.loadCompanionModel(id, companion.id)
            sceneArbiter.releaseLoad(companionModelId)
          }
        })
      }
    })
    setTreeCandidateLabState((current) => ({
      ...current,
      landmarkReferenceLoaded: true
    }))
    perfRecorder.recordMapVisualEvent({
      type: 'landmarkReferenceLoaded',
      landmarkReferenceLoaded: true,
      testTreeCount: treeCandidateLabState.testTrees.length,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus('已加载核心地标参照层')
  }

  function unloadCoreLandmarkReferences() {
    coreLandmarkReferenceIds.forEach((id) => {
      const item = landmarkInspector.items.find((inspectorItem) => inspectorItem.id === id)

      item?.companions.forEach((companion) => {
        const companionModelId = `model_landmark_companion:${id}::${companion.id}`
        const decision = sceneArbiter.requestAction({
          type: 'dispose',
          modelId: companionModelId,
          context: {
            source: 'window',
            kind: 'companion',
            sceneState: 'disposed',
            memoryState: 'disposed',
            reason: 'core-reference-companion-unload'
          }
        })

        if (decision.allowed) {
          landmarkInspector.unloadCompanionModel(id, companion.id)
        }
      })

      const modelId = `model_landmark:${id}`
      const decision = sceneArbiter.requestAction({
        type: 'dispose',
        modelId,
        context: {
          source: 'window',
          kind: 'landmark',
          sceneState: 'disposed',
          memoryState: 'disposed',
          reason: 'core-reference-unload'
        }
      })

      if (decision.allowed) {
        landmarkInspector.unloadLandmark(id)
      }
    })
    setTreeCandidateLabState((current) => ({
      ...current,
      landmarkReferenceLoaded: false
    }))
    perfRecorder.recordMapVisualEvent({
      type: 'landmarkReferenceLoaded',
      landmarkReferenceLoaded: false,
      testTreeCount: treeCandidateLabState.testTrees.length,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus('已卸载核心地标参照层')
  }

  function updateTreeCandidateLab(patch: Partial<TreeCandidateLabState>) {
    setTreeCandidateLabState((current) => ({
      ...current,
      ...patch,
      params:
        patch.selectedCandidateType || patch.clusterMode
          ? {
              ...getTreeCandidateRecommendedParams(
                patch.selectedCandidateType ?? current.selectedCandidateType,
                patch.clusterMode ?? current.clusterMode
              ),
              randomSeed: current.params.randomSeed
            }
          : current.params
    }))
  }

  function updateTreeCandidateLabParams(patch: Partial<TreeCandidateLabParams>) {
    setTreeCandidateLabState((current) => ({
      ...current,
      params: {
        ...current.params,
        ...patch
      }
    }))
  }

  function setTreeCandidateClusterMode(mode: TreeCandidateClusterMode) {
    setTreeCandidateLabState((current) => ({
      ...current,
      clusterMode: mode,
      params: {
        ...getTreeCandidateRecommendedParams(current.selectedCandidateType, mode),
        randomSeed: current.params.randomSeed
      }
    }))
  }

  function setDefaultGardenHidden(hidden: boolean) {
    setTreeCandidateLabState((current) => ({
      ...current,
      defaultGardenHidden: hidden
    }))
    perfRecorder.recordMapVisualEvent({
      type: 'defaultGardenHidden',
      defaultGardenHidden: hidden,
      testTreeCount: treeCandidateLabState.testTrees.length,
      gardenReferenceMode: hidden ? 'blank-lab' : 'default-garden-visible',
      liveDefaultGardenOverlayCount: hidden ? 0 : gardenAssets.filter((asset) => asset.visible).length,
      liveTestTreeOverlayCount,
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus(hidden ? `已隐藏默认 ${gardenAssets.length} 个树群，进入空白园林试验场` : '已显示默认树群作为参照')
  }

  function setGardenAssetSource(mode: GardenAssetSourceMode) {
    const nextAssets = mode === 'legacy' ? getLegacyMap3DGardenAssets() : getDefaultMap3DGardenAssets()
    setGardenAssetSourceMode(mode)
    setGardenAssets(nextAssets)
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    setGardenFilters(defaultGardenFilters)
    perfRecorder.recordMapVisualEvent({
      type: 'gardenAssetSourceChanged',
      defaultGardenAssetCount: nextAssets.length,
      liveDefaultGardenOverlayCount: treeCandidateLabState.defaultGardenHidden ? 0 : nextAssets.filter((asset) => asset.visible).length,
      testTreeCount: treeCandidateLabState.testTrees.length,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible'
    })
    setGardenCopyStatus(mode === 'legacy' ? `已切换查看 legacy 旧树群 ${nextAssets.length} assets` : `已切换回新手动树群 ${nextAssets.length} assets`)
  }

  function startAddTreeCandidateCluster() {
    setTreeCandidateLabClickMode('addCluster')
    setGardenEditorMode('inspect')
    setGardenDraftPolygon(null)
    setGardenCopyStatus(`点击地图添加 ${treeCandidateClusterLabels[treeCandidateLabState.clusterMode]}：${treeCandidateLabels[treeCandidateLabState.selectedCandidateType]}`)
  }

  function startCompareTreeCandidates() {
    setTreeCandidateLabClickMode('compareSet')
    setGardenEditorMode('inspect')
    setGardenDraftPolygon(null)
    setGardenCopyStatus(`点击地图生成 ${treeCandidateTypesForCompare.length} 种候选对比：${treeCandidateClusterLabels[treeCandidateLabState.clusterMode]}`)
  }

  function addTreeCandidateCluster(center: LatLngPoint) {
    const clusterId = `tree-lab-${treeCandidateLabState.selectedCandidateType}-${Date.now()}`
    const assets = buildTreeCandidateClusterAssets({
      center,
      candidateType: treeCandidateLabState.selectedCandidateType,
      clusterId,
      clusterIndex: treeCandidateLabState.testTrees.length,
      clusterMode: treeCandidateLabState.clusterMode,
      params: treeCandidateLabState.params
    })

    setTreeCandidateLabState((current) => ({
      ...current,
      testTrees: [...current.testTrees, ...assets],
      params: {
        ...current.params,
        randomSeed: current.params.randomSeed + 17
      }
    }))
    setTreeCandidateLabClickMode('addCluster')
    setSelectedTreeCandidateId(assets[0]?.id ?? '')
    perfRecorder.recordMapVisualEvent({
      type: 'manualTreeAdded',
      testTreeCount: treeCandidateLabState.testTrees.length + assets.length,
      candidateType: treeCandidateLabState.selectedCandidateType,
      clusterMode: treeCandidateLabState.clusterMode,
      clusterGeneratedCount: assets.length,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      liveTestTreeOverlayCount: treeCandidateLabState.testTrees.length + assets.length,
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus(`已添加 ${assets.length} 棵测试树：${treeCandidateLabels[treeCandidateLabState.selectedCandidateType]}`)
  }

  function addTreeCandidateCompareSet(center: LatLngPoint) {
    const spacing = getTreeCandidateCompareSpacing(treeCandidateLabState.clusterMode)
    const startOffset = -((treeCandidateTypesForCompare.length - 1) * spacing) / 2
    const assets = treeCandidateTypesForCompare.flatMap((candidateType, index) => {
      const clusterCenter = offsetLatLngMeters(center, startOffset + index * spacing, 0)
      const params = getTreeCandidateRecommendedParams(candidateType, treeCandidateLabState.clusterMode)
      return buildTreeCandidateClusterAssets({
        center: clusterCenter,
        candidateType,
        clusterId: `tree-lab-compare-${candidateType}-${Date.now()}-${index}`,
        clusterIndex: treeCandidateLabState.testTrees.length + index * 100,
        clusterMode: treeCandidateLabState.clusterMode,
        params: {
          ...params,
          randomSeed: treeCandidateLabState.params.randomSeed + index * 101
        }
      })
    })

    setTreeCandidateLabState((current) => ({
      ...current,
      testTrees: [...current.testTrees, ...assets],
      params: {
        ...current.params,
        randomSeed: current.params.randomSeed + 53
      }
    }))
    setTreeCandidateLabClickMode('addCluster')
    perfRecorder.recordMapVisualEvent({
      type: 'treeCandidateCompareSetGenerated',
      testTreeCount: treeCandidateLabState.testTrees.length + assets.length,
      candidateType: treeCandidateLabState.selectedCandidateType,
      clusterMode: treeCandidateLabState.clusterMode,
      clusterGeneratedCount: assets.length,
      compareSetGenerated: true,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      liveTestTreeOverlayCount: treeCandidateLabState.testTrees.length + assets.length,
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus(`已生成 ${treeCandidateTypesForCompare.length} 种候选对比，共 ${assets.length} 棵测试树`)
  }

  function updateSelectedTreeCandidateAsset(patch: Partial<LingshanMap3DGardenAsset>) {
    if (!selectedTreeCandidateId) {
      return
    }

    setTreeCandidateLabState((current) => ({
      ...current,
      testTrees: current.testTrees.map((asset) =>
        asset.id === selectedTreeCandidateId
          ? {
              ...asset,
              ...patch,
              location: patch.location ? { ...patch.location } : asset.location
            }
          : asset
      )
    }))
  }

  function clearTreeCandidateTestTrees() {
    if (treeCandidateLabState.testTrees.length && !window.confirm('确认清空全部测试树？')) {
      return
    }

    setTreeCandidateLabState((current) => ({
      ...current,
      testTrees: []
    }))
    setSelectedTreeCandidateId('')
    perfRecorder.recordMapVisualEvent({
      type: 'testTreeCleared',
      testTreeCount: 0,
      candidateType: treeCandidateLabState.selectedCandidateType,
      clusterMode: treeCandidateLabState.clusterMode,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      liveTestTreeOverlayCount: 0,
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus('已清空测试树')
  }

  function deleteSelectedTreeCandidate() {
    if (!selectedTreeCandidateId) {
      setGardenCopyStatus('请先选择一个测试树')
      return
    }

    const selectedAsset = treeCandidateLabState.testTrees.find((asset) => asset.id === selectedTreeCandidateId)
    if (!selectedAsset || !window.confirm(`确认删除测试树“${selectedAsset.name}”？`)) {
      return
    }

    setTreeCandidateLabState((current) => ({
      ...current,
      testTrees: current.testTrees.filter((asset) => asset.id !== selectedTreeCandidateId)
    }))
    setSelectedTreeCandidateId('')
    perfRecorder.recordMapVisualEvent({
      type: 'testTreeDeleted',
      testTreeCount: Math.max(0, treeCandidateLabState.testTrees.length - 1),
      candidateType: selectedAsset.kind,
      clusterMode: parseTreeCandidateNote(selectedAsset.note).clusterMode,
      clusterGeneratedCount: 1,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      liveTestTreeOverlayCount: Math.max(0, treeCandidateLabState.testTrees.length - 1),
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus('已删除选中测试树')
  }

  function deleteSelectedTreeCandidateCluster() {
    if (!selectedTreeCandidateId) {
      setGardenCopyStatus('请先选择一个测试树')
      return
    }

    const selectedAsset = treeCandidateLabState.testTrees.find((asset) => asset.id === selectedTreeCandidateId)
    const clusterId = parseTreeCandidateNote(selectedAsset?.note).clusterId

    if (!selectedAsset || !clusterId) {
      deleteSelectedTreeCandidate()
      return
    }

    const clusterAssets = treeCandidateLabState.testTrees.filter((asset) => parseTreeCandidateNote(asset.note).clusterId === clusterId)

    if (!window.confirm(`确认删除测试树团“${clusterId}”？共 ${clusterAssets.length} 棵。`)) {
      return
    }

    setTreeCandidateLabState((current) => ({
      ...current,
      testTrees: current.testTrees.filter((asset) => parseTreeCandidateNote(asset.note).clusterId !== clusterId)
    }))
    setSelectedTreeCandidateId('')
    perfRecorder.recordMapVisualEvent({
      type: 'testTreeDeleted',
      testTreeCount: Math.max(0, treeCandidateLabState.testTrees.length - clusterAssets.length),
      candidateType: selectedAsset.kind,
      clusterMode: parseTreeCandidateNote(selectedAsset.note).clusterMode,
      clusterGeneratedCount: clusterAssets.length,
      gardenReferenceMode: treeCandidateLabState.defaultGardenHidden ? 'blank-lab' : 'default-garden-visible',
      liveTestTreeOverlayCount: Math.max(0, treeCandidateLabState.testTrees.length - clusterAssets.length),
      defaultGardenAssetCount: gardenAssets.length
    })
    setGardenCopyStatus(`已删除测试树团：${clusterAssets.length} 棵`)
  }

  async function copyTreeCandidateAssets() {
    const exported = treeCandidateLabState.testTrees.map((asset) => ({
      id: asset.id,
      type: 'gardenAsset',
      assetUrl: asset.assetUrl,
      modelUrl: asset.assetUrl,
      lng: asset.location.lng,
      lat: asset.location.lat,
      scale: asset.scale,
      height: asset.height,
      rotationY: asset.yaw,
      source: 'treeCandidateLab',
      clusterId: parseTreeCandidateNote(asset.note).clusterId,
      clusterMode: parseTreeCandidateNote(asset.note).clusterMode,
      candidateType: asset.kind
    }))
    const ok = await copyText(JSON.stringify(exported, null, 2))
    setGardenCopyStatus(ok ? `已复制 ${exported.length} 个测试树 assets` : '复制失败，请查看浏览器权限')
  }

  function saveTreeCandidateDraft() {
    window.localStorage.setItem(TREE_CANDIDATE_LAB_STORAGE_KEY, JSON.stringify(treeCandidateLabState))
    setGardenCopyStatus('已保存 Tree Candidate Lab 草稿')
  }

  function clearTreeCandidateDraft() {
    if (!window.confirm('确认清空 Tree Candidate Lab 草稿和测试树？')) {
      return
    }

    window.localStorage.removeItem(TREE_CANDIDATE_LAB_STORAGE_KEY)
    setTreeCandidateLabState(buildDefaultTreeCandidateLabState())
    setTreeCandidateLabClickMode('addCluster')
    setSelectedTreeCandidateId('')
    setGardenCopyStatus('已清空 Tree Candidate Lab 草稿')
  }

  const deleteSelectedEditorZone = () => {
    if (!selectedEditorZone) {
      setGardenCopyStatus('请先选择一个 vegetation zone')
      return
    }

    if (!window.confirm(`确认删除放树区“${selectedEditorZone.name}”？`)) {
      return
    }

    setGardenEditorState((current) => ({
      ...current,
      zones: current.zones.filter((zone) => zone.id !== selectedEditorZone.id)
    }))
    setSelectedEditorZoneId('')
    setSelectedGardenVertexId('')
    setGardenCopyStatus(`已删除 vegetation zone：${selectedEditorZone.name}`)
  }

  const deleteSelectedKeepoutZone = () => {
    if (!selectedKeepoutZone) {
      setGardenCopyStatus('请先选择一个 keepout zone')
      return
    }

    if (!window.confirm(`确认删除禁放区“${selectedKeepoutZone.name}”？`)) {
      return
    }

    setGardenEditorState((current) => ({
      ...current,
      keepouts: current.keepouts.filter((zone) => zone.id !== selectedKeepoutZone.id)
    }))
    setSelectedKeepoutZoneId('')
    setSelectedGardenVertexId('')
    setGardenCopyStatus(`已删除 keepout zone：${selectedKeepoutZone.name}`)
  }

  const updateGardenFilter = (patch: Partial<GardenAssetFilterState>) => {
    setGardenFilters((current) => ({ ...current, ...patch }))
  }

  const updateGardenBatchAdjust = (patch: Partial<GardenBatchAdjustState>) => {
    setGardenBatchAdjust((current) => ({ ...current, ...patch }))
  }

  const updateFilteredGardenAssets = (mapper: (asset: LingshanMap3DGardenAsset) => LingshanMap3DGardenAsset) => {
    const filteredIds = new Set(filteredGardenAssets.map((asset) => asset.id))
    if (!filteredIds.size) {
      setGardenCopyStatus('当前筛选没有资产可调整')
      return
    }

    setGardenAssets((items) => items.map((asset) => (filteredIds.has(asset.id) ? mapper(asset) : asset)))
  }

  const selectFirstFilteredGardenAsset = () => {
    if (!filteredGardenAssets[0]) {
      setGardenCopyStatus('当前筛选没有资产')
      return
    }

    selectGardenAssetForEditing(filteredGardenAssets[0].id)
    setGardenCopyStatus(`已选中筛选结果首项：${filteredGardenAssets[0].name}`)
  }

  const applyFilteredGardenVisibility = (visible: boolean) => {
    updateFilteredGardenAssets((asset) => ({ ...asset, visible }))
    setGardenCopyStatus(visible ? '已显示当前筛选资产' : '已隐藏当前筛选资产')
  }

  const applyFilteredGardenScale = () => {
    updateFilteredGardenAssets((asset) => ({
      ...asset,
      scale: clampNumber(Math.round(asset.scale * gardenBatchAdjust.scaleMultiplier), 1, 2400)
    }))
    setGardenCopyStatus(`已按 ${gardenBatchAdjust.scaleMultiplier} 倍缩放当前筛选资产`)
  }

  const applyFilteredGardenHeight = () => {
    updateFilteredGardenAssets((asset) => ({
      ...asset,
      height: roundNumber(asset.height + gardenBatchAdjust.heightDelta, 2)
    }))
    setGardenCopyStatus(`已调整当前筛选资产 height：${gardenBatchAdjust.heightDelta}`)
  }

  const applyFilteredGardenOpacity = () => {
    updateFilteredGardenAssets((asset) => ({
      ...asset,
      opacity: clampNumber(roundNumber(asset.opacity + gardenBatchAdjust.opacityDelta, 2), 0, 1)
    }))
    setGardenCopyStatus(`已调整当前筛选资产 opacity：${gardenBatchAdjust.opacityDelta}`)
  }

  const applyFilteredGardenOffset = () => {
    updateFilteredGardenAssets((asset) => ({
      ...asset,
      location: {
        lat: roundNumber(asset.location.lat + gardenBatchAdjust.latOffset, 6),
        lng: roundNumber(asset.location.lng + gardenBatchAdjust.lngOffset, 6)
      }
    }))
    setGardenCopyStatus(`已平移当前筛选资产：lat ${gardenBatchAdjust.latOffset}, lng ${gardenBatchAdjust.lngOffset}`)
  }

  const beginVegetationZoneDrawing = () => {
    setGardenEditorMode('drawVegetation')
    setGardenDraftPolygon({ mode: 'vegetation', vertices: [] })
    setSelectedEditorZoneId('')
    setSelectedKeepoutZoneId('')
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    setGardenCopyStatus('开始绘制 vegetation zone：点击地图添加顶点')
  }

  const beginKeepoutZoneDrawing = () => {
    setGardenEditorMode('drawKeepout')
    setGardenDraftPolygon({ mode: 'keepout', vertices: [] })
    setSelectedEditorZoneId('')
    setSelectedKeepoutZoneId('')
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    setGardenCopyStatus('开始绘制 keepout zone：点击地图添加顶点')
  }

  const finishDraftGardenPolygon = () => {
    completeDraftGardenPolygon()
  }

  const cancelDraftGardenPolygon = () => {
    setGardenDraftPolygon(null)
    setGardenEditorMode('inspect')
    setGardenCopyStatus('已取消当前绘制')
  }

  const updateSelectedEditorZone = (patch: Partial<GardenEditorVegetationZone>) => {
    if (!selectedEditorZone) {
      return
    }

    setGardenEditorState((current) => ({
      ...current,
      zones: current.zones.map((zone) => (zone.id === selectedEditorZone.id ? { ...zone, ...patch } : zone))
    }))
  }

  const updateSelectedKeepoutZone = (patch: Partial<GardenEditorKeepoutZone>) => {
    if (!selectedKeepoutZone) {
      return
    }

    setGardenEditorState((current) => ({
      ...current,
      keepouts: current.keepouts.map((zone) => (zone.id === selectedKeepoutZone.id ? { ...zone, ...patch } : zone))
    }))
  }

  const updateGardenEditorVertex = (vertexId: string, point: LatLngPoint) => {
    const match = vertexId.match(/^(zone|keepout|draft):(.+):(\d+)$/)

    if (!match) {
      return
    }

    const [, scope, id, indexValue] = match
    const vertexIndex = Number(indexValue)

    if (!Number.isFinite(vertexIndex)) {
      return
    }

    if (scope === 'draft') {
      setGardenDraftPolygon((current) => {
        if (!current || current.mode !== id) {
          return current
        }

        return {
          ...current,
          vertices: current.vertices.map((vertex, index) => (index === vertexIndex ? point : vertex))
        }
      })
      setSelectedGardenVertexId(vertexId)
      setGardenCopyStatus('已拖拽当前草稿顶点')
      return
    }

    if (scope === 'zone') {
      setGardenEditorState((current) => ({
        ...current,
        zones: current.zones.map((zone) =>
          zone.id === id
            ? {
                ...zone,
                vertices: zone.vertices.map((vertex, index) => (index === vertexIndex ? point : vertex))
              }
            : zone
        )
      }))
      setSelectedEditorZoneId(id)
      setSelectedGardenVertexId(vertexId)
      setGardenCopyStatus('已拖拽 vegetation zone 顶点')
      return
    }

    setGardenEditorState((current) => ({
      ...current,
      keepouts: current.keepouts.map((zone) =>
        zone.id === id
          ? {
              ...zone,
              vertices: zone.vertices.map((vertex, index) => (index === vertexIndex ? point : vertex))
            }
          : zone
      )
    }))
    setSelectedKeepoutZoneId(id)
    setSelectedGardenVertexId(vertexId)
    setGardenCopyStatus('已拖拽 keepout zone 顶点')
  }

  const generateGardenPreviewAssets = () => {
    const previewAssets = generateGardenAssetsFromEditor(gardenEditorState.zones, gardenEditorState.keepouts)
    setGardenEditorState((current) => ({
      ...current,
      previewAssets
    }))
    setGardenCopyStatus(`已生成 ${previewAssets.length} 个半透明预览点`)
  }

  const applyGardenPreviewAsGlb = () => {
    if (!gardenEditorState.previewAssets.length) {
      setGardenCopyStatus('请先在第 3 步生成预览点')
      return
    }

    const generatedAssets = gardenEditorState.previewAssets.map(cloneGardenAsset)

    setGardenEditorState((current) => ({
      ...current,
      previewAssets: generatedAssets,
      appliedAssets: generatedAssets
    }))
    setGardenAssets(generatedAssets)
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    setGardenCopyStatus(`已应用 ${generatedAssets.length} 个 GLB 树群资产`)
  }

  const clearGardenPreviewAssets = () => {
    setGardenEditorState((current) => ({
      ...current,
      previewAssets: []
    }))
    setGardenCopyStatus('已清空预览点')
  }

  const resetGardenEditorState = () => {
    const editorState = buildDefaultGardenEditorState()
    const defaultAssets = getDefaultMap3DGardenAssets()
    setGardenEditorState(editorState)
    setGardenAssets(defaultAssets)
    setGardenDraftPolygon(null)
    setGardenEditorMode('inspect')
    setSelectedEditorZoneId('')
    setSelectedKeepoutZoneId('')
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    clearGardenEditorLocalStorage()
    setGardenEditorUsesStoredDraft(false)
    setGardenCopyStatus('已重置为默认航拍参考布局，并清空本地草稿')
  }

  const clearGardenLocalDraft = () => {
    const editorState = buildDefaultGardenEditorState()
    const defaultAssets = getDefaultMap3DGardenAssets()
    setGardenEditorState(editorState)
    setGardenAssets(defaultAssets)
    setGardenDraftPolygon(null)
    setGardenEditorMode('inspect')
    setSelectedEditorZoneId('')
    setSelectedKeepoutZoneId('')
    setSelectedGardenId('')
    setGardenAssetEditDraft(null)
    clearGardenEditorLocalStorage()
    setGardenEditorUsesStoredDraft(false)
    setGardenCopyStatus('已清空 debugGarden 本地草稿，恢复默认航拍参考布局')
  }

  const saveGardenEditorStateToLocalStorage = () => {
    window.localStorage.setItem(MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY, JSON.stringify(gardenEditorState))
    window.localStorage.setItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY, JSON.stringify(gardenAssets))
    setGardenEditorUsesStoredDraft(true)
    setGardenCopyStatus('已保存 zones、keepouts、preview 和当前 GLB 树群到 localStorage')
  }

  const copyEditorAssetsConfig = async () => {
    const snippet = `export const lingshanMap3DGardenAssets = ${JSON.stringify(gardenAssets, null, 2)} as const\n`
    const ok = await copyText(snippet)
    setGardenCopyStatus(ok ? '已复制，可发给 Codex 固化' : '复制失败，请查看浏览器权限')
  }

  const copyEditorZonesConfig = async () => {
    const snippet = `export const gardenEditorVegetationZones = ${JSON.stringify(gardenEditorState.zones, null, 2)} as const\n`
    const ok = await copyText(snippet)
    setGardenCopyStatus(ok ? '已复制 vegetation zones TS 配置' : '复制失败，请查看浏览器权限')
  }

  const copyEditorKeepoutsConfig = async () => {
    const snippet = `export const gardenEditorKeepoutZones = ${JSON.stringify(gardenEditorState.keepouts, null, 2)} as const\n`
    const ok = await copyText(snippet)
    setGardenCopyStatus(ok ? '已复制 keepout zones TS 配置' : '复制失败，请查看浏览器权限')
  }

  const copyCompleteGardenSourceSnippet = async () => {
    const snippet = [
      `export const lingshanMap3DEditorVegetationZones = ${JSON.stringify(gardenEditorState.zones, null, 2)} as const`,
      `export const lingshanMap3DEditorKeepoutZones = ${JSON.stringify(gardenEditorState.keepouts, null, 2)} as const`,
      `export const lingshanMap3DGardenGenerationParams = ${JSON.stringify(buildGardenGenerationParamsSnapshot(gardenEditorState), null, 2)} as const`,
      `export const lingshanMap3DGardenAssets = ${JSON.stringify(gardenAssets, null, 2)} as const`
    ].join('\n\n')
    const ok = await copyText(snippet)
    setGardenCopyStatus(ok ? '已复制，可发给 Codex 固化' : '复制失败，请查看浏览器权限')
  }

  const copyGardenSummary = async () => {
    const summary = [
      `debugGarden=${debugGarden ? '1' : '0'}`,
      `variant=${visualVariant.id}`,
      `gardenAssetCount=${gardenAssets.length}`,
      `forestPatchCount=${gardenModelReport.patchCount}/${lingshanMap3DForestPatches.length}`,
      `forestPatchFallback=${gardenModelReport.patchFallback ? 'true' : 'false'}`,
      `forestPatchesVisible=${forestPatchesVisible ? 'true' : 'false'}`,
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

  const mobilePanelToggleLabel = mobilePanelsCollapsed ? '展开导览卡片' : '收起导览卡片'
  const mobilePanelSummary = `${currentRouteConfig.name} · ${currentStop?.name ?? '路线中段'} → ${nextStopPoi?.name ?? '路线终点'}`

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
      className={`map-3d-guide-shell ${visualVariant.className} ${debugGarden ? 'map-3d-guide-shell--debug-garden' : ''} ${
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
      }`}
    >
      <div ref={mapElementRef} className="map-3d-guide-map" />
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
      <div className="map-3d-guide-skin" aria-hidden="true" />
      <div className="map-3d-guide-mist" aria-hidden="true" />
      <div className="map-3d-guide-paperedge" aria-hidden="true" />
      <BuddhaRealmAtmosphere
        clearMaskShape={clearMaskState.shape}
        clearMaskSize={clearMaskState.size}
        dynamicMistEnabled={dynamicMistEnabled}
        edgeMistLevel={edgeMistState.level}
        mode={atmosphereMode}
        onDynamicMistStatusChange={setDynamicMistStatus}
        visible={visualVariant.id === 'prototype-c' && !isInkCleanMode}
      />
      <ScenicPoiBillboards
        map={mapRef.current}
        mapReady={visualVariant.id === 'prototype-c' && mapVisualReadyForOverlays && !isInkCleanMode}
        items={scenicPoiBillboards}
        mode={poiBillboardMode}
        activeId={poiBillboardActiveId}
        nextId={poiBillboardNextId}
        suppressInactive={tourPoiSuppressionEnabled}
        layerManager={layerManager}
        onSelectPoi={(id) => {
          const stopIndex = routeStops.findIndex((stop) => stop.spotId === id)
          const poi = lingshanPois.find((item) => item.id === id)

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
                  : '正在继续展开佛境沙盘，底图可见后再显示路线与园林资产'
                : startupStage === 'loadingSdk'
                  ? '加载腾讯地图 SDK'
                  : startupStage === 'creatingMap'
                    ? '创建地图实例与初始视角'
                    : startupStage === 'waitingBaseMap'
                      ? '等待底图瓦片完成首帧渲染'
                      : '加载地图底图与园林资产'}
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
          <p>当前为正北俯视导出模式：已使用正式 V2 水墨边界，并隐藏项目 GLB、869 树群、路线、POI 题签和佛境氛围层。</p>
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
      {prototypeLabel ? <div className="map-3d-guide-prototype-badge">{prototypeLabel}</div> : null}
      {!debugGarden ? (
        <button
          type="button"
          className="map-3d-guide-mobile-panel-toggle"
          onClick={() => setMobilePanelsCollapsed((collapsed) => !collapsed)}
          aria-expanded={!mobilePanelsCollapsed}
        >
          <span>{mobilePanelToggleLabel}</span>
          <small>{mobilePanelSummary}</small>
        </button>
      ) : null}
      {!debugGarden ? (
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
      ) : null}

      {!debugGarden ? (
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
      ) : null}

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
            className={tourMode === 'buddhaRealmTour' ? 'is-active' : ''}
            onClick={startBuddhaRealmTourPlayback}
            disabled={!canUseMapInteractions}
          >
            {tourMode === 'buddhaRealmTour' ? '停止巡游' : '佛境巡游'}
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
        {debugGarden ? (
          <button type="button" className="map-3d-guide-debug-exit" onClick={() => navigate('/map-3d-guide-c')}>
            退出调试 / 返回普通导览页
          </button>
        ) : null}
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
            <dt>巡游状态</dt>
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
          {visualVariant.id === 'prototype-c' ? (
            <div className="map-3d-guide-style-audit">
              <strong>树群 GLB 状态</strong>
              <span>当前原型类型：C</span>
              <span>treeGlbMode：removed</span>
              <span>activeTreeGlbCount：0</span>
              <span>GardenDebugWizard / Tree Candidate Lab：已停用</span>
              <p>树群 GLB 系统已因移动端内存压力移除；当前页面只保留水墨底图、路线、POI、核心地标 GLB 和佛境巡游。</p>
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
            <span>fogOptions：{LINGSHAN_NATIVE_FOG_OPTIONS.color}</span>
            <span>
              skyOptions：{LINGSHAN_NATIVE_SKY_OPTIONS.color} · brightness {LINGSHAN_NATIVE_SKY_OPTIONS.brightness}
            </span>
            <p>
              腾讯地图平台托管自定义图层已默认启用：{TENCENT_CUSTOM_LAYER_NAME}（layerId {TENCENT_CUSTOM_LAYER_ID}）；
              `noInkTiles=1` 可临时回到腾讯原底图。
            </p>
          </div>
        </details>
      </aside>

      {!debugGarden ? (
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
      ) : null}

      {!debugGarden ? (
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
              <em>巡游状态</em>
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
      ) : null}

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

  const path = routePath
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

function createBuddhaRealmTimelineFrameSampler(config: BuddhaRealmTimelineTourConfig) {
  let smoothedBearing: number | undefined

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
            context.isPaused ? 0.032 : lerpNumber(0.082, 0.052, landmarkInfluence)
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
      ? baseLateralOffsetMeters
      : lerpNumber(baseLateralOffsetMeters, Math.max(4, baseLateralOffsetMeters * 0.38), midRouteTighten)
    const sideCenter = offsetLatLngByBearing(sample, smoothedBearing + 90, lateralOffsetMeters)
    const pausePhase = context.pauseElapsedMs / 1000
    const pauseDriftMeters = context.isPaused
      ? Math.sin(pausePhase * 0.78) * BUDDHA_REALM_TOUR_CONFIG.pauseDriftCenterMeters
      : 0
    const cameraCenter = pauseDriftMeters
      ? offsetLatLngByBearing(sideCenter, smoothedBearing + 178 + Math.sin(pausePhase * 0.52) * 16, pauseDriftMeters)
      : sideCenter
    const pauseDriftRotation = context.isPaused
      ? Math.sin(pausePhase * 0.58) * BUDDHA_REALM_TOUR_CONFIG.pauseDriftRotationDeg
      : 0
    const pauseDriftZoom = context.isPaused
      ? Math.sin(Math.min(Math.PI, pausePhase * Math.PI * 0.72)) * BUDDHA_REALM_TOUR_CONFIG.pauseDriftZoom
      : 0
    const pauseDriftPitch = context.isPaused ? Math.sin(pausePhase * 0.64) * 0.18 : 0
    const routeBreathing = Math.sin(progress * Math.PI * 3.4) * 0.035
    const baseZoom = lerpNumber(17.92, 18.32, midRouteTighten)
    const basePitch = lerpNumber(59.2, 62.8, midRouteTighten)

    return {
      t: context.elapsedMs,
      lat: cameraCenter.lat,
      lng: cameraCenter.lng,
      bearing: roundNumber(smoothedBearing, 1),
      zoom: roundNumber(baseZoom + routeBreathing + landmarkInfluence * 0.48 + pauseDriftZoom, 3),
      pitch: roundNumber(basePitch + Math.sin(progress * Math.PI * 2.4) * 0.35 + landmarkInfluence * 4.2 + pauseDriftPitch, 2),
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
  const poi = lingshanPois.find((item) => item.id === overlay.poiId)

  if (!poi) {
    return getRouteStopLocation(overlay.poiId)
  }

  return overlay.positionSource === 'displayLocation'
    ? poi.displayLocation ?? poi.navLocation
    : poi.navLocation ?? poi.displayLocation
}

function getSpatialGardenAssetBaseOpacity(asset: LingshanMap3DGardenAsset, lodState: GardenLodState) {
  const tierOpacity =
    lodState.visibleTier === 'none'
      ? 0.04
      : lodState.visibleTier === 'reduced'
        ? asset.priority === 'low'
          ? 0.08
          : asset.priority === 'medium'
            ? 0.38
            : 0.72
        : 1

  return Number(Math.max(0, Math.min(1, asset.opacity * lodState.opacity * tierOpacity)).toFixed(3))
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

function getInkMapEdgeMistState({
  center,
  disabledReason,
  enabled,
  zoom
}: {
  center: LatLngPoint
  disabledReason: 'none' | 'debugGarden' | 'debugPerfNoMapBounds'
  enabled: boolean
  zoom: number
}): {
  level: 'normal' | 'strong'
  reason: string
  strength: number
  nearInkBoundary: boolean
  distanceToInkBoundary: number
} {
  if (!enabled) {
    return {
      level: 'normal',
      reason: disabledReason === 'none' ? 'disabled' : disabledReason,
      strength: 0,
      nearInkBoundary: false,
      distanceToInkBoundary: 0
    }
  }

  const farZoom = Number.isFinite(zoom) && zoom <= INK_MAP_EDGE_MIST_ZOOM_THRESHOLD
  const bounds = getScaledInkMapBounds(INK_MAP_CENTER_LIMIT_RATIO)
  const latSpan = Math.max(0.000001, bounds.north - bounds.south)
  const lngSpan = Math.max(0.000001, bounds.east - bounds.west)
  const nearestGap = Math.min(
    (bounds.north - center.lat) / latSpan,
    (center.lat - bounds.south) / latSpan,
    (bounds.east - center.lng) / lngSpan,
    (center.lng - bounds.west) / lngSpan
  )
  const latMeters = Math.min(bounds.north - center.lat, center.lat - bounds.south) * 111_320
  const lngMeters =
    Math.min(bounds.east - center.lng, center.lng - bounds.west) *
    111_320 *
    Math.max(0.2, Math.cos((center.lat * Math.PI) / 180))
  const distanceToInkBoundary = Math.round(Math.min(latMeters, lngMeters))
  const nearInkBoundary = nearestGap <= INK_MAP_EDGE_MIST_GAP_RATIO

  if (farZoom || nearInkBoundary) {
    return {
      level: 'strong',
      reason: farZoom && nearInkBoundary ? 'far-zoom+near-edge' : farZoom ? 'far-zoom' : 'near-edge',
      strength: farZoom && nearInkBoundary ? 1 : farZoom ? 0.92 : 0.88,
      nearInkBoundary,
      distanceToInkBoundary
    }
  }

  return {
    level: 'normal',
    reason: 'center-clear',
    strength: 0.68,
    nearInkBoundary,
    distanceToInkBoundary
  }
}

function getBuddhaRealmClearMaskState({
  edgeMistLevel,
  enabled,
  mode,
  tourActive
}: {
  edgeMistLevel: 'normal' | 'strong'
  enabled: boolean
  mode: BuddhaRealmAtmosphereMode
  tourActive: boolean
}): {
  mode: 'disabled' | 'map-center' | 'tour-route' | 'focus-center'
  size: BuddhaRealmClearMaskSize
  center: string
  shape: BuddhaRealmClearMaskShape
} {
  if (!enabled) {
    return {
      mode: 'disabled',
      size: 'wide',
      center: 'camera-center',
      shape: 'round'
    }
  }

  if (tourActive || mode === 'tour') {
    return {
      mode: 'tour-route',
      size: edgeMistLevel === 'strong' ? 'compact' : 'balanced',
      center: 'route-camera-center',
      shape: 'route-ellipse'
    }
  }

  if (mode === 'focus') {
    return {
      mode: 'focus-center',
      size: 'balanced',
      center: 'focused-camera-center',
      shape: 'round'
    }
  }

  return {
    mode: 'map-center',
    size: edgeMistLevel === 'strong' ? 'balanced' : 'wide',
    center: 'map-camera-center',
    shape: 'round'
  }
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
  const center = typeof map?.getCenter === 'function' ? map.getCenter() : undefined

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
  const zoom = typeof map?.getZoom === 'function' ? Number(map.getZoom()) : Number.NaN
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

function applyLingshanNativeSkyOptions(map: any) {
  let skyApplied = false
  let fogApplied = false
  let error: string | undefined

  try {
    if (typeof map?.setSkyOptions === 'function') {
      map.setSkyOptions(LINGSHAN_NATIVE_SKY_OPTIONS)
      skyApplied = true
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  try {
    if (typeof map?.setFogOptions === 'function') {
      map.setFogOptions(LINGSHAN_NATIVE_FOG_OPTIONS)
      fogApplied = true
    }
  } catch (err) {
    error = error ?? (err instanceof Error ? err.message : String(err))
  }

  return {
    skyApplied,
    fogApplied,
    error
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

function clearGltfModels(models: Map<string, any>) {
  models.forEach((model) => clearGltfModel(model))
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

function stashLocalhostTransferDrafts() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const items = MAP_3D_GUIDE_LOCALHOST_TRANSFER_KEYS.reduce<Record<string, string>>((drafts, key) => {
      const value = window.localStorage.getItem(key)
      if (value) {
        drafts[key] = value
      }
      return drafts
    }, {})

    if (!Object.keys(items).length) {
      return
    }

    window.name = `${MAP_3D_GUIDE_LOCALHOST_TRANSFER_PREFIX}${JSON.stringify({
      fromHost: window.location.host,
      transferredAt: new Date().toISOString(),
      items
    })}`
  } catch {
    // Redirect should still proceed; losing a local debug draft is better than blocking the map.
  }
}

function restoreLocalhostTransferDrafts() {
  if (typeof window === 'undefined' || window.location.hostname !== MAP_3D_GUIDE_LOCAL_TMAP_CANONICAL_HOST) {
    return
  }

  if (!window.name.startsWith(MAP_3D_GUIDE_LOCALHOST_TRANSFER_PREFIX)) {
    return
  }

  try {
    const payload = JSON.parse(window.name.slice(MAP_3D_GUIDE_LOCALHOST_TRANSFER_PREFIX.length)) as {
      items?: Record<string, string>
    }
    Object.entries(payload.items ?? {}).forEach(([key, value]) => {
      if (MAP_3D_GUIDE_LOCALHOST_TRANSFER_KEYS.includes(key as (typeof MAP_3D_GUIDE_LOCALHOST_TRANSFER_KEYS)[number])) {
        window.localStorage.setItem(key, value)
      }
    })
  } catch {
    // Ignore malformed transfer payloads; the page can fall back to default debugGarden state.
  } finally {
    window.name = ''
  }
}

function loadStoredGardenAssets(variant: Map3DGuideVariant = 'default') {
  restoreLocalhostTransferDrafts()
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

function hasStoredGardenEditorDraft() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return Boolean(
      window.localStorage.getItem(MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY) ||
        window.localStorage.getItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY)
    )
  } catch {
    return false
  }
}

function clearGardenEditorLocalStorage() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY)
    window.localStorage.removeItem(MAP_3D_GUIDE_GARDEN_STORAGE_KEY)

    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith('lingshan-map-3d-guide-garden-editor-') || key?.startsWith('lingshan-map-3d-guide-garden-assets-')) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // Browser storage can be disabled; reset still works for in-memory state.
  }
}

function buildDefaultGardenEditorState(): GardenEditorState {
  return {
    zones: [
      {
        id: 'editor-zone-buddha-north-forest',
        name: '大佛背后密林编辑区',
        kind: 'forest',
        vertices: [
          { lat: 31.43038, lng: 120.09435 },
          { lat: 31.43222, lng: 120.09505 },
          { lat: 31.43212, lng: 120.09808 },
          { lat: 31.43018, lng: 120.09818 },
          { lat: 31.42946, lng: 120.09642 }
        ],
        density: 42,
        assetPool: ['pine_cluster', 'mixed_grove', 'bamboo_grove', 'forest_edge', 'shrub_mass', 'rock_cluster'],
        assetRatios: {
          pine_cluster: 34,
          mixed_grove: 26,
          bamboo_grove: 12,
          forest_edge: 16,
          shrub_mass: 8,
          rock_cluster: 4
        },
        minScale: 118,
        maxScale: 198,
        minHeight: 5,
        maxHeight: 14,
        opacity: 0.92,
        priority: 'high',
        visible: true
      },
      {
        id: 'editor-zone-central-axis-belts',
        name: '中轴两侧林带编辑区',
        kind: 'axis_grove',
        vertices: [
          { lat: 31.42378, lng: 120.09812 },
          { lat: 31.42798, lng: 120.09784 },
          { lat: 31.42828, lng: 120.09963 },
          { lat: 31.42398, lng: 120.10012 }
        ],
        density: 34,
        assetPool: ['forest_edge', 'pine_cluster', 'mixed_grove', 'shrub_mass', 'rock_cluster'],
        assetRatios: {
          forest_edge: 32,
          pine_cluster: 24,
          mixed_grove: 18,
          shrub_mass: 20,
          rock_cluster: 6
        },
        minScale: 72,
        maxScale: 138,
        minHeight: 2,
        maxHeight: 7,
        opacity: 0.82,
        priority: 'medium',
        visible: true
      },
      {
        id: 'editor-zone-fangong-tancheng-edge',
        name: '梵宫坛城边缘绿化编辑区',
        kind: 'node_green',
        vertices: [
          { lat: 31.4259, lng: 120.10035 },
          { lat: 31.4295, lng: 120.1001 },
          { lat: 31.42918, lng: 120.10242 },
          { lat: 31.42562, lng: 120.10262 }
        ],
        density: 24,
        assetPool: ['mixed_grove', 'forest_edge', 'shrub_mass', 'bamboo_grove', 'stone_mass'],
        assetRatios: {
          mixed_grove: 28,
          forest_edge: 24,
          shrub_mass: 26,
          bamboo_grove: 12,
          stone_mass: 10
        },
        minScale: 54,
        maxScale: 116,
        minHeight: 1,
        maxHeight: 5,
        opacity: 0.76,
        priority: 'medium',
        visible: true
      }
    ],
    keepouts: [
      {
        id: 'editor-keepout-main-route',
        name: '主路线与中轴留白',
        reason: 'route',
        vertices: [
          { lat: 31.42342, lng: 120.09872 },
          { lat: 31.42972, lng: 120.09582 },
          { lat: 31.43002, lng: 120.09655 },
          { lat: 31.42372, lng: 120.09948 }
        ],
        visible: true
      },
      {
        id: 'editor-keepout-jiulong-plaza',
        name: '九龙灌浴广场留白',
        reason: 'plaza',
        vertices: [
          { lat: 31.42392, lng: 120.0987 },
          { lat: 31.42508, lng: 120.09855 },
          { lat: 31.42528, lng: 120.09975 },
          { lat: 31.42402, lng: 120.10002 }
        ],
        visible: true
      },
      {
        id: 'editor-keepout-buddha-plaza',
        name: '佛前广场留白',
        reason: 'plaza',
        vertices: [
          { lat: 31.42838, lng: 120.09544 },
          { lat: 31.42972, lng: 120.09528 },
          { lat: 31.42986, lng: 120.09698 },
          { lat: 31.4285, lng: 120.09705 }
        ],
        visible: true
      }
    ],
    previewAssets: [],
    appliedAssets: []
  }
}

function loadStoredGardenEditorState(): GardenEditorState {
  const defaults = buildDefaultGardenEditorState()

  if (typeof window === 'undefined') {
    return defaults
  }

  try {
    const stored = window.localStorage.getItem(MAP_3D_GUIDE_GARDEN_EDITOR_STORAGE_KEY)

    if (!stored) {
      return defaults
    }

    const parsed = JSON.parse(stored) as Partial<GardenEditorState>

    if (!Array.isArray(parsed.zones) || !Array.isArray(parsed.keepouts)) {
      return defaults
    }

    return {
      zones: parsed.zones.filter((zone) => Array.isArray(zone.vertices) && zone.vertices.length >= 3) as GardenEditorVegetationZone[],
      keepouts: parsed.keepouts.filter((zone) => Array.isArray(zone.vertices) && zone.vertices.length >= 3) as GardenEditorKeepoutZone[],
      previewAssets: Array.isArray(parsed.previewAssets) ? parsed.previewAssets as LingshanMap3DGardenAsset[] : [],
      appliedAssets: Array.isArray(parsed.appliedAssets) ? parsed.appliedAssets as LingshanMap3DGardenAsset[] : []
    }
  } catch {
    return defaults
  }
}

function createEditorVegetationZone(vertices: LatLngPoint[], index: number): GardenEditorVegetationZone {
  return {
    id: `editor-zone-manual-${Date.now()}-${index + 1}`,
    name: `手绘林地 ${index + 1}`,
    kind: 'forest',
    vertices: vertices.map((vertex) => ({ lat: roundNumber(vertex.lat, 6), lng: roundNumber(vertex.lng, 6) })),
    density: 24,
    assetPool: [...defaultEditorAssetPool],
    assetRatios: { ...defaultEditorAssetRatios },
    minScale: 72,
    maxScale: 150,
    minHeight: 2,
    maxHeight: 8,
    opacity: 0.82,
    priority: 'medium',
    visible: true
  }
}

function createEditorKeepoutZone(vertices: LatLngPoint[], index: number): GardenEditorKeepoutZone {
  return {
    id: `editor-keepout-manual-${Date.now()}-${index + 1}`,
    name: `手绘留白 ${index + 1}`,
    reason: 'plaza',
    vertices: vertices.map((vertex) => ({ lat: roundNumber(vertex.lat, 6), lng: roundNumber(vertex.lng, 6) })),
    visible: true
  }
}

function getEditorAssetDefaults(kind: Map3DGardenAssetKind) {
  if (kind === 'rock_cluster' || kind === 'stone_mass') {
    return { scale: 62, height: 0.8, opacity: 0.9 }
  }

  if (kind === 'fluffy_bodhi_grove') {
    return { scale: 62, height: 2.5, opacity: 0.92 }
  }

  if (kind === 'dense_shrub_cluster') {
    return { scale: 74, height: 1.2, opacity: 0.88 }
  }

  if (
    kind === 'fluffy_round_tree' ||
    kind === 'bushy_canopy_tree' ||
    kind === 'soft_forest_clump' ||
    kind === 'fluffy_tree_mix'
  ) {
    return { scale: 88, height: 2.2, opacity: 0.88 }
  }

  return { scale: 112, height: 3, opacity: 0.9 }
}

function createSingleEditorAsset(point: LatLngPoint, kind: Map3DGardenAssetKind, index: number): LingshanMap3DGardenAsset {
  const routeProgress = findNearestRoutePoint(point, demoRoutePath)?.progressRatio ?? 0
  const assetDefaults = getEditorAssetDefaults(kind)

  return {
    id: `editor-single-${kind}-${Date.now()}-${index + 1}`,
    zoneId: 'editor-single-assets',
    kind,
    name: `单点 ${kind} ${index + 1}`,
    assetUrl: getMap3DGardenAssetUrl(kind),
    location: {
      lat: roundNumber(point.lat, 6),
      lng: roundNumber(point.lng, 6)
    },
    scale: assetDefaults.scale,
    height: assetDefaults.height,
    yaw: 0,
    opacity: assetDefaults.opacity,
    visible: true,
    priority: 'medium',
    routeFraction: roundNumber(routeProgress, 3),
    licenseId: getMap3DGardenLicenseId(),
    note: '由 debugGarden 图形化编辑器单点添加。'
  }
}

function buildDefaultTreeCandidateLabState(): TreeCandidateLabState {
  return {
    selectedCandidateType: 'fluffy_bodhi_grove',
    clusterMode: 'smallCluster',
    params: { ...getTreeCandidateRecommendedParams('fluffy_bodhi_grove', 'smallCluster') },
    testTrees: [],
    defaultGardenHidden: true,
    landmarkReferenceLoaded: false
  }
}

function loadTreeCandidateLabDraft(enabled: boolean): TreeCandidateLabState {
  const fallback = buildDefaultTreeCandidateLabState()

  if (!enabled || typeof window === 'undefined') {
    return fallback
  }

  try {
    const stored = window.localStorage.getItem(TREE_CANDIDATE_LAB_STORAGE_KEY)

    if (!stored) {
      return fallback
    }

    const parsed = JSON.parse(stored) as Partial<TreeCandidateLabState>
    const selectedCandidateType = sanitizeTreeCandidateType(parsed.selectedCandidateType)
    const clusterMode = sanitizeTreeCandidateClusterMode(parsed.clusterMode)

    return {
      selectedCandidateType,
      clusterMode,
      params: sanitizeTreeCandidateParams(parsed.params, clusterMode, selectedCandidateType),
      testTrees: Array.isArray(parsed.testTrees) ? parsed.testTrees.filter(isTreeCandidateAsset).map(cloneGardenAsset).map(normalizeLingshanTreeAssetScale) : [],
      defaultGardenHidden: parsed.defaultGardenHidden !== false,
      landmarkReferenceLoaded: false
    }
  } catch {
    return fallback
  }
}

function sanitizeTreeCandidateType(value: unknown): TreeCandidateType {
  return treeCandidateTypes.includes(value as TreeCandidateType) ? (value as TreeCandidateType) : 'fluffy_bodhi_grove'
}

function sanitizeTreeCandidateClusterMode(value: unknown): TreeCandidateClusterMode {
  const modes = Object.keys(treeCandidateClusterDefaults) as TreeCandidateClusterMode[]
  return modes.includes(value as TreeCandidateClusterMode) ? (value as TreeCandidateClusterMode) : 'single'
}

function getTreeCandidateRecommendedParams(candidateType: TreeCandidateType, mode: TreeCandidateClusterMode) {
  return treeCandidateRecommendedDefaults[candidateType]?.[mode] ?? treeCandidateClusterDefaults[mode]
}

function sanitizeTreeCandidateParams(
  value: unknown,
  mode: TreeCandidateClusterMode,
  candidateType: TreeCandidateType = 'fluffy_bodhi_grove'
): TreeCandidateLabParams {
  const defaults = getTreeCandidateRecommendedParams(candidateType, mode)
  const params = typeof value === 'object' && value ? (value as Partial<TreeCandidateLabParams>) : {}
  const scaleMin = clampNumber(Number(params.scaleMin ?? defaults.scaleMin), 0.1, 220)
  const scaleMax = clampNumber(Number(params.scaleMax ?? defaults.scaleMax), 0.1, 240)
  const normalizedScaleRange = normalizeLingshanTreeScaleRange(candidateType, scaleMin, scaleMax)

  return {
    count: Math.round(clampNumber(Number(params.count ?? defaults.count), 1, 40)),
    radiusMeters: clampNumber(Number(params.radiusMeters ?? defaults.radiusMeters), 0, 90),
    minDistanceMeters: clampNumber(Number(params.minDistanceMeters ?? defaults.minDistanceMeters), 0, 28),
    scaleMin: roundNumber(Math.min(normalizedScaleRange.scaleMin, normalizedScaleRange.scaleMax), 2),
    scaleMax: roundNumber(Math.max(normalizedScaleRange.scaleMin, normalizedScaleRange.scaleMax), 2),
    heightOffset: roundNumber(clampNumber(Number(params.heightOffset ?? defaults.heightOffset), -5, 16), 1),
    randomSeed: Math.round(clampNumber(Number(params.randomSeed ?? defaults.randomSeed), 1, 999999))
  }
}

function isTreeCandidateAsset(asset: unknown): asset is LingshanMap3DGardenAsset {
  if (!asset || typeof asset !== 'object') {
    return false
  }

  const candidate = asset as Partial<LingshanMap3DGardenAsset>
  return (
    typeof candidate.id === 'string' &&
    sanitizeTreeCandidateType(candidate.kind) === candidate.kind &&
    typeof candidate.assetUrl === 'string' &&
    typeof candidate.location?.lat === 'number' &&
    typeof candidate.location?.lng === 'number'
  )
}

function buildTreeCandidateClusterAssets({
  center,
  candidateType,
  clusterId,
  clusterIndex,
  clusterMode,
  params
}: {
  center: LatLngPoint
  candidateType: TreeCandidateType
  clusterId: string
  clusterIndex: number
  clusterMode: TreeCandidateClusterMode
  params: TreeCandidateLabParams
}): LingshanMap3DGardenAsset[] {
  const sanitizedParams = sanitizeTreeCandidateParams(params, clusterMode, candidateType)
  const points = sampleTreeCandidateClusterPoints(center, sanitizedParams)

  return points.map((point, index) => {
    const seedIndex = clusterIndex + index + 1
    const scale = roundNumber(lerpNumber(sanitizedParams.scaleMin, sanitizedParams.scaleMax, seeded01(sanitizedParams.randomSeed, seedIndex, 71)), 2)
    const height = roundNumber(sanitizedParams.heightOffset + (seeded01(sanitizedParams.randomSeed, seedIndex, 73) - 0.5) * 0.8, 1)
    const yaw = roundNumber(-180 + seeded01(sanitizedParams.randomSeed, seedIndex, 79) * 360, 0)
    const routeProgress = findNearestRoutePoint(point, demoRoutePath)?.progressRatio ?? 0

    return normalizeLingshanTreeAssetScale({
      id: `${clusterId}-${index + 1}`,
      zoneId: TREE_CANDIDATE_LAB_ZONE_ID,
      kind: candidateType,
      name: `候选树 ${treeCandidateLabels[candidateType]} ${treeCandidateClusterLabels[clusterMode]} ${index + 1}`,
      assetUrl: getMap3DGardenAssetUrl(candidateType),
      location: {
        lat: roundNumber(point.lat, 6),
        lng: roundNumber(point.lng, 6)
      },
      scale,
      height,
      yaw,
      opacity: 0.92,
      visible: true,
      priority: 'high',
      routeFraction: roundNumber(routeProgress, 3),
      licenseId: getMap3DGardenLicenseId(),
      note: buildTreeCandidateNote({ clusterId, clusterMode, candidateType })
    })
  })
}

function sampleTreeCandidateClusterPoints(center: LatLngPoint, params: TreeCandidateLabParams): LatLngPoint[] {
  const count = Math.max(1, Math.round(params.count))

  if (count === 1 || params.radiusMeters <= 0) {
    return [center]
  }

  const points: LatLngPoint[] = []
  const maxAttempts = Math.max(count * 80, 80)

  for (let attempt = 0; attempt < maxAttempts && points.length < count; attempt += 1) {
    const angle = seeded01(params.randomSeed, attempt, 83) * Math.PI * 2
    const radius = Math.sqrt(seeded01(params.randomSeed, attempt, 89)) * params.radiusMeters
    const point = offsetLatLngMeters(center, Math.cos(angle) * radius, Math.sin(angle) * radius)
    const farEnough = points.every((existing) => haversineDistanceMeters(existing, point) >= params.minDistanceMeters)

    if (farEnough) {
      points.push(point)
    }
  }

  if (!points.length) {
    points.push(center)
  }

  return points
}

function getTreeCandidateCompareSpacing(mode: TreeCandidateClusterMode) {
  if (mode === 'backgroundGrove') {
    return 72
  }

  if (mode === 'mediumCluster') {
    return 58
  }

  if (mode === 'smallCluster') {
    return 46
  }

  return 36
}

function buildTreeCandidateNote({
  clusterId,
  clusterMode,
  candidateType
}: {
  clusterId: string
  clusterMode: TreeCandidateClusterMode
  candidateType: TreeCandidateType
}) {
  return `treeCandidateLab|source=treeCandidateLab|clusterId=${clusterId}|clusterMode=${clusterMode}|candidateType=${candidateType}`
}

function parseTreeCandidateNote(note: string | undefined) {
  const fallback = {
    clusterId: '',
    clusterMode: 'single' as TreeCandidateClusterMode,
    candidateType: 'fluffy_bodhi_grove' as TreeCandidateType
  }

  if (!note?.startsWith('treeCandidateLab|')) {
    return fallback
  }

  const entries = Object.fromEntries(
    note
      .split('|')
      .slice(1)
      .map((item) => {
        const [key, value] = item.split('=')
        return [key, value]
      })
  )

  return {
    clusterId: entries.clusterId ?? '',
    clusterMode: sanitizeTreeCandidateClusterMode(entries.clusterMode),
    candidateType: sanitizeTreeCandidateType(entries.candidateType)
  }
}

function cloneGardenAsset(asset: LingshanMap3DGardenAsset): LingshanMap3DGardenAsset {
  return {
    ...asset,
    location: { ...asset.location }
  }
}

function isSameLatLngPoint(a: LatLngPoint | undefined, b: LatLngPoint | undefined) {
  if (!a || !b) {
    return false
  }

  return Math.abs(a.lat - b.lat) < 0.000001 && Math.abs(a.lng - b.lng) < 0.000001
}

function buildGardenGenerationParamsSnapshot(state: GardenEditorState) {
  return {
    generator: 'generateGardenAssetsFromEditor',
    trigger: 'manual preview button',
    seed: 'hashString(zone.id)',
    maxAttempts: 'Math.max(80, zone.density * 28)',
    routeKeepoutMetersByZoneKind: {
      forest: 18,
      axis_grove: 13,
      water_edge: 10,
      node_green: 18
    },
    assetKindOptions: gardenAssetKindOptions,
    zones: state.zones.map((zone) => ({
      id: zone.id,
      kind: zone.kind,
      density: zone.density,
      assetPool: zone.assetPool,
      assetRatios: zone.assetRatios,
      minScale: zone.minScale,
      maxScale: zone.maxScale,
      minHeight: zone.minHeight,
      maxHeight: zone.maxHeight,
      opacity: zone.opacity,
      priority: zone.priority,
      visible: zone.visible
    })),
    keepoutCount: state.keepouts.length
  }
}

function generateGardenAssetsFromEditor(
  zones: GardenEditorVegetationZone[],
  keepouts: GardenEditorKeepoutZone[]
): LingshanMap3DGardenAsset[] {
  const activeKeepouts = keepouts.filter((zone) => zone.visible && zone.vertices.length >= 3)
  const assets: LingshanMap3DGardenAsset[] = []

  zones
    .filter((zone) => zone.visible && zone.vertices.length >= 3 && zone.density > 0)
    .forEach((zone) => {
      const bounds = getPolygonBounds(zone.vertices)
      const seed = hashString(zone.id)
      let created = 0
      let attempt = 0
      const maxAttempts = Math.max(80, zone.density * 28)

      while (created < zone.density && attempt < maxAttempts) {
        const candidate = {
          lat: roundNumber(bounds.minLat + (bounds.maxLat - bounds.minLat) * seeded01(seed, attempt, 7), 6),
          lng: roundNumber(bounds.minLng + (bounds.maxLng - bounds.minLng) * seeded01(seed, attempt, 13), 6)
        }
        attempt += 1

        if (!isPointInPolygon(candidate, zone.vertices)) {
          continue
        }

        if (activeKeepouts.some((keepout) => isPointInPolygon(candidate, keepout.vertices))) {
          continue
        }

        const routeDistance = findNearestRoutePoint(candidate, demoRoutePath)?.distanceMeters ?? Number.POSITIVE_INFINITY
        const routeKeepout = zone.kind === 'axis_grove' ? 13 : zone.kind === 'water_edge' ? 10 : 18

        if (routeDistance < routeKeepout) {
          continue
        }

        const kind = chooseEditorAssetKind(zone, seed, attempt)
        const routeProgress = findNearestRoutePoint(candidate, demoRoutePath)?.progressRatio ?? 0
        const scale = roundNumber(lerpNumber(zone.minScale, zone.maxScale, seeded01(seed, attempt, 19)), 0)
        const height = roundNumber(lerpNumber(zone.minHeight, zone.maxHeight, seeded01(seed, attempt, 23)), 1)
        const yaw = roundNumber(-180 + seeded01(seed, attempt, 31) * 360, 0)
        const opacity = clampNumber(roundNumber(zone.opacity * (0.86 + seeded01(seed, attempt, 37) * 0.2), 2), 0.2, 1)

        assets.push({
          id: `editor-${zone.id}-${created + 1}`,
          zoneId: zone.id,
          kind,
          name: `${zone.name} ${created + 1}`,
          assetUrl: getMap3DGardenAssetUrl(kind),
          location: candidate,
          scale,
          height,
          yaw,
          opacity,
          visible: true,
          priority: zone.priority,
          routeFraction: roundNumber(routeProgress, 3),
          licenseId: getMap3DGardenLicenseId(),
          note: `由 debugGarden 图形化编辑器基于 ${zone.name} 生成。`
        })
        created += 1
      }
    })

  return assets
}

function chooseEditorAssetKind(zone: GardenEditorVegetationZone, seed: number, attempt: number) {
  const pool = zone.assetPool.length ? zone.assetPool : defaultEditorAssetPool
  const weightedPool = pool.map((kind) => ({
    kind,
    weight: Math.max(1, Number(zone.assetRatios[kind] ?? 1))
  }))
  const total = weightedPool.reduce((sum, item) => sum + item.weight, 0)
  const pick = seeded01(seed, attempt, 41) * total
  let cursor = 0

  for (const item of weightedPool) {
    cursor += item.weight
    if (pick <= cursor) {
      return item.kind
    }
  }

  return weightedPool[0]?.kind ?? 'mixed_grove'
}

function buildGardenEditorPolygonItems(
  state: GardenEditorState,
  draft: GardenDraftPolygon,
  selectedZoneId: string,
  selectedKeepoutZoneId: string
) {
  const items = [
    ...state.zones
      .filter((zone) => zone.id === selectedZoneId && zone.vertices.length >= 3)
      .map((zone) => ({
        id: `zone-${zone.id}`,
        type: 'vegetation' as const,
        name: zone.name,
        vertices: zone.vertices,
        fill: 'rgba(38, 92, 63, 0)',
        border: zone.kind === 'forest' ? 'rgba(31, 106, 72, 0.92)' : zone.kind === 'axis_grove' ? 'rgba(75, 111, 61, 0.90)' : 'rgba(48, 122, 99, 0.88)',
        dashed: false
      })),
    ...state.keepouts
      .filter((zone) => zone.id === selectedKeepoutZoneId && zone.vertices.length >= 3)
      .map((zone) => ({
        id: `keepout-${zone.id}`,
        type: 'keepout' as const,
        name: zone.name,
        vertices: zone.vertices,
        fill: 'rgba(180, 83, 9, 0)',
        border: 'rgba(158, 67, 32, 0.94)',
        dashed: true
      }))
  ]

  if (draft && draft.vertices.length >= 3) {
    items.push({
      id: `draft-${draft.mode}`,
      type: draft.mode === 'vegetation' ? 'vegetation' : 'keepout',
      name: draft.mode === 'vegetation' ? '绘制中的 vegetation zone' : '绘制中的 keepout zone',
      vertices: draft.vertices,
      fill: draft.mode === 'vegetation' ? 'rgba(37, 99, 235, 0)' : 'rgba(217, 119, 6, 0)',
      border: draft.mode === 'vegetation' ? 'rgba(37, 99, 235, 0.90)' : 'rgba(217, 119, 6, 0.90)',
      dashed: draft.mode === 'keepout'
    })
  }

  return items
}

function buildGardenEditorVertexItems(
  state: GardenEditorState,
  draft: GardenDraftPolygon,
  selectedZoneId: string,
  selectedKeepoutZoneId: string
) {
  const vertices: Array<{ id: string; styleId: 'vegetationVertex' | 'keepoutVertex' | 'draftVertex'; position: LatLngPoint }> = []

  state.zones.filter((zone) => zone.id === selectedZoneId).forEach((zone) => {
    zone.vertices.forEach((position, index) => {
      vertices.push({
        id: `zone:${zone.id}:${index}`,
        styleId: 'vegetationVertex',
        position
      })
    })
  })

  state.keepouts.filter((zone) => zone.id === selectedKeepoutZoneId).forEach((zone) => {
    zone.vertices.forEach((position, index) => {
      vertices.push({
        id: `keepout:${zone.id}:${index}`,
        styleId: 'keepoutVertex',
        position
      })
    })
  })

  if (draft) {
    draft.vertices.forEach((position, index) => {
      vertices.push({
        id: `draft:${draft.mode}:${index}`,
        styleId: 'draftVertex',
        position
      })
    })
  }

  return vertices
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

function gardenPreviewPointSvg(kind: Map3DGardenAssetKind) {
  const isStone = kind === 'rock_cluster' || kind === 'stone_mass'
  const isCandidateTree =
    kind === 'fluffy_bodhi_grove' ||
    kind === 'fluffy_round_tree' ||
    kind === 'bushy_canopy_tree' ||
    kind === 'dense_shrub_cluster' ||
    kind === 'soft_forest_clump' ||
    kind === 'fluffy_tree_mix'
  const fill = isStone ? '#7b8174' : kind === 'shrub_mass' ? '#527e5d' : isCandidateTree ? '#6f8e73' : '#2f6f54'
  const stroke = isStone ? '#ede7d3' : '#f8efd1'
  const shape = isStone
    ? '<path d="M6 15.5 9 7.5l6-2 4 6.5-3.5 5.5H9z"/>'
    : '<path d="M12 3c3.6 1.8 6 4.6 6 7.5 0 3.6-2.6 6.5-6 6.5s-6-2.9-6-6.5C6 7.6 8.4 4.8 12 3Z"/><path d="M12 10v9"/>'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
    <g fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
      ${shape}
    </g>
  </svg>`
}

function getGardenAssetZoneId(asset: LingshanMap3DGardenAsset) {
  if (asset.zoneId) {
    return asset.zoneId
  }

  const match = asset.id.match(/^c-zone-(.*)-\d+$/)
  return match?.[1] ?? 'manual'
}

function matchesGardenFilters(asset: LingshanMap3DGardenAsset, filters: GardenAssetFilterState) {
  if (filters.zoneId !== 'all' && getGardenAssetZoneId(asset) !== filters.zoneId) {
    return false
  }

  if (filters.kind !== 'all' && asset.kind !== filters.kind) {
    return false
  }

  if (filters.priority !== 'all' && asset.priority !== filters.priority) {
    return false
  }

  if (filters.visible !== 'all' && String(asset.visible) !== filters.visible) {
    return false
  }

  return true
}

function getGardenLodState({
  currentZoom,
  debugGarden,
  isInteracting
}: {
  currentZoom: number
  debugGarden: boolean
  isInteracting: boolean
}): GardenLodState {
  const zoom = Number.isFinite(currentZoom) ? currentZoom : SCENIC_CAMERA_BOUNDS.defaultZoom
  const lod = SCENIC_CAMERA_BOUNDS.lod

  if (zoom <= lod.farZoom) {
    return {
      opacity: debugGarden ? lod.farDebugGardenOpacity : lod.farOpacity,
      visibleTier: 'none',
      isInteracting,
      currentZoom: roundNumber(zoom, 2)
    }
  }

  if (isInteracting) {
    return {
      opacity: debugGarden ? lod.interactionDebugGardenOpacity : lod.interactionOpacity,
      visibleTier: 'reduced',
      isInteracting,
      currentZoom: roundNumber(zoom, 2)
    }
  }

  if (zoom <= lod.reducedZoom) {
    return {
      opacity: debugGarden ? lod.reducedDebugGardenOpacity : lod.reducedOpacity,
      visibleTier: 'reduced',
      isInteracting,
      currentZoom: roundNumber(zoom, 2)
    }
  }

  return {
    opacity: lod.normalOpacity,
    visibleTier: 'full',
    isInteracting,
    currentZoom: roundNumber(zoom, 2)
  }
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

function buildForestPatchPath(patch: LingshanMap3DForestPatch) {
  const steps = 28
  const rotation = (patch.rotation * Math.PI) / 180
  const points: any[] = []

  for (let index = 0; index < steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2
    const x = Math.cos(angle) * patch.radiusX
    const y = Math.sin(angle) * patch.radiusY
    const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation)
    const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation)
    const point = offsetLatLngMeters(patch.center, rotatedX, rotatedY)
    points.push(toTMapLatLng(point))
  }

  return points
}

function getForestPatchOpacity(
  patch: LingshanMap3DForestPatch,
  options: {
    debugGarden: boolean
    routeProgressRatio: number
    rerouteActive: boolean
  }
) {
  if (options.debugGarden) {
    return Math.min(0.42, Math.max(patch.opacity, 0.22))
  }

  const distanceFromProgress = patch.routeFraction - Math.max(0, Math.min(1, options.routeProgressRatio))
  const currentBoost = Math.abs(distanceFromProgress) <= 0.14 ? 1.18 : distanceFromProgress < -0.14 ? 1.04 : 0.9
  const rerouteDimming = options.rerouteActive && patch.priority !== 'high' ? 0.82 : 1
  return Number(Math.max(0.08, Math.min(0.38, patch.opacity * currentBoost * rerouteDimming)).toFixed(3))
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

function forestPatchSvg(options: {
  color: string
  opacity: number
  rotation: number
  width: number
  height: number
}) {
  const width = Math.max(80, options.width)
  const height = Math.max(50, options.height)
  const cx = width / 2
  const cy = height / 2
  const rx = width * 0.44
  const ry = height * 0.38
  const wash = colorWithOpacity(options.color, options.opacity)
  const inner = colorWithOpacity(options.color, Math.min(0.42, options.opacity * 1.2))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g transform="rotate(${options.rotation} ${cx} ${cy})">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${wash}"/>
      <ellipse cx="${cx - width * 0.08}" cy="${cy - height * 0.06}" rx="${rx * 0.54}" ry="${ry * 0.48}" fill="${inner}" opacity=".42"/>
      <ellipse cx="${cx + width * 0.14}" cy="${cy + height * 0.05}" rx="${rx * 0.42}" ry="${ry * 0.38}" fill="${inner}" opacity=".30"/>
    </g>
  </svg>`
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
  background:
    radial-gradient(circle at 50% 42%, rgba(242, 235, 216, .92), rgba(221, 233, 217, .88) 52%, rgba(207, 222, 209, .96) 100%),
    #dde9d9;
  opacity: .98;
  filter: saturate(.84) sepia(.08) contrast(.96) brightness(1.04);
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

.map-3d-guide-garden-debug--editor {
  position: absolute;
  z-index: 18;
  top: auto;
  left: auto;
  width: 390px;
  max-height: calc(100vh - 96px);
  resize: both;
}

.map-3d-guide-shell--debug-garden.map-3d-guide-shell--debug-perf .map-3d-guide-garden-debug--editor {
  max-height: min(calc(100vh - 356px), 404px);
}

.map-3d-guide-garden-debug__drag-handle {
  cursor: move;
  user-select: none;
}

.map-3d-guide-shell--debug-garden .map-3d-guide-camera {
  top: 18px;
}

.map-3d-guide-shell--debug-garden .map-3d-guide-status {
  top: 118px;
}

.map-3d-guide-debug-exit {
  width: 100%;
  margin: 0 0 10px;
}

.map-3d-guide-garden-debug__steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
  margin: 10px 0;
}

.map-3d-guide-garden-debug__steps button {
  min-height: 34px;
  padding: 0 5px;
  font-size: 11px;
}

.map-3d-guide-garden-debug__object-lists {
  display: grid;
  gap: 8px;
  margin: 10px 0;
}

.map-3d-guide-garden-debug__list-group {
  display: grid;
  gap: 6px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .32);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.54);
}

.map-3d-guide-garden-debug__list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.map-3d-guide-garden-debug__list-heading strong {
  font-size: 13px;
}

.map-3d-guide-garden-debug__list-heading span {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(36, 72, 60, .10);
  color: #24483c;
  font-size: 11px;
  font-weight: 900;
}

.map-3d-guide-garden-debug__list-scroll {
  display: grid;
  gap: 5px;
  max-height: 86px;
  overflow: auto;
}

.map-3d-guide-garden-debug__list-scroll--assets {
  max-height: 118px;
}

.map-3d-guide-garden-debug__list-scroll button {
  display: grid;
  justify-items: start;
  gap: 2px;
  min-height: 38px;
  padding: 6px 8px;
  text-align: left;
}

.map-3d-guide-garden-debug__list-scroll button span {
  width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-3d-guide-garden-debug__list-scroll button small {
  width: 100%;
  overflow: hidden;
  color: #7b8176;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-3d-guide-garden-debug__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.map-3d-guide-garden-debug__primary {
  border-color: rgba(32, 96, 72, .40) !important;
  background: rgba(220, 241, 226, .96) !important;
  color: #245640 !important;
}

.map-3d-guide-garden-debug__danger {
  border-color: rgba(185, 74, 40, .34) !important;
  background: rgba(255, 239, 229, .96) !important;
  color: #9a3412 !important;
}

.map-3d-guide-garden-debug__draft-state,
.map-3d-guide-garden-debug__stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
}

.map-3d-guide-garden-debug__draft-state span,
.map-3d-guide-garden-debug__stat-row span {
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(255, 249, 229, .78);
  color: #6f4a12;
  font-size: 11px;
  font-weight: 900;
}

.map-3d-guide-garden-debug__advanced {
  margin-top: 10px;
  border-top: 1px solid rgba(94, 112, 102, .12);
}

.map-3d-guide-garden-debug__advanced summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  color: #6d756e;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  list-style: none;
}

.map-3d-guide-garden-debug__advanced summary::-webkit-details-marker {
  display: none;
}

.map-3d-guide-garden-debug__advanced summary::after {
  content: "展开";
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 249, 229, .72);
  color: #8a6a28;
  font-size: 11px;
}

.map-3d-guide-garden-debug__advanced[open] summary::after {
  content: "收起";
}

.map-3d-guide-garden-debug__status {
  display: block;
  margin-top: 10px;
  padding: 8px 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .42);
  color: #24483c;
  font-weight: 900;
}

.map-3d-guide-garden-load {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 9;
  padding: 8px 11px;
  border-radius: 10px;
  border: 1px solid rgba(50, 88, 75, .16);
  background: rgba(250, 252, 238, .88);
  color: #24483c;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 10px 28px rgba(20, 45, 36, .14), inset 0 0 0 1px rgba(255,255,255,.52);
  backdrop-filter: blur(14px);
  pointer-events: none;
}

.map-3d-guide-garden-load.is-warning {
  color: #8a3512;
  border-color: rgba(182, 83, 24, .26);
  background: rgba(255, 244, 228, .90);
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

.map-3d-guide-shell--debug-garden.map-3d-guide-shell--debug-perf .map-3d-guide-perf-panel {
  bottom: 18px;
  max-height: min(46vh, 420px);
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

.map-3d-guide-garden-debug__subsection {
  margin: 12px 0;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .34);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.58);
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

.map-3d-guide-decor-debug button.is-active,
.map-3d-guide-garden-debug button.is-active {
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

.map-3d-guide-routes button:disabled,
.map-3d-guide-camera button:disabled,
.map-3d-guide-controlbar button:disabled {
  cursor: wait;
  opacity: .58;
}

.map-3d-guide-mobile-panel-toggle {
  display: none;
}

@media (max-width: 880px) {
  .map-3d-guide-mobile-panel-toggle {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    z-index: 15;
    display: grid;
    gap: 3px;
    min-height: 48px;
    padding: 9px 13px;
    border: 1px solid rgba(201, 168, 106, .56);
    border-radius: 999px;
    background:
      linear-gradient(135deg, rgba(255, 250, 229, .96), rgba(231, 247, 239, .92));
    color: #24483c;
    text-align: left;
    box-shadow: 0 14px 36px rgba(23, 48, 39, .18), inset 0 0 0 1px rgba(255,255,255,.62);
    backdrop-filter: blur(14px);
  }

  .map-3d-guide-mobile-panel-toggle span {
    font-size: 13px;
    font-weight: 900;
  }

  .map-3d-guide-mobile-panel-toggle small {
    color: #6d756e;
    font-size: 11px;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-3d-guide-shell--mobile-panels-collapsed .map-3d-guide-hero,
  .map-3d-guide-shell--mobile-panels-collapsed .map-3d-guide-routes,
  .map-3d-guide-shell--mobile-panels-collapsed .map-3d-guide-camera,
  .map-3d-guide-shell--mobile-panels-collapsed .map-3d-guide-status,
  .map-3d-guide-shell--mobile-panels-collapsed .map-3d-guide-pois,
  .map-3d-guide-shell--mobile-panels-collapsed .map-3d-guide-controlbar {
    display: none;
  }

  .map-3d-guide-hero,
  .map-3d-guide-routes,
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
    top: 492px;
  }

  .map-3d-guide-routes {
    top: 150px;
    max-height: 176px;
    overflow: auto;
  }

  .map-3d-guide-camera {
    top: 338px;
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
