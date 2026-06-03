import type { LatLngPoint } from '../data/guideData'
import type { RoadSamplingPair } from '../data/lingshanRoadNetworkSamplingPlan'

export type RoadNetworkExportSegment = {
  id: string
  fromPoiId: string
  toPoiId: string
  source: string
  guideRouteId?: string
  priority: string
  status: 'candidate'
  path: LatLngPoint[]
  distanceMeters?: number
  durationMinutes?: number
  pointCount: number
  usedFallback?: boolean
  fallbackReason?: string
  generatedAt: string
  notes?: string
}

export type RoadNetworkExportSkippedPair = {
  pairId: string
  fromPoiId: string
  toPoiId: string
  reason: string
}

export type RoadNetworkExportPayload = {
  version: string
  generatedAt: string
  source: 'tencent_walking_batch_export'
  pairCount: number
  segmentCount: number
  segments: RoadNetworkExportSegment[]
  skipped: RoadNetworkExportSkippedPair[]
}

export function buildRoadNetworkExportSegment(
  pair: RoadSamplingPair,
  plannedRoute: {
    path: LatLngPoint[]
    distanceMeters?: number
    durationMinutes?: number
    usedFallback?: boolean
    fallbackReason?: string
  },
  generatedAt = new Date().toISOString()
): RoadNetworkExportSegment {
  return {
    id: pair.id,
    fromPoiId: pair.fromPoiId,
    toPoiId: pair.toPoiId,
    source: pair.source,
    guideRouteId: pair.guideRouteId,
    priority: pair.priority,
    status: 'candidate',
    path: plannedRoute.path,
    distanceMeters: plannedRoute.distanceMeters,
    durationMinutes: plannedRoute.durationMinutes,
    pointCount: plannedRoute.path.length,
    usedFallback: plannedRoute.usedFallback,
    fallbackReason: plannedRoute.fallbackReason,
    generatedAt,
    notes: pair.notes,
  }
}

export function buildRoadNetworkExportPayload(options: {
  pairCount: number
  segments: RoadNetworkExportSegment[]
  skipped: RoadNetworkExportSkippedPair[]
  generatedAt?: string
}): RoadNetworkExportPayload {
  return {
    version: '2026-06-03-road-network-candidates-v1',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    source: 'tencent_walking_batch_export',
    pairCount: options.pairCount,
    segmentCount: options.segments.length,
    segments: options.segments,
    skipped: options.skipped,
  }
}

export function downloadRoadNetworkJson(payload: RoadNetworkExportPayload, filename: string) {
  const jsonText = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
