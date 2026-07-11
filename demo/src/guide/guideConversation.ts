import type { GuideContext } from './GuideMessageSchema'

export const GUIDE_BROWSE_CONVERSATION_KEY = 'browse'

/**
 * Conversation ownership follows the durable page identity, never the last
 * rendered page. Route stages intentionally share one route conversation.
 */
export function resolveGuideConversationKey(context: GuideContext): string {
  if (context.page === 'route' && context.routeId) {
    return `route:${context.routeId}`
  }

  if (context.page === 'poi' && context.selectedPoiId) {
    return `poi:${context.selectedPoiId}`
  }

  return GUIDE_BROWSE_CONVERSATION_KEY
}
