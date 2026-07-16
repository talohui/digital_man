import { CheckOutlined, RightOutlined } from '@ant-design/icons'

import { getRouteItineraryMeta, type GuideRecommendationCard } from '../../../data/guideData'
import type { RoutePlanStep, RouteSelectionSource } from '../../../lib/routePlanState'
import { getRouteCoverStyle, scoreRoute } from './routePlanPresentation'

type RouteRecommendationStepProps = {
  activeStep: RoutePlanStep
  hasChosenRoute: boolean
  selectedRoute?: GuideRecommendationCard
  routes: GuideRecommendationCard[]
  visibleRoutes: GuideRecommendationCard[]
  isLoading: boolean
  lastError: string
  selectionMessage: string
  selectionSource: RouteSelectionSource
  showAllRoutes: boolean
  onGoToStep: (step: RoutePlanStep) => void
  onChooseRoute: (route: GuideRecommendationCard, index: number) => void
  onReopenChooser: () => void
  onToggleAllRoutes: () => void
  onRetry: () => void
}

function RouteRecommendationStep({
  activeStep,
  hasChosenRoute,
  selectedRoute,
  routes,
  visibleRoutes,
  isLoading,
  lastError,
  selectionMessage,
  selectionSource,
  showAllRoutes,
  onGoToStep,
  onChooseRoute,
  onReopenChooser,
  onToggleAllRoutes,
  onRetry
}: RouteRecommendationStepProps) {
  const selectedRouteMeta = selectedRoute ? getRouteItineraryMeta(selectedRoute.id) : null
  const smartMode = selectionSource === 'smart'

  return (
    <article id="plan-v2-step-3" className={`plan-v2-step plan-v2-route-book ${activeStep === 3 ? 'is-active' : ''} ${hasChosenRoute ? 'is-complete' : ''}`}>
      <button id="plan-v2-step-3-trigger" className="plan-v2-step__head" type="button" onClick={() => onGoToStep(3)} aria-expanded={activeStep === 3} aria-controls="plan-v2-step-3-panel">
        <i aria-hidden="true">叁</i>
        <span><small>第三步</small><strong>选路线</strong></span>
        <em>{hasChosenRoute && selectedRoute ? selectedRoute.name : `${routes.length} 条智能候选`}</em>
        <b>{hasChosenRoute ? <CheckOutlined /> : '待选'}</b>
      </button>
      {activeStep === 3 ? (
        <div id="plan-v2-step-3-panel" className="plan-v2-step__body" role="region" aria-labelledby="plan-v2-step-3-trigger" aria-busy={isLoading}>
          <div className={`plan-v2-recommendation-status ${isLoading ? 'is-loading' : 'is-ready'}`} role="status" aria-live="polite">
            <span className="plan-v2-recommendation-status__avatar"><img src="/icons/lingshan-guide-avatar.png" alt="" /></span>
            <p>
              <small>{isLoading ? '小灵正在重新排卷' : selectionMessage || (smartMode ? '小灵已读懂你的想法' : '小灵已排好今日行卷')}</small>
              <strong>
                {isLoading
                  ? '正结合新的心愿与节奏调整顺序…'
                  : hasChosenRoute && selectedRoute
                    ? `“${selectedRoute.name}”已收入今日行卷。`
                    : '从候选中选择一条，小灵会展开完整行程。'}
              </strong>
            </p>
            <i aria-hidden="true"><b /><b /><b /></i>
          </div>
          {lastError && !isLoading ? (
            <div className="plan-v2-route-notice" role="status">
              <CheckOutlined />
              <span><strong>已切换为景区可靠路线</strong><small>云端推荐暂时没有响应，本次仍可正常选路和进入地图。</small></span>
            </div>
          ) : null}
          {isLoading && !hasChosenRoute ? (
            <div className="plan-v2-route-loading" role="status" aria-label="小灵正在生成路线候选">
              {[0, 1, 2].map((item) => <span key={item}><i /><b><em /><em /></b><strong /></span>)}
            </div>
          ) : hasChosenRoute && selectedRoute && selectedRouteMeta ? (
            <div className="plan-v2-route-confirmed" aria-label={`已选路线：${selectedRoute.name}`}>
              <span className="plan-v2-route-list__image" style={getRouteCoverStyle(selectedRouteMeta.cover)}><i>已收入行卷</i></span>
              <span className="plan-v2-route-list__copy">
                <small>{scoreRoute(selectedRoute)} 契合</small>
                <strong>{selectedRoute.name}</strong>
                <em>{selectedRouteMeta.durationLabel} · {selectedRouteMeta.stopCount} 站</em>
              </span>
              <button type="button" onClick={onReopenChooser}>更换路线 <RightOutlined /></button>
            </div>
          ) : routes.length ? (
            <>
              <div id="plan-v2-route-list" className="plan-v2-route-list" role="group" aria-label="候选路线">
                {visibleRoutes.map((route) => {
                  const routeIndex = routes.findIndex((item) => item.id === route.id)
                  const meta = getRouteItineraryMeta(route.id)
                  return (
                    <button key={route.id} type="button" onClick={() => onChooseRoute(route, routeIndex)} aria-label={`选择${route.name}，${meta.durationLabel}，共${meta.stopCount}站`}>
                      <span className="plan-v2-route-list__image" style={getRouteCoverStyle(meta.cover)}><i>{routeIndex === 0 ? '小灵首荐' : `备选 ${routeIndex}`}</i></span>
                      <span className="plan-v2-route-list__copy">
                        <small>{scoreRoute(route)} 契合</small>
                        <strong>{route.name}</strong>
                        <em>{meta.durationLabel} · {meta.stopCount} 站</em>
                      </span>
                      <span className="plan-v2-route-list__choice"><b>选择</b></span>
                    </button>
                  )
                })}
              </div>
              {routes.length > 3 ? (
                <button className="plan-v2-route-more" type="button" onClick={onToggleAllRoutes} aria-expanded={showAllRoutes} aria-controls="plan-v2-route-list">
                  <span>{showAllRoutes ? '收起候选路线' : `展开另外 ${routes.length - visibleRoutes.length} 条路线`}</span>
                  <i aria-hidden="true">⌄</i>
                </button>
              ) : null}
            </>
          ) : (
            <div className="plan-v2-route-empty" role="status">
              <span aria-hidden="true">卷</span>
              <strong>暂时没有可展开的路线</strong>
              <small>可以稍后重试，已经填写的心愿和节奏不会丢失。</small>
              <button type="button" onClick={onRetry}>请小灵重新排卷</button>
            </div>
          )}
        </div>
      ) : null}
    </article>
  )
}

export default RouteRecommendationStep
export type { RouteRecommendationStepProps }
