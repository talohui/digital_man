import { create } from 'zustand'

import { watchPrototypeLocation } from './browserGeolocation'
import { buildNavigationPrototypeProgress, resolveStepIndexFromPolylineIndex } from './navigationProgress'
import { formatPrototypeNavigationPrompt } from './prototypeNavigationPrompt'
import { requestPrototypeWalkingRoute } from './tencentWalkingRoute'
import type {
  NavigationPrototypeEndpoint,
  NavigationPrototypeLocation,
  NavigationPrototypeProgress,
  NavigationPrototypeRoute,
  NavigationPrototypeStatus
} from './types'

const ARRIVAL_DISTANCE_METERS = 35
const REQUIRED_ARRIVAL_LOCATION_HITS = 3
const MAX_ACCEPTED_ACCURACY_METERS = 100
const REQUIRED_FORWARD_STEP_HITS = 2

let stopLocationWatch: (() => void) | null = null
let startGeneration = 0

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
  error?: string
  start: (origin: NavigationPrototypeEndpoint, destination: NavigationPrototypeEndpoint) => Promise<void>
  acceptLocation: (location: NavigationPrototypeLocation) => void
  simulateArrival: () => void
  reset: () => void
}

export const useNavigationPrototypeStore = create<NavigationPrototypeStore>((set, get) => ({
  status: 'idle',
  arrivalLocationHits: 0,
  candidateStepHitCount: 0,
  async start(origin, destination) {
    startGeneration += 1
    const generation = startGeneration
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
      error: undefined
    })

    stopLocationWatch = watchPrototypeLocation({
      onLocation: (location) => get().acceptLocation(location),
      onError: ({ message }) => {
        if (generation === startGeneration) {
          set({ status: 'error', error: message })
        }
      }
    })

    try {
      const route = await requestPrototypeWalkingRoute(origin, destination)
      if (generation !== startGeneration) return

      const location = get().location
      const initialStepIndex = 0
      const progress = location && isAcceptedPrototypeLocation(location)
        ? buildNavigationPrototypeProgress(route, location, initialStepIndex)
        : undefined
      set({
        status: location && isAcceptedPrototypeLocation(location) ? 'navigating' : 'locating',
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
      if (generation !== startGeneration) return
      set({
        status: 'error',
        error: error instanceof Error ? error.message : '腾讯步行路线请求失败。'
      })
    }
  },
  acceptLocation(location) {
    const state = get()
    if (state.status === 'arrived') return

    if (!isAcceptedPrototypeLocation(location)) {
      set({ location, arrivalLocationHits: 0 })
      return
    }

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
    const isWithinArrivalRadius = progress.distanceToDestinationMeters < ARRIVAL_DISTANCE_METERS
    const arrivalLocationHits = isWithinArrivalRadius ? state.arrivalLocationHits + 1 : 0
    const shouldAnnounce = confirmedStep.didConfirm && state.lastAnnouncedStepIndex !== confirmedStep.stepIndex

    if (arrivalLocationHits >= REQUIRED_ARRIVAL_LOCATION_HITS) {
      stopLocationWatch?.()
      stopLocationWatch = null
      set({
        status: 'arrived',
        location,
        progress,
        arrivalLocationHits,
        candidateStepIndex: confirmedStep.candidateStepIndex,
        candidateStepHitCount: confirmedStep.candidateStepHitCount,
        lastConfirmedStepIndex: confirmedStep.stepIndex,
        lastAnnouncedStepIndex: shouldAnnounce ? confirmedStep.stepIndex : state.lastAnnouncedStepIndex,
        latestStepPrompt: shouldAnnounce
          ? formatPrototypeNavigationPrompt({ currentStep: route.steps[confirmedStep.stepIndex], nextStep: route.steps[confirmedStep.stepIndex + 1] })
          : state.latestStepPrompt
      })
      return
    }

    set({
      status: 'navigating',
      location,
      progress,
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
  simulateArrival() {
    if (!get().route) return
    stopLocationWatch?.()
    stopLocationWatch = null
    set({ status: 'arrived', arrivalLocationHits: REQUIRED_ARRIVAL_LOCATION_HITS })
  },
  reset() {
    startGeneration += 1
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
      error: undefined
    })
  }
}))

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
    // GPS may drift back across a boundary. Prototype v3 intentionally does
    // not regress confirmed steps; formal navigation can add a reverse rule.
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
