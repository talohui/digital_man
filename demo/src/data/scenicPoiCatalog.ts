import { guideRoutes, guideSpots, type LatLngPoint } from './guideData'
import {
  getMapModelOverlayByPoiId,
  type LingshanMapModelOverlay
} from './lingshanMapModelOverlays'

export type ScenicAreaId = 'lingshan' | 'nianhuawan'
export type ScenicRouteId =
  | 'historical_culture'
  | 'prayer_meditation'
  | 'highlights_checkin'
  | 'natural_scenery'
  | 'family'

export type ScenicPoiCoordinateSourceType =
  | 'existing-poi-config'
  | 'route-stop'
  | 'route-geometry'
  | 'tencent-native-poi'
  | 'manual-calibration'

export type ScenicPoiCoordinateStatus = 'verified' | 'existing' | 'candidate' | 'needs-review' | 'unresolved'

export type ScenicPoiCatalogItem = {
  id: string
  sourceId?: string
  scenicAreaId: ScenicAreaId
  name: string
  aliases: string[]
  coordinate?: LatLngPoint
  coordinateSource: {
    type: ScenicPoiCoordinateSourceType
    sourceFile?: string
    tencentPoiId?: string
    note?: string
  }
  coordinateStatus: ScenicPoiCoordinateStatus
  routeIds: ScenicRouteId[]
  isCore: boolean
  model?: ScenicPoiModelReference
}

export type ScenicPoiModelReference = Pick<
  LingshanMapModelOverlay,
  'modelUrl' | 'height' | 'scale' | 'rotation' | 'lngOffset' | 'latOffset' | 'positionSource' | 'status'
>

/**
 * Explicit product selection. Do not derive core status from editorial names:
 * this remains stable across aliases and is shared by 2D, 3D and route layers.
 */
export const LINGSHAN_CORE_SCENIC_POI_IDS = [
  'south_gate',
  'lingshan_wall',
  'shengjing_square',
  'giant_buddha',
  'jiulong_guanyu',
  'puti_avenue',
  'foshou_square',
  'foqian_square',
  'xiangfu_temple',
  'fan_gong',
  'wuyin_tancheng',
  'sansheng_hall',
  'baizi_mile',
  'manfeilong_tower'
] as const

const corePoiIdSet = new Set<string>(LINGSHAN_CORE_SCENIC_POI_IDS)

const aliasesByPoiId: Record<string, string[]> = {
  south_gate: ['南门', '灵山胜境南门'],
  lingshan_wall: ['大照壁', '华夏第一壁'],
  jiulong_guanyu: ['九龙灌浴广场'],
  fan_gong: ['灵山梵宫', '梵宫圣坛'],
  wuyin_tancheng: ['五印坛城景区', '坛城'],
  xiangfu_temple: ['祥符寺', '祥符禅院'],
  giant_buddha: ['大佛', '灵山大佛景区'],
  foshou_square: ['佛手', '天下第一掌'],
  foqian_square: ['大佛前广场'],
  manfeilong_tower: ['曼飞龙佛塔', '曼龙飞塔'],
  lingshan_jingshe: ['灵山精舍禅修区'],
  exit: ['景区出口', '灵山胜境出口']
}

const candidateLingshanPoiDefinitions: Array<Pick<ScenicPoiCatalogItem, 'id' | 'name' | 'aliases' | 'isCore'>> = [
  { id: 'wuming_bridge', name: '五明桥', aliases: ['五明桥景区'], isCore: false },
  { id: 'wuzhi_gate', name: '五智门', aliases: ['五智门牌坊'], isCore: false },
  { id: 'jiangmo_relief', name: '降魔浮雕', aliases: ['降魔浮雕墙'], isCore: false },
  { id: 'ashoka_pillar', name: '阿育王柱', aliases: ['阿育王石柱'], isCore: false },
  { id: 'buddhist_culture_museum', name: '佛教文化博览馆', aliases: ['灵山佛教文化博览馆'], isCore: false },
  { id: 'wujinyi_zhai', name: '无尽意斋', aliases: ['无尽意斋院'], isCore: false }
]

function getRouteIdsForPoi(poiId: string): ScenicRouteId[] {
  return guideRoutes
    .filter((route) => route.stops.some((stop) => stop.spotId === poiId))
    .map((route) => route.id as ScenicRouteId)
}

function getModelReference(poiId: string): ScenicPoiModelReference | undefined {
  const model = getMapModelOverlayByPoiId(poiId)
  if (!model) {
    return undefined
  }

  const { modelUrl, height, scale, rotation, lngOffset, latOffset, positionSource, status } = model
  return { modelUrl, height, scale, rotation, lngOffset, latOffset, positionSource, status }
}

/**
 * The first catalog migration intentionally keeps the existing guideData
 * coordinates untouched. They are marked `existing`, not `verified`, until a
 * Tencent result or manual calibration is recorded.
 */
export const scenicPoiCatalog: ScenicPoiCatalogItem[] = [
  ...guideSpots.map((spot) => ({
    id: spot.id,
    sourceId: spot.id,
    scenicAreaId: 'lingshan' as const,
    name: spot.name,
    aliases: aliasesByPoiId[spot.id] ?? [],
    coordinate: { lat: spot.lat, lng: spot.lng },
    coordinateSource: {
      type: 'existing-poi-config' as const,
      sourceFile: 'src/data/guideData.ts',
      note: 'Migrated without coordinate modification from the existing guide spot configuration.'
    },
    coordinateStatus: 'existing' as const,
    routeIds: getRouteIdsForPoi(spot.id),
    isCore: corePoiIdSet.has(spot.id),
    model: getModelReference(spot.id)
  })),
  ...candidateLingshanPoiDefinitions.map((item) => ({
    ...item,
    scenicAreaId: 'lingshan' as const,
    coordinateSource: {
      type: 'tencent-native-poi' as const,
      note: 'Development-only candidate awaiting Tencent place-search confirmation or manual calibration.'
    },
    coordinateStatus: 'candidate' as const,
    routeIds: [] as ScenicRouteId[]
  }))
]

const catalogById = new Map(scenicPoiCatalog.map((item) => [item.id, item]))

export function getScenicPoiCatalogItem(poiId?: string | null) {
  return poiId ? catalogById.get(poiId) : undefined
}

export function getScenicPoiCoordinate(poiId?: string | null) {
  return getScenicPoiCatalogItem(poiId)?.coordinate
}

export function getMapEnabledScenicPois(scenicAreaId: ScenicAreaId = 'lingshan') {
  return scenicPoiCatalog.filter(
    (item) =>
      item.scenicAreaId === scenicAreaId &&
      Boolean(item.coordinate) &&
      (item.coordinateStatus === 'verified' || item.coordinateStatus === 'existing')
  )
}

export function getCoreScenicPois(scenicAreaId: ScenicAreaId = 'lingshan') {
  return getMapEnabledScenicPois(scenicAreaId).filter((item) => item.isCore)
}

export function hasMapEnabledScenicPoi(poiId?: string | null) {
  const item = getScenicPoiCatalogItem(poiId)
  return Boolean(item?.coordinate && (item.coordinateStatus === 'verified' || item.coordinateStatus === 'existing'))
}

export function normalizeScenicPoiName(value: string) {
  return value.replace(/[\s·•・,，。－-]/g, '').toLowerCase()
}

export function resolveScenicPoiIdByName(name?: string | null) {
  if (!name) {
    return undefined
  }
  const normalized = normalizeScenicPoiName(name)
  return scenicPoiCatalog.find((item) =>
    [item.name, ...item.aliases].some((candidate) => normalizeScenicPoiName(candidate) === normalized)
  )?.id
}
