import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchGuideRecommendations, fetchUserProfile } from '../api/guide'
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
import { readCachedConsent } from '../lib/privacyConsent'
import { getJourneyDateKey, recordJourneyStop } from '../lib/journeyTrail'

type GuideState = {
  userId: string
  sessionId: string
  selectedTags: string[]
  guidePreferences: GuidePreferenceContext
  candidateRoutes: GuideRecommendationCard[]
  routeAdjustmentReasons: string[]
  routeDataFreshness: Record<string, string>
  routeFallbackUsed: boolean
  recommendationSource: string
  userProfile: UserProfileSnapshot | null
  activeRouteId: string
  selectedSpotId: string
  // 轻量当日轨迹：已到达 / 已听讲解的站点（仅用于行程回顾展示，不参与推荐计算）
  journeyDate: string
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
  refreshUserProfile: () => Promise<void>
  setActiveRouteId: (routeId: string) => void
  setSelectedSpotId: (spotId: string) => void
  ensureCurrentJourney: () => void
  markStopVisited: (spotId: string) => void
  markStopListened: (spotId: string) => void
}

type PersistedGuideState = Pick<
  GuideState,
  | 'userId'
  | 'sessionId'
  | 'selectedTags'
  | 'guidePreferences'
  | 'candidateRoutes'
  | 'routeAdjustmentReasons'
  | 'routeDataFreshness'
  | 'routeFallbackUsed'
  | 'recommendationSource'
  | 'userProfile'
  | 'activeRouteId'
  | 'selectedSpotId'
  | 'journeyDate'
  | 'visitedStops'
  | 'listenedStops'
  | 'conversationEpochs'
>

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
      routeAdjustmentReasons: [],
      routeDataFreshness: {},
      routeFallbackUsed: false,
      recommendationSource: 'frontend-default',
      userProfile: null,
      activeRouteId: defaultRouteId,
      selectedSpotId: getDefaultSpotId(defaultRouteId),
      journeyDate: getJourneyDateKey(),
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
        const { personalizationEnabled } = readCachedConsent(userId)
        const effectiveTags = personalizationEnabled ? selectedTags : []
        const effectivePreferences = personalizationEnabled ? guidePreferences : DEFAULT_GUIDE_PREFERENCES
        set({ isLoading: true, lastError: '' })


        try {
          const response = await fetchGuideRecommendations({ userId, selectedTags: effectiveTags, preferences: effectivePreferences })
          const nextRouteId =
            response.routes.some((route) => route.id === activeRouteId)
              ? activeRouteId
              : response.recommendedRouteId || response.routes[0]?.id || defaultRouteId

          if (response.fallbackUsed && response.routes.length === 0) {
            set({
              candidateRoutes: [],
              routeAdjustmentReasons: response.adjustmentReasons ?? [],
              routeDataFreshness: response.dataFreshness ?? {},
              routeFallbackUsed: true,
              recommendationSource: response.recommendationSource ?? 'safety-constraints',
              isLoading: false,
              lastError: '暂无安全可用路线，请以现场工作人员指引为准'
            })
            return
          }

          set({
            candidateRoutes:
              response.routes.length > 0
                ? response.routes
                : buildLocalGuideRecommendations(effectiveTags, effectivePreferences),
            routeAdjustmentReasons: response.adjustmentReasons ?? [],
            routeDataFreshness: response.dataFreshness ?? {},
            routeFallbackUsed: response.fallbackUsed ?? false,
            recommendationSource: response.recommendationSource ?? 'personalized-local-score',
            activeRouteId: nextRouteId,
            selectedSpotId: getDefaultSpotId(nextRouteId),
            isLoading: false,
            lastError: ''
          })
          void fetchUserProfile(userId).then((profile) => {
            if (profile) set({ userProfile: profile })
          })
        } catch (error) {
          const fallbackRoutes = buildLocalGuideRecommendations(effectiveTags, effectivePreferences)
          const fallbackRouteId = fallbackRoutes[0]?.id ?? defaultRouteId
          const message = error instanceof Error ? error.message : '推荐服务暂时不可用'
          set({
            candidateRoutes: fallbackRoutes,
            routeAdjustmentReasons: [],
            routeDataFreshness: {},
            routeFallbackUsed: false,
            recommendationSource: 'frontend-fallback',
            activeRouteId: fallbackRouteId,
            selectedSpotId: getDefaultSpotId(fallbackRouteId),
            isLoading: false,
            lastError: message
          })
        }
      },
      refreshUserProfile: async () => {
        const profile = await fetchUserProfile(get().ensureUserId())
        if (profile) set({ userProfile: profile })
      },
      setActiveRouteId: (routeId) => {
        const route = getGuideRouteById(routeId)
        set({
          activeRouteId: route.id,
          selectedSpotId: getDefaultSpotId(route.id)
        })
      },
      setSelectedSpotId: (spotId) => set({ selectedSpotId: spotId }),
      ensureCurrentJourney: () => {
        const journeyDate = getJourneyDateKey()
        if (get().journeyDate !== journeyDate) {
          set({ journeyDate, visitedStops: [], listenedStops: [] })
        }
      },
      markStopVisited: (spotId) =>
        set((state) => recordJourneyStop(state, 'visitedStops', spotId)),
      markStopListened: (spotId) =>
        set((state) => recordJourneyStop(state, 'listenedStops', spotId))
    }),
    {
      name: 'lingshan-guide-store',
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as PersistedGuideState
        const hasJourneyProgress = Boolean(state.visitedStops?.length || state.listenedStops?.length)
        if (version < 1 && !hasJourneyProgress) {
          return {
            ...state,
            selectedSpotId: getDefaultSpotId(state.activeRouteId)
          }
        }
        return state
      },
      partialize: (state) => ({
        userId: state.userId,
        sessionId: state.sessionId,
        selectedTags: state.selectedTags,
        guidePreferences: state.guidePreferences,
        candidateRoutes: state.candidateRoutes,
        routeAdjustmentReasons: state.routeAdjustmentReasons,
        routeDataFreshness: state.routeDataFreshness,
        routeFallbackUsed: state.routeFallbackUsed,
        recommendationSource: state.recommendationSource,
        userProfile: state.userProfile,
        activeRouteId: state.activeRouteId,
        selectedSpotId: state.selectedSpotId,
        journeyDate: state.journeyDate,
        visitedStops: state.visitedStops,
        listenedStops: state.listenedStops,
        conversationEpochs: state.conversationEpochs
      })
    }
  )
)
