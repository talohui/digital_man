import { toGcj02Position } from './coordinateTransform'
import type { ScenicRouteConfig } from '../data/lingshanScenicRoutes'
import type { PrototypeNavigationTarget } from './types'

export type RouteTargetResolution =
  | { target: PrototypeNavigationTarget }
  | { target?: undefined; error: string }

export function resolveRouteSegmentTarget(input: {
  route: ScenicRouteConfig
  stage: 'joining' | 'active'
  currentStopIndex: number
  joinStopIndex?: number
}): RouteTargetResolution {
  const targetStopIndex = input.stage === 'joining'
    ? input.joinStopIndex
    : input.currentStopIndex + 1
  if (targetStopIndex === undefined || targetStopIndex < 0 || targetStopIndex >= input.route.stops.length) {
    return { error: input.stage === 'active' ? '路线已完成' : '加入站点无效' }
  }
  const stop = input.route.stops[targetStopIndex]
  const poiId = stop.poiId ?? stop.id
  if (!stop.location || !poiId) return { error: '该站点导航位置尚未完善' }
  return {
    target: {
      mode: input.stage === 'joining' ? 'joining' : 'route-segment',
      routeId: input.route.id,
      fromStopIndex: input.stage === 'active' ? input.currentStopIndex : undefined,
      targetStopIndex,
      poiId,
      name: stop.name,
      coordinate: toGcj02Position(stop.location)
    }
  }
}
