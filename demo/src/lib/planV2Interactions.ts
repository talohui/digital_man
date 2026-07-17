export type PlanV2PlanningMode = 'smart' | 'manual'

export function getNextPlanningMode(current: PlanV2PlanningMode, key: string): PlanV2PlanningMode {
  if (key === 'Home') return 'smart'
  if (key === 'End') return 'manual'
  if (key === 'ArrowLeft' || key === 'ArrowRight') return current === 'smart' ? 'manual' : 'smart'
  return current
}

export function resolveInitialRouteStopId(stopIds: readonly string[], requestedStopId?: string) {
  if (requestedStopId && stopIds.includes(requestedStopId)) return requestedStopId
  return stopIds[0]
}

export function getRouteStopTargetIndex(stopCount: number, currentIndex: number, key: string) {
  if (stopCount <= 0) return -1
  const boundedIndex = Math.max(0, Math.min(stopCount - 1, currentIndex))
  if (key === 'Home') return 0
  if (key === 'End') return stopCount - 1
  if (key === 'ArrowLeft' || key === 'ArrowUp') return Math.max(0, boundedIndex - 1)
  if (key === 'ArrowRight' || key === 'ArrowDown') return Math.min(stopCount - 1, boundedIndex + 1)
  return boundedIndex
}
