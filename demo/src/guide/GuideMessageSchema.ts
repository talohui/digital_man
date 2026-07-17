import type { ScenicMapPresentation } from '../types/mapGuide'

export const SCENIC_ROUTE_IDS = [
  'historical_culture',
  'natural_scenery',
  'family'
] as const

export type ScenicRouteId = (typeof SCENIC_ROUTE_IDS)[number]
export type GuidePage = 'browse' | 'route' | 'poi'
export type GuideSessionStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
export type GuideMessageStatus = 'streaming' | 'complete' | 'error'
export type GuideInterest = 'culture' | 'prayer' | 'photo' | 'nature' | 'family' | 'relax'

export type UserTravelPreferences = {
  availableMinutes?: number
  interests: GuideInterest[]
  pace?: 'relaxed' | 'normal' | 'intensive'
  companions?: 'solo' | 'couple' | 'family' | 'elderly' | 'friends'
}

export type GuideContext = {
  page: GuidePage
  pathname: string
  presentation: ScenicMapPresentation
  routeId?: ScenicRouteId
  routeName?: string
  stage?: 'preview' | 'joining' | 'active' | 'arrived'
  currentStopIndex?: number
  currentStopPoiId?: string
  currentStopName?: string
  nextStopIndex?: number
  nextStopPoiId?: string
  nextStopName?: string
  selectedPoiId?: string
  selectedPoiName?: string
  poiSource?: 'browse' | 'route' | 'ai'
  poiReturnStage?: 'preview' | 'joining' | 'active' | 'arrived'
  poiReturnStopIndex?: number
  location: {
    available: boolean
    latitude?: number
    longitude?: number
  }
}

export type RouteRecommendationItem = {
  routeId: ScenicRouteId
  reason: string
  primary: boolean
  matchedTags: string[]
}

export type RouteCardsPayload = { type: 'route_cards'; items: RouteRecommendationItem[] }
export type PoiCardPayload = { type: 'poi_card'; poiId: string; reason?: string }
export type NavigationCardPayload = {
  type: 'navigation_card'
  targetType: 'poi' | 'route_stop'
  targetId: string
  label: string
}
export type NextStopCardPayload = {
  type: 'next_stop_card'
  routeId: ScenicRouteId
  stopIndex: number
  poiId?: string
  name: string
}
export type RouteProgressPayload = {
  type: 'route_progress'
  routeId: ScenicRouteId
  currentStopIndex: number
  totalStops: number
}

export type GuideUiPayload =
  | RouteCardsPayload
  | PoiCardPayload
  | NavigationCardPayload
  | NextStopCardPayload
  | RouteProgressPayload

export type GuideMessage = {
  id: string
  /** Missing only on messages archived from the pre-thread session format. */
  conversationKey?: string
  role: 'user' | 'assistant' | 'system'
  text: string
  createdAt: number
  ui?: GuideUiPayload
  status?: GuideMessageStatus
}

export function isScenicRouteId(value: string | null | undefined): value is ScenicRouteId {
  return SCENIC_ROUTE_IDS.includes(value as ScenicRouteId)
}
