import { guideRoutes, guideSpots, type GuideSpot, type LatLngPoint } from './guideData'

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

  note?: string
}

export type LingshanRoutePath = {
  routeId: string
  path: LatLngPoint[]
  source: 'manual' | 'tencent' | 'fallback'
  note?: string
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

// scenePosition 是艺术化 3D 场景坐标，不是经纬度，也不用于真实导航。
const CORE_3D_SCENE_POSITIONS: Record<string, NonNullable<LingshanPoi['scenePosition']>> = {
  giant_buddha: { x: 0, y: 0, z: -1.2 },
  jiulong_guanyu: { x: -2.8, y: 0, z: 2.35 },
  fan_gong: { x: 3.45, y: 0, z: -0.15 },
  wuyin_tancheng: { x: -1.75, y: 0, z: -4.05 }
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
  return CORE_3D_SCENE_POSITIONS[spot.id]
}

function inferPoiNote(spot: GuideSpot): string | undefined {
  if (!CORE_3D_SCENE_POSITIONS[spot.id]) {
    return undefined
  }

  return 'scenePosition 为艺术化 3D 场景坐标，不是经纬度，也不用于真实导航。'
}

export const lingshanPois: LingshanPoi[] = guideSpots.map((spot) => {
  const location: LatLngPoint = {
    lat: spot.lat,
    lng: spot.lng
  }
  const category = inferPoiCategory(spot)

  return {
    id: spot.id,
    name: spot.name,
    aliases: [],
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
    note: inferPoiNote(spot)
  }
})

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

// TODO: 后续需要根据灵山胜境真实边界修正。
export const lingshanBoundary: LatLngPoint[] = []
