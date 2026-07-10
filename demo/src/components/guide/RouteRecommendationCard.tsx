import type { ScenicRouteId } from '../../guide'

export type RouteRecommendationCardData = {
  routeId: ScenicRouteId
  name: string
  duration: string
  stopCount: number
  reason: string
  tags: string[]
}

export function RouteRecommendationCard({
  card,
  primary = false,
  onOpen
}: {
  card: RouteRecommendationCardData
  primary?: boolean
  onOpen?: (routeId: ScenicRouteId) => void
}) {
  return (
    <section className={`guide-action-card guide-action-card--route${primary ? ' is-primary' : ''}`}>
      <span className="guide-action-card__eyebrow">为你推荐</span>
      <h3>{card.name}</h3>
      <p>{card.duration} · {card.stopCount} 个景点</p>
      <div className="guide-action-card__tags">{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <small>{card.reason}</small>
      <button type="button" onClick={() => onOpen?.(card.routeId)}>查看路线</button>
    </section>
  )
}
