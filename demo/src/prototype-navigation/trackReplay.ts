import { haversineDistanceMeters } from '../lib/routeProgress'

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

function deterministicUnit(seed: number, index: number) {
  let value = (seed + index * 0x6d2b79f5) >>> 0
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
}
