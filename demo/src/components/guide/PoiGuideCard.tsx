export function PoiGuideCard({ name, description, onOpen }: { name: string; description: string; onOpen?: () => void }) {
  return (
    <section className="guide-action-card guide-action-card--poi">
      <span className="guide-action-card__eyebrow">景点导览</span>
      <h3>{name}</h3>
      <p>{description}</p>
      {onOpen ? <button type="button" onClick={onOpen}>查看景点</button> : null}
    </section>
  )
}
