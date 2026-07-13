import {
  buildLocalGuideRecommendations,
  type GuidePreferenceContext,
  type GuideRecommendationCard,
  type UserProfileSnapshot
} from '../data/guideData'
import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const ANALYTICS_API = getAnalyticsApiBase()
const GUIDE_API = `${ANALYTICS_API}/guide`

export type GuideRecommendationsResponse = {
  userId: string
  recommendedRouteId: string
  routes: GuideRecommendationCard[]
  requestId?: string
  engine?: string
}

export async function fetchGuideRecommendations(payload: {
  userId: string
  selectedTags: string[]
  preferences?: GuidePreferenceContext
}): Promise<GuideRecommendationsResponse> {
  try {
    const response = await fetch(`${GUIDE_API}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = (await response.json()) as GuideRecommendationsResponse
    return {
      ...data,
      routes: data.routes.map((route) => ({
        ...route,
        recommendationRequestId: data.requestId,
        recommendationEngine: data.engine ?? (route.debug?.engine as string | undefined)
      }))
    }
  } catch {
    const routes = buildLocalGuideRecommendations(payload.selectedTags, payload.preferences)
    return {
      userId: payload.userId,
      recommendedRouteId: routes[0]?.id ?? 'historical_culture',
      routes: routes.map((route) => ({ ...route, recommendationEngine: 'frontend-fallback' }))
    }
  }
}

export async function sendGuideFeedback(payload: {
  userId: string
  routeId: string
  action: 'select_route'
}) {
  try {
    await fetch(`${GUIDE_API}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch {
    // Keep route transitions responsive even if analytics-server is down.
  }
}

type ExplainRouteCard = {
  routeId: string
  routeName: string
  durationLabel: string
  description: string
  tags: string[]
  primaryPersona: string
  matchScore: number
  whyRecommended: string
  lightAlternativeId: string | null
}

type ExplainResponse = {
  userId: string
  profile: UserProfileSnapshot
  recommendations: ExplainRouteCard[]
  evidenceTopics: string[]
}

export async function fetchRecommendExplain(userId: string): Promise<{
  profile: UserProfileSnapshot
  routes: GuideRecommendationCard[]
} | null> {
  try {
    const response = await fetch(`${ANALYTICS_API}/recommend/explain/${encodeURIComponent(userId)}`)
    if (!response.ok) return null
    const data = (await response.json()) as ExplainResponse
    const routes: GuideRecommendationCard[] = data.recommendations.map((r) => ({
      id: r.routeId,
      name: r.routeName,
      description: r.description,
      durationLabel: r.durationLabel,
      tags: r.tags as GuideRecommendationCard['tags'],
      reason: r.whyRecommended,
      matchScore: r.matchScore,
      routePersona: r.primaryPersona,
      whyRecommended: r.whyRecommended,
      lightAlternativeId: r.lightAlternativeId
    }))
    return { profile: data.profile, routes }
  } catch {
    return null
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfileSnapshot | null> {
  try {
    const response = await fetch(`${ANALYTICS_API}/profile/${encodeURIComponent(userId)}`)
    if (!response.ok) return null
    return (await response.json()) as UserProfileSnapshot
  } catch {
    return null
  }
}
