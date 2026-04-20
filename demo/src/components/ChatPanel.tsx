import { useEffect, useMemo, useRef } from 'react'
import {
  AudioOutlined,
  DisconnectOutlined,
  SendOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Avatar, Button, Card, Input, Space, Tag, Tooltip, Typography, message as antdMessage } from 'antd'
import { useChatStore } from '../store/useChatStore'
import { createAsr, isSupported as isAsrSupported, type BrowserAsr } from '../lib/browserAsr'

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

function ChatPanel() {
  const messages = useChatStore((state) => state.messages)
  const inputText = useChatStore((state) => state.inputText)
  const isRecording = useChatStore((state) => state.isRecording)
  const wsStatus = useChatStore((state) => state.wsStatus)
  const isSending = useChatStore((state) => state.isSending)
  const setInputText = useChatStore((state) => state.setInputText)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const startRecord = useChatStore((state) => state.startRecord)
  const stopRecord = useChatStore((state) => state.stopRecord)
  const lastError = useChatStore((state) => state.lastError)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const asrRef = useRef<BrowserAsr | null>(null)

  // 创建一次 ASR 会话工厂(每次按下都新建,因为浏览器 SR 实例不可复用)
  const beginRecord = () => {
    if (!isAsrSupported) {
      void antdMessage.warning('当前浏览器不支持语音识别,请使用 Chrome / Edge,或直接打字。')
      return
    }
    if (asrRef.current) return // 已经在录
    startRecord()
    asrRef.current = createAsr({
      onFinal: (text) => {
        asrRef.current = null
        void sendMessage(text)
      },
      onError: (msg) => {
        asrRef.current = null
        stopRecord()
        void antdMessage.error(msg)
      }
    })
    asrRef.current.start()
  }

  const endRecord = () => {
    if (!asrRef.current) return
    stopRecord()
    asrRef.current.stop()
  }

  useEffect(() => {
    const container = scrollRef.current

    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight
  }, [messages])

  const statusText = useMemo(() => {
    if (isRecording) {
      return '录音中'
    }

    if (wsStatus === 'connected') {
      return '已连接'
    }

    if (wsStatus === 'connecting') {
      return '连接中'
    }

    if (wsStatus === 'error') {
      return '连接异常'
    }

    return '未连接'
  }, [isRecording, wsStatus])

  const handleSend = async () => {
    await sendMessage(inputText)
  }

  return (
    <Card
      className="chat-card"
      bordered={false}
      title={
        <div className="chat-card__titlebar">
          <div>
            <Typography.Text className="section-kicker">
              对话窗口
            </Typography.Text>
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
      <div className="chat-card__messages chat-scroll" ref={scrollRef}>
        {messages.map((message) => {
          const isUser = message.role === 'user'

          return (
            <div
              className={`chat-bubble-row ${isUser ? 'chat-bubble-row--user' : ''}`}
              key={message.id}
            >
              <Avatar className={`chat-bubble__avatar chat-bubble__avatar--${message.role}`}>
                {roleLabelMap[message.role]}
              </Avatar>

              <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : ''}`}>
                <Typography.Paragraph className="chat-bubble__content">
                  {message.content}
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
          <Tooltip title="按住说话">
            <Button
              className={isRecording ? 'chat-card__mic chat-card__mic--active' : 'chat-card__mic'}
              icon={<AudioOutlined />}
              onMouseDown={beginRecord}
              onMouseUp={endRecord}
              onMouseLeave={isRecording ? endRecord : undefined}
              onTouchStart={beginRecord}
              onTouchEnd={endRecord}
            />
          </Tooltip>

          <TextArea
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="chat-card__textarea"
            placeholder="输入您的问题..."
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onPressEnter={(event) => {
              if (event.shiftKey) {
                return
              }

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
            disabled={!inputText.trim()}
          >
            发送
          </Button>
        </div>

        <Typography.Text className="chat-card__hint">
          回车发送，Shift + 回车换行。按住麦克风按钮说话，松开后自动识别并发送。
        </Typography.Text>
      </Space>
    </Card>
  )
}

export default ChatPanel
