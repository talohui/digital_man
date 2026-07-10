import { NavigationGuideCard } from './NavigationGuideCard'
import { PoiGuideCard } from './PoiGuideCard'
import { RouteRecommendationCard, type RouteRecommendationCardData } from './RouteRecommendationCard'

export type GuideUiMockCard =
  | { type: 'route_cards'; card: RouteRecommendationCardData }
  | { type: 'poi_card'; name: string; description: string }
  | { type: 'navigation_card' | 'next_stop_card' | 'route_progress'; title: string; detail: string }

export function GuideActionCardRenderer({ card, onOpenRoute }: { card: GuideUiMockCard; onOpenRoute: (routeId: string) => void }) {
  if (card.type === 'route_cards') {
    return <RouteRecommendationCard card={card.card} onOpen={onOpenRoute} />
  }
  if (card.type === 'poi_card') {
    return <PoiGuideCard name={card.name} description={card.description} />
  }
  return <NavigationGuideCard title={card.title} detail={card.detail} />
}
