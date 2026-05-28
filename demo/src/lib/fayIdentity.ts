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

/** 与推荐/埋点共用的匿名游客 ID，叠加 sceneId 后作为 Fay username 实现场景隔离 */
export function getFayUsername(sceneId: string = DEFAULT_SCENE_ID): string {
  const userId = useGuideStore.getState().ensureUserId()
  return `${userId}${SCENE_SEPARATOR}${encodeScene(sceneId)}`
}

export function getSceneIdFromFayUsername(username?: string | null): string | null {
  if (!username) return null
  const sepIndex = username.lastIndexOf(SCENE_SEPARATOR)
  const encodedScene = sepIndex >= 0 ? username.slice(sepIndex + SCENE_SEPARATOR.length) : ''
  return encodedScene ? decodeScene(encodedScene) : null
}
