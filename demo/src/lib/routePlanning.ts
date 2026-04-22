import type { LatLngPoint } from '../data/guideData'

type TencentRouteResponse = {
  status: number
  message: string
  result?: {
    routes?: Array<{
      distance: number
      duration: number
      polyline: number[]
    }>
  }
}

export type PlannedRoute = {
  path: LatLngPoint[]
  distanceMeters: number
  durationMinutes: number
  usedFallback: boolean
  fallbackReason?: string
}

const ROUTE_API_BASE = 'https://apis.map.qq.com/ws/direction/v1/walking/'
const REQUEST_INTERVAL_MS = 650
const ROUTE_CACHE_PREFIX = 'lingshan-guide-route-cache:v1:'
const ROUTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const memoryRouteCache = new Map<string, PlannedRoute>()

export async function buildWalkingRoute(points: LatLngPoint[]) {
  if (points.length < 2) {
    return {
      path: points,
      distanceMeters: 0,
      durationMinutes: 0,
      usedFallback: false
    }
  }

  const cacheKey = createRouteCacheKey(points)
  const cachedRoute = readRouteCache(cacheKey)

  if (cachedRoute) {
    return cachedRoute
  }

  const segments: PlannedRoute[] = []

  for (let index = 0; index < points.length - 1; index += 1) {
    const segment = await requestWalkingSegment(points[index], points[index + 1])
    segments.push(segment)

    if (index < points.length - 2) {
      await delay(REQUEST_INTERVAL_MS)
    }
  }

  const mergedPath = segments.reduce<LatLngPoint[]>((allPoints, segment, index) => {
    if (index === 0) {
      return [...segment.path]
    }

    return [...allPoints, ...segment.path.slice(1)]
  }, [])

  const plannedRoute = {
    path: mergedPath,
    distanceMeters: segments.reduce((sum, segment) => sum + segment.distanceMeters, 0),
    durationMinutes: segments.reduce((sum, segment) => sum + segment.durationMinutes, 0),
    usedFallback: segments.some((segment) => segment.usedFallback),
    fallbackReason: segments.find((segment) => segment.fallbackReason)?.fallbackReason
  }

  if (!plannedRoute.usedFallback) {
    writeRouteCache(cacheKey, plannedRoute)
  }

  return plannedRoute
}

async function requestWalkingSegment(from: LatLngPoint, to: LatLngPoint): Promise<PlannedRoute> {
  try {
    const payload = await requestRouteJsonp<TencentRouteResponse>(
      `${ROUTE_API_BASE}?${new URLSearchParams({
        key: getRouteKey(),
        from: formatLatLng(from),
        to: formatLatLng(to),
        output: 'jsonp'
      }).toString()}`
    )

    const route = payload.result?.routes?.[0]

    if (payload.status !== 0 || !route?.polyline?.length) {
      throw new Error(payload.message || '步行算路失败')
    }

    return {
      path: decodeTencentPolyline(route.polyline),
      distanceMeters: route.distance,
      durationMinutes: route.duration,
      usedFallback: false
    }
  } catch (error) {
    const fallbackReason = getErrorMessage(error)

    return {
      path: [from, to],
      distanceMeters: estimateSegmentDistance(from, to),
      durationMinutes: estimateWalkDurationMinutes(from, to),
      usedFallback: true,
      fallbackReason
    }
  }
}

function getRouteKey() {
  const key = import.meta.env.VITE_TMAP_ROUTE_KEY?.trim() || import.meta.env.VITE_TMAP_WEB_KEY?.trim()

  if (!key) {
    throw new Error('未检测到可用的腾讯地图路线规划 Key。')
  }

  return key
}

function formatLatLng(point: LatLngPoint) {
  return `${point.lat},${point.lng}`
}

function decodeTencentPolyline(compressedPolyline: number[]) {
  const coordinates = [...compressedPolyline]

  for (let index = 2; index < coordinates.length; index += 1) {
    coordinates[index] = coordinates[index - 2] + coordinates[index] / 1_000_000
  }

  const path: LatLngPoint[] = []

  for (let index = 0; index < coordinates.length - 1; index += 2) {
    path.push({
      lat: Number(coordinates[index].toFixed(6)),
      lng: Number(coordinates[index + 1].toFixed(6))
    })
  }

  return path
}

function estimateSegmentDistance(from: LatLngPoint, to: LatLngPoint) {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const earthRadius = 6371000
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  return Math.round(2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function estimateWalkDurationMinutes(from: LatLngPoint, to: LatLngPoint) {
  return Math.max(1, Math.round(estimateSegmentDistance(from, to) / 75))
}

function requestRouteJsonp<T>(baseUrl: string, timeoutMs = 8000) {
  return new Promise<T>((resolve, reject) => {
    const globalScope = window as unknown as Record<string, unknown>
    const callbackName = `__tmapJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const callbackUrl = `${baseUrl}&callback=${callbackName}`
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('腾讯路线规划请求超时'))
    }, timeoutMs)

    function cleanup() {
      window.clearTimeout(timer)
      delete globalScope[callbackName]
      script.remove()
    }

    globalScope[callbackName] = (payload: T) => {
      cleanup()
      resolve(payload)
    }

    script.src = callbackUrl
    script.async = true
    script.onerror = () => {
      cleanup()
      reject(new Error('腾讯路线规划脚本加载失败'))
    }

    document.head.appendChild(script)
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return '步行路线规划失败'
}

function delay(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}

function createRouteCacheKey(points: LatLngPoint[]) {
  return `${ROUTE_CACHE_PREFIX}${points.map((point) => `${point.lat},${point.lng}`).join('|')}`
}

function readRouteCache(cacheKey: string) {
  const memoryCached = memoryRouteCache.get(cacheKey)

  if (memoryCached) {
    return memoryCached
  }

  try {
    const rawValue = window.localStorage.getItem(cacheKey)

    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue) as {
      savedAt: number
      route: PlannedRoute
    }

    if (Date.now() - parsedValue.savedAt > ROUTE_CACHE_TTL_MS) {
      window.localStorage.removeItem(cacheKey)
      return null
    }

    memoryRouteCache.set(cacheKey, parsedValue.route)
    return parsedValue.route
  } catch {
    return null
  }
}

function writeRouteCache(cacheKey: string, route: PlannedRoute) {
  memoryRouteCache.set(cacheKey, route)

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        savedAt: Date.now(),
        route
      })
    )
  } catch {
    // Ignore storage failures so route rendering still works.
  }
}
