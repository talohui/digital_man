import { Link } from 'react-router-dom'

import { getPoiArrivalSummary } from '../data/poiGuideMetadata'
import { getPrototypeStepInstruction } from './prototypeNavigationPrompt'
import { NavigationPrototypeReplayControls } from './NavigationPrototypeReplayControls'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import type { NavigationPrototypeEndpoint, PrototypeNavigationTarget } from './types'

function formatDistance(distanceMeters: number) {
  return distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`
}

function formatDuration(durationMinutes: number) {
  return durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}小时${durationMinutes % 60}分钟` : `${durationMinutes}分钟`
}

type NavigationPrototypeCardProps = {
  target?: PrototypeNavigationTarget
  targetError?: string
  onCommitArrival?: () => void
  onListenToArrivalGuide?: (destination: NavigationPrototypeEndpoint) => void
  onViewArrivalPoiDetail?: (destination: NavigationPrototypeEndpoint) => void
}

export function NavigationPrototypeCard({
  target,
  targetError,
  onCommitArrival,
  onListenToArrivalGuide,
  onViewArrivalPoiDetail
}: NavigationPrototypeCardProps) {
  const status = useNavigationPrototypeStore((state) => state.status)
  const route = useNavigationPrototypeStore((state) => state.route)
  const rawWgs84Position = useNavigationPrototypeStore((state) => state.rawWgs84Position)
  const location = useNavigationPrototypeStore((state) => state.convertedGcj02Position)
  const conversionStatus = useNavigationPrototypeStore((state) => state.conversionStatus)
  const conversionProvider = useNavigationPrototypeStore((state) => state.conversionProvider)
  const conversionError = useNavigationPrototypeStore((state) => state.conversionError)
  const coordinateOffsetMeters = useNavigationPrototypeStore((state) => state.coordinateOffsetMeters)
  const locationSource = useNavigationPrototypeStore((state) => state.locationSource)
  const progress = useNavigationPrototypeStore((state) => state.progress)
  const arrivalLocationHits = useNavigationPrototypeStore((state) => state.arrivalLocationHits)
  const candidateStepIndex = useNavigationPrototypeStore((state) => state.candidateStepIndex)
  const candidateStepHitCount = useNavigationPrototypeStore((state) => state.candidateStepHitCount)
  const lastConfirmedStepIndex = useNavigationPrototypeStore((state) => state.lastConfirmedStepIndex)
  const lastAnnouncedStepIndex = useNavigationPrototypeStore((state) => state.lastAnnouncedStepIndex)
  const latestStepPrompt = useNavigationPrototypeStore((state) => state.latestStepPrompt)
  const deviation = useNavigationPrototypeStore((state) => state.deviation)
  const reroutePending = useNavigationPrototypeStore((state) => state.reroutePending)
  const lastRerouteError = useNavigationPrototypeStore((state) => state.lastRerouteError)
  const requestGeneration = useNavigationPrototypeStore((state) => state.requestGeneration)
  const session = useNavigationPrototypeStore((state) => state.session)
  const routeStageCommitReason = useNavigationPrototypeStore((state) => state.routeStageCommitReason)
  const error = useNavigationPrototypeStore((state) => state.error)
  const startTarget = useNavigationPrototypeStore((state) => state.startTarget)
  const cancelNavigation = useNavigationPrototypeStore((state) => state.cancelNavigation)
  const reroute = useNavigationPrototypeStore((state) => state.reroute)
  const continueCurrentRoute = useNavigationPrototypeStore((state) => state.continueCurrentRoute)
  const simulateDeviation = useNavigationPrototypeStore((state) => state.simulateDeviation)
  const simulateRouteRecovery = useNavigationPrototypeStore((state) => state.simulateRouteRecovery)
  const startTrajectoryRecording = useNavigationPrototypeStore((state) => state.startTrajectoryRecording)
  const stopTrajectoryRecording = useNavigationPrototypeStore((state) => state.stopTrajectoryRecording)
  const clearTrajectory = useNavigationPrototypeStore((state) => state.clearTrajectory)
  const exportTrajectory = useNavigationPrototypeStore((state) => state.exportTrajectory)
  const trajectoryRecording = useNavigationPrototypeStore((state) => state.trajectoryRecording)
  const trajectoryRecordCount = useNavigationPrototypeStore((state) => state.trajectory.length)
  const simulateArrival = useNavigationPrototypeStore((state) => state.simulateArrival)
  const reset = useNavigationPrototypeStore((state) => state.reset)
  const currentInstruction = progress?.currentInstruction ?? getPrototypeStepInstruction(route?.steps[0])
  const nextInstruction = progress?.nextInstruction
    ?? (route?.steps[1] ? getPrototypeStepInstruction(route.steps[1]) : undefined)
  const distanceMeters = progress?.distanceRemainingMeters ?? route?.distanceMeters ?? 0
  const durationMinutes = progress?.durationRemainingMinutes ?? route?.durationMinutes ?? 0
  const arrivalSummary = route ? getPoiArrivalSummary(route.destination.poiId) : undefined
  const isLowAccuracy = Boolean(location && location.accuracy > 50)
  const showDeviationNotice = status !== 'arrived' && !isLowAccuracy
  const locationAgeSeconds = location ? Math.max(0, Math.round((Date.now() - location.timestamp) / 1000)) : undefined

  return (
    <section className={`navigation-prototype-card is-${status}`} aria-label="腾讯步行导航原型">
      <div className="navigation-prototype-card__head">
        <span>Prototype Navigation</span>
        <small>{target ? `前往 ${target.name}` : '等待路线导航目标'}</small>
      </div>

      {targetError ? <p className="navigation-prototype-card__error">{targetError}</p> : null}

      {status === 'idle' && target ? (
        <button type="button" className="navigation-prototype-card__primary" onClick={() => startTarget(target)}>
          {target.mode === 'joining' ? '导航到加入点' : '开始导航'}
        </button>
      ) : null}

      {status === 'locating' ? <p className="navigation-prototype-card__status">正在获取当前位置并调用腾讯步行路线…</p> : null}
      {status === 'rerouting' ? <p className="navigation-prototype-card__status">正在重新规划步行路线…</p> : null}

      {route && (status === 'locating' || status === 'navigating' || status === 'rerouting' || status === 'arrived' || status === 'error') ? (
        <div className="navigation-prototype-card__details">
          <p>正在前往：<strong>{route.destination.name}</strong></p>
          <dl>
            <div>
              <dt>距离</dt>
              <dd>{formatDistance(distanceMeters)}</dd>
            </div>
            <div>
              <dt>预计</dt>
              <dd>{formatDuration(durationMinutes)}</dd>
            </div>
            <div>
              <dt>路线点</dt>
              <dd>{route.polyline.length}</dd>
            </div>
            <div>
              <dt>指令</dt>
              <dd>{route.steps.length} 步</dd>
            </div>
          </dl>
          <p className="navigation-prototype-card__instruction">
            <strong>当前指引</strong>
            <span>{currentInstruction}</span>
          </p>
          {nextInstruction ? (
            <p className="navigation-prototype-card__next-instruction">
              <strong>下一步</strong>
              <span>{nextInstruction}</span>
            </p>
          ) : null}
          {latestStepPrompt ? <p className="navigation-prototype-card__prompt">{latestStepPrompt}</p> : null}
          {location ? <p className="navigation-prototype-card__location">定位精度：约{Math.round(location.accuracy)}m</p> : null}
          {locationSource ? <p className="navigation-prototype-card__location">位置来源：{locationSource}</p> : null}
          {conversionStatus === 'converting' ? <p className="navigation-prototype-card__location">正在转换 GPS 坐标…</p> : null}
          {conversionStatus === 'failed' ? <p className="navigation-prototype-card__reroute-error">坐标转换暂不可用{conversionError ? `：${conversionError}` : ''}</p> : null}
          {isLowAccuracy ? <p className="navigation-prototype-card__low-accuracy">定位精度较低，暂不判断是否偏航</p> : null}
          {showDeviationNotice && deviation.state === 'suspected_off_route' ? (
            <p className="navigation-prototype-card__deviation navigation-prototype-card__deviation--suspected">
              当前位置可能偏离路线，正在继续确认。
            </p>
          ) : null}
          {showDeviationNotice && deviation.state === 'confirmed_off_route' ? (
            <div className="navigation-prototype-card__deviation navigation-prototype-card__deviation--confirmed">
              <p>你似乎已偏离当前步行路线。</p>
              <div className="navigation-prototype-card__deviation-actions">
                <button type="button" onClick={() => void reroute()} disabled={reroutePending}>重新规划</button>
                <button type="button" onClick={continueCurrentRoute} disabled={reroutePending}>继续当前路线</button>
              </div>
            </div>
          ) : null}
          {lastRerouteError ? <p className="navigation-prototype-card__reroute-error">{lastRerouteError}</p> : null}
          {status === 'navigating' ? (
            <p className="navigation-prototype-card__location">
              步骤 {Math.min((progress?.currentStepIndex ?? 0) + 1, Math.max(route.steps.length, 1))} / {route.steps.length || 1} · 到达确认：{arrivalLocationHits}/3
            </p>
          ) : null}
          {status !== 'arrived' ? (
            <div className="navigation-prototype-card__deviation-actions">
              <button type="button" className="navigation-prototype-card__primary" onClick={simulateArrival}>模拟到达</button>
              <button type="button" onClick={cancelNavigation}>取消导航</button>
            </div>
          ) : (
            <div className="navigation-prototype-card__arrival">
              <p className="navigation-prototype-card__arrived">已到达{route.destination.name}</p>
              {arrivalSummary ? <p>{arrivalSummary}</p> : null}
              <div className="navigation-prototype-card__arrival-actions">
                {session && session.target.mode !== 'free-poi' && onCommitArrival ? (
                  <button type="button" onClick={onCommitArrival}>
                    {session.target.mode === 'joining' ? '确认加入路线' : '确认到达并查看讲解'}
                  </button>
                ) : null}
                <button type="button" onClick={() => onListenToArrivalGuide?.(route.destination)}>
                  听小灵讲解
                </button>
                {onViewArrivalPoiDetail ? (
                  <button type="button" onClick={() => onViewArrivalPoiDetail(route.destination)}>
                    查看景点详情
                  </button>
                ) : (
                  <Link to={`/map-3d-guide-c/poi/${route.destination.poiId}?from=browse`}>
                    查看景点详情
                  </Link>
                )}
              </div>
            </div>
          )}
          {import.meta.env.DEV ? (
            <div className="navigation-prototype-card__debug" aria-label="导航原型开发调试">
              <div className="navigation-prototype-card__debug-actions">
                <button type="button" onClick={simulateDeviation}>模拟偏航</button>
                <button type="button" onClick={simulateRouteRecovery}>模拟回到路线</button>
              </div>
              <small>
                WGS84 {rawWgs84Position ? `${rawWgs84Position.lat.toFixed(6)}, ${rawWgs84Position.lng.toFixed(6)}` : '-'} ·
                GCJ-02 {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : '-'} · 偏移 {coordinateOffsetMeters ?? '-'}m ·
                精度 {location?.accuracy ?? '-'}m · 坐标龄 {locationAgeSeconds ?? '-'}s · 转换 {conversionStatus}/{conversionProvider} · 原始点（琥珀）/ 导航点（蓝） ·
                偏航 {deviation.state} · 距线 {deviation.distanceToRouteMeters ?? '-'}m · 段 {deviation.nearestSegmentIndex ?? '-'} ·
                命中 {deviation.suspectedHitCount}/{deviation.confirmedHitCount}/{deviation.recoveryHitCount} ·
                步骤 {candidateStepIndex ?? '-'}/{lastConfirmedStepIndex ?? '-'} · 提示 {lastAnnouncedStepIndex ?? '-'} · 请求 {requestGeneration}
                <br />目标 {session ? `${session.target.mode}/${session.target.routeId ?? '-'}#${session.target.targetStopIndex ?? '-'} · ${session.target.poiId}` : '-'} ·
                会话 {session?.id ?? '-'} · 提交 {session ? `${status === 'arrived' && !session.committed}/${session.committed}/${routeStageCommitReason ?? '-'}` : '-'} · 目标变更 {session?.targetChangedAt ?? '-'}
              </small>
              <div className="navigation-prototype-card__debug-actions">
                <button type="button" onClick={trajectoryRecording ? stopTrajectoryRecording : startTrajectoryRecording}>
                  {trajectoryRecording ? '停止记录' : '开始记录'}
                </button>
                <button type="button" onClick={clearTrajectory}>清空记录（{trajectoryRecordCount}）</button>
              </div>
              <button type="button" className="navigation-prototype-card__debug-export" onClick={exportTrajectory} disabled={!trajectoryRecordCount}>
                导出 JSON
              </button>
              <NavigationPrototypeReplayControls />
            </div>
          ) : null}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="navigation-prototype-card__error">
          <p>{error}</p>
          <button type="button" onClick={reset}>重新开始</button>
        </div>
      ) : null}
    </section>
  )
}
