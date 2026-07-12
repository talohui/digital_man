import { type ReactNode } from 'react'
import { NavigationPrototypeReplayControls } from './NavigationPrototypeReplayControls'
import type { NavigationBetaViewModel } from './navigationBetaViewModel'

type NavigationPrototypeCardProps = {
  viewModel: NavigationBetaViewModel
}

function NavigationCardHeader({
  eyebrow,
  targetName,
  stepText
}: {
  eyebrow: string
  targetName?: string
  stepText?: string
}) {
  return (
    <header className="navigation-beta-card__header">
      <span className="navigation-beta-card__eyebrow">{eyebrow}</span>
      {targetName ? (
        <div className="navigation-beta-card__target-row">
          <h2>{targetName}</h2>
          {stepText ? <span>{stepText}</span> : null}
        </div>
      ) : null}
    </header>
  )
}

function NavigationDebugSection({ enabled }: { enabled: boolean }) {
  if (!enabled) return null

  return (
    <details className="navigation-beta-card__debug" aria-label="导航调试">
      <summary>导航调试</summary>
      <NavigationPrototypeReplayControls />
    </details>
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

function NavigationProgressBody({ viewModel }: { viewModel: NavigationBetaViewModel }) {
  const progress = viewModel.progress
  const targetName = viewModel.target?.name ?? '当前目标'
  const isRerouting = viewModel.state === 'rerouting'
  const isSuspected = viewModel.state === 'suspected-off-route'
  const isConfirmed = viewModel.state === 'confirmed-off-route'

  return (
    <>
      <NavigationCardHeader eyebrow="正在前往" targetName={targetName} stepText={progress?.stepText} />
      <div className="navigation-beta-card__guide">
        <span>小灵指引</span>
        <strong>{progress?.currentInstruction ?? '正在等待下一条步行指引…'}</strong>
      </div>
      {progress?.nextInstruction ? (
        <p className="navigation-beta-card__next-step">下一步：{progress.nextInstruction}</p>
      ) : null}
      {progress ? (
        <div className="navigation-beta-card__metrics" aria-label="导航进度">
          <span>剩余 {progress.distanceText}</span>
          <span>约 {progress.durationText}</span>
        </div>
      ) : null}
      {progress?.locationQualityText ? <p className="navigation-beta-card__quality">{progress.locationQualityText}</p> : null}

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
          正在重新规划步行路线，旧路线仍可作为参考。
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

/**
 * Product-level navigation sheet. It intentionally consumes only the public
 * NavigationBetaViewModel so UI cannot alter navigation state transitions.
 */
export function NavigationPrototypeCard({ viewModel }: NavigationPrototypeCardProps) {
  if (!viewModel.visible || viewModel.state === 'inactive') return null

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
      content = <NavigationProgressBody viewModel={viewModel} />
      break
    case 'paused':
      content = (
        <>
          <NavigationCardHeader eyebrow="导航已暂停" targetName={targetName} />
          <p className="navigation-beta-card__copy">需要继续时，可恢复前往当前目标的步行导航。</p>
          <NavigationActionPair primaryLabel="继续导航" onPrimary={viewModel.actions.resume} secondaryLabel="结束导航" onSecondary={viewModel.actions.cancel} />
        </>
      )
      break
    case 'resume-prompt':
      content = (
        <>
          <NavigationCardHeader eyebrow="检测到未完成的导航" targetName={viewModel.restoredSession?.targetName ?? targetName} />
          <p className="navigation-beta-card__copy">可继续前往当前目标，恢复未完成的导航。</p>
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
    <section className={`navigation-beta-card navigation-beta-card--${viewModel.state}`} aria-label="小灵景区导航">
      {content}
      <NavigationDebugSection enabled={viewModel.debugEnabled} />
    </section>
  )
}
