import { haversineDistanceMeters } from '../lib/routeProgress'

import type { Gcj02Position } from './types'

export type RouteProjection = {
  distanceToRouteMeters: number
  nearestSegmentIndex: number
  nearestPoint: Gcj02Position
  segmentProgress: number
}

/**
 * Finds the closest point on a decoded navigation polyline. The walking
 * prototype only operates at scenic-area scale, so a local equirectangular
 * projection is both stable and easier to test than comparing route vertices.
 */
export function projectPointToPolyline(input: {
  position: Gcj02Position
  polyline: Gcj02Position[]
}): RouteProjection | undefined {
  const { position, polyline } = input
  if (!isValidPoint(position)) return undefined

  const validPoints = polyline
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => isValidPoint(point))
  if (!validPoints.length) return undefined
  if (validPoints.length === 1) {
    return {
      distanceToRouteMeters: haversineDistanceMeters(position, validPoints[0].point),
      nearestSegmentIndex: validPoints[0].index,
      nearestPoint: validPoints[0].point,
      segmentProgress: 0
    }
  }

  const latitudeRadians = toRadians(position.lat)
  const metersPerLatitudeDegree = 111_320
  const metersPerLongitudeDegree = Math.max(1, metersPerLatitudeDegree * Math.cos(latitudeRadians))
  const toLocalMeters = (point: Gcj02Position) => ({
    x: (point.lng - position.lng) * metersPerLongitudeDegree,
    y: (point.lat - position.lat) * metersPerLatitudeDegree
  })

  let nearest: RouteProjection | undefined

  for (let index = 0; index < polyline.length - 1; index += 1) {
    const start = polyline[index]
    const end = polyline[index + 1]
    if (!isValidPoint(start) || !isValidPoint(end)) continue
    const startMeters = toLocalMeters(start)
    const endMeters = toLocalMeters(end)
    const dx = endMeters.x - startMeters.x
    const dy = endMeters.y - startMeters.y
    const lengthSquared = dx * dx + dy * dy
    const unclampedProgress = lengthSquared > 0
      ? ((-startMeters.x * dx) + (-startMeters.y * dy)) / lengthSquared
      : 0
    const segmentProgress = clamp(unclampedProgress, 0, 1)
    const nearestPoint = {
      lat: start.lat + (end.lat - start.lat) * segmentProgress,
      lng: start.lng + (end.lng - start.lng) * segmentProgress,
      coordinateSystem: 'GCJ-02' as const
    }
    const distanceToRouteMeters = Math.hypot(
      startMeters.x + dx * segmentProgress,
      startMeters.y + dy * segmentProgress
    )

    if (!nearest || distanceToRouteMeters < nearest.distanceToRouteMeters) {
      nearest = { distanceToRouteMeters, nearestSegmentIndex: index, nearestPoint, segmentProgress }
    }
  }

  if (nearest) return nearest

  // A broken polyline with no valid adjacent pair still degrades safely to a
  // real point distance rather than creating an artificial segment across it.
  const closestPoint = validPoints.reduce((closest, candidate) => {
    const distance = haversineDistanceMeters(position, candidate.point)
    return !closest || distance < closest.distance ? { ...candidate, distance } : closest
  }, undefined as { point: Gcj02Position; index: number; distance: number } | undefined)

  return closestPoint
    ? {
        distanceToRouteMeters: closestPoint.distance,
        nearestSegmentIndex: closestPoint.index,
        nearestPoint: closestPoint.point,
        segmentProgress: 0
      }
    : undefined
}

function isValidPoint(point: Gcj02Position) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function toRadians(value: number) {
  return value * Math.PI / 180
}
