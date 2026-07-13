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
          className={`chat-bubble-row chat-bubble-row--${message.role} guide-message guide-message--${message.role}${message.ui ? ' guide-message--with-card' : ''}`}
        >
          <div className={`chat-bubble chat-bubble--${message.role}`}>
            <p>{message.text}</p>
          </div>
          {message.ui ? (
            <div className="guide-message__structured">
              <GuideActionCardRenderer payload={message.ui} onAction={onAction} />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
