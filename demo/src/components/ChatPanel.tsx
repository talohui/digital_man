import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import {
  AudioOutlined,
  DisconnectOutlined,
  SendOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useChatStore } from '../store/useChatStore'
import { getSession } from '../store/chatSessions'
import { getBrowserVoiceHint, type BrowserAsr } from '../lib/browserAsr'
import {
  createVoiceAsr,
  getVoiceAsrModeLabel,
  isVoiceAsrAvailable,
  shouldUseCloudAsr
} from '../lib/voiceAsr'
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

async function ensureMicPermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return true
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}

type ChatPanelProps = {
  sceneId?: string
}

function ChatPanel({ sceneId }: ChatPanelProps) {
  const activeSceneId = useChatStore((state) => state.activeSceneId)
  const resolvedSceneId = sceneId ?? activeSceneId
  const session = useChatStore((state) => getSession(state.sessions, resolvedSceneId))
  const messages = session.messages
  const inputText = session.inputText
  const isRecording = session.isRecording
  const wsStatus = useChatStore((state) => state.wsStatus)
  const isSending = session.isSending
  const setInputText = useChatStore((state) => state.setInputText)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const startRecord = useChatStore((state) => state.startRecord)
  const stopRecord = useChatStore((state) => state.stopRecord)
  const lastError = session.lastError

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdActiveRef = useRef(false)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const [voiceDraft, setVoiceDraft] = useState('')
  const [justSent, setJustSent] = useState(false)
  const [localToast, setLocalToast] = useState<{ kind: 'warn' | 'error'; text: string } | null>(null)

  const showToast = (kind: 'warn' | 'error', text: string) => {
    setLocalToast({ kind, text })
    window.setTimeout(() => setLocalToast(null), 3000)
  }

  const voiceHint = useMemo(() => getBrowserVoiceHint(), [])

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
        setInputText(text, resolvedSceneId)
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

        void sendMessage(trimmed, resolvedSceneId)
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

  const startRecording = async () => {
    if (!isVoiceAsrAvailable()) {
      showToast('warn', '当前浏览器无法使用麦克风录音，请换 Chrome / Edge 或打字提问。')
      return
    }
    if (asrRef.current) return

    const micOk = await ensureMicPermission()
    if (!micOk) {
      showToast('error', '无法使用麦克风：请在浏览器地址栏允许麦克风权限，或使用 localhost 访问。')
      return
    }

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
    holdActiveRef.current = true
    await startRecording()
    if (!asrRef.current) {
      holdActiveRef.current = false
    }
  }

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
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
    await sendMessage(inputText, resolvedSceneId)
  }

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

      <div className="chat-card__messages chat-scroll" ref={scrollRef}>
        {messages.map((msg) => {
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
                <p className="chat-bubble__content">{msg.content}</p>
              </div>
            </div>
          )
        })}
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
            className="chat-card__textarea"
            placeholder={isRecording ? '正在听您说话…' : '输入您的问题...'}
            value={inputText}
            onChange={(event) => setInputText(event.target.value, resolvedSceneId)}
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
            disabled={!inputText.trim() || isRecording || isSending}
            aria-label="发送"
          >
            {isSending ? <SyncOutlined spin /> : <SendOutlined />}
            <span>发送</span>
          </button>
        </div>

        <p className="chat-card__hint">
          回车发送，Shift+回车换行。按住麦克风说话，在页面任意位置松手即发送。
        </p>
      </div>
    </section>
  )
}

export default ChatPanel
