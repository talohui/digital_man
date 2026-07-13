import { useEffect, useRef, useState, type FormEvent } from 'react'

import type { GuideAction, GuideMessage } from '../../guide'
import { useXiaolingRuntime } from '../../guide/runtime/useXiaolingRuntime'
import Live2DStage from '../Live2DStage'
import { GuideMessageTimeline } from './GuideMessageTimeline'

type SurfaceMode = 'drawer' | 'fullscreen'

const connectionLabels = {
  idle: '语音服务待命',
  connecting: '正在连接语音服务',
  connected: '语音服务已连接',
  disconnected: '文字导览可正常使用',
  error: '语音暂不可用，文字导览正常'
} as const

export function XiaolingConversationSurface({
  mode,
  title,
  subtitle,
  messages,
  suggestedQuestions,
  input,
  onInputChange,
  onSend,
  onSuggestedQuestion,
  onAction,
  onClose,
  onFullscreen,
  onOpenMap,
  backgroundMedia
}: {
  mode: SurfaceMode
  title: string
  subtitle: string
  messages: GuideMessage[]
  suggestedQuestions: string[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onSuggestedQuestion: (question: string) => void
  onAction: (action: GuideAction) => void
  onClose: () => void
  onFullscreen?: () => void
  onOpenMap?: () => void
  backgroundMedia?: { src: string; alt: string }
}) {
  const runtime = useXiaolingRuntime()
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const shouldFollowRef = useRef(true)
  const didInitialScrollRef = useRef(false)

  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return
    if (!didInitialScrollRef.current) {
      timeline.scrollTop = timeline.scrollHeight
      didInitialScrollRef.current = true
      return
    }
    if (shouldFollowRef.current) timeline.scrollTo({ top: timeline.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    shouldFollowRef.current = true
    onSend()
  }

  const content = (
    <main className={`immersive-guide xiaoling-conversation xiaoling-conversation--${mode}`}>
      <ScenicBackdrop media={backgroundMedia} enabled={mode === 'drawer'} />
      <div className="immersive-guide__aura immersive-guide__aura--left" />
      <div className="immersive-guide__aura immersive-guide__aura--right" />

      <div className="xiaoling-conversation__handle" aria-hidden="true" />

      <header className="immersive-guide__topbar xiaoling-conversation__topbar">
        <button type="button" className="xiaoling-conversation__round-action" onClick={onClose} aria-label={mode === 'drawer' ? '关闭小灵' : '返回'}>
          {mode === 'drawer' ? '×' : '‹'}
        </button>
        <div>
          <span>{subtitle}</span>
          <strong>{title}</strong>
        </div>
        {mode === 'drawer' && onFullscreen ? (
          <button type="button" className="xiaoling-conversation__text-action" onClick={onFullscreen}>全屏</button>
        ) : (
          <button type="button" className="xiaoling-conversation__text-action" onClick={onOpenMap}>地图</button>
        )}
      </header>

      <div className={`immersive-guide__status xiaoling-conversation__status xiaoling-conversation__status--${runtime.connectionState}`}>
        <span aria-hidden="true" />
        {connectionLabels[runtime.connectionState]}
      </div>

      <section className="immersive-guide__avatar xiaoling-conversation__avatar" aria-label="小灵数字人">
        <Live2DStage
          variant="immersive"
          eager
          sceneId={runtime.sceneId}
          robotStateOverride={runtime.robotState}
          mouthOpenOverride={runtime.mouthOpen}
          mouthFormOverride={runtime.mouthForm}
        />
      </section>

      <section className="immersive-guide__chat xiaoling-conversation__chat" aria-label="与小灵对话">
        {suggestedQuestions.length ? (
          <div className="quick-asks-card__list xiaoling-conversation__quick-asks" aria-label="推荐提问">
            {suggestedQuestions.map((question) => (
              <button key={question} type="button" onClick={() => {
                shouldFollowRef.current = true
                onSuggestedQuestion(question)
              }}>
                {question}
              </button>
            ))}
          </div>
        ) : null}
        <div
          ref={timelineRef}
          className="chat-card__messages xiaoling-conversation__messages"
          onScroll={(event) => {
            const element = event.currentTarget
            shouldFollowRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 96
          }}
        >
          <GuideMessageTimeline messages={messages} onAction={onAction} />
        </div>
        <form className="chat-card__composer-stack" onSubmit={submit}>
          <div className="chat-card__composer">
            <span className="chat-card__mic-wrap">
              <button type="button" className="chat-card__mic" disabled aria-label="语音输入暂未接入" title="语音输入建设中">◎</button>
            </span>
            <textarea
              className="chat-card__textarea"
              rows={1}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
                event.preventDefault()
                shouldFollowRef.current = true
                onSend()
              }}
              placeholder="问小灵路线、景点或服务"
              aria-label="输入问题"
            />
            <button type="submit" className="chat-card__send" disabled={!input.trim()} aria-label="发送">
              <span aria-hidden="true">↑</span><span className="chat-card__send-label">发送</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  )

  if (mode === 'fullscreen') return content
  return (
    <section className="guide-drawer-layer" role="dialog" aria-modal="true" aria-label="小灵导览">
      <button type="button" className="guide-drawer-layer__scrim" aria-label="关闭小灵导览" onClick={onClose} />
      {content}
    </section>
  )
}

function ScenicBackdrop({
  media,
  enabled
}: {
  media?: { src: string; alt: string }
  enabled: boolean
}) {
  const [current, setCurrent] = useState(media ?? null)
  const [previous, setPrevious] = useState<typeof media | null>(null)
  const [visible, setVisible] = useState(true)
  const currentRef = useRef(media ?? null)

  useEffect(() => {
    if (!media || media.src === currentRef.current?.src) return undefined
    setPrevious(currentRef.current)
    currentRef.current = media
    setCurrent(media)
    setVisible(false)
    let revealFrame = 0
    const frame = window.requestAnimationFrame(() => {
      revealFrame = window.requestAnimationFrame(() => setVisible(true))
    })
    const timer = window.setTimeout(() => setPrevious(null), 380)
    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(revealFrame)
      window.clearTimeout(timer)
    }
  }, [media?.alt, media?.src])

  if (!enabled || !current) return null

  return (
    <div className="xiaoling-conversation__scenic-backdrop" aria-hidden="true">
      {previous ? <img className="is-previous" src={previous.src} alt="" /> : null}
      <img className={visible ? 'is-visible' : ''} src={current.src} alt="" title={current.alt} />
      <span />
    </div>
  )
}
