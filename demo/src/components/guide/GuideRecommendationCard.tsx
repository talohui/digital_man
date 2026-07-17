import { useState } from 'react'

export type GuideRecommendationKind =
  | 'route'
  | 'poi'
  | 'navigation'
  | 'next-stop'
  | 'progress'
  | 'service'
  | 'event'
  | 'product'

export type GuideRecommendationImage = {
  src: string
  alt: string
  fallbackSrc?: string
}

export type GuideRecommendationCardData = {
  kind: GuideRecommendationKind
  typeLabel: string
  title: string
  description?: string
  facts?: string[]
  tags?: string[]
  reason?: string
  image?: GuideRecommendationImage
  actionLabel?: string
}

export function GuideRecommendationCard({
  card,
  primary = false,
  onAction
}: {
  card: GuideRecommendationCardData
  primary?: boolean
  onAction?: () => void
}) {
  const [imageSrc, setImageSrc] = useState(card.image?.src ?? '')
  const hasImage = Boolean(card.image && imageSrc)

  return (
    <section
      className={`guide-action-card guide-recommendation-card guide-recommendation-card--${card.kind}${card.kind === 'route' ? ' guide-action-card--route' : ''}${primary ? ' is-primary' : ''}`}
      data-recommendation-kind={card.kind}
      data-has-image={hasImage ? 'true' : 'false'}
    >
      <span className="guide-action-card__eyebrow">{card.typeLabel}</span>
      <div className="guide-recommendation-card__lead">
        {hasImage ? (
          <span className="guide-recommendation-card__media">
            <img
              src={imageSrc}
              alt={card.image?.alt ?? ''}
              loading="lazy"
              onError={() => {
                if (card.image?.fallbackSrc && imageSrc !== card.image.fallbackSrc) {
                  setImageSrc(card.image.fallbackSrc)
                  return
                }
                setImageSrc('')
              }}
            />
          </span>
        ) : null}
        <h3>{card.title}</h3>
      </div>
      {card.facts?.length ? (
        <div className="guide-recommendation-card__facts" aria-label="推荐信息">
          {card.facts.map((fact) => <span key={fact}>{fact}</span>)}
        </div>
      ) : null}
      {card.tags?.length ? (
        <div className="guide-action-card__tags">{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      ) : null}
      {card.description ? <p>{card.description}</p> : null}
      {card.reason ? <small>{card.reason}</small> : null}
      {card.actionLabel && onAction ? <button type="button" onClick={onAction}>{card.actionLabel}</button> : null}
    </section>
  )
}
