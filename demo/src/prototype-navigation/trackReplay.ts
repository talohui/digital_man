import { haversineDistanceMeters } from '../lib/routeProgress'

import { projectPointToPolyline } from './routeDeviation'
import type {
  Gcj02Position,
  NavigationPrototypeRoute,
  ReplayFix,
  ReplayNoiseMode,
  ReplayScenario
} from './types'

const WALKING_SPEED_METERS_PER_SECOND = 1.2
const BASE_FIX_INTERVAL_MS = 500

type ReplayOptions = {
  noiseMode: ReplayNoiseMode
  seed: number
  startTimestamp: number
}

type ShowcaseDeviationOptions = {
  seed: number
  startTimestamp: number
  startPosition?: Gcj02Position
}

export function createRouteReplay(route: NavigationPrototypeRoute, options: ReplayOptions): ReplayFix[] {
  const points = interpolateRoute(route.polyline, WALKING_SPEED_METERS_PER_SECOND, BASE_FIX_INTERVAL_MS)
  const fixes = points.map((point, index) => createFix({
    point,
    accuracy: accuracyForNoise(options.noiseMode),
    noiseMode: options.noiseMode,
    seed: options.seed,
    index,
    timestamp: options.startTimestamp + index * BASE_FIX_INTERVAL_MS,
    progress: points.length <= 1 ? 1 : index / (points.length - 1),
    scenario: 'route'
  }))
  // Keep three terminal fixes so the existing 35m / three-hit detector can
  // complete naturally rather than receiving a synthetic arrived transition.
  return [1, 2].reduce((all) => {
    const index = all.length
    all.push(createFix({
      point: route.destination,
      accuracy: accuracyForNoise(options.noiseMode),
      noiseMode: options.noiseMode,
      seed: options.seed,
      index,
      timestamp: options.startTimestamp + index * BASE_FIX_INTERVAL_MS,
      progress: 1,
      scenario: 'route'
    }))
    return all
  }, fixes)
}

export function createReplayScenario(route: NavigationPrototypeRoute, scenario: Exclude<ReplayScenario, 'route'>, seed: number, startTimestamp: number): ReplayFix[] {
  if (scenario === 'showcase_off_route') {
    return createShowcaseDeviationReplay(route, { seed, startTimestamp })
  }
  const midpoint = route.polyline[Math.floor(route.polyline.length / 2)] ?? route.destination
  const onRoute = (index: number, timestampOffset: number, point = midpoint, progress = .5) => createFix({
    point,
    accuracy: 8,
    noiseMode: 'clean',
    seed,
    index,
    timestamp: startTimestamp + timestampOffset,
    progress,
    scenario
  })
  const offRoute = (index: number, timestampOffset: number, accuracy: number, distanceMeters = 82) => createFix({
    point: offsetPoint(midpoint, distanceMeters, 0),
    accuracy,
    noiseMode: 'clean',
    seed,
    index,
    timestamp: startTimestamp + timestampOffset,
    progress: .5,
    scenario
  })

  switch (scenario) {
    case 'brief_drift':
      return [onRoute(0, 0), offRoute(1, 4_000, 8), onRoute(2, 5_000)]
    case 'sustained_off_route':
      return [onRoute(0, 0), offRoute(1, 4_000, 8), offRoute(2, 8_000, 8), offRoute(3, 12_000, 8), offRoute(4, 16_000, 8)]
    case 'recovery':
      return [
        onRoute(0, 0), offRoute(1, 4_000, 8), offRoute(2, 8_000, 8), offRoute(3, 12_000, 8), offRoute(4, 16_000, 8),
        onRoute(5, 17_000), onRoute(6, 18_000)
      ]
    case 'low_accuracy_off_route':
      return [onRoute(0, 0), offRoute(1, 4_000, 75), offRoute(2, 8_000, 75), offRoute(3, 12_000, 75), offRoute(4, 16_000, 75)]
    case 'low_accuracy_arrival':
      return [
        onRoute(0, 0, route.destination, 1),
        onRoute(1, 1_000, route.destination, 1),
        onRoute(2, 2_000, route.destination, 1)
      ].map((fix) => ({ ...fix, accuracy: 75 }))
    case 'arrival_jitter': {
      const nearDestination = route.destination
      const outsideArrival = offsetPoint(nearDestination, 50, 180)
      return [
        onRoute(0, 0, nearDestination, 1),
        onRoute(1, 1_000, outsideArrival, .98),
        onRoute(2, 2_000, nearDestination, 1),
        onRoute(3, 3_000, nearDestination, 1),
        onRoute(4, 4_000, nearDestination, 1)
      ]
    }
  }
}

/**
 * Competition-friendly deviation replay. It starts at the nearest point on
 * the current Tencent route, moves smoothly to roughly 82m off-route, then
 * holds enough accurate fixes for the real deviation detector to confirm.
 */
export function createShowcaseDeviationReplay(
  route: NavigationPrototypeRoute,
  options: ShowcaseDeviationOptions
): ReplayFix[] {
  const polyline = route.polyline.length ? route.polyline : [route.origin, route.destination]
  const anchorIndex = findNearestPolylinePointIndex(polyline, options.startPosition ?? route.origin)
  const anchor = polyline[anchorIndex] ?? route.origin
  const before = polyline[Math.max(0, anchorIndex - 1)] ?? anchor
  const after = polyline[Math.min(polyline.length - 1, anchorIndex + 1)] ?? anchor
  const routeBearing = bearingDegrees(before, after)
  const deviationTarget = selectShowcaseDeviationTarget(anchor, routeBearing, polyline)
  const routeProgress = anchorIndex / Math.max(polyline.length - 1, 1)
  const outwardDistances = [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, deviationTarget.distanceMeters]
    .filter((distance, index, distances) => distance <= deviationTarget.distanceMeters && distance !== distances[index - 1])
  const travel = outwardDistances.map((distanceMeters, index) => createFix({
    point: offsetPoint(anchor, distanceMeters, deviationTarget.bearing),
    accuracy: 8,
    noiseMode: 'clean',
    seed: options.seed,
    index,
    timestamp: options.startTimestamp + index * 1_000,
    progress: routeProgress,
    scenario: 'showcase_off_route'
  }))
  const travelDuration = outwardDistances.length * 1_000
  // Hold the selected point long enough for both hit-count and duration gates.
  // Repeating accepted fixes still exercises the real detector; it does not
  // mutate deviation state directly.
  const confirmationDistances = Array.from({ length: 4 }, () => deviationTarget.distanceMeters)
  const confirmation = confirmationDistances.map((distanceMeters, index) => createFix({
    point: offsetPoint(anchor, distanceMeters, deviationTarget.bearing),
    accuracy: 8,
    noiseMode: 'clean',
    seed: options.seed,
    index: travel.length + index,
    timestamp: options.startTimestamp + travelDuration + index * 4_000,
    progress: routeProgress,
    scenario: 'showcase_off_route'
  }))
  return [...travel, ...confirmation]
}

/**
 * A fixed perpendicular offset is not reliable on a curved route: the point
 * may leave one segment only to land beside another. Sample bounded bearings
 * and radii, then choose the candidate farthest from the complete Tencent
 * polyline. The visible movement remains a smooth 82–94m drift.
 */
function selectShowcaseDeviationTarget(
  anchor: Gcj02Position,
  routeBearing: number,
  polyline: Gcj02Position[]
) {
  const relativeBearings = [90, -90, 180, 45, -45, 135, -135, 0]
  const fallbackBearings = Array.from({ length: 12 }, (_, index) => index * 30)
  const bearings = [
    ...relativeBearings.map((offset) => (routeBearing + offset + 360) % 360),
    ...fallbackBearings
  ]
  const radii = [82, 88, 94]
  let best = {
    bearing: (routeBearing + 90) % 360,
    distanceMeters: radii[0],
    distanceToRouteMeters: 0
  }

  radii.forEach((distanceMeters) => {
    bearings.forEach((bearing) => {
      const candidate = offsetPoint(anchor, distanceMeters, bearing)
      const distanceToRouteMeters = projectPointToPolyline({ position: candidate, polyline })
        ?.distanceToRouteMeters ?? 0
      if (distanceToRouteMeters <= best.distanceToRouteMeters) return
      best = { bearing, distanceMeters, distanceToRouteMeters }
    })
  })

  return best
}

export function interpolateRoute(polyline: Gcj02Position[], speedMetersPerSecond: number, intervalMs: number): Gcj02Position[] {
  if (polyline.length < 2) return polyline
  const spacingMeters = Math.max(.25, speedMetersPerSecond * intervalMs / 1_000)
  const points: Gcj02Position[] = [polyline[0]]
  for (let index = 0; index < polyline.length - 1; index += 1) {
    const start = polyline[index]
    const end = polyline[index + 1]
    const distance = haversineDistanceMeters(start, end)
    const segments = Math.max(1, Math.ceil(distance / spacingMeters))
    for (let segment = 1; segment <= segments; segment += 1) {
      const progress = segment / segments
      points.push({
        lat: start.lat + (end.lat - start.lat) * progress,
        lng: start.lng + (end.lng - start.lng) * progress,
        coordinateSystem: 'GCJ-02'
      })
    }
  }
  return points
}

function createFix(input: {
  point: Gcj02Position
  accuracy: number
  noiseMode: ReplayNoiseMode
  seed: number
  index: number
  timestamp: number
  progress: number
  scenario: ReplayScenario
}): ReplayFix {
  const noisyPoint = applyNoise(input.point, input.noiseMode, input.seed, input.index)
  return {
    ...noisyPoint,
    accuracy: input.accuracy,
    timestamp: input.timestamp,
    source: 'replay-gcj02',
    replayProgress: input.progress,
    replayScenario: input.scenario,
    seed: input.seed
  }
}

function accuracyForNoise(mode: ReplayNoiseMode) {
  if (mode === 'clean') return 8
  if (mode === 'normal') return 18
  if (mode === 'poor') return 65
  return 120
}

function applyNoise(point: Gcj02Position, mode: ReplayNoiseMode, seed: number, index: number): Gcj02Position {
  // Keep clean replay exactly on the Tencent polyline so progress monotonicity
  // and step-boundary behaviour are deterministic during local verification.
  const [min, max] = mode === 'clean' ? [0, 0] : mode === 'normal' ? [3, 10] : mode === 'poor' ? [15, 40] : [20, 35]
  const magnitude = min + deterministicUnit(seed, index * 2) * (max - min)
  const bearingRadians = deterministicUnit(seed, index * 2 + 1) * Math.PI * 2
  return offsetPoint(point, magnitude, bearingRadians * 180 / Math.PI)
}

function offsetPoint(point: Gcj02Position, meters: number, bearingDegrees: number): Gcj02Position {
  const radians = bearingDegrees * Math.PI / 180
  const latOffset = meters * Math.cos(radians) / 111_320
  const lngOffset = meters * Math.sin(radians) / Math.max(1, 111_320 * Math.cos(point.lat * Math.PI / 180))
  return { lat: point.lat + latOffset, lng: point.lng + lngOffset, coordinateSystem: 'GCJ-02' }
}

function findNearestPolylinePointIndex(polyline: Gcj02Position[], position: Gcj02Position) {
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  polyline.forEach((point, index) => {
    const distance = haversineDistanceMeters(point, position)
    if (distance >= nearestDistance) return
    nearestDistance = distance
    nearestIndex = index
  })
  return nearestIndex
}

function bearingDegrees(start: Gcj02Position, end: Gcj02Position) {
  if (start.lat === end.lat && start.lng === end.lng) return 0
  const startLat = start.lat * Math.PI / 180
  const endLat = end.lat * Math.PI / 180
  const deltaLng = (end.lng - start.lng) * Math.PI / 180
  const y = Math.sin(deltaLng) * Math.cos(endLat)
  const x = Math.cos(startLat) * Math.sin(endLat)
    - Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function deterministicUnit(seed: number, index: number) {
  let value = (seed + index * 0x6d2b79f5) >>> 0
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
}
