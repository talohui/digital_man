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
    // InternalModel 是 EventEmitter:用 beforeModelUpdate 钩子在每帧动作/表情
    // 套用之后、coreModel.update() 之前强制写入口型(见下方说明)。
    on?: (event: string, fn: () => void) => void
    off?: (event: string, fn: () => void) => void
  }
  motion?: (group: string, index?: number, priority?: number) => void
  expression?: (id?: string | number) => void
  textures?: unknown[]
}

const modelRefs = new Map<string, Live2DLikeModel>()
// 每个场景当前的口型目标值(0~1),由 setMouthOpen 写入、beforeModelUpdate 钩子每帧读取。
const mouthTargets = new Map<string, number>()
// 每个场景当前的嘴形目标值(-1 圆/撮口 ~ +1 展/咧),由 setMouthForm 写入。
const mouthFormTargets = new Map<string, number>()
// 嘴形是否由口型接管:仅讲解(speaking)时为 true,覆盖 ParamMouthForm;
// 其余状态交给表情控制嘴形(思考/倾听表情会设 MouthForm),避免互相打架。
const mouthFormActive = new Map<string, boolean>()
// 每个场景已注册的 beforeModelUpdate 钩子,便于换模型/卸载时解绑。
const mouthHooks = new Map<string, () => void>()

export function registerModel(model: Live2DLikeModel | null, sceneId = 'main') {
  // 先解绑旧模型的口型钩子,避免泄漏 / 串场景
  const prevModel = modelRefs.get(sceneId)
  const prevHook = mouthHooks.get(sceneId)
  if (prevModel && prevHook) {
    try {
      prevModel.internalModel.off?.('beforeModelUpdate', prevHook)
    } catch {
      /* ignore */
    }
  }
  mouthHooks.delete(sceneId)

  if (model) {
    modelRefs.set(sceneId, model)
    // 关键修复:haru 的 idle 动作每帧会写 ParamMouthOpenY,讲解表情 f01 还会对
    // ParamMouthOpenY 叠加 +1(Add)。若只在 rAF 里 setParameterValueById,会被
    // 模型每帧 update 覆盖 → 说话时嘴不跟声音、甚至卡在张开。
    // 这里挂到 beforeModelUpdate(动作+表情都套用完、coreModel.update() 之前的最后
    // 一个钩子),用 SET 覆盖累加值,使音频驱动的口型当帧生效、压过动作与表情。
    const hook = () => {
      const core = model.internalModel.coreModel
      const open = mapMouthOpenToModel(mouthTargets.get(sceneId) ?? 0)
      try {
        core.setParameterValueById('ParamMouthOpenY', open)
        // 仅讲解时接管嘴形(粗略元音);其余状态让表情掌管 ParamMouthForm。
        if (mouthFormActive.get(sceneId)) {
          const form = Math.max(-1, Math.min(1, mouthFormTargets.get(sceneId) ?? 0))
          core.setParameterValueById('ParamMouthForm', form)
        }
      } catch {
        // 模型参数 ID 不一致时静默忽略,不阻断后续帧
      }
    }
    if (typeof model.internalModel.on === 'function') {
      model.internalModel.on('beforeModelUpdate', hook)
      mouthHooks.set(sceneId, hook)
    }
  } else {
    modelRefs.delete(sceneId)
    mouthTargets.delete(sceneId)
    mouthFormTargets.delete(sceneId)
    mouthFormActive.delete(sceneId)
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
  // 记录目标值,真正写入由 beforeModelUpdate 钩子每帧执行(压过动作/表情)。
  mouthTargets.set(sceneId, value)
  // 兜底:即时写一次,覆盖钩子尚未触发的极短间隙。
  const modelRef = getRegisteredModel(sceneId)
  if (!modelRef) return
  try {
    modelRef.internalModel.coreModel.setParameterValueById(
      'ParamMouthOpenY',
      mapMouthOpenToModel(value)
    )
  } catch {
    // 模型参数 ID 不一致时静默忽略,不阻断后续帧
  }
}

/** 设置嘴形目标(-1 圆/撮口 ~ +1 展/咧)。仅在 mouthFormActive 时由钩子写入模型。 */
export function setMouthForm(value: number, sceneId = 'main') {
  mouthFormTargets.set(sceneId, value)
}

/**
 * 是否让口型接管嘴形(ParamMouthForm)。讲解(speaking)时置 true 做元音嘴型;
 * 关闭时把嘴形目标归零,并把 ParamMouthForm 交还给表情(下一帧表情会重新写入)。
 */
export function setMouthFormActive(active: boolean, sceneId = 'main') {
  mouthFormActive.set(sceneId, active)
  if (!active) mouthFormTargets.set(sceneId, 0)
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
