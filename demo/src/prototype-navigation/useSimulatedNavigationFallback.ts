import { useCallback, useEffect, useRef } from 'react'

import type { ScenicRouteConfig } from '../data/lingshanScenicRoutes'
import { toGcj02Position } from './coordinateTransform'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { Gcj02Position, NavigationReplayPurpose, PrototypeNavigationTarget } from './types'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { useTrackReplay } from './useTrackReplay'

export type SimulatedNavigationStartResult =
  | { status: 'started'; targetName: string }
  | { status: 'focused'; targetName: string }
  | { status: 'cancelled' }
  | { status: 'unavailable'; message: string }

export function useSimulatedNavigationFallback(input: {
  route?: ScenicRouteConfig
  stage?: string
  currentStopIndex?: number
  joinStopIndex?: number
  target?: PrototypeNavigationTarget
  simulationOrigin?: Gcj02Position
  purpose?: NavigationReplayPurpose
  originLabel?: string
}) {
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const navigationRoute = useNavigationPrototypeStore((state) => state.route)
  const navigationSession = useNavigationPrototypeStore((state) => state.session)
  const startReplayTarget = useNavigationPrototypeStore((state) => state.startReplayTarget)
  const cancelNavigation = useNavigationPrototypeStore((state) => state.cancelNavigation)
  const rerouteNavigation = useNavigationPrototypeStore((state) => state.reroute)
  const acceptReplayFix = useNavigationPrototypeStore((state) => state.acceptSimulatedGcj02Location)
  const setReplayActive = useNavigationPrototypeStore((state) => state.setReplayActive)
  const replay = useTrackReplay({
    route: navigationRoute,
    suspended: navigationStatus === 'paused',
    acceptReplayFix,
    setReplayActive
  })
  const pendingSessionIdRef = useRef<string>()
  const pendingDeviationSessionIdRef = useRef<string>()
  const replayingSessionIdRef = useRef<string>()

  useEffect(() => {
    const pendingSessionId = pendingSessionIdRef.current
    if (!pendingSessionId || navigationSession?.id !== pendingSessionId || !navigationRoute || navigationStatus !== 'navigating') return
    pendingSessionIdRef.current = undefined
    replayingSessionIdRef.current = pendingSessionId
    if (pendingDeviationSessionIdRef.current === pendingSessionId) {
      pendingDeviationSessionIdRef.current = undefined
      replay.runShowcaseDeviation(useNavigationPrototypeStore.getState().convertedGcj02Position)
      return
    }
    replay.playRoute({ speed: 10, noiseMode: 'clean', seed: 20260713 })
  }, [navigationRoute, navigationSession?.id, navigationStatus, replay.playRoute, replay.runShowcaseDeviation])

  useEffect(() => {
    const replayingSessionId = replayingSessionIdRef.current
    if (!replayingSessionId) return
    if (navigationSession?.id === replayingSessionId && navigationStatus !== 'cancelled' && navigationStatus !== 'idle') return
    replayingSessionIdRef.current = undefined
    pendingDeviationSessionIdRef.current = undefined
    replay.reset()
  }, [navigationSession?.id, navigationStatus, replay.reset])

  useEffect(() => {
    const replayingSessionId = replayingSessionIdRef.current
    if (!replayingSessionId || navigationSession?.id !== replayingSessionId) return
    if (navigationStatus === 'navigating' && replay.status === 'paused') replay.resume()
  }, [navigationSession?.id, navigationStatus, replay.resume, replay.status])

  const start = useCallback((): SimulatedNavigationStartResult => {
    const purpose = input.purpose ?? 'debug'
    if (purpose === 'debug' && !isNavigationDebugEnabled()) return { status: 'unavailable', message: '模拟导航仅在开发调试模式可用' }
    const isFreePoi = input.target?.mode === 'free-poi'
    if (!isFreePoi && input.stage !== 'active' && input.stage !== 'joining') {
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

    const routeOriginStop = input.route ? input.route.stops[resolveSimulationOriginStopIndex({
      stage: input.stage ?? '',
      currentStopIndex: input.currentStopIndex ?? 0,
      joinStopIndex: input.joinStopIndex ?? 0,
      stopCount: input.route.stops.length
    })] : undefined
    const origin = input.simulationOrigin ?? (routeOriginStop?.location ? toGcj02Position(routeOriginStop.location) : undefined)
    if (!origin) return { status: 'unavailable', message: '模拟导航起点坐标尚未完善' }

    replay.reset()
    startReplayTarget(input.target, {
      ...origin,
      accuracy: 8,
      timestamp: Date.now(),
      source: 'replay-gcj02'
    }, { purpose, originLabel: input.originLabel ?? routeOriginStop?.name })
    const sessionId = useNavigationPrototypeStore.getState().session?.id
    if (!sessionId) return { status: 'unavailable', message: '未能创建模拟导航会话' }
    pendingSessionIdRef.current = sessionId
    return { status: 'started', targetName: input.target.name }
  }, [cancelNavigation, input, replay, startReplayTarget])

  const startDeviationDemo = useCallback((): SimulatedNavigationStartResult => {
    if (!input.target) return { status: 'unavailable', message: input.stage === 'active' ? '已是路线最后一站' : '加入站点不可用' }
    const state = useNavigationPrototypeStore.getState()
    const activeSameTarget = state.session && sameTarget(state.session.target, input.target)

    if (activeSameTarget && state.status === 'arrived') {
      return { status: 'unavailable', message: '当前导航已到达，请先确认到达或继续下一站' }
    }
    if (activeSameTarget && state.route && state.status === 'navigating') {
      replayingSessionIdRef.current = state.session?.id
      pendingDeviationSessionIdRef.current = undefined
      replay.runShowcaseDeviation(state.convertedGcj02Position)
      return { status: 'started', targetName: input.target.name }
    }

    const result = start()
    if (result.status !== 'started' && result.status !== 'focused') return result
    const nextState = useNavigationPrototypeStore.getState()
    const sessionId = nextState.session?.id
    if (!sessionId) return { status: 'unavailable', message: '未能创建偏航演示会话' }
    pendingDeviationSessionIdRef.current = sessionId
    if (nextState.route && nextState.status === 'navigating') {
      pendingDeviationSessionIdRef.current = undefined
      replayingSessionIdRef.current = sessionId
      replay.runShowcaseDeviation(nextState.convertedGcj02Position)
    }
    return { status: 'started', targetName: input.target.name }
  }, [input.stage, input.target, replay.runShowcaseDeviation, start])

  const reroute = useCallback(async () => {
    const before = useNavigationPrototypeStore.getState()
    const shouldResumeShowcase = before.session?.replayPurpose === 'showcase'
      && before.locationSource === 'replay-gcj02'
      && Boolean(before.route)
    const previousRoute = before.route
    const sessionId = before.session?.id

    await rerouteNavigation()

    if (!shouldResumeShowcase) return
    const after = useNavigationPrototypeStore.getState()
    if (!sessionId || after.session?.id !== sessionId || after.status !== 'navigating' || !after.route || after.route === previousRoute || after.lastRerouteError) return
    replayingSessionIdRef.current = sessionId
    replay.playRoute({ route: after.route, speed: 10, noiseMode: 'clean', seed: 20260717 })
  }, [replay.playRoute, rerouteNavigation])

  return { start, startDeviationDemo, reroute }
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
