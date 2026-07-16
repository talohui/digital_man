import { useEffect, useRef, useState, type FormEvent } from 'react'

import type { GuideAction, GuideMessage } from '../../guide'
import { useXiaolingRuntime } from '../../guide/runtime/useXiaolingRuntime'
import { GuideMessageTimeline } from './GuideMessageTimeline'
import type { XiaolingDrawerBackground } from './resolveXiaolingDrawerBackground'

type SurfaceMode = 'drawer' | 'fullscreen'
type SurfaceLayout = 'companion' | 'reading'

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
  backgroundMedia?: XiaolingDrawerBackground
}) {
  const runtime = useXiaolingRuntime()
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const shouldFollowRef = useRef(true)
  const didInitialScrollRef = useRef(false)
  const hasUserMessage = messages.some((message) => message.role === 'user')
  const hadUserMessageRef = useRef(hasUserMessage)
  const [fullscreenLayout, setFullscreenLayout] = useState<SurfaceLayout>(() => hasUserMessage ? 'reading' : 'companion')
  const [resolvedBackgroundUrl, setResolvedBackgroundUrl] = useState('')
  const surfaceLayout: SurfaceLayout = mode === 'drawer' ? 'reading' : fullscreenLayout

  useEffect(() => {
    if (mode !== 'fullscreen') {
      hadUserMessageRef.current = hasUserMessage
      return
    }

    if (!hasUserMessage) setFullscreenLayout('companion')
    else if (!hadUserMessageRef.current) setFullscreenLayout('reading')
    hadUserMessageRef.current = hasUserMessage
  }, [hasUserMessage, mode])

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
    if (mode === 'fullscreen') setFullscreenLayout('reading')
    onSend()
  }

  const debugBackgroundAttributes = import.meta.env.DEV && mode === 'drawer' && backgroundMedia
    ? {
        'data-xiaoling-background-key': backgroundMedia.key,
        'data-xiaoling-background-url': resolvedBackgroundUrl,
        'data-xiaoling-background-context-type': backgroundMedia.contextType
      }
    : {}

  const content = (
    <main
      className={`immersive-guide xiaoling-conversation xiaoling-conversation--${mode}`}
      data-xiaoling-layout={surfaceLayout}
      data-xiaoling-robot-state={runtime.robotState}
      {...debugBackgroundAttributes}
    >
      <ScenicBackdrop
        media={backgroundMedia}
        enabled={Boolean(backgroundMedia)}
        onResolved={(url) => setResolvedBackgroundUrl(url)}
      />
      <div className="xiaoling-conversation__handle" aria-hidden="true" />

      <header className="immersive-guide__topbar xiaoling-conversation__topbar">
        <button type="button" className="xiaoling-conversation__round-action" onClick={onClose} aria-label={mode === 'drawer' ? '关闭小灵' : '返回'}>
          {mode === 'drawer' ? '×' : '‹'}
        </button>
        <div className="xiaoling-conversation__heading">
          <span>{subtitle}</span>
          <strong>{title}</strong>
        </div>
        <div className="xiaoling-conversation__topbar-actions">
          {mode === 'fullscreen' ? (
            <button
              type="button"
              className="xiaoling-conversation__layout-action"
              aria-pressed={surfaceLayout === 'companion'}
              onClick={() => setFullscreenLayout((current) => current === 'reading' ? 'companion' : 'reading')}
            >
              {surfaceLayout === 'reading' ? '看小灵' : '看对话'}
            </button>
          ) : null}
          {mode === 'drawer' && onFullscreen ? (
            <button type="button" className="xiaoling-conversation__text-action" onClick={onFullscreen}>全屏</button>
          ) : (
            <button type="button" className="xiaoling-conversation__text-action" onClick={onOpenMap}>地图</button>
          )}
        </div>
      </header>

      <div className={`immersive-guide__status xiaoling-conversation__status xiaoling-conversation__status--${runtime.connectionState}`}>
        <span aria-hidden="true" />
        {connectionLabels[runtime.connectionState]}
      </div>

      <section
        className="immersive-guide__avatar xiaoling-conversation__avatar"
        aria-label="小灵数字人"
        data-xiaoling-live2d-anchor={mode}
      />

      <section className="immersive-guide__chat xiaoling-conversation__chat" aria-label="与小灵对话">
        {suggestedQuestions.length ? (
          <div className="quick-asks-card__list xiaoling-conversation__quick-asks" aria-label="推荐提问">
            {suggestedQuestions.map((question) => (
              <button key={question} type="button" onClick={() => {
                shouldFollowRef.current = true
                if (mode === 'fullscreen') setFullscreenLayout('reading')
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
          data-guide-message-scroll="true"
          onTouchStart={() => {
            shouldFollowRef.current = false
          }}
          onWheel={() => {
            shouldFollowRef.current = false
          }}
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
  enabled,
  onResolved
}: {
  media?: XiaolingDrawerBackground
  enabled: boolean
  onResolved: (url: string) => void
}) {
  type LoadedBackground = { key: string; src: string; alt: string }
  const [current, setCurrent] = useState<LoadedBackground | null>(null)
  const [incoming, setIncoming] = useState<LoadedBackground | null>(null)
  const [incomingVisible, setIncomingVisible] = useState(false)
  const currentRef = useRef<LoadedBackground | null>(null)
  const onResolvedRef = useRef(onResolved)

  useEffect(() => {
    onResolvedRef.current = onResolved
  }, [onResolved])

  useEffect(() => {
    if (!enabled || !media) return undefined
    let cancelled = false
    let preloadImage: HTMLImageElement | null = null
    let revealFrame = 0
    let secondRevealFrame = 0
    let swapTimer = 0

    setIncoming(null)
    setIncomingVisible(false)

    const loadCandidate = (index: number) => {
      const src = media.candidates[index]
      if (!src) return
      if (currentRef.current?.src === src) {
        currentRef.current = { ...currentRef.current, key: media.key, alt: media.alt }
        setCurrent(currentRef.current)
        onResolvedRef.current(src)
        return
      }

      preloadImage = new Image()
      preloadImage.onload = () => {
        if (cancelled) return
        const loaded = { key: media.key, src, alt: media.alt }
        if (!currentRef.current) {
          currentRef.current = loaded
          setCurrent(loaded)
          onResolvedRef.current(src)
          return
        }

        setIncoming(loaded)
        revealFrame = window.requestAnimationFrame(() => {
          secondRevealFrame = window.requestAnimationFrame(() => setIncomingVisible(true))
        })
        swapTimer = window.setTimeout(() => {
          if (cancelled) return
          currentRef.current = loaded
          setCurrent(loaded)
          setIncoming(null)
          setIncomingVisible(false)
          onResolvedRef.current(src)
        }, 360)
      }
      preloadImage.onerror = () => {
        if (!cancelled) loadCandidate(index + 1)
      }
      preloadImage.src = src
    }

    loadCandidate(0)
    return () => {
      window.cancelAnimationFrame(revealFrame)
      window.cancelAnimationFrame(secondRevealFrame)
      window.clearTimeout(swapTimer)
      cancelled = true
      if (preloadImage) {
        preloadImage.onload = null
        preloadImage.onerror = null
      }
    }
  }, [enabled, media])

  if (!enabled) return null

  return (
    <div className="xiaoling-conversation__scenic-backdrop" aria-hidden="true">
      {current ? (
        <img
          className={`is-current${incomingVisible ? ' is-fading' : ''}`}
          src={current.src}
          alt=""
          title={current.alt}
        />
      ) : null}
      {incoming ? (
        <img
          className={`is-incoming${incomingVisible ? ' is-visible' : ''}`}
          src={incoming.src}
          alt=""
          title={incoming.alt}
        />
      ) : null}
    </div>
  )
}
