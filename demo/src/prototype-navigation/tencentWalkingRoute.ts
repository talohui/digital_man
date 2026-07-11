import type { LatLngPoint } from '../data/guideData'
import type {
  NavigationPrototypeEndpoint,
  NavigationPrototypeRoute,
  NavigationPrototypeStep
} from './types'

type TencentWalkingStep = {
  instruction?: string
  distance?: number
  road_name?: string
  road?: string
  dir_desc?: string
  dir?: string
  act_desc?: string
  polyline_idx?: number[]
}

type TencentWalkingRouteResponse = {
  status: number
  message: string
  result?: {
    routes?: Array<{
      distance: number
      duration: number
      polyline: number[]
      steps?: TencentWalkingStep[]
    }>
  }
}

const WALKING_ROUTE_API = 'https://apis.map.qq.com/ws/direction/v1/walking/'

/**
 * Deliberately independent from the existing scenic-route planner: this demo
 * must expose Tencent's original walking route fields and must not silently
 * replace a failed Tencent response with a straight-line fallback.
 */
export async function requestPrototypeWalkingRoute(
  origin: NavigationPrototypeEndpoint,
  destination: NavigationPrototypeEndpoint
): Promise<NavigationPrototypeRoute> {
  const payload = await requestJsonp<TencentWalkingRouteResponse>(
    `${WALKING_ROUTE_API}?${new URLSearchParams({
      key: getRouteKey(),
      from: formatLatLng(origin),
      to: formatLatLng(destination),
      output: 'jsonp'
    }).toString()}`
  )

  const route = payload.result?.routes?.[0]

  if (payload.status !== 0 || !route?.polyline?.length) {
    throw new Error(payload.message || '腾讯步行路线未返回可绘制 polyline。')
  }

  return {
    origin,
    destination,
    distanceMeters: route.distance,
    durationMinutes: route.duration,
    polyline: decodeTencentPolyline(route.polyline),
    steps: (route.steps ?? []).map(toPrototypeStep)
  }
}

function toPrototypeStep(step: TencentWalkingStep): NavigationPrototypeStep {
  return {
    instruction: step.instruction?.trim() || '沿当前步行路线前行',
    distanceMeters: step.distance ?? 0,
    roadName: step.road_name ?? step.road,
    directionDescription: step.dir_desc ?? step.dir,
    actionDescription: step.act_desc,
    polylineIndexes: step.polyline_idx
  }
}

function getRouteKey() {
  const key = import.meta.env.VITE_TMAP_ROUTE_KEY?.trim() || import.meta.env.VITE_TMAP_WEB_KEY?.trim()

  if (!key) {
    throw new Error('未检测到腾讯步行路线 Key。')
  }

  return key
}

function formatLatLng(point: LatLngPoint) {
  return `${point.lat},${point.lng}`
}

function decodeTencentPolyline(compressedPolyline: number[]): LatLngPoint[] {
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

function requestJsonp<T>(baseUrl: string, timeoutMs = 10000) {
  return new Promise<T>((resolve, reject) => {
    const globalScope = window as unknown as Record<string, unknown>
    const callbackName = `__prototypeTmapJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('腾讯步行路线请求超时。'))
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

    script.src = `${baseUrl}&callback=${callbackName}`
    script.async = true
    script.onerror = () => {
      cleanup()
      reject(new Error('腾讯步行路线脚本加载失败。'))
    }

    document.head.appendChild(script)
  })
}
