import { useCallback, useEffect, useRef, useState } from 'react'

import { createReplayScenario, createRouteReplay } from './trackReplay'
import type {
  NavigationPrototypeRoute,
  ReplayFix,
  ReplayNoiseMode,
  ReplayScenario,
  ReplaySpeed
} from './types'

const REPLAY_TICK_MS = 500

export type TrackReplayStatus = 'idle' | 'playing' | 'paused' | 'completed'

type UseTrackReplayInput = {
  route?: NavigationPrototypeRoute
  acceptReplayFix: (fix: ReplayFix) => void
  setReplayActive: (active: boolean) => void
}

export function useTrackReplay({ route, acceptReplayFix, setReplayActive }: UseTrackReplayInput) {
  const [status, setStatus] = useState<TrackReplayStatus>('idle')
  const [speed, setSpeed] = useState<ReplaySpeed>(4)
  const [noiseMode, setNoiseMode] = useState<ReplayNoiseMode>('clean')
  const [seed, setSeed] = useState(20260712)
  const [frameIndex, setFrameIndex] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const [scenario, setScenario] = useState<ReplayScenario>('route')
  const framesRef = useRef<ReplayFix[]>([])
  const indexRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const emitNext = useCallback(() => {
    const frame = framesRef.current[indexRef.current]
    if (!frame) {
      clearTimer()
      setStatus('completed')
      return
    }
    acceptReplayFix(frame)
    indexRef.current += 1
    setFrameIndex(indexRef.current)
    if (indexRef.current >= framesRef.current.length) {
      clearTimer()
      setStatus('completed')
      return
    }
    timerRef.current = window.setTimeout(emitNext, REPLAY_TICK_MS / speed)
  }, [acceptReplayFix, clearTimer, speed])

  const loadFrames = useCallback((nextFrames: ReplayFix[], nextScenario: ReplayScenario, autoPlay: boolean) => {
    clearTimer()
    if (!nextFrames.length) return
    framesRef.current = nextFrames
    indexRef.current = 0
    setFrameIndex(0)
    setFrameCount(nextFrames.length)
    setScenario(nextScenario)
    setReplayActive(true)
    if (autoPlay) {
      setStatus('playing')
      timerRef.current = window.setTimeout(emitNext, 0)
    } else {
      setStatus('paused')
    }
  }, [clearTimer, emitNext, setReplayActive])

  const playFromStart = useCallback(() => {
    if (!route) return
    loadFrames(createRouteReplay(route, { noiseMode, seed, startTimestamp: Date.now() }), 'route', true)
  }, [loadFrames, noiseMode, route, seed])

  const pause = useCallback(() => {
    clearTimer()
    if (status === 'playing') setStatus('paused')
  }, [clearTimer, status])

  const resume = useCallback(() => {
    if (!framesRef.current.length || indexRef.current >= framesRef.current.length) return
    clearTimer()
    setReplayActive(true)
    setStatus('playing')
    timerRef.current = window.setTimeout(emitNext, 0)
  }, [clearTimer, emitNext, setReplayActive])

  const step = useCallback(() => {
    if (!route) return
    if (!framesRef.current.length || indexRef.current >= framesRef.current.length) {
      loadFrames(createRouteReplay(route, { noiseMode, seed, startTimestamp: Date.now() }), 'route', false)
    }
    clearTimer()
    const frame = framesRef.current[indexRef.current]
    if (!frame) return
    acceptReplayFix(frame)
    indexRef.current += 1
    setFrameIndex(indexRef.current)
    setStatus(indexRef.current >= framesRef.current.length ? 'completed' : 'paused')
  }, [acceptReplayFix, clearTimer, loadFrames, noiseMode, route, seed])

  const reset = useCallback(() => {
    clearTimer()
    framesRef.current = []
    indexRef.current = 0
    setFrameIndex(0)
    setFrameCount(0)
    setScenario('route')
    setStatus('idle')
    setReplayActive(false)
  }, [clearTimer, setReplayActive])

  const jumpToStep = useCallback((stepIndex: number) => {
    if (!route?.steps.length) return
    const safeIndex = Math.min(Math.max(stepIndex, 0), route.steps.length - 1)
    const indexes = route.steps[safeIndex].polylineIndexes ?? []
    const pointIndex = indexes[0] ?? Math.floor((safeIndex / Math.max(route.steps.length - 1, 1)) * (route.polyline.length - 1))
    const point = route.polyline[Math.min(Math.max(pointIndex, 0), route.polyline.length - 1)]
    if (!point) return
    const now = Date.now()
    const frames: ReplayFix[] = [0, 1].map((index) => ({
      ...point,
      accuracy: 8,
      timestamp: now + index * 1_000,
      source: 'replay-gcj02',
      replayProgress: pointIndex / Math.max(route.polyline.length - 1, 1),
      replayScenario: 'route',
      seed
    }))
    // This remains a normal two-fix replay injection so the existing step
    // hysteresis decides whether a forward step is confirmed.
    loadFrames(frames, 'route', true)
  }, [loadFrames, route, seed])

  const jumpNearDestination = useCallback(() => {
    if (!route) return
    const now = Date.now()
    loadFrames([{ ...route.destination, accuracy: 8, timestamp: now, source: 'replay-gcj02', replayProgress: 1, replayScenario: 'route', seed }], 'route', true)
  }, [loadFrames, route, seed])

  const runScenario = useCallback((nextScenario: Exclude<ReplayScenario, 'route'>) => {
    if (!route) return
    loadFrames(createReplayScenario(route, nextScenario, seed, Date.now()), nextScenario, true)
  }, [loadFrames, route, seed])

  useEffect(() => () => {
    clearTimer()
    setReplayActive(false)
  }, [clearTimer, setReplayActive])

  return {
    status,
    speed,
    setSpeed,
    noiseMode,
    setNoiseMode,
    seed,
    setSeed,
    frameIndex,
    frameCount,
    scenario,
    playFromStart,
    pause,
    resume,
    step,
    reset,
    jumpToStep,
    jumpNearDestination,
    runScenario
  }
}
