import type { BrowserWgs84Location } from './types'

export type PrototypeGeolocationError = {
  message: string
}

/** Minimal Browser Geolocation adapter for the navigation prototype only. */
export function watchPrototypeLocation(input: {
  onLocation: (location: BrowserWgs84Location) => void
  onError: (error: PrototypeGeolocationError) => void
}) {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    input.onError({ message: '当前浏览器不支持定位' })
    return () => undefined
  }

  let watchId: number | null = null

  try {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        input.onLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          coordinateSystem: 'WGS84',
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speedMps: finiteOrUndefined(position.coords.speed),
          headingDegrees: normalizeHeading(position.coords.heading)
        })
      },
      (error) => input.onError({ message: normalizeGeolocationError(error) }),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )
  } catch (error) {
    input.onError({ message: error instanceof Error ? error.message : '无法启动定位' })
  }

  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
    }
  }
}

function finiteOrUndefined(value: number | null) {
  return value !== null && Number.isFinite(value) ? value : undefined
}

function normalizeHeading(value: number | null) {
  const heading = finiteOrUndefined(value)
  return heading === undefined ? undefined : (heading % 360 + 360) % 360
}

function normalizeGeolocationError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return '用户拒绝定位权限'
  if (error.code === error.POSITION_UNAVAILABLE) return '当前位置不可用'
  if (error.code === error.TIMEOUT) return '定位超时'
  return error.message || '无法获取当前位置'
}
