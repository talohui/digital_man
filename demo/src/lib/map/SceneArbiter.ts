export type SceneArbiterActionType = 'load' | 'show' | 'hide' | 'dispose' | 'rehydrate'
export type SceneArbiterSource = 'orchestrator' | 'spatial' | 'memory' | 'window' | 'state' | 'runtime'
export type SceneArbiterModelKind = 'tree' | 'landmark' | 'companion' | 'model' | 'poi'

export type SceneArbiterModelMeta = {
  modelId: string
  kind?: SceneArbiterModelKind
  estimatedMemoryMB?: number
}

export type SceneArbiterActionContext = {
  source?: SceneArbiterSource
  kind?: SceneArbiterModelKind
  visible?: boolean
  protected?: boolean
  windowManaged?: boolean
  inWindow?: boolean
  sceneState?: 'loaded' | 'visible' | 'hidden' | 'disposed' | 'cached'
  memoryState?: 'active' | 'cached' | 'disposed' | 'detached'
  estimatedMemoryMB?: number
  reason?: string
}

export type SceneArbiterActionRequest = {
  type: SceneArbiterActionType
  modelId: string
  context?: SceneArbiterActionContext
}

export type SceneArbiterDecision = {
  allowed: boolean
  reason: string
  action: SceneArbiterActionType
  modelId: string
}

export type SceneArbiterOptions = {
  enabled?: boolean
  maxActiveGLB?: number
  memoryPressureThresholdMB?: number
  debounceMs?: number
}

export type SceneArbiterSnapshot = {
  enabled: boolean
  decisionCount: number
  deniedCount: number
  loadThrottleCount: number
  conflictResolveCount: number
  activeLoadCount: number
  activeModelCount: number
  memoryPressureEstimateMB: number
}

type GlobalSceneState = {
  modelId: string
  kind: SceneArbiterModelKind
  visible: boolean
  protected: boolean
  inWindow: boolean
  sceneState?: SceneArbiterActionContext['sceneState']
  memoryState?: SceneArbiterActionContext['memoryState']
  estimatedMemoryMB: number
  lastActionAt: number
  lastSource?: SceneArbiterSource
}

type SceneArbiterListener = (snapshot: SceneArbiterSnapshot) => void

const DEFAULT_MAX_ACTIVE_GLB = 80
const DEFAULT_MEMORY_THRESHOLD_MB = 360
const DEFAULT_DEBOUNCE_MS = 300

const SOURCE_PRIORITY: Record<SceneArbiterSource, number> = {
  window: 5,
  state: 4,
  spatial: 3,
  memory: 2,
  orchestrator: 1,
  runtime: 1
}

const DEFAULT_MEMORY_ESTIMATE_MB: Record<SceneArbiterModelKind, number> = {
  tree: 1.2,
  landmark: 36,
  companion: 2,
  model: 8,
  poi: 0.05
}

export class SceneArbiter {
  private enabled = true
  private maxActiveGLB = DEFAULT_MAX_ACTIVE_GLB
  private memoryPressureThresholdMB = DEFAULT_MEMORY_THRESHOLD_MB
  private debounceMs = DEFAULT_DEBOUNCE_MS
  private decisionCount = 0
  private deniedCount = 0
  private loadThrottleCount = 0
  private conflictResolveCount = 0
  private globalState = new Map<string, GlobalSceneState>()
  private activeLoadSet = new Set<string>()
  private pendingDecisionQueue = new Map<string, number>()
  private listeners = new Set<SceneArbiterListener>()

  configure(options: SceneArbiterOptions) {
    this.enabled = options.enabled ?? this.enabled
    this.maxActiveGLB = options.maxActiveGLB ?? this.maxActiveGLB
    this.memoryPressureThresholdMB = options.memoryPressureThresholdMB ?? this.memoryPressureThresholdMB
    this.debounceMs = options.debounceMs ?? this.debounceMs
    this.notify()
  }

  registerModel(meta: SceneArbiterModelMeta) {
    if (!meta.modelId) {
      return
    }

    const current = this.globalState.get(meta.modelId)
    const kind = meta.kind ?? current?.kind ?? 'model'

    this.globalState.set(meta.modelId, {
      modelId: meta.modelId,
      kind,
      visible: current?.visible ?? false,
      protected: current?.protected ?? false,
      inWindow: current?.inWindow ?? true,
      sceneState: current?.sceneState,
      memoryState: current?.memoryState,
      estimatedMemoryMB: meta.estimatedMemoryMB ?? current?.estimatedMemoryMB ?? DEFAULT_MEMORY_ESTIMATE_MB[kind],
      lastActionAt: current?.lastActionAt ?? Date.now(),
      lastSource: current?.lastSource
    })
    this.notify()
  }

  unregisterModel(modelId: string) {
    this.globalState.delete(modelId)
    this.activeLoadSet.delete(modelId)
    this.pendingDecisionQueue.delete(modelId)
    this.notify()
  }

  syncRegisteredModelIds(modelIds: Set<string>) {
    let changed = false

    this.globalState.forEach((_record, modelId) => {
      if (!modelIds.has(modelId)) {
        this.globalState.delete(modelId)
        this.activeLoadSet.delete(modelId)
        this.pendingDecisionQueue.delete(modelId)
        changed = true
      }
    })

    if (changed) {
      this.notify()
    }
  }

  canLoad(modelId: string, context: SceneArbiterActionContext = {}) {
    return this.requestAction({ type: 'load', modelId, context }).allowed
  }

  canDispose(modelId: string, context: SceneArbiterActionContext = {}) {
    return this.requestAction({ type: 'dispose', modelId, context }).allowed
  }

  canRehydrate(modelId: string, context: SceneArbiterActionContext = {}) {
    return this.requestAction({ type: 'rehydrate', modelId, context }).allowed
  }

  requestAction(request: SceneArbiterActionRequest): SceneArbiterDecision {
    const { type, modelId } = request
    const context = request.context ?? {}

    if (!modelId) {
      return {
        allowed: false,
        reason: 'missing-model-id',
        action: type,
        modelId
      }
    }

    this.decisionCount += 1

    if (!this.enabled) {
      const allowedDecision = this.allow(request, 'arbiter-disabled')
      this.notify()
      return allowedDecision
    }

    const record = this.ensureRecord(modelId, context)
    const decision = this.evaluate(type, record, context)
    this.applyDecision(decision, record, context)
    this.notify()
    return decision
  }

  releaseLoad(modelId: string) {
    this.activeLoadSet.delete(modelId)
    this.pendingDecisionQueue.delete(modelId)
    this.notify()
  }

  getSnapshot(): SceneArbiterSnapshot {
    const activeRecords = Array.from(this.globalState.values()).filter((record) => this.isActiveBudgetRecord(record))

    return {
      enabled: this.enabled,
      decisionCount: this.decisionCount,
      deniedCount: this.deniedCount,
      loadThrottleCount: this.loadThrottleCount,
      conflictResolveCount: this.conflictResolveCount,
      activeLoadCount: this.activeLoadSet.size,
      activeModelCount: activeRecords.length,
      memoryPressureEstimateMB: Math.round(
        activeRecords.reduce((total, record) => total + record.estimatedMemoryMB, 0)
      )
    }
  }

  subscribe(listener: SceneArbiterListener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy() {
    this.globalState.clear()
    this.activeLoadSet.clear()
    this.pendingDecisionQueue.clear()
    this.listeners.clear()
  }

  private evaluate(
    action: SceneArbiterActionType,
    record: GlobalSceneState,
    context: SceneArbiterActionContext
  ): SceneArbiterDecision {
    if (action === 'load' || action === 'rehydrate') {
      if (this.activeLoadSet.has(record.modelId)) {
        this.loadThrottleCount += 1
        return this.deny(action, record.modelId, 'load-already-active')
      }

      const lastQueuedAt = this.pendingDecisionQueue.get(record.modelId) ?? 0
      const now = Date.now()

      const protectedModel = context.protected === true || record.protected

      if (!protectedModel && now - lastQueuedAt < this.debounceMs) {
        this.loadThrottleCount += 1
        return this.deny(action, record.modelId, 'load-debounced')
      }

      const budgetDenyReason = protectedModel ? null : this.getConvergenceBudgetDenyReason(record, context)
      if (budgetDenyReason) {
        this.conflictResolveCount += 1
        return this.deny(action, record.modelId, budgetDenyReason)
      }

      return this.allow({ type: action, modelId: record.modelId, context }, context.reason ?? 'allowed')
    }

    if (action === 'dispose') {
      const source = context.source ?? 'runtime'
      const sourcePriority = SOURCE_PRIORITY[source]
      const protectedModel = context.protected === true || record.protected

      if (protectedModel) {
        this.conflictResolveCount += 1
        return this.deny(action, record.modelId, 'protected-landmark')
      }

      if (record.visible && sourcePriority < SOURCE_PRIORITY.window) {
        this.conflictResolveCount += 1
        return this.deny(action, record.modelId, 'visible-model-protected')
      }

      return this.allow({ type: action, modelId: record.modelId, context }, context.reason ?? 'allowed')
    }

    return this.allow({ type: action, modelId: record.modelId, context }, context.reason ?? 'allowed')
  }

  private applyDecision(decision: SceneArbiterDecision, record: GlobalSceneState, context: SceneArbiterActionContext) {
    if (!decision.allowed) {
      this.deniedCount += 1
      return
    }

    const now = Date.now()
    record.lastActionAt = now
    record.lastSource = context.source

    if (context.inWindow !== undefined) {
      record.inWindow = context.inWindow
    }

    if (context.protected !== undefined) {
      record.protected = context.protected
    }

    if (context.sceneState) {
      record.sceneState = context.sceneState
    }

    if (context.memoryState) {
      record.memoryState = context.memoryState
    }

    if (context.estimatedMemoryMB !== undefined) {
      record.estimatedMemoryMB = context.estimatedMemoryMB
    }

    if (decision.action === 'show') {
      record.visible = true
      record.sceneState = 'visible'
      record.memoryState = record.memoryState === 'disposed' ? 'active' : record.memoryState
      return
    }

    if (decision.action === 'hide') {
      record.visible = false
      record.sceneState = record.sceneState === 'disposed' ? 'disposed' : 'hidden'
      return
    }

    if (decision.action === 'dispose') {
      record.visible = false
      record.sceneState = 'disposed'
      record.memoryState = 'disposed'
      this.activeLoadSet.delete(record.modelId)
      this.pendingDecisionQueue.delete(record.modelId)
      return
    }

    if (decision.action === 'load' || decision.action === 'rehydrate') {
      this.activeLoadSet.add(record.modelId)
      this.pendingDecisionQueue.set(record.modelId, now)
      record.memoryState = 'active'
      record.sceneState = decision.action === 'rehydrate' ? 'loaded' : record.sceneState ?? 'loaded'
    }
  }

  private ensureRecord(modelId: string, context: SceneArbiterActionContext) {
    const current = this.globalState.get(modelId)

    if (current) {
      if (context.kind) {
        current.kind = context.kind
      }
      if (context.estimatedMemoryMB !== undefined) {
        current.estimatedMemoryMB = context.estimatedMemoryMB
      }
      if (context.protected !== undefined) {
        current.protected = context.protected
      }
      return current
    }

    const kind = context.kind ?? 'model'
    const record: GlobalSceneState = {
      modelId,
      kind,
      visible: Boolean(context.visible),
      protected: Boolean(context.protected),
      inWindow: context.inWindow ?? true,
      sceneState: context.sceneState,
      memoryState: context.memoryState,
      estimatedMemoryMB: context.estimatedMemoryMB ?? DEFAULT_MEMORY_ESTIMATE_MB[kind],
      lastActionAt: Date.now(),
      lastSource: context.source
    }

    this.globalState.set(modelId, record)
    return record
  }

  private isWithinConvergenceBudget(nextRecord: GlobalSceneState) {
    return this.getConvergenceBudgetDenyReason(nextRecord) === null
  }

  private getConvergenceBudgetDenyReason(nextRecord: GlobalSceneState, context: SceneArbiterActionContext = {}) {
    const activeRecords = Array.from(this.globalState.values()).filter((record) => this.isActiveBudgetRecord(record))
    const activeCount = activeRecords.length
    const memoryPressure = activeRecords.reduce((total, record) => total + record.estimatedMemoryMB, 0)
    const isWindowManagedLandmark =
      context.windowManaged === true && (nextRecord.kind === 'landmark' || nextRecord.kind === 'companion')

    if (isWindowManagedLandmark) {
      return activeCount < this.maxActiveGLB ? null : 'active-budget-full-no-evictable'
    }

    if (activeCount < this.maxActiveGLB) {
      return memoryPressure + nextRecord.estimatedMemoryMB <= this.memoryPressureThresholdMB ? null : 'memory-pressure'
    }

    return 'active-budget-full-no-evictable'
  }

  private isActiveBudgetRecord(record: GlobalSceneState) {
    if (record.memoryState === 'disposed' || record.memoryState === 'cached' || record.memoryState === 'detached') {
      return false
    }

    if (record.sceneState === 'disposed' || record.sceneState === 'cached' || record.sceneState === 'hidden') {
      return false
    }

    return record.visible || record.sceneState === 'loaded' || record.sceneState === 'visible' || record.memoryState === 'active' || record.protected
  }

  private allow(request: SceneArbiterActionRequest, reason: string): SceneArbiterDecision {
    return {
      allowed: true,
      reason,
      action: request.type,
      modelId: request.modelId
    }
  }

  private deny(action: SceneArbiterActionType, modelId: string, reason: string): SceneArbiterDecision {
    return {
      allowed: false,
      reason,
      action,
      modelId
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
