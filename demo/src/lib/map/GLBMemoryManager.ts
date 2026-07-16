export type GLBMemoryModelKind = 'landmark' | 'companion' | 'model'

export type GLBMemoryRegisterOptions = {
  kind?: GLBMemoryModelKind
  estimatedMemoryMB?: number
}

export type GLBMemoryManagerOptions = {
  enabled?: boolean
  maxActiveModels?: number
  ttlMs?: number
  sweepIntervalMs?: number
  protectedModelIds?: Iterable<string>
}

export type GLBMemoryManagerSnapshot = {
  enabled: boolean
  maxActiveModels: number
  ttlMs: number
  activeCount: number
  cachedCount: number
  softDetachedCount: number
  disposedCount: number
  memoryEstimateMB: number
}

type GLBMemoryRecord = {
  model: any
  kind: GLBMemoryModelKind
  estimatedMemoryMB: number
  visible: boolean
  softDetached: boolean
  disposed: boolean
  lastAccessAt: number
  lastVisibleAt: number
  originalSetMap?: (...args: any[]) => any
  originalSetVisible?: (...args: any[]) => any
}

type GLBMemoryManagerListener = (snapshot: GLBMemoryManagerSnapshot) => void

const DEFAULT_MAX_ACTIVE_MODELS = 80
const DEFAULT_TTL_MS = 60000
const DEFAULT_SWEEP_INTERVAL_MS = 5000

const MODEL_MEMORY_ESTIMATE_MB: Record<GLBMemoryModelKind, number> = {
  landmark: 36,
  companion: 2,
  model: 8
}

export class GLBMemoryManager {
  private map: any = null
  private enabled = true
  private maxActiveModels = DEFAULT_MAX_ACTIVE_MODELS
  private ttlMs = DEFAULT_TTL_MS
  private sweepIntervalMs = DEFAULT_SWEEP_INTERVAL_MS
  private sweepTimer: number | null = null
  private disposedCount = 0
  private records = new Map<string, GLBMemoryRecord>()
  private protectedModelIds = new Set<string>()
  private listeners = new Set<GLBMemoryManagerListener>()

  init(map: any) {
    this.map = map
    this.start()
  }

  configure(options: GLBMemoryManagerOptions) {
    const wasEnabled = this.enabled
    this.enabled = options.enabled ?? this.enabled
    this.maxActiveModels = options.maxActiveModels ?? this.maxActiveModels
    this.ttlMs = options.ttlMs ?? this.ttlMs
    this.sweepIntervalMs = options.sweepIntervalMs ?? this.sweepIntervalMs
    this.protectedModelIds = new Set(options.protectedModelIds ?? [])

    if (wasEnabled && !this.enabled) {
      this.restoreSoftDetachedModels()
    }

    this.restart()
    this.notify()
  }

  register(modelId: string, model: any, options: GLBMemoryRegisterOptions = {}) {
    if (!modelId || !model) {
      return
    }

    const now = Date.now()
    const current = this.records.get(modelId)

    if (current && current.model === model && !current.disposed) {
      current.kind = options.kind ?? current.kind
      current.estimatedMemoryMB = options.estimatedMemoryMB ?? current.estimatedMemoryMB
      current.lastAccessAt = now
      return
    }

    if (current) {
      this.unregister(modelId)
    }

    const kind = options.kind ?? 'model'
    const record: GLBMemoryRecord = {
      model,
      kind,
      estimatedMemoryMB: options.estimatedMemoryMB ?? MODEL_MEMORY_ESTIMATE_MB[kind],
      visible: true,
      softDetached: false,
      disposed: false,
      lastAccessAt: now,
      lastVisibleAt: now
    }

    this.patchModelVisibility(modelId, record)
    this.records.set(modelId, record)
    this.notify()
  }

  unregister(modelId: string) {
    const record = this.records.get(modelId)

    if (!record) {
      return
    }

    this.hardDisposeRecord(record)
    this.records.delete(modelId)
    this.notify()
  }

  syncRegisteredModelIds(activeModelIds: Set<string>) {
    Array.from(this.records.keys()).forEach((modelId) => {
      if (!activeModelIds.has(modelId)) {
        this.unregister(modelId)
      }
    })
  }

  markUsed(modelId: string) {
    const record = this.records.get(modelId)

    if (!record || record.disposed) {
      return
    }

    const now = Date.now()
    record.lastAccessAt = now
    record.lastVisibleAt = record.visible ? now : record.lastVisibleAt
  }

  getSnapshot(): GLBMemoryManagerSnapshot {
    const activeCount = Array.from(this.records.values()).filter((record) => record.visible && !record.disposed).length
    const cachedRecords = Array.from(this.records.values()).filter((record) => !record.disposed)

    return {
      enabled: this.enabled,
      maxActiveModels: this.maxActiveModels,
      ttlMs: this.ttlMs,
      activeCount,
      cachedCount: cachedRecords.length,
      softDetachedCount: cachedRecords.filter((record) => record.softDetached).length,
      disposedCount: this.disposedCount,
      memoryEstimateMB: Math.round(cachedRecords.reduce((total, record) => total + record.estimatedMemoryMB, 0))
    }
  }

  subscribe(listener: GLBMemoryManagerListener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy() {
    this.stop()
    this.records.forEach((record) => {
      this.restoreModelMethods(record)
    })
    this.records.clear()
    this.map = null
    this.notify()
  }

  private start() {
    if (this.sweepTimer !== null) {
      return
    }

    this.sweepTimer = window.setInterval(() => {
      this.sweep()
    }, this.sweepIntervalMs)
  }

  private stop() {
    if (this.sweepTimer === null) {
      return
    }

    window.clearInterval(this.sweepTimer)
    this.sweepTimer = null
  }

  private restart() {
    this.stop()
    this.start()
  }

  private sweep() {
    if (!this.enabled) {
      return
    }

    const now = Date.now()
    const liveRecords = Array.from(this.records.entries()).filter(([, record]) => !record.disposed)
    const reclaimable = liveRecords
      .filter(([modelId, record]) => !this.protectedModelIds.has(modelId) && !record.visible && now - record.lastVisibleAt >= this.ttlMs)
      .sort(([, a], [, b]) => a.lastAccessAt - b.lastAccessAt)
    const excessCount = Math.max(0, liveRecords.length - this.maxActiveModels)

    reclaimable.slice(0, excessCount).forEach(([, record]) => {
      this.softDetachRecord(record)
    })

    if (excessCount > 0 || reclaimable.length > 0) {
      this.notify()
    }
  }

  private patchModelVisibility(modelId: string, record: GLBMemoryRecord) {
    if (typeof record.model?.setMap === 'function') {
      record.originalSetMap = record.model.setMap.bind(record.model)
      record.model.setMap = (map: any) => {
        const result = record.originalSetMap?.(map)
        this.updateVisibilityFromModelCall(modelId, record, Boolean(map))
        record.softDetached = false
        return result
      }
    }

    if (typeof record.model?.setVisible === 'function') {
      record.originalSetVisible = record.model.setVisible.bind(record.model)
      record.model.setVisible = (visible: boolean) => {
        const result = record.originalSetVisible?.(visible)
        this.updateVisibilityFromModelCall(modelId, record, Boolean(visible))
        return result
      }
    }
  }

  private updateVisibilityFromModelCall(modelId: string, record: GLBMemoryRecord, visible: boolean) {
    if (record.disposed) {
      return
    }

    const now = Date.now()
    record.visible = visible
    record.lastAccessAt = now

    if (visible) {
      record.lastVisibleAt = now
    }

    this.records.set(modelId, record)
  }

  private softDetachRecord(record: GLBMemoryRecord) {
    if (record.disposed || record.visible || record.softDetached) {
      return
    }

    try {
      record.originalSetMap?.(null)
      record.softDetached = true
    } catch {
      // Best-effort: Tencent GLTFModel may not expose a stable detach path.
    }
  }

  private restoreSoftDetachedModels() {
    this.records.forEach((record) => {
      if (!record.softDetached || record.disposed) {
        return
      }

      try {
        record.originalSetMap?.(this.map)
      } catch {
        // Optional restore path.
      }

      record.softDetached = false
      record.visible = true
      record.lastAccessAt = Date.now()
      record.lastVisibleAt = record.lastAccessAt
    })
  }

  private hardDisposeRecord(record: GLBMemoryRecord) {
    if (record.disposed) {
      return
    }

    record.disposed = true
    this.restoreModelMethods(record)

    try {
      record.originalSetMap?.(null)
    } catch {
      // Optional cleanup path.
    }

    try {
      record.model?.remove?.()
    } catch {
      // Optional cleanup path.
    }

    try {
      record.model?.destroy?.()
    } catch {
      // Optional cleanup path.
    }

    disposeThreeLikeObject(record.model)
    record.model = null
    this.disposedCount += 1
  }

  private restoreModelMethods(record: GLBMemoryRecord) {
    if (record.originalSetMap) {
      try {
        record.model.setMap = record.originalSetMap
      } catch {
        // Optional restore path.
      }
    }

    if (record.originalSetVisible) {
      try {
        record.model.setVisible = record.originalSetVisible
      } catch {
        // Optional restore path.
      }
    }
  }

  private notify() {
    if (!this.listeners.size) {
      return
    }

    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

function disposeThreeLikeObject(object: any) {
  const visited = new Set<any>()

  const disposeNode = (node: any) => {
    if (!node || visited.has(node)) {
      return
    }

    visited.add(node)
    disposeGeometry(node.geometry)
    disposeMaterial(node.material)

    if (typeof node.traverse === 'function') {
      node.traverse((child: any) => {
        if (child !== node) {
          disposeNode(child)
        }
      })
      return
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(disposeNode)
    }

    disposeNode(node.scene)
    disposeNode(node.object3D)
    disposeNode(node.mesh)
    disposeNode(node.model)
  }

  disposeNode(object)
}

function disposeGeometry(geometry: any) {
  try {
    geometry?.dispose?.()
  } catch {
    // Optional cleanup path.
  }
}

function disposeMaterial(material: any) {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial)
    return
  }

  if (!material) {
    return
  }

  Object.values(material).forEach((value: any) => {
    if (value && typeof value.dispose === 'function') {
      try {
        value.dispose()
      } catch {
        // Optional cleanup path.
      }
    }
  })

  try {
    material.dispose?.()
  } catch {
    // Optional cleanup path.
  }
}
