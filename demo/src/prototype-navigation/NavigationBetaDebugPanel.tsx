import { useCallback, useMemo, useState } from 'react'

import type { ScenicRouteConfig } from '../data/lingshanScenicRoutes'
import type { LocalNavigationTestState, NavigationPrototypeMapRuntime } from './types'
import { NavigationPrototypeLocalTestMapLayer } from './NavigationPrototypeLocalTestMapLayer'
import {
  NavigationPrototypeMultiStopReplayControls,
  NavigationPrototypeReplayControls,
  type NavigationMultiStopReplayUiState,
  type NavigationSingleReplayUiState
} from './NavigationPrototypeReplayControls'

export type NavigationDebugPanelDisplay = 'expanded' | 'collapsed' | 'closed'

function sameSingleState(current: NavigationSingleReplayUiState, next: NavigationSingleReplayUiState) {
  return current.status === next.status && current.speed === next.speed
}

function sameMultiState(current: NavigationMultiStopReplayUiState, next: NavigationMultiStopReplayUiState) {
  return current.status === next.status
    && current.currentSegment === next.currentSegment
    && current.totalSegments === next.totalSegments
}

export function NavigationBetaDebugPanel({
  display,
  route,
  stage,
  currentStopIndex,
  joinStopIndex,
  mapRuntime,
  onDisplayChange,
  onConfirmArrival,
  onContinueToActive
}: {
  display: NavigationDebugPanelDisplay
  route: ScenicRouteConfig
  stage: string
  currentStopIndex: number
  joinStopIndex: number
  mapRuntime: NavigationPrototypeMapRuntime | null
  onDisplayChange: (display: NavigationDebugPanelDisplay) => void
  onConfirmArrival: () => void
  onContinueToActive: (stopIndex: number) => void
}) {
  const [singleReplay, setSingleReplay] = useState<NavigationSingleReplayUiState>({ status: 'idle', speed: 4 })
  const [multiReplay, setMultiReplay] = useState<NavigationMultiStopReplayUiState>({})
  const [localTestPhase, setLocalTestPhase] = useState<LocalNavigationTestState['phase']>()

  const handleSingleStateChange = useCallback((state: NavigationSingleReplayUiState) => {
    setSingleReplay((current) => sameSingleState(current, state) ? current : state)
  }, [])

  const handleMultiStateChange = useCallback((state: NavigationMultiStopReplayUiState) => {
    setMultiReplay((current) => sameMultiState(current, state) ? current : state)
  }, [])

  const handleStarted = useCallback(() => {
    if (display === 'expanded') onDisplayChange('collapsed')
  }, [display, onDisplayChange])

  const summary = useMemo(() => {
    if (localTestPhase === 'error') return { text: '本地测试失败', error: true }
    if (multiReplay.status === 'failed') return { text: '当前分段失败', error: true }
    if (multiReplay.status === 'awaiting-arrival-confirm') return { text: '等待到达确认', error: false }
    if (multiReplay.status === 'paused') return { text: '已暂停', error: false }
    if (localTestPhase === 'planning' || localTestPhase === 'navigating') return { text: '本地测试中', error: false }
    if (multiReplay.status && !['idle', 'completed', 'cancelled'].includes(multiReplay.status)) {
      const current = multiReplay.currentSegment ?? 1
      const total = multiReplay.totalSegments ?? 1
      return { text: `第 ${current} / ${total} 段`, error: false }
    }
    if (singleReplay.status === 'paused') return { text: '已暂停', error: false }
    if (singleReplay.status === 'playing') return { text: `单段回放 · ${singleReplay.speed}x`, error: false }
    return { text: '', error: false }
  }, [localTestPhase, multiReplay, singleReplay])

  return (
    <>
      {display === 'collapsed' ? (
        <div className={`navigation-beta-debug-capsule${summary.error ? ' is-error' : ''}`} aria-label="已收起的导航调试">
          <button type="button" className="navigation-beta-debug-capsule__summary" onClick={() => onDisplayChange('expanded')}>
            <strong>导航调试</strong>
            {summary.text ? <span>{summary.text}</span> : null}
          </button>
          <button
            type="button"
            className="navigation-beta-debug-capsule__expand"
            onClick={() => onDisplayChange('expanded')}
            aria-expanded="false"
            aria-label="展开导航调试面板"
          >
            展开
          </button>
          <button
            type="button"
            className="navigation-beta-debug-capsule__close"
            onClick={() => onDisplayChange('closed')}
            aria-label="关闭导航调试"
          >
            ×
          </button>
        </div>
      ) : null}

      <aside
        className="navigation-beta-debug-panel"
        aria-label="导航调试面板"
        hidden={display !== 'expanded'}
      >
        <header className="navigation-beta-debug-panel__header">
          <div>
            <small>仅开发环境</small>
            <strong>导航调试</strong>
          </div>
          <div className="navigation-beta-debug-panel__header-actions">
            <button
              type="button"
              onClick={() => onDisplayChange('collapsed')}
              aria-expanded="true"
              aria-label="收起导航调试面板"
            >
              收起
            </button>
            <button type="button" onClick={() => onDisplayChange('closed')} aria-label="关闭导航调试面板">关闭</button>
          </div>
        </header>
        <div className="navigation-beta-debug-panel__body">
          <NavigationPrototypeReplayControls
            onStateChange={handleSingleStateChange}
            onStarted={handleStarted}
          />
          <NavigationPrototypeMultiStopReplayControls
            debugEnabled
            route={route}
            stage={stage}
            currentStopIndex={currentStopIndex}
            joinStopIndex={joinStopIndex}
            confirmArrival={onConfirmArrival}
            continueToActive={onContinueToActive}
            onStateChange={handleMultiStateChange}
            onStarted={handleStarted}
          />
          <section className="navigation-beta-debug-panel__local-test-intro">
            <strong>本地真实导航测试</strong>
            <p>使用当前位置，在附近地图上选择一个测试终点。该测试不会修改灵山路线进度。</p>
          </section>
          <NavigationPrototypeLocalTestMapLayer
            runtime={mapRuntime}
            onStateChange={setLocalTestPhase}
            onStarted={handleStarted}
          />
        </div>
      </aside>
    </>
  )
}
