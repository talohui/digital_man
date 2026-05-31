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

export const lingshanModelDirectory = '/models/lingshan/landmarks/'

export const lingshanAssetMap: LingshanAssetBinding[] = [
  {
    poiId: 'giant_buddha',
    status: 'placeholder',
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    note: '灵山大佛 core_3d 占位。后续 GLB 建议放在 /models/lingshan/landmarks/lingshan_buddha.glb；文件存在后再填写 modelUrl。',
  },
  {
    poiId: 'jiulong_guanyu',
    status: 'placeholder',
    transform: {
      position: [-2.8, 0, 1.2],
      rotation: [0, 0, 0],
      scale: [0.9, 0.9, 0.9],
    },
    note: '九龙灌浴 core_3d 占位。后续 GLB 建议放在 /models/lingshan/landmarks/jiulong_guanyu.glb；文件存在后再填写 modelUrl。',
  },
  {
    poiId: 'fan_gong',
    status: 'placeholder',
    transform: {
      position: [2.8, 0, 1.2],
      rotation: [0, 0, 0],
      scale: [0.9, 0.9, 0.9],
    },
    note: '梵宫 core_3d 占位。后续 GLB 建议放在 /models/lingshan/landmarks/fan_gong.glb；文件存在后再填写 modelUrl。',
  },
  {
    poiId: 'wuyin_tancheng',
    status: 'placeholder',
    transform: {
      position: [0, 0, -2.6],
      rotation: [0, 0, 0],
      scale: [0.85, 0.85, 0.85],
    },
    note: '五印坛城 core_3d 占位。后续 GLB 建议放在 /models/lingshan/landmarks/wuyin_tancheng.glb；文件存在后再填写 modelUrl。',
  },
]
