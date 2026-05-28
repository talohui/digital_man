import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import {
  AudioOutlined,
  DisconnectOutlined,
  SendOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { App, Avatar, Button, Card, Input, Space, Tag, Tooltip, Typography } from 'antd'
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

const { TextArea } = Input

const statusColorMap = {
  connected: 'success',
  connecting: 'processing',
  disconnected: 'default',
  error: 'error',
  idle: 'default'
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
  const { message } = App.useApp()
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
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdActiveRef = useRef(false)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const [voiceDraft, setVoiceDraft] = useState('')
  const [justSent, setJustSent] = useState(false)

  const voiceHint = useMemo(() => getBrowserVoiceHint(), [])

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
        void message.error(msg)
      }
    })

  const startRecording = async () => {
    if (!isVoiceAsrAvailable()) {
      void message.warning('当前浏览器无法使用麦克风录音，请换 Chrome / Edge 或打字提问。')
      return
    }
    if (asrRef.current) return

    const micOk = await ensureMicPermission()
    if (!micOk) {
      void message.error('无法使用麦克风：请在浏览器地址栏允许麦克风权限，或使用 localhost 访问。')
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
    <Card
      className="chat-card"
      bordered={false}
      title={
        <div className="chat-card__titlebar">
          <div>
            <Typography.Text className="section-kicker">对话窗口</Typography.Text>
            <Typography.Title level={5} className="chat-card__title">
              和灵山小灵实时交流
            </Typography.Title>
          </div>
          <Tag
            color={statusColorMap[wsStatus]}
            icon={wsStatus === 'connecting' ? <SyncOutlined spin /> : undefined}
          >
            {statusText}
          </Tag>
        </div>
      }
    >
      <VoiceRecorderBar
        isRecording={isRecording}
        isSupported={isVoiceAsrAvailable()}
        voiceDraft={voiceDraft}
        justSent={justSent}
        idleHint={getVoiceAsrModeLabel()}
        useCloudAsr={shouldUseCloudAsr()}
      />

      {voiceHint ? (
        <Typography.Text type="warning" className="chat-card__voice-env-hint">
          {voiceHint}
        </Typography.Text>
      ) : null}

      <div className="chat-card__messages chat-scroll" ref={scrollRef}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              className={`chat-bubble-row ${isUser ? 'chat-bubble-row--user' : ''}`}
              key={msg.id}
            >
              <Avatar className={`chat-bubble__avatar chat-bubble__avatar--${msg.role}`}>
                {roleLabelMap[msg.role]}
              </Avatar>
              <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : ''}`}>
                <Typography.Paragraph className="chat-bubble__content">
                  {msg.content}
                </Typography.Paragraph>
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

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div className="chat-card__composer">
          <div className="chat-card__mic-wrap">
            <Tooltip title="按住说话，松手发送（可在按钮外松手）">
              <Button
                htmlType="button"
                className={
                  isRecording ? 'chat-card__mic chat-card__mic--active' : 'chat-card__mic'
                }
                icon={<AudioOutlined />}
                onPointerDown={handleMicPointerDown}
                onPointerCancel={cancelRecording}
                onContextMenu={(event) => event.preventDefault()}
              />
            </Tooltip>
            {isRecording ? <span className="chat-card__mic-label">松手发送</span> : null}
          </div>

          <TextArea
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="chat-card__textarea"
            placeholder={isRecording ? '正在听您说话…' : '输入您的问题...'}
            value={inputText}
            onChange={(event) => setInputText(event.target.value, resolvedSceneId)}
            onPressEnter={(event) => {
              if (event.shiftKey) return
              event.preventDefault()
              void handleSend()
            }}
          />

          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={isSending}
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || isRecording}
          >
            发送
          </Button>
        </div>

        <Typography.Text className="chat-card__hint" type="secondary">
          回车发送，Shift+回车换行。按住麦克风说话，在页面任意位置松手即发送。
        </Typography.Text>
      </Space>
    </Card>
  )
}

export default ChatPanel
