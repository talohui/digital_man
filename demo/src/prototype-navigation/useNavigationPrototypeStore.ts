import { create } from 'zustand'

import { watchPrototypeLocation } from './browserGeolocation'
import {
  calculateCoordinateOffsetMeters,
  createPrototypeCoordinateTransformProvider,
  toGcj02Position,
  toConvertedGcj02Location
} from './coordinateTransform'
import { buildNavigationPrototypeProgress, resolveStepIndexFromPolylineIndex } from './navigationProgress'
import { formatPrototypeNavigationPrompt } from './prototypeNavigationPrompt'
import { projectPointToPolyline } from './routeDeviation'
import { requestPrototypeWalkingRoute } from './tencentWalkingRoute'
import { haversineDistanceMeters } from '../lib/routeProgress'
import type {
  BrowserWgs84Location,
  ConvertedGcj02Location,
  CoordinateConversionStatus,
  NavigationPrototypeEndpoint,
  NavigationPrototypeProgress,
  NavigationPrototypeRoute,
  NavigationPrototypeStatus,
  NavigationPrototypeTraceRecord,
  PrototypeDeviation
} from './types'

const ARRIVAL_DISTANCE_METERS = 35
const REQUIRED_ARRIVAL_LOCATION_HITS = 3
const MAX_ACCEPTED_ACCURACY_METERS = 100
const MAX_DEVIATION_ACCURACY_METERS = 50
const REQUIRED_FORWARD_STEP_HITS = 2
const ON_ROUTE_DISTANCE_METERS = 30
const REQUIRED_SUSPECTED_HITS = 3
const REQUIRED_CONFIRMED_HITS = 4
const REQUIRED_RECOVERY_HITS = 2
const SUSPECTED_DURATION_MS = 9_000
const CONFIRMED_DURATION_MS = 12_000
const DISMISS_COOLDOWN_MS = 30_000
const MAX_SUSPECTED_THRESHOLD_METERS = 70
const MAX_CONFIRMED_THRESHOLD_METERS = 100
const COORDINATE_TRANSFORM_MIN_DISTANCE_METERS = 5
const COORDINATE_TRANSFORM_MAX_INTERVAL_MS = 4_000
const LOCATION_STALE_MS = 15_000
const MAX_TRAJECTORY_RECORDS = 300

let stopLocationWatch: (() => void) | null = null
let requestGeneration = 0
let coordinateConversionGeneration = 0
const coordinateTransformProvider = createPrototypeCoordinateTransformProvider()

type NavigationPrototypeStore = {
  status: NavigationPrototypeStatus
  route?: NavigationPrototypeRoute
  rawWgs84Position?: BrowserWgs84Location
  convertedGcj02Position?: ConvertedGcj02Location
  lastConversionInputWgs84Position?: BrowserWgs84Location
  conversionStatus: CoordinateConversionStatus
  conversionProvider: string
  conversionError?: string
  coordinateOffsetMeters?: number
  conversionGeneration: number
  progress?: NavigationPrototypeProgress
  arrivalLocationHits: number
  candidateStepIndex?: number
  candidateStepHitCount: number
  lastConfirmedStepIndex?: number
  lastAnnouncedStepIndex?: number
  latestStepPrompt?: string
  deviation: PrototypeDeviation
  requestGeneration: number
  reroutePending: boolean
  lastRerouteError?: string
  trajectoryRecording: boolean
  trajectory: NavigationPrototypeTraceRecord[]
  error?: string
  start: (origin: NavigationPrototypeEndpoint, destination: NavigationPrototypeEndpoint) => Promise<void>
  acceptRawWgs84Location: (location: BrowserWgs84Location) => void
  acceptSimulatedGcj02Location: (location: ConvertedGcj02Location) => void
  reroute: () => Promise<void>
  continueCurrentRoute: () => void
  simulateDeviation: () => void
  simulateRouteRecovery: () => void
  simulateArrival: () => void
  startTrajectoryRecording: () => void
  stopTrajectoryRecording: () => void
  clearTrajectory: () => void
  exportTrajectory: () => void
  reset: () => void
}

export const useNavigationPrototypeStore = create<NavigationPrototypeStore>((set, get) => {
  const appendTrajectoryRecord = (raw: BrowserWgs84Location | undefined, converted: ConvertedGcj02Location) => {
    const state = get()
    if (!import.meta.env.DEV || !state.trajectoryRecording || !raw) return
    const record: NavigationPrototypeTraceRecord = {
      timestamp: converted.timestamp,
      rawWgs84: raw,
      convertedGcj02: converted,
      accuracy: converted.accuracy,
      offsetMeters: state.coordinateOffsetMeters ?? calculateCoordinateOffsetMeters(raw, converted),
      distanceToRouteMeters: state.deviation.distanceToRouteMeters,
      deviationState: state.deviation.state,
      currentStepIndex: state.progress?.currentStepIndex
    }
    set({ trajectory: [...state.trajectory, record].slice(-MAX_TRAJECTORY_RECORDS) })
  }

  const acceptConvertedGcj02Location = (location: ConvertedGcj02Location, raw?: BrowserWgs84Location) => {
    const state = get()
    if (state.status === 'arrived' || !isAcceptedPrototypeLocation(location)) return

    // Converted fixes arriving late are visible for diagnosis but never feed
    // route progress, arrival or deviation decisions.
    if (Date.now() - location.timestamp > LOCATION_STALE_MS) {
      set({ convertedGcj02Position: location })
      return
    }

    if (!state.route) {
      set({ convertedGcj02Position: location, arrivalLocationHits: 0 })
      appendTrajectoryRecord(raw, location)
      return
    }

    const route = state.route
    const rawProgress = buildNavigationPrototypeProgress(route, location)
    const candidateStepIndex = resolveStepIndexFromPolylineIndex({
      nearestPolylineIndex: rawProgress.nearestPolylineIndex,
      steps: route.steps,
      polylinePointCount: route.polyline.length
    })
    const confirmedStep = resolveConfirmedStep({
      candidateStepIndex,
      candidateStepHitCount: state.candidateStepHitCount,
      priorCandidateStepIndex: state.candidateStepIndex,
      lastConfirmedStepIndex: state.lastConfirmedStepIndex ?? 0,
      totalSteps: route.steps.length,
      nearArrival: rawProgress.distanceToDestinationMeters < ARRIVAL_DISTANCE_METERS
    })
    const progress = buildNavigationPrototypeProgress(route, location, confirmedStep.stepIndex)
    const deviation = evaluateDeviation({ prior: state.deviation, location, route, timestamp: location.timestamp })
    const isWithinArrivalRadius = progress.distanceToDestinationMeters < ARRIVAL_DISTANCE_METERS
    const arrivalLocationHits = isWithinArrivalRadius ? state.arrivalLocationHits + 1 : 0
    const shouldAnnounce = confirmedStep.didConfirm && state.lastAnnouncedStepIndex !== confirmedStep.stepIndex

    if (arrivalLocationHits >= REQUIRED_ARRIVAL_LOCATION_HITS) {
      const generation = nextRequestGeneration()
      stopLocationWatch?.()
      stopLocationWatch = null
      set({
        status: 'arrived',
        convertedGcj02Position: location,
        progress,
        deviation: createOnRouteDeviation(),
        arrivalLocationHits,
        candidateStepIndex: confirmedStep.candidateStepIndex,
        candidateStepHitCount: confirmedStep.candidateStepHitCount,
        lastConfirmedStepIndex: confirmedStep.stepIndex,
        lastAnnouncedStepIndex: shouldAnnounce ? confirmedStep.stepIndex : state.lastAnnouncedStepIndex,
        latestStepPrompt: shouldAnnounce
          ? formatPrototypeNavigationPrompt({ currentStep: route.steps[confirmedStep.stepIndex], nextStep: route.steps[confirmedStep.stepIndex + 1] })
          : state.latestStepPrompt,
        requestGeneration: generation,
        reroutePending: false
      })
      appendTrajectoryRecord(raw, location)
      return
    }

    set({
      status: state.status === 'rerouting' ? 'rerouting' : 'navigating',
      convertedGcj02Position: location,
      progress,
      deviation,
      arrivalLocationHits,
      candidateStepIndex: confirmedStep.candidateStepIndex,
      candidateStepHitCount: confirmedStep.candidateStepHitCount,
      lastConfirmedStepIndex: confirmedStep.stepIndex,
      lastAnnouncedStepIndex: shouldAnnounce ? confirmedStep.stepIndex : state.lastAnnouncedStepIndex,
      latestStepPrompt: shouldAnnounce
        ? formatPrototypeNavigationPrompt({ currentStep: route.steps[confirmedStep.stepIndex], nextStep: route.steps[confirmedStep.stepIndex + 1] })
        : state.latestStepPrompt
    })
    appendTrajectoryRecord(raw, location)
  }

  return {
    status: 'idle',
    arrivalLocationHits: 0,
    candidateStepHitCount: 0,
    deviation: createOnRouteDeviation(),
    conversionStatus: 'idle',
    conversionProvider: coordinateTransformProvider.id,
    conversionGeneration: coordinateConversionGeneration,
    requestGeneration,
    reroutePending: false,
    trajectoryRecording: false,
    trajectory: [],
    async start(origin, destination) {
      const generation = nextRequestGeneration()
      const conversionGeneration = nextCoordinateConversionGeneration()
      stopLocationWatch?.()
      stopLocationWatch = null
      set({
        status: 'locating',
        route: undefined,
        rawWgs84Position: undefined,
        convertedGcj02Position: undefined,
        lastConversionInputWgs84Position: undefined,
        conversionStatus: 'idle',
        conversionError: undefined,
        coordinateOffsetMeters: undefined,
        conversionGeneration,
        progress: undefined,
        arrivalLocationHits: 0,
        candidateStepIndex: undefined,
        candidateStepHitCount: 0,
        lastConfirmedStepIndex: undefined,
        lastAnnouncedStepIndex: undefined,
        latestStepPrompt: undefined,
        deviation: createOnRouteDeviation(),
        requestGeneration: generation,
        reroutePending: false,
        lastRerouteError: undefined,
        error: undefined
      })

      stopLocationWatch = watchPrototypeLocation({
        onLocation: (location) => get().acceptRawWgs84Location(location),
        onError: ({ message }) => {
          if (generation === requestGeneration) set({ status: 'error', error: message })
        }
      })

      try {
        const route = await requestPrototypeWalkingRoute(origin, destination)
        if (generation !== requestGeneration) return
        const location = get().convertedGcj02Position
        const initialStepIndex = 0
        set({
          status: location ? 'navigating' : 'locating',
          route,
          progress: location ? buildNavigationPrototypeProgress(route, location, initialStepIndex) : undefined,
          candidateStepIndex: initialStepIndex,
          candidateStepHitCount: 0,
          lastConfirmedStepIndex: initialStepIndex,
          lastAnnouncedStepIndex: initialStepIndex,
          latestStepPrompt: formatPrototypeNavigationPrompt({
            currentStep: route.steps[initialStepIndex],
            nextStep: route.steps[initialStepIndex + 1]
          })
        })
      } catch (error) {
        if (generation !== requestGeneration) return
        set({ status: 'error', error: error instanceof Error ? error.message : '腾讯步行路线请求失败。' })
      }
    },
    acceptRawWgs84Location(location) {
      const state = get()
      if (state.status === 'arrived') return
      if (!isAcceptedPrototypeLocation(location)) {
        const generation = nextCoordinateConversionGeneration()
        set({
          rawWgs84Position: location,
          conversionStatus: 'failed',
          conversionError: '定位精度超过 100m，已拒绝。',
          conversionGeneration: generation
        })
        return
      }

      const lastInput = state.lastConversionInputWgs84Position
      const shouldConvert = !lastInput
        || haversineDistanceMeters(lastInput, location) > COORDINATE_TRANSFORM_MIN_DISTANCE_METERS
        || location.timestamp - lastInput.timestamp >= COORDINATE_TRANSFORM_MAX_INTERVAL_MS
      if (!shouldConvert) {
        set({ rawWgs84Position: location })
        return
      }

      const generation = nextCoordinateConversionGeneration()
      set({
        rawWgs84Position: location,
        lastConversionInputWgs84Position: location,
        conversionStatus: 'converting',
        conversionError: undefined,
        conversionGeneration: generation
      })
      void coordinateTransformProvider.wgs84ToGcj02(location)
        .then((position) => {
          if (generation !== coordinateConversionGeneration) return
          const converted = toConvertedGcj02Location({ position, raw: location })
          const latestRaw = get().rawWgs84Position
          set({
            rawWgs84Position: latestRaw ?? location,
            convertedGcj02Position: converted,
            conversionStatus: 'ready',
            conversionError: undefined,
            coordinateOffsetMeters: calculateCoordinateOffsetMeters(location, converted)
          })
          acceptConvertedGcj02Location(converted, location)
        })
        .catch((error) => {
          if (generation !== coordinateConversionGeneration) return
          set({
            rawWgs84Position: location,
            conversionStatus: 'failed',
            conversionError: error instanceof Error ? error.message : '坐标转换失败。'
          })
        })
    },
    acceptSimulatedGcj02Location(location) {
      if (!import.meta.env.DEV) return
      set({ conversionStatus: 'ready', conversionError: undefined, convertedGcj02Position: location })
      acceptConvertedGcj02Location(location)
    },
    async reroute() {
      const state = get()
      if (state.status === 'arrived' || state.reroutePending || !state.route || !state.convertedGcj02Position) return
      const generation = nextRequestGeneration()
      const origin: NavigationPrototypeEndpoint = {
        poiId: 'prototype-current-location',
        name: '当前位置',
        ...toGcj02Position(state.convertedGcj02Position)
      }
      const destination = state.route.destination
      set({ status: 'rerouting', requestGeneration: generation, reroutePending: true, lastRerouteError: undefined })

      try {
        const route = await requestPrototypeWalkingRoute(origin, destination)
        if (generation !== requestGeneration) return
        const location = get().convertedGcj02Position
        const initialStepIndex = 0
        set({
          status: 'navigating',
          route,
          progress: location ? buildNavigationPrototypeProgress(route, location, initialStepIndex) : undefined,
          arrivalLocationHits: 0,
          candidateStepIndex: initialStepIndex,
          candidateStepHitCount: 0,
          lastConfirmedStepIndex: initialStepIndex,
          lastAnnouncedStepIndex: initialStepIndex,
          latestStepPrompt: formatPrototypeNavigationPrompt({ currentStep: route.steps[initialStepIndex], nextStep: route.steps[initialStepIndex + 1] }),
          deviation: createOnRouteDeviation(),
          reroutePending: false,
          lastRerouteError: undefined
        })
      } catch {
        if (generation !== requestGeneration) return
        set({ status: 'navigating', reroutePending: false, lastRerouteError: '重新规划失败，请继续沿当前路线或稍后重试' })
      }
    },
    continueCurrentRoute() {
      const deviation = get().deviation
      set({
        deviation: {
          ...createOnRouteDeviation(),
          distanceToRouteMeters: deviation.distanceToRouteMeters,
          nearestSegmentIndex: deviation.nearestSegmentIndex,
          suspectedThreshold: deviation.suspectedThreshold,
          confirmedThreshold: deviation.confirmedThreshold,
          dismissedAt: Date.now()
        }
      })
    },
    simulateDeviation() {
      const route = get().route
      if (!route?.polyline.length) return
      const base = route.polyline[Math.floor(route.polyline.length / 2)]
      const now = Date.now()
      for (let index = 0; index < REQUIRED_CONFIRMED_HITS; index += 1) {
        get().acceptSimulatedGcj02Location({ ...toGcj02Position({ lat: base.lat + 0.00085, lng: base.lng }), accuracy: 12, timestamp: now + index * 4_000 })
      }
    },
    simulateRouteRecovery() {
      const route = get().route
      if (!route?.polyline.length) return
      const point = route.polyline[Math.floor(route.polyline.length / 2)]
      const now = Date.now()
      for (let index = 0; index < REQUIRED_RECOVERY_HITS; index += 1) {
        get().acceptSimulatedGcj02Location({ ...toGcj02Position(point), accuracy: 12, timestamp: now + index * 1_000 })
      }
    },
    simulateArrival() {
      if (!get().route) return
      nextRequestGeneration()
      const conversionGeneration = nextCoordinateConversionGeneration()
      stopLocationWatch?.()
      stopLocationWatch = null
      set({ status: 'arrived', arrivalLocationHits: REQUIRED_ARRIVAL_LOCATION_HITS, deviation: createOnRouteDeviation(), requestGeneration, conversionGeneration, reroutePending: false })
    },
    startTrajectoryRecording() {
      if (!import.meta.env.DEV) return
      set({ trajectoryRecording: true, trajectory: [] })
    },
    stopTrajectoryRecording() {
      set({ trajectoryRecording: false })
    },
    clearTrajectory() {
      set({ trajectory: [] })
    },
    exportTrajectory() {
      const trajectory = get().trajectory
      if (!import.meta.env.DEV || !trajectory.length || typeof document === 'undefined') return
      const blob = new Blob([JSON.stringify(trajectory, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `lingshan-navigation-coordinate-trace-${Date.now()}.json`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    },
    reset() {
      const generation = nextRequestGeneration()
      const conversionGeneration = nextCoordinateConversionGeneration()
      stopLocationWatch?.()
      stopLocationWatch = null
      set({
        status: 'idle',
        route: undefined,
        rawWgs84Position: undefined,
        convertedGcj02Position: undefined,
        lastConversionInputWgs84Position: undefined,
        conversionStatus: 'idle',
        conversionError: undefined,
        coordinateOffsetMeters: undefined,
        conversionGeneration,
        progress: undefined,
        arrivalLocationHits: 0,
        candidateStepIndex: undefined,
        candidateStepHitCount: 0,
        lastConfirmedStepIndex: undefined,
        lastAnnouncedStepIndex: undefined,
        latestStepPrompt: undefined,
        deviation: createOnRouteDeviation(),
        requestGeneration: generation,
        reroutePending: false,
        lastRerouteError: undefined,
        error: undefined,
        trajectoryRecording: false,
        trajectory: []
      })
    }
  }
})

function nextRequestGeneration() {
  requestGeneration += 1
  return requestGeneration
}

function nextCoordinateConversionGeneration() {
  coordinateConversionGeneration += 1
  return coordinateConversionGeneration
}

function createOnRouteDeviation(): PrototypeDeviation {
  return { state: 'on_route', suspectedHitCount: 0, confirmedHitCount: 0, recoveryHitCount: 0 }
}

function evaluateDeviation(input: {
  prior: PrototypeDeviation
  location: ConvertedGcj02Location
  route: NavigationPrototypeRoute
  timestamp: number
}): PrototypeDeviation {
  const { prior, location, route, timestamp } = input
  const projection = projectPointToPolyline({ position: location, polyline: route.polyline })
  if (!projection) return prior
  const suspectedThreshold = Math.min(Math.max(35, location.accuracy * 1.5), MAX_SUSPECTED_THRESHOLD_METERS)
  const confirmedThreshold = Math.min(Math.max(60, location.accuracy * 2), MAX_CONFIRMED_THRESHOLD_METERS)
  const base = { ...prior, distanceToRouteMeters: Math.round(projection.distanceToRouteMeters), nearestSegmentIndex: projection.nearestSegmentIndex, suspectedThreshold, confirmedThreshold }
  if (location.accuracy > MAX_DEVIATION_ACCURACY_METERS) return base
  if (base.dismissedAt && timestamp - base.dismissedAt < DISMISS_COOLDOWN_MS) {
    return { ...base, state: 'on_route', suspectedHitCount: 0, confirmedHitCount: 0, recoveryHitCount: 0, suspectedSince: undefined, confirmedSince: undefined, confirmedAt: undefined }
  }
  if (projection.distanceToRouteMeters < ON_ROUTE_DISTANCE_METERS) {
    const recoveryHitCount = prior.state === 'on_route' ? 0 : prior.recoveryHitCount + 1
    if (prior.state !== 'on_route' && recoveryHitCount < REQUIRED_RECOVERY_HITS) {
      return { ...base, recoveryHitCount, suspectedHitCount: 0, confirmedHitCount: 0, suspectedSince: undefined, confirmedSince: undefined }
    }
    return createOnRouteDeviationWith(base)
  }
  const isSuspected = projection.distanceToRouteMeters > suspectedThreshold
  const isConfirmed = projection.distanceToRouteMeters > confirmedThreshold
  const suspectedHitCount = isSuspected ? prior.suspectedHitCount + 1 : 0
  const confirmedHitCount = isConfirmed ? prior.confirmedHitCount + 1 : 0
  const suspectedSince = isSuspected ? prior.suspectedSince ?? timestamp : undefined
  const confirmedSince = isConfirmed ? prior.confirmedSince ?? timestamp : undefined
  const suspectedDuration = suspectedSince === undefined ? 0 : timestamp - suspectedSince
  const confirmedDuration = confirmedSince === undefined ? 0 : timestamp - confirmedSince
  const becomesConfirmed = isConfirmed && confirmedHitCount >= REQUIRED_CONFIRMED_HITS && confirmedDuration >= CONFIRMED_DURATION_MS
  const becomesSuspected = isSuspected && (suspectedHitCount >= REQUIRED_SUSPECTED_HITS || suspectedDuration >= SUSPECTED_DURATION_MS)
  if (becomesConfirmed || prior.state === 'confirmed_off_route') {
    return { ...base, state: 'confirmed_off_route', suspectedHitCount, confirmedHitCount, recoveryHitCount: 0, suspectedSince, confirmedSince, confirmedAt: prior.confirmedAt ?? timestamp, dismissedAt: undefined }
  }
  if (becomesSuspected || prior.state === 'suspected_off_route') {
    return { ...base, state: 'suspected_off_route', suspectedHitCount, confirmedHitCount, recoveryHitCount: 0, suspectedSince, confirmedSince, confirmedAt: undefined, dismissedAt: undefined }
  }
  return { ...base, state: 'on_route', suspectedHitCount, confirmedHitCount, recoveryHitCount: 0, suspectedSince, confirmedSince, confirmedAt: undefined }
}

function createOnRouteDeviationWith(base: Omit<PrototypeDeviation, 'state' | 'suspectedHitCount' | 'confirmedHitCount' | 'recoveryHitCount'>): PrototypeDeviation {
  return { ...base, state: 'on_route', suspectedHitCount: 0, confirmedHitCount: 0, recoveryHitCount: 0, suspectedSince: undefined, confirmedSince: undefined, confirmedAt: undefined, dismissedAt: undefined }
}

function resolveConfirmedStep(input: {
  candidateStepIndex: number
  priorCandidateStepIndex?: number
  candidateStepHitCount: number
  lastConfirmedStepIndex: number
  totalSteps: number
  nearArrival: boolean
}) {
  const { candidateStepIndex, priorCandidateStepIndex, candidateStepHitCount, lastConfirmedStepIndex, totalSteps, nearArrival } = input
  if (candidateStepIndex <= lastConfirmedStepIndex) {
    return { stepIndex: lastConfirmedStepIndex, candidateStepIndex, candidateStepHitCount: candidateStepIndex === lastConfirmedStepIndex ? 0 : candidateStepHitCount, didConfirm: false }
  }
  const nextHitCount = candidateStepIndex === priorCandidateStepIndex ? candidateStepHitCount + 1 : 1
  const didConfirm = candidateStepIndex === totalSteps - 1 || nearArrival || nextHitCount >= REQUIRED_FORWARD_STEP_HITS
  return { stepIndex: didConfirm ? candidateStepIndex : lastConfirmedStepIndex, candidateStepIndex, candidateStepHitCount: didConfirm ? 0 : nextHitCount, didConfirm }
}

function isAcceptedPrototypeLocation(location: { lat: number; lng: number; accuracy: number }) {
  return Number.isFinite(location.lat) && Number.isFinite(location.lng) && Number.isFinite(location.accuracy) && location.accuracy <= MAX_ACCEPTED_ACCURACY_METERS
}
