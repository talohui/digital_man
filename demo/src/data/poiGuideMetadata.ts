import { guideSpots } from './guideData'
import { getMapModelOverlayByPoiId } from './lingshanMapModelOverlays'
import { getScenicPoiCatalogItem } from './scenicPoiCatalog'

/**
 * Guide-facing POI facts. Recommended stay time remains owned by
 * guideData.guideSpots; this module only provides a single UI-safe lookup.
 */
export function getRecommendedStayMinutes(poiId?: string | null) {
  if (!poiId) return undefined
  return guideSpots.find((spot) => spot.id === poiId)?.stayMinutes
}

export function getRecommendedStayLabel(poiId?: string | null) {
  const minutes = getRecommendedStayMinutes(poiId)
  return minutes === undefined ? '建议停留时间以现场安排为准' : `建议停留${minutes}分钟`
}

export function getPoiGuideDisplayName(poiId?: string | null) {
  if (!poiId) return undefined
  return guideSpots.find((spot) => spot.id === poiId)?.name ?? getScenicPoiCatalogItem(poiId)?.name
}

/**
 * A model is mentioned to visitors only when the existing model registry has
 * a visible, non-missing GLB URL. Runtime loading success is intentionally
 * not inferred here.
 */
export function hasAvailablePoiGlbModel(poiId?: string | null) {
  if (!poiId) return false
  const model = getMapModelOverlayByPoiId(poiId)
  return Boolean(model?.visible && model.modelUrl && model.status !== 'missing_model')
}
