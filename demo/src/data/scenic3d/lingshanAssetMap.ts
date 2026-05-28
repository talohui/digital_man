export type LingshanAssetStatus =
  | 'placeholder'
  | 'model_ready'
  | 'disabled'

export type LingshanAssetBinding = {
  poiId: string
  modelUrl?: string
  thumbnailUrl?: string
  status: LingshanAssetStatus
  transform: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
  lod?: {
    low?: string
    medium?: string
    high?: string
  }
  note?: string
}

export const lingshanAssetMap: LingshanAssetBinding[] = [
  {
    poiId: 'giant_buddha',
    status: 'placeholder',
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    note: '灵山大佛 core_3d 占位，后续替换为 lingshan_buddha.glb。',
  },
  {
    poiId: 'jiulong_guanyu',
    status: 'placeholder',
    transform: {
      position: [-2.8, 0, 1.2],
      rotation: [0, 0, 0],
      scale: [0.9, 0.9, 0.9],
    },
    note: '九龙灌浴 core_3d 占位，后续替换为 jiulong_guanyu.glb。',
  },
  {
    poiId: 'fan_gong',
    status: 'placeholder',
    transform: {
      position: [2.8, 0, 1.2],
      rotation: [0, 0, 0],
      scale: [0.9, 0.9, 0.9],
    },
    note: '梵宫 core_3d 占位，后续替换为 fan_gong.glb。',
  },
  {
    poiId: 'wuyin_tancheng',
    status: 'placeholder',
    transform: {
      position: [0, 0, -2.6],
      rotation: [0, 0, 0],
      scale: [0.85, 0.85, 0.85],
    },
    note: '五印坛城 core_3d 占位，后续替换为 wuyin_tancheng.glb。',
  },
]
