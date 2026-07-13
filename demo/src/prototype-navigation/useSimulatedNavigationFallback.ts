import { useCallback, useEffect, useRef } from 'react'

import type { ScenicRouteConfig } from '../data/lingshanScenicRoutes'
import { toGcj02Position } from './coordinateTransform'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { PrototypeNavigationTarget } from './types'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { useTrackReplay } from './useTrackReplay'

export type SimulatedNavigationStartResult =
  | { status: 'started'; targetName: string }
  | { status: 'focused'; targetName: string }
  | { status: 'cancelled' }
  | { status: 'unavailable'; message: string }

export function useSimulatedNavigationFallback(input: {
  route: ScenicRouteConfig
  stage: string
  currentStopIndex: number
  joinStopIndex: number
  target?: PrototypeNavigationTarget
}) {
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const navigationRoute = useNavigationPrototypeStore((state) => state.route)
  const navigationSession = useNavigationPrototypeStore((state) => state.session)
  const startReplayTarget = useNavigationPrototypeStore((state) => state.startReplayTarget)
  const cancelNavigation = useNavigationPrototypeStore((state) => state.cancelNavigation)
  const acceptReplayFix = useNavigationPrototypeStore((state) => state.acceptSimulatedGcj02Location)
  const setReplayActive = useNavigationPrototypeStore((state) => state.setReplayActive)
  const replay = useTrackReplay({
    route: navigationRoute,
    suspended: navigationStatus === 'paused',
    acceptReplayFix,
    setReplayActive
  })
  const pendingSessionIdRef = useRef<string>()
  const replayingSessionIdRef = useRef<string>()

  useEffect(() => {
    const pendingSessionId = pendingSessionIdRef.current
    if (!pendingSessionId || navigationSession?.id !== pendingSessionId || !navigationRoute || navigationStatus !== 'navigating') return
    pendingSessionIdRef.current = undefined
    replayingSessionIdRef.current = pendingSessionId
    replay.playRoute({ speed: 10, noiseMode: 'clean', seed: 20260713 })
  }, [navigationRoute, navigationSession?.id, navigationStatus, replay.playRoute])

  useEffect(() => {
    const replayingSessionId = replayingSessionIdRef.current
    if (!replayingSessionId) return
    if (navigationSession?.id === replayingSessionId && navigationStatus !== 'cancelled' && navigationStatus !== 'idle') return
    replayingSessionIdRef.current = undefined
    replay.reset()
  }, [navigationSession?.id, navigationStatus, replay.reset])

  const start = useCallback((): SimulatedNavigationStartResult => {
    if (!isNavigationDebugEnabled()) return { status: 'unavailable', message: '模拟导航仅在开发调试模式可用' }
    if (input.stage !== 'active' && input.stage !== 'joining') {
      return { status: 'unavailable', message: input.stage === 'arrived' ? '请先继续前往下一站' : '当前阶段不能启动模拟导航' }
    }
    if (!input.target) return { status: 'unavailable', message: input.stage === 'active' ? '已是路线最后一站' : '加入站点不可用' }

    const currentSession = useNavigationPrototypeStore.getState().session
    if (currentSession && sameTarget(currentSession.target, input.target)) {
      return { status: 'focused', targetName: input.target.name }
    }
    if (currentSession) {
      const confirmed = window.confirm(`当前正在前往“${currentSession.target.name}”。是否结束当前导航并改为模拟前往“${input.target.name}”？`)
      if (!confirmed) return { status: 'cancelled' }
      replay.reset()
      cancelNavigation()
    }

    const originStopIndex = resolveSimulationOriginStopIndex({
      stage: input.stage,
      currentStopIndex: input.currentStopIndex,
      joinStopIndex: input.joinStopIndex,
      stopCount: input.route.stops.length
    })
    const originStop = input.route.stops[originStopIndex]
    if (!originStop?.location) return { status: 'unavailable', message: '模拟导航起点坐标尚未完善' }

    replay.reset()
    startReplayTarget(input.target, {
      ...toGcj02Position(originStop.location),
      accuracy: 8,
      timestamp: Date.now(),
      source: 'replay-gcj02'
    })
    const sessionId = useNavigationPrototypeStore.getState().session?.id
    if (!sessionId) return { status: 'unavailable', message: '未能创建模拟导航会话' }
    pendingSessionIdRef.current = sessionId
    return { status: 'started', targetName: input.target.name }
  }, [cancelNavigation, input, replay, startReplayTarget])

  return { start }
}

function resolveSimulationOriginStopIndex(input: {
  stage: string
  currentStopIndex: number
  joinStopIndex: number
  stopCount: number
}) {
  if (input.stage === 'active') return clampStopIndex(input.currentStopIndex, input.stopCount)
  if (input.currentStopIndex !== input.joinStopIndex) return clampStopIndex(input.currentStopIndex, input.stopCount)
  if (input.joinStopIndex > 0) return input.joinStopIndex - 1
  return Math.min(1, Math.max(0, input.stopCount - 1))
}

function sameTarget(left: PrototypeNavigationTarget, right: PrototypeNavigationTarget) {
  return left.mode === right.mode
    && left.routeId === right.routeId
    && left.targetStopIndex === right.targetStopIndex
    && left.poiId === right.poiId
}

function clampStopIndex(index: number, stopCount: number) {
  return Math.min(Math.max(index, 0), Math.max(stopCount - 1, 0))
}
