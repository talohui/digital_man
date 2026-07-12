import { create } from 'zustand'

import { watchPrototypeLocation } from './browserGeolocation'
import { buildNavigationPrototypeProgress } from './navigationProgress'
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

let stopLocationWatch: (() => void) | null = null
let startGeneration = 0

type NavigationPrototypeStore = {
  status: NavigationPrototypeStatus
  route?: NavigationPrototypeRoute
  location?: NavigationPrototypeLocation
  progress?: NavigationPrototypeProgress
  arrivalLocationHits: number
  error?: string
  start: (origin: NavigationPrototypeEndpoint, destination: NavigationPrototypeEndpoint) => Promise<void>
  acceptLocation: (location: NavigationPrototypeLocation) => void
  simulateArrival: () => void
  reset: () => void
}

export const useNavigationPrototypeStore = create<NavigationPrototypeStore>((set, get) => ({
  status: 'idle',
  arrivalLocationHits: 0,
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
      set({
        status: location && isAcceptedPrototypeLocation(location) ? 'navigating' : 'locating',
        route,
        progress: location && isAcceptedPrototypeLocation(location)
          ? buildNavigationPrototypeProgress(route, location)
          : undefined
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

    const progress = buildNavigationPrototypeProgress(state.route, location)
    const isWithinArrivalRadius = progress.distanceRemainingMeters < ARRIVAL_DISTANCE_METERS
    const arrivalLocationHits = isWithinArrivalRadius ? state.arrivalLocationHits + 1 : 0

    if (arrivalLocationHits >= REQUIRED_ARRIVAL_LOCATION_HITS) {
      stopLocationWatch?.()
      stopLocationWatch = null
      set({ status: 'arrived', location, progress, arrivalLocationHits })
      return
    }

    set({ status: 'navigating', location, progress, arrivalLocationHits })
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
      error: undefined
    })
  }
}))

function isAcceptedPrototypeLocation(location: NavigationPrototypeLocation) {
  return Number.isFinite(location.lat)
    && Number.isFinite(location.lng)
    && Number.isFinite(location.accuracy)
    && location.accuracy <= MAX_ACCEPTED_ACCURACY_METERS
}
