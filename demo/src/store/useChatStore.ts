import { create } from 'zustand'
import { connectFayWS, extractAudioUrl, extractRobotState, registerFayUsername, sendTextToFay, type FayMessage } from '../api/fay'
import { playWithLipsync } from '../lib/audioLipsync'
import type { RobotState } from '../lib/live2dManager'
import { getFayUsername, getSceneIdFromFayUsername } from '../lib/fayIdentity'
import {
  appendAssistantChunkToScene,
  appendMessageToScene,
  createInitialSessions,
  getSession,
  normalizeSceneId,
  setGuideContextForScene,
  updateSession,
  type ChatRole,
  type ChatSessions,
  type GuideContext
} from './chatSessions'
import {
  capture, EVENT,
  captureSessionStart, captureSessionEnd,
  captureUserMessage, captureAiReply,
  captureQuickAsk, captureVoiceStart, captureVoiceEnd,
} from '../lib/analytics'

export type { ChatMessage, GuideContext } from './chatSessions'

type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

interface ChatState {
  activeSceneId: string
  sessions: ChatSessions
  socket: WebSocket | null
  wsStatus: WsStatus
  setActiveScene: (sceneId: string, guideContext?: GuideContext | null) => void
  setInputText: (value: string, sceneId?: string) => void
  appendMessage: (role: ChatRole, content: string, sceneId?: string) => void
  appendToLastAssistant: (chunk: string, sceneId?: string) => void
  initializeConnection: () => void
  disconnectConnection: () => void
  handleFayMessage: (message: FayMessage) => void
  sendMessage: (value?: string, sceneId?: string) => Promise<void>
  sendQuickAsk: (question: string, sceneId?: string) => Promise<void>
  startRecord: (sceneId?: string) => void
  stopRecord: (sceneId?: string) => void
  setGuideContext: (context: GuideContext, sceneId?: string) => void
  clearGuideContext: (sceneId?: string) => void
  setRobotState: (state: RobotState, sceneId?: string) => void
  setMouthOpen: (value: number, sceneId?: string) => void
  enqueueAudio: (url: string, sceneId?: string) => void
}

type AudioQueue = {
  chain: Promise<void>
  pending: number
}

const audioQueues = new Map<string, AudioQueue>()

function getAudioQueue(sceneId: string): AudioQueue {
  const existing = audioQueues.get(sceneId)
  if (existing) return existing
  const created = { chain: Promise.resolve(), pending: 0 }
  audioQueues.set(sceneId, created)
  return created
}

// 剥掉 Fay 后端流里给 LLM 用的 grounding 标记,避免显示到对话框
// - <prestart ...>...</prestart>:RAG 预启动注入的知识库上下文(只该给 LLM,不该给用户)
// - _<isfirst> / _<isend>:句子流的首尾标记
// - <think>...</think>:思考模型的思考段(若有)
const stripBackendMarkup = (s: string): string => {
  let t = s
  // 已闭合的 prestart 块(支持任意属性,跨行)
  t = t.replace(/<prestart\b[^>]*>[\s\S]*?<\/prestart>/gi, '')
  // 流式中未闭合的 prestart 前缀(从 <prestart...> 一直到字符串末尾):避免半截泄漏
  t = t.replace(/<prestart\b[^>]*>[\s\S]*$/i, '')
  // 思考段
  t = t.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
  // 句子流首尾标记
  t = t.replace(/_<isfirst>|_<isend>/g, '')
  return t.trim()
}

// 从 FayMessage 多个候选字段里挑出真正的文本(不做剥除,保留 _<isfirst>/_<isend> 等标记)
const getRawFayText = (message: FayMessage): string => {
  const panelReplyText =
    message.panelReply?.type === 'fay' && typeof message.panelReply?.content === 'string'
      ? message.panelReply.content
      : undefined

  const candidates = [
    panelReplyText,
    message.text,
    message.message,
    message.content,
    message.answer,
    message.msg
  ]

  const text = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === 'string' &&
      candidate.trim().length > 0 &&
      // 排除明显是文件路径/URL 的内容
      !/^https?:\/\//i.test(candidate) &&
      !/\.(jpg|png|wav|mp3)$/i.test(candidate.trim())
  )

  return text ?? ''
}

const buildGuidePrompt = (content: string, guideContext: GuideContext | null) => {
  if (!guideContext?.spotName && !guideContext?.routeName) {
    return content
  }

  return [
    '你是灵山胜境的数字人讲解员，请优先围绕当前场景回答游客问题。',
    guideContext.routeName ? `当前路线：${guideContext.routeName}` : '',
    guideContext.spotName ? `当前景点：${guideContext.spotName}` : '',
    guideContext.spotIntro ? `景点简介：${guideContext.spotIntro}` : '',
    guideContext.spotNarrative ? `当前讲解重点：${guideContext.spotNarrative}` : '',
    '如果游客问题偏离当前场景，也请先简短回答，再自然地把话题拉回当前导览场景。',
    `游客问题：${content}`
  ]
    .filter(Boolean)
    .join('\n')
}

function getMessageSceneId(message: FayMessage): string | null {
  const username =
    typeof message.Username === 'string'
      ? message.Username
      : typeof message.username === 'string'
        ? message.username
        : typeof message.panelReply?.username === 'string'
          ? message.panelReply.username
          : null
  return getSceneIdFromFayUsername(username)
}

export const useChatStore = create<ChatState>((set, get) => {
  const targetScene = (sceneId?: string) => normalizeSceneId(sceneId ?? get().activeSceneId)
  const patchSession = (
    sceneId: string | undefined,
    updater: Parameters<typeof updateSession>[2]
  ) => {
    const id = targetScene(sceneId)
    set((state) => ({
      sessions: updateSession(state.sessions, id, updater)
    }))
  }
  const registerScene = (sceneId?: string) => {
    const id = targetScene(sceneId)
    registerFayUsername(get().socket, getFayUsername(id))
  }

  return {
    activeSceneId: 'main',
    sessions: createInitialSessions(),
    socket: null,
    wsStatus: 'idle',
    setActiveScene: (sceneId, guideContext) => {
      const id = normalizeSceneId(sceneId)
      set((state) => ({
        activeSceneId: id,
        sessions: updateSession(state.sessions, id, (session) => ({
          ...session,
          guideContext: guideContext === undefined ? session.guideContext : guideContext
        }))
      }))
      registerFayUsername(get().socket, getFayUsername(id))
    },
    setInputText: (value, sceneId) =>
      patchSession(sceneId, (session) => ({ ...session, inputText: value })),
    appendMessage: (role, content, sceneId) =>
      set((state) => ({
        sessions: appendMessageToScene(state.sessions, targetScene(sceneId), role, content)
      })),
    appendToLastAssistant: (chunk, sceneId) =>
      set((state) => ({
        sessions: appendAssistantChunkToScene(state.sessions, targetScene(sceneId), chunk)
      })),
    initializeConnection: () => {
      const currentSocket = get().socket

      if (currentSocket && currentSocket.readyState <= WebSocket.OPEN) {
        registerScene()
        return
      }

      set({ wsStatus: 'connecting' })

      const socket = connectFayWS(get().handleFayMessage, {
        username: getFayUsername(get().activeSceneId),
        onOpen: () => { set({ wsStatus: 'connected' }); captureSessionStart() },
        onClose: () => { set({ wsStatus: 'disconnected', socket: null }); captureSessionEnd() },
        onError: () => {
          patchSession(undefined, (session) => ({
            ...session,
            lastError: 'Fay WebSocket 连接失败，请确认本地服务是否启动。'
          }))
          set({ wsStatus: 'error' })
          captureSessionEnd('ws_error')
        }
      })

      set({ socket })
    },
    disconnectConnection: () => {
      const socket = get().socket

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }

      set({ socket: null, wsStatus: 'disconnected' })
    },
    handleFayMessage: (message) => {
      const sceneId = getMessageSceneId(message) ?? get().activeSceneId

      // 1. 文本气泡 —— 同一轮回答的多个句子合并到一个气泡里
      //    Fay 流式协议:每句话首块带 _<isfirst>,末块带 _<isend>
      //    见到 isFirst 时开新气泡;否则把内容追加到最后一个 assistant 气泡
      const rawText = getRawFayText(message)
      if (rawText) {
        const isFirst = /_<isfirst>/.test(rawText)
        const isEnd = /_<isend>/.test(rawText)
        const clean = stripBackendMarkup(rawText)
        if (clean) {
          const session = getSession(get().sessions, sceneId)
          const last = session.messages[session.messages.length - 1]
          if (isFirst || !last || last.role !== 'assistant') {
            get().appendMessage('assistant', clean, sceneId)
          } else {
            get().appendToLastAssistant(clean, sceneId)
          }
        }
        if (isEnd) {
          const messages = getSession(get().sessions, sceneId).messages
          const assistant = messages[messages.length - 1]
          captureAiReply(assistant?.role === 'assistant' ? assistant.content : clean, getSession(get().sessions, sceneId)._lastSendTime)
          patchSession(sceneId, (session) => ({ ...session, _lastSendTime: 0 }))
        }
      }

      // 2. 数字人状态
      const robot = extractRobotState(message)
      if (robot) {
        get().setRobotState(robot, sceneId)
      }

      // 3. 音频(可能多段,串行入队)
      const audioUrl = extractAudioUrl(message)
      if (audioUrl) {
        get().enqueueAudio(audioUrl, sceneId)
      }
    },
    sendMessage: async (value, sceneId) => {
      const id = targetScene(sceneId)
      const currentSession = getSession(get().sessions, id)
      const content = (value ?? currentSession.inputText).trim()

      if (!content) {
        return
      }

      get().appendMessage('user', content, id)
      const _lastSendTime = Date.now()
      captureUserMessage(content)
      patchSession(id, (session) => ({
        ...session,
        inputText: '',
        isSending: true,
        lastError: '',
        robotState: 'thinking',
        _lastSendTime
      }))

      try {
        registerScene(id)
        const prompt = buildGuidePrompt(content, getSession(get().sessions, id).guideContext)
        const response = await sendTextToFay(prompt, getFayUsername(id))

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '消息发送失败，请稍后重试。'

        patchSession(id, (session) => ({ ...session, lastError: `发送失败：${message}` }))
        get().appendMessage(
          'system',
          '当前无法连接到 Fay 服务，请检查本地接口或稍后再试。',
          id
        )
      } finally {
        patchSession(id, (session) => ({ ...session, isSending: false }))
      }
    },
    sendQuickAsk: async (question, sceneId) => {
      captureQuickAsk(question)
      await get().sendMessage(question, sceneId)
    },
    startRecord: (sceneId) => {
      const id = targetScene(sceneId)
      if (getSession(get().sessions, id).isRecording) {
        return
      }

      patchSession(id, (session) => ({ ...session, isRecording: true, robotState: 'listening' }))
      captureVoiceStart()
    },
    stopRecord: (sceneId) => {
      const id = targetScene(sceneId)
      if (!getSession(get().sessions, id).isRecording) {
        return
      }

      patchSession(id, (session) => ({
        ...session,
        isRecording: false,
        robotState: session.robotState === 'listening' ? 'normal' : session.robotState
      }))
      captureVoiceEnd()
    },
    setGuideContext: (guideContext, sceneId) =>
      set((state) => ({
        sessions: setGuideContextForScene(state.sessions, targetScene(sceneId), guideContext)
      })),
    clearGuideContext: (sceneId) =>
      set((state) => ({
        sessions: setGuideContextForScene(state.sessions, targetScene(sceneId), null)
      })),
    setRobotState: (robotState, sceneId) =>
      patchSession(sceneId, (session) => ({ ...session, robotState })),
    setMouthOpen: (mouthOpen, sceneId) =>
      patchSession(sceneId, (session) => ({ ...session, mouthOpen })),
    enqueueAudio: (url, sceneId) => {
      const id = targetScene(sceneId)
      const queue = getAudioQueue(id)
      queue.pending += 1
      get().setRobotState('speaking', id)
      capture(EVENT.AUDIO_PLAY_START, {})
      queue.chain = queue.chain
        .then(() =>
          playWithLipsync(url, (v) => {
            get().setMouthOpen(v, id)
          })
        )
        .catch((err) => {
          console.warn('音频播放失败:', err)
        })
        .finally(() => {
          queue.pending -= 1
          if (queue.pending <= 0) {
            queue.pending = 0
            patchSession(id, (session) => ({ ...session, mouthOpen: 0, robotState: 'normal' }))
            capture(EVENT.AUDIO_PLAY_END, {})
          }
        })
    }
  }
})
