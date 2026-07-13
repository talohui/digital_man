import { useGuideStore } from '../store/useGuideStore'
import { DEFAULT_SCENE_ID, normalizeSceneId } from '../store/chatSessions'

const SCENE_SEPARATOR = '__scene__'

function encodeScene(sceneId: string): string {
  return encodeURIComponent(normalizeSceneId(sceneId))
}

function decodeScene(encoded: string): string {
  try {
    return normalizeSceneId(decodeURIComponent(encoded))
  } catch {
    return DEFAULT_SCENE_ID
  }
}

/**
 * 与推荐/埋点共用的匿名游客 ID，叠加「会话轮换段 __c<epoch>」与 sceneId 后作为 Fay username。
 * - sceneId 后缀实现「场景隔离」（scene 解析只看最后一个 __scene__，轮换段在它之前，不影响路由）
 * - 轮换段在「清空当前会话」时 +1，使 Fay 按新 username 查不到旧历史 ⇒ 上下文真正清空
 */
export function getFayUsername(sceneId: string = DEFAULT_SCENE_ID): string {
  const state = useGuideStore.getState()
  const userId = state.ensureUserId()
  const scene = normalizeSceneId(sceneId)
  const epoch = state.conversationEpochs?.[scene] ?? 0
  const epochSeg = epoch > 0 ? `__c${epoch}` : ''
  return `${userId}${epochSeg}${SCENE_SEPARATOR}${encodeScene(scene)}`
}

/** 给用户看的「匿名会话 ID」短标签，清空会话后序号 +1（开启新匿名会话） */
export function getAnonymousSessionLabel(sceneId: string = DEFAULT_SCENE_ID): string {
  const state = useGuideStore.getState()
  const scene = normalizeSceneId(sceneId)
  const short = (state.userId || '').replace(/^guest-/, '').slice(0, 8) || 'anon'
  const epoch = state.conversationEpochs?.[scene] ?? 0
  return `guest-${short}#${epoch + 1}`
}

export function getSceneIdFromFayUsername(username?: string | null): string | null {
  if (!username) return null
  const sepIndex = username.lastIndexOf(SCENE_SEPARATOR)
  const encodedScene = sepIndex >= 0 ? username.slice(sepIndex + SCENE_SEPARATOR.length) : ''
  return encodedScene ? decodeScene(encodedScene) : null
}
