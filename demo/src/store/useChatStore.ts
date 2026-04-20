import { create } from 'zustand'
import { connectFayWS, extractAudioUrl, extractRobotState, sendTextToFay, type FayMessage } from '../api/fay'
import { playWithLipsync } from '../lib/audioLipsync'
import type { RobotState } from '../lib/live2dManager'
import {
  capture, EVENT,
  captureSessionStart, captureSessionEnd,
  captureUserMessage, captureAiReply,
  captureQuickAsk, captureVoiceStart, captureVoiceEnd,
} from '../lib/analytics'

type ChatRole = 'assistant' | 'user' | 'system'
type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

interface ChatState {
  inputText: string
  isRecording: boolean
  isSending: boolean
  messages: ChatMessage[]
  socket: WebSocket | null
  wsStatus: WsStatus
  lastError: string
  // 数字人相关
  robotState: RobotState
  mouthOpen: number
  _lastSendTime: number   // 记录用户发消息的时刻，用于计算 AI 响应时长
  setInputText: (value: string) => void
  appendMessage: (role: ChatRole, content: string) => void
  initializeConnection: () => void
  disconnectConnection: () => void
  handleFayMessage: (message: FayMessage) => void
  sendMessage: (value?: string) => Promise<void>
  sendQuickAsk: (question: string) => Promise<void>
  startRecord: () => void
  stopRecord: () => void
  // 数字人控制
  setRobotState: (state: RobotState) => void
  setMouthOpen: (value: number) => void
  enqueueAudio: (url: string) => void
}

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  role,
  content,
  createdAt: new Date().toISOString()
})

const getMessageText = (message: FayMessage) => {
  // 仅当 panelReply 类型是 fay(数字人回答)时才取它的 content
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

  return text ? text.trim() : ''
}

const initialMessages: ChatMessage[] = [
  createMessage(
    'assistant',
    '您好！我是灵山小灵，欢迎来到无锡灵山胜境。您可以直接打字提问，也可以点击上方热门问题快速开始。'
  )
]

// 串行播放队列:Fay 流式 TTS 可能分段推送多段 wav,必须按到达顺序播,不能并发
let audioChain: Promise<void> = Promise.resolve()
let pendingAudioCount = 0

export const useChatStore = create<ChatState>((set, get) => ({
  inputText: '',
  isRecording: false,
  isSending: false,
  messages: initialMessages,
  socket: null,
  wsStatus: 'idle',
  lastError: '',
  robotState: 'normal',
  mouthOpen: 0,
  _lastSendTime: 0,
  setInputText: (value) => set({ inputText: value }),
  appendMessage: (role, content) =>
    set((state) => ({
      messages: [...state.messages, createMessage(role, content)]
    })),
  initializeConnection: () => {
    const currentSocket = get().socket

    if (currentSocket && currentSocket.readyState <= WebSocket.OPEN) {
      return
    }

    set({ wsStatus: 'connecting', lastError: '' })

    const socket = connectFayWS(get().handleFayMessage, {
      onOpen: () => { set({ wsStatus: 'connected', lastError: '' }); captureSessionStart() },
      onClose: () => { set({ wsStatus: 'disconnected', socket: null }); captureSessionEnd() },
      onError: () => {
        set({ wsStatus: 'error', lastError: 'Fay WebSocket 连接失败，请确认本地服务是否启动。' })
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
    // 1. 文本气泡
    const text = getMessageText(message)
    if (text) {
      get().appendMessage('assistant', text)
      captureAiReply(text, get()._lastSendTime)   // 埋点：AI 回复 + 响应时长
    }

    // 2. 数字人状态
    const robot = extractRobotState(message)
    if (robot) {
      get().setRobotState(robot)
    }

    // 3. 音频(可能多段,串行入队)
    const audioUrl = extractAudioUrl(message)
    if (audioUrl) {
      get().enqueueAudio(audioUrl)
    }
  },
  sendMessage: async (value) => {
    const content = (value ?? get().inputText).trim()

    if (!content) {
      return
    }

    get().appendMessage('user', content)
    const _lastSendTime = Date.now()
    captureUserMessage(content)                                          // 埋点：用户消息（含情感分析请求）
    set({ inputText: '', isSending: true, lastError: '', robotState: 'thinking', _lastSendTime })

    try {
      const response = await sendTextToFay(content)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '消息发送失败，请稍后重试。'

      set({ lastError: `发送失败：${message}` })
      get().appendMessage(
        'system',
        '当前无法连接到 Fay 服务，请检查本地接口或稍后再试。'
      )
    } finally {
      set({ isSending: false })
    }
  },
  sendQuickAsk: async (question) => {
    captureQuickAsk(question)             // 埋点：快捷问题
    await get().sendMessage(question)
  },
  startRecord: () => {
    if (get().isRecording) {
      return
    }

    set({ isRecording: true, robotState: 'listening' })
    captureVoiceStart()                   // 埋点：录音开始
  },
  stopRecord: () => {
    if (!get().isRecording) {
      return
    }

    // 只有当前还没进入 speaking(回答音频还没回来) 时才回到 normal
    set((s) => ({
      isRecording: false,
      robotState: s.robotState === 'listening' ? 'normal' : s.robotState
    }))
    captureVoiceEnd()                     // 埋点：录音结束
  },
  setRobotState: (state) => set({ robotState: state }),
  setMouthOpen: (value) => set({ mouthOpen: value }),
  enqueueAudio: (url) => {
    pendingAudioCount += 1
    set({ robotState: 'speaking' })
    capture(EVENT.AUDIO_PLAY_START, {})
    audioChain = audioChain
      .then(() =>
        playWithLipsync(url, (v) => {
          // 直接 set 而不通过 setMouthOpen 函数,减少一次闭包查找
          set({ mouthOpen: v })
        })
      )
      .catch((err) => {
        console.warn('音频播放失败:', err)
      })
      .finally(() => {
        pendingAudioCount -= 1
        if (pendingAudioCount <= 0) {
          set({ mouthOpen: 0, robotState: 'normal' })
          capture(EVENT.AUDIO_PLAY_END, {})
        }
      })
  }
}))
