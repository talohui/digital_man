import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchGuideRecommendations } from '../api/guide'
import {
  DEFAULT_GUIDE_PREFERENCES,
  GUIDE_TAGS,
  buildLocalGuideRecommendations,
  getDefaultSpotId,
  getGuideRouteById,
  type GuidePreferenceContext,
  type GuidePreferenceKey,
  type GuideRecommendationCard,
  type UserProfileSnapshot
} from '../data/guideData'

type GuideState = {
  userId: string
  sessionId: string
  selectedTags: string[]
  guidePreferences: GuidePreferenceContext
  candidateRoutes: GuideRecommendationCard[]
  userProfile: UserProfileSnapshot | null
  activeRouteId: string
  selectedSpotId: string
  // 轻量当日轨迹：已到达 / 已听讲解的站点（仅用于行程回顾展示，不参与推荐计算）
  visitedStops: string[]
  listenedStops: string[]
  // 每个场景的会话轮换序号：清空当前会话时 +1，叠加进 Fay username 形成新的匿名会话段，
  // 使 Fay 按新 username 查不到旧历史 ⇒ 上下文真正清空。
  conversationEpochs: Record<string, number>
  isLoading: boolean
  lastError: string
  ensureUserId: () => string
  ensureSessionId: () => string
  bumpConversationEpoch: (sceneId: string) => void
  toggleTag: (tag: string) => void
  setGuidePreference: (key: GuidePreferenceKey, value: string) => void
  refreshRecommendations: () => Promise<void>
  setActiveRouteId: (routeId: string) => void
  setSelectedSpotId: (spotId: string) => void
  markStopVisited: (spotId: string) => void
  markStopListened: (spotId: string) => void
}

function createGuestUserId() {
  return `guest-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

function createSessionId() {
  return `sess-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

const defaultRoutes = buildLocalGuideRecommendations([], DEFAULT_GUIDE_PREFERENCES)
const defaultRouteId = defaultRoutes[0]?.id ?? 'historical_culture'

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      userId: '',
      sessionId: '',
      selectedTags: ['祈福静心'],
      guidePreferences: DEFAULT_GUIDE_PREFERENCES,
      candidateRoutes: defaultRoutes,
      userProfile: null,
      activeRouteId: defaultRouteId,
      selectedSpotId: getDefaultSpotId(defaultRouteId),
      visitedStops: [],
      listenedStops: [],
      conversationEpochs: {},
      isLoading: false,
      lastError: '',
      ensureUserId: () => {
        const existing = get().userId.trim()

        if (existing) {
          return existing
        }

        const nextUserId = createGuestUserId()
        set({ userId: nextUserId })
        return nextUserId
      },
      ensureSessionId: () => {
        const existing = get().sessionId.trim()
        if (existing) return existing
        const next = createSessionId()
        set({ sessionId: next })
        return next
      },
      bumpConversationEpoch: (sceneId) =>
        set((state) => ({
          conversationEpochs: {
            ...state.conversationEpochs,
            [sceneId]: (state.conversationEpochs[sceneId] ?? 0) + 1
          }
        })),
      toggleTag: (tag) => {
        if (!GUIDE_TAGS.includes(tag as (typeof GUIDE_TAGS)[number])) {
          return
        }

        set((state) => {
          const selectedTags = state.selectedTags.includes(tag)
            ? state.selectedTags.filter((item) => item !== tag)
            : [...state.selectedTags, tag]

          return { selectedTags }
        })
      },
      setGuidePreference: (key, value) =>
        set((state) => ({
          guidePreferences: {
            ...state.guidePreferences,
            [key]: value
          }
        })),
      refreshRecommendations: async () => {
        const userId = get().ensureUserId()
        const { selectedTags, guidePreferences, activeRouteId } = get()
        set({ isLoading: true, lastError: '' })


        try {
          const response = await fetchGuideRecommendations({ userId, selectedTags, preferences: guidePreferences })
          const nextRouteId =
            response.routes.some((route) => route.id === activeRouteId)
              ? activeRouteId
              : response.recommendedRouteId || response.routes[0]?.id || defaultRouteId

          set({
            candidateRoutes:
              response.routes.length > 0
                ? response.routes
                : buildLocalGuideRecommendations(selectedTags, guidePreferences),
            activeRouteId: nextRouteId,
            selectedSpotId: getDefaultSpotId(nextRouteId),
            isLoading: false,
            lastError: ''
          })
        } catch (error) {
          const fallbackRoutes = buildLocalGuideRecommendations(selectedTags, guidePreferences)
          const fallbackRouteId = fallbackRoutes[0]?.id ?? defaultRouteId
          const message = error instanceof Error ? error.message : '推荐服务暂时不可用'
          set({
            candidateRoutes: fallbackRoutes,
            activeRouteId: fallbackRouteId,
            selectedSpotId: getDefaultSpotId(fallbackRouteId),
            isLoading: false,
            lastError: message
          })
        }
      },
      setActiveRouteId: (routeId) => {
        const route = getGuideRouteById(routeId)
        set({
          activeRouteId: route.id,
          selectedSpotId: getDefaultSpotId(route.id)
        })
      },
      setSelectedSpotId: (spotId) => set({ selectedSpotId: spotId }),
      markStopVisited: (spotId) =>
        set((state) =>
          !spotId || state.visitedStops.includes(spotId)
            ? state
            : { visitedStops: [...state.visitedStops, spotId] }
        ),
      markStopListened: (spotId) =>
        set((state) =>
          !spotId || state.listenedStops.includes(spotId)
            ? state
            : { listenedStops: [...state.listenedStops, spotId] }
        )
    }),
    {
      name: 'lingshan-guide-store',
      partialize: (state) => ({
        userId: state.userId,
        sessionId: state.sessionId,
        selectedTags: state.selectedTags,
        guidePreferences: state.guidePreferences,
        candidateRoutes: state.candidateRoutes,
        userProfile: state.userProfile,
        activeRouteId: state.activeRouteId,
        selectedSpotId: state.selectedSpotId,
        visitedStops: state.visitedStops,
        listenedStops: state.listenedStops,
        conversationEpochs: state.conversationEpochs
      })
    }
  )
)
