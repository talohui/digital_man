import { useEffect, useRef, type RefObject } from 'react'

import { getRouteItineraryMeta, type GuideRecommendationCard } from '../../../data/guideData'
import CAppBottomSheet from '../overlays/CAppBottomSheet'
import { ROUTE_REQUEST_PRESETS, scoreRoute } from './routePlanPresentation'

type RoutePlannerAssistantSheetProps = {
  open: boolean
  routeProfileLabels: string[]
  selectedTags: string[]
  lastRequest: string
  reply: string
  recommendation?: GuideRecommendationCard
  isLoading: boolean
  draft: string
  returnFocusRef: RefObject<HTMLButtonElement>
  onClose: () => void
  onAccept: () => void
  onDraftChange: (draft: string) => void
  onSubmit: (request: string) => void
}

function RoutePlannerAssistantSheet({
  open,
  routeProfileLabels,
  selectedTags,
  lastRequest,
  reply,
  recommendation,
  isLoading,
  draft,
  returnFocusRef,
  onClose,
  onAccept,
  onDraftChange,
  onSubmit
}: RoutePlannerAssistantSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recommendationMeta = recommendation ? getRouteItineraryMeta(recommendation.id) : null

  useEffect(() => {
    if (!open) return
    const backgroundElements = Array.from(document.querySelectorAll<HTMLElement>(
      '.plan-v2-page, .plan-v2-start-dock, .c-app-bottom-nav'
    )).map((element) => ({ element, wasInert: element.hasAttribute('inert') }))
    backgroundElements.forEach(({ element }) => element.setAttribute('inert', ''))
    const focusFrame = window.requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }))
    const keepFocusInsideDialog = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const dialog = document.getElementById('plan-v2-xiaoling-dialog')
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getAttribute('aria-hidden') !== 'true' && element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement
      if (!dialog.contains(activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keepFocusInsideDialog)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', keepFocusInsideDialog)
      backgroundElements.forEach(({ element, wasInert }) => {
        if (!wasInert) element.removeAttribute('inert')
      })
    }
  }, [open])

  if (!open) return null

  const closeAndRestoreFocus = () => {
    onClose()
    window.requestAnimationFrame(() => returnFocusRef.current?.focus({ preventScroll: true }))
  }

  return (
    <CAppBottomSheet
      title="和小灵一起定路线"
      eyebrow="小灵 · 今日行程卷"
      onClose={closeAndRestoreFocus}
      closeLabel="暂合"
      className="plan-v2-xiaoling-panel"
      dialogId="plan-v2-xiaoling-dialog"
    >
      <div className="plan-v2-xiaoling-panel__conversation" aria-live="polite">
        <p className="plan-v2-xiaoling-panel__message plan-v2-xiaoling-panel__message--assistant">我已读到你的行旅笺：{routeProfileLabels.length ? routeProfileLabels.join('、') : '尚未填写行程节奏'}，以及{selectedTags.length ? selectedTags.join('、') : '通览灵山'}。</p>
        {lastRequest ? <p className="is-visitor">{lastRequest}</p> : null}
        <p className="plan-v2-xiaoling-panel__message plan-v2-xiaoling-panel__message--assistant">{reply || '把同行的人、可用时间、想看的风景或体力安排告诉我，我会替你重新排卷。'}</p>
      </div>
      {recommendation ? (
        <div className="plan-v2-xiaoling-panel__recommendation">
          <span>小灵的路线建议</span>
          <strong>{recommendation.name}</strong>
          <small>{recommendation.reason || recommendation.description}</small>
          <b>{scoreRoute(recommendation)}<em>{recommendationMeta ? `${recommendationMeta.durationLabel} · ${recommendationMeta.stopCount}站` : '顺路成卷'}</em></b>
          <button type="button" disabled={isLoading} onClick={onAccept}>{isLoading ? '正在重新排卷' : '采用这条路线'} <i>›</i></button>
        </div>
      ) : null}
      <div className="plan-v2-xiaoling-panel__presets" aria-label="快捷补充需求">
        {ROUTE_REQUEST_PRESETS.map((item) => <button key={item} type="button" disabled={isLoading} onClick={() => onSubmit(item)}>{item}</button>)}
      </div>
      <form className="plan-v2-xiaoling-panel__composer" onSubmit={(event) => { event.preventDefault(); onSubmit(draft) }}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          rows={2}
          placeholder="例如：下午带父母来，想少走路，重点看大佛和梵宫"
          aria-label="告诉小灵你的路线想法"
        />
        <button type="submit" disabled={isLoading || !draft.trim()}>{isLoading ? '正在排卷' : '请小灵重排'}</button>
      </form>
    </CAppBottomSheet>
  )
}

export default RoutePlannerAssistantSheet
export type { RoutePlannerAssistantSheetProps }
