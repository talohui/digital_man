import type { Map3DCameraEvent } from './map3dCamera'
export type Map3DPerfStage = 'mapInit' | 'routeDraw' | 'poiInit'

export type Map3DPerfAssetStatus = 'loaded' | 'failed' | 'pending' | 'unloaded'
export type Map3DPerfAssetCategory = 'garden' | 'landmark'
export type Map3DPerfLandmarkVariant = 'raw' | 'safe-v1' | 'safe-v2'

export type Map3DPerfBatchSnapshot = {
  batchIndex: number
  count: number
  startedAt: number
  finishedAt?: number
  durationMs?: number
}

export type Map3DPerfAssetSnapshot = {
  id: string
  assetUrl: string
  name?: string
  modelUrl?: string
  anchorId?: string
  fileSizeLabel?: string
  variant?: Map3DPerfLandmarkVariant
  selectedModelUrl?: string
  selectedSizeLabel?: string
  category: Map3DPerfAssetCategory
  priority?: string
  loadCount?: number
  unloadCount?: number
  batchIndex?: number
  startedAt: number
  finishedAt?: number
  durationMs?: number
  status: Map3DPerfAssetStatus
  error?: string
}

export type Map3DPerfSnapshot = {
  enabled: boolean
  pageStartedAt: number
  mapInitMs?: number
  routeDrawMs?: number
  poiInitMs?: number
  gardenTotal: number
  gardenLoaded: number
  gardenFailed: number
  gardenFirstBatchMs?: number
  gardenAllDoneMs?: number
  landmarkTotal: number
  landmarkLoaded: number
  landmarkFailed: number
  landmarkAllDoneMs?: number
  calibrationDraftCount: number
  activeCalibrationId?: string
  lastCalibrationUpdatedAt?: string
  activeCalibration?: {
    scale: number
    height: number
    rotationY: number
    lngOffset: number
    latOffset: number
  }
  batches: Map3DPerfBatchSnapshot[]
  slowestAssets: Map3DPerfAssetSnapshot[]
  failedAssets: Map3DPerfAssetSnapshot[]
  duplicatedUrls: Array<{
    assetUrl: string
    count: number
  }>
  cameraEvents: Map3DCameraEvent[]
  latestCameraEvent?: Map3DCameraEvent
}

export type Map3DPerfRecorder = {
  readonly enabled: boolean
  clear: () => void
  getSnapshot: () => Map3DPerfSnapshot
  markStageStart: (stage: Map3DPerfStage) => void
  markStageEnd: (stage: Map3DPerfStage) => void
  setGardenTotal: (total: number) => void
  startGardenBatch: (batchIndex: number, count: number) => void
  finishGardenBatch: (batchIndex: number) => void
  startGardenAsset: (asset: {
    id: string
    assetUrl: string
    name?: string
    priority?: string
    batchIndex?: number
  }) => void
  finishGardenAsset: (id: string) => void
  failGardenAsset: (id: string, error: unknown) => void
  setLandmarkTotal: (total: number) => void
  startLandmarkAsset: (asset: {
    id: string
    name: string
    modelUrl: string
    anchorId?: string
    fileSizeLabel?: string
    variant?: Map3DPerfLandmarkVariant
    selectedModelUrl?: string
    selectedSizeLabel?: string
    priority?: string
    batchIndex?: number
  }) => void
  finishLandmarkAsset: (id: string) => void
  failLandmarkAsset: (id: string, error: unknown) => void
  unloadLandmarkAsset: (id: string) => void
  updateLandmarkCalibration: (calibration: {
    draftCount: number
    activeId?: string
    values?: {
      scale: number
      height: number
      rotationY: number
      lngOffset: number
      latOffset: number
    }
  }) => void
  recordCameraEvent: (event: Map3DCameraEvent) => void
  subscribe: (listener: () => void) => () => void
}

type MutableMap3DPerfState = {
  pageStartedAt: number
  perfPageStartedAt: number
  mapInitMs?: number
  routeDrawMs?: number
  poiInitMs?: number
  gardenStartedAt?: number
  gardenTotal: number
  gardenLoaded: number
  gardenFailed: number
  gardenFirstBatchMs?: number
  gardenAllDoneMs?: number
  landmarkStartedAt?: number
  landmarkTotal: number
  landmarkLoaded: number
  landmarkFailed: number
  landmarkAllDoneMs?: number
  calibrationDraftCount: number
  activeCalibrationId?: string
  lastCalibrationUpdatedAt?: string
  activeCalibration?: {
    scale: number
    height: number
    rotationY: number
    lngOffset: number
    latOffset: number
  }
  batches: Map<number, Map3DPerfBatchSnapshot>
  assets: Map<string, Map3DPerfAssetSnapshot>
  urlCounts: Map<string, number>
  stageStarts: Map<Map3DPerfStage, number>
  cameraEvents: Map3DCameraEvent[]
}

export function createMap3DPerfRecorder(enabled: boolean): Map3DPerfRecorder {
  const listeners = new Set<() => void>()
  let state = createInitialState()

  const notify = () => {
    if (!enabled) {
      return
    }
    listeners.forEach((listener) => listener())
  }

  const recorder: Map3DPerfRecorder = {
    enabled,
    clear: () => {
      if (!enabled) {
        return
      }
      state = createInitialState()
      notify()
    },
    getSnapshot: () => buildSnapshot(enabled, state),
    markStageStart: (stage) => {
      if (!enabled) {
        return
      }
      state.stageStarts.set(stage, now())
    },
    markStageEnd: (stage) => {
      if (!enabled) {
        return
      }
      const startedAt = state.stageStarts.get(stage)
      if (startedAt === undefined) {
        return
      }
      const durationMs = roundDuration(now() - startedAt)
      if (stage === 'mapInit') {
        state.mapInitMs = durationMs
      } else if (stage === 'routeDraw') {
        state.routeDrawMs = durationMs
      } else if (stage === 'poiInit') {
        state.poiInitMs = durationMs
      }
      state.stageStarts.delete(stage)
      notify()
    },
    setGardenTotal: (total) => {
      if (!enabled) {
        return
      }
      state.gardenStartedAt = now()
      state.gardenTotal = total
      state.gardenLoaded = 0
      state.gardenFailed = 0
      state.gardenFirstBatchMs = undefined
      state.gardenAllDoneMs = undefined
      state.batches = new Map()
      removeAssetsByCategory(state, 'garden')
      notify()
    },
    startGardenBatch: (batchIndex, count) => {
      if (!enabled) {
        return
      }
      state.batches.set(batchIndex, {
        batchIndex,
        count,
        startedAt: Date.now()
      })
      notify()
    },
    finishGardenBatch: (batchIndex) => {
      if (!enabled) {
        return
      }
      const batch = state.batches.get(batchIndex)
      if (!batch || batch.finishedAt) {
        return
      }
      const finishedAt = Date.now()
      batch.finishedAt = finishedAt
      batch.durationMs = roundDuration(finishedAt - batch.startedAt)
      state.batches.set(batchIndex, batch)
      if (batchIndex === 0 && state.gardenStartedAt !== undefined) {
        state.gardenFirstBatchMs = roundDuration(now() - state.gardenStartedAt)
      }
      updateGardenAllDone(state)
      notify()
    },
    startGardenAsset: ({ id, assetUrl, name, priority, batchIndex }) => {
      if (!enabled) {
        return
      }
      state.urlCounts.set(assetUrl, (state.urlCounts.get(assetUrl) ?? 0) + 1)
      state.assets.set(id, {
        id,
        assetUrl,
        name,
        modelUrl: assetUrl,
        category: 'garden',
        priority,
        batchIndex,
        startedAt: Date.now(),
        status: 'pending'
      })
      notify()
    },
    finishGardenAsset: (id) => {
      if (!enabled) {
        return
      }
      const asset = state.assets.get(id)
      if (!asset || asset.status === 'loaded') {
        return
      }
      const finishedAt = Date.now()
      const wasFailed = asset.status === 'failed'
      asset.status = 'loaded'
      asset.finishedAt = finishedAt
      asset.durationMs = roundDuration(finishedAt - asset.startedAt)
      asset.error = undefined
      state.assets.set(id, asset)
      state.gardenLoaded += 1
      if (wasFailed) {
        state.gardenFailed = Math.max(0, state.gardenFailed - 1)
      }
      updateGardenAllDone(state)
      notify()
    },
    setLandmarkTotal: (total) => {
      if (!enabled) {
        return
      }
      state.landmarkStartedAt = now()
      state.landmarkTotal = total
      state.landmarkLoaded = 0
      state.landmarkFailed = 0
      state.landmarkAllDoneMs = undefined
      removeAssetsByCategory(state, 'landmark')
      notify()
    },
    startLandmarkAsset: ({ id, name, modelUrl, anchorId, fileSizeLabel, variant, selectedModelUrl, selectedSizeLabel, priority, batchIndex }) => {
      if (!enabled) {
        return
      }
      const existing = state.assets.get(id)
      state.urlCounts.set(modelUrl, (state.urlCounts.get(modelUrl) ?? 0) + 1)
      state.assets.set(id, {
        id,
        name,
        assetUrl: modelUrl,
        modelUrl,
        anchorId,
        fileSizeLabel,
        variant,
        selectedModelUrl,
        selectedSizeLabel,
        category: 'landmark',
        priority,
        loadCount: (existing?.loadCount ?? 0) + 1,
        unloadCount: existing?.unloadCount ?? 0,
        batchIndex,
        startedAt: Date.now(),
        status: 'pending'
      })
      notify()
    },
    finishLandmarkAsset: (id) => {
      if (!enabled) {
        return
      }
      const asset = state.assets.get(id)
      if (!asset || asset.status === 'loaded') {
        return
      }
      const finishedAt = Date.now()
      const wasFailed = asset.status === 'failed'
      asset.status = 'loaded'
      asset.finishedAt = finishedAt
      asset.durationMs = roundDuration(finishedAt - asset.startedAt)
      asset.error = undefined
      state.assets.set(id, asset)
      state.landmarkLoaded += 1
      if (wasFailed) {
        state.landmarkFailed = Math.max(0, state.landmarkFailed - 1)
      }
      updateLandmarkAllDone(state)
      notify()
    },
    unloadLandmarkAsset: (id) => {
      if (!enabled) {
        return
      }
      const asset = state.assets.get(id)
      if (!asset) {
        return
      }
      if (asset.status === 'loaded') {
        state.landmarkLoaded = Math.max(0, state.landmarkLoaded - 1)
      } else if (asset.status === 'failed') {
        state.landmarkFailed = Math.max(0, state.landmarkFailed - 1)
      }
      asset.status = 'unloaded'
      asset.finishedAt = Date.now()
      asset.unloadCount = (asset.unloadCount ?? 0) + 1
      state.assets.set(id, asset)
      notify()
    },
    updateLandmarkCalibration: ({ draftCount, activeId, values }) => {
      if (!enabled) {
        return
      }
      state.calibrationDraftCount = draftCount
      state.activeCalibrationId = activeId
      state.activeCalibration = values
      state.lastCalibrationUpdatedAt = new Date().toISOString()
      notify()
    },
    failLandmarkAsset: (id, error) => {
      if (!enabled) {
        return
      }
      const asset = state.assets.get(id)
      if (!asset || asset.status === 'failed') {
        return
      }
      const finishedAt = Date.now()
      const wasLoaded = asset.status === 'loaded'
      asset.status = 'failed'
      asset.finishedAt = finishedAt
      asset.durationMs = roundDuration(finishedAt - asset.startedAt)
      asset.error = normalizeError(error)
      state.assets.set(id, asset)
      state.landmarkFailed += 1
      if (wasLoaded) {
        state.landmarkLoaded = Math.max(0, state.landmarkLoaded - 1)
      }
      updateLandmarkAllDone(state)
      notify()
    },
    recordCameraEvent: (event) => {
      if (!enabled) {
        return
      }
      state.cameraEvents = [...state.cameraEvents, event].slice(-16)
      notify()
    },
    failGardenAsset: (id, error) => {
      if (!enabled) {
        return
      }
      const asset = state.assets.get(id)
      if (!asset || asset.status === 'failed') {
        return
      }
      const finishedAt = Date.now()
      const wasLoaded = asset.status === 'loaded'
      asset.status = 'failed'
      asset.finishedAt = finishedAt
      asset.durationMs = roundDuration(finishedAt - asset.startedAt)
      asset.error = normalizeError(error)
      state.assets.set(id, asset)
      state.gardenFailed += 1
      if (wasLoaded) {
        state.gardenLoaded = Math.max(0, state.gardenLoaded - 1)
      }
      updateGardenAllDone(state)
      notify()
    },
    subscribe: (listener) => {
      if (!enabled) {
        return () => undefined
      }
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }

  return recorder
}

function createInitialState(): MutableMap3DPerfState {
  return {
    pageStartedAt: Date.now(),
    perfPageStartedAt: now(),
    gardenTotal: 0,
    gardenLoaded: 0,
    gardenFailed: 0,
    landmarkTotal: 0,
    landmarkLoaded: 0,
    landmarkFailed: 0,
    calibrationDraftCount: 0,
    batches: new Map(),
    assets: new Map(),
    urlCounts: new Map(),
    stageStarts: new Map(),
    cameraEvents: []
  }
}

function buildSnapshot(enabled: boolean, state: MutableMap3DPerfState): Map3DPerfSnapshot {
  const assets = Array.from(state.assets.values())
  const slowestAssets = assets
    .filter((asset) => asset.durationMs !== undefined)
    .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
    .slice(0, 10)
  const failedAssets = assets.filter((asset) => asset.status === 'failed')
  const duplicatedUrls = Array.from(state.urlCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([assetUrl, count]) => ({ assetUrl, count }))
    .sort((a, b) => b.count - a.count || a.assetUrl.localeCompare(b.assetUrl))

  return {
    enabled,
    pageStartedAt: state.pageStartedAt,
    mapInitMs: state.mapInitMs,
    routeDrawMs: state.routeDrawMs,
    poiInitMs: state.poiInitMs,
    gardenTotal: state.gardenTotal,
    gardenLoaded: state.gardenLoaded,
    gardenFailed: state.gardenFailed,
    gardenFirstBatchMs: state.gardenFirstBatchMs,
    gardenAllDoneMs: state.gardenAllDoneMs,
    landmarkTotal: state.landmarkTotal,
    landmarkLoaded: state.landmarkLoaded,
    landmarkFailed: state.landmarkFailed,
    landmarkAllDoneMs: state.landmarkAllDoneMs,
    calibrationDraftCount: state.calibrationDraftCount,
    activeCalibrationId: state.activeCalibrationId,
    lastCalibrationUpdatedAt: state.lastCalibrationUpdatedAt,
    activeCalibration: state.activeCalibration,
    batches: Array.from(state.batches.values()).sort((a, b) => a.batchIndex - b.batchIndex),
    slowestAssets,
    failedAssets,
    duplicatedUrls,
    cameraEvents: state.cameraEvents,
    latestCameraEvent: state.cameraEvents[state.cameraEvents.length - 1]
  }
}

function updateGardenAllDone(state: MutableMap3DPerfState) {
  if (
    state.gardenStartedAt !== undefined &&
    state.gardenTotal > 0 &&
    state.gardenLoaded + state.gardenFailed >= state.gardenTotal
  ) {
    state.gardenAllDoneMs = roundDuration(now() - state.gardenStartedAt)
  }
}

function updateLandmarkAllDone(state: MutableMap3DPerfState) {
  if (
    state.landmarkStartedAt !== undefined &&
    state.landmarkTotal > 0 &&
    state.landmarkLoaded + state.landmarkFailed >= state.landmarkTotal
  ) {
    state.landmarkAllDoneMs = roundDuration(now() - state.landmarkStartedAt)
  }
}

function removeAssetsByCategory(state: MutableMap3DPerfState, category: Map3DPerfAssetCategory) {
  Array.from(state.assets.entries()).forEach(([id, asset]) => {
    if (asset.category === category) {
      state.assets.delete(id)
    }
  })
  rebuildUrlCounts(state)
}

function rebuildUrlCounts(state: MutableMap3DPerfState) {
  state.urlCounts = new Map()
  state.assets.forEach((asset) => {
    state.urlCounts.set(asset.assetUrl, (state.urlCounts.get(asset.assetUrl) ?? 0) + 1)
  })
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    return JSON.stringify(error)
  } catch {
    return '未知错误'
  }
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function roundDuration(value: number) {
  return Math.max(0, Math.round(value))
}
