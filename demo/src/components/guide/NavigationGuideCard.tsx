export function NavigationGuideCard({
  title,
  detail,
  actionLabel,
  onAction
}: {
  title: string
  detail: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <section className="guide-action-card guide-action-card--navigation">
      <span className="guide-action-card__eyebrow">路线提醒</span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {actionLabel && onAction ? <button type="button" onClick={onAction}>{actionLabel}</button> : null}
    </section>
  )
}
