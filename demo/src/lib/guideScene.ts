export const TOUR_GUIDE_SCENE_ID = 'tour-guide'
export const GUIDE_GPS_CONFIDENCE_THRESHOLD = 0.65

export type GuideLocationSource =
  | 'spot-page'
  | 'map-selection'
  | 'route-progress'
  | 'gps'
  | 'route-default'

export interface GuideSpotContextInput {
  spotPageId?: string | null
  mapSelectedId?: string | null
  routeProgressId?: string | null
  gpsSpotId?: string | null
  gpsConfidence?: number | null
  defaultSpotId: string
}

export interface ResolvedGuideSpotContext {
  spotId: string
  source: GuideLocationSource
  confidence: number
}

export function resolveGuideSpotContext({
  spotPageId,
  mapSelectedId,
  routeProgressId,
  gpsSpotId,
  gpsConfidence,
  defaultSpotId
}: GuideSpotContextInput): ResolvedGuideSpotContext {
  if (spotPageId) return { spotId: spotPageId, source: 'spot-page', confidence: 1 }
  if (mapSelectedId) return { spotId: mapSelectedId, source: 'map-selection', confidence: 1 }
  if (routeProgressId) return { spotId: routeProgressId, source: 'route-progress', confidence: 1 }

  if (
    gpsSpotId &&
    typeof gpsConfidence === 'number' &&
    gpsConfidence >= GUIDE_GPS_CONFIDENCE_THRESHOLD
  ) {
    return { spotId: gpsSpotId, source: 'gps', confidence: gpsConfidence }
  }

  return { spotId: defaultSpotId, source: 'route-default', confidence: 1 }
}
