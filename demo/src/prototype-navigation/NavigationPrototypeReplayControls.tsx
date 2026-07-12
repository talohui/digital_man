import { useState } from 'react'

import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { useTrackReplay } from './useTrackReplay'
import { useMultiStopReplay } from './useMultiStopReplay'
import { exportMultiStopReplayJson, type MultiStopReplayMode, type MultiStopReplayRange } from './multiStopReplay'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { ReplayNoiseMode, ReplaySpeed } from './types'
import type { ScenicRouteConfig } from '../data/lingshanScenicRoutes'

export function NavigationPrototypeReplayControls() {
  const [open, setOpen] = useState(false)
  const [jumpStepIndex, setJumpStepIndex] = useState(0)
  const route = useNavigationPrototypeStore((state) => state.route)
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const progress = useNavigationPrototypeStore((state) => state.progress)
  const candidateStepIndex = useNavigationPrototypeStore((state) => state.candidateStepIndex)
  const confirmedStepIndex = useNavigationPrototypeStore((state) => state.lastConfirmedStepIndex)
  const stepBoundaryPassedMeters = useNavigationPrototypeStore((state) => state.stepBoundaryPassedMeters)
  const heading = useNavigationPrototypeStore((state) => state.heading)
  const lastAnnouncedStepIndex = useNavigationPrototypeStore((state) => state.lastAnnouncedStepIndex)
  const acceptReplayFix = useNavigationPrototypeStore((state) => state.acceptSimulatedGcj02Location)
  const setReplayActive = useNavigationPrototypeStore((state) => state.setReplayActive)
  const replay = useTrackReplay({ route, suspended: navigationStatus === 'paused', acceptReplayFix, setReplayActive })

  if (!isNavigationDebugEnabled() || !route) return null

  const totalSteps = route.steps.length
  return <details className="navigation-prototype-replay" open={open} onToggle={(event) => setOpen((event.target as HTMLDetailsElement).open)}>
    <summary>轨迹回放调试</summary>
    <div className="navigation-prototype-replay__controls">
      <label>速度
        <select value={replay.speed} onChange={(event) => replay.setSpeed(Number(event.target.value) as ReplaySpeed)}>
          <option value={1}>1x</option><option value={4}>4x</option><option value={10}>10x</option>
        </select>
      </label>
      <label>噪声
        <select value={replay.noiseMode} onChange={(event) => replay.setNoiseMode(event.target.value as ReplayNoiseMode)}>
          <option value="clean">clean</option><option value="normal">normal</option><option value="poor">poor</option><option value="rejected">rejected</option>
        </select>
      </label>
      <label>seed
        <input value={replay.seed} inputMode="numeric" onChange={(event) => replay.setSeed(Number(event.target.value) || 0)} />
      </label>
      <div className="navigation-prototype-replay__buttons">
        <button type="button" onClick={replay.playFromStart}>从头播放</button>
        <button type="button" onClick={replay.pause}>暂停</button>
        <button type="button" onClick={replay.resume}>继续</button>
        <button type="button" onClick={replay.step}>单步前进</button>
        <button type="button" onClick={replay.reset}>重置</button>
      </div>
      <div className="navigation-prototype-replay__buttons">
        <button type="button" onClick={() => setJumpStepIndex((index) => Math.max(0, index - 1))}>上一步</button>
        <button type="button" onClick={() => replay.jumpToStep(jumpStepIndex)}>跳到 step {Math.min(jumpStepIndex, Math.max(totalSteps - 1, 0))}</button>
        <button type="button" onClick={() => setJumpStepIndex((index) => Math.min(Math.max(totalSteps - 1, 0), index + 1))}>下一步</button>
        <button type="button" onClick={() => {
          const last = Math.max(totalSteps - 1, 0)
          setJumpStepIndex(last)
          replay.jumpToStep(last)
        }}>跳到最后一步</button>
        <button type="button" onClick={replay.jumpNearDestination}>跳到终点附近</button>
      </div>
      <div className="navigation-prototype-replay__buttons">
        <button type="button" onClick={() => replay.runScenario('brief_drift')}>短暂漂移</button>
        <button type="button" onClick={() => replay.runScenario('sustained_off_route')}>持续偏航</button>
        <button type="button" onClick={() => replay.runScenario('recovery')}>恢复路线</button>
        <button type="button" onClick={() => replay.runScenario('low_accuracy_off_route')}>低精度偏移</button>
        <button type="button" onClick={() => replay.runScenario('low_accuracy_arrival')}>低精度终点</button>
        <button type="button" onClick={() => replay.runScenario('arrival_jitter')}>到达抖动</button>
      </div>
      <small>
        {replay.status} · {replay.scenario} · {replay.frameIndex}/{replay.frameCount} · 最近点 {progress?.nearestPolylineIndex ?? '-'} ·
        段 {progress?.nearestSegmentIndex ?? '-'} · 沿线 {progress?.alongRouteMeters ?? '-'}m / 剩余 {progress?.remainingRouteMeters ?? '-'}m<br />
        候选步骤 {candidateStepIndex ?? '-'} · 已确认 {confirmedStepIndex ?? '-'} · 当前步骤 {progress?.currentStepIndex ?? '-'} · 步末 {progress?.currentStepEndAlongMeters ?? '-'}m · 越界 {stepBoundaryPassedMeters ?? '-'}m · 提示 {lastAnnouncedStepIndex ?? '-'}<br />
        方向 {heading?.source ?? 'unavailable'} {heading?.selectedHeading === undefined ? '' : `${Math.round(heading.selectedHeading)}°`}
      </small>
      <p>当前：{progress?.currentInstruction ?? '-'}<br />下一步：{progress?.nextInstruction ?? '-'}</p>
    </div>
  </details>
}

export function NavigationPrototypeMultiStopReplayControls(props: {
  debugEnabled: boolean
  route: ScenicRouteConfig
  stage: string
  currentStopIndex: number
  joinStopIndex: number
  confirmArrival: () => void
  continueToActive: (stopIndex: number) => void
}) {
  const replay = useMultiStopReplay({
    enabled: props.debugEnabled && isNavigationDebugEnabled(),
    route: props.route,
    stage: props.stage,
    currentStopIndex: props.currentStopIndex,
    joinStopIndex: props.joinStopIndex,
    confirmArrival: props.confirmArrival,
    continueToActive: props.continueToActive
  })
  if (!props.debugEnabled || !isNavigationDebugEnabled()) return null

  const anchorIndex = props.stage === 'joining' ? props.joinStopIndex : props.currentStopIndex
  const remaining = Math.max(0, props.route.stops.length - (props.stage === 'joining' ? props.joinStopIndex : props.currentStopIndex + 1))
  const exportJson = () => {
    const blob = new Blob([exportMultiStopReplayJson(replay.session, replay.results)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `lingshan-multi-replay-${props.route.id}-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <details className="navigation-prototype-replay navigation-prototype-multi-replay">
    <summary>多站路线回放</summary>
    <div className="navigation-prototype-replay__controls">
      <p>当前路线：{props.route.name}<br />当前锚点：第 {anchorIndex + 1} 站 {props.route.stops[anchorIndex]?.name ?? '-'}</p>
      <label>范围
        <select value={replay.range} onChange={(event) => replay.setRange((event.target.value === 'all' ? 'all' : Number(event.target.value)) as MultiStopReplayRange)}>
          <option value={2}>后续 2 段（实际 {Math.min(2, remaining)} 段）</option>
          <option value={3}>后续 3 段（实际 {Math.min(3, remaining)} 段）</option>
          <option value="all">全部剩余（{remaining} 段）</option>
        </select>
      </label>
      <label>模式
        <select value={replay.mode} onChange={(event) => replay.setMode(event.target.value as MultiStopReplayMode)}>
          <option value="manual-confirm">每站人工确认</option><option value="auto-inspection">自动巡检</option>
        </select>
      </label>
      <label>速度
        <select value={replay.speed} onChange={(event) => replay.setSpeed(Number(event.target.value) as ReplaySpeed)}>
          <option value={1}>1x</option><option value={4}>4x</option><option value={10}>10x</option>
        </select>
      </label>
      <label>噪声
        <select value={replay.noiseMode} onChange={(event) => replay.setNoiseMode(event.target.value as 'clean' | 'normal')}>
          <option value="clean">clean</option><option value="normal">normal</option>
        </select>
      </label>
      <small>当前可回放 {remaining} 段，范围会自动按路线末站缩短。</small>
      <div className="navigation-prototype-replay__buttons">
        <button type="button" disabled={!replay.canStart || Boolean(replay.session && !['completed', 'cancelled'].includes(replay.session.status))} onClick={replay.start}>开始多站回放</button>
        {replay.session?.status === 'paused'
          ? <button type="button" onClick={replay.resume}>继续</button>
          : <button type="button" disabled={!replay.session || ['completed', 'cancelled', 'failed'].includes(replay.session.status)} onClick={replay.pause}>暂停</button>}
        <button type="button" disabled={!replay.session} onClick={replay.cancel}>结束</button>
        {replay.session?.status === 'failed' ? <button type="button" onClick={replay.retry}>重试当前分段</button> : null}
        <button type="button" disabled={!replay.results.length} onClick={exportJson}>导出 JSON</button>
      </div>
      {replay.session ? <p>
        当前分段：{replay.session.currentSegmentOrdinal} / {replay.session.totalSegmentCount}<br />
        当前起点：{replay.currentFromName ?? '-'}<br />
        当前目标：{replay.currentTargetName ?? '-'}<br />
        已确认到达：{replay.session.completedSegmentCount} 个站点<br />
        状态：{replay.session.status}
        {replay.session.lastError ? <><br />错误：{replay.session.lastError.message}</> : null}
      </p> : null}
      {replay.results.length ? <small>
        结果：{replay.results.filter((item) => item.status === 'completed').length}/{replay.session?.totalSegmentCount ?? replay.results.length} 成功<br />
        当前 RouteStage：{props.stage} / stop {props.currentStopIndex + 1}<br />
        {replay.results.map((item) => `${item.fromStopIndex + 1}→${item.targetStopIndex + 1} ${item.plannedDistanceMeters ?? '-'}m / ${item.stepCount ?? '-'} steps / ${item.status}`).join('\n')}
      </small> : null}
    </div>
  </details>
}
