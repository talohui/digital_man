import { haversineDistanceMeters } from '../lib/routeProgress'
import { getPrototypeStepInstruction } from './prototypeNavigationPrompt'
import { projectPointToPolyline } from './routeDeviation'

import type {
  ConvertedGcj02Location,
  Gcj02Position,
  NavigationPrototypeProgress,
  NavigationPrototypeRoute,
  NavigationPrototypeStep
} from './types'

type RouteMetrics = {
  segmentLengths: number[]
  cumulativeMeters: number[]
  totalRouteMeters: number
}

type StepRange = {
  stepIndex: number
  startIndex: number
  endIndex: number
}

const routeMetricsCache = new WeakMap<NavigationPrototypeRoute, RouteMetrics>()

/**
 * One projection-based source of truth for the blue-dot, route remaining and
 * step candidate. All values describe the Tencent GCJ-02 walking polyline.
 */
export function buildNavigationPrototypeProgress(
  route: NavigationPrototypeRoute,
  location: ConvertedGcj02Location,
  confirmedStepIndex?: number
): NavigationPrototypeProgress {
  const metrics = getRouteMetrics(route)
  const projection = projectPointToPolyline({ position: location, polyline: route.polyline })
  const nearestSegmentIndex = projection?.nearestSegmentIndex ?? 0
  const segmentProgress = projection?.segmentProgress ?? 0
  const projectedPosition = projection?.nearestPoint ?? route.polyline[0] ?? route.destination
  const segmentLength = metrics.segmentLengths[nearestSegmentIndex] ?? 0
  const alongRouteMeters = clamp(
    (metrics.cumulativeMeters[nearestSegmentIndex] ?? 0) + segmentLength * segmentProgress,
    0,
    metrics.totalRouteMeters
  )
  const nearestPolylineIndex = nearestSegmentIndex + (segmentProgress >= .5 ? 1 : 0)
  const candidateStepIndex = resolveStepIndexFromAlongRouteMeters({
    alongRouteMeters,
    steps: route.steps,
    metrics,
    polylinePointCount: route.polyline.length
  })
  const currentStepIndex = clampStepIndex(confirmedStepIndex ?? candidateStepIndex, route.steps.length)
  const currentStepEndAlongMeters = getStepEndAlongMeters(currentStepIndex, route.steps, metrics, route.polyline.length)
  const remainingRouteMeters = Math.max(0, metrics.totalRouteMeters - alongRouteMeters)
  const durationRemainingMinutes = remainingRouteMeters <= 1
    ? 0
    : Math.max(1, Math.ceil(route.durationMinutes * (remainingRouteMeters / Math.max(metrics.totalRouteMeters, 1))))

  return {
    distanceRemainingMeters: Math.round(remainingRouteMeters),
    distanceToDestinationMeters: Math.round(haversineDistanceMeters(location, route.destination)),
    durationRemainingMinutes,
    currentStepIndex,
    currentInstruction: getPrototypeStepInstruction(route.steps[currentStepIndex]),
    nextInstruction: route.steps[currentStepIndex + 1]
      ? getPrototypeStepInstruction(route.steps[currentStepIndex + 1])
      : undefined,
    nearestPolylineIndex: clamp(nearestPolylineIndex, 0, Math.max(route.polyline.length - 1, 0)),
    nearestSegmentIndex,
    projectedPosition,
    segmentProgress,
    alongRouteMeters: Math.round(alongRouteMeters * 10) / 10,
    totalRouteMeters: Math.round(metrics.totalRouteMeters * 10) / 10,
    remainingRouteMeters: Math.round(remainingRouteMeters * 10) / 10,
    currentStepEndAlongMeters: Math.round(currentStepEndAlongMeters * 10) / 10,
    distanceToCurrentStepEndMeters: Math.round(Math.max(0, currentStepEndAlongMeters - alongRouteMeters) * 10) / 10,
    routeBearingDegrees: getRouteBearingDegrees(route, metrics, alongRouteMeters)
  }
}

export function getRouteMetrics(route: NavigationPrototypeRoute): RouteMetrics {
  const cached = routeMetricsCache.get(route)
  if (cached) return cached

  const segmentLengths = route.polyline.slice(0, -1).map((point, index) => {
    const next = route.polyline[index + 1]
    return next ? haversineDistanceMeters(point, next) : 0
  })
  const cumulativeMeters = [0]
  segmentLengths.forEach((length) => cumulativeMeters.push(cumulativeMeters[cumulativeMeters.length - 1] + length))
  const metrics = { segmentLengths, cumulativeMeters, totalRouteMeters: cumulativeMeters[cumulativeMeters.length - 1] ?? 0 }
  routeMetricsCache.set(route, metrics)
  return metrics
}

export function resolveStepIndexFromPolylineIndex(input: {
  nearestPolylineIndex: number
  steps: NavigationPrototypeStep[]
  polylinePointCount?: number
}) {
  const { nearestPolylineIndex, steps, polylinePointCount } = input
  if (!steps.length) return 0
  const ranges = getStepRanges(steps)
  if (!ranges.length) return resolveMissingIndexFallback(nearestPolylineIndex, steps.length, polylinePointCount)
  for (const range of ranges) {
    if (nearestPolylineIndex <= range.endIndex) return range.stepIndex
  }
  return steps.length - 1
}

export function getStepEndAlongMeters(
  stepIndex: number,
  steps: NavigationPrototypeStep[],
  metrics: RouteMetrics,
  polylinePointCount: number
) {
  if (!steps.length) return metrics.totalRouteMeters
  const range = getStepRanges(steps).find((item) => item.stepIndex === clampStepIndex(stepIndex, steps.length))
  if (!range) {
    const ratio = (clampStepIndex(stepIndex, steps.length) + 1) / steps.length
    return metrics.totalRouteMeters * ratio
  }
  const pointIndex = clamp(range.endIndex, 0, Math.max(polylinePointCount - 1, 0))
  return metrics.cumulativeMeters[pointIndex] ?? metrics.totalRouteMeters
}

function resolveStepIndexFromAlongRouteMeters(input: {
  alongRouteMeters: number
  steps: NavigationPrototypeStep[]
  metrics: RouteMetrics
  polylinePointCount: number
}) {
  if (!input.steps.length) return 0
  for (let index = 0; index < input.steps.length; index += 1) {
    if (input.alongRouteMeters <= getStepEndAlongMeters(index, input.steps, input.metrics, input.polylinePointCount)) return index
  }
  return input.steps.length - 1
}

function getRouteBearingDegrees(route: NavigationPrototypeRoute, metrics: RouteMetrics, alongRouteMeters: number) {
  if (route.polyline.length < 2) return undefined
  const from = positionAlongRoute(route, metrics, alongRouteMeters)
  const to = positionAlongRoute(route, metrics, Math.min(metrics.totalRouteMeters, alongRouteMeters + 12))
  if (!from || !to || (from.lat === to.lat && from.lng === to.lng)) return undefined
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
  return normalizeDegrees(Math.atan2(y, x) * 180 / Math.PI)
}

function positionAlongRoute(route: NavigationPrototypeRoute, metrics: RouteMetrics, alongRouteMeters: number): Gcj02Position | undefined {
  const target = clamp(alongRouteMeters, 0, metrics.totalRouteMeters)
  for (let index = 0; index < metrics.segmentLengths.length; index += 1) {
    const start = metrics.cumulativeMeters[index]
    const length = metrics.segmentLengths[index]
    if (target <= start + length || index === metrics.segmentLengths.length - 1) {
      const progress = length > 0 ? clamp((target - start) / length, 0, 1) : 0
      const first = route.polyline[index]
      const second = route.polyline[index + 1]
      if (!first || !second) return first
      return { lat: first.lat + (second.lat - first.lat) * progress, lng: first.lng + (second.lng - first.lng) * progress, coordinateSystem: 'GCJ-02' }
    }
  }
  return route.polyline[route.polyline.length - 1]
}

function getStepRanges(steps: NavigationPrototypeStep[]): StepRange[] {
  return steps.flatMap((step, stepIndex) => {
    const indexes = step.polylineIndexes?.filter((index) => Number.isInteger(index)) ?? []
    return indexes.length ? [{ stepIndex, startIndex: Math.min(...indexes), endIndex: Math.max(...indexes) }] : []
  })
}

function resolveMissingIndexFallback(nearestPolylineIndex: number, stepCount: number, polylinePointCount?: number) {
  if (stepCount <= 1) return 0
  const denominator = Math.max((polylinePointCount ?? stepCount) - 1, 1)
  return Math.min(stepCount - 1, Math.max(0, Math.floor((nearestPolylineIndex / denominator) * stepCount)))
}

function clampStepIndex(index: number, stepCount: number) {
  if (!stepCount) return 0
  return Math.min(Math.max(index, 0), stepCount - 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function toRadians(value: number) {
  return value * Math.PI / 180
}

function normalizeDegrees(value: number) {
  return (value % 360 + 360) % 360
}
