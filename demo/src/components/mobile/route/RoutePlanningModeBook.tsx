import { RightOutlined } from '@ant-design/icons'
import type { KeyboardEvent, RefObject } from 'react'

import { getNextPlanningMode, type PlanV2PlanningMode } from '../../../lib/planV2Interactions'
import type { RouteSelectionSource } from '../../../lib/routePlanState'

type RoutePlanningModeBookProps = {
  planningMode: PlanV2PlanningMode
  selectionSource: RouteSelectionSource
  lastRequest: string
  drawerOpen: boolean
  assistantTriggerRef: RefObject<HTMLButtonElement>
  onSelectMode: (mode: PlanV2PlanningMode, moveFocus?: boolean) => void
  onOpenAssistant: () => void
  onGoToFirstStep: () => void
}

function RoutePlanningModeBook({
  planningMode,
  selectionSource,
  lastRequest,
  drawerOpen,
  assistantTriggerRef,
  onSelectMode,
  onOpenAssistant,
  onGoToFirstStep
}: RoutePlanningModeBookProps) {
  const smartAccepted = selectionSource === 'smart'
  const handleModeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    onSelectMode(getNextPlanningMode(planningMode, event.key), true)
  }

  return (
    <section className={`plan-v2-mode-book is-${planningMode}`} aria-label="路线规划方式">
      <div className="plan-v2-mode-book__tabs" role="tablist" aria-label="选择规划方式" aria-orientation="horizontal">
        <button id="plan-v2-smart-tab" type="button" role="tab" aria-controls="plan-v2-mode-panel" aria-selected={planningMode === 'smart'} tabIndex={planningMode === 'smart' ? 0 : -1} className={planningMode === 'smart' ? 'is-selected' : ''} onClick={() => onSelectMode('smart')} onKeyDown={handleModeKeyDown}>
          <i aria-hidden="true">灵</i><span><small>问小灵</small><strong>一句成行</strong></span><em>{smartAccepted ? '已采用' : '推荐'}</em>
        </button>
        <button id="plan-v2-manual-tab" type="button" role="tab" aria-controls="plan-v2-mode-panel" aria-selected={planningMode === 'manual'} tabIndex={planningMode === 'manual' ? 0 : -1} className={planningMode === 'manual' ? 'is-selected' : ''} onClick={() => onSelectMode('manual')} onKeyDown={handleModeKeyDown}>
          <i aria-hidden="true">择</i><span><small>自己选</small><strong>自主规划</strong></span><em>{planningMode === 'manual' ? '当前' : '可切换'}</em>
        </button>
      </div>

      {planningMode === 'smart' ? (
        <div id="plan-v2-mode-panel" className="plan-v2-mode-book__page plan-v2-mode-book__page--smart" role="tabpanel" aria-labelledby="plan-v2-smart-tab">
          <span className="plan-v2-mode-book__portrait"><img src="/icons/lingshan-guide-avatar.png" alt="" /><i aria-hidden="true" /></span>
          <div className="plan-v2-mode-book__copy">
            <small>小灵在此候你</small>
            <strong>{smartAccepted ? '这一程，已替你排好' : '把想法告诉我，余下的交给小灵'}</strong>
            <p>{smartAccepted && lastRequest ? `“${lastRequest}”` : '同行的人、可用时间、想看的风景，都可以直接说。'}</p>
            <span aria-hidden="true"><i>同行</i><i>时间</i><i>偏好</i></span>
          </div>
          <button ref={assistantTriggerRef} type="button" aria-haspopup="dialog" aria-expanded={drawerOpen} aria-controls="plan-v2-xiaoling-dialog" onClick={onOpenAssistant}>
            {smartAccepted ? '继续和小灵聊' : '向小灵说说想法'} <RightOutlined />
          </button>
        </div>
      ) : (
        <div id="plan-v2-mode-panel" className="plan-v2-mode-book__page plan-v2-mode-book__page--manual" role="tabpanel" aria-labelledby="plan-v2-manual-tab">
          <div className="plan-v2-mode-book__manual-copy">
            <small>亲手写下行旅笺</small>
            <strong>择心愿、定节奏、选路线</strong>
          </div>
          <ol aria-label="自主规划步骤"><li><i>壹</i><span>心愿</span></li><li><i>贰</i><span>节奏</span></li><li><i>叁</i><span>路线</span></li></ol>
          <button type="button" onClick={onGoToFirstStep}>开始择心愿 <RightOutlined /></button>
        </div>
      )}
    </section>
  )
}

export default RoutePlanningModeBook
export type { RoutePlanningModeBookProps }
