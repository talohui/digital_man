import { useEffect, useRef } from 'react'
import Live2DStage from '../Live2DStage'
import type { GuideAction, GuideMessage } from '../../guide'
import { useXiaolingRuntime } from '../../guide/runtime/useXiaolingRuntime'
import { GuideInputComposer } from './GuideInputComposer'
import { GuideMessageTimeline } from './GuideMessageTimeline'
import type { GuideAssistantMode } from './guideAssistantEvents'

const connectionLabels = {
  idle: '语音服务待命',
  connecting: '语音服务连接中',
  connected: '语音服务已连接',
  disconnected: '文字导览可用',
  error: '文字导览可用'
} as const

export function XiaolingConversationSurface({
  layout,
  mode,
  title,
  subtitle,
  suggestedQuestions,
  messages,
  input,
  onClose,
  onInputChange,
  onSend,
  onSuggestedQuestion,
  onAction
}: {
  layout: 'drawer' | 'fullscreen'
  mode: GuideAssistantMode
  title: string
  subtitle: string
  suggestedQuestions: string[]
  messages: GuideMessage[]
  input: string
  onClose: () => void
  onInputChange: (value: string) => void
  onSend: () => void
  onSuggestedQuestion: (question: string) => void
  onAction: (action: GuideAction) => void
}) {
  const runtime = useXiaolingRuntime()
  const dragStartYRef = useRef<number | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const shouldFollowRef = useRef(true)

  useEffect(() => {
    if (!shouldFollowRef.current) return
    const timeline = timelineRef.current
    timeline?.scrollTo({ top: timeline.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <section
      className={`xiaoling-conversation-layer is-${layout}`}
      role={layout === 'drawer' ? 'dialog' : 'main'}
      aria-modal={layout === 'drawer' ? 'true' : undefined}
      aria-label="小灵导览"
      data-guide-page={mode}
    >
      {layout === 'drawer' ? (
        <button type="button" className="guide-drawer-layer__scrim" aria-label="关闭小灵导览" onClick={onClose} />
      ) : null}
      <section className={`guide-drawer xiaoling-conversation is-${layout}`}>
        {layout === 'drawer' ? (
          <div
            className="guide-drawer__handle"
            aria-hidden="true"
            onPointerDown={(event) => { dragStartYRef.current = event.clientY }}
            onPointerUp={(event) => {
              if (dragStartYRef.current !== null && event.clientY - dragStartYRef.current > 68) onClose()
              dragStartYRef.current = null
            }}
            onPointerCancel={() => { dragStartYRef.current = null }}
          />
        ) : null}
        <header className="guide-drawer__header xiaoling-conversation__header">
          <div>
            <span className="xiaoling-conversation__eyebrow">灵山智能导览员</span>
            <strong>{title}</strong>
            <p>{subtitle}</p>
          </div>
          <div className="xiaoling-conversation__header-actions">
            <span className={`xiaoling-conversation__connection is-${runtime.connectionState}`}>
              {connectionLabels[runtime.connectionState]}
            </span>
            <button type="button" onClick={onClose} aria-label={layout === 'fullscreen' ? '返回地图' : '关闭'}>
              {layout === 'fullscreen' ? '‹' : '×'}
            </button>
          </div>
        </header>
        <div className="xiaoling-conversation__stage">
          <Live2DStage
            variant="embedded"
            eager
            sceneId={runtime.sceneId}
            robotStateOverride={runtime.robotState}
            mouthOpenOverride={runtime.mouthOpen}
          />
        </div>
        {suggestedQuestions.length ? (
          <div className="guide-drawer__quick-prompts" aria-label="推荐提问">
            {suggestedQuestions.map((question) => (
              <button key={question} type="button" onClick={() => onSuggestedQuestion(question)}>
                {question}
              </button>
            ))}
          </div>
        ) : null}
        <div
          className="guide-drawer__conversation"
          ref={timelineRef}
          onScroll={(event) => {
            const element = event.currentTarget
            shouldFollowRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 72
          }}
        >
          <GuideMessageTimeline messages={messages} onAction={onAction} />
        </div>
        <GuideInputComposer value={input} onChange={onInputChange} onSubmit={onSend} />
      </section>
    </section>
  )
}
