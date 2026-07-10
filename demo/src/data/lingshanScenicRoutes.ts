import {
  guideRoutes,
  guideSpots,
  type GuideRoute,
  type GuideRouteStop,
  type GuideTag,
  type LatLngPoint
} from './guideData'
import { lingshanPois, type LingshanPoi } from './lingshanMapData'
import { getScenicPoiCatalogItem } from './scenicPoiCatalog'
import { getLingshanRouteGeometryByGuideRouteId, type LingshanRouteGeometry } from './lingshanRouteGeometries'

export type ScenicRouteGeometryMode = 'real' | 'candidate' | 'poi-polyline'

export type ScenicRouteStop = GuideRouteStop & {
  id: string
  name: string
  poiId?: string
  location?: LatLngPoint
  mappingStatus: 'mapped' | 'candidate' | 'unmapped'
}

export type ScenicRouteConfig = {
  id: string
  name: string
  subtitle?: string
  description?: string
  theme?: string
  tags: GuideTag[]
  estimatedMinutes?: number
  distanceMeters?: number
  stops: ScenicRouteStop[]
  geometry?: LatLngPoint[]
  routeGeometry?: LingshanRouteGeometry
  routeGeometryMode: ScenicRouteGeometryMode
  cameraPreset?: string
  color?: string
  source: 'guideData' | 'candidate' | 'manual'
  guideDataRouteSource: boolean
  unmappedGuideStopCount: number
  guideRoute: GuideRoute
}

const ROUTE_THEME_LABELS: Record<string, string> = {
  historical_culture: '文化探秘',
  prayer_meditation: '祈福静心',
  highlights_checkin: '精华打卡',
  natural_scenery: '自然慢游',
  family: '亲子轻松'
}

const ROUTE_CAMERA_PRESETS: Record<string, string> = {
  historical_culture: 'routeOverview',
  prayer_meditation: 'guideFollow',
  highlights_checkin: 'routeOverview',
  natural_scenery: 'axisCruise',
  family: 'guideFollow'
}

const ROUTE_COLOR = '#f1bd3e'

const GUIDE_STOP_ID_ALIASES: Record<string, string> = {
  dazhaobi: 'lingshan_wall',
  lingshan_dazhaobi: 'lingshan_wall',
  jiulong_square: 'jiulong_guanyu',
  jiulong_guanyu_square: 'jiulong_guanyu',
  lingshan_fan_gong: 'fan_gong',
  fan_gong_palace: 'fan_gong',
  wuyin_tancheng_area: 'wuyin_tancheng',
  xiangfu_temple_area: 'xiangfu_temple',
  xiangfu_si: 'xiangfu_temple',
  giant_buddha_area: 'giant_buddha',
  manlong_flying_tower: 'manfeilong_tower'
}

export const scenicRouteConfigs: ScenicRouteConfig[] = guideRoutes.map(buildScenicRouteConfig)

export function getScenicRouteConfig(routeId?: string | null) {
  if (!routeId) {
    return scenicRouteConfigs[0]
  }

  return scenicRouteConfigs.find((route) => route.id === routeId) ?? scenicRouteConfigs[0]
}

export function getScenicRouteById(routeId?: string | null) {
  if (!routeId) {
    return undefined
  }

  return scenicRouteConfigs.find((route) => route.id === routeId)
}

export function resolveScenicRouteId(routeId?: string | null) {
  return getScenicRouteById(routeId)?.id ?? getDefaultScenicRouteId()
}

export function getDefaultScenicRouteId() {
  return guideRoutes.find((route) => route.id === 'historical_culture')?.id ?? guideRoutes[0]?.id ?? ''
}

export function getRouteStops(routeId?: string | null) {
  return getScenicRouteConfig(routeId).stops
}

export function getRouteStopByIndex(routeId: string | null | undefined, stopIndex = 0) {
  const stops = getRouteStops(routeId)
  if (!stops.length) {
    return undefined
  }

  return stops[Math.min(Math.max(stopIndex, 0), stops.length - 1)]
}

export function getNextRouteStop(routeId: string | null | undefined, stopIndex = 0) {
  const stops = getRouteStops(routeId)
  if (!stops.length) {
    return undefined
  }

  return stops[Math.min(Math.max(stopIndex + 1, 0), stops.length - 1)]
}

export function getRoutePoiId(routeId: string | null | undefined, stopIndex = 0) {
  const stop = getRouteStopByIndex(routeId, stopIndex)
  return stop?.poiId ?? stop?.id
}

export function getScenicRouteOptions() {
  return scenicRouteConfigs.map((route) => ({
    id: route.id,
    name: route.name,
    subtitle: route.subtitle,
    description: route.description,
    theme: route.theme,
    tags: route.tags,
    durationLabel: route.guideRoute.durationLabel,
    routeGeometryMode: route.routeGeometryMode,
    unmappedGuideStopCount: route.unmappedGuideStopCount
  }))
}

function buildScenicRouteConfig(route: GuideRoute): ScenicRouteConfig {
  const routeGeometry = getLingshanRouteGeometryByGuideRouteId(route.id)
  const stops = route.stops.map(resolveScenicRouteStop)
  const routeGeometryMode = getRouteGeometryMode(routeGeometry)
  const estimatedMinutes = parseDurationMinutes(route.durationLabel)

  return {
    id: route.id,
    name: route.name,
    subtitle: route.durationLabel,
    description: route.description,
    theme: ROUTE_THEME_LABELS[route.id] ?? route.tags[0],
    tags: route.tags,
    estimatedMinutes,
    distanceMeters: routeGeometry?.distanceMeters,
    stops,
    geometry: routeGeometry?.path,
    routeGeometry,
    routeGeometryMode,
    cameraPreset: ROUTE_CAMERA_PRESETS[route.id] ?? 'routeOverview',
    color: ROUTE_COLOR,
    source: 'guideData',
    guideDataRouteSource: true,
    unmappedGuideStopCount: stops.filter((stop) => stop.mappingStatus !== 'mapped').length,
    guideRoute: route
  }
}

function resolveScenicRouteStop(stop: GuideRouteStop): ScenicRouteStop {
  const poi = resolveGuideStopPoi(stop)
  const catalogItem = getScenicPoiCatalogItem(poi?.id ?? stop.spotId)
  const guideSpot = guideSpots.find((spot) => spot.id === stop.spotId)
  const location = catalogItem?.coordinate
    ? {
        lat: catalogItem.coordinate.lat,
        lng: catalogItem.coordinate.lng
      }
    : poi
    ? {
        lat: poi.navLocation.lat,
        lng: poi.navLocation.lng
      }
    : guideSpot
      ? {
          lat: guideSpot.lat,
          lng: guideSpot.lng
        }
      : undefined

  return {
    ...stop,
    id: stop.spotId,
    name: poi?.name ?? guideSpot?.name ?? stop.spotId,
    poiId: poi?.id,
    location,
    mappingStatus: poi ? 'mapped' : guideSpot ? 'candidate' : 'unmapped'
  }
}

function resolveGuideStopPoi(stop: GuideRouteStop): LingshanPoi | undefined {
  const aliasedId = GUIDE_STOP_ID_ALIASES[stop.spotId] ?? stop.spotId
  const direct = lingshanPois.find((poi) => poi.id === aliasedId)

  if (direct) {
    return direct
  }

  const guideSpot = guideSpots.find((spot) => spot.id === stop.spotId)
  const searchText = normalizePoiName(guideSpot?.name ?? stop.spotId)

  return lingshanPois.find((poi) => {
    const names = [poi.name, ...poi.aliases]
    return names.some((name) => normalizePoiName(name) === searchText)
  })
}

function getRouteGeometryMode(routeGeometry?: LingshanRouteGeometry): ScenicRouteGeometryMode {
  if (!routeGeometry?.path.length) {
    return 'poi-polyline'
  }

  if (routeGeometry.status === 'verified' || routeGeometry.source === 'manual_verified') {
    return 'real'
  }

  return routeGeometry.source === 'poi_polyline_candidate' ? 'poi-polyline' : 'candidate'
}

function parseDurationMinutes(durationLabel: string) {
  const matched = durationLabel.match(/(\d+(?:\.\d+)?)\s*小时/)

  if (matched) {
    return Math.round(Number(matched[1]) * 60)
  }

  const minutes = durationLabel.match(/(\d+)\s*分钟/)
  return minutes ? Number(minutes[1]) : undefined
}

function normalizePoiName(value: string) {
  return value.replace(/\s+/g, '').replace(/[·・,，。]/g, '').toLowerCase()
}
