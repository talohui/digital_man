import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import {
  AudioOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  SendOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'
import { getSession } from '../store/chatSessions'
import { getAnonymousSessionLabel } from '../lib/fayIdentity'
import { type BrowserAsr } from '../lib/browserAsr'
import { unlockAudio } from '../lib/audioLipsync'
import {
  createVoiceAsr,
  getVoiceAsrEnvironmentHint,
  getVoiceAsrModeLabel,
  isVoiceAsrAvailable,
  shouldUseCloudAsr
} from '../lib/voiceAsr'
import ChatMarkdown from './ChatMarkdown'
import VoiceRecorderBar from './VoiceRecorderBar'

const statusClassMap = {
  connected: 'chat-card__status--connected',
  connecting: 'chat-card__status--connecting',
  disconnected: 'chat-card__status--idle',
  error: 'chat-card__status--error',
  idle: 'chat-card__status--idle'
} as const

const roleLabelMap = {
  assistant: '灵',
  user: '客',
  system: '系'
} as const

type ChatPanelProps = {
  sceneId?: string
}

function ChatPanel({ sceneId }: ChatPanelProps) {
  const activeSceneId = useChatStore((state) => state.activeSceneId)
  const resolvedSceneId = sceneId ?? activeSceneId
  // 细粒度订阅:session 里的 mouthOpen(口型)在 TTS 播放时高频更新,
  // 订阅整个 session 对象会让面板跟着每帧重渲;只挑本组件真正用到的字段
  const messages = useChatStore((state) => getSession(state.sessions, resolvedSceneId).messages)
  const inputText = useChatStore((state) => getSession(state.sessions, resolvedSceneId).inputText)
  const isRecording = useChatStore((state) => getSession(state.sessions, resolvedSceneId).isRecording)
  const isSending = useChatStore((state) => getSession(state.sessions, resolvedSceneId).isSending)
  const lastError = useChatStore((state) => getSession(state.sessions, resolvedSceneId).lastError)
  const wsStatus = useChatStore((state) => state.wsStatus)
  const setInputText = useChatStore((state) => state.setInputText)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const interruptReply = useChatStore((state) => state.interruptReply)
  const clearSession = useChatStore((state) => state.clearSession)
  const startRecord = useChatStore((state) => state.startRecord)
  const stopRecord = useChatStore((state) => state.stopRecord)
  // 匿名会话 ID 标签：随游客 ID / 会话轮换序号变化重算（清空后序号 +1）
  const anonUserId = useGuideStore((state) => state.userId)
  const conversationEpoch = useGuideStore(
    (state) => state.conversationEpochs?.[resolvedSceneId] ?? 0
  )
  const anonSessionLabel = useMemo(
    () => getAnonymousSessionLabel(resolvedSceneId),
    [anonUserId, conversationEpoch, resolvedSceneId]
  )

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdActiveRef = useRef(false)
  const shouldStickToBottomRef = useRef(true)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const interruptPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const [voiceDraft, setVoiceDraft] = useState('')
  const [justSent, setJustSent] = useState(false)
  const [localToast, setLocalToast] = useState<{ kind: 'warn' | 'error'; text: string } | null>(null)

  const showToast = (kind: 'warn' | 'error', text: string) => {
    setLocalToast({ kind, text })
    window.setTimeout(() => setLocalToast(null), 3000)
  }

  const voiceHint = useMemo(() => getVoiceAsrEnvironmentHint(), [])

  // textarea 自动撑高(代替 antd Input.TextArea autoSize)
  const autoSizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    const maxRowsPx = 24 * 4 + 24 // 4 rows + padding
    el.style.height = `${Math.min(el.scrollHeight, maxRowsPx)}px`
  }

  useEffect(() => {
    autoSizeTextarea(textareaRef.current)
  }, [inputText])

  useEffect(() => {
    const updateKeyboardViewport = () => {
      const viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight)
      const keyboardOpen = viewportHeight < window.innerHeight - 120
      document.documentElement.style.setProperty('--chat-visual-viewport-height', `${viewportHeight}px`)
      document.documentElement.dataset.chatKeyboardOpen = keyboardOpen ? 'true' : 'false'
    }
    updateKeyboardViewport()
    window.addEventListener('resize', updateKeyboardViewport)
    window.visualViewport?.addEventListener('resize', updateKeyboardViewport)
    window.visualViewport?.addEventListener('scroll', updateKeyboardViewport)
    return () => {
      window.removeEventListener('resize', updateKeyboardViewport)
      window.visualViewport?.removeEventListener('resize', updateKeyboardViewport)
      window.visualViewport?.removeEventListener('scroll', updateKeyboardViewport)
      document.documentElement.dataset.chatKeyboardOpen = 'false'
    }
  }, [])

  const detachGlobalRelease = () => {
    releaseCleanupRef.current?.()
    releaseCleanupRef.current = null
  }

  const finishRecording = () => {
    if (!holdActiveRef.current && !asrRef.current) {
      stopRecord(resolvedSceneId)
      return
    }
    holdActiveRef.current = false
    detachGlobalRelease()
    if (!asrRef.current) {
      stopRecord(resolvedSceneId)
      return
    }
    asrRef.current.stop()
  }

  const attachGlobalRelease = () => {
    detachGlobalRelease()
    const onRelease = () => {
      if (!holdActiveRef.current) return
      detachGlobalRelease()
      finishRecording()
    }
    window.addEventListener('pointerup', onRelease, true)
    window.addEventListener('mouseup', onRelease, true)
    window.addEventListener('pointercancel', onRelease, true)
    releaseCleanupRef.current = () => {
      window.removeEventListener('pointerup', onRelease, true)
      window.removeEventListener('mouseup', onRelease, true)
      window.removeEventListener('pointercancel', onRelease, true)
    }
  }

  const bindAsr = () =>
    createVoiceAsr({
      onInterim: (text) => {
        setVoiceDraft(text)
      },
      onFinal: (text) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(resolvedSceneId)
        setVoiceDraft('')
        setInputText('', resolvedSceneId)

        const trimmed = text.trim()
        if (!trimmed) {
          return
        }

        shouldStickToBottomRef.current = true
        void interruptPromiseRef.current.then(() => sendMessage(trimmed, resolvedSceneId))
        setJustSent(true)
        window.setTimeout(() => setJustSent(false), 2000)
      },
      onError: (msg) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(resolvedSceneId)
        setVoiceDraft('')
        setInputText('', resolvedSceneId)
        showToast('error', msg)
      }
    })

  const startRecording = () => {
    if (!isVoiceAsrAvailable()) {
      showToast('warn', '当前浏览器无法使用麦克风录音，请换 Chrome / Edge 或打字提问。')
      return
    }
    if (asrRef.current) return

    setJustSent(false)
    setVoiceDraft('')
    setInputText('', resolvedSceneId)
    startRecord(resolvedSceneId)
    asrRef.current = bindAsr()
    asrRef.current.start()
    attachGlobalRelease()
  }

  const cancelRecording = () => {
    holdActiveRef.current = false
    detachGlobalRelease()
    asrRef.current?.abort()
    asrRef.current = null
    stopRecord(resolvedSceneId)
    setVoiceDraft('')
    setInputText('', resolvedSceneId)
  }

  const handleMicPointerDown = async (event: SyntheticEvent) => {
    event.preventDefault()
    if (isRecording) return
    interruptPromiseRef.current = interruptReply(resolvedSceneId, { notifyBackend: true })
    holdActiveRef.current = true
    startRecording()
    if (!asrRef.current) {
      holdActiveRef.current = false
    }
  }

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    if (!shouldStickToBottomRef.current) return
    container.scrollTop = container.scrollHeight
  }, [messages, voiceDraft])

  useEffect(() => {
    return () => {
      detachGlobalRelease()
      asrRef.current?.abort()
      asrRef.current = null
    }
  }, [])

  const statusText = useMemo(() => {
    if (isRecording) return '录音中'
    if (wsStatus === 'connected') return '已连接'
    if (wsStatus === 'connecting') return '连接中'
    if (wsStatus === 'error') return '连接异常'
    return '未连接'
  }, [isRecording, wsStatus])

  const handleSend = async () => {
    if (isRecording || voiceDraft) return
    shouldStickToBottomRef.current = true
    void unlockAudio()
    await sendMessage(inputText, resolvedSceneId)
  }

  const handleClear = () => {
    if (isSending || messages.length <= 1) return
    const ok = window.confirm('确定清空当前会话吗？将开启一段新的匿名会话，历史对话不可恢复。')
    if (!ok) return
    shouldStickToBottomRef.current = true
    void interruptReply(resolvedSceneId, { notifyBackend: true })
    clearSession(resolvedSceneId)
  }

  const handleMessagesScroll = () => {
    const container = scrollRef.current
    if (!container) return
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    shouldStickToBottomRef.current = distanceToBottom < 96
  }

  // 气泡列表 memo:打字、录音等只动 composer 的更新不再重建整个列表
  const messageList = useMemo(
    () =>
      messages.map((msg) => {
        const isUser = msg.role === 'user'
        return (
          <div
            className={`chat-bubble-row ${isUser ? 'chat-bubble-row--user' : ''}`}
            key={msg.id}
          >
            <div className={`chat-bubble__avatar chat-bubble__avatar--${msg.role}`} aria-hidden>
              {roleLabelMap[msg.role]}
            </div>
            <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : ''}`}>
              {isUser ? (
                <p className="chat-bubble__content chat-bubble__content--plain">{msg.content}</p>
              ) : (
                <ChatMarkdown content={msg.content} />
              )}
            </div>
          </div>
        )
      }),
    [messages]
  )

  return (
    <section className="chat-card">
      <header className="chat-card__titlebar">
        <div>
          <span className="section-kicker">对话窗口</span>
          <h5 className="chat-card__title">和灵山小灵实时交流</h5>
        </div>
        <span className={`chat-card__status ${statusClassMap[wsStatus]}`}>
          {wsStatus === 'connecting' ? <SyncOutlined spin /> : null}
          {statusText}
        </span>
      </header>

      <div className="chat-card__messages chat-scroll" ref={scrollRef} onScroll={handleMessagesScroll}>
        {messageList}
      </div>

      {lastError ? (
        <div className="chat-card__error">
          <DisconnectOutlined />
          <span>{lastError}</span>
        </div>
      ) : null}

      {/* 简易本地 toast,替代 antd App.message */}
      {localToast ? (
        <div
          className={`chat-card__toast chat-card__toast--${localToast.kind}`}
          role="status"
          aria-live="polite"
        >
          {localToast.text}
        </div>
      ) : null}

      <div className="chat-card__composer-stack">
        <VoiceRecorderBar
          isRecording={isRecording}
          isSupported={isVoiceAsrAvailable()}
          voiceDraft={voiceDraft}
          justSent={justSent}
          idleHint={getVoiceAsrModeLabel()}
          useCloudAsr={shouldUseCloudAsr()}
        />

        {voiceHint ? (
          <p className="chat-card__voice-env-hint">{voiceHint}</p>
        ) : null}

        {messages.length > 1 ? (
          <div className="chat-card__session-bar">
            <span className="chat-card__session-id" title="匿名会话 ID（无需登录），清空后将开启新会话">
              匿名会话 · {anonSessionLabel}
            </span>
            <button
              type="button"
              className="chat-card__clear"
              onClick={handleClear}
              disabled={isSending}
              aria-label="清空当前会话"
              title="清空当前会话"
            >
              <DeleteOutlined />
              <span>清空会话</span>
            </button>
          </div>
        ) : null}

        <div className="chat-card__composer">
          <div className="chat-card__mic-wrap">
            <button
              type="button"
              title="按住说话，松手发送（可在按钮外松手）"
              className={isRecording ? 'chat-card__mic chat-card__mic--active' : 'chat-card__mic'}
              onPointerDown={handleMicPointerDown}
              onPointerCancel={cancelRecording}
              onContextMenu={(event) => event.preventDefault()}
              aria-label="按住录音"
            >
              <AudioOutlined />
            </button>
            {isRecording ? <span className="chat-card__mic-label">松手发送</span> : null}
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={500}
            className="chat-card__textarea"
            placeholder={isRecording ? '正在听您说话…' : '在这里输入您的问题'}
            value={inputText}
            readOnly={isRecording}
            onChange={(event) => setInputText(event.target.value.slice(0, 500), resolvedSceneId)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
              event.preventDefault()
              void handleSend()
            }}
          />

          <button
            type="button"
            className="chat-card__send"
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || isRecording || Boolean(voiceDraft) || isSending}
            aria-label="发送"
          >
            {isSending ? <SyncOutlined spin /> : <SendOutlined />}
            <span className="chat-card__send-label">发送</span>
          </button>
        </div>

        <p className="chat-card__hint">
          <span>对话内容由 AI 生成，请以景区现场公告为准。</span>
          {inputText.length >= 400 ? (
            <span className="chat-card__count">{inputText.length}/500</span>
          ) : null}
        </p>
      </div>
    </section>
  )
}

export default ChatPanel
