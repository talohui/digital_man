import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildMockGuideResponse } from './GuideMockResponder'
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

export type GuideSessionStore = {
  sessionId: string
  messages: GuideMessage[]
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
  addMessage: (message: Omit<GuideMessage, 'id' | 'createdAt'>) => GuideMessage
  sendGuideMessage: (text: string) => Promise<void>
  markRecommendedRouteOpened: (routeId: ScenicRouteId) => void
  resetGuideSession: () => void
}

const initialPreferences: UserTravelPreferences = { interests: [] }

export const useGuideSessionStore = create<GuideSessionStore>()(
  persist(
    (set, get) => ({
      sessionId: '',
      messages: [],
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
      setContext: (context) => set({ context }),
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
      setStatus: (status) => set({ status }),
      addMessage: (input) => {
        const message: GuideMessage = { ...input, id: newId('message'), createdAt: Date.now() }
        set((state) => ({ messages: [...state.messages, message] }))
        return message
      },
      sendGuideMessage: async (rawText) => {
        const text = rawText.trim()
        if (!text) return
        get().ensureSessionId()
        get().addMessage({ role: 'user', text, status: 'complete' })
        set({ status: 'thinking' })
        await new Promise((resolve) => globalThis.setTimeout(resolve, 240))
        const result = buildMockGuideResponse(text, get().context, get().preferences)
        get().addMessage(result.message)
        set({
          status: 'idle',
          preferences: result.preferences ?? get().preferences,
          recommendedRouteIds: (result.recommendedRouteIds ?? get().recommendedRouteIds) as ScenicRouteId[]
        })
      },
      markRecommendedRouteOpened: (routeId) => set({ sourceRouteId: routeId }),
      resetGuideSession: () =>
        set({
          sessionId: newId('guide'),
          messages: [],
          context: emptyContext,
          preferences: initialPreferences,
          recommendedRouteIds: [],
          sourceRouteId: undefined,
          isDrawerOpen: false,
          status: 'idle',
          continuedRecommendationRouteIds: []
        })
    }),
    {
      name: 'lingshan-guide-session-v1',
      storage: guideSessionStorage,
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages,
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
