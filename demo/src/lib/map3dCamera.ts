import type { LatLngPoint } from '../data/guideData'

export type Map3DCameraPresetId =
  | 'overviewEstate'
  | 'axisCruise'
  | 'landmarkFocus'
  | 'closeInspect'
  | 'routeOverview'
  | 'guideFollow'

export type Map3DCameraPreset = {
  id: Map3DCameraPresetId
  label: string
  description: string
  zoom: number
  pitch: number
  rotation: number
  durationMs: number
}

export type Map3DCameraEvent = {
  cameraPreset: Map3DCameraPresetId
  targetPoiId?: string
  targetLandmarkId?: string
  durationMs: number
  startedAt: string
  finishedAt: string
}

export const MAP_3D_GUIDE_CAMERA_PRESETS: Record<Map3DCameraPresetId, Map3DCameraPreset> = {
  overviewEstate: {
    id: 'overviewEstate',
    label: '总览',
    description: '酒庄航拍式斜俯总览',
    zoom: 16.85,
    pitch: 58,
    rotation: -34,
    durationMs: 1600
  },
  axisCruise: {
    id: 'axisCruise',
    label: '主轴漫游',
    description: '沿中轴线慢推游览',
    zoom: 17.85,
    pitch: 66,
    rotation: -24,
    durationMs: 1450
  },
  routeOverview: {
    id: 'routeOverview',
    label: '路线总览',
    description: '回看完整金色游线',
    zoom: 17.18,
    pitch: 56,
    rotation: -30,
    durationMs: 1350
  },
  landmarkFocus: {
    id: 'landmarkFocus',
    label: '地标聚焦',
    description: '无人机慢推靠近地标',
    zoom: 18.75,
    pitch: 66,
    rotation: -20,
    durationMs: 1200
  },
  closeInspect: {
    id: 'closeInspect',
    label: '调试近看',
    description: '近距离检查 GLB 地标',
    zoom: 19.35,
    pitch: 68,
    rotation: -18,
    durationMs: 900
  },
  guideFollow: {
    id: 'guideFollow',
    label: '导览跟随',
    description: '跟随当前位置缓慢移动',
    zoom: 18.25,
    pitch: 64,
    rotation: -26,
    durationMs: 900
  }
}

export type FlyMap3DCameraOptions = {
  map: any
  TMap: any
  target: LatLngPoint
  preset: Map3DCameraPreset
  sequenceRef: { current: number }
  targetPoiId?: string
  targetLandmarkId?: string
  twoStage?: boolean
  onComplete?: (event: Map3DCameraEvent) => void
}

export function flyMap3DCamera({
  map,
  TMap,
  target,
  preset,
  sequenceRef,
  targetPoiId,
  targetLandmarkId,
  twoStage = false,
  onComplete
}: FlyMap3DCameraOptions) {
  if (!map || !TMap) {
    return
  }

  const sequence = sequenceRef.current + 1
  sequenceRef.current = sequence
  const startedAtTime = Date.now()
  const startedAt = new Date(startedAtTime).toISOString()

  const finish = () => {
    if (sequenceRef.current !== sequence) {
      return
    }
    const finishedAtTime = Date.now()
    onComplete?.({
      cameraPreset: preset.id,
      targetPoiId,
      targetLandmarkId,
      durationMs: Math.max(0, finishedAtTime - startedAtTime),
      startedAt,
      finishedAt: new Date(finishedAtTime).toISOString()
    })
  }

  if (twoStage) {
    const pullbackPreset = {
      ...preset,
      zoom: Math.max(15.8, preset.zoom - 0.62),
      pitch: Math.max(52, preset.pitch - 4),
      durationMs: 560
    }
    applyCameraStep(map, TMap, target, pullbackPreset)
    window.setTimeout(() => {
      if (sequenceRef.current !== sequence) {
        return
      }
      applyCameraStep(map, TMap, target, preset)
      window.setTimeout(finish, preset.durationMs + 80)
    }, pullbackPreset.durationMs + 80)
    return
  }

  applyCameraStep(map, TMap, target, preset)
  window.setTimeout(finish, preset.durationMs + 80)
}

function applyCameraStep(map: any, TMap: any, target: LatLngPoint, preset: Map3DCameraPreset) {
  const center = new TMap.LatLng(target.lat, target.lng)

  if (typeof map.easeTo === 'function') {
    map.easeTo(
      {
        center,
        zoom: preset.zoom,
        pitch: preset.pitch,
        rotation: preset.rotation
      },
      { duration: preset.durationMs }
    )
    return
  }

  map.setCenter?.(center)
  if (typeof map.setZoom === 'function') {
    map.setZoom(preset.zoom)
  }
  map.setPitch?.(preset.pitch)
  map.setRotation?.(preset.rotation)
}
