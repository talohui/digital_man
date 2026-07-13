import type { RobotState } from '../lib/live2dManager'
import type { GuideLocationSource } from '../lib/guideScene'

export type ChatRole = 'assistant' | 'user' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface GuideContext {
  routeId?: string
  routeName?: string
  spotId?: string
  spotName?: string
  spotIntro?: string
  spotNarrative?: string
  locationSource?: GuideLocationSource
  locationConfidence?: number
  visitedSpotIds?: string[]
}

export interface ChatSession {
  sceneId: string
  inputText: string
  isRecording: boolean
  isSending: boolean
  messages: ChatMessage[]
  robotState: RobotState
  replyEmotionState: RobotState | null
  mouthOpen: number
  mouthForm: number
  guideContext: GuideContext | null
  lastError: string
  _lastSendTime: number
}

export type ChatSessions = Record<string, ChatSession>

export const DEFAULT_SCENE_ID = 'main'
export const DEFAULT_ASSISTANT_GREETING =
  '您好！我是灵山小灵，欢迎来到无锡灵山胜境。您可以直接打字提问，也可以按住麦克风和我说话。'

export const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  role,
  content,
  createdAt: new Date().toISOString()
})

export function normalizeSceneId(sceneId?: string | null): string {
  const normalized = sceneId?.trim()
  return normalized || DEFAULT_SCENE_ID
}

export function createChatSession(
  sceneId: string = DEFAULT_SCENE_ID,
  guideContext: GuideContext | null = null
): ChatSession {
  return {
    sceneId: normalizeSceneId(sceneId),
    inputText: '',
    isRecording: false,
    isSending: false,
    messages: [createMessage('assistant', DEFAULT_ASSISTANT_GREETING)],
    robotState: 'happy',
    replyEmotionState: null,
    mouthOpen: 0,
    mouthForm: 0,
    guideContext,
    lastError: '',
    _lastSendTime: 0
  }
}

export function createInitialSessions(): ChatSessions {
  return {
    [DEFAULT_SCENE_ID]: createChatSession(DEFAULT_SCENE_ID)
  }
}

export function getSession(sessions: ChatSessions, sceneId?: string | null): ChatSession {
  const id = normalizeSceneId(sceneId)
  return sessions[id] ?? createChatSession(id)
}

export function updateSession(
  sessions: ChatSessions,
  sceneId: string | null | undefined,
  updater: (session: ChatSession) => ChatSession
): ChatSessions {
  const id = normalizeSceneId(sceneId)
  const current = getSession(sessions, id)
  return {
    ...sessions,
    [id]: updater(current)
  }
}

export function appendMessageToScene(
  sessions: ChatSessions,
  sceneId: string | null | undefined,
  role: ChatRole,
  content: string
): ChatSessions {
  return updateSession(sessions, sceneId, (session) => ({
    ...session,
    messages: [...session.messages, createMessage(role, content)]
  }))
}

export function appendAssistantChunkToScene(
  sessions: ChatSessions,
  sceneId: string | null | undefined,
  chunk: string
): ChatSessions {
  return updateSession(sessions, sceneId, (session) => {
    const messages = session.messages
    if (messages.length === 0 || messages[messages.length - 1].role !== 'assistant') {
      return {
        ...session,
        messages: [...messages, createMessage('assistant', chunk)]
      }
    }

    const last = messages[messages.length - 1]
    return {
      ...session,
      messages: [...messages.slice(0, -1), { ...last, content: last.content + chunk }]
    }
  })
}

export function setGuideContextForScene(
  sessions: ChatSessions,
  sceneId: string | null | undefined,
  guideContext: GuideContext | null
): ChatSessions {
  return updateSession(sessions, sceneId, (session) => ({
    ...session,
    guideContext
  }))
}
