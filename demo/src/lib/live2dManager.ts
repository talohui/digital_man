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
  expression?: (id?: string | number) => void
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
// 导游语义:thinking=查阅讲解资料 / speaking=讲解 / listening=倾听 / normal=待命
const MOTION_GROUP_MAP: Record<RobotState, string[]> = {
  normal: ['Idle', 'idle'],
  speaking: ['TapBody', 'Tap', 'Speak', 'speaking'],
  listening: ['Idle', 'idle'],
  thinking: ['Idle', 'idle']
}

// 表情映射(haru_greeter 提供 f00~f07):用表情区分导游不同状态,营造"会查资料、会讲解"的临场感。
// 表情 ID 不存在时由 pixi-live2d-display 静默忽略,不阻断后续帧。
const EXPRESSION_MAP: Record<RobotState, string> = {
  normal: 'f00',
  speaking: 'f01',
  listening: 'f02',
  thinking: 'f03'
}

export function playExpressionForState(state: RobotState, sceneId = 'main') {
  const modelRef = getRegisteredModel(sceneId)
  if (!modelRef || typeof modelRef.expression !== 'function') return
  try {
    modelRef.expression(EXPRESSION_MAP[state])
  } catch {
    // 表情 ID 不匹配时忽略
  }
}

export function playMotionForState(state: RobotState, sceneId = 'main') {
  // 表情与动作一并切换,让数字人状态在视觉上更明显
  playExpressionForState(state, sceneId)

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
