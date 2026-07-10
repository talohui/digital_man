import { useEffect, useRef } from 'react'

import { DigitalHumanStage, type DigitalHumanStatus } from './DigitalHumanStage'
import { GuideInputComposer } from './GuideInputComposer'
import { GuideMessageTimeline, type GuideUiMessage } from './GuideMessageTimeline'
import type { GuideAssistantMode } from './guideAssistantEvents'

export function XiaolingGuideDrawer({
  open,
  mode,
  summary,
  messages,
  input,
  status,
  onClose,
  onInputChange,
  onSend,
  onOpenRoute
}: {
  open: boolean
  mode: GuideAssistantMode
  summary: string
  messages: GuideUiMessage[]
  input: string
  status: DigitalHumanStatus
  onClose: () => void
  onInputChange: (value: string) => void
  onSend: () => void
  onOpenRoute: (routeId: string) => void
}) {
  const dragStartYRef = useRef<number | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  if (!open) return null

  return (
    <section className="guide-drawer-layer" role="dialog" aria-modal="true" aria-label="小灵导览">
      <button type="button" className="guide-drawer-layer__scrim" aria-label="关闭小灵导览" onClick={onClose} />
      <section
        className="guide-drawer"
      >
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
        <header className="guide-drawer__header">
          <div>
            <strong>小灵导览</strong>
            <p>{summary}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <DigitalHumanStage status={status} compact={messages.length > 4} />
        <div className="guide-drawer__conversation" ref={timelineRef}>
          <GuideMessageTimeline messages={messages} onOpenRoute={onOpenRoute} />
        </div>
        <GuideInputComposer value={input} onChange={onInputChange} onSubmit={onSend} />
      </section>
    </section>
  )
}
