import type { Map3DCameraEvent, Map3DCameraPresetId, Map3DTourMode, Map3DTourStopReason } from './map3dCamera'
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

export type Map3DPerfTourEventType =
  | 'tourStarted'
  | 'tourStep'
  | 'tourProgress'
  | 'tourWaypoint'
  | 'tourLandmarkPause'
  | 'tourStopped'
  | 'tourCompleted'
  | 'routePreviewStarted'
  | 'routePreviewStep'
  | 'routePreviewStopped'
  | 'routeProgressStarted'
  | 'routeProgressUpdate'
  | 'routeProgressStopped'
  | 'routeProgressCompleted'
  | 'routeProgressOverlayReset'

export type Map3DPerfTourEvent = {
  type: Map3DPerfTourEventType
  mode: Map3DTourMode
  recordedAt: string
  stepId?: string
  stepLabel?: string
  stepIndex?: number
  stepCount?: number
  progress?: number
  targetLat?: number
  targetLng?: number
  bearing?: number
  nearbyLandmarkId?: string
  activeLandmarkId?: string
  cameraPreset?: Map3DCameraPresetId
  targetPoiId?: string
  targetLandmarkId?: string
  durationMs?: number
  reason?: Map3DTourStopReason
  smoothingEnabled?: boolean
  lookAheadProgress?: number
  lateralOffsetMeters?: number
  averageFrameMs?: number
  estimatedFps?: number
  traveledPointCount?: number
  remainingPointCount?: number
  currentLat?: number
  currentLng?: number
  source?: 'tourProgress'
  routeHasOverlaps?: boolean
}

export type Map3DPerfMapVisualEventType =
  | 'startupStageChanged'
  | 'tmapScriptLoadStarted'
  | 'tmapScriptLoaded'
  | 'mapCreated'
  | 'initialCameraApplied'
  | 'baseMapEventReceived'
  | 'mapFirstIdle'
  | 'mapVisualReady'
  | 'mapReadyTimedOut'
  | 'mapSlow'
  | 'mapFailed'
  | 'overlaysStart'
  | 'routePoiShown'
  | 'gardenLoadStartedAfterMapReady'
  | 'loadingCurtainShown'
  | 'loadingCurtainHidden'
  | 'mapInteractionStarted'
  | 'mapInteractionEnded'
  | 'zoomClamped'
  | 'gardenLodChanged'
  | 'gardenInteractionLiteMode'
  | 'gardenOpacityUpdated'
  | 'treeCandidateLabEnabled'
  | 'defaultGardenHidden'
  | 'landmarkReferenceLoaded'
  | 'landmarkRuntimeLoadStarted'
  | 'landmarkRuntimeLoadBatch'
  | 'treeCandidateClusterGenerated'
  | 'treeCandidateCompareSetGenerated'
  | 'manualTreeAdded'
  | 'testTreeDeleted'
  | 'testTreeCleared'
  | 'gardenAssetSourceChanged'
  | 'gardenLoadBatch'

export type Map3DStartupStage =
  | 'loadingSdk'
  | 'creatingMap'
  | 'waitingBaseMap'
  | 'baseMapReady'
  | 'overlaysReady'
  | 'gardenLoading'
  | 'ready'
  | 'slow'
  | 'failed'

export type Map3DPerfMapVisualEvent = {
  type: Map3DPerfMapVisualEventType
  recordedAt: string
  elapsedMs?: number
  curtainDurationMs?: number
  reason?: string
  startupStage?: Map3DStartupStage
  interactionKind?: 'zoom' | 'drag' | 'move'
  currentZoom?: number
  requestedZoom?: number
  clampedZoom?: number
  gardenLodTier?: 'none' | 'reduced' | 'full'
  gardenOpacity?: number
  liveGardenOverlayCount?: number
  treeCandidateLabEnabled?: boolean
  defaultGardenHidden?: boolean
  landmarkReferenceLoaded?: boolean
  testTreeCount?: number
  candidateType?: string
  clusterMode?: string
  clusterGeneratedCount?: number
  compareSetGenerated?: boolean
  gardenReferenceMode?: 'blank-lab' | 'default-garden-visible'
  liveDefaultGardenOverlayCount?: number
  liveTestTreeOverlayCount?: number
  defaultGardenAssetCount?: number
  gardenLoadedCount?: number
  gardenLoadBatchIndex?: number
  gardenTierLoaded?: 'high' | 'medium' | 'low' | 'mixed'
  gardenLiveCountWarning?: boolean
  landmarkRuntimeBatchIndex?: number
  landmarkRuntimeBatchCount?: number
  landmarkRuntimeIds?: string[]
}

export type Map3DPerfCompanionModelEventType =
  | 'companionModelLoadStarted'
  | 'companionModelLoaded'
  | 'companionModelFailed'
  | 'companionModelUnloaded'
  | 'companionModelCalibrationSaved'

export type Map3DPerfCompanionModelEvent = {
  type: Map3DPerfCompanionModelEventType
  recordedAt: string
  parentLandmarkId: string
  companionId: string
  modelUrl?: string
  status?: 'loading' | 'loaded' | 'failed' | 'unloaded'
  durationMs?: number
  error?: string
  enabled?: boolean
  scale?: number
  height?: number
  rotationY?: number
  lngOffset?: number
  latOffset?: number
}

export type Map3DPerfSnapshot = {
  enabled: boolean
  pageStartedAt: number
  mapInitMs?: number
  mapCreatedMs?: number
  mapFirstIdleMs?: number
  mapVisualReadyMs?: number
  mapReadyTimedOut: boolean
  loadingCurtainShownMs?: number
  loadingCurtainHiddenMs?: number
  loadingCurtainDurationMs?: number
  startupStage: Map3DStartupStage
  overlaysStartedMs?: number
  routePoiShownMs?: number
  gardenLoadStartedAfterMapReadyMs?: number
  routeDrawMs?: number
  poiInitMs?: number
  gardenTotal: number
  gardenLoaded: number
  gardenFailed: number
  gardenFirstBatchMs?: number
  gardenAllDoneMs?: number
  gardenOverlayCreated: number
  gardenOverlayRemoved: number
  gardenOverlayDuplicatePrevented: number
  gardenOverlayLiveCount: number
  gardenLoadGeneration: number
  currentZoom?: number
  mapInteracting: boolean
  mapInteractionKind?: 'zoom' | 'drag' | 'move'
  gardenLodTier: 'none' | 'reduced' | 'full'
  gardenOpacity: number
  treeCandidateLabEnabled: boolean
  defaultGardenHidden: boolean
  landmarkReferenceLoaded: boolean
  testTreeCount: number
  candidateType?: string
  clusterMode?: string
  gardenReferenceMode?: 'blank-lab' | 'default-garden-visible'
  liveDefaultGardenOverlayCount: number
  liveTestTreeOverlayCount: number
  defaultGardenAssetCount: number
  gardenLoadedCount: number
  gardenLoadBatchIndex?: number
  gardenTierLoaded?: 'high' | 'medium' | 'low' | 'mixed'
  gardenLiveCountWarning: boolean
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
  mapVisualEvents: Map3DPerfMapVisualEvent[]
  latestMapVisualEvent?: Map3DPerfMapVisualEvent
  tourEvents: Map3DPerfTourEvent[]
  latestTourEvent?: Map3DPerfTourEvent
  companionModelEvents: Map3DPerfCompanionModelEvent[]
  latestCompanionModelEvent?: Map3DPerfCompanionModelEvent
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
  recordTourEvent: (event: Omit<Map3DPerfTourEvent, 'recordedAt'> & { recordedAt?: string }) => void
  recordCompanionModelEvent: (
    event: Omit<Map3DPerfCompanionModelEvent, 'recordedAt'> & { recordedAt?: string }
  ) => void
  recordGardenOverlayEvent: (event: {
    created?: number
    removed?: number
    duplicatePrevented?: number
    liveCount?: number
    generation?: number
  }) => void
  recordMapVisualEvent: (event: Omit<Map3DPerfMapVisualEvent, 'recordedAt'> & { recordedAt?: string }) => void
  subscribe: (listener: () => void) => () => void
}

type MutableMap3DPerfState = {
  pageStartedAt: number
  perfPageStartedAt: number
  mapInitMs?: number
  mapCreatedMs?: number
  mapFirstIdleMs?: number
  mapVisualReadyMs?: number
  mapReadyTimedOut: boolean
  loadingCurtainShownMs?: number
  loadingCurtainHiddenMs?: number
  loadingCurtainDurationMs?: number
  startupStage: Map3DStartupStage
  overlaysStartedMs?: number
  routePoiShownMs?: number
  gardenLoadStartedAfterMapReadyMs?: number
  routeDrawMs?: number
  poiInitMs?: number
  gardenStartedAt?: number
  gardenTotal: number
  gardenLoaded: number
  gardenFailed: number
  gardenFirstBatchMs?: number
  gardenAllDoneMs?: number
  gardenOverlayCreated: number
  gardenOverlayRemoved: number
  gardenOverlayDuplicatePrevented: number
  gardenOverlayLiveCount: number
  gardenLoadGeneration: number
  currentZoom?: number
  mapInteracting: boolean
  mapInteractionKind?: 'zoom' | 'drag' | 'move'
  gardenLodTier: 'none' | 'reduced' | 'full'
  gardenOpacity: number
  treeCandidateLabEnabled: boolean
  defaultGardenHidden: boolean
  landmarkReferenceLoaded: boolean
  testTreeCount: number
  candidateType?: string
  clusterMode?: string
  gardenReferenceMode?: 'blank-lab' | 'default-garden-visible'
  liveDefaultGardenOverlayCount: number
  liveTestTreeOverlayCount: number
  defaultGardenAssetCount: number
  gardenLoadedCount: number
  gardenLoadBatchIndex?: number
  gardenTierLoaded?: 'high' | 'medium' | 'low' | 'mixed'
  gardenLiveCountWarning: boolean
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
  mapVisualEvents: Map3DPerfMapVisualEvent[]
  tourEvents: Map3DPerfTourEvent[]
  companionModelEvents: Map3DPerfCompanionModelEvent[]
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
    recordTourEvent: (event) => {
      if (!enabled) {
        return
      }
      state.tourEvents = [
        ...state.tourEvents,
        {
          ...event,
          recordedAt: event.recordedAt ?? new Date().toISOString()
        }
      ].slice(-48)
      notify()
    },
    recordCompanionModelEvent: (event) => {
      if (!enabled) {
        return
      }
      state.companionModelEvents = [
        ...state.companionModelEvents,
        {
          ...event,
          recordedAt: event.recordedAt ?? new Date().toISOString()
        }
      ].slice(-24)
      notify()
    },
    recordGardenOverlayEvent: ({ created = 0, removed = 0, duplicatePrevented = 0, liveCount, generation }) => {
      if (!enabled) {
        return
      }
      state.gardenOverlayCreated += created
      state.gardenOverlayRemoved += removed
      state.gardenOverlayDuplicatePrevented += duplicatePrevented
      if (liveCount !== undefined) {
        state.gardenOverlayLiveCount = liveCount
      }
      if (generation !== undefined) {
        state.gardenLoadGeneration = generation
      }
      notify()
    },
    recordMapVisualEvent: (event) => {
      if (!enabled) {
        return
      }
      const elapsedMs = event.elapsedMs ?? roundDuration(now() - state.perfPageStartedAt)
      const normalizedEvent = {
        ...event,
        elapsedMs,
        recordedAt: event.recordedAt ?? new Date().toISOString()
      }
      state.mapVisualEvents = [...state.mapVisualEvents, normalizedEvent].slice(-48)

      if (event.type === 'startupStageChanged' && event.startupStage) {
        state.startupStage = event.startupStage
      } else if (event.type === 'mapCreated') {
        state.mapCreatedMs = elapsedMs
      } else if (event.type === 'baseMapEventReceived') {
        state.mapFirstIdleMs = state.mapFirstIdleMs ?? elapsedMs
      } else if (event.type === 'mapFirstIdle') {
        state.mapFirstIdleMs = elapsedMs
      } else if (event.type === 'mapVisualReady') {
        state.mapVisualReadyMs = elapsedMs
        state.mapReadyTimedOut = false
      } else if (event.type === 'mapReadyTimedOut') {
        state.mapReadyTimedOut = true
      } else if (event.type === 'mapSlow') {
        state.mapReadyTimedOut = true
        state.startupStage = 'slow'
      } else if (event.type === 'mapFailed') {
        state.mapReadyTimedOut = true
        state.startupStage = 'failed'
      } else if (event.type === 'overlaysStart') {
        state.overlaysStartedMs = elapsedMs
      } else if (event.type === 'routePoiShown') {
        state.routePoiShownMs = elapsedMs
      } else if (event.type === 'gardenLoadStartedAfterMapReady') {
        state.gardenLoadStartedAfterMapReadyMs = elapsedMs
      } else if (event.type === 'loadingCurtainShown') {
        state.loadingCurtainShownMs = elapsedMs
      } else if (event.type === 'loadingCurtainHidden') {
        state.loadingCurtainHiddenMs = elapsedMs
        state.loadingCurtainDurationMs =
          event.curtainDurationMs ??
          (state.loadingCurtainShownMs !== undefined ? roundDuration(elapsedMs - state.loadingCurtainShownMs) : undefined)
      } else if (event.type === 'mapInteractionStarted') {
        state.mapInteracting = true
        state.mapInteractionKind = event.interactionKind
      } else if (event.type === 'mapInteractionEnded') {
        state.mapInteracting = false
        state.mapInteractionKind = undefined
      } else if (event.type === 'gardenLodChanged' || event.type === 'gardenInteractionLiteMode' || event.type === 'gardenOpacityUpdated') {
        if (event.gardenLodTier) {
          state.gardenLodTier = event.gardenLodTier
        }
        if (event.gardenOpacity !== undefined) {
          state.gardenOpacity = event.gardenOpacity
        }
      } else if (
        event.type === 'treeCandidateLabEnabled' ||
        event.type === 'defaultGardenHidden' ||
        event.type === 'landmarkReferenceLoaded' ||
        event.type === 'treeCandidateClusterGenerated' ||
        event.type === 'treeCandidateCompareSetGenerated' ||
        event.type === 'manualTreeAdded' ||
        event.type === 'testTreeDeleted' ||
        event.type === 'testTreeCleared'
      ) {
        state.treeCandidateLabEnabled = true
      }

      if (event.currentZoom !== undefined) {
        state.currentZoom = event.currentZoom
      }
      if (event.liveGardenOverlayCount !== undefined) {
        state.gardenOverlayLiveCount = event.liveGardenOverlayCount
      }
      if (event.treeCandidateLabEnabled !== undefined) {
        state.treeCandidateLabEnabled = event.treeCandidateLabEnabled
      }
      if (event.defaultGardenHidden !== undefined) {
        state.defaultGardenHidden = event.defaultGardenHidden
      }
      if (event.landmarkReferenceLoaded !== undefined) {
        state.landmarkReferenceLoaded = event.landmarkReferenceLoaded
      }
      if (event.testTreeCount !== undefined) {
        state.testTreeCount = event.testTreeCount
      }
      if (event.candidateType !== undefined) {
        state.candidateType = event.candidateType
      }
      if (event.clusterMode !== undefined) {
        state.clusterMode = event.clusterMode
      }
      if (event.gardenReferenceMode !== undefined) {
        state.gardenReferenceMode = event.gardenReferenceMode
      }
      if (event.liveDefaultGardenOverlayCount !== undefined) {
        state.liveDefaultGardenOverlayCount = event.liveDefaultGardenOverlayCount
      }
      if (event.liveTestTreeOverlayCount !== undefined) {
        state.liveTestTreeOverlayCount = event.liveTestTreeOverlayCount
      }
      if (event.defaultGardenAssetCount !== undefined) {
        state.defaultGardenAssetCount = event.defaultGardenAssetCount
      }
      if (event.gardenLoadedCount !== undefined) {
        state.gardenLoadedCount = event.gardenLoadedCount
      }
      if (event.gardenLoadBatchIndex !== undefined) {
        state.gardenLoadBatchIndex = event.gardenLoadBatchIndex
      }
      if (event.gardenTierLoaded !== undefined) {
        state.gardenTierLoaded = event.gardenTierLoaded
      }
      if (event.gardenLiveCountWarning !== undefined) {
        state.gardenLiveCountWarning = event.gardenLiveCountWarning
      }

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
    mapReadyTimedOut: false,
    startupStage: 'loadingSdk',
    gardenTotal: 0,
    gardenLoaded: 0,
    gardenFailed: 0,
    gardenOverlayCreated: 0,
    gardenOverlayRemoved: 0,
    gardenOverlayDuplicatePrevented: 0,
    gardenOverlayLiveCount: 0,
    gardenLoadGeneration: 0,
    mapInteracting: false,
    gardenLodTier: 'full',
    gardenOpacity: 1,
    treeCandidateLabEnabled: false,
    defaultGardenHidden: false,
    landmarkReferenceLoaded: false,
    testTreeCount: 0,
    liveDefaultGardenOverlayCount: 0,
    liveTestTreeOverlayCount: 0,
    defaultGardenAssetCount: 0,
    gardenLoadedCount: 0,
    gardenLiveCountWarning: false,
    landmarkTotal: 0,
    landmarkLoaded: 0,
    landmarkFailed: 0,
    calibrationDraftCount: 0,
    batches: new Map(),
    assets: new Map(),
    urlCounts: new Map(),
    stageStarts: new Map(),
    cameraEvents: [],
    mapVisualEvents: [],
    tourEvents: [],
    companionModelEvents: []
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
    mapCreatedMs: state.mapCreatedMs,
    mapFirstIdleMs: state.mapFirstIdleMs,
    mapVisualReadyMs: state.mapVisualReadyMs,
    mapReadyTimedOut: state.mapReadyTimedOut,
    loadingCurtainShownMs: state.loadingCurtainShownMs,
    loadingCurtainHiddenMs: state.loadingCurtainHiddenMs,
    loadingCurtainDurationMs: state.loadingCurtainDurationMs,
    startupStage: state.startupStage,
    overlaysStartedMs: state.overlaysStartedMs,
    routePoiShownMs: state.routePoiShownMs,
    gardenLoadStartedAfterMapReadyMs: state.gardenLoadStartedAfterMapReadyMs,
    routeDrawMs: state.routeDrawMs,
    poiInitMs: state.poiInitMs,
    gardenTotal: state.gardenTotal,
    gardenLoaded: state.gardenLoaded,
    gardenFailed: state.gardenFailed,
    gardenFirstBatchMs: state.gardenFirstBatchMs,
    gardenAllDoneMs: state.gardenAllDoneMs,
    gardenOverlayCreated: state.gardenOverlayCreated,
    gardenOverlayRemoved: state.gardenOverlayRemoved,
    gardenOverlayDuplicatePrevented: state.gardenOverlayDuplicatePrevented,
    gardenOverlayLiveCount: state.gardenOverlayLiveCount,
    gardenLoadGeneration: state.gardenLoadGeneration,
    currentZoom: state.currentZoom,
    mapInteracting: state.mapInteracting,
    mapInteractionKind: state.mapInteractionKind,
    gardenLodTier: state.gardenLodTier,
    gardenOpacity: state.gardenOpacity,
    treeCandidateLabEnabled: state.treeCandidateLabEnabled,
    defaultGardenHidden: state.defaultGardenHidden,
    landmarkReferenceLoaded: state.landmarkReferenceLoaded,
    testTreeCount: state.testTreeCount,
    candidateType: state.candidateType,
    clusterMode: state.clusterMode,
    gardenReferenceMode: state.gardenReferenceMode,
    liveDefaultGardenOverlayCount: state.liveDefaultGardenOverlayCount,
    liveTestTreeOverlayCount: state.liveTestTreeOverlayCount,
    defaultGardenAssetCount: state.defaultGardenAssetCount,
    gardenLoadedCount: state.gardenLoadedCount,
    gardenLoadBatchIndex: state.gardenLoadBatchIndex,
    gardenTierLoaded: state.gardenTierLoaded,
    gardenLiveCountWarning: state.gardenLiveCountWarning,
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
    latestCameraEvent: state.cameraEvents[state.cameraEvents.length - 1],
    mapVisualEvents: state.mapVisualEvents,
    latestMapVisualEvent: state.mapVisualEvents[state.mapVisualEvents.length - 1],
    tourEvents: state.tourEvents,
    latestTourEvent: state.tourEvents[state.tourEvents.length - 1],
    companionModelEvents: state.companionModelEvents,
    latestCompanionModelEvent: state.companionModelEvents[state.companionModelEvents.length - 1]
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
