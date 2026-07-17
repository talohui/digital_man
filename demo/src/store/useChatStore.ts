import { create } from 'zustand'
import { connectFayWS, extractAudioUrl, extractRobotState, registerFayUsername, sendTextToFay, stopFayTalking, type FayMessage } from '../api/fay'
import { playWithLipsync } from '../lib/audioLipsync'
import { buildGuidePrompt } from '../lib/guidePrompt'
import {
  addEmotionInstructionToPrompt,
  createFayEmotionCue,
  getReplyEmotionStateForUserText,
  resolveReplyRobotState
} from '../lib/fayEmotion'
import { FAY_SEND_TIMEOUT_MS, isFayReplyComplete } from '../lib/fayReplyLifecycle'
import { getAudioPlaybackState, type RobotState } from '../lib/live2dManager'
import { getFayUsername, getSceneIdFromFayUsername } from '../lib/fayIdentity'
import {
  appendAssistantChunkToScene,
  appendMessageToScene,
  createInitialSessions,
  createMessage,
  DEFAULT_ASSISTANT_GREETING,
  getSession,
  normalizeSceneId,
  setGuideContextForScene,
  updateSession,
  type ChatRole,
  type ChatSessions,
  type GuideContext
} from './chatSessions'
import { useGuideStore } from './useGuideStore'
import { useGuideSessionStore } from '../guide/useGuideSessionStore'
import { getGuideRouteById, getGuideSpotById } from '../data/guideData'
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
  interruptReply: (sceneId?: string, options?: { notifyBackend?: boolean; keepalive?: boolean }) => Promise<void>
  clearSession: (sceneId?: string) => void
  startRecord: (sceneId?: string) => void
  stopRecord: (sceneId?: string) => void
  setGuideContext: (context: GuideContext, sceneId?: string) => void
  clearGuideContext: (sceneId?: string) => void
  setRobotState: (state: RobotState, sceneId?: string) => void
  setMouthOpen: (value: number, sceneId?: string) => void
  enqueueAudio: (url: string, sceneId?: string, state?: RobotState) => void
}

type AudioQueue = {
  chain: Promise<void>
  pending: number
  generation: number
  controllers: Set<AbortController>
}

const audioQueues = new Map<string, AudioQueue>()
const sendControllers = new Map<string, AbortController>()
const interruptedSendControllers = new WeakSet<AbortController>()

function getAudioQueue(sceneId: string): AudioQueue {
  const existing = audioQueues.get(sceneId)
  if (existing) return existing
  const created = {
    chain: Promise.resolve(),
    pending: 0,
    generation: 0,
    controllers: new Set<AbortController>()
  }
  audioQueues.set(sceneId, created)
  return created
}

function stopAudioQueue(sceneId: string) {
  const queue = getAudioQueue(sceneId)
  queue.generation += 1
  queue.pending = 0
  queue.controllers.forEach((controller) => controller.abort())
  queue.controllers.clear()
  queue.chain = Promise.resolve()
}

function decodeFayDisplayNewlines(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
}

// 剥掉 Fay 后端流里给 LLM 用的 grounding 标记,避免显示到对话框
// - <prestart ...>...</prestart>:RAG 预启动注入的知识库上下文(只该给 LLM,不该给用户)
// - _<isfirst> / _<isend>:句子流的首尾标记
// - <think>...</think>:思考模型的思考段(若有)
const stripBackendMarkup = (s: string): string => {
  let t = decodeFayDisplayNewlines(s)
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

function getPendingRobotState(content: string): RobotState {
  return getReplyEmotionStateForUserText(content) ?? 'thinking'
}

function buildPromptForFay(content: string, guideContext: GuideContext | null): string {
  const guidePrompt = buildGuidePrompt(content, guideContext)
  return addEmotionInstructionToPrompt(guidePrompt, content)
}

function resolveCurrentGuideContext(existing: GuideContext | null): GuideContext {
  const routeState = useGuideStore.getState()
  const mapContext = useGuideSessionStore.getState().context
  const routeId = existing?.routeId ?? mapContext.routeId ?? routeState.activeRouteId
  const routeName = existing?.routeName
    ?? mapContext.routeName
    ?? (routeId ? getGuideRouteById(routeId).name : undefined)
  const explicitMapSpotId = mapContext.selectedPoiId
  const routeProgressSpotId = mapContext.currentStopPoiId
  const spotId = existing?.spotId ?? explicitMapSpotId ?? routeProgressSpotId ?? routeState.selectedSpotId
  const spot = spotId ? getGuideSpotById(spotId) : undefined
  const locationSource = existing?.locationSource
    ?? (explicitMapSpotId ? 'map-selection' : routeProgressSpotId ? 'route-progress' : 'route-default')
  const locationConfidence = existing?.locationConfidence
    ?? (mapContext.location.available ? 1 : locationSource === 'route-default' ? 0.35 : 0.85)

  return {
    ...existing,
    routeId,
    routeName,
    spotId,
    spotName: existing?.spotName ?? mapContext.selectedPoiName ?? mapContext.currentStopName ?? spot?.name,
    spotIntro: existing?.spotIntro ?? spot?.intro,
    locationSource,
    locationConfidence,
    latitude: existing?.latitude ?? mapContext.location.latitude ?? spot?.lat,
    longitude: existing?.longitude ?? mapContext.location.longitude ?? spot?.lng,
    currentRouteStopIndex: existing?.currentRouteStopIndex ?? mapContext.currentStopIndex,
    visitedSpotIds: existing?.visitedSpotIds ?? routeState.visitedStops
  }
}

// ===== WebSocket 重连 & 发送离线队列(模块级,跨 store 实例稳定) =====
let _wsReconnectAttempts = 0
let _wsReconnectTimer: ReturnType<typeof setTimeout> | null = null
const _pendingSends: Array<{ sceneId: string; prompt: string; username: string }> = []

async function flushPendingSends(
  get: () => ChatState,
  patchSession: (sceneId: string | undefined, updater: any) => void
) {
  if (_pendingSends.length === 0) return
  const queue = _pendingSends.splice(0)
  const { sendTextToFay } = await import('../api/fay')
  for (const item of queue) {
    try {
      await sendTextToFay(item.prompt, item.username)
    } catch {
      // 仍失败则放回队首,等待下次重连
      _pendingSends.unshift(item)
      break
    }
  }
  if (_pendingSends.length === 0) {
    patchSession(undefined, (s: any) => ({ ...s, lastError: '' }))
  } else {
    patchSession(undefined, (s: any) => ({
      ...s,
      lastError: `还有 ${_pendingSends.length} 条消息正在排队重发…`
    }))
  }
  // 异步导入,使用 get 占位避免未使用报错
  void get
}

// 浏览器从 offline 恢复 online 时主动 flush
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // 通过 import.meta 触发当前 store 实例的 flush
    // 这里只能触发重连;sendMessage 的 flushPendingSends 走重连 onOpen 回调路径
    try { useChatStore.getState().initializeConnection() } catch { /* noop */ }
  })
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

      // 指数退避重连(最多 30s):移动网络切前后台/过隧道时不再永久掉线
      const scheduleReconnect = () => {
        const attempt = _wsReconnectAttempts++
        const base = Math.min(30000, 1000 * Math.pow(2, attempt))
        const jitter = Math.random() * 500
        const delay = base + jitter
        if (_wsReconnectTimer) clearTimeout(_wsReconnectTimer)
        _wsReconnectTimer = setTimeout(() => {
          _wsReconnectTimer = null
          // 若期间已主动断开,跳过
          if (get().wsStatus === 'disconnected' || get().wsStatus === 'error') {
            get().initializeConnection()
          }
        }, delay)
      }

      const socket = connectFayWS(get().handleFayMessage, {
        username: getFayUsername(get().activeSceneId),
        onOpen: () => {
          _wsReconnectAttempts = 0
          if (_wsReconnectTimer) {
            clearTimeout(_wsReconnectTimer)
            _wsReconnectTimer = null
          }
          set({ wsStatus: 'connected' })
          captureSessionStart()
          // 重连后清空 lastError 提示
          patchSession(undefined, (session) => ({ ...session, lastError: '' }))
          // 重连后回放离线发送队列
          flushPendingSends(get, patchSession)
        },
        onClose: () => {
          set({ wsStatus: 'disconnected', socket: null })
          captureSessionEnd()
          scheduleReconnect()
        },
        onError: () => {
          patchSession(undefined, (session) => ({
            ...session,
            lastError: 'Fay 连接断开,正在重连…'
          }))
          set({ wsStatus: 'error' })
          captureSessionEnd('ws_error')
          scheduleReconnect()
        }
      })

      set({ socket })
    },
    disconnectConnection: () => {
      const socket = get().socket

      if (_wsReconnectTimer) {
        clearTimeout(_wsReconnectTimer)
        _wsReconnectTimer = null
      }
      _wsReconnectAttempts = 0

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
      const isReplyComplete = isFayReplyComplete(message, rawText)
      if (rawText) {
        const isFirst = /_<isfirst>/.test(rawText)
        const isEnd = isReplyComplete
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
          patchSession(sceneId, (session) => ({
            ...session,
            isSending: false,
            _lastSendTime: 0
          }))
        }
      } else if (isReplyComplete) {
        patchSession(sceneId, (session) => ({ ...session, isSending: false, _lastSendTime: 0 }))
      }

      // 2. 数字人状态
      const emotionCue = createFayEmotionCue(message, rawText)
      const robot = extractRobotState(message)
      const currentReplyEmotionState = getSession(get().sessions, sceneId).replyEmotionState
      const replyRobotState = resolveReplyRobotState(
        currentReplyEmotionState,
        robot,
        emotionCue
      )
      if (robot || rawText || emotionCue.tone !== 'neutral') {
        patchSession(sceneId, (session) => ({
          ...session,
          robotState: replyRobotState,
          replyEmotionState:
            currentReplyEmotionState ??
            (emotionCue.tone === 'neutral' ? null : emotionCue.robotState)
        }))
      }

      // 3. 音频(可能多段,串行入队)
      const audioUrl = extractAudioUrl(message)
      if (audioUrl) {
        get().enqueueAudio(audioUrl, sceneId, replyRobotState)
      }
    },
    sendMessage: async (value, sceneId) => {
      const id = targetScene(sceneId)
      const currentSession = getSession(get().sessions, id)
      const content = (value ?? currentSession.inputText).trim()

      if (!content) {
        return
      }

      void get().interruptReply(id)

      const guideContext = resolveCurrentGuideContext(currentSession.guideContext)

      get().appendMessage('user', content, id)
      const _lastSendTime = Date.now()
      captureUserMessage(content)
      patchSession(id, (session) => ({
        ...session,
        inputText: '',
        isSending: true,
        lastError: '',
        robotState: getPendingRobotState(content),
        replyEmotionState: getReplyEmotionStateForUserText(content),
        guideContext,
        _lastSendTime
      }))

      let sendController: AbortController | null = null
      try {
        registerScene(id)
        const prompt = buildPromptForFay(content, guideContext)
        const controller = new AbortController()
        sendController = controller
        sendControllers.set(id, controller)
        const timeout = window.setTimeout(() => controller.abort(), FAY_SEND_TIMEOUT_MS)
        let response: Response
        try {
          response = await sendTextToFay(prompt, getFayUsername(id), controller.signal)
        } finally {
          window.clearTimeout(timeout)
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        if (sendController && interruptedSendControllers.has(sendController)) return
        const message =
          error instanceof Error ? error.message : '消息发送失败，请稍后重试。'

        // Fay 已通过 WS 返回完整回复时，HTTP 连接即使随后超时也不能再次排队，
        // 否则同一问题会在重连后被重复发送。
        const settledSession = getSession(get().sessions, id)
        if (!settledSession.isSending && settledSession._lastSendTime === 0) {
          return
        }

        // 网络断/服务暂时不可达 → 入离线队列,等 WS 重连成功后自动重发
        const isNetworkLike =
          (typeof navigator !== 'undefined' && !navigator.onLine) ||
          (error instanceof TypeError) || // fetch 网络错误典型是 TypeError
          (error instanceof DOMException && error.name === 'AbortError') ||
          /Failed to fetch|NetworkError|HTTP 5\d\d/.test(message)
        if (isNetworkLike) {
          const prompt = buildPromptForFay(content, guideContext)
          _pendingSends.push({ sceneId: id, prompt, username: getFayUsername(id) })
          patchSession(id, (session) => ({
            ...session,
            lastError: `网络不稳定,已加入队列(${_pendingSends.length}),重连后自动重发。`
          }))
        } else {
          patchSession(id, (session) => ({ ...session, lastError: `发送失败：${message}` }))
          get().appendMessage(
            'system',
            '当前无法连接到 Fay 服务，请检查本地接口或稍后再试。',
            id
          )
        }
      } finally {
        if (!sendController || sendControllers.get(id) === sendController) {
          if (sendController) sendControllers.delete(id)
          patchSession(id, (session) => ({ ...session, isSending: false }))
        }
      }
    },
    sendQuickAsk: async (question, sceneId) => {
      captureQuickAsk(question)
      await get().sendMessage(question, sceneId)
    },
    interruptReply: async (sceneId, options = {}) => {
      const id = targetScene(sceneId)
      const sendController = sendControllers.get(id)
      if (sendController) {
        interruptedSendControllers.add(sendController)
        sendController.abort()
        sendControllers.delete(id)
      }
      for (let index = _pendingSends.length - 1; index >= 0; index -= 1) {
        if (_pendingSends[index].sceneId === id) _pendingSends.splice(index, 1)
      }
      stopAudioQueue(id)
      patchSession(id, (session) => ({
        ...session,
        isSending: false,
        mouthOpen: 0,
        mouthForm: 0,
        robotState: 'normal',
        replyEmotionState: null,
        _lastSendTime: 0
      }))

      if (!options.notifyBackend) return
      try {
        await stopFayTalking(getFayUsername(id), { keepalive: options.keepalive })
      } catch (error) {
        if (!options.keepalive) console.warn('停止 Fay 输出失败:', error)
      }
    },
    clearSession: (sceneId) => {
      const id = targetScene(sceneId)
      // 轮换匿名会话段：下一次发送将用新的 Fay username，后端查不到旧历史 ⇒ 上下文清空
      useGuideStore.getState().bumpConversationEpoch(id)
      set((state) => ({
        sessions: updateSession(state.sessions, id, (session) => ({
          ...session,
          messages: [createMessage('assistant', DEFAULT_ASSISTANT_GREETING)],
          inputText: '',
          isRecording: false,
          isSending: false,
          robotState: 'happy',
          replyEmotionState: null,
          lastError: ''
        }))
      }))
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
    enqueueAudio: (url, sceneId, state = 'speaking') => {
      const id = targetScene(sceneId)
      const queue = getAudioQueue(id)
      const generation = queue.generation
      const speakingState = getAudioPlaybackState(state)
      queue.pending += 1
      get().setRobotState(speakingState, id)
      capture(EVENT.AUDIO_PLAY_START, {})
      queue.chain = queue.chain
        .then(async () => {
          if (generation !== queue.generation) return
          const controller = new AbortController()
          queue.controllers.add(controller)
          try {
            await playWithLipsync(url, (open, form) => {
              if (generation !== queue.generation) return
              // 每帧同时更新张开度与嘴形(粗略元音);合并为一次 patch,少一次 store 写入
              patchSession(id, (session) => ({ ...session, mouthOpen: open, mouthForm: form }))
            }, controller.signal)
          } finally {
            queue.controllers.delete(controller)
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          console.warn('音频播放失败:', err)
        })
        .finally(() => {
          if (generation !== queue.generation) return
          queue.pending -= 1
          if (queue.pending <= 0) {
            queue.pending = 0
            patchSession(id, (session) => ({
              ...session,
              mouthOpen: 0,
              mouthForm: 0,
              robotState: 'normal',
              replyEmotionState: null
            }))
            capture(EVENT.AUDIO_PLAY_END, {})
          }
        })
    }
  }
})
