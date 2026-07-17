export type SceneStatePosition = {
  lat: number
  lng: number
}

export type SceneStateModelKind = 'landmark' | 'companion' | 'model' | 'poi'
export type SceneStateStatus = 'loaded' | 'visible' | 'hidden' | 'disposed' | 'cached'

export type SceneStateRecord = {
  modelId: string
  glbUrl?: string
  position: SceneStatePosition
  state: SceneStateStatus
  lastSeenTimestamp: number
  lastPosition: SceneStatePosition
  cacheRef?: any
  reusable: boolean
  kind: SceneStateModelKind
  routeProgress?: number
}

export type SceneStateRegisterMeta = {
  glbUrl?: string
  position: SceneStatePosition
  model?: any
  reusable?: boolean
  kind?: SceneStateModelKind
  routeProgress?: number
}

export type SceneStateManagerControls = {
  setVisible?: (modelId: string, visible: boolean) => void
  release?: (modelId: string, record: SceneStateRecord) => void
  load?: (modelId: string, record: SceneStateRecord) => Promise<boolean | void> | boolean | void
}

export type SceneStateManagerOptions = {
  enabled?: boolean
  activeWindowMeters?: number
  forwardWindowMeters?: number
  behindProgressWindow?: number
  rehydrateDebounceMs?: number
  protectedModelIds?: Iterable<string>
}

export type SceneStateUpdateInput = {
  cameraPosition: SceneStatePosition
  progress?: number
}

export type SceneStateManagerSnapshot = {
  loadedCount: number
  visibleCount: number
  hiddenCount: number
  cachedCount: number
  disposedCount: number
  rehydratedCount: number
  cacheHitRate: number
  activeLoadCount: number
}

type SceneStateLoadEntry = {
  timerId: number | null
  startedAt: number
}

type SceneStateManagerListener = (snapshot: SceneStateManagerSnapshot) => void

const DEFAULT_ACTIVE_WINDOW_METERS = 300
const DEFAULT_FORWARD_WINDOW_METERS = 800
const DEFAULT_BEHIND_PROGRESS_WINDOW = 0.035
const DEFAULT_REHYDRATE_DEBOUNCE_MS = 300

export class SceneStateManager {
  private enabled = true
  private activeWindowMeters = DEFAULT_ACTIVE_WINDOW_METERS
  private forwardWindowMeters = DEFAULT_FORWARD_WINDOW_METERS
  private behindProgressWindow = DEFAULT_BEHIND_PROGRESS_WINDOW
  private rehydrateDebounceMs = DEFAULT_REHYDRATE_DEBOUNCE_MS
  private records = new Map<string, SceneStateRecord>()
  private activeLoadMap = new Map<string, SceneStateLoadEntry>()
  private lastRehydrateAt = new Map<string, number>()
  private protectedModelIds = new Set<string>()
  private rehydratedCount = 0
  private cacheHitCount = 0
  private reloadCount = 0
  private listeners = new Set<SceneStateManagerListener>()

  constructor(private readonly controls: SceneStateManagerControls = {}) {}

  configure(options: SceneStateManagerOptions) {
    this.enabled = options.enabled ?? this.enabled
    this.activeWindowMeters = options.activeWindowMeters ?? this.activeWindowMeters
    this.forwardWindowMeters = options.forwardWindowMeters ?? this.forwardWindowMeters
    this.behindProgressWindow = options.behindProgressWindow ?? this.behindProgressWindow
    this.rehydrateDebounceMs = options.rehydrateDebounceMs ?? this.rehydrateDebounceMs
    this.protectedModelIds = new Set(options.protectedModelIds ?? [])
    this.notify()
  }

  register(modelId: string, meta: SceneStateRegisterMeta) {
    if (!modelId || !isValidPosition(meta.position)) {
      return
    }

    const now = Date.now()
    const current = this.records.get(modelId)
    const state =
      meta.model
        ? current?.state === 'hidden' || current?.state === 'cached'
          ? current.state
          : 'loaded'
        : current?.state ?? 'cached'

    this.records.set(modelId, {
      modelId,
      glbUrl: meta.glbUrl ?? current?.glbUrl,
      position: meta.position,
      state,
      lastSeenTimestamp: now,
      lastPosition: meta.position,
      cacheRef: meta.model ?? current?.cacheRef,
      reusable: meta.reusable ?? current?.reusable ?? true,
      kind: meta.kind ?? current?.kind ?? 'model',
      routeProgress: meta.routeProgress ?? current?.routeProgress
    })
    this.notify()
  }

  unregister(modelId: string) {
    this.cancelPendingLoad(modelId)
    this.records.delete(modelId)
    this.lastRehydrateAt.delete(modelId)
    this.notify()
  }

  markVisible(modelId: string) {
    const record = this.records.get(modelId)

    if (!record) {
      return
    }

    record.state = 'visible'
    record.lastSeenTimestamp = Date.now()
    this.controls.setVisible?.(modelId, true)
    this.notify()
  }

  markHidden(modelId: string) {
    const record = this.records.get(modelId)

    if (!record || record.state === 'disposed') {
      return
    }

    if (this.protectedModelIds.has(modelId)) {
      this.markVisible(modelId)
      return
    }

    record.state = 'hidden'
    record.lastSeenTimestamp = Date.now()
    this.controls.setVisible?.(modelId, false)
    this.notify()
  }

  markCached(modelId: string) {
    const record = this.records.get(modelId)

    if (!record || record.state === 'disposed') {
      return
    }

    if (this.protectedModelIds.has(modelId)) {
      this.markVisible(modelId)
      return
    }

    record.state = 'cached'
    record.lastSeenTimestamp = Date.now()
    this.controls.setVisible?.(modelId, false)
    this.notify()
  }

  markDisposed(modelId: string) {
    const record = this.records.get(modelId)

    if (!record) {
      return false
    }

    if (this.protectedModelIds.has(modelId)) {
      this.rehydrate(modelId)
      return false
    }

    record.state = 'disposed'
    record.reusable = false
    record.cacheRef = undefined
    record.lastSeenTimestamp = Date.now()
    this.cancelPendingLoad(modelId)
    this.notify()
    return true
  }

  release(modelId: string) {
    const record = this.records.get(modelId)

    if (!record) {
      return false
    }

    if (this.protectedModelIds.has(modelId)) {
      this.rehydrate(modelId)
      return false
    }

    if (record.state !== 'disposed') {
      this.markDisposed(modelId)
      this.controls.release?.(modelId, record)
    }

    return true
  }

  updatePosition(modelId: string, position: SceneStatePosition) {
    const record = this.records.get(modelId)

    if (!record || !isValidPosition(position)) {
      return
    }

    record.position = position
    record.lastPosition = position
    record.lastSeenTimestamp = Date.now()
  }

  update(input: SceneStateUpdateInput) {
    if (!this.enabled || !isValidPosition(input.cameraPosition)) {
      return
    }

    this.records.forEach((record, modelId) => {
      if (this.protectedModelIds.has(modelId)) {
        this.rehydrate(modelId)
        return
      }

      const distanceMeters = haversineDistanceMeters(input.cameraPosition, record.position)
      const behind =
        input.progress !== undefined &&
        record.routeProgress !== undefined &&
        record.routeProgress < input.progress - this.behindProgressWindow &&
        distanceMeters > this.activeWindowMeters

      if (distanceMeters <= this.activeWindowMeters && !behind) {
        this.rehydrate(modelId)
        return
      }

      if (distanceMeters <= this.forwardWindowMeters && !behind) {
        this.markCached(modelId)
        return
      }

      this.release(modelId)
    })
  }

  rehydrate(modelId: string) {
    const record = this.records.get(modelId)

    if (!record) {
      return false
    }

    if (record.state === 'visible') {
      return true
    }

    if ((record.state === 'hidden' || record.state === 'cached' || record.state === 'loaded') && record.cacheRef && record.reusable) {
      this.cacheHitCount += 1
      this.rehydratedCount += 1
      this.markVisible(modelId)
      return true
    }

    if (record.state !== 'disposed') {
      this.markVisible(modelId)
      return true
    }

    this.scheduleReload(modelId, record)
    return true
  }

  getSnapshot(): SceneStateManagerSnapshot {
    const records = Array.from(this.records.values())
    const attempts = this.cacheHitCount + this.reloadCount

    return {
      loadedCount: records.filter((record) => record.state !== 'disposed').length,
      visibleCount: records.filter((record) => record.state === 'visible').length,
      hiddenCount: records.filter((record) => record.state === 'hidden').length,
      cachedCount: records.filter((record) => record.state === 'cached').length,
      disposedCount: records.filter((record) => record.state === 'disposed').length,
      rehydratedCount: this.rehydratedCount,
      cacheHitRate: attempts > 0 ? Number((this.cacheHitCount / attempts).toFixed(3)) : 0,
      activeLoadCount: this.activeLoadMap.size
    }
  }

  subscribe(listener: SceneStateManagerListener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy() {
    Array.from(this.activeLoadMap.keys()).forEach((modelId) => this.cancelPendingLoad(modelId))
    this.records.clear()
    this.lastRehydrateAt.clear()
    this.listeners.clear()
  }

  private scheduleReload(modelId: string, record: SceneStateRecord) {
    if (this.activeLoadMap.has(modelId)) {
      return
    }

    const now = Date.now()
    const lastStartedAt = this.lastRehydrateAt.get(modelId) ?? 0
    const delayMs = Math.max(0, this.rehydrateDebounceMs - (now - lastStartedAt))
    const timerId = window.setTimeout(() => {
      const entry = this.activeLoadMap.get(modelId)
      if (!entry) {
        return
      }

      this.activeLoadMap.set(modelId, {
        ...entry,
        timerId: null
      })
      this.startReload(modelId, record)
    }, delayMs)

    this.activeLoadMap.set(modelId, {
      timerId,
      startedAt: now
    })
    this.lastRehydrateAt.set(modelId, now + delayMs)
    this.notify()
  }

  private startReload(modelId: string, record: SceneStateRecord) {
    this.reloadCount += 1

    Promise.resolve(this.controls.load?.(modelId, record))
      .then(() => {
        const current = this.records.get(modelId)
        if (current) {
          current.state = 'loaded'
          current.lastSeenTimestamp = Date.now()
          this.rehydratedCount += 1
        }
      })
      .finally(() => {
        this.activeLoadMap.delete(modelId)
        this.notify()
      })
  }

  private cancelPendingLoad(modelId: string) {
    const entry = this.activeLoadMap.get(modelId)

    if (!entry) {
      return
    }

    if (entry.timerId !== null) {
      window.clearTimeout(entry.timerId)
    }

    this.activeLoadMap.delete(modelId)
  }

  private notify() {
    if (!this.listeners.size) {
      return
    }

    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

function isValidPosition(position: SceneStatePosition) {
  return Number.isFinite(position.lat) && Number.isFinite(position.lng)
}

function haversineDistanceMeters(a: SceneStatePosition, b: SceneStatePosition) {
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
