import type { LingshanMap3DGardenAsset } from '../data/lingshanMap3DGardenAssets'
import type { LayerManager } from '../lib/map/LayerManager'
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
  layerManager?: LayerManager
  map: any
  mapReady: boolean
  perfRecorder?: Map3DPerfRecorder
  rerouteActive: boolean
  routeProgressRatio: number
  shouldLoadGardenAssets?: boolean
}

const removedGardenModelReport: GardenModelReport = {
  createdCount: 0,
  visibleCount: 0,
  patchCount: 0,
  patchFallback: false,
  unavailable: false,
  assetUrls: [],
  loadedIds: [],
  errorIds: []
}

export function useGardenAssetOverlays(_options: UseGardenAssetOverlaysOptions) {
  // Tree GLB system removed due to memory pressure.
  return {
    report: removedGardenModelReport,
    loading: false,
    progressText: 'treeGlbMode=removed'
  }
}
