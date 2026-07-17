import type { ScenicMapPresentation } from '../types/mapGuide'

export interface MapResumeSnapshot {
  version: 1
  url: string
  savedAt: number
  camera?: {
    center: { lat: number; lng: number }
    zoom: number
    pitch: number
    rotation: number
    presentation: ScenicMapPresentation
  }
}

const STORAGE_KEY = 'lingshan:c-app:map-resume:v1'
const MAX_AGE_MS = 2 * 60 * 60 * 1000
const MAP_PATH = '/map-3d-guide-c'
const VALID_ROUTE_IDS = new Set([
  'historical_culture',
  'natural_scenery',
  'prayer_meditation',
  'family'
])

function normalizeMapUrl(value: string | null | undefined): string | undefined {
  if (!value || typeof window === 'undefined') return undefined
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin || !url.pathname.startsWith(MAP_PATH)) return undefined
    if (url.pathname !== MAP_PATH) {
      const routeMatch = url.pathname.match(/^\/map-3d-guide-c\/route\/([^/]+)$/)
      if (!routeMatch || !VALID_ROUTE_IDS.has(decodeURIComponent(routeMatch[1]))) return undefined
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

function isRouteMapUrl(url: string | undefined) {
  return Boolean(url?.startsWith(`${MAP_PATH}/route/`))
}

function readNumber(getter: (() => unknown) | undefined, fallback = 0) {
  try {
    const value = Number(getter?.())
    return Number.isFinite(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function captureMapCamera(map: any, presentation: ScenicMapPresentation): MapResumeSnapshot['camera'] | undefined {
  try {
    const center = map?.getCenter?.()
    const lat = readNumber(() => typeof center?.getLat === 'function' ? center.getLat() : center?.lat, Number.NaN)
    const lng = readNumber(() => typeof center?.getLng === 'function' ? center.getLng() : center?.lng, Number.NaN)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
    return {
      center: { lat, lng },
      zoom: readNumber(() => map?.getZoom?.(), 16),
      pitch: readNumber(() => map?.getPitch?.(), 0),
      rotation: readNumber(() => map?.getRotation?.() ?? map?.getBearing?.(), 0),
      presentation
    }
  } catch {
    return undefined
  }
}

export function saveMapResumeState(input: { url: string; map?: any; presentation: ScenicMapPresentation }) {
  const url = normalizeMapUrl(input.url)
  if (!url || typeof window === 'undefined') return undefined
  const existing = readMapResumeState()
  if (!isRouteMapUrl(url) && isRouteMapUrl(existing?.url)) return existing
  const snapshot: MapResumeSnapshot = {
    version: 1,
    url,
    savedAt: Date.now(),
    camera: input.map ? captureMapCamera(input.map, input.presentation) : undefined
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return snapshot
  } catch {
    return undefined
  }
}

export function readMapResumeState(): MapResumeSnapshot | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '') as MapResumeSnapshot
    const url = normalizeMapUrl(parsed?.url)
    if (parsed?.version !== 1 || !url || !Number.isFinite(parsed.savedAt) || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearMapResumeState()
      return undefined
    }
    const camera = parsed.camera
    const validCamera = camera &&
      Number.isFinite(camera.center?.lat) &&
      Number.isFinite(camera.center?.lng) &&
      Number.isFinite(camera.zoom) &&
      Number.isFinite(camera.pitch) &&
      Number.isFinite(camera.rotation) &&
      (camera.presentation === 'ink2d' || camera.presentation === 'scenic3d')
        ? camera
        : undefined
    return { ...parsed, url, camera: validCamera }
  } catch {
    clearMapResumeState()
    return undefined
  }
}

export function clearMapResumeState() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage restrictions.
  }
}

export function getMapResumeUrl(fallback = MAP_PATH) {
  return readMapResumeState()?.url ?? fallback
}

export function restoreMapResumeCamera(map: any, TMap: any, currentUrl: string) {
  const snapshot = readMapResumeState()
  if (!snapshot?.camera || normalizeMapUrl(currentUrl) !== snapshot.url) return false
  const { camera } = snapshot
  try {
    const center = TMap?.LatLng ? new TMap.LatLng(camera.center.lat, camera.center.lng) : camera.center
    map?.setCenter?.(center)
    map?.setZoom?.(camera.zoom)
    map?.setPitch?.(camera.pitch)
    if (typeof map?.setRotation === 'function') map.setRotation(camera.rotation)
    else map?.setBearing?.(camera.rotation)
    return true
  } catch {
    return false
  }
}
