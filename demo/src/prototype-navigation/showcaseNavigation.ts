import { getScenicRouteConfig } from '../data/lingshanScenicRoutes'
import { lingshanPois } from '../data/lingshanMapData'
import { toGcj02Position } from './coordinateTransform'
import { samePoiNavigationTarget } from './poiNavigationTarget'
import type { Gcj02Position, PrototypeNavigationTarget } from './types'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'

const LOGICAL_POSITION_KEY = 'lingshan:showcase-logical-position:v1'
const SHOWCASE_HANDOFF_KEY = 'lingshan:showcase-navigation-handoff:v1'
const MAX_AGE_MS = 2 * 60 * 60 * 1_000

export type ShowcaseLogicalPosition = {
  version: 1
  poiId: string
  name: string
  position: Gcj02Position
  source: 'route-stage' | 'confirmed-showcase-arrival'
  updatedAt: number
}

export type ShowcaseNavigationOrigin = {
  poiId: string
  name: string
  position: Gcj02Position
  reason: 'route-stage' | 'confirmed-showcase-arrival' | 'demo-default'
}

export type ShowcaseNavigationHandoff = {
  version: 1
  target: PrototypeNavigationTarget
  origin: ShowcaseNavigationOrigin
  createdAt: number
}

export function saveRouteStageLogicalPosition(routeId: string, stopIndex: number) {
  const stop = getScenicRouteConfig(routeId).stops[stopIndex]
  const poiId = stop?.poiId ?? stop?.id
  if (!stop?.location || !poiId) return
  saveShowcaseLogicalPosition({
    version: 1,
    poiId,
    name: stop.name,
    position: toGcj02Position(stop.location),
    source: 'route-stage',
    updatedAt: Date.now()
  })
}

export function saveConfirmedShowcaseArrival(target: PrototypeNavigationTarget) {
  saveShowcaseLogicalPosition({
    version: 1,
    poiId: target.poiId,
    name: target.name,
    position: target.coordinate,
    source: 'confirmed-showcase-arrival',
    updatedAt: Date.now()
  })
}

/** Current competition-demo position for the map locate control. */
export function resolveShowcaseMapLocation(): ShowcaseNavigationOrigin | undefined {
  const saved = readShowcaseLogicalPosition()
  if (saved) {
    return {
      poiId: saved.poiId,
      name: saved.name,
      position: saved.position,
      reason: saved.source
    }
  }

  const fallback = lingshanPois.find((poi) => poi.id === 'south_gate') ?? lingshanPois[0]
  if (!fallback?.navLocation) return undefined
  return {
    poiId: fallback.id,
    name: `${fallback.name}（演示起点）`,
    position: toGcj02Position(fallback.navLocation),
    reason: 'demo-default'
  }
}

export function resolveShowcaseNavigationOrigin(targetPoiId: string): ShowcaseNavigationOrigin | undefined {
  const saved = readShowcaseLogicalPosition()
  if (saved && saved.poiId !== targetPoiId) {
    return {
      poiId: saved.poiId,
      name: saved.name,
      position: saved.position,
      reason: saved.source
    }
  }

  const preferredId = targetPoiId === 'south_gate' ? 'lingshan_wall' : 'south_gate'
  const fallback = lingshanPois.find((poi) => poi.id === preferredId)
    ?? lingshanPois.find((poi) => poi.id !== targetPoiId)
  if (!fallback?.navLocation) return undefined
  return {
    poiId: fallback.id,
    name: `${fallback.name}（演示起点）`,
    position: toGcj02Position(fallback.navLocation),
    reason: 'demo-default'
  }
}

export type QueueShowcaseNavigationResult =
  | { status: 'queued' }
  | { status: 'focused' }
  | { status: 'cancelled' }
  | { status: 'unavailable'; message: string }

/** Public POI-detail action. UI never mutates navigation Store fields directly. */
export function queuePoiShowcaseNavigation(
  target: PrototypeNavigationTarget,
  origin: ShowcaseNavigationOrigin
): QueueShowcaseNavigationResult {
  const state = useNavigationPrototypeStore.getState()
  const currentTarget = state.session?.target ?? state.preparedTarget
  if (samePoiNavigationTarget(currentTarget, target) && state.session?.replayPurpose === 'showcase') {
    return { status: 'focused' }
  }
  if (currentTarget) {
    const confirmed = window.confirm(`当前正在前往“${currentTarget.name}”。是否结束当前导航并演示前往“${target.name}”？`)
    if (!confirmed) return { status: 'cancelled' }
    state.cancelNavigation()
  }
  if (!writeShowcaseHandoff({ version: 1, target, origin, createdAt: Date.now() })) {
    return { status: 'unavailable', message: '浏览器暂时无法保存演示导航上下文' }
  }
  return { status: 'queued' }
}

export function consumeShowcaseNavigationHandoff(): ShowcaseNavigationHandoff | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SHOWCASE_HANDOFF_KEY) ?? '') as ShowcaseNavigationHandoff
    window.sessionStorage.removeItem(SHOWCASE_HANDOFF_KEY)
    if (!isValidHandoff(parsed) || Date.now() - parsed.createdAt > MAX_AGE_MS) return undefined
    return parsed
  } catch {
    try { window.sessionStorage.removeItem(SHOWCASE_HANDOFF_KEY) } catch { /* no-op */ }
    return undefined
  }
}

function saveShowcaseLogicalPosition(position: ShowcaseLogicalPosition) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(LOGICAL_POSITION_KEY, JSON.stringify(position))
  } catch {
    // Virtual demo position remains session-only and is never uploaded.
  }
}

function readShowcaseLogicalPosition(): ShowcaseLogicalPosition | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(LOGICAL_POSITION_KEY) ?? '') as ShowcaseLogicalPosition
    if (!isGcj02Position(parsed?.position) || !parsed.poiId || !parsed.name || Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(LOGICAL_POSITION_KEY)
      return undefined
    }
    return parsed
  } catch {
    return undefined
  }
}

function writeShowcaseHandoff(handoff: ShowcaseNavigationHandoff) {
  if (typeof window === 'undefined') return false
  try {
    window.sessionStorage.setItem(SHOWCASE_HANDOFF_KEY, JSON.stringify(handoff))
    return true
  } catch {
    return false
  }
}

function isValidHandoff(value: ShowcaseNavigationHandoff | undefined) {
  return value?.version === 1
    && value.target?.mode === 'free-poi'
    && isGcj02Position(value.target.coordinate)
    && isGcj02Position(value.origin?.position)
    && Number.isFinite(value.createdAt)
}

function isGcj02Position(value: Gcj02Position | undefined): value is Gcj02Position {
  return value?.coordinateSystem === 'GCJ-02'
    && Number.isFinite(value.lat)
    && Number.isFinite(value.lng)
}
