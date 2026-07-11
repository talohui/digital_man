import { create } from 'zustand'

import { requestPrototypeWalkingRoute } from './tencentWalkingRoute'
import type {
  NavigationPrototypeEndpoint,
  NavigationPrototypeRoute,
  NavigationPrototypeStatus
} from './types'

type NavigationPrototypeStore = {
  status: NavigationPrototypeStatus
  route?: NavigationPrototypeRoute
  error?: string
  start: (origin: NavigationPrototypeEndpoint, destination: NavigationPrototypeEndpoint) => Promise<void>
  simulateArrival: () => void
  reset: () => void
}

export const useNavigationPrototypeStore = create<NavigationPrototypeStore>((set) => ({
  status: 'idle',
  async start(origin, destination) {
    set({ status: 'planning', route: undefined, error: undefined })

    try {
      const route = await requestPrototypeWalkingRoute(origin, destination)
      set({ status: 'navigating', route })
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : '腾讯步行路线请求失败。'
      })
    }
  },
  simulateArrival() {
    set((state) => (state.route ? { status: 'arrived' } : state))
  },
  reset() {
    set({ status: 'idle', route: undefined, error: undefined })
  }
}))
