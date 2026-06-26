import { useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'

import type { LingshanMap3DGardenAsset } from '../data/lingshanMap3DGardenAssets'
import type { Map3DPerfRecorder } from '../lib/map3dPerf'

export type GardenModelReport = {
  createdCount: number
  visibleCount: number
  patchCount: number
  patchFallback: boolean
  unavailable: boolean
  assetUrls: string[]
  loadedIds: string[]
  errorIds: string[]
}

export type GardenLodState = {
  opacity: number
  visibleTier: 'none' | 'reduced' | 'full'
  isInteracting: boolean
  currentZoom?: number
}

type UseGardenAssetOverlaysOptions = {
  active: boolean
  assets: LingshanMap3DGardenAsset[]
  debugPerf?: boolean
  debugGarden: boolean
  gardenLodState?: GardenLodState
  map: any
  mapReady: boolean
  perfRecorder?: Map3DPerfRecorder
  rerouteActive: boolean
  routeProgressRatio: number
  shouldLoadGardenAssets?: boolean
}

type GardenOverlayHandle = {
  asset: LingshanMap3DGardenAsset
  generation: number
  model: any
}

const GARDEN_ASSET_BATCH_SIZE = 32

const defaultGardenLodState: GardenLodState = {
  opacity: 1,
  visibleTier: 'full',
  isInteracting: false
}

const emptyGardenModelReport: GardenModelReport = {
  createdCount: 0,
  visibleCount: 0,
  patchCount: 0,
  patchFallback: false,
  unavailable: false,
  assetUrls: [],
  loadedIds: [],
  errorIds: []
}

export function useGardenAssetOverlays({
  active,
  assets,
  debugPerf = false,
  debugGarden,
  gardenLodState = defaultGardenLodState,
  map,
  mapReady,
  perfRecorder,
  rerouteActive,
  routeProgressRatio,
  shouldLoadGardenAssets = mapReady
}: UseGardenAssetOverlaysOptions) {
  const overlayByIdRef = useRef<Map<string, GardenOverlayHandle>>(new Map())
  const activeLoadGenerationRef = useRef(0)
  const pendingTimersRef = useRef<number[]>([])
  const pendingAnimationFramesRef = useRef<number[]>([])
  const gardenTotalSignatureRef = useRef('')
  const gardenLodSignatureRef = useRef('')
  const gardenLodStateRef = useRef<GardenLodState>(gardenLodState)
  const perfRecorderRef = useRef<Map3DPerfRecorder | undefined>(perfRecorder)
  const [report, setReport] = useState<GardenModelReport>(emptyGardenModelReport)

  useEffect(() => {
    perfRecorderRef.current = perfRecorder
  }, [perfRecorder])

  useEffect(() => {
    gardenLodStateRef.current = gardenLodState
  }, [gardenLodState])

  const visibleAssets = useMemo(
    () =>
      active
        ? assets
            .filter((asset) => asset.visible)
            .map((asset) => (debugGarden ? { ...asset, opacity: Math.max(asset.opacity, 0.92) } : asset))
        : [],
    [active, assets, debugGarden]
  )

  useEffect(() => {
    return () => {
      activeLoadGenerationRef.current += 1
      cancelPendingGardenLoadTasks(pendingTimersRef, pendingAnimationFramesRef)
      clearGardenModels(overlayByIdRef.current, perfRecorderRef.current, activeLoadGenerationRef.current)
    }
  }, [])

  useEffect(() => {
    const generation = activeLoadGenerationRef.current + 1
    activeLoadGenerationRef.current = generation
    cancelPendingGardenLoadTasks(pendingTimersRef, pendingAnimationFramesRef)

    if (!active) {
      clearGardenModels(overlayByIdRef.current, perfRecorder, generation)
      gardenTotalSignatureRef.current = ''
      perfRecorder?.setGardenTotal(0)
      setReport(emptyGardenModelReport)
      return
    }

    const assetUrls = Array.from(new Set(visibleAssets.map((asset) => asset.assetUrl)))

    if (!mapReady || !shouldLoadGardenAssets || !window.TMap || !map) {
      clearGardenModels(overlayByIdRef.current, perfRecorder, generation)
      setReport((current) => ({
        ...current,
        createdCount: 0,
        visibleCount: shouldLoadGardenAssets ? visibleAssets.length : 0,
        unavailable: false,
        assetUrls,
        loadedIds: [],
        errorIds: []
      }))
      return
    }

    if (!window.TMap.model?.GLTFModel) {
      clearGardenModels(overlayByIdRef.current, perfRecorder, generation)
      setReport((current) => ({
        ...current,
        createdCount: 0,
        visibleCount: visibleAssets.length,
        unavailable: true,
        assetUrls,
        loadedIds: [],
        errorIds: []
      }))
      return
    }

    const orderedAssets = orderGardenAssetsForLoading(visibleAssets)
    const orderedAssetById = new Map(orderedAssets.map((asset) => [asset.id, asset]))
    const totalSignature = debugPerf ? orderedAssets.map((asset) => asset.id).join('|') : ''
    let cursor = 0
    let batchIndex = 0

    overlayByIdRef.current.forEach((handle, id) => {
      const nextAsset = orderedAssetById.get(id)

      if (!nextAsset || shouldRecreateGardenOverlay(handle.asset, nextAsset)) {
        removeGardenModel(id, overlayByIdRef.current, perfRecorder, generation)
      }
    })

    orderedAssets.forEach((asset) => {
      const existing = overlayByIdRef.current.get(asset.id)

      if (existing) {
        updateGardenModel(existing.model, applyGardenLodToAsset(asset, gardenLodStateRef.current))
        existing.asset = asset
      }
    })

    setReport((current) => ({
      ...current,
      createdCount: overlayByIdRef.current.size,
      visibleCount: orderedAssets.length,
      unavailable: false,
      assetUrls,
      loadedIds: current.loadedIds.filter((id) => orderedAssetById.has(id)),
      errorIds: current.errorIds.filter((id) => orderedAssetById.has(id))
    }))

    if (gardenTotalSignatureRef.current !== totalSignature) {
      gardenTotalSignatureRef.current = totalSignature
      perfRecorder?.setGardenTotal(debugPerf ? orderedAssets.length : 0)
    }

    const assetsToCreate = orderedAssets.filter((asset) => !overlayByIdRef.current.has(asset.id))

    if (!assetsToCreate.length) {
      perfRecorder?.recordGardenOverlayEvent({
        liveCount: overlayByIdRef.current.size,
        generation
      })
      return
    }

    // GLTFModel construction is relatively heavy. Build in small batches so the
    // map, route, POI, and control UI can paint before all garden models exist.
    const createNextBatch = () => {
      if (!isGardenLoadGenerationActive(activeLoadGenerationRef, generation)) {
        return
      }

      const batch = assetsToCreate.slice(cursor, cursor + GARDEN_ASSET_BATCH_SIZE)
      const currentBatchIndex = batchIndex
      const batchTier = getGardenBatchTier(batch)
      batchIndex += 1
      cursor += batch.length
      perfRecorder?.startGardenBatch(currentBatchIndex, batch.length)

      batch.forEach((asset) => {
        createGardenModel({
          asset,
          batchIndex: currentBatchIndex,
          generation,
          map,
          overlayByIdRef,
          perfRecorder,
          activeLoadGenerationRef,
          gardenLodStateRef,
          setReport
        })
      })
      perfRecorder?.finishGardenBatch(currentBatchIndex)
      perfRecorder?.recordMapVisualEvent({
        type: 'gardenLoadBatch',
        gardenLoadedCount: overlayByIdRef.current.size,
        gardenLoadBatchIndex: currentBatchIndex,
        gardenTierLoaded: batchTier,
        liveGardenOverlayCount: overlayByIdRef.current.size,
        gardenLiveCountWarning: overlayByIdRef.current.size > orderedAssets.length,
        reason: `batch-size-${batch.length}`
      })

      setReport((current) => ({
        ...current,
        createdCount: overlayByIdRef.current.size
      }))

      if (cursor < assetsToCreate.length) {
        scheduleGardenBatch(createNextBatch, pendingTimersRef, pendingAnimationFramesRef)
      }
    }

    scheduleGardenBatch(createNextBatch, pendingTimersRef, pendingAnimationFramesRef)
  }, [active, debugPerf, map, mapReady, perfRecorder, shouldLoadGardenAssets, visibleAssets])

  useEffect(() => {
    if (!active || !shouldLoadGardenAssets || !overlayByIdRef.current.size) {
      return
    }

    getVisibleGardenAssets(assets, {
      debugGarden,
      routeProgressRatio,
      rerouteActive
    }).forEach((asset) => {
      const existing = overlayByIdRef.current.get(asset.id)

      if (existing) {
        updateGardenModel(existing.model, applyGardenLodToAsset(asset, gardenLodStateRef.current))
      }
    })
  }, [active, assets, debugGarden, rerouteActive, routeProgressRatio, shouldLoadGardenAssets])

  useEffect(() => {
    // 交互中 tier 固定为 'reduced'、透明度恒定,与具体 zoom 无关;
    // 此时把 currentZoom 排除出签名,避免每个缩放微步都重刷数百个模型的透明度
    // (把"逐帧 N 次 setOpacity"压成"整段交互 1 次")。非交互态仍按最终 zoom 精确生效。
    const signature = gardenLodState.isInteracting
      ? `interacting:${gardenLodState.visibleTier}:${gardenLodState.opacity}`
      : `${gardenLodState.visibleTier}:${gardenLodState.opacity}:${gardenLodState.currentZoom ?? 'unknown'}`

    if (gardenLodSignatureRef.current === signature) {
      return
    }

    gardenLodSignatureRef.current = signature
    gardenLodStateRef.current = gardenLodState

    overlayByIdRef.current.forEach((handle) => {
      updateGardenModel(handle.model, applyGardenLodToAsset(handle.asset, gardenLodState))
    })

    perfRecorder?.recordMapVisualEvent({
      type: gardenLodState.isInteracting ? 'gardenInteractionLiteMode' : 'gardenOpacityUpdated',
      currentZoom: gardenLodState.currentZoom,
      gardenLodTier: gardenLodState.visibleTier,
      gardenOpacity: gardenLodState.opacity,
      liveGardenOverlayCount: overlayByIdRef.current.size,
      reason: gardenLodState.isInteracting ? 'interaction-lite' : 'zoom-lod'
    })
  }, [gardenLodState, perfRecorder])

  return {
    report,
    loading: report.visibleCount > 0 && report.createdCount < report.visibleCount,
    progressText: report.visibleCount > 0 ? `园林资产加载中 ${report.createdCount} / ${report.visibleCount}` : ''
  }
}

function orderGardenAssetsForLoading(assets: LingshanMap3DGardenAsset[]) {
  const priorityWeight: Record<LingshanMap3DGardenAsset['priority'], number> = {
    high: 0,
    medium: 1,
    low: 2
  }

  return assets
    .map((asset, index) => ({ asset, index }))
    .sort((a, b) => priorityWeight[a.asset.priority] - priorityWeight[b.asset.priority] || a.index - b.index)
    .map((item) => item.asset)
}

function getGardenBatchTier(assets: LingshanMap3DGardenAsset[]) {
  const priorities = new Set(assets.map((asset) => asset.priority))

  if (priorities.size === 1) {
    return assets[0]?.priority ?? 'mixed'
  }

  return 'mixed'
}

function scheduleGardenBatch(
  callback: () => void,
  pendingTimersRef: MutableRefObject<number[]>,
  pendingAnimationFramesRef: MutableRefObject<number[]>
) {
  const frameId = window.requestAnimationFrame(() => {
    pendingAnimationFramesRef.current = pendingAnimationFramesRef.current.filter((id) => id !== frameId)
    const timeoutId = window.setTimeout(() => {
      pendingTimersRef.current = pendingTimersRef.current.filter((id) => id !== timeoutId)
      callback()
    }, 24)
    pendingTimersRef.current = [...pendingTimersRef.current, timeoutId]
  })
  pendingAnimationFramesRef.current = [...pendingAnimationFramesRef.current, frameId]
}

function cancelPendingGardenLoadTasks(
  pendingTimersRef: MutableRefObject<number[]>,
  pendingAnimationFramesRef: MutableRefObject<number[]>
) {
  pendingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
  pendingAnimationFramesRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId))
  pendingTimersRef.current = []
  pendingAnimationFramesRef.current = []
}

function isGardenLoadGenerationActive(activeLoadGenerationRef: MutableRefObject<number>, generation: number) {
  return activeLoadGenerationRef.current === generation
}

function createGardenModel({
  asset,
  batchIndex,
  generation,
  map,
  overlayByIdRef,
  perfRecorder,
  activeLoadGenerationRef,
  gardenLodStateRef,
  setReport
}: {
  asset: LingshanMap3DGardenAsset
  batchIndex: number
  generation: number
  map: any
  overlayByIdRef: MutableRefObject<Map<string, GardenOverlayHandle>>
  perfRecorder?: Map3DPerfRecorder
  activeLoadGenerationRef: MutableRefObject<number>
  gardenLodStateRef: MutableRefObject<GardenLodState>
  setReport: Dispatch<SetStateAction<GardenModelReport>>
}) {
  if (!isGardenLoadGenerationActive(activeLoadGenerationRef, generation)) {
    return
  }

  const existing = overlayByIdRef.current.get(asset.id)

  if (existing) {
    updateGardenModel(existing.model, applyGardenLodToAsset(asset, gardenLodStateRef.current))
    existing.asset = asset
    perfRecorder?.recordGardenOverlayEvent({
      duplicatePrevented: 1,
      liveCount: overlayByIdRef.current.size,
      generation
    })
    return
  }

  perfRecorder?.startGardenAsset({
    id: asset.id,
    assetUrl: asset.assetUrl,
    priority: asset.priority,
    batchIndex
  })

  try {
    // Tencent GLTFModel does not expose a stable browser network timing API
    // here, so debugPerf records overlay construction time.
    const model = new window.TMap.model.GLTFModel({
      id: `map-3d-guide-garden-${asset.id}`,
      map,
      url: asset.assetUrl,
      position: new window.TMap.LatLng(asset.location.lat, asset.location.lng, asset.height),
      rotation: [0, asset.yaw, 0],
      scale: asset.scale,
      opacity: applyGardenLodToAsset(asset, gardenLodStateRef.current).opacity
    })
    updateGardenModel(model, applyGardenLodToAsset(asset, gardenLodStateRef.current))

    if (!isGardenLoadGenerationActive(activeLoadGenerationRef, generation)) {
      teardownGardenModel(model)
      return
    }

    overlayByIdRef.current.set(asset.id, {
      asset,
      generation,
      model
    })
    perfRecorder?.finishGardenAsset(asset.id)
    perfRecorder?.recordGardenOverlayEvent({
      created: 1,
      liveCount: overlayByIdRef.current.size,
      generation
    })

    if (typeof model.on === 'function') {
      model.on('loaded', () => {
        if (isGardenModelHandleActive(overlayByIdRef.current, asset.id, model, activeLoadGenerationRef, generation)) {
          setReport((current) => ({
            ...current,
            loadedIds: uniqueStrings([...current.loadedIds, asset.id])
          }))
        }
      })
      model.on('error', () => {
        if (isGardenModelHandleActive(overlayByIdRef.current, asset.id, model, activeLoadGenerationRef, generation)) {
          perfRecorder?.failGardenAsset(asset.id, 'GLTFModel error event')
          setReport((current) => ({
            ...current,
            errorIds: uniqueStrings([...current.errorIds, asset.id])
          }))
        }
      })
    }
  } catch (error) {
    perfRecorder?.failGardenAsset(asset.id, error)
    setReport((current) => ({
      ...current,
      errorIds: uniqueStrings([...current.errorIds, asset.id])
    }))
  }
}

function isGardenModelHandleActive(
  handles: Map<string, GardenOverlayHandle>,
  assetId: string,
  model: any,
  activeLoadGenerationRef: MutableRefObject<number>,
  generation: number
) {
  const handle = handles.get(assetId)
  return isGardenLoadGenerationActive(activeLoadGenerationRef, generation) && handle?.model === model
}

function shouldRecreateGardenOverlay(current: LingshanMap3DGardenAsset, next: LingshanMap3DGardenAsset) {
  return (
    current.assetUrl !== next.assetUrl ||
    current.location.lat !== next.location.lat ||
    current.location.lng !== next.location.lng ||
    current.height !== next.height ||
    current.yaw !== next.yaw ||
    current.scale !== next.scale
  )
}

function updateGardenModel(model: any, asset: LingshanMap3DGardenAsset) {
  if (typeof model.setOpacity === 'function') {
    model.setOpacity(asset.opacity)
  }
}

function applyGardenLodToAsset(asset: LingshanMap3DGardenAsset, lodState: GardenLodState) {
  const tierOpacity =
    lodState.visibleTier === 'none'
      ? 0.04
      : lodState.visibleTier === 'reduced'
        ? asset.priority === 'low'
          ? 0.08
          : asset.priority === 'medium'
            ? 0.38
            : 0.72
        : 1

  return {
    ...asset,
    opacity: Number(Math.max(0, Math.min(1, asset.opacity * lodState.opacity * tierOpacity)).toFixed(3))
  }
}

function removeGardenModel(
  id: string,
  models: Map<string, GardenOverlayHandle>,
  perfRecorder: Map3DPerfRecorder | undefined,
  generation: number
) {
  const handle = models.get(id)

  if (!handle) {
    return
  }

  teardownGardenModel(handle.model)
  models.delete(id)
  perfRecorder?.recordGardenOverlayEvent({
    removed: 1,
    liveCount: models.size,
    generation
  })
}

function clearGardenModels(
  models: Map<string, GardenOverlayHandle>,
  perfRecorder?: Map3DPerfRecorder,
  generation = 0
) {
  const removed = models.size
  models.forEach((handle) => teardownGardenModel(handle.model))
  models.clear()

  if (removed > 0) {
    perfRecorder?.recordGardenOverlayEvent({
      removed,
      liveCount: 0,
      generation
    })
  } else {
    perfRecorder?.recordGardenOverlayEvent({
      liveCount: 0,
      generation
    })
  }
}

function teardownGardenModel(model: any) {
  if (typeof model.setMap === 'function') {
    model.setMap(null)
  }

  if (typeof model.destroy === 'function') {
    model.destroy()
  }

  if (typeof model.remove === 'function') {
    model.remove()
  }
}

function getVisibleGardenAssets(
  assets: LingshanMap3DGardenAsset[],
  options: {
    debugGarden: boolean
    routeProgressRatio: number
    rerouteActive: boolean
  }
) {
  const progress = Math.max(0, Math.min(1, options.routeProgressRatio))

  return assets
    .filter((asset) => asset.visible)
    .map((asset) => {
      if (options.debugGarden) {
        return { ...asset, opacity: Math.max(asset.opacity, 0.92) }
      }

      const distanceFromProgress = asset.routeFraction - progress
      const isCurrentBand = Math.abs(distanceFromProgress) <= 0.12
      const isPassed = distanceFromProgress < -0.12
      const isAhead = distanceFromProgress > 0.12
      const priorityOpacityBoost = asset.priority === 'high' ? 0.08 : asset.priority === 'medium' ? 0.04 : 0
      const rerouteDimming = options.rerouteActive && asset.priority === 'low' ? 0.76 : 1
      const bandOpacity = isCurrentBand ? 0.94 : isPassed ? 0.72 : isAhead ? 0.46 : 0.62
      const opacity = Number(Math.max(0.34, Math.min(1, (bandOpacity + priorityOpacityBoost) * rerouteDimming * asset.opacity)).toFixed(3))
      const scaleBoost = isCurrentBand ? 1.12 : isPassed ? 1.02 : isAhead ? 0.94 : 1

      return {
        ...asset,
        opacity,
        scale: Number((asset.scale * scaleBoost).toFixed(2))
      }
    })
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}
