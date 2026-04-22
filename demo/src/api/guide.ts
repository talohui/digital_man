import { buildLocalGuideRecommendations, type GuideRecommendationCard } from '../data/guideData'

const GUIDE_API = 'http://127.0.0.1:5002/api/guide'

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
