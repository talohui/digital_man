export type RouteRecommendationCardData = {
  routeId: string
  name: string
  duration: string
  stopCount: number
  reason: string
  tags: string[]
}

export function RouteRecommendationCard({
  card,
  onOpen
}: {
  card: RouteRecommendationCardData
  onOpen?: (routeId: string) => void
}) {
  return (
    <section className="guide-action-card guide-action-card--route">
      <span className="guide-action-card__eyebrow">为你推荐</span>
      <h3>{card.name}</h3>
      <p>{card.duration} · {card.stopCount} 个景点</p>
      <div className="guide-action-card__tags">{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <small>{card.reason}</small>
      <button type="button" onClick={() => onOpen?.(card.routeId)}>查看路线</button>
    </section>
  )
}
