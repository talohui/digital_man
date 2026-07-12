import { haversineDistanceMeters } from '../lib/routeProgress'

import type {
  BrowserWgs84Location,
  ConvertedGcj02Location,
  Gcj02Position,
  Wgs84Position
} from './types'

export interface CoordinateTransformProvider {
  readonly id: 'local-gcj02' | 'tencent-webservice'
  wgs84ToGcj02(position: Wgs84Position): Promise<Gcj02Position>
}

/**
 * Use Tencent's Coord WebService only when the coordinate service is enabled
 * for the supplied key. It is a development-only client boundary: production
 * must move this request behind a server-side proxy and never expose an SK.
 */
export function createTencentCoordinateTransformProvider(): CoordinateTransformProvider {
  return {
    id: 'tencent-webservice',
    async wgs84ToGcj02(position) {
      const key = import.meta.env.VITE_TMAP_COORD_KEY?.trim() || import.meta.env.VITE_TMAP_ROUTE_KEY?.trim()
      if (!key) throw new Error('未检测到腾讯坐标转换 Key。')

      const payload = await requestJsonp<TencentCoordinateResponse>(
        `https://apis.map.qq.com/ws/coord/v1/translate?${new URLSearchParams({
          locations: `${position.lat},${position.lng}`,
          type: '1',
          key,
          output: 'jsonp'
        }).toString()}`
      )
      const location = payload.locations?.[0]
      if (payload.status !== 0 || !location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
        throw new Error(payload.message || '腾讯坐标转换未返回有效 GCJ-02 坐标。')
      }
      return toGcj02Position(location)
    }
  }
}

/**
 * Clearly labelled prototype fallback. Tencent's service result remains the
 * preferred calibration baseline on a real device.
 */
export function createLocalGcj02TransformProvider(): CoordinateTransformProvider {
  return {
    id: 'local-gcj02',
    async wgs84ToGcj02(position) {
      if (isOutsideChina(position)) return toGcj02Position(position)
      const dLat = transformLat(position.lng - 105, position.lat - 35)
      const dLng = transformLng(position.lng - 105, position.lat - 35)
      const radLat = position.lat / 180 * Math.PI
      let magic = Math.sin(radLat)
      magic = 1 - GCJ_EE * magic * magic
      const sqrtMagic = Math.sqrt(magic)
      const adjustedLat = (dLat * 180) / ((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic) * Math.PI)
      const adjustedLng = (dLng * 180) / (GCJ_A / sqrtMagic * Math.cos(radLat) * Math.PI)
      return toGcj02Position({ lat: position.lat + adjustedLat, lng: position.lng + adjustedLng })
    }
  }
}

export function createPrototypeCoordinateTransformProvider(): CoordinateTransformProvider {
  return import.meta.env.VITE_NAVIGATION_COORDINATE_PROVIDER?.trim().toLowerCase() === 'tencent'
    ? createTencentCoordinateTransformProvider()
    : createLocalGcj02TransformProvider()
}

export function toWgs84Position(point: Pick<Wgs84Position, 'lat' | 'lng'>): Wgs84Position {
  return { lat: point.lat, lng: point.lng, coordinateSystem: 'WGS84' }
}

export function toGcj02Position(point: Pick<Gcj02Position, 'lat' | 'lng'>): Gcj02Position {
  return { lat: point.lat, lng: point.lng, coordinateSystem: 'GCJ-02' }
}

export function toConvertedGcj02Location(input: {
  position: Gcj02Position
  raw: BrowserWgs84Location
}): ConvertedGcj02Location {
  return {
    ...input.position,
    accuracy: input.raw.accuracy,
    timestamp: input.raw.timestamp,
    source: 'geolocation'
  }
}

export function calculateCoordinateOffsetMeters(raw: Wgs84Position, converted: Gcj02Position) {
  return Math.round(haversineDistanceMeters(raw, converted))
}

type TencentCoordinateResponse = {
  status: number
  message?: string
  locations?: Array<{ lat: number; lng: number }>
}

const GCJ_A = 6378245.0
const GCJ_EE = 0.00669342162296594323

function isOutsideChina(position: Wgs84Position) {
  return position.lng < 72.004 || position.lng > 137.8347 || position.lat < 0.8293 || position.lat > 55.8271
}

function transformLat(lng: number, lat: number) {
  let result = -100 + 2 * lng + 3 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  result += (20 * Math.sin(6 * lng * Math.PI) + 20 * Math.sin(2 * lng * Math.PI)) * 2 / 3
  result += (20 * Math.sin(lat * Math.PI) + 40 * Math.sin(lat / 3 * Math.PI)) * 2 / 3
  return result + (160 * Math.sin(lat / 12 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30)) * 2 / 3
}

function transformLng(lng: number, lat: number) {
  let result = 300 + lng + 2 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  result += (20 * Math.sin(6 * lng * Math.PI) + 20 * Math.sin(2 * lng * Math.PI)) * 2 / 3
  result += (20 * Math.sin(lng * Math.PI) + 40 * Math.sin(lng / 3 * Math.PI)) * 2 / 3
  return result + (150 * Math.sin(lng / 12 * Math.PI) + 300 * Math.sin(lng / 30 * Math.PI)) * 2 / 3
}

function requestJsonp<T>(baseUrl: string, timeoutMs = 10_000) {
  return new Promise<T>((resolve, reject) => {
    const globalScope = window as unknown as Record<string, unknown>
    const callbackName = `__prototypeCoordinateJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('腾讯坐标转换请求超时。'))
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
      reject(new Error('腾讯坐标转换脚本加载失败。'))
    }
    document.head.appendChild(script)
  })
}
