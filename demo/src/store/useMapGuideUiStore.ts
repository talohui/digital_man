import { create } from 'zustand'

export type PoiVisibilityMode = 'core' | 'all'
export type MapFocusMode = 'overview' | 'current'
export type XiaolingSheetMode = 'browse' | 'route' | 'poi' | null

/**
 * Ephemeral map UI state. It deliberately contains no map, renderer, camera,
 * GLB, or Fay objects, so changing 2D/3D presentation does not recreate UI
 * selections or couple the store to a map implementation.
 */
export type MapGuideUiState = {
  selectedPoiId?: string
  browseCardExpanded: boolean
  routeCardExpanded: boolean
  xiaolingSheetMode: XiaolingSheetMode
  layerPanelOpen: boolean
  servicePanelOpen: boolean
  poiVisibilityMode: PoiVisibilityMode
  serviceFacilitiesEnabled: boolean
  mapFocusMode: MapFocusMode
}

export type MapGuideUiActions = {
  setSelectedPoiId: (selectedPoiId?: string) => void
  setBrowseCardExpanded: (browseCardExpanded: boolean) => void
  setRouteCardExpanded: (routeCardExpanded: boolean) => void
  setXiaolingSheetMode: (xiaolingSheetMode: XiaolingSheetMode) => void
  setLayerPanelOpen: (layerPanelOpen: boolean) => void
  setServicePanelOpen: (servicePanelOpen: boolean) => void
  setPoiVisibilityMode: (poiVisibilityMode: PoiVisibilityMode) => void
  setServiceFacilitiesEnabled: (serviceFacilitiesEnabled: boolean) => void
  setMapFocusMode: (mapFocusMode: MapFocusMode) => void
  patchMapGuideUi: (state: Partial<MapGuideUiState>) => void
  resetMapGuideUi: () => void
}

export type MapGuideUiStore = MapGuideUiState & MapGuideUiActions

export const initialMapGuideUiState: MapGuideUiState = {
  selectedPoiId: undefined,
  browseCardExpanded: false,
  routeCardExpanded: false,
  xiaolingSheetMode: null,
  layerPanelOpen: false,
  servicePanelOpen: false,
  poiVisibilityMode: 'core',
  serviceFacilitiesEnabled: false,
  mapFocusMode: 'current'
}

export const useMapGuideUiStore = create<MapGuideUiStore>()((set) => ({
  ...initialMapGuideUiState,
  setSelectedPoiId: (selectedPoiId) => set({ selectedPoiId }),
  setBrowseCardExpanded: (browseCardExpanded) => set({ browseCardExpanded }),
  setRouteCardExpanded: (routeCardExpanded) => set({ routeCardExpanded }),
  setXiaolingSheetMode: (xiaolingSheetMode) => set({ xiaolingSheetMode }),
  setLayerPanelOpen: (layerPanelOpen) => set({ layerPanelOpen }),
  setServicePanelOpen: (servicePanelOpen) => set({ servicePanelOpen }),
  setPoiVisibilityMode: (poiVisibilityMode) => set({ poiVisibilityMode }),
  setServiceFacilitiesEnabled: (serviceFacilitiesEnabled) => set({ serviceFacilitiesEnabled }),
  setMapFocusMode: (mapFocusMode) => set({ mapFocusMode }),
  patchMapGuideUi: (state) => set(state),
  resetMapGuideUi: () => set(initialMapGuideUiState)
}))
