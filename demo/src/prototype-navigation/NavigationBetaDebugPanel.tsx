import type { ScenicRouteConfig } from '../data/lingshanScenicRoutes'
import type { NavigationPrototypeMapRuntime } from './types'
import { NavigationPrototypeLocalTestMapLayer } from './NavigationPrototypeLocalTestMapLayer'
import {
  NavigationPrototypeMultiStopReplayControls,
  NavigationPrototypeReplayControls
} from './NavigationPrototypeReplayControls'

export function NavigationBetaDebugPanel({
  open,
  route,
  stage,
  currentStopIndex,
  joinStopIndex,
  mapRuntime,
  onClose,
  onConfirmArrival,
  onContinueToActive
}: {
  open: boolean
  route: ScenicRouteConfig
  stage: string
  currentStopIndex: number
  joinStopIndex: number
  mapRuntime: NavigationPrototypeMapRuntime | null
  onClose: () => void
  onConfirmArrival: () => void
  onContinueToActive: (stopIndex: number) => void
}) {
  if (!open) return null

  return (
    <aside className="navigation-beta-debug-panel" aria-label="导航调试面板">
      <header className="navigation-beta-debug-panel__header">
        <div>
          <small>仅开发环境</small>
          <strong>导航调试</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭导航调试">×</button>
      </header>
      <div className="navigation-beta-debug-panel__body">
        <NavigationPrototypeReplayControls />
        <NavigationPrototypeMultiStopReplayControls
          debugEnabled
          route={route}
          stage={stage}
          currentStopIndex={currentStopIndex}
          joinStopIndex={joinStopIndex}
          confirmArrival={onConfirmArrival}
          continueToActive={onContinueToActive}
        />
        <section className="navigation-beta-debug-panel__local-test-intro">
          <strong>本地真实导航测试</strong>
          <p>使用当前位置，在附近地图上选择一个测试终点。该测试不会修改灵山路线进度。</p>
        </section>
        <NavigationPrototypeLocalTestMapLayer runtime={mapRuntime} />
      </div>
    </aside>
  )
}
