export function NavigationGuideCard({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="guide-action-card guide-action-card--navigation">
      <span className="guide-action-card__eyebrow">路线提醒</span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </section>
  )
}
