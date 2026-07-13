export type Live2DPresetId = 'default' | 'haru-final' | 'haru-second' | 'haru-third'

export type Live2DPreset = {
  id: Live2DPresetId
  name: string
  modelUrl: string
  supportsCostumes: boolean
}

export const DEFAULT_LIVE2D_PRESET: Live2DPreset = {
  id: 'default',
  name: '默认·小灵',
  modelUrl: '/live2d/haru/haru_greeter_t03.model3.json',
  supportsCostumes: true
}

const LIVE2D_PRESETS: readonly Live2DPreset[] = [
  DEFAULT_LIVE2D_PRESET,
  {
    id: 'haru-final',
    name: '小灵·雅致',
    modelUrl: '/live2d/haru_final/haru_final.model3.json',
    supportsCostumes: false
  },
  {
    id: 'haru-second',
    name: '小灵·清新',
    modelUrl: '/live2d/haru_second/haru_second.model3.json',
    supportsCostumes: false
  },
  {
    id: 'haru-third',
    name: '小灵·灵动',
    modelUrl: '/live2d/haru_third/haru_third.model3.json',
    supportsCostumes: false
  }
]

export function listLive2DPresets(): Live2DPreset[] {
  return [...LIVE2D_PRESETS]
}

export function findLive2DPreset(modelUrl: string | null | undefined): Live2DPreset | null {
  const normalized = modelUrl?.trim()
  if (!normalized) return null
  return LIVE2D_PRESETS.find((preset) => preset.modelUrl === normalized) ?? null
}

export function resolveLive2DPreset(modelUrl: string | null | undefined): Live2DPreset {
  return findLive2DPreset(modelUrl) ?? DEFAULT_LIVE2D_PRESET
}
