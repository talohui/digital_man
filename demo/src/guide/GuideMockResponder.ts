import { getScenicRouteById, getRouteStops } from '../data/lingshanScenicRoutes'
import { extractTravelPreferences, recommendScenicRoutes } from './GuideRecommendationEngine'
import type { GuideContext, GuideMessage, UserTravelPreferences } from './GuideMessageSchema'

export type MockGuideResponse = {
  message: Omit<GuideMessage, 'id' | 'createdAt'>
  preferences?: UserTravelPreferences
  recommendedRouteIds?: string[]
}

export function buildMockGuideResponse(
  text: string,
  context: GuideContext,
  currentPreferences: UserTravelPreferences
): MockGuideResponse {
  if (/下一站/.test(text) && context.nextStopName) {
    return {
      message: {
        role: 'assistant',
        text: `下一站是${context.nextStopName}。需要我先为你介绍这一站吗？`,
        status: 'complete',
        ui: context.routeId && context.nextStopIndex !== undefined
          ? {
              type: 'next_stop_card',
              routeId: context.routeId,
              stopIndex: context.nextStopIndex,
              poiId: context.nextStopPoiId,
              name: context.nextStopName
            }
          : undefined
      }
    }
  }

  if (/当前.*路线|哪条路线/.test(text) && context.routeId) {
    const route = getScenicRouteById(context.routeId)
    return { message: { role: 'assistant', text: `你正在游览${route?.name ?? context.routeName ?? '当前路线'}。`, status: 'complete' } }
  }

  if (/还剩.*站|剩多少/.test(text) && context.routeId && context.currentStopIndex !== undefined) {
    const totalStops = getRouteStops(context.routeId).length
    const remaining = Math.max(0, totalStops - context.currentStopIndex - 1)
    return {
      message: {
        role: 'assistant',
        text: `当前已到第 ${context.currentStopIndex + 1} 站，后面还剩 ${remaining} 站。`,
        status: 'complete',
        ui: { type: 'route_progress', routeId: context.routeId, currentStopIndex: context.currentStopIndex, totalStops }
      }
    }
  }

  if (/推荐|怎么逛|游玩|小时|拍照|孩子|亲子|祈福|自然|历史|文化/.test(text)) {
    const preferences = extractTravelPreferences(text, currentPreferences)
    const recommendations = recommendScenicRoutes(preferences)
    const primary = recommendations[0]
    const route = primary ? getScenicRouteById(primary.routeId) : undefined
    return {
      preferences,
      recommendedRouteIds: recommendations.map((item) => item.routeId),
      message: {
        role: 'assistant',
        text: primary
          ? `根据你的时间和兴趣，我更推荐“${route?.name ?? primary.routeId}”。${primary.reason}。`
          : '我暂时没有找到合适的路线，可以再告诉我游览时间和兴趣吗？',
        status: 'complete',
        ui: { type: 'route_cards', items: recommendations }
      }
    }
  }

  if (context.page === 'poi' && context.selectedPoiName) {
    return { message: { role: 'assistant', text: `你正在查看${context.selectedPoiName}。可以问我它的故事、看点、拍照位置或游览建议。`, status: 'complete' } }
  }

  return { message: { role: 'assistant', text: '我可以帮你推荐路线、介绍景点，也可以告诉你当前路线和下一站。', status: 'complete' } }
}
