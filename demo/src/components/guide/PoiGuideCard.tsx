export function PoiGuideCard({ name, description }: { name: string; description: string }) {
  return (
    <section className="guide-action-card guide-action-card--poi">
      <span className="guide-action-card__eyebrow">景点导览</span>
      <h3>{name}</h3>
      <p>{description}</p>
    </section>
  )
}
