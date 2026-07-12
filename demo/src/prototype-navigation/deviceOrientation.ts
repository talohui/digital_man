export type DeviceOrientationPermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported'

export type DeviceHeadingReading = {
  degrees: number
  timestamp: number
  absolute: boolean
}

let permissionState: DeviceOrientationPermissionState = 'unknown'
let listening = false
let latestReading: DeviceHeadingReading | undefined
const subscribers = new Set<(reading: DeviceHeadingReading) => void>()

type DeviceOrientationPermissionApi = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function getDeviceOrientationPermissionState() {
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') return 'unsupported' as const
  return permissionState
}

/** Must only be called from a user gesture on platforms that require it. */
export async function requestDeviceOrientationPermission() {
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
    permissionState = 'unsupported'
    return permissionState
  }
  const api = DeviceOrientationEvent as DeviceOrientationPermissionApi
  if (!api.requestPermission) {
    permissionState = 'granted'
    return permissionState
  }
  try {
    permissionState = await api.requestPermission() === 'granted' ? 'granted' : 'denied'
  } catch {
    permissionState = 'denied'
  }
  return permissionState
}

export function startDeviceOrientation() {
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined' || listening || permissionState === 'denied') return
  listening = true
  window.addEventListener('deviceorientationabsolute', handleOrientation, true)
  window.addEventListener('deviceorientation', handleOrientation, true)
}

export function stopDeviceOrientation() {
  if (typeof window === 'undefined' || !listening) return
  listening = false
  window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
  window.removeEventListener('deviceorientation', handleOrientation, true)
}

export function subscribeDeviceOrientation(callback: (reading: DeviceHeadingReading) => void) {
  subscribers.add(callback)
  if (latestReading) callback(latestReading)
  return () => subscribers.delete(callback)
}

function handleOrientation(event: DeviceOrientationEvent) {
  const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
  const heading = Number.isFinite(webkitHeading)
    ? webkitHeading
    : event.absolute && Number.isFinite(event.alpha)
      ? 360 - (event.alpha ?? 0)
      : undefined
  if (heading === undefined) return
  latestReading = { degrees: normalizeDegrees(heading), timestamp: Date.now(), absolute: Boolean(event.absolute || Number.isFinite(webkitHeading)) }
  subscribers.forEach((callback) => callback(latestReading!))
}

function normalizeDegrees(value: number) {
  return (value % 360 + 360) % 360
}
