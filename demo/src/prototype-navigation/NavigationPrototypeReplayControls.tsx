import { useState } from 'react'

import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { useTrackReplay } from './useTrackReplay'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { ReplayNoiseMode, ReplaySpeed } from './types'

export function NavigationPrototypeReplayControls() {
  const [open, setOpen] = useState(false)
  const [jumpStepIndex, setJumpStepIndex] = useState(0)
  const route = useNavigationPrototypeStore((state) => state.route)
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const progress = useNavigationPrototypeStore((state) => state.progress)
  const candidateStepIndex = useNavigationPrototypeStore((state) => state.candidateStepIndex)
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
        候选步骤 {candidateStepIndex ?? '-'} · 当前步骤 {progress?.currentStepIndex ?? '-'} · 提示 {lastAnnouncedStepIndex ?? '-'}
      </small>
      <p>当前：{progress?.currentInstruction ?? '-'}<br />下一步：{progress?.nextInstruction ?? '-'}</p>
    </div>
  </details>
}
