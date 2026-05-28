// Live2D 场景管理:由 Live2DStage 按 sceneId 注册 model 实例,外部通过本模块统一驱动嘴型/动作。
// 这样 store / audioLipsync 不必直接依赖 React 组件,也避免多个数字人场景串口型。

export type Live2DLikeModel = {
  internalModel: {
    coreModel: {
      setParameterValueById: (id: string, value: number) => void
    }
    motionManager?: {
      stopAllMotions?: () => void
    }
  }
  motion?: (group: string, index?: number, priority?: number) => void
  textures?: unknown[]
}

const modelRefs = new Map<string, Live2DLikeModel>()

export function registerModel(model: Live2DLikeModel | null, sceneId = 'main') {
  if (model) {
    modelRefs.set(sceneId, model)
  } else {
    modelRefs.delete(sceneId)
  }
}

export function getRegisteredModel(sceneId = 'main'): Live2DLikeModel | null {
  return modelRefs.get(sceneId) ?? null
}

/** 将 0~1 口型驱动映射为 Live2D 更明显的张嘴幅度 */
function mapMouthOpenToModel(value: number): number {
  const clamped = Math.max(0, Math.min(1, value))
  if (clamped <= 0) return 0
  return Math.min(1, Math.pow(clamped, 0.75) * 1.15)
}

export function setMouthOpen(value: number, sceneId = 'main') {
  const modelRef = getRegisteredModel(sceneId)
  if (!modelRef) return
  const v = mapMouthOpenToModel(value)
  try {
    modelRef.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', v)
  } catch {
    // 模型参数 ID 不一致时静默忽略,不阻断后续帧
  }
}

export type RobotState = 'normal' | 'speaking' | 'listening' | 'thinking'

// 不同模型 motion group 名称不一致,这里给一个常见映射,匹配不到就忽略
const MOTION_GROUP_MAP: Record<RobotState, string[]> = {
  normal: ['Idle', 'idle'],
  speaking: ['TapBody', 'Tap', 'Speak', 'speaking'],
  listening: ['Idle', 'idle'],
  thinking: ['Idle', 'idle']
}

export function playMotionForState(state: RobotState, sceneId = 'main') {
  const modelRef = getRegisteredModel(sceneId)
  if (!modelRef || typeof modelRef.motion !== 'function') return
  const candidates = MOTION_GROUP_MAP[state] ?? []
  for (const group of candidates) {
    try {
      modelRef.motion(group)
      return
    } catch {
      // 尝试下一个候选
    }
  }
}
