export type BrowserLocation = {
  lat: number
  lng: number
  accuracyMeters: number
  timestamp: number
  source: 'gps' | 'mock'
}

export type GeolocationErrorState = {
  code?: number
  message: string
}

export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

export function watchUserLocation(
  onSuccess: (location: BrowserLocation) => void,
  onError: (error: GeolocationErrorState) => void,
  options?: PositionOptions
) {
  if (!isGeolocationSupported()) {
    onError({ message: '浏览器不支持定位' })
    return null
  }

  try {
    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          timestamp: position.timestamp,
          source: 'gps'
        })
      },
      (error) => {
        onError(normalizeGeolocationError(error))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        ...options
      }
    )
  } catch (error) {
    onError({ message: error instanceof Error ? error.message : '无法获取当前位置' })
    return null
  }
}

export function clearUserLocationWatch(watchId?: number | null) {
  if (!isGeolocationSupported() || typeof watchId !== 'number') {
    return
  }

  navigator.geolocation.clearWatch(watchId)
}

function normalizeGeolocationError(error: GeolocationPositionError): GeolocationErrorState {
  switch (error.code) {
    case 1:
      return { code: error.code, message: '用户拒绝定位权限' }
    case 2:
      return { code: error.code, message: '无法获取当前位置' }
    case 3:
      return { code: error.code, message: '定位超时' }
    default:
      return { code: error.code, message: error.message || '无法获取当前位置' }
  }
}
