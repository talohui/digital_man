export type SceneWindowPosition = {
  lat: number
  lng: number
}

export type SceneWindowModelKind = 'tree' | 'landmark' | 'companion' | 'model' | 'poi'

export type SceneWindowRegisterOptions = {
  kind?: SceneWindowModelKind
  routeProgress?: number
  estimatedMemoryMB?: number
}

export type SceneWindowManagerControls = {
  setVisible?: (modelId: string, visible: boolean) => void
  markUsed?: (modelId: string) => void
  release?: (modelId: string) => void
}

export type SceneWindowManagerOptions = {
  enabled?: boolean
  activeWindowMeters?: number
  forwardWindowMeters?: number
  behindProgressWindow?: number
  updateIntervalMs?: number
  protectedModelIds?: Iterable<string>
}

export type SceneWindowManagerUpdateInput = {
  cameraPosition: SceneWindowPosition
  progress?: number
}

export type SceneWindowManagerSnapshot = {
  enabled: boolean
  activeCount: number
  visibleCount: number
  cachedCount: number
  disposedCount: number
  behindCount: number
  memoryPressureEstimate: number
}

type SceneWindowRecord = {
  model: any
  position: SceneWindowPosition
  routeProgress?: number
  kind: SceneWindowModelKind
  estimatedMemoryMB: number
  state: 'visible' | 'cached' | 'behind' | 'unloaded'
  lastAccessAt: number
}

type SceneWindowManagerListener = (snapshot: SceneWindowManagerSnapshot) => void

const DEFAULT_ACTIVE_WINDOW_METERS = 300
const DEFAULT_FORWARD_WINDOW_METERS = 800
const DEFAULT_BEHIND_PROGRESS_WINDOW = 0.035
const DEFAULT_UPDATE_INTERVAL_MS = 1000

const MODEL_MEMORY_ESTIMATE_MB: Record<SceneWindowModelKind, number> = {
  tree: 1.2,
  landmark: 36,
  companion: 2,
  model: 8,
  poi: 0.05
}

export class SceneWindowManager {
  private enabled = false
  private activeWindowMeters = DEFAULT_ACTIVE_WINDOW_METERS
  private forwardWindowMeters = DEFAULT_FORWARD_WINDOW_METERS
  private behindProgressWindow = DEFAULT_BEHIND_PROGRESS_WINDOW
  private updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS
  private lastUpdateAt = 0
  private disposedRegistry = new Map<string, number>()
  private protectedModelIds = new Set<string>()
  private records = new Map<string, SceneWindowRecord>()
  private listeners = new Set<SceneWindowManagerListener>()

  constructor(private readonly controls: SceneWindowManagerControls = {}) {}

  init() {
    this.notify()
  }

  configure(options: SceneWindowManagerOptions) {
    const wasEnabled = this.enabled
    this.enabled = options.enabled ?? this.enabled
    this.activeWindowMeters = options.activeWindowMeters ?? this.activeWindowMeters
    this.forwardWindowMeters = options.forwardWindowMeters ?? this.forwardWindowMeters
    this.behindProgressWindow = options.behindProgressWindow ?? this.behindProgressWindow
    this.updateIntervalMs = options.updateIntervalMs ?? this.updateIntervalMs
    this.protectedModelIds = new Set(options.protectedModelIds ?? [])

    if (wasEnabled && !this.enabled) {
      this.restoreAll()
    }

    this.notify()
  }

  register(
    modelId: string,
    model: any,
    position: SceneWindowPosition,
    options: SceneWindowRegisterOptions = {}
  ) {
    if (!modelId || !model || !isValidPosition(position)) {
      return
    }

    if (this.disposedRegistry.has(modelId) && !this.protectedModelIds.has(modelId)) {
      return
    }

    if (this.protectedModelIds.has(modelId)) {
      this.disposedRegistry.delete(modelId)
    }

    const now = Date.now()
    const current = this.records.get(modelId)
    const kind = options.kind ?? current?.kind ?? 'model'

    this.records.set(modelId, {
      model,
      position,
      routeProgress: options.routeProgress ?? current?.routeProgress,
      kind,
      estimatedMemoryMB: options.estimatedMemoryMB ?? current?.estimatedMemoryMB ?? MODEL_MEMORY_ESTIMATE_MB[kind],
      state: current?.state ?? 'visible',
      lastAccessAt: now
    })
  }

  unregister(modelId: string) {
    this.records.delete(modelId)
    this.disposedRegistry.delete(modelId)
    this.notify()
  }

  syncRegisteredModelIds(activeModelIds: Set<string>) {
    Array.from(this.records.keys()).forEach((modelId) => {
      if (!activeModelIds.has(modelId)) {
        this.unregister(modelId)
      }
    })
  }

  update(input: SceneWindowManagerUpdateInput) {
    if (!this.enabled || !isValidPosition(input.cameraPosition)) {
      return
    }

    const now = Date.now()

    if (now - this.lastUpdateAt < this.updateIntervalMs) {
      return
    }

    this.lastUpdateAt = now
    let changed = false

    this.records.forEach((record, modelId) => {
      if (this.protectedModelIds.has(modelId)) {
        if (record.state !== 'visible') {
          changed = true
        }
        record.state = 'visible'
        record.lastAccessAt = now
        this.applyRecordState(modelId, record)
        return
      }

      const distanceMeters = haversineDistanceMeters(input.cameraPosition, record.position)
      const behind =
        input.progress !== undefined &&
        record.routeProgress !== undefined &&
        record.routeProgress < input.progress - this.behindProgressWindow &&
        distanceMeters > this.activeWindowMeters
      const nextState =
        behind
          ? 'behind'
          : distanceMeters > this.forwardWindowMeters
            ? 'unloaded'
            : distanceMeters > this.activeWindowMeters
              ? 'cached'
              : 'visible'

      if (record.state !== nextState) {
        changed = true
      }

      record.state = nextState
      record.lastAccessAt = nextState === 'visible' ? now : record.lastAccessAt
      this.applyRecordState(modelId, record)
    })

    if (changed) {
      this.notify()
    }
  }

  pause() {
    if (!this.enabled) {
      return
    }

    this.enabled = false
    this.restoreAll()
    this.notify()
  }

  destroy() {
    this.restoreAll()
    this.records.clear()
    this.disposedRegistry.clear()
    this.listeners.clear()
  }

  getSnapshot(): SceneWindowManagerSnapshot {
    const records = Array.from(this.records.values())

    return {
      enabled: this.enabled,
      activeCount: records.length,
      visibleCount: records.filter((record) => record.state === 'visible').length,
      cachedCount: records.filter((record) => record.state === 'cached').length,
      disposedCount: this.disposedRegistry.size,
      behindCount: records.filter((record) => record.state === 'behind').length,
      memoryPressureEstimate: Math.round(
        records
          .filter((record) => record.state === 'visible' || record.state === 'cached')
          .reduce((total, record) => total + record.estimatedMemoryMB, 0)
      )
    }
  }

  subscribe(listener: SceneWindowManagerListener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private applyRecordState(modelId: string, record: SceneWindowRecord) {
    if (this.protectedModelIds.has(modelId)) {
      this.disposedRegistry.delete(modelId)
      this.controls.setVisible?.(modelId, true)
      this.controls.markUsed?.(modelId)
      return
    }

    if (this.disposedRegistry.has(modelId)) {
      return
    }

    if (record.state === 'visible') {
      this.controls.setVisible?.(modelId, true)
      this.controls.markUsed?.(modelId)
      return
    }

    this.controls.setVisible?.(modelId, false)

    if (record.state === 'behind' || record.state === 'unloaded') {
      this.disposedRegistry.set(modelId, Date.now())
      this.controls.release?.(modelId)
    }
  }

  private restoreAll() {
    this.records.forEach((record, modelId) => {
      if (this.disposedRegistry.has(modelId)) {
        return
      }

      record.state = 'visible'
      this.controls.setVisible?.(modelId, true)
      this.controls.markUsed?.(modelId)
    })
  }

  private notify() {
    if (!this.listeners.size) {
      return
    }

    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

function isValidPosition(position: SceneWindowPosition) {
  return Number.isFinite(position.lat) && Number.isFinite(position.lng)
}

function haversineDistanceMeters(a: SceneWindowPosition, b: SceneWindowPosition) {
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
