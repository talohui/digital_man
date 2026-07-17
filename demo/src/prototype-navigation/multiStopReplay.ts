import { create } from 'zustand'

import type { ReplayNoiseMode, ReplaySpeed } from './types'

export type MultiStopReplayMode = 'manual-confirm' | 'auto-inspection'
export type MultiStopReplayRange = 2 | 3 | 'all'
export type MultiStopReplayStatus =
  | 'idle'
  | 'preparing'
  | 'planning-segment'
  | 'replaying-segment'
  | 'awaiting-arrival-confirm'
  | 'awaiting-route-continue'
  | 'paused'
  | 'failed'
  | 'completed'
  | 'cancelled'

export type MultiStopSegmentResult = {
  fromStopIndex: number
  targetStopIndex: number
  targetPoiId: string
  targetName: string
  sessionId: string
  plannedDistanceMeters?: number
  plannedDurationMinutes?: number
  stepCount?: number
  startedAt: number
  arrivedAt?: number
  committedAt?: number
  status: 'completed' | 'failed' | 'cancelled'
  error?: string
}

export type MultiStopReplaySession = {
  version: 1
  coordinatorId: string
  routeId: string
  routeName: string
  initialStage: 'active' | 'joining'
  startStopIndex: number
  endStopIndex: number
  currentFromStopIndex: number
  currentTargetStopIndex: number
  currentSegmentOrdinal: number
  totalSegmentCount: number
  currentSegmentSessionId?: string
  currentRequestGeneration?: number
  mode: MultiStopReplayMode
  speedMultiplier: ReplaySpeed
  noiseMode: Extract<ReplayNoiseMode, 'clean' | 'normal'>
  status: MultiStopReplayStatus
  pausedFromStatus?: MultiStopReplayStatus
  completedTargetStopIndices: number[]
  completedSegmentCount: number
  startedAt: number
  updatedAt: number
  lastError?: {
    segmentFrom: number
    segmentTo: number
    message: string
  }
}

const STORAGE_KEY = 'lingshan-navigation-multi-replay:v1'
const MAX_AGE_MS = 2 * 60 * 60 * 1_000

type PersistedMultiStopReplay = {
  version: 1
  savedAt: number
  range: MultiStopReplayRange
  mode: MultiStopReplayMode
  speed: ReplaySpeed
  noiseMode: Extract<ReplayNoiseMode, 'clean' | 'normal'>
  session?: MultiStopReplaySession
  results: MultiStopSegmentResult[]
}

type MultiStopReplayStore = {
  hydrated: boolean
  range: MultiStopReplayRange
  mode: MultiStopReplayMode
  speed: ReplaySpeed
  noiseMode: Extract<ReplayNoiseMode, 'clean' | 'normal'>
  session?: MultiStopReplaySession
  results: MultiStopSegmentResult[]
  hydrate: (enabled: boolean) => void
  setRange: (range: MultiStopReplayRange) => void
  setMode: (mode: MultiStopReplayMode) => void
  setSpeed: (speed: ReplaySpeed) => void
  setNoiseMode: (mode: Extract<ReplayNoiseMode, 'clean' | 'normal'>) => void
  startSession: (session: MultiStopReplaySession) => void
  patchSession: (patch: Partial<MultiStopReplaySession>) => void
  upsertResult: (result: MultiStopSegmentResult) => void
  cancelSession: () => void
  clearSession: () => void
}

function persist(state: Pick<MultiStopReplayStore, 'range' | 'mode' | 'speed' | 'noiseMode' | 'session' | 'results'>) {
  if (typeof window === 'undefined' || !state.session) return
  const payload: PersistedMultiStopReplay = {
    version: 1,
    savedAt: Date.now(),
    range: state.range,
    mode: state.mode,
    speed: state.speed,
    noiseMode: state.noiseMode,
    session: state.session,
    results: state.results
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

function removePersisted() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY)
}

export const useMultiStopReplayStore = create<MultiStopReplayStore>((set, get) => ({
  hydrated: false,
  range: 2,
  mode: 'manual-confirm',
  speed: 4,
  noiseMode: 'clean',
  results: [],
  hydrate(enabled) {
    if (get().hydrated || !enabled) return
    let restored: PersistedMultiStopReplay | undefined
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) as PersistedMultiStopReplay : undefined
      if (parsed?.version === 1 && Date.now() - parsed.savedAt <= MAX_AGE_MS) restored = parsed
      else removePersisted()
    } catch {
      removePersisted()
    }
    const restoredSession = restored?.session && ['preparing', 'planning-segment', 'replaying-segment'].includes(restored.session.status)
      ? { ...restored.session, status: 'paused' as const, pausedFromStatus: restored.session.status, updatedAt: Date.now() }
      : restored?.session
    set({
      hydrated: true,
      range: restored?.range ?? 2,
      mode: restored?.mode ?? 'manual-confirm',
      speed: restored?.speed ?? 4,
      noiseMode: restored?.noiseMode ?? 'clean',
      session: restoredSession,
      results: restored?.results ?? []
    })
  },
  setRange(range) { set({ range }) },
  setMode(mode) { set({ mode }) },
  setSpeed(speed) { set({ speed }) },
  setNoiseMode(noiseMode) { set({ noiseMode }) },
  startSession(session) {
    set({ session, results: [] })
    persist({ ...get(), session, results: [] })
  },
  patchSession(patch) {
    const current = get().session
    if (!current) return
    const session = { ...current, ...patch, updatedAt: Date.now() }
    set({ session })
    persist({ ...get(), session })
  },
  upsertResult(result) {
    const results = [
      ...get().results.filter((item) => item.targetStopIndex !== result.targetStopIndex),
      result
    ].sort((a, b) => a.targetStopIndex - b.targetStopIndex)
    set({ results })
    persist({ ...get(), results })
  },
  cancelSession() {
    const current = get().session
    set({ session: current ? { ...current, status: 'cancelled', updatedAt: Date.now() } : undefined })
    removePersisted()
  },
  clearSession() {
    set({ session: undefined, results: [] })
    removePersisted()
  }
}))

export function createMultiStopReplaySession(input: {
  routeId: string
  routeName: string
  stage: 'active' | 'joining'
  currentStopIndex: number
  joinStopIndex: number
  stopCount: number
  range: MultiStopReplayRange
  mode: MultiStopReplayMode
  speed: ReplaySpeed
  noiseMode: Extract<ReplayNoiseMode, 'clean' | 'normal'>
}): MultiStopReplaySession | undefined {
  const firstTarget = input.stage === 'joining' ? input.joinStopIndex : input.currentStopIndex + 1
  if (firstTarget < 0 || firstTarget >= input.stopCount) return undefined
  const requestedCount = input.range === 'all' ? input.stopCount : input.range
  const endStopIndex = Math.min(input.stopCount - 1, firstTarget + requestedCount - 1)
  const totalSegmentCount = endStopIndex - firstTarget + 1
  const now = Date.now()
  return {
    version: 1,
    coordinatorId: `multi-replay-${now}-${Math.random().toString(36).slice(2, 8)}`,
    routeId: input.routeId,
    routeName: input.routeName,
    initialStage: input.stage,
    startStopIndex: input.stage === 'joining' ? Math.max(0, firstTarget - 1) : input.currentStopIndex,
    endStopIndex,
    currentFromStopIndex: input.stage === 'joining' ? Math.max(0, firstTarget - 1) : input.currentStopIndex,
    currentTargetStopIndex: firstTarget,
    currentSegmentOrdinal: 1,
    totalSegmentCount,
    mode: input.mode,
    speedMultiplier: input.speed,
    noiseMode: input.noiseMode,
    status: 'preparing',
    completedTargetStopIndices: [],
    completedSegmentCount: 0,
    startedAt: now,
    updatedAt: now
  }
}

export function exportMultiStopReplayJson(session: MultiStopReplaySession | undefined, results: MultiStopSegmentResult[]) {
  return JSON.stringify({ exportedAt: new Date().toISOString(), session, results }, null, 2)
}
