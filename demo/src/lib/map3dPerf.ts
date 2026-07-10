import type { Map3DCameraEvent, Map3DCameraPresetId, Map3DTourMode, Map3DTourStopReason } from './map3dCamera'
export type Map3DPerfStage = 'mapInit' | 'routeDraw' | 'poiInit'

export type Map3DPerfAssetStatus = 'loaded' | 'failed' | 'pending' | 'unloaded'
export type Map3DPerfAssetCategory = 'garden' | 'landmark'
export type Map3DPerfLandmarkVariant = 'raw' | 'safe-v1' | 'safe-v2' | 'safe-v3'

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

export type Map3DLandmarkGlBDebugRow = {
  id: string
  displayName: string
  glbUrl?: string
  desiredState: 'should-load' | 'should-hide' | 'should-release'
  actualState: 'unloaded' | 'idle' | 'loading' | 'loaded' | 'visible' | 'hidden' | 'disposed' | 'released' | 'failed' | 'error'
  arbiterDecision: 'allow' | 'deny' | 'none'
  denyReason?: string
  distanceToMapCenter?: number
  isTourFocus: boolean
  isProtected: boolean
  activeSlotIndex?: number
  activeBudgetUsed?: number
  activeBudgetMax?: number
  evictable?: boolean
  evictReason?: string
  lastEvictedAt?: number
  lastLoadAttemptAt?: number
  lastLoadAllowReason?: string
  lastLoadDenyReason?: string
  lastError?: string
}

export type Map3DPerfTourEventType =
  | 'tourStarted'
  | 'tourStep'
  | 'tourProgress'
  | 'tourWaypoint'
  | 'tourLandmarkPause'
  | 'tourStopped'
  | 'tourCompleted'
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
  tourCameraTightenMode?: 'open' | 'tight' | 'pause'
  tourCameraTightenStrength?: number
  tourProfile?: 'desktop-cinematic' | 'mobile-stable'
  tourCameraUpdateFps?: number
  tourMarkerUpdateFps?: number
  tourCameraSmoothed?: boolean
  tourBoundsClampPaused?: boolean
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
  | 'scenicMapPresentationChanged'
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
  | 'atmosphereStateChanged'
  | 'poiBillboardStateChanged'
  | 'billboardHighlightEvent'
  | 'nativeSkyConfigured'
  | 'inkOverlayStateChanged'
  | 'inkTileLayerStateChanged'
  | 'treeCandidateClusterGenerated'
  | 'treeCandidateCompareSetGenerated'
  | 'manualTreeAdded'
  | 'testTreeDeleted'
  | 'testTreeCleared'
  | 'gardenAssetSourceChanged'
  | 'gardenLoadBatch'
  | 'layerManagerStateChanged'
  | 'glbRuntimeOrchestratorStateChanged'
  | 'glbMemoryManagerStateChanged'
  | 'sceneWindowManagerStateChanged'
  | 'sceneStateManagerStateChanged'
  | 'sceneArbiterStateChanged'

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

export type Map3DPerfRouteGeometryMode = 'real' | 'candidate' | 'poi-polyline'
export type Map3DPerfGLBRuntimePhase =
  | 'disabled'
  | 'waiting-map'
  | 'waiting-visual'
  | 'route-poi'
  | 'landmarks'
  | 'garden'
  | 'ready'
export type Map3DPerfGLBRuntimeProfile = 'desktop' | 'mobile' | 'debug'

export type Map3DPerfMapVisualEvent = {
  type: Map3DPerfMapVisualEventType
  recordedAt: string
  elapsedMs?: number
  curtainDurationMs?: number
  reason?: string
  scenicMapPresentation?: 'scenic3d' | 'ink2d'
  startupStage?: Map3DStartupStage
  interactionKind?: 'zoom' | 'drag' | 'move'
  currentZoom?: number
  requestedZoom?: number
  clampedZoom?: number
  mapBoundsEnabled?: boolean
  mapBoundsDisabledReason?: 'none' | 'debugGarden' | 'debugPerfNoMapBounds'
  mapCenterLimitBounds?: string
  mapVisualBufferBounds?: string
  currentMapCenter?: string
  mapMinZoom?: number
  mapMaxZoom?: number
  zoomLimited?: boolean
  edgeMistLevel?: 'normal' | 'strong'
  edgeMistReason?: string
  edgeMistStrength?: number
  nearInkBoundary?: boolean
  distanceToInkBoundary?: number
  clearMaskMode?: string
  clearMaskSize?: string
  clearMaskCenter?: string
  clearMaskShape?: string
  cameraPresetTightened?: boolean
  lastBoundsCorrection?: string
  noMapBoundsDebugOverride?: boolean
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
  landmarkGlbDebugRows?: Map3DLandmarkGlBDebugRow[]
  atmosphereMode?: 'intro' | 'normal' | 'tour' | 'focus'
  atmosphereVisible?: boolean
  poiBillboardCount?: number
  poiBillboardMode?: 'dot' | 'titleTag' | 'activeTag'
  activePoiBillboardId?: string | null
  horizonMaskEnabled?: boolean
  horizonMaskIntensity?: number
  activePoiCount?: number
  mutedPoiCount?: number
  waterHintsEnabled?: boolean
  waterHintsCount?: number
  tourPoiSuppressionEnabled?: boolean
  nativeSkyEnabled?: boolean
  nativeSkyApplied?: boolean
  nativeFogApplied?: boolean
  nativeSkyColor?: string
  nativeFogColor?: string
  skyOptionsAnimated?: boolean
  dynamicMistEnabled?: boolean
  dynamicMistCanvasActive?: boolean
  dynamicMistQuality?: 512 | 768 | 1024 | 'off'
  dynamicMistDegraded?: boolean
  dynamicMistDegradeReason?: string
  dynamicMistFpsEstimate?: number
  dynamicMistFrameMs?: number
  dynamicMistRecoveryState?: string
  dynamicMistSpeedScale?: number
  dynamicMistContrastScale?: number
  enableDynamicMistDebugOverride?: boolean
  debugGardenDynamicMistDisabled?: boolean
  coreClearMaskEnabled?: boolean
  poiLiftMode?: 'ground' | 'raised'
  activePoiLiftPx?: number
  inkOverlayEnabled?: boolean
  inkOverlaySource?: 'ai' | 'base' | 'jimeng'
  inkOverlayImageUrl?: string
  inkOverlayOpacity?: number
  inkOverlayEffectiveOpacity?: number
  inkOverlayOffsetX?: number
  inkOverlayOffsetY?: number
  inkOverlayScaleX?: number
  inkOverlayScaleY?: number
  inkOverlayCompare?: boolean
  inkOverlayBounds?: string
  inkOverlayLayerReady?: boolean
  inkOverlayLayerError?: string
  inkOverlayLayerMode?: 'native' | 'dom' | 'none'
  inkOverlayCameraMode?: 'off' | 'topdown' | 'reduced' | 'disabled3d'
  inkOverlaySuppressedReason?: string
  inkTilesEnabled?: boolean
  inkTileDefaultEnabled?: boolean
  noInkTilesOverride?: boolean
  inkTileSource?: 'v3' | 'base'
  inkTileVariant?: string
  inkTileOpacity?: number
  inkTileOpacityBase?: number
  inkTileOpacityEffective?: number
  inkTileZoomFade?: number
  inkTileUrlTemplate?: string
  inkTileEmptyUrl?: string
  inkTileZoomLevels?: number[]
  inkTileMaxNativeZoom?: number
  inkTileUsingFallbackZoom?: boolean
  inkTileFallbackFromZ?: number
  inkTileFallbackToZ?: number
  inkTileLayerReady?: boolean
  inkTileLayerError?: string
  inkTileBounds?: string
  inkTileMode?: 'web-mercator-local' | 'tencent-custom-layer' | 'none'
  sourceTransform?: string
  flipX?: boolean
  flipY?: boolean
  rotate?: number
  tileDir?: string
  inkTileXRangeByZoom?: string
  inkTileYRangeByZoom?: string
  sourceImageWidth?: number
  sourceImageHeight?: number
  sourceImageStandard?: boolean
  sourceImageWarning?: string
  mapBoundaryEnabled?: boolean
  layerManagerCount?: number
  layerManagerActiveLayers?: string[]
  layerManagerSnapshot?: string
  glbRuntimeEnabled?: boolean
  glbRuntimePhase?: Map3DPerfGLBRuntimePhase
  glbRuntimeProfile?: Map3DPerfGLBRuntimeProfile
  glbRuntimeLandmarkGate?: boolean
  glbRuntimeGardenGate?: boolean
  glbRuntimeLandmarkDelayMs?: number
  glbRuntimeGardenDelayMs?: number
  glbRuntimePendingTimerCount?: number
  glbActiveCount?: number
  glbCachedCount?: number
  glbDisposedCount?: number
  glbSoftDetachedCount?: number
  glbMemoryEstimateMB?: number
  glbMemoryMaxActive?: number
  glbMemoryTtlMs?: number
  windowActiveCount?: number
  windowVisibleCount?: number
  windowDisposedCount?: number
  windowBehindCount?: number
  windowCachedCount?: number
  sceneMemoryPressureEstimate?: number
  sceneStateLoaded?: number
  sceneStateVisible?: number
  sceneStateDisposed?: number
  sceneStateRehydrated?: number
  sceneStateCached?: number
  sceneStateHidden?: number
  sceneStateActiveLoads?: number
  sceneCacheHitRate?: number
  arbiterDecisionCount?: number
  arbiterDeniedCount?: number
  arbiterLoadThrottleCount?: number
  arbiterConflictResolveCount?: number
  arbiterActiveLoadCount?: number
  arbiterActiveModelCount?: number
  arbiterMemoryPressureEstimateMB?: number
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
  currentRouteId?: string
  currentRouteName?: string
  routeStopCount: number
  currentStopId?: string
  nextStopId?: string
  routeGeometryPointCount: number
  tourStatus: 'idle' | 'playing'
  routeSwitchCount: number
  routeGeometryMode: Map3DPerfRouteGeometryMode
  guideDataRouteSource: boolean
  unmappedGuideStopCount: number
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
  treeGlbMode: 'removed'
  activeTreeGlbCount: number
  currentZoom?: number
  mapBoundsEnabled: boolean
  mapBoundsDisabledReason: 'none' | 'debugGarden' | 'debugPerfNoMapBounds'
  mapCenterLimitBounds?: string
  mapVisualBufferBounds?: string
  currentMapCenter?: string
  mapMinZoom?: number
  mapMaxZoom?: number
  zoomLimited: boolean
  edgeMistLevel: 'normal' | 'strong'
  edgeMistReason?: string
  edgeMistStrength?: number
  nearInkBoundary?: boolean
  distanceToInkBoundary?: number
  clearMaskMode?: string
  clearMaskSize?: string
  clearMaskCenter?: string
  clearMaskShape?: string
  cameraPresetTightened: boolean
  lastBoundsCorrection?: string
  noMapBoundsDebugOverride: boolean
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
  atmosphereMode: 'intro' | 'normal' | 'tour' | 'focus'
  atmosphereVisible: boolean
  poiBillboardCount: number
  poiBillboardMode: 'dot' | 'titleTag' | 'activeTag'
  activePoiBillboardId?: string
  horizonMaskEnabled: boolean
  horizonMaskIntensity: number
  activePoiCount: number
  mutedPoiCount: number
  waterHintsEnabled: boolean
  waterHintsCount: number
  tourPoiSuppressionEnabled: boolean
  nativeSkyEnabled: boolean
  nativeSkyApplied: boolean
  nativeFogApplied: boolean
  nativeSkyColor?: string
  nativeFogColor?: string
  skyOptionsAnimated: boolean
  dynamicMistEnabled: boolean
  dynamicMistCanvasActive: boolean
  dynamicMistQuality: 512 | 768 | 1024 | 'off'
  dynamicMistDegraded: boolean
  dynamicMistDegradeReason?: string
  dynamicMistFpsEstimate?: number
  dynamicMistFrameMs?: number
  dynamicMistRecoveryState?: string
  dynamicMistSpeedScale?: number
  dynamicMistContrastScale?: number
  enableDynamicMistDebugOverride: boolean
  debugGardenDynamicMistDisabled: boolean
  coreClearMaskEnabled: boolean
  poiLiftMode: 'ground' | 'raised'
  activePoiLiftPx: number
  inkOverlayEnabled: boolean
  inkOverlaySource: 'ai' | 'base' | 'jimeng'
  inkOverlayImageUrl?: string
  inkOverlayOpacity: number
  inkOverlayEffectiveOpacity: number
  inkOverlayOffsetX: number
  inkOverlayOffsetY: number
  inkOverlayScaleX: number
  inkOverlayScaleY: number
  inkOverlayCompare: boolean
  inkOverlayBounds?: string
  inkOverlayLayerReady: boolean
  inkOverlayLayerError?: string
  inkOverlayLayerMode: 'native' | 'dom' | 'none'
  inkOverlayCameraMode: 'off' | 'topdown' | 'reduced' | 'disabled3d'
  inkOverlaySuppressedReason?: string
  inkTilesEnabled: boolean
  inkTileDefaultEnabled: boolean
  noInkTilesOverride: boolean
  inkTileSource?: 'v3' | 'base'
  inkTileVariant?: string
  inkTileOpacity: number
  inkTileOpacityBase: number
  inkTileOpacityEffective: number
  inkTileZoomFade: number
  inkTileUrlTemplate?: string
  inkTileEmptyUrl?: string
  inkTileZoomLevels: number[]
  inkTileMaxNativeZoom: number
  inkTileUsingFallbackZoom: boolean
  inkTileFallbackFromZ?: number
  inkTileFallbackToZ?: number
  inkTileLayerReady: boolean
  inkTileLayerError?: string
  inkTileBounds?: string
  inkTileMode: 'web-mercator-local' | 'tencent-custom-layer' | 'none'
  sourceTransform?: string
  flipX?: boolean
  flipY?: boolean
  rotate?: number
  tileDir?: string
  inkTileXRangeByZoom?: string
  inkTileYRangeByZoom?: string
  sourceImageWidth?: number
  sourceImageHeight?: number
  sourceImageStandard?: boolean
  sourceImageWarning?: string
  mapBoundaryEnabled: boolean
  layerManagerCount: number
  layerManagerActiveLayers: string[]
  layerManagerSnapshot?: string
  glbRuntimeEnabled: boolean
  glbRuntimePhase: Map3DPerfGLBRuntimePhase
  glbRuntimeProfile: Map3DPerfGLBRuntimeProfile
  glbRuntimeLandmarkGate: boolean
  glbRuntimeGardenGate: boolean
  glbRuntimeLandmarkDelayMs: number
  glbRuntimeGardenDelayMs: number
  glbRuntimePendingTimerCount: number
  glbActiveCount: number
  glbCachedCount: number
  glbDisposedCount: number
  glbSoftDetachedCount: number
  glbMemoryEstimateMB: number
  glbMemoryMaxActive: number
  glbMemoryTtlMs: number
  windowActiveCount: number
  windowVisibleCount: number
  windowDisposedCount: number
  windowBehindCount: number
  windowCachedCount: number
  sceneMemoryPressureEstimate: number
  sceneStateLoaded: number
  sceneStateVisible: number
  sceneStateDisposed: number
  sceneStateRehydrated: number
  sceneStateCached: number
  sceneStateHidden: number
  sceneStateActiveLoads: number
  sceneCacheHitRate: number
  arbiterDecisionCount: number
  arbiterDeniedCount: number
  arbiterLoadThrottleCount: number
  arbiterConflictResolveCount: number
  arbiterActiveLoadCount: number
  arbiterActiveModelCount: number
  arbiterMemoryPressureEstimateMB: number
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
  landmarkGlbDebugRows: Map3DLandmarkGlBDebugRow[]
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
  setRouteState: (state: {
    currentRouteId?: string
    currentRouteName?: string
    routeStopCount: number
    currentStopId?: string
    nextStopId?: string
    routeGeometryPointCount: number
    tourStatus: 'idle' | 'playing'
    routeSwitchCount: number
    routeGeometryMode: Map3DPerfRouteGeometryMode
    guideDataRouteSource: boolean
    unmappedGuideStopCount: number
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
  currentRouteId?: string
  currentRouteName?: string
  routeStopCount: number
  currentStopId?: string
  nextStopId?: string
  routeGeometryPointCount: number
  tourStatus: 'idle' | 'playing'
  routeSwitchCount: number
  routeGeometryMode: Map3DPerfRouteGeometryMode
  guideDataRouteSource: boolean
  unmappedGuideStopCount: number
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
  treeGlbMode: 'removed'
  activeTreeGlbCount: number
  currentZoom?: number
  mapBoundsEnabled: boolean
  mapBoundsDisabledReason: 'none' | 'debugGarden' | 'debugPerfNoMapBounds'
  mapCenterLimitBounds?: string
  mapVisualBufferBounds?: string
  currentMapCenter?: string
  mapMinZoom?: number
  mapMaxZoom?: number
  zoomLimited: boolean
  edgeMistLevel: 'normal' | 'strong'
  edgeMistReason?: string
  edgeMistStrength?: number
  nearInkBoundary?: boolean
  distanceToInkBoundary?: number
  clearMaskMode?: string
  clearMaskSize?: string
  clearMaskCenter?: string
  clearMaskShape?: string
  cameraPresetTightened: boolean
  lastBoundsCorrection?: string
  noMapBoundsDebugOverride: boolean
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
  atmosphereMode: 'intro' | 'normal' | 'tour' | 'focus'
  atmosphereVisible: boolean
  poiBillboardCount: number
  poiBillboardMode: 'dot' | 'titleTag' | 'activeTag'
  activePoiBillboardId?: string
  horizonMaskEnabled: boolean
  horizonMaskIntensity: number
  activePoiCount: number
  mutedPoiCount: number
  waterHintsEnabled: boolean
  waterHintsCount: number
  tourPoiSuppressionEnabled: boolean
  nativeSkyEnabled: boolean
  nativeSkyApplied: boolean
  nativeFogApplied: boolean
  nativeSkyColor?: string
  nativeFogColor?: string
  skyOptionsAnimated: boolean
  dynamicMistEnabled: boolean
  dynamicMistCanvasActive: boolean
  dynamicMistQuality: 512 | 768 | 1024 | 'off'
  dynamicMistDegraded: boolean
  dynamicMistDegradeReason?: string
  dynamicMistFpsEstimate?: number
  dynamicMistFrameMs?: number
  dynamicMistRecoveryState?: string
  dynamicMistSpeedScale?: number
  dynamicMistContrastScale?: number
  enableDynamicMistDebugOverride: boolean
  debugGardenDynamicMistDisabled: boolean
  coreClearMaskEnabled: boolean
  poiLiftMode: 'ground' | 'raised'
  activePoiLiftPx: number
  inkOverlayEnabled: boolean
  inkOverlaySource: 'ai' | 'base' | 'jimeng'
  inkOverlayImageUrl?: string
  inkOverlayOpacity: number
  inkOverlayEffectiveOpacity: number
  inkOverlayOffsetX: number
  inkOverlayOffsetY: number
  inkOverlayScaleX: number
  inkOverlayScaleY: number
  inkOverlayCompare: boolean
  inkOverlayBounds?: string
  inkOverlayLayerReady: boolean
  inkOverlayLayerError?: string
  inkOverlayLayerMode: 'native' | 'dom' | 'none'
  inkOverlayCameraMode: 'off' | 'topdown' | 'reduced' | 'disabled3d'
  inkOverlaySuppressedReason?: string
  inkTilesEnabled: boolean
  inkTileDefaultEnabled: boolean
  noInkTilesOverride: boolean
  inkTileSource?: 'v3' | 'base'
  inkTileVariant?: string
  inkTileOpacity: number
  inkTileOpacityBase: number
  inkTileOpacityEffective: number
  inkTileZoomFade: number
  inkTileUrlTemplate?: string
  inkTileEmptyUrl?: string
  inkTileZoomLevels: number[]
  inkTileMaxNativeZoom: number
  inkTileUsingFallbackZoom: boolean
  inkTileFallbackFromZ?: number
  inkTileFallbackToZ?: number
  inkTileLayerReady: boolean
  inkTileLayerError?: string
  inkTileBounds?: string
  inkTileMode: 'web-mercator-local' | 'tencent-custom-layer' | 'none'
  sourceTransform?: string
  flipX?: boolean
  flipY?: boolean
  rotate?: number
  tileDir?: string
  inkTileXRangeByZoom?: string
  inkTileYRangeByZoom?: string
  sourceImageWidth?: number
  sourceImageHeight?: number
  sourceImageStandard?: boolean
  sourceImageWarning?: string
  mapBoundaryEnabled: boolean
  layerManagerCount: number
  layerManagerActiveLayers: string[]
  layerManagerSnapshot?: string
  glbRuntimeEnabled: boolean
  glbRuntimePhase: Map3DPerfGLBRuntimePhase
  glbRuntimeProfile: Map3DPerfGLBRuntimeProfile
  glbRuntimeLandmarkGate: boolean
  glbRuntimeGardenGate: boolean
  glbRuntimeLandmarkDelayMs: number
  glbRuntimeGardenDelayMs: number
  glbRuntimePendingTimerCount: number
  glbActiveCount: number
  glbCachedCount: number
  glbDisposedCount: number
  glbSoftDetachedCount: number
  glbMemoryEstimateMB: number
  glbMemoryMaxActive: number
  glbMemoryTtlMs: number
  windowActiveCount: number
  windowVisibleCount: number
  windowDisposedCount: number
  windowBehindCount: number
  windowCachedCount: number
  sceneMemoryPressureEstimate: number
  sceneStateLoaded: number
  sceneStateVisible: number
  sceneStateDisposed: number
  sceneStateRehydrated: number
  sceneStateCached: number
  sceneStateHidden: number
  sceneStateActiveLoads: number
  sceneCacheHitRate: number
  arbiterDecisionCount: number
  arbiterDeniedCount: number
  arbiterLoadThrottleCount: number
  arbiterConflictResolveCount: number
  arbiterActiveLoadCount: number
  arbiterActiveModelCount: number
  arbiterMemoryPressureEstimateMB: number
  landmarkGlbDebugRows: Map3DLandmarkGlBDebugRow[]
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
    setRouteState: (routeState) => {
      if (!enabled) {
        return
      }
      state.currentRouteId = routeState.currentRouteId
      state.currentRouteName = routeState.currentRouteName
      state.routeStopCount = routeState.routeStopCount
      state.currentStopId = routeState.currentStopId
      state.nextStopId = routeState.nextStopId
      state.routeGeometryPointCount = routeState.routeGeometryPointCount
      state.tourStatus = routeState.tourStatus
      state.routeSwitchCount = routeState.routeSwitchCount
      state.routeGeometryMode = routeState.routeGeometryMode
      state.guideDataRouteSource = routeState.guideDataRouteSource
      state.unmappedGuideStopCount = routeState.unmappedGuideStopCount
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
      if (event.mapBoundsEnabled !== undefined) {
        state.mapBoundsEnabled = event.mapBoundsEnabled
      }
      if (event.mapBoundsDisabledReason !== undefined) {
        state.mapBoundsDisabledReason = event.mapBoundsDisabledReason
      }
      if (event.mapCenterLimitBounds !== undefined) {
        state.mapCenterLimitBounds = event.mapCenterLimitBounds
      }
      if (event.mapVisualBufferBounds !== undefined) {
        state.mapVisualBufferBounds = event.mapVisualBufferBounds
      }
      if (event.currentMapCenter !== undefined) {
        state.currentMapCenter = event.currentMapCenter
      }
      if (event.mapMinZoom !== undefined) {
        state.mapMinZoom = event.mapMinZoom
      }
      if (event.mapMaxZoom !== undefined) {
        state.mapMaxZoom = event.mapMaxZoom
      }
      if (event.zoomLimited !== undefined) {
        state.zoomLimited = event.zoomLimited
      }
      if (event.edgeMistLevel !== undefined) {
        state.edgeMistLevel = event.edgeMistLevel
      }
      if (event.edgeMistReason !== undefined) {
        state.edgeMistReason = event.edgeMistReason
      }
      if (event.edgeMistStrength !== undefined) {
        state.edgeMistStrength = event.edgeMistStrength
      }
      if (event.nearInkBoundary !== undefined) {
        state.nearInkBoundary = event.nearInkBoundary
      }
      if (event.distanceToInkBoundary !== undefined) {
        state.distanceToInkBoundary = event.distanceToInkBoundary
      }
      if (event.clearMaskMode !== undefined) {
        state.clearMaskMode = event.clearMaskMode
      }
      if (event.clearMaskSize !== undefined) {
        state.clearMaskSize = event.clearMaskSize
      }
      if (event.clearMaskCenter !== undefined) {
        state.clearMaskCenter = event.clearMaskCenter
      }
      if (event.clearMaskShape !== undefined) {
        state.clearMaskShape = event.clearMaskShape
      }
      if (event.cameraPresetTightened !== undefined) {
        state.cameraPresetTightened = event.cameraPresetTightened
      }
      if (event.lastBoundsCorrection !== undefined) {
        state.lastBoundsCorrection = event.lastBoundsCorrection
      }
      if (event.noMapBoundsDebugOverride !== undefined) {
        state.noMapBoundsDebugOverride = event.noMapBoundsDebugOverride
      }
      if (event.layerManagerCount !== undefined) {
        state.layerManagerCount = event.layerManagerCount
      }
      if (event.layerManagerActiveLayers !== undefined) {
        state.layerManagerActiveLayers = event.layerManagerActiveLayers
      }
      if (event.layerManagerSnapshot !== undefined) {
        state.layerManagerSnapshot = event.layerManagerSnapshot
      }
      if (event.glbRuntimeEnabled !== undefined) {
        state.glbRuntimeEnabled = event.glbRuntimeEnabled
      }
      if (event.glbRuntimePhase !== undefined) {
        state.glbRuntimePhase = event.glbRuntimePhase
      }
      if (event.glbRuntimeProfile !== undefined) {
        state.glbRuntimeProfile = event.glbRuntimeProfile
      }
      if (event.glbRuntimeLandmarkGate !== undefined) {
        state.glbRuntimeLandmarkGate = event.glbRuntimeLandmarkGate
      }
      if (event.glbRuntimeGardenGate !== undefined) {
        state.glbRuntimeGardenGate = event.glbRuntimeGardenGate
      }
      if (event.glbRuntimeLandmarkDelayMs !== undefined) {
        state.glbRuntimeLandmarkDelayMs = event.glbRuntimeLandmarkDelayMs
      }
      if (event.glbRuntimeGardenDelayMs !== undefined) {
        state.glbRuntimeGardenDelayMs = event.glbRuntimeGardenDelayMs
      }
      if (event.glbRuntimePendingTimerCount !== undefined) {
        state.glbRuntimePendingTimerCount = event.glbRuntimePendingTimerCount
      }
      if (event.glbActiveCount !== undefined) {
        state.glbActiveCount = event.glbActiveCount
      }
      if (event.glbCachedCount !== undefined) {
        state.glbCachedCount = event.glbCachedCount
      }
      if (event.glbDisposedCount !== undefined) {
        state.glbDisposedCount = event.glbDisposedCount
      }
      if (event.glbSoftDetachedCount !== undefined) {
        state.glbSoftDetachedCount = event.glbSoftDetachedCount
      }
      if (event.glbMemoryEstimateMB !== undefined) {
        state.glbMemoryEstimateMB = event.glbMemoryEstimateMB
      }
      if (event.glbMemoryMaxActive !== undefined) {
        state.glbMemoryMaxActive = event.glbMemoryMaxActive
      }
      if (event.glbMemoryTtlMs !== undefined) {
        state.glbMemoryTtlMs = event.glbMemoryTtlMs
      }
      if (event.windowActiveCount !== undefined) {
        state.windowActiveCount = event.windowActiveCount
      }
      if (event.windowVisibleCount !== undefined) {
        state.windowVisibleCount = event.windowVisibleCount
      }
      if (event.windowDisposedCount !== undefined) {
        state.windowDisposedCount = event.windowDisposedCount
      }
      if (event.windowBehindCount !== undefined) {
        state.windowBehindCount = event.windowBehindCount
      }
      if (event.windowCachedCount !== undefined) {
        state.windowCachedCount = event.windowCachedCount
      }
      if (event.sceneMemoryPressureEstimate !== undefined) {
        state.sceneMemoryPressureEstimate = event.sceneMemoryPressureEstimate
      }
      if (event.sceneStateLoaded !== undefined) {
        state.sceneStateLoaded = event.sceneStateLoaded
      }
      if (event.sceneStateVisible !== undefined) {
        state.sceneStateVisible = event.sceneStateVisible
      }
      if (event.sceneStateDisposed !== undefined) {
        state.sceneStateDisposed = event.sceneStateDisposed
      }
      if (event.sceneStateRehydrated !== undefined) {
        state.sceneStateRehydrated = event.sceneStateRehydrated
      }
      if (event.sceneStateCached !== undefined) {
        state.sceneStateCached = event.sceneStateCached
      }
      if (event.sceneStateHidden !== undefined) {
        state.sceneStateHidden = event.sceneStateHidden
      }
      if (event.sceneStateActiveLoads !== undefined) {
        state.sceneStateActiveLoads = event.sceneStateActiveLoads
      }
      if (event.sceneCacheHitRate !== undefined) {
        state.sceneCacheHitRate = event.sceneCacheHitRate
      }
      if (event.arbiterDecisionCount !== undefined) {
        state.arbiterDecisionCount = event.arbiterDecisionCount
      }
      if (event.arbiterDeniedCount !== undefined) {
        state.arbiterDeniedCount = event.arbiterDeniedCount
      }
      if (event.arbiterLoadThrottleCount !== undefined) {
        state.arbiterLoadThrottleCount = event.arbiterLoadThrottleCount
      }
      if (event.arbiterConflictResolveCount !== undefined) {
        state.arbiterConflictResolveCount = event.arbiterConflictResolveCount
      }
      if (event.arbiterActiveLoadCount !== undefined) {
        state.arbiterActiveLoadCount = event.arbiterActiveLoadCount
      }
      if (event.arbiterActiveModelCount !== undefined) {
        state.arbiterActiveModelCount = event.arbiterActiveModelCount
      }
      if (event.arbiterMemoryPressureEstimateMB !== undefined) {
        state.arbiterMemoryPressureEstimateMB = event.arbiterMemoryPressureEstimateMB
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
      if (event.atmosphereMode !== undefined) {
        state.atmosphereMode = event.atmosphereMode
      }
      if (event.atmosphereVisible !== undefined) {
        state.atmosphereVisible = event.atmosphereVisible
      }
      if (event.poiBillboardCount !== undefined) {
        state.poiBillboardCount = event.poiBillboardCount
      }
      if (event.poiBillboardMode !== undefined) {
        state.poiBillboardMode = event.poiBillboardMode
      }
      if (Object.prototype.hasOwnProperty.call(event, 'activePoiBillboardId')) {
        state.activePoiBillboardId = event.activePoiBillboardId ?? undefined
      }
      if (event.horizonMaskEnabled !== undefined) {
        state.horizonMaskEnabled = event.horizonMaskEnabled
      }
      if (event.horizonMaskIntensity !== undefined) {
        state.horizonMaskIntensity = event.horizonMaskIntensity
      }
      if (event.activePoiCount !== undefined) {
        state.activePoiCount = event.activePoiCount
      }
      if (event.mutedPoiCount !== undefined) {
        state.mutedPoiCount = event.mutedPoiCount
      }
      if (event.waterHintsEnabled !== undefined) {
        state.waterHintsEnabled = event.waterHintsEnabled
      }
      if (event.waterHintsCount !== undefined) {
        state.waterHintsCount = event.waterHintsCount
      }
      if (event.tourPoiSuppressionEnabled !== undefined) {
        state.tourPoiSuppressionEnabled = event.tourPoiSuppressionEnabled
      }
      if (event.nativeSkyEnabled !== undefined) {
        state.nativeSkyEnabled = event.nativeSkyEnabled
      }
      if (event.nativeSkyApplied !== undefined) {
        state.nativeSkyApplied = event.nativeSkyApplied
      }
      if (event.nativeFogApplied !== undefined) {
        state.nativeFogApplied = event.nativeFogApplied
      }
      if (event.nativeSkyColor !== undefined) {
        state.nativeSkyColor = event.nativeSkyColor
      }
      if (event.nativeFogColor !== undefined) {
        state.nativeFogColor = event.nativeFogColor
      }
      if (event.skyOptionsAnimated !== undefined) {
        state.skyOptionsAnimated = event.skyOptionsAnimated
      }
      if (event.dynamicMistEnabled !== undefined) {
        state.dynamicMistEnabled = event.dynamicMistEnabled
      }
      if (event.dynamicMistCanvasActive !== undefined) {
        state.dynamicMistCanvasActive = event.dynamicMistCanvasActive
      }
      if (event.dynamicMistQuality !== undefined) {
        state.dynamicMistQuality = event.dynamicMistQuality
      }
      if (event.dynamicMistDegraded !== undefined) {
        state.dynamicMistDegraded = event.dynamicMistDegraded
      }
      if (event.dynamicMistDegradeReason !== undefined) {
        state.dynamicMistDegradeReason = event.dynamicMistDegradeReason
      }
      if (event.dynamicMistFpsEstimate !== undefined) {
        state.dynamicMistFpsEstimate = event.dynamicMistFpsEstimate
      }
      if (event.dynamicMistFrameMs !== undefined) {
        state.dynamicMistFrameMs = event.dynamicMistFrameMs
      }
      if (event.dynamicMistRecoveryState !== undefined) {
        state.dynamicMistRecoveryState = event.dynamicMistRecoveryState
      }
      if (event.dynamicMistSpeedScale !== undefined) {
        state.dynamicMistSpeedScale = event.dynamicMistSpeedScale
      }
      if (event.dynamicMistContrastScale !== undefined) {
        state.dynamicMistContrastScale = event.dynamicMistContrastScale
      }
      if (event.enableDynamicMistDebugOverride !== undefined) {
        state.enableDynamicMistDebugOverride = event.enableDynamicMistDebugOverride
      }
      if (event.debugGardenDynamicMistDisabled !== undefined) {
        state.debugGardenDynamicMistDisabled = event.debugGardenDynamicMistDisabled
      }
      if (event.coreClearMaskEnabled !== undefined) {
        state.coreClearMaskEnabled = event.coreClearMaskEnabled
      }
      if (event.poiLiftMode !== undefined) {
        state.poiLiftMode = event.poiLiftMode
      }
      if (event.activePoiLiftPx !== undefined) {
        state.activePoiLiftPx = event.activePoiLiftPx
      }
      if (event.inkOverlayEnabled !== undefined) {
        state.inkOverlayEnabled = event.inkOverlayEnabled
      }
      if (event.inkOverlaySource !== undefined) {
        state.inkOverlaySource = event.inkOverlaySource
      }
      if (event.inkOverlayImageUrl !== undefined) {
        state.inkOverlayImageUrl = event.inkOverlayImageUrl
      }
      if (event.inkOverlayOpacity !== undefined) {
        state.inkOverlayOpacity = event.inkOverlayOpacity
      }
      if (event.inkOverlayEffectiveOpacity !== undefined) {
        state.inkOverlayEffectiveOpacity = event.inkOverlayEffectiveOpacity
      }
      if (event.inkOverlayOffsetX !== undefined) {
        state.inkOverlayOffsetX = event.inkOverlayOffsetX
      }
      if (event.inkOverlayOffsetY !== undefined) {
        state.inkOverlayOffsetY = event.inkOverlayOffsetY
      }
      if (event.inkOverlayScaleX !== undefined) {
        state.inkOverlayScaleX = event.inkOverlayScaleX
      }
      if (event.inkOverlayScaleY !== undefined) {
        state.inkOverlayScaleY = event.inkOverlayScaleY
      }
      if (event.inkOverlayCompare !== undefined) {
        state.inkOverlayCompare = event.inkOverlayCompare
      }
      if (event.inkOverlayBounds !== undefined) {
        state.inkOverlayBounds = event.inkOverlayBounds
      }
      if (event.inkOverlayLayerReady !== undefined) {
        state.inkOverlayLayerReady = event.inkOverlayLayerReady
      }
      if (event.inkOverlayLayerError !== undefined) {
        state.inkOverlayLayerError = event.inkOverlayLayerError
      } else if (event.inkOverlayLayerReady) {
        state.inkOverlayLayerError = undefined
      }
      if (event.inkOverlayLayerMode !== undefined) {
        state.inkOverlayLayerMode = event.inkOverlayLayerMode
      }
      if (event.inkOverlayCameraMode !== undefined) {
        state.inkOverlayCameraMode = event.inkOverlayCameraMode
      }
      if (event.inkOverlaySuppressedReason !== undefined) {
        state.inkOverlaySuppressedReason = event.inkOverlaySuppressedReason
      } else if (event.inkOverlayCameraMode !== undefined) {
        state.inkOverlaySuppressedReason = undefined
      }
      if (event.inkTilesEnabled !== undefined) {
        state.inkTilesEnabled = event.inkTilesEnabled
      }
      if (event.inkTileDefaultEnabled !== undefined) {
        state.inkTileDefaultEnabled = event.inkTileDefaultEnabled
      }
      if (event.noInkTilesOverride !== undefined) {
        state.noInkTilesOverride = event.noInkTilesOverride
      }
      if (event.inkTileSource !== undefined) {
        state.inkTileSource = event.inkTileSource
      }
      if (event.inkTileVariant !== undefined) {
        state.inkTileVariant = event.inkTileVariant
      }
      if (event.inkTileOpacity !== undefined) {
        state.inkTileOpacity = event.inkTileOpacity
      }
      if (event.inkTileOpacityBase !== undefined) {
        state.inkTileOpacityBase = event.inkTileOpacityBase
      }
      if (event.inkTileOpacityEffective !== undefined) {
        state.inkTileOpacityEffective = event.inkTileOpacityEffective
      }
      if (event.inkTileZoomFade !== undefined) {
        state.inkTileZoomFade = event.inkTileZoomFade
      }
      if (event.inkTileUrlTemplate !== undefined) {
        state.inkTileUrlTemplate = event.inkTileUrlTemplate
      }
      if (event.inkTileEmptyUrl !== undefined) {
        state.inkTileEmptyUrl = event.inkTileEmptyUrl
      }
      if (event.inkTileZoomLevels !== undefined) {
        state.inkTileZoomLevels = event.inkTileZoomLevels
      }
      if (event.inkTileMaxNativeZoom !== undefined) {
        state.inkTileMaxNativeZoom = event.inkTileMaxNativeZoom
      }
      if (event.inkTileUsingFallbackZoom !== undefined) {
        state.inkTileUsingFallbackZoom = event.inkTileUsingFallbackZoom
      }
      if (event.inkTileFallbackFromZ !== undefined) {
        state.inkTileFallbackFromZ = event.inkTileFallbackFromZ
      } else if (event.inkTileUsingFallbackZoom === false) {
        state.inkTileFallbackFromZ = undefined
      }
      if (event.inkTileFallbackToZ !== undefined) {
        state.inkTileFallbackToZ = event.inkTileFallbackToZ
      }
      if (event.inkTileLayerReady !== undefined) {
        state.inkTileLayerReady = event.inkTileLayerReady
      }
      if (event.inkTileLayerError !== undefined) {
        state.inkTileLayerError = event.inkTileLayerError
      } else if (event.inkTileLayerReady) {
        state.inkTileLayerError = undefined
      }
      if (event.inkTileBounds !== undefined) {
        state.inkTileBounds = event.inkTileBounds
      }
      if (event.inkTileMode !== undefined) {
        state.inkTileMode = event.inkTileMode
      }
      if (event.sourceTransform !== undefined) {
        state.sourceTransform = event.sourceTransform
      }
      if (event.flipX !== undefined) {
        state.flipX = event.flipX
      }
      if (event.flipY !== undefined) {
        state.flipY = event.flipY
      }
      if (event.rotate !== undefined) {
        state.rotate = event.rotate
      }
      if (event.tileDir !== undefined) {
        state.tileDir = event.tileDir
      }
      if (event.inkTileXRangeByZoom !== undefined) {
        state.inkTileXRangeByZoom = event.inkTileXRangeByZoom
      }
      if (event.inkTileYRangeByZoom !== undefined) {
        state.inkTileYRangeByZoom = event.inkTileYRangeByZoom
      }
      if (event.sourceImageWidth !== undefined) {
        state.sourceImageWidth = event.sourceImageWidth
      }
      if (event.sourceImageHeight !== undefined) {
        state.sourceImageHeight = event.sourceImageHeight
      }
      if (event.sourceImageStandard !== undefined) {
        state.sourceImageStandard = event.sourceImageStandard
      }
      if (event.sourceImageWarning !== undefined) {
        state.sourceImageWarning = event.sourceImageWarning
      }
      if (event.mapBoundaryEnabled !== undefined) {
        state.mapBoundaryEnabled = event.mapBoundaryEnabled
      }
      if (event.landmarkGlbDebugRows !== undefined) {
        state.landmarkGlbDebugRows = event.landmarkGlbDebugRows
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
    treeGlbMode: 'removed',
    activeTreeGlbCount: 0,
    mapBoundsEnabled: false,
    mapBoundsDisabledReason: 'none',
    zoomLimited: false,
    edgeMistLevel: 'normal',
    edgeMistStrength: 0,
    nearInkBoundary: false,
    cameraPresetTightened: false,
    noMapBoundsDebugOverride: false,
    mapInteracting: false,
    routeStopCount: 0,
    routeGeometryPointCount: 0,
    tourStatus: 'idle',
    routeSwitchCount: 0,
    routeGeometryMode: 'poi-polyline',
    guideDataRouteSource: false,
    unmappedGuideStopCount: 0,
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
    atmosphereMode: 'intro',
    atmosphereVisible: false,
    poiBillboardCount: 0,
    poiBillboardMode: 'dot',
    horizonMaskEnabled: false,
    horizonMaskIntensity: 0,
    activePoiCount: 0,
    mutedPoiCount: 0,
    waterHintsEnabled: false,
    waterHintsCount: 0,
    tourPoiSuppressionEnabled: false,
    nativeSkyEnabled: false,
    nativeSkyApplied: false,
    nativeFogApplied: false,
    nativeSkyColor: undefined,
    nativeFogColor: undefined,
    skyOptionsAnimated: false,
    dynamicMistEnabled: false,
    dynamicMistCanvasActive: false,
    dynamicMistQuality: 'off',
    dynamicMistDegraded: false,
    dynamicMistSpeedScale: 1,
    dynamicMistContrastScale: 1,
    enableDynamicMistDebugOverride: false,
    debugGardenDynamicMistDisabled: false,
    coreClearMaskEnabled: false,
    poiLiftMode: 'ground',
    activePoiLiftPx: 0,
    inkOverlayEnabled: false,
    inkOverlaySource: 'ai',
    inkOverlayOpacity: 0,
    inkOverlayEffectiveOpacity: 0,
    inkOverlayOffsetX: 0,
    inkOverlayOffsetY: 0,
    inkOverlayScaleX: 1,
    inkOverlayScaleY: 1,
    inkOverlayCompare: false,
    inkOverlayLayerReady: false,
    inkOverlayLayerMode: 'none',
    inkOverlayCameraMode: 'off',
    inkTilesEnabled: false,
    inkTileDefaultEnabled: false,
    noInkTilesOverride: false,
    inkTileOpacity: 0,
    inkTileOpacityBase: 1,
    inkTileOpacityEffective: 0,
    inkTileZoomFade: 1,
    inkTileZoomLevels: [],
    inkTileMaxNativeZoom: 20,
    inkTileUsingFallbackZoom: false,
    inkTileLayerReady: false,
    inkTileMode: 'none',
    mapBoundaryEnabled: false,
    layerManagerCount: 0,
    layerManagerActiveLayers: [],
    glbRuntimeEnabled: false,
    glbRuntimePhase: 'disabled',
    glbRuntimeProfile: 'desktop',
    glbRuntimeLandmarkGate: false,
    glbRuntimeGardenGate: false,
    glbRuntimeLandmarkDelayMs: 0,
    glbRuntimeGardenDelayMs: 0,
    glbRuntimePendingTimerCount: 0,
    glbActiveCount: 0,
    glbCachedCount: 0,
    glbDisposedCount: 0,
    glbSoftDetachedCount: 0,
    glbMemoryEstimateMB: 0,
    glbMemoryMaxActive: 80,
    glbMemoryTtlMs: 60000,
    windowActiveCount: 0,
    windowVisibleCount: 0,
    windowDisposedCount: 0,
    windowBehindCount: 0,
    windowCachedCount: 0,
    sceneMemoryPressureEstimate: 0,
    sceneStateLoaded: 0,
    sceneStateVisible: 0,
    sceneStateDisposed: 0,
    sceneStateRehydrated: 0,
    sceneStateCached: 0,
    sceneStateHidden: 0,
    sceneStateActiveLoads: 0,
    sceneCacheHitRate: 0,
    arbiterDecisionCount: 0,
    arbiterDeniedCount: 0,
    arbiterLoadThrottleCount: 0,
    arbiterConflictResolveCount: 0,
    arbiterActiveLoadCount: 0,
    arbiterActiveModelCount: 0,
    arbiterMemoryPressureEstimateMB: 0,
    landmarkGlbDebugRows: [],
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
    currentRouteId: state.currentRouteId,
    currentRouteName: state.currentRouteName,
    routeStopCount: state.routeStopCount,
    currentStopId: state.currentStopId,
    nextStopId: state.nextStopId,
    routeGeometryPointCount: state.routeGeometryPointCount,
    tourStatus: state.tourStatus,
    routeSwitchCount: state.routeSwitchCount,
    routeGeometryMode: state.routeGeometryMode,
    guideDataRouteSource: state.guideDataRouteSource,
    unmappedGuideStopCount: state.unmappedGuideStopCount,
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
    treeGlbMode: state.treeGlbMode,
    activeTreeGlbCount: state.activeTreeGlbCount,
    currentZoom: state.currentZoom,
    mapBoundsEnabled: state.mapBoundsEnabled,
    mapBoundsDisabledReason: state.mapBoundsDisabledReason,
    mapCenterLimitBounds: state.mapCenterLimitBounds,
    mapVisualBufferBounds: state.mapVisualBufferBounds,
    currentMapCenter: state.currentMapCenter,
    mapMinZoom: state.mapMinZoom,
    mapMaxZoom: state.mapMaxZoom,
    zoomLimited: state.zoomLimited,
    edgeMistLevel: state.edgeMistLevel,
    edgeMistReason: state.edgeMistReason,
    edgeMistStrength: state.edgeMistStrength,
    nearInkBoundary: state.nearInkBoundary,
    distanceToInkBoundary: state.distanceToInkBoundary,
    clearMaskMode: state.clearMaskMode,
    clearMaskSize: state.clearMaskSize,
    clearMaskCenter: state.clearMaskCenter,
    clearMaskShape: state.clearMaskShape,
    cameraPresetTightened: state.cameraPresetTightened,
    lastBoundsCorrection: state.lastBoundsCorrection,
    noMapBoundsDebugOverride: state.noMapBoundsDebugOverride,
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
    atmosphereMode: state.atmosphereMode,
    atmosphereVisible: state.atmosphereVisible,
    poiBillboardCount: state.poiBillboardCount,
    poiBillboardMode: state.poiBillboardMode,
    activePoiBillboardId: state.activePoiBillboardId,
    horizonMaskEnabled: state.horizonMaskEnabled,
    horizonMaskIntensity: state.horizonMaskIntensity,
    activePoiCount: state.activePoiCount,
    mutedPoiCount: state.mutedPoiCount,
    waterHintsEnabled: state.waterHintsEnabled,
    waterHintsCount: state.waterHintsCount,
    tourPoiSuppressionEnabled: state.tourPoiSuppressionEnabled,
    nativeSkyEnabled: state.nativeSkyEnabled,
    nativeSkyApplied: state.nativeSkyApplied,
    nativeFogApplied: state.nativeFogApplied,
    nativeSkyColor: state.nativeSkyColor,
    nativeFogColor: state.nativeFogColor,
    skyOptionsAnimated: state.skyOptionsAnimated,
    dynamicMistEnabled: state.dynamicMistEnabled,
    dynamicMistCanvasActive: state.dynamicMistCanvasActive,
    dynamicMistQuality: state.dynamicMistQuality,
    dynamicMistDegraded: state.dynamicMistDegraded,
    dynamicMistDegradeReason: state.dynamicMistDegradeReason,
    dynamicMistFpsEstimate: state.dynamicMistFpsEstimate,
    dynamicMistFrameMs: state.dynamicMistFrameMs,
    dynamicMistRecoveryState: state.dynamicMistRecoveryState,
    dynamicMistSpeedScale: state.dynamicMistSpeedScale,
    dynamicMistContrastScale: state.dynamicMistContrastScale,
    enableDynamicMistDebugOverride: state.enableDynamicMistDebugOverride,
    debugGardenDynamicMistDisabled: state.debugGardenDynamicMistDisabled,
    coreClearMaskEnabled: state.coreClearMaskEnabled,
    poiLiftMode: state.poiLiftMode,
    activePoiLiftPx: state.activePoiLiftPx,
    inkOverlayEnabled: state.inkOverlayEnabled,
    inkOverlaySource: state.inkOverlaySource,
    inkOverlayImageUrl: state.inkOverlayImageUrl,
    inkOverlayOpacity: state.inkOverlayOpacity,
    inkOverlayEffectiveOpacity: state.inkOverlayEffectiveOpacity,
    inkOverlayOffsetX: state.inkOverlayOffsetX,
    inkOverlayOffsetY: state.inkOverlayOffsetY,
    inkOverlayScaleX: state.inkOverlayScaleX,
    inkOverlayScaleY: state.inkOverlayScaleY,
    inkOverlayCompare: state.inkOverlayCompare,
    inkOverlayBounds: state.inkOverlayBounds,
    inkOverlayLayerReady: state.inkOverlayLayerReady,
    inkOverlayLayerError: state.inkOverlayLayerError,
    inkOverlayLayerMode: state.inkOverlayLayerMode,
    inkOverlayCameraMode: state.inkOverlayCameraMode,
    inkOverlaySuppressedReason: state.inkOverlaySuppressedReason,
    inkTilesEnabled: state.inkTilesEnabled,
    inkTileDefaultEnabled: state.inkTileDefaultEnabled,
    noInkTilesOverride: state.noInkTilesOverride,
    inkTileSource: state.inkTileSource,
    inkTileVariant: state.inkTileVariant,
    inkTileOpacity: state.inkTileOpacity,
    inkTileOpacityBase: state.inkTileOpacityBase,
    inkTileOpacityEffective: state.inkTileOpacityEffective,
    inkTileZoomFade: state.inkTileZoomFade,
    inkTileUrlTemplate: state.inkTileUrlTemplate,
    inkTileEmptyUrl: state.inkTileEmptyUrl,
    inkTileZoomLevels: state.inkTileZoomLevels,
    inkTileMaxNativeZoom: state.inkTileMaxNativeZoom,
    inkTileUsingFallbackZoom: state.inkTileUsingFallbackZoom,
    inkTileFallbackFromZ: state.inkTileFallbackFromZ,
    inkTileFallbackToZ: state.inkTileFallbackToZ,
    inkTileLayerReady: state.inkTileLayerReady,
    inkTileLayerError: state.inkTileLayerError,
    inkTileBounds: state.inkTileBounds,
    inkTileMode: state.inkTileMode,
    sourceTransform: state.sourceTransform,
    flipX: state.flipX,
    flipY: state.flipY,
    rotate: state.rotate,
    tileDir: state.tileDir,
    inkTileXRangeByZoom: state.inkTileXRangeByZoom,
    inkTileYRangeByZoom: state.inkTileYRangeByZoom,
    sourceImageWidth: state.sourceImageWidth,
    sourceImageHeight: state.sourceImageHeight,
    sourceImageStandard: state.sourceImageStandard,
    sourceImageWarning: state.sourceImageWarning,
    mapBoundaryEnabled: state.mapBoundaryEnabled,
    layerManagerCount: state.layerManagerCount,
    layerManagerActiveLayers: state.layerManagerActiveLayers,
    layerManagerSnapshot: state.layerManagerSnapshot,
    glbRuntimeEnabled: state.glbRuntimeEnabled,
    glbRuntimePhase: state.glbRuntimePhase,
    glbRuntimeProfile: state.glbRuntimeProfile,
    glbRuntimeLandmarkGate: state.glbRuntimeLandmarkGate,
    glbRuntimeGardenGate: state.glbRuntimeGardenGate,
    glbRuntimeLandmarkDelayMs: state.glbRuntimeLandmarkDelayMs,
    glbRuntimeGardenDelayMs: state.glbRuntimeGardenDelayMs,
    glbRuntimePendingTimerCount: state.glbRuntimePendingTimerCount,
    glbActiveCount: state.glbActiveCount,
    glbCachedCount: state.glbCachedCount,
    glbDisposedCount: state.glbDisposedCount,
    glbSoftDetachedCount: state.glbSoftDetachedCount,
    glbMemoryEstimateMB: state.glbMemoryEstimateMB,
    glbMemoryMaxActive: state.glbMemoryMaxActive,
    glbMemoryTtlMs: state.glbMemoryTtlMs,
    windowActiveCount: state.windowActiveCount,
    windowVisibleCount: state.windowVisibleCount,
    windowDisposedCount: state.windowDisposedCount,
    windowBehindCount: state.windowBehindCount,
    windowCachedCount: state.windowCachedCount,
    sceneMemoryPressureEstimate: state.sceneMemoryPressureEstimate,
    sceneStateLoaded: state.sceneStateLoaded,
    sceneStateVisible: state.sceneStateVisible,
    sceneStateDisposed: state.sceneStateDisposed,
    sceneStateRehydrated: state.sceneStateRehydrated,
    sceneStateCached: state.sceneStateCached,
    sceneStateHidden: state.sceneStateHidden,
    sceneStateActiveLoads: state.sceneStateActiveLoads,
    sceneCacheHitRate: state.sceneCacheHitRate,
    arbiterDecisionCount: state.arbiterDecisionCount,
    arbiterDeniedCount: state.arbiterDeniedCount,
    arbiterLoadThrottleCount: state.arbiterLoadThrottleCount,
    arbiterConflictResolveCount: state.arbiterConflictResolveCount,
    arbiterActiveLoadCount: state.arbiterActiveLoadCount,
    arbiterActiveModelCount: state.arbiterActiveModelCount,
    arbiterMemoryPressureEstimateMB: state.arbiterMemoryPressureEstimateMB,
    landmarkGlbDebugRows: state.landmarkGlbDebugRows,
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
