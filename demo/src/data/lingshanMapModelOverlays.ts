// Tencent Maps Web GLTFModel overlay configuration for Lingshan landmarks.
// This file only describes model overlays and does not change real POI coordinates.
// Model status is separate from POI data status. `missing_model` means the GLB asset is pending.
// These overlays are currently used only by /map?debugGltfModel=1 and are not loaded for normal visitors.

export type MapModelOverlayStatus =
  | 'debug_ready'
  | 'model_ready'
  | 'placeholder'
  | 'missing_model'

export type MapModelPositionSource =
  | 'navLocation'
  | 'displayLocation'

export type LingshanMapModelOverlay = {
  poiId: string
  name: string
  modelUrl?: string
  positionSource: MapModelPositionSource
  height: number
  scale: number
  rotation: [number, number, number]
  status: MapModelOverlayStatus
  enabledInDebug: boolean
  note?: string
}

export const lingshanMapModelOverlays: LingshanMapModelOverlay[] = [
  {
    poiId: 'giant_buddha',
    name: '灵山大佛',
    modelUrl: '/models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb',
    positionSource: 'navLocation',
    height: 50,
    scale: 1000,
    rotation: [0, 0, 0],
    status: 'debug_ready',
    enabledInDebug: true,
    note: '当前用于腾讯地图 Web GLTFModel 调试的低模 blockout。'
  },
  {
    poiId: 'fan_gong',
    name: '梵宫',
    positionSource: 'navLocation',
    height: 0,
    scale: 1,
    rotation: [0, 0, 0],
    status: 'missing_model',
    enabledInDebug: true,
    note: '等待 MeshyAI / GLB 模型接入。'
  },
  {
    poiId: 'jiulong_guanyu',
    name: '九龙灌浴',
    positionSource: 'navLocation',
    height: 0,
    scale: 1,
    rotation: [0, 0, 0],
    status: 'missing_model',
    enabledInDebug: true,
    note: '等待 MeshyAI / GLB 模型接入。'
  },
  {
    poiId: 'wuyin_tancheng',
    name: '五印坛城',
    positionSource: 'navLocation',
    height: 0,
    scale: 1,
    rotation: [0, 0, 0],
    status: 'missing_model',
    enabledInDebug: true,
    note: '等待 MeshyAI / GLB 模型接入。'
  }
]

export function getMapModelOverlayByPoiId(poiId: string) {
  return lingshanMapModelOverlays.find((overlay) => overlay.poiId === poiId)
}

export function getDebugMapModelOverlays() {
  return lingshanMapModelOverlays.filter((overlay) => overlay.enabledInDebug)
}
