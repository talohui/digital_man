import { useEffect, useMemo, useRef, useState } from 'react'

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

type UseGardenAssetOverlaysOptions = {
  active: boolean
  assets: LingshanMap3DGardenAsset[]
  debugPerf?: boolean
  debugGarden: boolean
  map: any
  mapReady: boolean
  perfRecorder?: Map3DPerfRecorder
  rerouteActive: boolean
  routeProgressRatio: number
}

const GARDEN_ASSET_BATCH_SIZE = 16

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
  map,
  mapReady,
  perfRecorder,
  rerouteActive,
  routeProgressRatio
}: UseGardenAssetOverlaysOptions) {
  const modelsRef = useRef<Map<string, any>>(new Map())
  const [report, setReport] = useState<GardenModelReport>(emptyGardenModelReport)

  const visibleAssets = useMemo(
    () =>
      active
        ? getVisibleGardenAssets(assets, {
            debugGarden,
            routeProgressRatio,
            rerouteActive
          })
        : [],
    [active, assets, debugGarden, rerouteActive, routeProgressRatio]
  )

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | null = null
    let frameId: number | null = null

    clearGardenModels(modelsRef.current)
    modelsRef.current = new Map()

    if (!active) {
      setReport(emptyGardenModelReport)
      return undefined
    }

    const assetUrls = Array.from(new Set(visibleAssets.map((asset) => asset.assetUrl)))

    if (!mapReady || !window.TMap || !map) {
      setReport((current) => ({
        ...current,
        createdCount: 0,
        visibleCount: visibleAssets.length,
        unavailable: false,
        assetUrls,
        loadedIds: [],
        errorIds: []
      }))
      return undefined
    }

    if (!window.TMap.model?.GLTFModel) {
      setReport((current) => ({
        ...current,
        createdCount: 0,
        visibleCount: visibleAssets.length,
        unavailable: true,
        assetUrls,
        loadedIds: [],
        errorIds: []
      }))
      return undefined
    }

    const orderedAssets = orderGardenAssetsForLoading(visibleAssets)
    const immediateErrors: string[] = []
    let cursor = 0
    let batchIndex = 0

    setReport((current) => ({
      ...current,
      createdCount: 0,
      visibleCount: orderedAssets.length,
      unavailable: false,
      assetUrls,
      loadedIds: [],
      errorIds: []
    }))
    perfRecorder?.setGardenTotal(debugPerf ? orderedAssets.length : 0)

    // GLTFModel construction is relatively heavy. Build in small batches so the
    // map, route, POI, and control UI can paint before all garden models exist.
    const createNextBatch = () => {
      if (cancelled) {
        return
      }

      const batch = orderedAssets.slice(cursor, cursor + GARDEN_ASSET_BATCH_SIZE)
      const currentBatchIndex = batchIndex
      batchIndex += 1
      cursor += batch.length
      perfRecorder?.startGardenBatch(currentBatchIndex, batch.length)

      batch.forEach((asset) => {
        perfRecorder?.startGardenAsset({
          id: asset.id,
          assetUrl: asset.assetUrl,
          priority: asset.priority,
          batchIndex: currentBatchIndex
        })
        try {
          // Tencent GLTFModel does not expose a stable browser network timing
          // API here, so debugPerf records overlay construction time. The
          // existing loaded/error events are still surfaced in the model report.
          const model = new window.TMap.model.GLTFModel({
            id: `map-3d-guide-garden-${asset.id}`,
            map,
            url: asset.assetUrl,
            position: new window.TMap.LatLng(asset.location.lat, asset.location.lng, asset.height),
            rotation: [0, asset.yaw, 0],
            scale: asset.scale,
            opacity: asset.opacity
          })
          if (typeof model.setOpacity === 'function') {
            model.setOpacity(asset.opacity)
          }
          modelsRef.current.set(asset.id, model)
          perfRecorder?.finishGardenAsset(asset.id)

          if (typeof model.on === 'function') {
            model.on('loaded', () => {
              if (!cancelled) {
                setReport((current) => ({
                  ...current,
                  loadedIds: uniqueStrings([...current.loadedIds, asset.id])
                }))
              }
            })
            model.on('error', () => {
              if (!cancelled) {
                perfRecorder?.failGardenAsset(asset.id, 'GLTFModel error event')
                setReport((current) => ({
                  ...current,
                  errorIds: uniqueStrings([...current.errorIds, asset.id])
                }))
              }
            })
          }
        } catch (error) {
          immediateErrors.push(asset.id)
          perfRecorder?.failGardenAsset(asset.id, error)
        }
      })
      perfRecorder?.finishGardenBatch(currentBatchIndex)

      setReport((current) => ({
        ...current,
        createdCount: modelsRef.current.size,
        errorIds: uniqueStrings([...current.errorIds, ...immediateErrors])
      }))

      if (cursor < orderedAssets.length) {
        frameId = window.requestAnimationFrame(() => {
          timeoutId = window.setTimeout(createNextBatch, 24)
        })
      }
    }

    frameId = window.requestAnimationFrame(createNextBatch)

    return () => {
      cancelled = true
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      clearGardenModels(modelsRef.current)
      modelsRef.current = new Map()
    }
  }, [active, debugPerf, map, mapReady, perfRecorder, visibleAssets])

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

function clearGardenModels(models: Map<string, any>) {
  models.forEach((model) => {
    if (typeof model.setMap === 'function') {
      model.setMap(null)
      return
    }

    if (typeof model.destroy === 'function') {
      model.destroy()
      return
    }

    if (typeof model.remove === 'function') {
      model.remove()
    }
  })
  models.clear()
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
        scale: Math.round(asset.scale * scaleBoost)
      }
    })
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}
