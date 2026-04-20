// Live2D 单例管理:由 Live2DStage 注册 model 实例,外部通过本模块统一驱动嘴型/动作。
// 这样 store / audioLipsync 不必直接依赖 React 组件。

type Live2DLikeModel = {
  internalModel: {
    coreModel: {
      setParameterValueById: (id: string, value: number) => void
    }
    motionManager?: {
      stopAllMotions?: () => void
    }
  }
  motion?: (group: string, index?: number, priority?: number) => void
}

let modelRef: Live2DLikeModel | null = null

export function registerModel(model: Live2DLikeModel | null) {
  modelRef = model
}

export function setMouthOpen(value: number) {
  if (!modelRef) return
  const v = Math.max(0, Math.min(1, value))
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

export function playMotionForState(state: RobotState) {
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
