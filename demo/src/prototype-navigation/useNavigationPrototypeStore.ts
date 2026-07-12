import { create } from 'zustand'

import { watchPrototypeLocation } from './browserGeolocation'
import { buildNavigationPrototypeProgress, resolveStepIndexFromPolylineIndex } from './navigationProgress'
import { formatPrototypeNavigationPrompt } from './prototypeNavigationPrompt'
import { projectPointToPolyline } from './routeDeviation'
import { requestPrototypeWalkingRoute } from './tencentWalkingRoute'
import type {
  NavigationPrototypeEndpoint,
  NavigationPrototypeLocation,
  NavigationPrototypeProgress,
  NavigationPrototypeRoute,
  NavigationPrototypeStatus,
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

let stopLocationWatch: (() => void) | null = null
let requestGeneration = 0

type NavigationPrototypeStore = {
  status: NavigationPrototypeStatus
  route?: NavigationPrototypeRoute
  location?: NavigationPrototypeLocation
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
  error?: string
  start: (origin: NavigationPrototypeEndpoint, destination: NavigationPrototypeEndpoint) => Promise<void>
  acceptLocation: (location: NavigationPrototypeLocation) => void
  reroute: () => Promise<void>
  continueCurrentRoute: () => void
  simulateDeviation: () => void
  simulateRouteRecovery: () => void
  simulateArrival: () => void
  reset: () => void
}

export const useNavigationPrototypeStore = create<NavigationPrototypeStore>((set, get) => ({
  status: 'idle',
  arrivalLocationHits: 0,
  candidateStepHitCount: 0,
  deviation: createOnRouteDeviation(),
  requestGeneration,
  reroutePending: false,
  async start(origin, destination) {
    const generation = nextRequestGeneration()
    stopLocationWatch?.()
    stopLocationWatch = null
    set({
      status: 'locating',
      route: undefined,
      location: undefined,
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
      onLocation: (location) => get().acceptLocation(location),
      onError: ({ message }) => {
        if (generation === requestGeneration) {
          set({ status: 'error', error: message })
        }
      }
    })

    try {
      const route = await requestPrototypeWalkingRoute(origin, destination)
      if (generation !== requestGeneration) return

      const location = get().location
      const initialStepIndex = 0
      const progress = location
        ? buildNavigationPrototypeProgress(route, location, initialStepIndex)
        : undefined
      set({
        status: location ? 'navigating' : 'locating',
        route,
        progress,
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
      set({
        status: 'error',
        error: error instanceof Error ? error.message : '腾讯步行路线请求失败。'
      })
    }
  },
  acceptLocation(location) {
    const state = get()
    if (state.status === 'arrived' || !isAcceptedPrototypeLocation(location)) return

    if (!state.route) {
      set({ location, arrivalLocationHits: 0 })
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
    const deviation = evaluateDeviation({
      prior: state.deviation,
      location,
      route,
      timestamp: location.timestamp
    })
    const isWithinArrivalRadius = progress.distanceToDestinationMeters < ARRIVAL_DISTANCE_METERS
    const arrivalLocationHits = isWithinArrivalRadius ? state.arrivalLocationHits + 1 : 0
    const shouldAnnounce = confirmedStep.didConfirm && state.lastAnnouncedStepIndex !== confirmedStep.stepIndex

    if (arrivalLocationHits >= REQUIRED_ARRIVAL_LOCATION_HITS) {
      const generation = nextRequestGeneration()
      stopLocationWatch?.()
      stopLocationWatch = null
      set({
        status: 'arrived',
        location,
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
      return
    }

    set({
      status: state.status === 'rerouting' ? 'rerouting' : 'navigating',
      location,
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
  },
  async reroute() {
    const state = get()
    if (state.status === 'arrived' || state.reroutePending || !state.route || !state.location) return

    const generation = nextRequestGeneration()
    const origin: NavigationPrototypeEndpoint = {
      poiId: 'prototype-current-location',
      name: '当前位置',
      lat: state.location.lat,
      lng: state.location.lng
    }
    const destination = state.route.destination
    set({
      status: 'rerouting',
      requestGeneration: generation,
      reroutePending: true,
      lastRerouteError: undefined
    })

    try {
      const route = await requestPrototypeWalkingRoute(origin, destination)
      if (generation !== requestGeneration) return

      const location = get().location
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
        latestStepPrompt: formatPrototypeNavigationPrompt({
          currentStep: route.steps[initialStepIndex],
          nextStep: route.steps[initialStepIndex + 1]
        }),
        deviation: createOnRouteDeviation(),
        reroutePending: false,
        lastRerouteError: undefined
      })
    } catch (error) {
      if (generation !== requestGeneration) return
      set({
        status: 'navigating',
        reroutePending: false,
        lastRerouteError: '重新规划失败，请继续沿当前路线或稍后重试'
      })
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
      get().acceptLocation({
        lat: base.lat + 0.00085,
        lng: base.lng,
        accuracy: 12,
        timestamp: now + index * 4_000
      })
    }
  },
  simulateRouteRecovery() {
    const route = get().route
    if (!route?.polyline.length) return
    const point = route.polyline[Math.floor(route.polyline.length / 2)]
    const now = Date.now()
    for (let index = 0; index < REQUIRED_RECOVERY_HITS; index += 1) {
      get().acceptLocation({ ...point, accuracy: 12, timestamp: now + index * 1_000 })
    }
  },
  simulateArrival() {
    if (!get().route) return
    nextRequestGeneration()
    stopLocationWatch?.()
    stopLocationWatch = null
    set({
      status: 'arrived',
      arrivalLocationHits: REQUIRED_ARRIVAL_LOCATION_HITS,
      deviation: createOnRouteDeviation(),
      requestGeneration,
      reroutePending: false
    })
  },
  reset() {
    const generation = nextRequestGeneration()
    stopLocationWatch?.()
    stopLocationWatch = null
    set({
      status: 'idle',
      route: undefined,
      location: undefined,
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
  }
}))

function nextRequestGeneration() {
  requestGeneration += 1
  return requestGeneration
}

function createOnRouteDeviation(): PrototypeDeviation {
  return {
    state: 'on_route',
    suspectedHitCount: 0,
    confirmedHitCount: 0,
    recoveryHitCount: 0
  }
}

function evaluateDeviation(input: {
  prior: PrototypeDeviation
  location: NavigationPrototypeLocation
  route: NavigationPrototypeRoute
  timestamp: number
}): PrototypeDeviation {
  const { prior, location, route, timestamp } = input
  const projection = projectPointToPolyline({ position: location, polyline: route.polyline })
  if (!projection) return prior

  const suspectedThreshold = Math.min(
    Math.max(35, location.accuracy * 1.5),
    MAX_SUSPECTED_THRESHOLD_METERS
  )
  const confirmedThreshold = Math.min(
    Math.max(60, location.accuracy * 2),
    MAX_CONFIRMED_THRESHOLD_METERS
  )
  const base = {
    ...prior,
    distanceToRouteMeters: Math.round(projection.distanceToRouteMeters),
    nearestSegmentIndex: projection.nearestSegmentIndex,
    suspectedThreshold,
    confirmedThreshold
  }

  // A 51–100m fix is still useful for the user marker and route progress, but
  // never changes the off-route state machine in this prototype.
  if (location.accuracy > MAX_DEVIATION_ACCURACY_METERS) return base

  const inDismissCooldown = Boolean(base.dismissedAt && timestamp - base.dismissedAt < DISMISS_COOLDOWN_MS)
  if (inDismissCooldown) {
    return {
      ...base,
      state: 'on_route',
      suspectedHitCount: 0,
      confirmedHitCount: 0,
      recoveryHitCount: 0,
      suspectedSince: undefined,
      confirmedSince: undefined,
      confirmedAt: undefined
    }
  }

  if (projection.distanceToRouteMeters < ON_ROUTE_DISTANCE_METERS) {
    const recoveryHitCount = prior.state === 'on_route' ? 0 : prior.recoveryHitCount + 1
    if (prior.state !== 'on_route' && recoveryHitCount < REQUIRED_RECOVERY_HITS) {
      return {
        ...base,
        recoveryHitCount,
        suspectedHitCount: 0,
        confirmedHitCount: 0,
        suspectedSince: undefined,
        confirmedSince: undefined
      }
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
  const becomesConfirmed = isConfirmed
    && confirmedHitCount >= REQUIRED_CONFIRMED_HITS
    && confirmedDuration >= CONFIRMED_DURATION_MS
  const becomesSuspected = isSuspected
    && (suspectedHitCount >= REQUIRED_SUSPECTED_HITS || suspectedDuration >= SUSPECTED_DURATION_MS)

  if (becomesConfirmed || prior.state === 'confirmed_off_route') {
    return {
      ...base,
      state: 'confirmed_off_route',
      suspectedHitCount,
      confirmedHitCount,
      recoveryHitCount: 0,
      suspectedSince,
      confirmedSince,
      confirmedAt: prior.confirmedAt ?? timestamp,
      dismissedAt: undefined
    }
  }

  if (becomesSuspected || prior.state === 'suspected_off_route') {
    return {
      ...base,
      state: 'suspected_off_route',
      suspectedHitCount,
      confirmedHitCount,
      recoveryHitCount: 0,
      suspectedSince,
      confirmedSince,
      confirmedAt: undefined,
      dismissedAt: undefined
    }
  }

  return {
    ...base,
    state: 'on_route',
    suspectedHitCount,
    confirmedHitCount,
    recoveryHitCount: 0,
    suspectedSince,
    confirmedSince,
    confirmedAt: undefined
  }
}

function createOnRouteDeviationWith(base: Omit<PrototypeDeviation, 'state' | 'suspectedHitCount' | 'confirmedHitCount' | 'recoveryHitCount'>): PrototypeDeviation {
  return {
    ...base,
    state: 'on_route',
    suspectedHitCount: 0,
    confirmedHitCount: 0,
    recoveryHitCount: 0,
    suspectedSince: undefined,
    confirmedSince: undefined,
    confirmedAt: undefined,
    dismissedAt: undefined
  }
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
    return {
      stepIndex: lastConfirmedStepIndex,
      candidateStepIndex,
      candidateStepHitCount: candidateStepIndex === lastConfirmedStepIndex ? 0 : candidateStepHitCount,
      didConfirm: false
    }
  }

  const nextHitCount = candidateStepIndex === priorCandidateStepIndex ? candidateStepHitCount + 1 : 1
  const canConfirmImmediately = candidateStepIndex === totalSteps - 1 || nearArrival
  const didConfirm = canConfirmImmediately || nextHitCount >= REQUIRED_FORWARD_STEP_HITS

  return {
    stepIndex: didConfirm ? candidateStepIndex : lastConfirmedStepIndex,
    candidateStepIndex,
    candidateStepHitCount: didConfirm ? 0 : nextHitCount,
    didConfirm
  }
}

function isAcceptedPrototypeLocation(location: NavigationPrototypeLocation) {
  return Number.isFinite(location.lat)
    && Number.isFinite(location.lng)
    && Number.isFinite(location.accuracy)
    && location.accuracy <= MAX_ACCEPTED_ACCURACY_METERS
}
