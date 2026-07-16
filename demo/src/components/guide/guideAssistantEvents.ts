export type GuideAssistantMode = 'browse' | 'route' | 'poi'

export type GuideAssistantOpenRequest = {
  mode?: GuideAssistantMode
  autoPrompt?: string
  autoResponse?: string
}

const GUIDE_ASSISTANT_OPEN_EVENT = 'lingshan:guide-assistant-open'
const GUIDE_ASSISTANT_CLOSE_EVENT = 'lingshan:guide-assistant-close'
const GUIDE_ASSISTANT_COMPANION_SUPPRESSION_EVENT = 'lingshan:guide-assistant-companion-suppression'

/**
 * Temporary UI bridge. Guide Core will replace this event adapter with its
 * session store and context bridge without changing page-level trigger copy.
 */
export function openGlobalXiaoling(request: GuideAssistantOpenRequest = {}) {
  window.dispatchEvent(new CustomEvent<GuideAssistantOpenRequest>(GUIDE_ASSISTANT_OPEN_EVENT, { detail: request }))
}

export function closeGlobalXiaoling() {
  window.dispatchEvent(new Event(GUIDE_ASSISTANT_CLOSE_EVENT))
}

export function setGlobalXiaolingCompanionSuppressed(suppressed: boolean) {
  window.dispatchEvent(new CustomEvent(GUIDE_ASSISTANT_COMPANION_SUPPRESSION_EVENT, { detail: { suppressed } }))
}

export const guideAssistantEvents = {
  open: GUIDE_ASSISTANT_OPEN_EVENT,
  close: GUIDE_ASSISTANT_CLOSE_EVENT,
  companionSuppression: GUIDE_ASSISTANT_COMPANION_SUPPRESSION_EVENT
} as const
