import type { GuideAction, GuideMessage } from '../../guide'
import type { GuideAssistantMode } from './guideAssistantEvents'
import { XiaolingConversationSurface } from './XiaolingConversationSurface'

export function XiaolingGuideDrawer({
  open,
  mode,
  title,
  summary,
  suggestedQuestions,
  messages,
  input,
  onClose,
  onInputChange,
  onSend,
  onSuggestedQuestion,
  onAction
}: {
  open: boolean
  mode: GuideAssistantMode
  title: string
  summary: string
  suggestedQuestions: string[]
  messages: GuideMessage[]
  input: string
  onClose: () => void
  onInputChange: (value: string) => void
  onSend: () => void
  onSuggestedQuestion: (question: string) => void
  onAction: (action: GuideAction) => void
}) {
  if (!open) return null
  return (
    <XiaolingConversationSurface
      layout="drawer"
      mode={mode}
      title={title}
      subtitle={summary}
      suggestedQuestions={suggestedQuestions}
      messages={messages}
      input={input}
      onClose={onClose}
      onInputChange={onInputChange}
      onSend={onSend}
      onSuggestedQuestion={onSuggestedQuestion}
      onAction={onAction}
    />
  )
}
