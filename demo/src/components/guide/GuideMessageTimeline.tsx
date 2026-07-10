import { GuideActionCardRenderer, type GuideUiMockCard } from './GuideActionCardRenderer'

export type GuideUiMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
  card?: GuideUiMockCard
}

export function GuideMessageTimeline({
  messages,
  onOpenRoute
}: {
  messages: GuideUiMessage[]
  onOpenRoute: (routeId: string) => void
}) {
  return (
    <div className="guide-message-timeline" aria-live="polite">
      {messages.map((message) => (
        <article key={message.id} className={`guide-message guide-message--${message.role}`}>
          <p>{message.text}</p>
          {message.card ? <GuideActionCardRenderer card={message.card} onOpenRoute={onOpenRoute} /> : null}
        </article>
      ))}
    </div>
  )
}
