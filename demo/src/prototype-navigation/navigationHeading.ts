import type { ConvertedGcj02Location, NavigationHeadingSnapshot } from './types'

const MIN_GPS_HEADING_SPEED_MPS = .8
const MAX_HEADING_ACCURACY_METERS = 50

export function resolveNavigationHeading(input: {
  location: ConvertedGcj02Location
  deviceHeading?: number
  routeBearing?: number
}): NavigationHeadingSnapshot {
  const geolocationHeading = normalize(input.location.headingDegrees)
  const deviceHeading = normalize(input.deviceHeading)
  const routeBearing = normalize(input.routeBearing)
  const canUseGps = geolocationHeading !== undefined
    && (input.location.speedMps ?? 0) >= MIN_GPS_HEADING_SPEED_MPS
    && input.location.accuracy <= MAX_HEADING_ACCURACY_METERS
  const source = canUseGps
    ? 'geolocation'
    : deviceHeading !== undefined
      ? 'device-orientation'
      : routeBearing !== undefined
        ? 'route-bearing'
        : 'unavailable'
  return {
    geolocationHeading,
    deviceHeading,
    routeBearing,
    selectedHeading: source === 'geolocation' ? geolocationHeading : source === 'device-orientation' ? deviceHeading : source === 'route-bearing' ? routeBearing : undefined,
    source,
    speedMps: input.location.speedMps,
    updatedAt: input.location.timestamp
  }
}

function normalize(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) ? (value % 360 + 360) % 360 : undefined
}
