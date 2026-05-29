export type LatLngPoint = {
  lat: number
  lng: number
}

export type RouteStopLike = {
  spotId: string
}

export type RouteSpotLike = LatLngPoint & {
  id: string
  name: string
}

export type NearestRoutePointResult = {
  nearestPoint: LatLngPoint
  nearestIndex: number
  distanceMeters: number
  progressRatio: number
}

export type NextStopResult = {
  nextStopId: string | null
  nextStopName?: string
  distanceToNextStopMeters?: number
}

export function haversineDistanceMeters(a: LatLngPoint, b: LatLngPoint) {
  const earthRadiusMeters = 6371000
  const fromLat = degreesToRadians(a.lat)
  const toLat = degreesToRadians(b.lat)
  const deltaLat = degreesToRadians(b.lat - a.lat)
  const deltaLng = degreesToRadians(b.lng - a.lng)
  const value =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const angle = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))

  return earthRadiusMeters * angle
}

export function findNearestRoutePoint(position: LatLngPoint, path: LatLngPoint[]): NearestRoutePointResult | null {
  if (path.length === 0) {
    return null
  }

  let nearestPoint = path[0]
  let nearestIndex = 0
  let distanceMeters = haversineDistanceMeters(position, nearestPoint)

  for (let index = 1; index < path.length; index += 1) {
    const point = path[index]
    const distance = haversineDistanceMeters(position, point)

    if (distance < distanceMeters) {
      nearestPoint = point
      nearestIndex = index
      distanceMeters = distance
    }
  }

  return {
    nearestPoint,
    nearestIndex,
    distanceMeters,
    progressRatio: path.length > 1 ? nearestIndex / (path.length - 1) : 0
  }
}

export function findNextStop(
  position: LatLngPoint,
  routeStops: RouteStopLike[],
  spotLookup: (spotId: string) => RouteSpotLike | undefined
): NextStopResult {
  const routeSpotEntries = routeStops
    .map((stop, index) => {
      const spot = spotLookup(stop.spotId)

      if (!spot) {
        return null
      }

      return {
        index,
        spot,
        distanceMeters: haversineDistanceMeters(position, spot)
      }
    })
    .filter((entry): entry is { index: number; spot: RouteSpotLike; distanceMeters: number } => entry !== null)

  if (routeSpotEntries.length === 0) {
    return { nextStopId: null }
  }

  const nearestEntry = routeSpotEntries.reduce((nearest, entry) =>
    entry.distanceMeters < nearest.distanceMeters ? entry : nearest
  )
  const nextEntry =
    nearestEntry.distanceMeters > 80
      ? nearestEntry
      : routeSpotEntries.find((entry) => entry.index > nearestEntry.index) ?? nearestEntry

  return {
    nextStopId: nextEntry.spot.id,
    nextStopName: nextEntry.spot.name,
    distanceToNextStopMeters: haversineDistanceMeters(position, nextEntry.spot)
  }
}

export function formatDistanceMeters(distance: number) {
  if (distance < 1000) {
    return `${Math.round(distance)} 米`
  }

  return `${(distance / 1000).toFixed(1)} 公里`
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}
