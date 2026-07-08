export type GLBSpatialPosition = {
  lat: number
  lng: number
  height?: number
}

export type GLBSpatialModelKind = 'tree' | 'landmark' | 'companion' | 'model'

export type GLBSpatialRegisterOptions = {
  baseOpacity?: number
  kind?: GLBSpatialModelKind
}

export type GLBSpatialControllerOptions = {
  enabled?: boolean
  mobile?: boolean
  intervalMs?: number
  protectedModelIds?: Iterable<string>
}

type GLBSpatialRecord = {
  model: any
  position: GLBSpatialPosition
  visible: boolean
  baseOpacity: number
  kind: GLBSpatialModelKind
}

type LatLngLike = {
  lat: number
  lng: number
}

type ViewBounds = {
  north: number
  south: number
  east: number
  west: number
}

const DEFAULT_INTERVAL_MS = 200
const FRUSTUM_BOUNDS_PADDING_RATIO = 0.18

const DESKTOP_DISTANCE_POLICY = {
  visibleMeters: 200,
  hiddenMeters: 500
}

const MOBILE_DISTANCE_POLICY = {
  visibleMeters: 120,
  hiddenMeters: 300
}

export class GLBSpatialController {
  private map: any = null
  private intervalId: number | null = null
  private enabled = true
  private mobile = false
  private intervalMs = DEFAULT_INTERVAL_MS
  private records = new Map<string, GLBSpatialRecord>()
  private protectedModelIds = new Set<string>()

  init(map: any) {
    this.map = map
    this.start()
  }

  configure(options: GLBSpatialControllerOptions) {
    const wasEnabled = this.enabled
    this.enabled = options.enabled ?? this.enabled
    this.mobile = options.mobile ?? this.mobile
    this.intervalMs = options.intervalMs ?? this.intervalMs
    this.protectedModelIds = new Set(options.protectedModelIds ?? [])

    if (wasEnabled && !this.enabled) {
      this.restoreAll()
    }

    this.restart()
  }

  register(
    modelId: string,
    model: any,
    position: GLBSpatialPosition,
    options: GLBSpatialRegisterOptions = {}
  ) {
    if (!modelId || !model || !isValidPosition(position)) {
      return
    }

    const current = this.records.get(modelId)
    const baseOpacity = clamp01(options.baseOpacity ?? current?.baseOpacity ?? 1)

    this.records.set(modelId, {
      model,
      position,
      visible: current?.visible ?? true,
      baseOpacity,
      kind: options.kind ?? current?.kind ?? 'model'
    })
  }

  unregister(modelId: string) {
    const record = this.records.get(modelId)

    if (record) {
      this.applyVisibility(record, true, record.baseOpacity)
    }

    this.records.delete(modelId)
  }

  syncRegisteredModelIds(activeModelIds: Set<string>) {
    Array.from(this.records.keys()).forEach((modelId) => {
      if (!activeModelIds.has(modelId)) {
        this.unregister(modelId)
      }
    })
  }

  getRegisteredCount() {
    return this.records.size
  }

  setVisible(modelId: string, visible: boolean) {
    const record = this.records.get(modelId)

    if (!record) {
      return
    }

    this.applyVisibility(record, visible, record.baseOpacity)
  }

  start() {
    if (this.intervalId !== null) {
      return
    }

    this.intervalId = window.setInterval(() => {
      this.updateVisibility()
    }, this.intervalMs)
  }

  stop() {
    if (this.intervalId === null) {
      return
    }

    window.clearInterval(this.intervalId)
    this.intervalId = null
  }

  destroy() {
    this.stop()
    this.restoreAll()
    this.records.clear()
    this.map = null
  }

  private restart() {
    this.stop()
    this.start()
  }

  private updateVisibility() {
    if (!this.enabled || !this.map || this.records.size === 0) {
      return
    }

    const center = readMapCenter(this.map)

    if (!center) {
      this.restoreAll()
      return
    }

    const expandedBounds = expandBounds(readMapBounds(this.map), FRUSTUM_BOUNDS_PADDING_RATIO)

    this.records.forEach((record, modelId) => {
      if (this.protectedModelIds.has(modelId)) {
        this.applyVisibility(record, true, record.baseOpacity)
        return
      }

      const policy = getDistancePolicy(record.kind, this.mobile)
      const distanceMeters = haversineDistanceMeters(center, record.position)
      const inApproximateFrustum = expandedBounds ? isInsideBounds(record.position, expandedBounds) : true
      const outsideFrustumAndFar = !inApproximateFrustum && distanceMeters > policy.visibleMeters

      if (outsideFrustumAndFar) {
        this.applyVisibility(record, false, 0)
        return
      }

      const fadeRatio = clamp01(
        1 - (distanceMeters - policy.visibleMeters) / (policy.hiddenMeters - policy.visibleMeters)
      )
      const fadeOpacity =
        distanceMeters <= policy.visibleMeters
          ? record.baseOpacity
          : record.baseOpacity * fadeRatio

      this.applyVisibility(record, true, Math.max(record.baseOpacity * 0.18, fadeOpacity))
    })
  }

  private restoreAll() {
    this.records.forEach((record) => {
      this.applyVisibility(record, true, record.baseOpacity)
    })
  }

  private applyVisibility(record: GLBSpatialRecord, visible: boolean, opacity: number) {
    if (record.visible !== visible) {
      try {
        if (typeof record.model?.setVisible === 'function') {
          record.model.setVisible(visible)
        } else if (typeof record.model?.setMap === 'function') {
          record.model.setMap(visible ? this.map : null)
        }
      } catch {
        // Tencent GLTFModel APIs differ by runtime; keep culling best-effort.
      }

      record.visible = visible
    }

    if (visible && typeof record.model?.setOpacity === 'function') {
      try {
        record.model.setOpacity(clamp01(opacity))
      } catch {
        // Opacity is optional. Visibility still provides the important GPU relief.
      }
    }
  }
}

function getDistancePolicy(kind: GLBSpatialModelKind, mobile: boolean) {
  if (kind === 'landmark' || kind === 'companion') {
    return {
      visibleMeters: 650,
      hiddenMeters: 900
    }
  }

  return mobile ? MOBILE_DISTANCE_POLICY : DESKTOP_DISTANCE_POLICY
}

function isValidPosition(position: GLBSpatialPosition) {
  return Number.isFinite(position.lat) && Number.isFinite(position.lng)
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.max(0, Math.min(1, value))
}

function readMapCenter(map: any): LatLngLike | null {
  const center = typeof map?.getCenter === 'function' ? map.getCenter() : undefined
  return readLatLng(center)
}

function readLatLng(value: any): LatLngLike | null {
  if (!value) {
    return null
  }

  const lat = typeof value.getLat === 'function' ? Number(value.getLat()) : Number(value.lat)
  const lng = typeof value.getLng === 'function' ? Number(value.getLng()) : Number(value.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

function readMapBounds(map: any): ViewBounds | null {
  if (typeof map?.getBounds !== 'function') {
    return null
  }

  try {
    const bounds = map.getBounds()
    const northEast = readLatLng(bounds?.getNorthEast?.() ?? bounds?.northEast ?? bounds?.ne)
    const southWest = readLatLng(bounds?.getSouthWest?.() ?? bounds?.southWest ?? bounds?.sw)

    if (!northEast || !southWest) {
      return null
    }

    return {
      north: Math.max(northEast.lat, southWest.lat),
      south: Math.min(northEast.lat, southWest.lat),
      east: Math.max(northEast.lng, southWest.lng),
      west: Math.min(northEast.lng, southWest.lng)
    }
  } catch {
    return null
  }
}

function expandBounds(bounds: ViewBounds | null, ratio: number): ViewBounds | null {
  if (!bounds) {
    return null
  }

  const latPadding = (bounds.north - bounds.south) * ratio
  const lngPadding = (bounds.east - bounds.west) * ratio

  return {
    north: bounds.north + latPadding,
    south: bounds.south - latPadding,
    east: bounds.east + lngPadding,
    west: bounds.west - lngPadding
  }
}

function isInsideBounds(position: LatLngLike, bounds: ViewBounds) {
  return position.lat <= bounds.north && position.lat >= bounds.south && position.lng <= bounds.east && position.lng >= bounds.west
}

function haversineDistanceMeters(a: LatLngLike, b: LatLngLike) {
  const earthRadiusMeters = 6371000
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const deltaLat = toRadians(b.lat - a.lat)
  const deltaLng = toRadians(b.lng - a.lng)
  const sinLat = Math.sin(deltaLat / 2)
  const sinLng = Math.sin(deltaLng / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
