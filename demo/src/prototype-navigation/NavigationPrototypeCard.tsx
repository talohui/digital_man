import { useEffect, useRef, useState, type ReactNode } from 'react'

import { XiaolingFace } from '../components/guide/XiaolingFloatingCompanion'
import type { NavigationBetaUiState, NavigationBetaViewModel } from './navigationBetaViewModel'

type NavigationPrototypeCardProps = {
  viewModel: NavigationBetaViewModel
}

function isCollapsibleState(state: NavigationBetaUiState) {
  return state === 'navigating' || state === 'suspected-off-route'
}

function NavigationXiaolingAvatar() {
  return (
    <span className="navigation-beta-card__avatar" aria-hidden="true">
      <XiaolingFace />
    </span>
  )
}

function NavigationCardHeader({
  eyebrow,
  targetName,
  stepText,
  companion = false,
  action
}: {
  eyebrow: string
  targetName?: string
  stepText?: string
  companion?: boolean
  action?: ReactNode
}) {
  return (
    <header className={`navigation-beta-card__header${companion ? ' navigation-beta-card__header--companion' : ''}`}>
      {companion ? <NavigationXiaolingAvatar /> : null}
      <div className="navigation-beta-card__header-copy">
        <span className="navigation-beta-card__eyebrow">{eyebrow}</span>
        {targetName ? <h2>{targetName}</h2> : null}
      </div>
      {stepText ? <span className="navigation-beta-card__step">{stepText}</span> : null}
      {action ? <div className="navigation-beta-card__header-action">{action}</div> : null}
    </header>
  )
}

function NavigationActionPair({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryDisabled = false,
  secondaryDisabled = false
}: {
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
}) {
  return (
    <div className="navigation-beta-card__actions">
      <button type="button" className="navigation-beta-card__primary" onClick={onPrimary} disabled={primaryDisabled}>
        {primaryLabel}
      </button>
      <button type="button" className="navigation-beta-card__secondary" onClick={onSecondary} disabled={secondaryDisabled}>
        {secondaryLabel}
      </button>
    </div>
  )
}

function NavigationCompactCard({
  viewModel,
  onExpand
}: {
  viewModel: NavigationBetaViewModel
  onExpand: () => void
}) {
  const progress = viewModel.progress
  const suspected = viewModel.state === 'suspected-off-route'

  return (
    <div className={`navigation-beta-card__compact${suspected ? ' is-suspected' : ''}`}>
      <button
        type="button"
        className="navigation-beta-card__compact-main"
        onClick={onExpand}
        aria-label="展开导航详情"
      >
        <span className="navigation-beta-card__compact-head">
          <NavigationXiaolingAvatar />
          <strong>小灵陪你走</strong>
          {progress?.stepText ? <span>{progress.stepText}</span> : null}
        </span>
        <span className={`navigation-beta-card__compact-guide${suspected ? ' is-warning' : ''}`}>
          {suspected ? (
            '当前位置可能偏离路线，正在确认'
          ) : (
            <>
              <b>{progress?.currentActionText ?? '正在获取步行指引'}</b>
              {progress?.distanceToCurrentStepEndText ? <i>· {progress.distanceToCurrentStepEndText}</i> : null}
              {progress?.remainingRouteDistanceText ? <i>· 剩余{progress.remainingRouteDistanceText}</i> : null}
              {progress?.remainingDurationText ? <i className="navigation-beta-card__compact-duration">· {progress.remainingDurationText}</i> : null}
            </>
          )}
        </span>
      </button>
      <button
        type="button"
        className="navigation-beta-card__toggle navigation-beta-card__toggle--expand"
        onClick={onExpand}
        aria-expanded="false"
        aria-label="展开导航详情"
      >
        <span aria-hidden="true">⌃</span>
      </button>
    </div>
  )
}

function NavigationProgressBody({
  viewModel,
  collapsible,
  onCollapse
}: {
  viewModel: NavigationBetaViewModel
  collapsible: boolean
  onCollapse: () => void
}) {
  const progress = viewModel.progress
  const targetName = viewModel.target?.name ?? '当前目标'
  const isRerouting = viewModel.state === 'rerouting'
  const isSuspected = viewModel.state === 'suspected-off-route'
  const isConfirmed = viewModel.state === 'confirmed-off-route'
  const showLocationStatus = viewModel.location.isReplay
    || progress?.locationQuality === 'poor'
    || progress?.locationQuality === 'unavailable'

  return (
    <>
      <NavigationCardHeader
        eyebrow={viewModel.target?.mode === 'local-test' ? '本地测试' : '正在前往'}
        targetName={targetName}
        stepText={progress?.stepText}
        companion
        action={collapsible ? (
          <button
            type="button"
            className="navigation-beta-card__toggle navigation-beta-card__toggle--collapse"
            onClick={onCollapse}
            aria-expanded="true"
            aria-label="收起导航详情"
          >
            <span aria-hidden="true">⌄</span>
          </button>
        ) : undefined}
      />
      <div className="navigation-beta-card__guide">
        <span>小灵指引</span>
        <strong>{progress?.currentActionText ?? '正在等待下一条步行指引…'}</strong>
        {progress?.distanceToCurrentStepEndText ? <em>{progress.distanceToCurrentStepEndText}</em> : null}
      </div>
      {progress?.nextActionText ? (
        <p className="navigation-beta-card__next-step">下一步：{progress.nextActionText}</p>
      ) : null}
      {progress ? (
        <div className="navigation-beta-card__metrics" aria-label="导航剩余进度">
          <span>路线剩余 {progress.remainingRouteDistanceText}</span>
          <span>{progress.remainingDurationText}</span>
        </div>
      ) : null}
      {showLocationStatus ? (
        <p className={`navigation-beta-card__quality${viewModel.location.isReplay ? ' is-replay' : ' is-warning'}`}>
          {viewModel.location.statusText}
        </p>
      ) : null}

      {isSuspected ? (
        <p className="navigation-beta-card__notice navigation-beta-card__notice--suspected">
          当前位置可能偏离路线，正在继续确认。
        </p>
      ) : null}
      {isConfirmed ? (
        <div className="navigation-beta-card__notice navigation-beta-card__notice--confirmed">
          <p>你似乎已经偏离当前步行路线。</p>
          <NavigationActionPair
            primaryLabel="重新规划"
            onPrimary={viewModel.actions.reroute}
            secondaryLabel="继续当前路线"
            onSecondary={viewModel.actions.continueCurrentRoute}
          />
        </div>
      ) : null}
      {isRerouting ? (
        <p className="navigation-beta-card__notice navigation-beta-card__notice--rerouting">
          正在重新规划步行路线……
        </p>
      ) : null}

      <NavigationActionPair
        primaryLabel="暂停导航"
        onPrimary={viewModel.actions.pause}
        secondaryLabel="结束导航"
        onSecondary={viewModel.actions.cancel}
        primaryDisabled={isRerouting}
      />
    </>
  )
}

function NavigationErrorCard({ viewModel }: { viewModel: NavigationBetaViewModel }) {
  const error = viewModel.error
  if (!error) return null

  return (
    <>
      <NavigationCardHeader eyebrow="小灵景区导航" targetName={viewModel.target?.name} />
      <div className="navigation-beta-card__error" role="alert">
        <strong>{error.title}</strong>
        <p>{error.message}</p>
      </div>
      {error.retryable ? (
        <NavigationActionPair
          primaryLabel="重新尝试"
          onPrimary={viewModel.actions.retryLocation}
          secondaryLabel="结束导航"
          onSecondary={viewModel.actions.cancel}
        />
      ) : (
        <button type="button" className="navigation-beta-card__secondary navigation-beta-card__secondary--wide" onClick={viewModel.actions.cancel}>
          继续查看路线
        </button>
      )}
    </>
  )
}

/** Product navigation sheet. It consumes only NavigationBetaViewModel. */
export function NavigationPrototypeCard({ viewModel }: NavigationPrototypeCardProps) {
  const collapsible = isCollapsibleState(viewModel.state)
  const [expanded, setExpanded] = useState(() => !collapsible)
  const previousStateRef = useRef(viewModel.state)
  const previousTargetRef = useRef(viewModel.target?.poiId)

  useEffect(() => {
    const previousState = previousStateRef.current
    const previousTarget = previousTargetRef.current
    const enteredCollapsibleState = collapsible && !isCollapsibleState(previousState)
    const targetChanged = collapsible && previousTarget !== viewModel.target?.poiId

    if (!collapsible) setExpanded(true)
    else if (enteredCollapsibleState || targetChanged) setExpanded(false)

    previousStateRef.current = viewModel.state
    previousTargetRef.current = viewModel.target?.poiId
  }, [collapsible, viewModel.state, viewModel.target?.poiId])

  if (!viewModel.visible || viewModel.state === 'inactive') return null

  if (collapsible && !expanded) {
    return (
      <section className="navigation-beta-card navigation-beta-card--compact" aria-label="小灵步行导航">
        <NavigationCompactCard viewModel={viewModel} onExpand={() => setExpanded(true)} />
      </section>
    )
  }

  const targetName = viewModel.target?.name ?? '当前目标'
  let content: ReactNode

  switch (viewModel.state) {
    case 'permission-intro':
      content = (
        <>
          <NavigationCardHeader eyebrow="小灵景区导航" targetName={targetName} />
          <p className="navigation-beta-card__copy">需要使用你的位置，才能规划步行路线并判断是否到达。</p>
          <NavigationActionPair
            primaryLabel="允许定位并开始导航"
            onPrimary={viewModel.actions.requestPermissionAndStart}
            secondaryLabel="暂不导航"
            onSecondary={viewModel.actions.dismissPermissionIntro}
          />
        </>
      )
      break
    case 'locating':
      content = (
        <>
          <NavigationCardHeader eyebrow="正在获取当前位置" targetName={targetName} />
          <p className="navigation-beta-card__copy navigation-beta-card__copy--loading">请保持定位权限开启，并尽量处于室外开阔区域。</p>
          <button type="button" className="navigation-beta-card__secondary navigation-beta-card__secondary--wide" onClick={viewModel.actions.cancel}>取消</button>
        </>
      )
      break
    case 'planning':
      content = (
        <>
          <NavigationCardHeader eyebrow="正在规划步行路线" targetName={targetName} />
          <p className="navigation-beta-card__copy navigation-beta-card__copy--loading">正在规划前往 {targetName} 的路线…</p>
          <button type="button" className="navigation-beta-card__secondary navigation-beta-card__secondary--wide" onClick={viewModel.actions.cancel}>取消</button>
        </>
      )
      break
    case 'navigating':
    case 'suspected-off-route':
    case 'confirmed-off-route':
    case 'rerouting':
      content = (
        <NavigationProgressBody
          viewModel={viewModel}
          collapsible={collapsible}
          onCollapse={() => setExpanded(false)}
        />
      )
      break
    case 'paused':
      content = (
        <>
          <NavigationCardHeader eyebrow="导航已暂停" targetName={`前往：${targetName}`} />
          <NavigationActionPair primaryLabel="继续导航" onPrimary={viewModel.actions.resume} secondaryLabel="结束导航" onSecondary={viewModel.actions.cancel} />
        </>
      )
      break
    case 'resume-prompt':
      content = (
        <>
          <NavigationCardHeader eyebrow="检测到未完成的导航" targetName={`前往：${viewModel.restoredSession?.targetName ?? targetName}`} />
          <NavigationActionPair
            primaryLabel="继续上一次导航"
            onPrimary={viewModel.actions.continueRestoredSession}
            secondaryLabel="结束导航"
            onSecondary={viewModel.actions.discardRestoredSession}
          />
        </>
      )
      break
    case 'arrival-confirm':
      content = (
        <>
          <NavigationCardHeader
            eyebrow={viewModel.arrival?.kind === 'joining-arrival' ? '已抵达路线加入点' : '已抵达目标附近'}
            targetName={viewModel.arrival?.targetName ?? targetName}
          />
          <p className="navigation-beta-card__copy">
            {viewModel.arrival?.kind === 'joining-arrival' ? '请确认你已经到达加入位置。' : '请确认你已经到达景点。'}
          </p>
          <NavigationActionPair
            primaryLabel={viewModel.arrival?.kind === 'joining-arrival' ? '确认加入路线' : '确认到达'}
            onPrimary={viewModel.actions.confirmArrival}
            secondaryLabel="继续导航"
            onSecondary={viewModel.actions.continueAfterArrivalDetection}
          />
        </>
      )
      break
    case 'recoverable-error':
      content = <NavigationErrorCard viewModel={viewModel} />
      break
    default:
      content = null
  }

  return (
    <section className={`navigation-beta-card navigation-beta-card--${viewModel.state} is-expanded`} aria-label="小灵景区导航">
      {content}
    </section>
  )
}
