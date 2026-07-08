import { useEffect, useState } from 'react'

import { LandmarkGLBInspector } from './LandmarkGLBInspector'
import type { LandmarkModelInspector } from '../../hooks/useLandmarkModelInspector'
import type { Map3DPerfRecorder, Map3DPerfSnapshot } from '../../lib/map3dPerf'

type Map3DPerfPanelProps = {
  recorder: Map3DPerfRecorder
  landmarkInspector?: LandmarkModelInspector
}

export function Map3DPerfPanel({ recorder, landmarkInspector }: Map3DPerfPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [snapshot, setSnapshot] = useState<Map3DPerfSnapshot>(() => recorder.getSnapshot())
  const [copyStatus, setCopyStatus] = useState('')
  const [manualCopyText, setManualCopyText] = useState('')

  useEffect(() => {
    const updateSnapshot = () => setSnapshot(recorder.getSnapshot())
    updateSnapshot()
    const unsubscribe = recorder.subscribe(updateSnapshot)
    const intervalId = window.setInterval(updateSnapshot, 600)

    return () => {
      unsubscribe()
      window.clearInterval(intervalId)
    }
  }, [recorder])

  const copySnapshot = async () => {
    const text = JSON.stringify(
      {
        ...snapshot,
        landmarkInspector: landmarkInspector?.items ?? []
      },
      null,
      2
    )
    const ok = await copyText(text)
    setManualCopyText(ok ? '' : text)
    setCopyStatus(ok ? '已复制诊断 JSON' : '剪贴板不可用，已显示可手动复制 JSON')
  }

  const clearSnapshot = () => {
    recorder.clear()
    setSnapshot(recorder.getSnapshot())
    setManualCopyText('')
    setCopyStatus('已清空当前诊断记录')
  }

  if (!snapshot.enabled) {
    return null
  }

  const landmarkRuntimeEvents = snapshot.mapVisualEvents
    .filter((event) => event.type === 'landmarkRuntimeLoadStarted' || event.type === 'landmarkRuntimeLoadBatch')
    .slice(-6)
  const inkTileFallbackLabel =
    snapshot.inkTileUsingFallbackZoom && snapshot.inkTileFallbackFromZ !== undefined
      ? ` · z${snapshot.inkTileFallbackFromZ}->z${snapshot.inkTileFallbackToZ ?? snapshot.inkTileMaxNativeZoom}`
      : ''
  const landmarkDebugRows = snapshot.landmarkGlbDebugRows ?? []

  return (
    <section className={`map-3d-guide-perf-panel ${expanded ? 'is-expanded' : ''}`}>
      <div className="map-3d-guide-perf-panel__header">
        <div>
          <strong>运行时诊断</strong>
          <span>debugPerf=1</span>
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      <dl className="map-3d-guide-perf-panel__summary">
        <div>
          <dt>Map init</dt>
          <dd>
            {formatMs(snapshot.mapInitMs)}
            {snapshot.mapVisualReadyMs !== undefined ? ` · visual ${formatMs(snapshot.mapVisualReadyMs)}` : ''}
            {snapshot.mapReadyTimedOut ? ' · timeout' : ''}
          </dd>
        </div>
        <div>
          <dt>Startup</dt>
          <dd>{snapshot.startupStage}</dd>
        </div>
        <div>
          <dt>Route</dt>
          <dd>
            {snapshot.currentRouteName ?? '-'} · {snapshot.currentRouteId ?? '-'} · {snapshot.routeStopCount} stops · {snapshot.routeGeometryPointCount} pts · {snapshot.routeGeometryMode} · {formatMs(snapshot.routeDrawMs)}
          </dd>
        </div>
        <div>
          <dt>POI</dt>
          <dd>{formatMs(snapshot.poiInitMs)}</dd>
        </div>
        <div>
          <dt>Atmosphere</dt>
          <dd>
            {snapshot.atmosphereMode}
            {snapshot.atmosphereVisible ? '' : ' · hidden'}
            {snapshot.horizonMaskEnabled ? ` · horizon ${Math.round(snapshot.horizonMaskIntensity * 100)}%` : ''}
            {snapshot.coreClearMaskEnabled ? ' · clear-core' : ''}
          </dd>
        </div>
        <div>
          <dt>Native Sky</dt>
          <dd>
            {snapshot.nativeSkyEnabled ? (snapshot.nativeSkyApplied ? 'applied' : 'configured') : 'off'}
            {snapshot.nativeFogApplied ? ' · fog' : ''}
            {snapshot.nativeSkyColor ? ` · ${snapshot.nativeSkyColor}` : ''}
            {snapshot.skyOptionsAnimated ? ' · animated' : ''}
          </dd>
        </div>
        <div>
          <dt>Dynamic Mist</dt>
          <dd>
            {snapshot.dynamicMistEnabled ? (snapshot.dynamicMistCanvasActive ? 'active' : 'idle') : 'off'} · {snapshot.dynamicMistQuality}
            {snapshot.dynamicMistSpeedScale ? ` · speed ${snapshot.dynamicMistSpeedScale.toFixed(2)}x` : ''}
            {snapshot.dynamicMistContrastScale ? ` · contrast ${snapshot.dynamicMistContrastScale.toFixed(2)}x` : ''}
            {snapshot.dynamicMistFpsEstimate ? ` · ${snapshot.dynamicMistFpsEstimate}fps` : ''}
            {snapshot.dynamicMistDegraded ? ' · degraded' : ''}
          </dd>
        </div>
        <div>
          <dt>POI Labels</dt>
          <dd>
            {snapshot.poiBillboardMode} · {snapshot.poiBillboardCount}
            {snapshot.poiLiftMode === 'raised' ? ` · lift ${snapshot.activePoiLiftPx}` : ''}
            {snapshot.tourPoiSuppressionEnabled ? ` · muted ${snapshot.mutedPoiCount}` : ''}
            {snapshot.activePoiBillboardId ? ` · ${snapshot.activePoiBillboardId}` : ''}
          </dd>
        </div>
        <div>
          <dt>Water Hints</dt>
          <dd>{snapshot.waterHintsEnabled ? `${snapshot.waterHintsCount} · active ${snapshot.activePoiCount}` : 'hidden'}</dd>
        </div>
        <div>
          <dt>Ink Tiles</dt>
          <dd>
            {snapshot.inkTilesEnabled
              ? `${snapshot.inkTileMode === 'tencent-custom-layer' ? 'Tencent custom' : 'v3'} · ${snapshot.inkTileMode} · ${Math.round(snapshot.inkTileOpacityEffective * 100)}%/${Math.round(snapshot.inkTileOpacityBase * 100)}%${inkTileFallbackLabel}`
              : snapshot.noInkTilesOverride
                ? 'disabled by noInkTiles'
                : 'off'}
            {snapshot.inkTileLayerReady ? ' · ready' : ''}
            {snapshot.inkTileLayerError ? ' · error' : ''}
            {snapshot.mapBoundaryEnabled ? ' · bounded' : ''}
          </dd>
        </div>
        <div>
          <dt>Layer Manager</dt>
          <dd title={snapshot.layerManagerSnapshot ?? undefined}>
            {snapshot.layerManagerCount}
            {snapshot.layerManagerActiveLayers.length ? ` · ${snapshot.layerManagerActiveLayers.slice(0, 4).join(', ')}` : ' · none'}
            {snapshot.layerManagerActiveLayers.length > 4 ? ` +${snapshot.layerManagerActiveLayers.length - 4}` : ''}
          </dd>
        </div>
        <div>
          <dt>GLB Runtime</dt>
          <dd>
            {snapshot.glbRuntimeEnabled ? `${snapshot.glbRuntimePhase} · ${snapshot.glbRuntimeProfile}` : 'off'}
            {snapshot.glbRuntimeLandmarkGate ? ' · landmarks' : ''}
            {snapshot.glbRuntimePendingTimerCount ? ` · timers ${snapshot.glbRuntimePendingTimerCount}` : ''}
          </dd>
        </div>
        <div>
          <dt>GLB Memory</dt>
          <dd>
            active {snapshot.glbActiveCount}/{snapshot.glbMemoryMaxActive} · cached {snapshot.glbCachedCount}
            {snapshot.glbSoftDetachedCount ? ` · detached ${snapshot.glbSoftDetachedCount}` : ''}
            {snapshot.glbDisposedCount ? ` · disposed ${snapshot.glbDisposedCount}` : ''}
            {snapshot.glbMemoryEstimateMB ? ` · ~${snapshot.glbMemoryEstimateMB}MB` : ''}
          </dd>
        </div>
        <div>
          <dt>Scene Window</dt>
          <dd>
            visible {snapshot.windowVisibleCount}/{snapshot.windowActiveCount}
            {snapshot.windowCachedCount ? ` · cached ${snapshot.windowCachedCount}` : ''}
            {snapshot.windowBehindCount ? ` · behind ${snapshot.windowBehindCount}` : ''}
            {snapshot.windowDisposedCount ? ` · disposed ${snapshot.windowDisposedCount}` : ''}
            {snapshot.sceneMemoryPressureEstimate ? ` · ~${snapshot.sceneMemoryPressureEstimate}MB` : ''}
          </dd>
        </div>
        <div>
          <dt>Scene State</dt>
          <dd>
            {snapshot.sceneStateVisible}/{snapshot.sceneStateLoaded} · disposed {snapshot.sceneStateDisposed}
            {snapshot.sceneStateRehydrated ? ` · rehydrated ${snapshot.sceneStateRehydrated}` : ''}
            {snapshot.sceneStateActiveLoads ? ` · loading ${snapshot.sceneStateActiveLoads}` : ''}
            {snapshot.sceneCacheHitRate ? ` · hit ${Math.round(snapshot.sceneCacheHitRate * 100)}%` : ''}
          </dd>
        </div>
        <div>
          <dt>Scene Arbiter</dt>
          <dd>
            decisions {snapshot.arbiterDecisionCount}
            {snapshot.arbiterDeniedCount ? ` · denied ${snapshot.arbiterDeniedCount}` : ''}
            {snapshot.arbiterLoadThrottleCount ? ` · throttle ${snapshot.arbiterLoadThrottleCount}` : ''}
            {snapshot.arbiterConflictResolveCount ? ` · conflicts ${snapshot.arbiterConflictResolveCount}` : ''}
          </dd>
        </div>
        <div>
          <dt>Map Bounds</dt>
          <dd>
            {snapshot.mapBoundsEnabled
              ? `${snapshot.mapMinZoom?.toFixed(2) ?? '-'}-${snapshot.mapMaxZoom?.toFixed(2) ?? '-'} · ${snapshot.edgeMistLevel}`
              : `off · ${snapshot.mapBoundsDisabledReason}`}
            {snapshot.edgeMistStrength !== undefined ? ` · mist ${Math.round(snapshot.edgeMistStrength * 100)}%` : ''}
            {snapshot.zoomLimited ? ' · limited' : ''}
          </dd>
        </div>
        <div>
          <dt>Tree GLB</dt>
          <dd>
            removed · active 0
          </dd>
        </div>
        <div>
          <dt>Landmark GLB</dt>
          <dd>
            {snapshot.landmarkLoaded}/{snapshot.landmarkTotal}
          </dd>
        </div>
        <div>
          <dt>Calibration</dt>
          <dd>
            {snapshot.calibrationDraftCount}
            {snapshot.activeCalibrationId ? ` · ${snapshot.activeCalibrationId}` : ''}
          </dd>
        </div>
        <div>
          <dt>Camera</dt>
          <dd>{snapshot.latestCameraEvent?.cameraPreset ?? '-'}</dd>
        </div>
        <div>
          <dt>Zoom</dt>
          <dd>
            {snapshot.currentZoom !== undefined ? snapshot.currentZoom.toFixed(2) : '-'}
            {snapshot.mapInteracting ? ` · ${snapshot.mapInteractionKind ?? 'move'}` : ''}
          </dd>
        </div>
        <div>
          <dt>Tour</dt>
          <dd>
            {snapshot.tourStatus}
            {snapshot.latestTourEvent?.tourCameraTightenMode ? ` · ${snapshot.latestTourEvent.tourCameraTightenMode}` : ''}
            {snapshot.latestTourEvent?.tourCameraTightenStrength !== undefined
              ? ` ${Math.round(snapshot.latestTourEvent.tourCameraTightenStrength * 100)}%`
              : ''}
            {snapshot.latestTourEvent?.type ? ` · ${snapshot.latestTourEvent.type}` : ''}
          </dd>
        </div>
        <div>
          <dt>Companion</dt>
          <dd>{snapshot.latestCompanionModelEvent?.type ?? '-'}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{snapshot.gardenFailed + snapshot.landmarkFailed}</dd>
        </div>
        <div>
          <dt>First batch</dt>
          <dd>{formatMs(snapshot.gardenFirstBatchMs)}</dd>
        </div>
        <div>
          <dt>All done</dt>
          <dd>{formatMs(snapshot.gardenAllDoneMs)}</dd>
        </div>
      </dl>

      {expanded ? (
        <div className="map-3d-guide-perf-panel__details">
          {landmarkInspector ? <LandmarkGLBInspector inspector={landmarkInspector} /> : null}

          <section>
            <h3>Landmark GLB Debug</h3>
            {landmarkDebugRows.length ? (
              <ol>
                {landmarkDebugRows.map((row) => (
                  <li key={row.id}>
                    <span>
                      {row.displayName} · {row.id}
                    </span>
                    <small>
                      {row.desiredState} · {row.actualState} · arbiter {row.arbiterDecision}
                      {row.denyReason ? ` (${row.denyReason})` : ''}
                      {row.distanceToMapCenter !== undefined ? ` · ${row.distanceToMapCenter}m` : ''}
                      {row.activeBudgetUsed !== undefined ? ` · active ${row.activeBudgetUsed}/${row.activeBudgetMax ?? '-'}` : ''}
                      {row.activeSlotIndex !== undefined ? ` · slot ${row.activeSlotIndex + 1}` : ''}
                      {row.evictable ? ` · evictable${row.evictReason ? `:${row.evictReason}` : ''}` : ''}
                      {row.lastEvictedAt ? ` · evicted ${new Date(row.lastEvictedAt).toLocaleTimeString()}` : ''}
                      {row.lastLoadAllowReason ? ` · load ${row.lastLoadAllowReason}` : ''}
                      {row.lastLoadDenyReason ? ` · deny ${row.lastLoadDenyReason}` : ''}
                      {row.isTourFocus ? ' · tour focus' : ''}
                      {row.isProtected ? ' · protected' : ''}
                      {row.lastError ? ` · ${row.lastError}` : ''}
                    </small>
                    {row.glbUrl ? <code>{row.glbUrl}</code> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无 landmark GLB 调度诊断</p>
            )}
          </section>

          <section>
            <h3>地图视觉 Ready</h3>
            <ol>
              <li>
                <span>{snapshot.latestMapVisualEvent?.type ?? 'pending'}</span>
                <small>
                  created {formatMs(snapshot.mapCreatedMs)} · idle {formatMs(snapshot.mapFirstIdleMs)} · visual {formatMs(snapshot.mapVisualReadyMs)} · curtain {formatMs(snapshot.loadingCurtainDurationMs)}
                  {snapshot.mapReadyTimedOut ? ' · timed out' : ''}
                </small>
              </li>
              <li>
                <span>Startup stage</span>
                <small>
                  {snapshot.startupStage} · overlays {formatMs(snapshot.overlaysStartedMs)} · route/poi {formatMs(snapshot.routePoiShownMs)} · garden after ready {formatMs(snapshot.gardenLoadStartedAfterMapReadyMs)}
                </small>
              </li>
              {snapshot.mapVisualEvents.slice(-6).map((event, index) => (
                <li key={`${event.recordedAt}-${index}`}>
                  <span>{event.type}</span>
                  <small>
                    {event.elapsedMs !== undefined ? formatMs(event.elapsedMs) : '-'}
                    {event.startupStage ? ` · ${event.startupStage}` : ''}
                    {event.curtainDurationMs !== undefined ? ` · curtain ${formatMs(event.curtainDurationMs)}` : ''}
                    {event.reason ? ` · ${event.reason}` : ''}
                    {event.landmarkRuntimeBatchIndex !== undefined
                      ? ` · runtime batch ${event.landmarkRuntimeBatchIndex + 1}/${event.landmarkRuntimeBatchCount ?? '-'}`
                      : ''}
                    {event.landmarkRuntimeIds?.length ? ` · ${event.landmarkRuntimeIds.join(', ')}` : ''}
                  </small>
                </li>
              ))}
              {landmarkRuntimeEvents.length ? (
                <li>
                  <span>landmark runtime batches</span>
                  <small>
                    {landmarkRuntimeEvents
                      .map((event) =>
                        event.landmarkRuntimeBatchIndex !== undefined
                          ? `batch ${event.landmarkRuntimeBatchIndex + 1}/${event.landmarkRuntimeBatchCount ?? '-'}: ${(event.landmarkRuntimeIds ?? []).join(', ')}`
                          : `${event.type}: ${event.landmarkRuntimeBatchCount ?? 0} batches`
                      )
                      .join(' · ')}
                  </small>
                </li>
              ) : null}
              {snapshot.inkTilesEnabled ? (
                <li>
                  <span>ink tiles</span>
                  <small>
                    {snapshot.inkTileUrlTemplate ?? '-'} · levels {(snapshot.inkTileZoomLevels ?? []).join(', ') || '-'} · base{' '}
                    {Math.round(snapshot.inkTileOpacityBase * 100)}% · effective {Math.round(snapshot.inkTileOpacityEffective * 100)}% · fade{' '}
                    {Math.round(snapshot.inkTileZoomFade * 100)}%
                    {snapshot.inkTileDefaultEnabled ? ' · default-on' : ''}
                    {snapshot.noInkTilesOverride ? ' · noInkTiles' : ''}
                    {snapshot.inkTileMaxNativeZoom ? ` · max native z${snapshot.inkTileMaxNativeZoom}` : ''}
                    {snapshot.inkTileUsingFallbackZoom ? ` · fallback z${snapshot.inkTileFallbackFromZ}->z${snapshot.inkTileFallbackToZ}` : ''}
                    {snapshot.inkTileEmptyUrl ? ` · empty ${snapshot.inkTileEmptyUrl}` : ''}
                    {snapshot.sourceImageWidth && snapshot.sourceImageHeight ? ` · source ${snapshot.sourceImageWidth}x${snapshot.sourceImageHeight}` : ''}
                    {snapshot.sourceImageStandard === false ? ' · non-standard' : ''}
                    {snapshot.sourceImageWarning ? ` · ${snapshot.sourceImageWarning}` : ''}
                    {snapshot.inkTileXRangeByZoom ? ` · x ${snapshot.inkTileXRangeByZoom}` : ''}
                    {snapshot.inkTileYRangeByZoom ? ` · y ${snapshot.inkTileYRangeByZoom}` : ''}
                    {snapshot.inkTileLayerReady ? ' · ready' : ' · pending'}
                    {snapshot.mapBoundaryEnabled ? ' · boundary' : ''}
                    {snapshot.inkTileBounds ? ` · ${snapshot.inkTileBounds}` : ''}
                    {snapshot.inkTileLayerError ? ` · ${snapshot.inkTileLayerError}` : ''}
                  </small>
                </li>
              ) : null}
              <li>
                <span>map bounds</span>
                <small>
                  {snapshot.mapBoundsEnabled ? 'enabled' : `disabled ${snapshot.mapBoundsDisabledReason}`} · center {snapshot.currentMapCenter ?? '-'} ·
                  zoom {snapshot.currentZoom?.toFixed(2) ?? '-'} · range {snapshot.mapMinZoom?.toFixed(2) ?? '-'}-
                  {snapshot.mapMaxZoom?.toFixed(2) ?? '-'} · mist {snapshot.edgeMistLevel}
                  {snapshot.edgeMistReason ? ` (${snapshot.edgeMistReason})` : ''}
                  {snapshot.edgeMistStrength !== undefined ? ` · strength ${Math.round(snapshot.edgeMistStrength * 100)}%` : ''}
                  {snapshot.nearInkBoundary ? ' · near boundary' : ''}
                  {snapshot.distanceToInkBoundary !== undefined ? ` · boundary ${snapshot.distanceToInkBoundary}m` : ''}
                  {snapshot.clearMaskMode ? ` · clear ${snapshot.clearMaskMode}/${snapshot.clearMaskSize ?? '-'}/${snapshot.clearMaskShape ?? '-'}` : ''}
                  {snapshot.clearMaskCenter ? ` · ${snapshot.clearMaskCenter}` : ''}
                  {snapshot.lastBoundsCorrection ? ` · corrected ${snapshot.lastBoundsCorrection}` : ''}
                  {snapshot.noMapBoundsDebugOverride ? ' · debug override' : ''}
                  {snapshot.mapCenterLimitBounds ? ` · center ${snapshot.mapCenterLimitBounds}` : ''}
                  {snapshot.mapVisualBufferBounds ? ` · buffer ${snapshot.mapVisualBufferBounds}` : ''}
                </small>
              </li>
              <li>
                <span>glb memory lifecycle</span>
                <small>
                  active {snapshot.glbActiveCount}/{snapshot.glbMemoryMaxActive} · cached {snapshot.glbCachedCount} · detached{' '}
                  {snapshot.glbSoftDetachedCount} · disposed {snapshot.glbDisposedCount} · ttl {Math.round(snapshot.glbMemoryTtlMs / 1000)}s ·
                  estimate ~{snapshot.glbMemoryEstimateMB}MB
                </small>
              </li>
              <li>
                <span>scene window</span>
                <small>
                  visible {snapshot.windowVisibleCount}/{snapshot.windowActiveCount} · cached {snapshot.windowCachedCount} · behind{' '}
                  {snapshot.windowBehindCount} · disposed {snapshot.windowDisposedCount} · pressure ~{snapshot.sceneMemoryPressureEstimate}MB
                </small>
              </li>
              <li>
                <span>scene state</span>
                <small>
                  loaded {snapshot.sceneStateLoaded} · visible {snapshot.sceneStateVisible} · hidden {snapshot.sceneStateHidden} · cached{' '}
                  {snapshot.sceneStateCached} · disposed {snapshot.sceneStateDisposed} · rehydrated {snapshot.sceneStateRehydrated} · loading{' '}
                  {snapshot.sceneStateActiveLoads} · cache hit {Math.round(snapshot.sceneCacheHitRate * 100)}%
                </small>
              </li>
              <li>
                <span>scene arbiter</span>
                <small>
                  decisions {snapshot.arbiterDecisionCount} · denied {snapshot.arbiterDeniedCount} · throttled {snapshot.arbiterLoadThrottleCount} ·
                  conflicts {snapshot.arbiterConflictResolveCount} · active loads {snapshot.arbiterActiveLoadCount} · active models{' '}
                  {snapshot.arbiterActiveModelCount} · pressure ~{snapshot.arbiterMemoryPressureEstimateMB}MB
                </small>
              </li>
              <li>
                <span>dynamic mist</span>
                <small>
                  {snapshot.dynamicMistEnabled ? 'enabled' : 'disabled'} · canvas {snapshot.dynamicMistCanvasActive ? 'active' : 'off'} · quality{' '}
                  {snapshot.dynamicMistQuality} · recovery {snapshot.dynamicMistRecoveryState ?? '-'}
                  {snapshot.dynamicMistSpeedScale ? ` · speed ${snapshot.dynamicMistSpeedScale.toFixed(2)}x` : ''}
                  {snapshot.dynamicMistContrastScale ? ` · contrast ${snapshot.dynamicMistContrastScale.toFixed(2)}x` : ''}
                  {snapshot.dynamicMistFrameMs !== undefined ? ` · frame ${snapshot.dynamicMistFrameMs}ms` : ''}
                  {snapshot.dynamicMistFpsEstimate !== undefined ? ` · fps ${snapshot.dynamicMistFpsEstimate}` : ''}
                  {snapshot.dynamicMistDegraded ? ` · degraded ${snapshot.dynamicMistDegradeReason ?? ''}` : ''}
                  {snapshot.enableDynamicMistDebugOverride ? ' · debug override' : ''}
                  {snapshot.debugGardenDynamicMistDisabled ? ' · debugGarden disabled' : ''}
                  {snapshot.skyOptionsAnimated ? ' · sky animated' : ''}
                </small>
              </li>
            </ol>
          </section>

          <section>
            <h3>多路线导览</h3>
            <ol>
              <li>
                <span>{snapshot.currentRouteName ?? 'pending'}</span>
                <small>
                  id {snapshot.currentRouteId ?? '-'} · stops {snapshot.routeStopCount} · current {snapshot.currentStopId ?? '-'} · next {snapshot.nextStopId ?? '-'}
                </small>
              </li>
              <li>
                <span>routeGeometry</span>
                <small>
                  {snapshot.routeGeometryMode} · points {snapshot.routeGeometryPointCount} · guideData {snapshot.guideDataRouteSource ? 'true' : 'false'} · unmapped {snapshot.unmappedGuideStopCount}
                </small>
              </li>
              <li>
                <span>interaction</span>
                <small>
                  tour {snapshot.tourStatus} · switches {snapshot.routeSwitchCount}
                  {snapshot.latestTourEvent?.tourCameraTightenMode ? ` · camera ${snapshot.latestTourEvent.tourCameraTightenMode}` : ''}
                  {snapshot.latestTourEvent?.tourCameraTightenStrength !== undefined
                    ? ` ${Math.round(snapshot.latestTourEvent.tourCameraTightenStrength * 100)}%`
                    : ''}
                  {snapshot.latestTourEvent?.tourProfile ? ` · ${snapshot.latestTourEvent.tourProfile}` : ''}
                  {snapshot.latestTourEvent?.tourCameraUpdateFps ? ` · camera ${snapshot.latestTourEvent.tourCameraUpdateFps}fps` : ''}
                  {snapshot.latestTourEvent?.tourMarkerUpdateFps ? ` · route ${snapshot.latestTourEvent.tourMarkerUpdateFps}fps` : ''}
                  {snapshot.latestTourEvent?.tourBoundsClampPaused ? ' · bounds paused' : ''}
                </small>
              </li>
            </ol>
          </section>

          <section>
            <h3>树群 GLB</h3>
            <ol>
              <li>
                <span>Tree GLB system</span>
                <small>treeGlbMode removed · activeTreeGlbCount 0 · Tree Candidate Lab disabled</small>
              </li>
            </ol>
          </section>

          <section>
            <h3>Companion / 底座模型事件</h3>
            {snapshot.companionModelEvents.length ? (
              <ol>
                {snapshot.companionModelEvents.slice(-10).map((event, index) => (
                  <li key={`${event.recordedAt}-${index}`}>
                    <span>{event.type}</span>
                    <small>
                      {event.parentLandmarkId} · {event.companionId}
                      {event.status ? ` · ${event.status}` : ''}
                      {event.durationMs !== undefined ? ` · ${formatMs(event.durationMs)}` : ''}
                      {event.scale !== undefined ? ` · scale ${event.scale}` : ''}
                      {event.height !== undefined ? ` · h ${event.height}` : ''}
                      {event.rotationY !== undefined ? ` · rotY ${event.rotationY}` : ''}
                      {event.error ? ` · ${event.error}` : ''}
                    </small>
                    {event.modelUrl ? <code>{event.modelUrl}</code> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无 companion / 底座模型事件</p>
            )}
          </section>

          <section>
            <h3>相机事件</h3>
            {snapshot.cameraEvents.length ? (
              <ol>
                {snapshot.cameraEvents.slice(-8).map((event, index) => (
                  <li key={`${event.startedAt}-${index}`}>
                    <span>{event.cameraPreset}</span>
                    <small>
                      {event.targetLandmarkId ? `landmark: ${event.targetLandmarkId}` : event.targetPoiId ? `poi: ${event.targetPoiId}` : 'overview'} · {formatMs(event.durationMs)}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无相机事件</p>
            )}
          </section>

          <section>
            <h3>巡游 / 预演事件</h3>
            {snapshot.tourEvents.length ? (
              <ol>
                {snapshot.tourEvents.slice(-14).map((event, index) => (
                  <li key={`${event.recordedAt}-${index}`}>
                    <span>{event.type}</span>
                    <small>
                      {event.stepLabel ?? event.stepId ?? event.mode}
                      {event.activeLandmarkId ? ` · active: ${event.activeLandmarkId}` : ''}
                      {event.nearbyLandmarkId ? ` · near: ${event.nearbyLandmarkId}` : ''}
                      {event.progress !== undefined ? ` · ${Math.round(event.progress * 100)}%` : ''}
                      {event.bearing !== undefined ? ` · bearing ${Math.round(event.bearing)}°` : ''}
                      {event.lookAheadProgress !== undefined ? ` · lookAhead ${Math.round(event.lookAheadProgress * 1000) / 10}%` : ''}
                      {event.lateralOffsetMeters !== undefined ? ` · offset ${Math.round(event.lateralOffsetMeters)}m` : ''}
                      {event.estimatedFps !== undefined ? ` · ${Math.round(event.estimatedFps)}fps` : ''}
                      {event.source ? ` · source ${event.source}` : ''}
                      {event.traveledPointCount !== undefined ? ` · traveled ${event.traveledPointCount}` : ''}
                      {event.remainingPointCount !== undefined ? ` · remaining ${event.remainingPointCount}` : ''}
                      {event.routeHasOverlaps ? ' · overlaps' : ''}
                      {event.cameraPreset ? ` · ${event.cameraPreset}` : ''}
                      {event.durationMs !== undefined ? ` · ${formatMs(event.durationMs)}` : ''}
                      {event.reason ? ` · ${event.reason}` : ''}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无巡游 / 预演事件</p>
            )}
          </section>

          <section>
            <h3>最慢 GLB asset</h3>
            {snapshot.slowestAssets.length ? (
              <ol>
                {snapshot.slowestAssets.map((asset) => (
                  <li key={asset.id}>
                    <span>{asset.name ?? asset.id}</span>
                    <small>
                      {asset.category} · {asset.variant ?? 'raw'} · {asset.selectedSizeLabel ?? asset.fileSizeLabel ?? 'size ?'} · {formatMs(asset.durationMs)} · {asset.status}
                    </small>
                    <code>{asset.modelUrl ?? asset.assetUrl}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无 GLB 记录</p>
            )}
          </section>

          <section>
            <h3>重复 assetUrl</h3>
            {snapshot.duplicatedUrls.length ? (
              <ol>
                {snapshot.duplicatedUrls.map((item) => (
                  <li key={item.assetUrl}>
                    <span>{item.assetUrl}</span>
                    <small>{item.count} 次</small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无重复 URL</p>
            )}
          </section>

          <section>
            <h3>批次</h3>
            {snapshot.batches.length ? (
              <ol>
                {snapshot.batches.map((batch) => (
                  <li key={batch.batchIndex}>
                    <span>Batch {batch.batchIndex + 1}</span>
                    <small>
                      {batch.count} 个 · {batch.durationMs !== undefined ? formatMs(batch.durationMs) : 'pending'}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无批次记录</p>
            )}
          </section>

          <section>
            <h3>失败</h3>
            {snapshot.failedAssets.length ? (
              <ol>
                {snapshot.failedAssets.map((asset) => (
                  <li key={asset.id}>
                    <span>{asset.name ?? asset.id}</span>
                    <small>
                      {asset.category} · {asset.variant ?? 'raw'} · {asset.selectedSizeLabel ?? asset.fileSizeLabel ?? 'size ?'} · {asset.error ?? '未知错误'}
                    </small>
                    <code>{asset.modelUrl ?? asset.assetUrl}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p>暂无失败 GLB</p>
            )}
          </section>

          <div className="map-3d-guide-perf-panel__actions">
            <button type="button" onClick={copySnapshot}>
              复制诊断 JSON
            </button>
            <button type="button" onClick={clearSnapshot}>
              清空当前记录
            </button>
          </div>
          {copyStatus ? <small>{copyStatus}</small> : null}
          {manualCopyText ? (
            <textarea
              className="map-3d-guide-perf-panel__manual-copy"
              readOnly
              value={manualCopyText}
              aria-label="诊断 JSON 手动复制内容"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the textarea fallback below.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

function formatMs(value?: number) {
  return value === undefined ? 'pending' : `${value} ms`
}
