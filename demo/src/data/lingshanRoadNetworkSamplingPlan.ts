import { guideRoutes, guideSpots, type LatLngPoint } from './guideData'

export type RoadSamplingPairSource =
  | 'guide_route_adjacent'
  | 'poi_nearby'
  | 'core_anchor'

export type RoadSamplingPair = {
  id: string
  fromPoiId: string
  toPoiId: string
  source: RoadSamplingPairSource
  guideRouteId?: string
  distanceMetersApprox?: number
  priority: 'high' | 'medium' | 'low'
  notes?: string
}

export type RoadNetworkSamplingPlan = {
  version: string
  generatedFrom: {
    poiCount: number
    guideRouteCount: number
    nearbyThresholdMeters: number
  }
  pairs: RoadSamplingPair[]
}

const NEARBY_THRESHOLD_METERS = 350
const CORE_ANCHOR_THRESHOLD_METERS = 500
const CORE_ANCHOR_IDS = [
  'south_gate',
  'shengjing_square',
  'jiulong_guanyu',
  'giant_buddha',
  'fan_gong',
  'wuyin_tancheng',
  'exit',
]

const sourceRank: Record<RoadSamplingPairSource, number> = {
  guide_route_adjacent: 3,
  poi_nearby: 2,
  core_anchor: 1,
}

function haversineDistanceMeters(left: LatLngPoint, right: LatLngPoint) {
  const earthRadiusMeters = 6371000
  const toRadians = (degree: number) => (degree * Math.PI) / 180
  const latDelta = toRadians(right.lat - left.lat)
  const lngDelta = toRadians(right.lng - left.lng)
  const leftLat = toRadians(left.lat)
  const rightLat = toRadians(right.lat)
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(lngDelta / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMeters * c
}

function getSpotLocation(spotId: string): LatLngPoint | undefined {
  const spot = guideSpots.find((item) => item.id === spotId)

  if (!spot) {
    return undefined
  }

  return {
    lat: spot.lat,
    lng: spot.lng,
  }
}

function getDistanceBetweenPois(fromPoiId: string, toPoiId: string) {
  const fromLocation = getSpotLocation(fromPoiId)
  const toLocation = getSpotLocation(toPoiId)

  if (!fromLocation || !toLocation) {
    return undefined
  }

  return Math.round(haversineDistanceMeters(fromLocation, toLocation))
}

function getPairKey(fromPoiId: string, toPoiId: string) {
  return [fromPoiId, toPoiId].sort().join('__')
}

function createPairId(source: RoadSamplingPairSource, fromPoiId: string, toPoiId: string, guideRouteId?: string) {
  if (source === 'guide_route_adjacent') {
    return `guide_${guideRouteId}_${fromPoiId}__${toPoiId}`
  }

  if (source === 'poi_nearby') {
    return `nearby_${fromPoiId}__${toPoiId}`
  }

  return `anchor_${fromPoiId}__${toPoiId}`
}

function addPair(
  pairMap: Map<string, RoadSamplingPair>,
  pair: Omit<RoadSamplingPair, 'id'> & { id?: string }
) {
  const pairKey = getPairKey(pair.fromPoiId, pair.toPoiId)
  const existingPair = pairMap.get(pairKey)

  if (existingPair && sourceRank[existingPair.source] >= sourceRank[pair.source]) {
    return
  }

  pairMap.set(pairKey, {
    ...pair,
    id: pair.id ?? createPairId(pair.source, pair.fromPoiId, pair.toPoiId, pair.guideRouteId),
  })
}

function buildGuideRouteAdjacentPairs(pairMap: Map<string, RoadSamplingPair>) {
  guideRoutes.forEach((route) => {
    route.stops.forEach((stop, index) => {
      const nextStop = route.stops[index + 1]

      if (!nextStop) {
        return
      }

      addPair(pairMap, {
        fromPoiId: stop.spotId,
        toPoiId: nextStop.spotId,
        source: 'guide_route_adjacent',
        guideRouteId: route.id,
        distanceMetersApprox: getDistanceBetweenPois(stop.spotId, nextStop.spotId),
        priority: 'high',
        notes: '来自 guideRoutes 相邻站点，优先作为道路网络采样段。',
      })
    })
  })
}

function buildNearbyPoiPairs(pairMap: Map<string, RoadSamplingPair>) {
  guideSpots.forEach((fromSpot, fromIndex) => {
    guideSpots.slice(fromIndex + 1).forEach((toSpot) => {
      const distanceMetersApprox = getDistanceBetweenPois(fromSpot.id, toSpot.id)

      if (!distanceMetersApprox || distanceMetersApprox > NEARBY_THRESHOLD_METERS) {
        return
      }

      addPair(pairMap, {
        fromPoiId: fromSpot.id,
        toPoiId: toSpot.id,
        source: 'poi_nearby',
        distanceMetersApprox,
        priority: 'medium',
        notes: `POI 近邻采样候选，距离约 ${distanceMetersApprox}m。`,
      })
    })
  })
}

function buildCoreAnchorPairs(pairMap: Map<string, RoadSamplingPair>) {
  const anchorSet = new Set(CORE_ANCHOR_IDS)

  CORE_ANCHOR_IDS.forEach((anchorId) => {
    guideSpots.forEach((spot) => {
      if (spot.id === anchorId) {
        return
      }

      const distanceMetersApprox = getDistanceBetweenPois(anchorId, spot.id)

      if (!distanceMetersApprox || distanceMetersApprox > CORE_ANCHOR_THRESHOLD_METERS) {
        return
      }

      addPair(pairMap, {
        fromPoiId: anchorId,
        toPoiId: spot.id,
        source: 'core_anchor',
        distanceMetersApprox,
        priority: distanceMetersApprox <= NEARBY_THRESHOLD_METERS || anchorSet.has(spot.id) ? 'medium' : 'low',
        notes: `核心锚点补充采样候选，距离约 ${distanceMetersApprox}m。`,
      })
    })
  })
}

function buildSamplingPairs() {
  const pairMap = new Map<string, RoadSamplingPair>()

  buildGuideRouteAdjacentPairs(pairMap)
  buildNearbyPoiPairs(pairMap)
  buildCoreAnchorPairs(pairMap)

  return Array.from(pairMap.values()).sort((left, right) => {
    const sourceDiff = sourceRank[right.source] - sourceRank[left.source]

    if (sourceDiff !== 0) {
      return sourceDiff
    }

    return left.id.localeCompare(right.id)
  })
}

// 本文件只是 Tencent walking route 采样计划，不包含真实 walking path，
// 不代表官方道路。下一阶段才会基于这些 pair 调用腾讯 walking route
// 生成 candidate roadNetwork segments。
export const lingshanRoadNetworkSamplingPlan: RoadNetworkSamplingPlan = {
  version: '2026-06-03-road-network-sampling-plan-v1',
  generatedFrom: {
    poiCount: guideSpots.length,
    guideRouteCount: guideRoutes.length,
    nearbyThresholdMeters: NEARBY_THRESHOLD_METERS,
  },
  pairs: buildSamplingPairs(),
}

export function getRoadSamplingPairs() {
  return lingshanRoadNetworkSamplingPlan.pairs
}

export function getRoadSamplingPairsBySource(source: RoadSamplingPairSource) {
  return lingshanRoadNetworkSamplingPlan.pairs.filter((pair) => pair.source === source)
}
