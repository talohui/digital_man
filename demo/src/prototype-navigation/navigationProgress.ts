import { findNearestRoutePoint, haversineDistanceMeters } from '../lib/routeProgress'

import type {
  NavigationPrototypeLocation,
  NavigationPrototypeProgress,
  NavigationPrototypeRoute
} from './types'

export function buildNavigationPrototypeProgress(
  route: NavigationPrototypeRoute,
  location: NavigationPrototypeLocation
): NavigationPrototypeProgress {
  const nearest = findNearestRoutePoint(location, route.polyline)
  const nearestPolylineIndex = nearest?.nearestIndex ?? 0
  const distanceRemainingMeters = Math.round(haversineDistanceMeters(location, route.destination))
  const metersPerMinute = route.distanceMeters / Math.max(route.durationMinutes, 1)
  const durationRemainingMinutes = distanceRemainingMeters === 0
    ? 0
    : Math.max(1, Math.ceil(distanceRemainingMeters / Math.max(metersPerMinute, 1)))
  const currentStepIndex = resolveCurrentStepIndex(route, nearestPolylineIndex)

  return {
    distanceRemainingMeters,
    durationRemainingMinutes,
    currentStepIndex,
    currentInstruction: route.steps[currentStepIndex]?.instruction,
    nearestPolylineIndex
  }
}

function resolveCurrentStepIndex(route: NavigationPrototypeRoute, nearestPolylineIndex: number) {
  if (route.steps.length === 0) {
    return 0
  }

  const indexedStep = route.steps.findIndex((step) => {
    const indexes = step.polylineIndexes
    if (!indexes?.length) return false
    return Math.max(...indexes) >= nearestPolylineIndex
  })

  if (indexedStep >= 0) {
    return indexedStep
  }

  const progressRatio = route.polyline.length > 1
    ? nearestPolylineIndex / (route.polyline.length - 1)
    : 0
  return Math.min(route.steps.length - 1, Math.floor(progressRatio * route.steps.length))
}
