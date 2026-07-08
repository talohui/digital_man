export type GLBRuntimeOrchestratorPhase =
  | 'disabled'
  | 'waiting-map'
  | 'waiting-visual'
  | 'route-poi'
  | 'landmarks'
  | 'garden'
  | 'ready'

export type GLBRuntimeOrchestratorProfile = 'desktop' | 'mobile' | 'debug'

export type GLBRuntimeOrchestratorSnapshot = {
  enabled: boolean
  phase: GLBRuntimeOrchestratorPhase
  profile: GLBRuntimeOrchestratorProfile
  landmarkGate: boolean
  gardenGate: boolean
  landmarkDelayMs: number
  gardenDelayMs: number
  pendingTimerCount: number
  reason: string
  updatedAt: number
}

export type GLBRuntimeOrchestratorInput = {
  enabled: boolean
  mapReady: boolean
  visualReady: boolean
  debugGarden: boolean
  inkCleanMode: boolean
  mobile: boolean
  interactionLiteMode: boolean
}

type GLBRuntimeOrchestratorListener = (snapshot: GLBRuntimeOrchestratorSnapshot) => void

const DESKTOP_DELAYS = {
  landmarkDelayMs: 120,
  gardenDelayMs: 760
}

const MOBILE_DELAYS = {
  landmarkDelayMs: 320,
  gardenDelayMs: 1500
}

const DEBUG_DELAYS = {
  landmarkDelayMs: 0,
  gardenDelayMs: 0
}

export class GLBRuntimeOrchestrator {
  private listeners = new Set<GLBRuntimeOrchestratorListener>()
  private timers: number[] = []
  private signature = ''
  private snapshot: GLBRuntimeOrchestratorSnapshot = createSnapshot({
    enabled: false,
    phase: 'disabled',
    profile: 'desktop',
    landmarkGate: false,
    gardenGate: false,
    landmarkDelayMs: 0,
    gardenDelayMs: 0,
    reason: 'not-initialized'
  })

  update(input: GLBRuntimeOrchestratorInput) {
    const profile = input.debugGarden ? 'debug' : input.mobile ? 'mobile' : 'desktop'
    const delays = getDelays(profile)
    const nextSignature = [
      input.enabled,
      input.mapReady,
      input.visualReady,
      input.debugGarden,
      input.inkCleanMode,
      input.mobile
    ].join('|')

    if (this.signature === nextSignature) {
      return
    }

    this.signature = nextSignature
    this.clearTimers()

    if (!input.enabled || input.inkCleanMode) {
      this.setSnapshot({
        enabled: false,
        phase: 'disabled',
        profile,
        landmarkGate: false,
        gardenGate: false,
        landmarkDelayMs: delays.landmarkDelayMs,
        gardenDelayMs: delays.gardenDelayMs,
        reason: input.inkCleanMode ? 'ink-clean-mode' : 'not-prototype-c'
      })
      return
    }

    if (!input.mapReady) {
      this.setSnapshot({
        enabled: true,
        phase: 'waiting-map',
        profile,
        landmarkGate: false,
        gardenGate: false,
        landmarkDelayMs: delays.landmarkDelayMs,
        gardenDelayMs: delays.gardenDelayMs,
        reason: 'map-not-ready'
      })
      return
    }

    if (!input.visualReady) {
      this.setSnapshot({
        enabled: true,
        phase: 'waiting-visual',
        profile,
        landmarkGate: false,
        gardenGate: false,
        landmarkDelayMs: delays.landmarkDelayMs,
        gardenDelayMs: delays.gardenDelayMs,
        reason: 'visual-not-ready'
      })
      return
    }

    if (input.debugGarden) {
      this.setSnapshot({
        enabled: true,
        phase: 'ready',
        profile,
        landmarkGate: true,
        gardenGate: true,
        landmarkDelayMs: delays.landmarkDelayMs,
        gardenDelayMs: delays.gardenDelayMs,
        reason: 'debug-garden-bypass'
      })
      return
    }

    if (this.snapshot.landmarkGate || this.snapshot.gardenGate) {
      this.setSnapshot({
        enabled: true,
        phase: 'ready',
        profile,
        landmarkGate: true,
        gardenGate: true,
        landmarkDelayMs: delays.landmarkDelayMs,
        gardenDelayMs: delays.gardenDelayMs,
        reason: 'runtime-gates-preserved'
      })
      return
    }

    this.schedule(() => {
      this.setSnapshot({
        enabled: true,
        phase: 'landmarks',
        profile,
        landmarkGate: true,
        gardenGate: false,
        landmarkDelayMs: delays.landmarkDelayMs,
        gardenDelayMs: delays.gardenDelayMs,
        reason: 'landmark-gate-open'
      })
    }, delays.landmarkDelayMs)

    this.schedule(() => {
      this.setSnapshot({
        enabled: true,
        phase: 'garden',
        profile,
        landmarkGate: true,
        gardenGate: true,
        landmarkDelayMs: delays.landmarkDelayMs,
        gardenDelayMs: delays.gardenDelayMs,
        reason: 'garden-gate-open'
      })
    }, delays.gardenDelayMs)

    this.setSnapshot({
      enabled: true,
      phase: 'route-poi',
      profile,
      landmarkGate: false,
      gardenGate: false,
      landmarkDelayMs: delays.landmarkDelayMs,
      gardenDelayMs: delays.gardenDelayMs,
      reason: input.interactionLiteMode ? 'waiting-interaction-lite' : 'staging-runtime-glb'
    })
  }

  getSnapshot() {
    return this.snapshot
  }

  subscribe(listener: GLBRuntimeOrchestratorListener) {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy() {
    this.clearTimers()
    this.signature = ''
    this.setSnapshot({
      enabled: false,
      phase: 'disabled',
      profile: this.snapshot.profile,
      landmarkGate: false,
      gardenGate: false,
      landmarkDelayMs: 0,
      gardenDelayMs: 0,
      reason: 'destroyed'
    })
  }

  private clearTimers() {
    this.timers.forEach((timer) => window.clearTimeout(timer))
    this.timers = []
  }

  private schedule(callback: () => void, delayMs: number) {
    const timer = window.setTimeout(() => {
      this.timers = this.timers.filter((item) => item !== timer)
      callback()
    }, delayMs)
    this.timers.push(timer)
  }

  private setSnapshot(next: Omit<GLBRuntimeOrchestratorSnapshot, 'pendingTimerCount' | 'updatedAt'>) {
    this.snapshot = createSnapshot({
      ...next,
      pendingTimerCount: this.timers.length
    })
    this.notify()
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.snapshot))
  }
}

function getDelays(profile: GLBRuntimeOrchestratorProfile) {
  if (profile === 'debug') {
    return DEBUG_DELAYS
  }

  if (profile === 'mobile') {
    return MOBILE_DELAYS
  }

  return DESKTOP_DELAYS
}

function createSnapshot(
  snapshot: Omit<GLBRuntimeOrchestratorSnapshot, 'pendingTimerCount' | 'updatedAt'> &
    Partial<Pick<GLBRuntimeOrchestratorSnapshot, 'pendingTimerCount'>>
): GLBRuntimeOrchestratorSnapshot {
  return {
    ...snapshot,
    pendingTimerCount: snapshot.pendingTimerCount ?? 0,
    updatedAt: Date.now()
  }
}
