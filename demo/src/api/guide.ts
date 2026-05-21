import {
  buildLocalGuideRecommendations,
  type GuideRecommendationCard,
  type UserProfileSnapshot
} from '../data/guideData'

const GUIDE_API = 'http://127.0.0.1:5002/api/guide'
const ANALYTICS_API = 'http://127.0.0.1:5002/api'

export type GuideRecommendationsResponse = {
  userId: string
  recommendedRouteId: string
  routes: GuideRecommendationCard[]
}

export async function fetchGuideRecommendations(payload: {
  userId: string
  selectedTags: string[]
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

    return (await response.json()) as GuideRecommendationsResponse
  } catch {
    const routes = buildLocalGuideRecommendations(payload.selectedTags)
    return {
      userId: payload.userId,
      recommendedRouteId: routes[0]?.id ?? 'historical_culture',
      routes
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
