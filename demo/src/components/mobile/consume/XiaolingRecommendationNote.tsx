import type { ReactNode } from 'react'

type XiaolingRecommendationNoteProps = {
  /** Fay 推荐选择经商品目录校验后形成的完整前端展示模型。 */
  recommendation: XiaolingRecommendationData
  reasonStatus?: XiaolingRecommendationReasonStatus
  onReasonActivate?: () => void
  action: ReactNode
  /**
   * 正式接入时传入 <XiaolingAvatar size="small" />。
   * XiaolingAvatar 复用全局 Live2DStage 捕获的肖像，避免荐笺重复加载 Fay/Live2D 运行时。
   */
  assistantVisual?: ReactNode
  assistantState?: XiaolingRecommendationAssistantState
  onAssistantActivate?: () => void
  assistantAriaLabel?: string
  avatar?: string
  label?: string
  /** 每次成功改变推荐商品数量后递增，用于重复触发轻量反馈动画。 */
  quantityMotionSequence?: number
  className?: string
}

type XiaolingRecommendationReasonStatus = 'idle' | 'loading' | 'ready' | 'fallback'
type XiaolingRecommendationReasonSource = 'fay' | 'rule' | 'demo'

/**
 * Fay/LLM 层只应返回稳定业务标识和推荐理由。
 * 前端适配层须使用 categoryId、itemId 查询商品目录，校验存在性和可售状态。
 */
type FayRecommendationSelection = {
  categoryId: string
  itemId: string
  reason: string
  requestId?: string
}

/** 商品目录校验完成后交给视觉组件的可信展示数据。 */
type XiaolingRecommendationData = {
  categoryId: string
  itemId: string
  name: string
  description: string
  priceLabel: string
  reason: string
  reasonSource: XiaolingRecommendationReasonSource
  availabilityLabel?: string
  locationLabel?: string
}

type XiaolingRecommendationAssistantState =
  | 'normal'
  | 'speaking'
  | 'listening'
  | 'thinking'
  | 'happy'
  | 'comfort'

function XiaolingRecommendationNote({
  recommendation,
  reasonStatus = 'ready',
  onReasonActivate,
  action,
  assistantVisual,
  assistantState = 'normal',
  onAssistantActivate,
  assistantAriaLabel = '打开小灵助手',
  avatar = '/icons/lingshan-guide-avatar.png',
  label = '小灵沿途推荐',
  quantityMotionSequence = 0,
  className = ''
}: XiaolingRecommendationNoteProps) {
  const visibleReason = reasonStatus === 'loading'
    ? '小灵正在结合位置与路线…'
    : recommendation.reason
  const avatarContent = (
    <>
      {assistantVisual ?? <img src={avatar} alt="" />}
      <i />
    </>
  )
  const quantityMotionClass = quantityMotionSequence > 0
    ? `is-quantity-motion-${quantityMotionSequence % 2 === 0 ? 'even' : 'odd'}`
    : ''

  return (
    <article
      className={`xiaoling-recommendation-note is-assistant-${assistantState} ${quantityMotionClass} ${className}`.trim()}
      data-assistant-state={assistantState}
      data-reason-status={reasonStatus}
      data-reason-source={recommendation.reasonSource}
      data-category-id={recommendation.categoryId}
      data-item-id={recommendation.itemId}
      data-quantity-motion-sequence={quantityMotionSequence}
    >
      {onAssistantActivate ? (
        <button
          className="xiaoling-recommendation-note__avatar"
          type="button"
          aria-label={assistantAriaLabel}
          onClick={onAssistantActivate}
        >
          {avatarContent}
        </button>
      ) : (
        <div className="xiaoling-recommendation-note__avatar" aria-hidden="true">
          {avatarContent}
        </div>
      )}

      <div className="xiaoling-recommendation-note__paper">
        <span className="xiaoling-recommendation-note__seal" aria-hidden="true">荐</span>
        <span className="xiaoling-recommendation-note__cloud-band" aria-hidden="true" />
        <span className="xiaoling-recommendation-note__corner is-top-left" aria-hidden="true" />
        <span className="xiaoling-recommendation-note__corner is-bottom-right" aria-hidden="true" />
        <span className="xiaoling-recommendation-note__lotus" aria-hidden="true"><i /><i /><i /></span>
        <header>
          <span>{label}</span>
          {onReasonActivate && reasonStatus !== 'loading' ? (
            <button
              className="xiaoling-recommendation-note__reason"
              type="button"
              onClick={onReasonActivate}
              aria-label={`询问小灵推荐理由：${visibleReason}`}
            >
              {visibleReason}
            </button>
          ) : (
            <small className="xiaoling-recommendation-note__reason" aria-live="polite">{visibleReason}</small>
          )}
        </header>
        <div className="xiaoling-recommendation-note__copy">
          <strong>{recommendation.name}</strong>
          <p>{recommendation.description}</p>
        </div>
        <footer>
          <span className="xiaoling-recommendation-note__meta">
            <b>{recommendation.priceLabel}</b>
            {recommendation.availabilityLabel || recommendation.locationLabel ? (
              <small>{[recommendation.availabilityLabel, recommendation.locationLabel].filter(Boolean).join(' · ')}</small>
            ) : null}
          </span>
          <div className="xiaoling-recommendation-note__action">{action}</div>
        </footer>
      </div>
    </article>
  )
}

export default XiaolingRecommendationNote
export type {
  XiaolingRecommendationAssistantState,
  FayRecommendationSelection,
  XiaolingRecommendationData,
  XiaolingRecommendationNoteProps,
  XiaolingRecommendationReasonSource,
  XiaolingRecommendationReasonStatus
}
