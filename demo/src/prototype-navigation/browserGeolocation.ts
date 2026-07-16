import type { BrowserWgs84Location } from './types'

export type PrototypeGeolocationError = {
  message: string
}

const HIGH_ACCURACY_TIMEOUT_MS = 20_000
const NETWORK_BOOTSTRAP_TIMEOUT_MS = 60_000
// The prototype store rejects fixes older than 15 seconds. Keep this below
// that boundary so a coarse bootstrap can never look successful here while
// being silently withheld from route selection downstream.
const NETWORK_BOOTSTRAP_MAX_AGE_MS = 10_000

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
  let stopped = false
  let terminalErrorReported = false
  let highAccuracyError: GeolocationPositionError | undefined
  let networkBootstrapError: GeolocationPositionError | undefined

  const emitLocation = (position: GeolocationPosition) => {
    if (stopped) return
    highAccuracyError = undefined
    input.onLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      coordinateSystem: 'WGS84',
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      speedMps: finiteOrUndefined(position.coords.speed),
      headingDegrees: normalizeHeading(position.coords.heading)
    })
  }

  const reportTerminalError = (error: GeolocationPositionError) => {
    if (stopped || terminalErrorReported) return
    terminalErrorReported = true
    input.onError({ message: normalizeGeolocationError(error) })
  }

  const maybeReportUnavailable = () => {
    if (stopped || terminalErrorReported || !highAccuracyError || !networkBootstrapError) return
    reportTerminalError(networkBootstrapError)
  }

  const handleHighAccuracyError = (error: GeolocationPositionError) => {
    if (stopped) return
    if (error.code === error.PERMISSION_DENIED) {
      reportTerminalError(error)
      return
    }
    highAccuracyError = error
    maybeReportUnavailable()
  }

  const handleNetworkBootstrapError = (error: GeolocationPositionError) => {
    if (stopped) return
    if (error.code === error.PERMISSION_DENIED) {
      reportTerminalError(error)
      return
    }
    networkBootstrapError = error
    maybeReportUnavailable()
  }

  try {
    watchId = navigator.geolocation.watchPosition(
      emitLocation,
      handleHighAccuracyError,
      {
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 5000
      }
    )
  } catch (error) {
    input.onError({ message: error instanceof Error ? error.message : '无法启动定位' })
  }

  // Desktop browsers often have no GPS even when the operating-system map can
  // resolve a network location. Request a coarse/cached fix in parallel so the
  // prototype can start promptly, while the high-accuracy watch remains active
  // and can replace it with better fixes as they arrive.
  try {
    navigator.geolocation.getCurrentPosition(
      emitLocation,
      handleNetworkBootstrapError,
      {
        enableHighAccuracy: false,
        timeout: NETWORK_BOOTSTRAP_TIMEOUT_MS,
        maximumAge: NETWORK_BOOTSTRAP_MAX_AGE_MS
      }
    )
  } catch (error) {
    if (!terminalErrorReported) {
      input.onError({ message: error instanceof Error ? error.message : '无法启动网络定位' })
      terminalErrorReported = true
    }
  }

  return () => {
    stopped = true
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
