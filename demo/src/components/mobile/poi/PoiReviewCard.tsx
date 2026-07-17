import { forwardRef } from 'react'

type PoiVisitorReview = {
  id: string
  rating: number
  tags: string[]
  text: string
  createdAt: string
}

type PoiReviewCardProps = {
  spotName: string
  averageRating: number
  reviewCount: number
  reviews: PoiVisitorReview[]
  onOpen: () => void
}

const PoiReviewCard = forwardRef<HTMLElement, PoiReviewCardProps>(function PoiReviewCard(
  { spotName, averageRating, reviewCount, reviews, onOpen },
  ref
) {
  const ratingLabel = averageRating.toFixed(1)

  return (
    <section ref={ref} className="map-poi-detail__review-card" aria-labelledby="poi-review-card-title">
      <header>
        <div>
          <span>游客印象</span>
          <h2 id="poi-review-card-title">{spotName}评价</h2>
        </div>
        <strong><b>{ratingLabel}</b><small> / 5</small></strong>
      </header>
      <div className="map-poi-detail__review-card-meta">
        <span aria-label={`${ratingLabel}星`}>★★★★★</span>
        <em>{reviewCount} 条游客评价</em>
      </div>
      <div className="map-poi-detail__review-card-previews">
        {reviews.slice(0, 2).map((review) => <p key={review.id}>{review.text || review.tags.join(' · ')}</p>)}
      </div>
      <button type="button" onClick={onOpen}>
        <span>查看评价并写下感受</span>
        <i aria-hidden="true">›</i>
      </button>
    </section>
  )
})

export default PoiReviewCard
export type { PoiReviewCardProps, PoiVisitorReview }
