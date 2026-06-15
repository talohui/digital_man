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
          <dd>{formatMs(snapshot.routeDrawMs)}</dd>
        </div>
        <div>
          <dt>POI</dt>
          <dd>{formatMs(snapshot.poiInitMs)}</dd>
        </div>
        <div>
          <dt>Garden GLB</dt>
          <dd>
            {snapshot.gardenLoaded}/{snapshot.gardenTotal}
            {snapshot.gardenOverlayLiveCount ? ` · live ${snapshot.gardenOverlayLiveCount}` : ''}
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
          <dt>Garden LOD</dt>
          <dd>
            {snapshot.gardenLodTier} · {Math.round(snapshot.gardenOpacity * 100)}%
          </dd>
        </div>
        <div>
          <dt>Tour</dt>
          <dd>{snapshot.latestTourEvent?.type ?? '-'}</dd>
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
                  </small>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3>园林 Overlay</h3>
            <ol>
              <li>
                <span>Live garden overlays</span>
                <small>
                  live {snapshot.gardenOverlayLiveCount} · created {snapshot.gardenOverlayCreated} · removed {snapshot.gardenOverlayRemoved} · duplicate prevented {snapshot.gardenOverlayDuplicatePrevented} · generation {snapshot.gardenLoadGeneration}
                  {' · '}
                  LOD {snapshot.gardenLodTier} · opacity {Math.round(snapshot.gardenOpacity * 100)}%
                  {snapshot.mapInteracting ? ` · interacting ${snapshot.mapInteractionKind ?? 'move'}` : ''}
                  {snapshot.currentZoom !== undefined ? ` · zoom ${snapshot.currentZoom.toFixed(2)}` : ''}
                </small>
              </li>
            </ol>
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
