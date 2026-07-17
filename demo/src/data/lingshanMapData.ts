import { guideRoutes, guideSpots, type GuideSpot, type LatLngPoint } from './guideData'
import {
  getScenicPoiCatalogItem,
  LINGSHAN_CORE_SCENIC_POI_IDS
} from './scenicPoiCatalog'

export type LingshanPoiCategory =
  | 'spot'
  | 'gate'
  | 'service'
  | 'toilet'
  | 'food'
  | 'bus'
  | 'exit'
  | 'viewpoint'

export type PoiBindStatus =
  | 'unbound'
  | 'candidate'
  | 'tencent_bound'
  | 'manual_verified'
  | 'field_verified'

export type LingshanPoi = {
  id: string
  name: string
  aliases: string[]
  category: LingshanPoiCategory
  bindingPriority: 'high' | 'medium' | 'low'
  navPointStrategy:
    | 'same_as_display'
    | 'entrance_required'
    | 'nearest_walkable_point_required'
    | 'manual_review_required'
  needsTencentPoi: boolean
  needsSeparateNavPoint: boolean
  assetBindingPriority?: 'core_3d' | 'simple_3d' | 'marker_only'

  displayLocation: LatLngPoint
  navLocation: LatLngPoint

  stayMinutes: number
  intro: string

  triggerRadiusMeters: number
  bindStatus: PoiBindStatus

  tencent?: {
    poiId?: string
    title?: string
    address?: string
    category?: string
    adcode?: string
    location?: LatLngPoint
  }

  scenePosition?: {
    x: number
    y: number
    z: number
  }

  scenePositionSource?: 'manual' | 'projected' | 'projected_with_offset'

  sceneOffset?: {
    x: number
    y?: number
    z: number
  }

  note?: string
}

/**
 * Map rendering uses an explicit set instead of fuzzy name matching so the
 * browse layer stays stable when editorial POI names change.
 */
export const LINGSHAN_CORE_POI_IDS = LINGSHAN_CORE_SCENIC_POI_IDS

export type LingshanPoiLayerMode = 'core' | 'all' | 'services'

/** Reserved contract for a future verified third-party scenic POI source. */
export type ExternalPoi = {
  id: string
  name: string
  location: LatLngPoint
  category?: string
}

export type ExternalPoiProvider = {
  searchWithinScenicArea: (options: {
    bounds: { north: number; south: number; east: number; west: number }
    categories?: string[]
  }) => Promise<ExternalPoi[]>
}

export type LingshanRoutePath = {
  routeId: string
  path: LatLngPoint[]
  source: 'manual' | 'tencent' | 'fallback'
  note?: string
}

export type LingshanSceneRoute = {
  id: string
  guideRouteId: string
  name: string
  description: string
  poiSequence: string[]
}

export const USE_LINGSHAN_PRESET_ROUTE_PATHS = false

const POI_CATEGORY_KEYWORDS: Array<{
  category: Exclude<LingshanPoiCategory, 'spot'>
  keywords: string[]
}> = [
  { category: 'gate', keywords: ['南门', '北门', '东门', '西门', '入园', '入口', '胜境门楼', '门楼'] },
  { category: 'exit', keywords: ['出口', '离园', '出园'] },
  { category: 'service', keywords: ['游客中心', '服务中心', '咨询', '客服', '售票', '票务'] },
  { category: 'toilet', keywords: ['厕所', '卫生间', '洗手间', '盥洗'] },
  { category: 'food', keywords: ['餐厅', '素斋', '咖啡', '茶', '饮品', '小吃', '餐饮'] },
  { category: 'bus', keywords: ['观光车', '车站', '候车', '接驳', '停车'] },
  { category: 'viewpoint', keywords: ['广场', '观景', '照壁', '景观', '平台', '眺望'] }
]

const CORE_SPOT_KEYWORDS = ['灵山大佛', '大佛', '九龙灌浴', '梵宫', '五印坛城', '祥符禅寺']
const CORE_3D_SPOT_IDS = ['giant_buddha', 'jiulong_guanyu', 'fan_gong', 'wuyin_tancheng']
const GUIDE_SPOT_ALIASES: Record<string, string[]> = {
  lingshan_wall: ['大照壁', '灵山大照壁', '华夏第一壁'],
  jiulong_guanyu: ['九龙灌浴广场'],
  fan_gong: ['灵山梵宫', '梵宫圣坛'],
  wuyin_tancheng: ['五印坛城景区', '坛城'],
  xiangfu_temple: ['祥符寺', '祥符禅院'],
  giant_buddha: ['大佛', '灵山大佛景区'],
  foshou_square: ['佛手', '天下第一掌'],
  foqian_square: ['大佛前广场'],
  manfeilong_tower: ['曼飞龙佛塔', '曼飞龙塔']
}

// scenePosition 是艺术化 3D 导览坐标，不是经纬度，也不用于真实导航。
const LINGSHAN_SCENE_POSITIONS: Record<string, NonNullable<LingshanPoi['scenePosition']>> = {
  south_gate: { x: -4.6, y: 0, z: 4.7 },
  lingshan_wall: { x: -4.25, y: 0, z: 4.05 },
  shengjing_square: { x: -3.45, y: 0, z: 3.25 },
  fozu_tan: { x: -4.35, y: 0, z: 3.05 },
  giant_buddha: { x: 0, y: 0, z: -1.2 },
  jiulong_guanyu: { x: -2.8, y: 0, z: 2.35 },
  puti_avenue: { x: -2.05, y: 0, z: 1.55 },
  foshou_square: { x: -1.35, y: 0, z: 0.25 },
  xiangfu_temple: { x: -0.75, y: 0, z: -0.25 },
  xingtan_square: { x: -0.55, y: 0, z: -0.7 },
  foqian_square: { x: -0.35, y: 0, z: -1.0 },
  baizi_mile: { x: 0.65, y: 0, z: 0.65 },
  fan_gong: { x: 3.45, y: 0, z: -0.15 },
  fan_gong_square: { x: 2.85, y: 0, z: 0.35 },
  wuyin_tancheng: { x: -1.75, y: 0, z: -4.05 },
  manfeilong_tower: { x: 3.9, y: 0, z: -2.35 },
  lingshan_jingshe: { x: 4.35, y: 0, z: -3.7 },
  sansheng_hall: { x: -2.65, y: 0, z: -1.9 },
  exit: { x: 3.95, y: 0, z: 4.25 }
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function inferPoiCategory(spot: GuideSpot): LingshanPoiCategory {
  const text = `${spot.name} ${spot.id}`
  const matchedRule = POI_CATEGORY_KEYWORDS.find((rule) => includesAny(text, rule.keywords))
  if (matchedRule) {
    return matchedRule.category
  }
  return 'spot'
}

function getSpotSearchText(spot: GuideSpot) {
  return `${spot.name} ${spot.id}`
}

function isCoreSpot(spot: GuideSpot) {
  return includesAny(getSpotSearchText(spot), CORE_SPOT_KEYWORDS)
}

function inferBindingPriority(category: LingshanPoiCategory, spot: GuideSpot): 'high' | 'medium' | 'low' {
  if (category === 'gate' || category === 'exit' || category === 'service' || category === 'bus') {
    return 'high'
  }

  if (category === 'toilet' || category === 'food') {
    return 'medium'
  }

  if (category === 'spot') {
    return isCoreSpot(spot) ? 'high' : 'medium'
  }

  if (category === 'viewpoint') {
    return includesAny(getSpotSearchText(spot), ['广场', '照壁']) ? 'medium' : 'low'
  }

  return 'medium'
}

function inferNavPointStrategy(category: LingshanPoiCategory, spot: GuideSpot): LingshanPoi['navPointStrategy'] {
  if (
    category === 'gate' ||
    category === 'exit' ||
    category === 'service' ||
    category === 'bus' ||
    category === 'toilet' ||
    category === 'food'
  ) {
    return 'nearest_walkable_point_required'
  }

  if (category === 'spot' && isCoreSpot(spot)) {
    return 'manual_review_required'
  }

  if (category === 'spot') {
    return 'entrance_required'
  }

  if (category === 'viewpoint') {
    return 'same_as_display'
  }

  return 'manual_review_required'
}

function inferNeedsTencentPoi(category: LingshanPoiCategory, spot: GuideSpot) {
  if (
    category === 'gate' ||
    category === 'exit' ||
    category === 'service' ||
    category === 'bus' ||
    category === 'toilet' ||
    category === 'food'
  ) {
    return true
  }

  return category === 'spot' && isCoreSpot(spot)
}

function inferNeedsSeparateNavPoint(category: LingshanPoiCategory, spot: GuideSpot) {
  if (category === 'gate' || category === 'exit' || category === 'bus' || category === 'service') {
    return true
  }

  return isCoreSpot(spot)
}

function inferAssetBindingPriority(
  category: LingshanPoiCategory,
  spot: GuideSpot
): 'core_3d' | 'simple_3d' | 'marker_only' {
  if (CORE_3D_SPOT_IDS.includes(spot.id)) {
    return 'core_3d'
  }

  if (spot.id === 'xiangfu_temple' || category === 'viewpoint' || category === 'spot') {
    return 'simple_3d'
  }

  return 'marker_only'
}

function inferScenePosition(spot: GuideSpot): LingshanPoi['scenePosition'] {
  return LINGSHAN_SCENE_POSITIONS[spot.id]
}

function inferScenePositionSource(spot: GuideSpot): LingshanPoi['scenePositionSource'] {
  return LINGSHAN_SCENE_POSITIONS[spot.id] ? 'manual' : undefined
}

function inferPoiNote(spot: GuideSpot): string | undefined {
  if (!LINGSHAN_SCENE_POSITIONS[spot.id]) {
    return undefined
  }

  return 'scenePosition 为艺术化 3D 导览坐标，不是经纬度，也不用于真实导航。'
}

export const lingshanPois: LingshanPoi[] = guideSpots.map((spot) => {
  const catalogItem = getScenicPoiCatalogItem(spot.id)
  const location: LatLngPoint = {
    lat: catalogItem?.coordinate?.lat ?? spot.lat,
    lng: catalogItem?.coordinate?.lng ?? spot.lng
  }
  const category = inferPoiCategory(spot)

  return {
    id: spot.id,
    name: spot.name,
    aliases: catalogItem?.aliases ?? GUIDE_SPOT_ALIASES[spot.id] ?? [],
    category,
    bindingPriority: inferBindingPriority(category, spot),
    navPointStrategy: inferNavPointStrategy(category, spot),
    needsTencentPoi: inferNeedsTencentPoi(category, spot),
    needsSeparateNavPoint: inferNeedsSeparateNavPoint(category, spot),
    assetBindingPriority: inferAssetBindingPriority(category, spot),
    displayLocation: location,
    navLocation: location,
    stayMinutes: spot.stayMinutes,
    intro: spot.intro,
    triggerRadiusMeters: 35,
    bindStatus: 'candidate',
    scenePosition: inferScenePosition(spot),
    scenePositionSource: inferScenePositionSource(spot),
    note: inferPoiNote(spot)
  }
})

const corePoiIdSet = new Set<string>(LINGSHAN_CORE_POI_IDS)

/** The public browse map's primary POI set. */
export function isLingshanCorePoi(poi: Pick<LingshanPoi, 'id'>) {
  return corePoiIdSet.has(poi.id)
}

export function hasValidLingshanPoiLocation(poi: Pick<LingshanPoi, 'displayLocation'>) {
  const { lat, lng } = poi.displayLocation
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

export function isLingshanServiceFacilityPoi(poi: Pick<LingshanPoi, 'category'>) {
  return poi.category === 'service' || poi.category === 'toilet' || poi.category === 'food' || poi.category === 'bus'
}

/**
 * Rendering-only POI filter. `services` deliberately returns no inferred
 * points until verified service coordinates are available.
 */
export function getLingshanPoisForLayer(mode: LingshanPoiLayerMode): LingshanPoi[] {
  if (mode === 'core') {
    return lingshanPois.filter((poi) => isLingshanCorePoi(poi) && hasValidLingshanPoiLocation(poi))
  }

  if (mode === 'services') {
    return []
  }

  return lingshanPois.filter((poi) => !isLingshanServiceFacilityPoi(poi) && hasValidLingshanPoiLocation(poi))
}

export function getLingshanPoiLayerSummary() {
  const core = getLingshanPoisForLayer('core')
  const all = getLingshanPoisForLayer('all')
  const coreIds = new Set(core.map((poi) => poi.id))

  return {
    coreCount: core.length,
    allCount: all.length,
    difference: all.filter((poi) => !coreIds.has(poi.id)).map((poi) => ({ id: poi.id, name: poi.name }))
  }
}

export const lingshanPresetRoutePaths: LingshanRoutePath[] = guideRoutes.map((route) => ({
  routeId: route.id,
  path: route.stops
    .map((stop) => {
      const spot = guideSpots.find((item) => item.id === stop.spotId)

      if (!spot) {
        return null
      }

      return {
        lat: spot.lat,
        lng: spot.lng
      }
    })
    .filter((point): point is LatLngPoint => point !== null),
  source: 'manual',
  note: '当前为基于路线站点生成的预设路线骨架，后续需要替换为更精细的园区步道折线。'
}))

export function getLingshanPresetRoutePath(routeId: string): LingshanRoutePath | undefined {
  return lingshanPresetRoutePaths.find((routePath) => routePath.routeId === routeId)
}

function getGuideRoutePoiSequence(routeId: string) {
  return guideRoutes.find((route) => route.id === routeId)?.stops.map((stop) => stop.spotId) ?? []
}

const historicalCulturePoiSequence = getGuideRoutePoiSequence('historical_culture')
const naturalSceneryPoiSequence = getGuideRoutePoiSequence('natural_scenery')
const familyPoiSequence = getGuideRoutePoiSequence('family')

export const lingshanSceneRoutes: LingshanSceneRoute[] = [
  {
    id: 'classic_3d_scene',
    name: '灵山经典 3D 导览线',
    guideRouteId: 'historical_culture',
    description: '基于历史文化路线 guideRoutes.stops 生成的艺术化 3D 导览路线，用于表达游览顺序和导览节奏，不等同真实步行路径。',
    poiSequence: historicalCulturePoiSequence
  },
  {
    id: 'historical_3d_scene',
    name: '历史文化爱好者 3D 导览线',
    guideRouteId: 'historical_culture',
    description: '基于历史文化路线 guideRoutes.stops 生成的艺术化 3D 导览路线，用于表达佛教历史、建筑艺术和文化轴线，不等同真实步行路径。',
    poiSequence: historicalCulturePoiSequence
  },
  {
    id: 'natural_3d_scene',
    name: '自然风光爱好者 3D 导览线',
    guideRouteId: 'natural_scenery',
    description: '基于自然风光爱好者路线 guideRoutes.stops 生成的艺术化 3D 导览路线，用于表达太湖视野、山水格局和禅意园林节奏，不等同真实步行路径。',
    poiSequence: naturalSceneryPoiSequence
  },
  {
    id: 'family_3d_scene',
    name: '亲子家庭 3D 导览线',
    guideRouteId: 'family',
    description: '基于亲子游路线 guideRoutes.stops 生成的艺术化 3D 导览路线，用于表达亲子互动、表演打卡和轻松游览节奏，不等同真实步行路径。',
    poiSequence: familyPoiSequence
  }
]

// 将艺术化 3D 导览路线映射到腾讯地图真实导览路线。
export const lingshanSceneRouteToGuideRouteMap: Record<string, string> = {
  classic_3d_scene: 'historical_culture',
  historical_3d_scene: 'historical_culture',
  prayer_3d_scene: 'natural_scenery',
  highlights_3d_scene: 'historical_culture',
  natural_3d_scene: 'natural_scenery',
  family_3d_scene: 'family'
}

// TODO: 后续需要根据灵山胜境真实边界修正。
export const lingshanBoundary: LatLngPoint[] = []
