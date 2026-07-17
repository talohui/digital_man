import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildMockGuideResponse } from './GuideMockResponder'
import {
  GUIDE_BROWSE_CONVERSATION_KEY,
  resolveGuideConversationKey
} from './guideConversation'
import type {
  GuideContext,
  GuideMessage,
  GuideSessionStatus,
  ScenicRouteId,
  UserTravelPreferences
} from './GuideMessageSchema'
import { guideSessionStorage } from './guideSessionPersistence'

const emptyContext: GuideContext = {
  page: 'browse',
  pathname: '/map-3d-guide-c',
  presentation: 'ink2d',
  location: { available: false }
}

function newId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
}

/** Stable empty reference for selectors; callers must treat session history as read-only. */
export const EMPTY_GUIDE_MESSAGES: GuideMessage[] = []

type PersistedGuideSession = Partial<Pick<GuideSessionStore,
  | 'sessionId'
  | 'context'
  | 'preferences'
  | 'recommendedRouteIds'
  | 'sourceRouteId'
  | 'isDrawerOpen'
  | 'continuedRecommendationRouteIds'
  | 'messagesByConversation'
  | 'legacyMessages'
  | 'activeConversationKey'
  | 'initializedConversationKeys'
>> & {
  /** Flat messages written by versions before conversations were introduced. */
  messages?: GuideMessage[]
}

export type GuideSessionStore = {
  sessionId: string
  messagesByConversation: Record<string, GuideMessage[]>
  /** Archived pre-thread history. It is intentionally never used by a live thread. */
  legacyMessages: GuideMessage[]
  activeConversationKey: string
  initializedConversationKeys: string[]
  context: GuideContext
  preferences: UserTravelPreferences
  recommendedRouteIds: ScenicRouteId[]
  sourceRouteId?: ScenicRouteId
  isDrawerOpen: boolean
  status: GuideSessionStatus
  continuedRecommendationRouteIds: ScenicRouteId[]
  ensureSessionId: () => string
  setContext: (context: GuideContext) => void
  setDrawerOpen: (isDrawerOpen: boolean) => void
  setStatus: (status: GuideSessionStatus) => void
  getMessagesForConversation: (conversationKey?: string) => GuideMessage[]
  appendMessage: (
    message: Omit<GuideMessage, 'id' | 'createdAt' | 'conversationKey'>,
    conversationKey?: string
  ) => GuideMessage
  /** Backwards-compatible alias for UI actions that append to the active thread. */
  addMessage: (
    message: Omit<GuideMessage, 'id' | 'createdAt' | 'conversationKey'>,
    conversationKey?: string
  ) => GuideMessage
  initializeConversation: (conversationKey: string, greeting: string) => boolean
  clearConversation: (conversationKey?: string) => void
  getConversationDebug: () => {
    activeConversationKey: string
    activeMessageCount: number
    knownConversationKeys: string[]
    pageType: GuideContext['page']
    routeId?: ScenicRouteId
    poiId?: string
  }
  sendGuideMessage: (text: string, conversationKey?: string) => Promise<void>
  markRecommendedRouteOpened: (routeId: ScenicRouteId) => void
  resetGuideSession: () => void
}

const initialPreferences: UserTravelPreferences = { interests: [] }

function mergeMessage(
  messagesByConversation: Record<string, GuideMessage[]>,
  conversationKey: string,
  message: GuideMessage
) {
  return {
    ...messagesByConversation,
    [conversationKey]: [...(messagesByConversation[conversationKey] ?? EMPTY_GUIDE_MESSAGES), message]
  }
}

export const useGuideSessionStore = create<GuideSessionStore>()(
  persist(
    (set, get) => ({
      sessionId: '',
      messagesByConversation: {},
      legacyMessages: [],
      activeConversationKey: GUIDE_BROWSE_CONVERSATION_KEY,
      initializedConversationKeys: [],
      context: emptyContext,
      preferences: initialPreferences,
      recommendedRouteIds: [],
      sourceRouteId: undefined,
      isDrawerOpen: false,
      status: 'idle',
      continuedRecommendationRouteIds: [],
      ensureSessionId: () => {
        const existing = get().sessionId
        if (existing) return existing
        const sessionId = newId('guide')
        set({ sessionId })
        return sessionId
      },
      setContext: (context) => set({
        context,
        activeConversationKey: resolveGuideConversationKey(context),
        // A pending response in a different conversation must not animate this page.
        status: 'idle'
      }),
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
      setStatus: (status) => set({ status }),
      getMessagesForConversation: (conversationKey = get().activeConversationKey) =>
        get().messagesByConversation[conversationKey] ?? EMPTY_GUIDE_MESSAGES,
      appendMessage: (input, requestedConversationKey) => {
        const conversationKey = requestedConversationKey ?? get().activeConversationKey
        const message: GuideMessage = {
          ...input,
          conversationKey,
          id: newId('message'),
          createdAt: Date.now()
        }
        set((state) => ({
          messagesByConversation: mergeMessage(state.messagesByConversation, conversationKey, message)
        }))
        return message
      },
      addMessage: (input, conversationKey) => get().appendMessage(input, conversationKey),
      initializeConversation: (conversationKey, greeting) => {
        if (get().initializedConversationKeys.includes(conversationKey)) return false
        get().appendMessage({ role: 'assistant', text: greeting, status: 'complete' }, conversationKey)
        set((state) => ({
          initializedConversationKeys: [...state.initializedConversationKeys, conversationKey]
        }))
        return true
      },
      clearConversation: (conversationKey = get().activeConversationKey) =>
        set((state) => ({
          messagesByConversation: { ...state.messagesByConversation, [conversationKey]: [] },
          initializedConversationKeys: state.initializedConversationKeys.filter((key) => key !== conversationKey)
        })),
      getConversationDebug: () => {
        const state = get()
        return {
          activeConversationKey: state.activeConversationKey,
          activeMessageCount: state.messagesByConversation[state.activeConversationKey]?.length ?? 0,
          knownConversationKeys: Object.keys(state.messagesByConversation),
          pageType: state.context.page,
          routeId: state.context.routeId,
          poiId: state.context.selectedPoiId
        }
      },
      sendGuideMessage: async (rawText, requestedConversationKey) => {
        const text = rawText.trim()
        if (!text) return
        const stateAtSend = get()
        const conversationKey = requestedConversationKey ?? stateAtSend.activeConversationKey
        const contextAtSend = stateAtSend.context
        const preferencesAtSend = stateAtSend.preferences
        stateAtSend.ensureSessionId()
        stateAtSend.appendMessage({ role: 'user', text, status: 'complete' }, conversationKey)
        if (get().activeConversationKey === conversationKey) set({ status: 'thinking' })
        await new Promise((resolve) => globalThis.setTimeout(resolve, 240))
        const result = buildMockGuideResponse(text, contextAtSend, preferencesAtSend)
        get().appendMessage(result.message, conversationKey)
        set((current) => ({
          status: current.activeConversationKey === conversationKey ? 'idle' : current.status,
          preferences: result.preferences ?? current.preferences,
          recommendedRouteIds: (result.recommendedRouteIds ?? current.recommendedRouteIds) as ScenicRouteId[]
        }))
      },
      markRecommendedRouteOpened: (routeId) => set({ sourceRouteId: routeId }),
      resetGuideSession: () =>
        set({
          sessionId: newId('guide'),
          messagesByConversation: {},
          context: emptyContext,
          preferences: initialPreferences,
          recommendedRouteIds: [],
          sourceRouteId: undefined,
          isDrawerOpen: false,
          status: 'idle',
          continuedRecommendationRouteIds: [],
          activeConversationKey: GUIDE_BROWSE_CONVERSATION_KEY,
          initializedConversationKeys: []
        })
    }),
    {
      name: 'lingshan-guide-session-v1',
      storage: guideSessionStorage,
      version: 2,
      migrate: (persistedState) => {
        const persisted = persistedState as PersistedGuideSession
        const messagesByConversation = persisted.messagesByConversation ?? {}
        const legacyMessages = persisted.legacyMessages ?? (Array.isArray(persisted.messages) ? persisted.messages : [])
        return {
          ...persisted,
          messagesByConversation,
          legacyMessages,
          activeConversationKey: persisted.activeConversationKey ?? GUIDE_BROWSE_CONVERSATION_KEY,
          initializedConversationKeys: persisted.initializedConversationKeys ?? Object.keys(messagesByConversation)
        }
      },
      partialize: (state) => ({
        sessionId: state.sessionId,
        messagesByConversation: state.messagesByConversation,
        legacyMessages: state.legacyMessages,
        activeConversationKey: state.activeConversationKey,
        initializedConversationKeys: state.initializedConversationKeys,
        context: state.context,
        preferences: state.preferences,
        recommendedRouteIds: state.recommendedRouteIds,
        sourceRouteId: state.sourceRouteId,
        isDrawerOpen: state.isDrawerOpen,
        continuedRecommendationRouteIds: state.continuedRecommendationRouteIds
      })
    }
  )
)
