import { lingshanPois } from '../data/lingshanMapData'
import { toGcj02Position } from './coordinateTransform'
import type { PrototypeNavigationTarget } from './types'

export function resolvePoiNavigationTarget(
  poiId: string | undefined,
  fallbackName?: string
): PrototypeNavigationTarget | undefined {
  if (!poiId) return undefined
  const poi = lingshanPois.find((item) => item.id === poiId)
  if (!poi?.navLocation) return undefined

  return {
    mode: 'free-poi',
    poiId: poi.id,
    name: poi.name || fallbackName || poiId,
    coordinate: toGcj02Position(poi.navLocation)
  }
}

export function samePoiNavigationTarget(
  left: PrototypeNavigationTarget | undefined,
  right: PrototypeNavigationTarget | undefined
) {
  if (!left || !right) return false
  return left.mode === right.mode && left.poiId === right.poiId
}
