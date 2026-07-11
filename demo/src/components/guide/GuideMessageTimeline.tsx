import type { GuideAction, GuideMessage } from '../../guide'
import { GuideActionCardRenderer } from './GuideActionCardRenderer'

export function GuideMessageTimeline({
  messages,
  onAction
}: {
  messages: GuideMessage[]
  onAction: (action: GuideAction) => void
}) {
  return (
    <div className="guide-message-timeline" aria-live="polite">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`guide-message guide-message--${message.role}${message.ui ? ' guide-message--with-card' : ''}`}
        >
          <p>{message.text}</p>
          {message.ui ? <GuideActionCardRenderer payload={message.ui} onAction={onAction} /> : null}
        </article>
      ))}
    </div>
  )
}
