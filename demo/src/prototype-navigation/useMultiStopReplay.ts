import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { ScenicRouteConfig } from '../data/lingshanScenicRoutes'
import { toGcj02Position } from './coordinateTransform'
import {
  createMultiStopReplaySession,
  useMultiStopReplayStore,
  type MultiStopSegmentResult
} from './multiStopReplay'
import { resolveRouteSegmentTarget } from './routeSegmentTarget'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { useTrackReplay } from './useTrackReplay'

const AUTO_CONFIRM_DELAY_MS = 800
const AUTO_CONTINUE_DELAY_MS = 900

type UseMultiStopReplayInput = {
  enabled: boolean
  route: ScenicRouteConfig
  stage: string
  currentStopIndex: number
  joinStopIndex: number
  confirmArrival: () => void
  continueToActive: (stopIndex: number) => void
}

export function useMultiStopReplay(input: UseMultiStopReplayInput) {
  const coordinator = useMultiStopReplayStore()
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const navigationRoute = useNavigationPrototypeStore((state) => state.route)
  const navigationSession = useNavigationPrototypeStore((state) => state.session)
  const navigationError = useNavigationPrototypeStore((state) => state.error)
  const requestGeneration = useNavigationPrototypeStore((state) => state.requestGeneration)
  const startReplayTarget = useNavigationPrototypeStore((state) => state.startReplayTarget)
  const pauseNavigation = useNavigationPrototypeStore((state) => state.pauseNavigation)
  const resumeReplayNavigation = useNavigationPrototypeStore((state) => state.resumeReplayNavigation)
  const cancelNavigation = useNavigationPrototypeStore((state) => state.cancelNavigation)
  const acceptReplayFix = useNavigationPrototypeStore((state) => state.acceptSimulatedGcj02Location)
  const setReplayActive = useNavigationPrototypeStore((state) => state.setReplayActive)
  const replay = useTrackReplay({
    route: navigationRoute,
    suspended: navigationStatus === 'paused',
    acceptReplayFix,
    setReplayActive
  })
  const generationRef = useRef(0)
  const timerRefs = useRef<number[]>([])
  const replayedSessionIdsRef = useRef(new Set<string>())
  const lastRouteIdRef = useRef(input.route.id)

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach((timer) => window.clearTimeout(timer))
    timerRefs.current = []
  }, [])

  const schedule = useCallback((callback: () => void, delay: number) => {
    const generation = generationRef.current
    const timer = window.setTimeout(() => {
      timerRefs.current = timerRefs.current.filter((item) => item !== timer)
      if (generation === generationRef.current) callback()
    }, delay)
    timerRefs.current.push(timer)
  }, [])

  const failCurrentSegment = useCallback((message: string) => {
    const session = useMultiStopReplayStore.getState().session
    if (!session) return
    const result: MultiStopSegmentResult = {
      fromStopIndex: session.currentFromStopIndex,
      targetStopIndex: session.currentTargetStopIndex,
      targetPoiId: input.route.stops[session.currentTargetStopIndex]?.poiId ?? input.route.stops[session.currentTargetStopIndex]?.id ?? '',
      targetName: input.route.stops[session.currentTargetStopIndex]?.name ?? '未知站点',
      sessionId: session.currentSegmentSessionId ?? '',
      startedAt: session.updatedAt,
      status: 'failed',
      error: message
    }
    coordinator.upsertResult(result)
    coordinator.patchSession({
      status: 'failed',
      lastError: { segmentFrom: session.currentFromStopIndex, segmentTo: session.currentTargetStopIndex, message }
    })
  }, [coordinator, input.route.stops])

  const beginSegment = useCallback((fromStopIndex: number, targetStopIndex: number, stage: 'active' | 'joining') => {
    const coordinatorSession = useMultiStopReplayStore.getState().session
    if (!coordinatorSession || coordinatorSession.routeId !== input.route.id) return
    clearTimers()
    generationRef.current += 1
    replay.reset()

    const resolution = resolveRouteSegmentTarget({
      route: input.route,
      stage,
      currentStopIndex: fromStopIndex,
      joinStopIndex: targetStopIndex
    })
    if (!('target' in resolution) || !resolution.target || resolution.target.targetStopIndex !== targetStopIndex) {
      failCurrentSegment('error' in resolution ? resolution.error : '导航目标无效')
      return
    }
    const originStop = input.route.stops[fromStopIndex]
    if (!originStop?.location) {
      failCurrentSegment('起点站导航坐标尚未完善')
      return
    }
    const origin = {
      ...toGcj02Position(originStop.location),
      accuracy: 8,
      timestamp: Date.now(),
      source: 'replay-gcj02' as const
    }
    coordinator.patchSession({
      status: 'planning-segment',
      currentFromStopIndex: fromStopIndex,
      currentTargetStopIndex: targetStopIndex,
      currentSegmentOrdinal: coordinatorSession.completedSegmentCount + 1,
      currentSegmentSessionId: undefined,
      currentRequestGeneration: undefined,
      lastError: undefined
    })
    startReplayTarget(resolution.target, origin)
    const navigation = useNavigationPrototypeStore.getState()
    coordinator.patchSession({
      currentSegmentSessionId: navigation.session?.id,
      currentRequestGeneration: navigation.requestGeneration
    })
  }, [clearTimers, coordinator, failCurrentSegment, input.route, replay, startReplayTarget])

  const start = useCallback(() => {
    if (!input.enabled || (input.stage !== 'active' && input.stage !== 'joining')) return
    const session = createMultiStopReplaySession({
      routeId: input.route.id,
      routeName: input.route.name,
      stage: input.stage,
      currentStopIndex: input.currentStopIndex,
      joinStopIndex: input.joinStopIndex,
      stopCount: input.route.stops.length,
      range: coordinator.range,
      mode: coordinator.mode,
      speed: coordinator.speed,
      noiseMode: coordinator.noiseMode
    })
    if (!session) return
    clearTimers()
    generationRef.current += 1
    replayedSessionIdsRef.current.clear()
    coordinator.startSession(session)
    beginSegment(session.currentFromStopIndex, session.currentTargetStopIndex, session.initialStage)
  }, [beginSegment, clearTimers, coordinator, input])

  const pause = useCallback(() => {
    const session = useMultiStopReplayStore.getState().session
    if (!session || ['completed', 'failed', 'cancelled'].includes(session.status)) return
    clearTimers()
    replay.pause()
    pauseNavigation()
    coordinator.patchSession({ status: 'paused', pausedFromStatus: session.status })
  }, [clearTimers, coordinator, pauseNavigation, replay])

  const resume = useCallback(() => {
    const session = useMultiStopReplayStore.getState().session
    if (!session || session.status !== 'paused') return
    const prior = session.pausedFromStatus ?? 'replaying-segment'
    coordinator.patchSession({ status: prior, pausedFromStatus: undefined })
    if (prior === 'replaying-segment' && navigationRoute) {
      resumeReplayNavigation()
      replay.resume()
    } else if (prior === 'planning-segment' && navigationRoute) {
      resumeReplayNavigation()
    } else if (prior === 'planning-segment' || prior === 'replaying-segment') {
      beginSegment(session.currentFromStopIndex, session.currentTargetStopIndex, session.initialStage === 'joining' && session.completedSegmentCount === 0 ? 'joining' : 'active')
    } else if (prior === 'awaiting-arrival-confirm' && session.mode === 'auto-inspection') {
      schedule(input.confirmArrival, AUTO_CONFIRM_DELAY_MS)
    } else if (prior === 'awaiting-route-continue' && session.mode === 'auto-inspection') {
      schedule(() => input.continueToActive(session.currentTargetStopIndex), AUTO_CONTINUE_DELAY_MS)
    }
  }, [beginSegment, coordinator, input, navigationRoute, replay, resumeReplayNavigation, schedule])

  const cancel = useCallback(() => {
    clearTimers()
    generationRef.current += 1
    replay.reset()
    cancelNavigation()
    coordinator.cancelSession()
  }, [cancelNavigation, clearTimers, coordinator, replay])

  const retry = useCallback(() => {
    const session = useMultiStopReplayStore.getState().session
    if (!session || session.status !== 'failed') return
    beginSegment(session.currentFromStopIndex, session.currentTargetStopIndex, session.initialStage === 'joining' && session.completedSegmentCount === 0 ? 'joining' : 'active')
  }, [beginSegment])

  useEffect(() => {
    coordinator.hydrate(input.enabled)
  }, [coordinator, input.enabled])

  useEffect(() => {
    const session = coordinator.session
    if (!input.enabled || !session || session.routeId !== input.route.id || !navigationSession) return
    if (session.currentSegmentSessionId !== navigationSession.id || session.currentTargetStopIndex !== navigationSession.target.targetStopIndex) return
    if (session.currentRequestGeneration !== undefined && requestGeneration < session.currentRequestGeneration) return

    if (navigationStatus === 'error') {
      failCurrentSegment(navigationError ?? '当前分段规划失败')
      return
    }
    if (navigationStatus === 'navigating' && navigationRoute && !replayedSessionIdsRef.current.has(navigationSession.id)) {
      replayedSessionIdsRef.current.add(navigationSession.id)
      coordinator.upsertResult({
        fromStopIndex: session.currentFromStopIndex,
        targetStopIndex: session.currentTargetStopIndex,
        targetPoiId: navigationSession.target.poiId,
        targetName: navigationSession.target.name,
        sessionId: navigationSession.id,
        plannedDistanceMeters: navigationRoute.distanceMeters,
        plannedDurationMinutes: navigationRoute.durationMinutes,
        stepCount: navigationRoute.steps.length,
        startedAt: Date.now(),
        status: 'cancelled'
      })
      coordinator.patchSession({ status: 'replaying-segment' })
      replay.playRoute({ speed: session.speedMultiplier, noiseMode: session.noiseMode })
      return
    }
    if (navigationStatus === 'arrived' && session.status === 'replaying-segment') {
      replay.pause()
      const prior = useMultiStopReplayStore.getState().results.find((item) => item.targetStopIndex === session.currentTargetStopIndex)
      if (prior) coordinator.upsertResult({ ...prior, arrivedAt: Date.now() })
      coordinator.patchSession({ status: 'awaiting-arrival-confirm' })
      if (session.mode === 'auto-inspection') schedule(input.confirmArrival, AUTO_CONFIRM_DELAY_MS)
    }
  }, [coordinator, failCurrentSegment, input, navigationError, navigationRoute, navigationSession, navigationStatus, replay, requestGeneration, schedule])

  useEffect(() => {
    const session = coordinator.session
    if (!input.enabled || !session || session.routeId !== input.route.id) return
    const target = session.currentTargetStopIndex

    if (session.status === 'awaiting-arrival-confirm') {
      const gateCommitted = session.initialStage === 'joining' && session.completedSegmentCount === 0
        ? input.stage === 'active' && input.currentStopIndex === target
        : input.stage === 'arrived' && input.currentStopIndex === target
      if (!gateCommitted) return
      const prior = coordinator.results.find((item) => item.targetStopIndex === target)
      if (prior) coordinator.upsertResult({ ...prior, committedAt: Date.now(), status: 'completed' })
      const completedTargetStopIndices = Array.from(new Set([...session.completedTargetStopIndices, target]))
      const completedSegmentCount = completedTargetStopIndices.length
      if (target >= session.endStopIndex) {
        coordinator.patchSession({ status: 'completed', completedTargetStopIndices, completedSegmentCount })
        return
      }
      if (input.stage === 'active') {
        coordinator.patchSession({ status: 'preparing', completedTargetStopIndices, completedSegmentCount, initialStage: 'active' })
        schedule(() => beginSegment(target, target + 1, 'active'), AUTO_CONTINUE_DELAY_MS)
      } else {
        coordinator.patchSession({ status: 'awaiting-route-continue', completedTargetStopIndices, completedSegmentCount, initialStage: 'active' })
        if (session.mode === 'auto-inspection') schedule(() => input.continueToActive(target), AUTO_CONTINUE_DELAY_MS)
      }
      return
    }

    if (session.status === 'awaiting-route-continue' && input.stage === 'active' && input.currentStopIndex === target) {
      coordinator.patchSession({ status: 'preparing' })
      schedule(() => beginSegment(target, target + 1, 'active'), AUTO_CONTINUE_DELAY_MS)
    }
  }, [beginSegment, coordinator, input, schedule])

  useEffect(() => {
    if (!coordinator.session || lastRouteIdRef.current === input.route.id) {
      lastRouteIdRef.current = input.route.id
      return
    }
    cancel()
    lastRouteIdRef.current = input.route.id
  }, [cancel, coordinator.session, input.route.id])

  useEffect(() => () => {
    clearTimers()
    generationRef.current += 1
    const session = useMultiStopReplayStore.getState().session
    if (session && ['planning-segment', 'replaying-segment', 'preparing'].includes(session.status)) {
      useNavigationPrototypeStore.getState().pauseNavigation()
      useMultiStopReplayStore.getState().patchSession({ status: 'paused', pausedFromStatus: session.status })
    }
  }, [clearTimers])

  const canStart = input.enabled
    && (input.stage === 'active' || input.stage === 'joining')
    && (input.stage === 'joining' ? input.joinStopIndex : input.currentStopIndex + 1) < input.route.stops.length
  const currentFromName = coordinator.session ? input.route.stops[coordinator.session.currentFromStopIndex]?.name : undefined
  const currentTargetName = coordinator.session ? input.route.stops[coordinator.session.currentTargetStopIndex]?.name : undefined

  return useMemo(() => ({
    ...coordinator,
    canStart,
    currentFromName,
    currentTargetName,
    start,
    pause,
    resume,
    cancel,
    retry
  }), [canStart, coordinator, currentFromName, currentTargetName, start, pause, resume, cancel, retry])
}
