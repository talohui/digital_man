import type { LatLngPoint } from '../data/guideData'

export type NavigationPrototypeStatus = 'idle' | 'locating' | 'navigating' | 'rerouting' | 'arrived' | 'error'

export type PrototypeDeviationState = 'on_route' | 'suspected_off_route' | 'confirmed_off_route'

export type PrototypeDeviation = {
  state: PrototypeDeviationState
  distanceToRouteMeters?: number
  nearestSegmentIndex?: number
  suspectedThreshold?: number
  confirmedThreshold?: number
  suspectedHitCount: number
  confirmedHitCount: number
  recoveryHitCount: number
  suspectedSince?: number
  confirmedSince?: number
  confirmedAt?: number
  dismissedAt?: number
}

export type NavigationPrototypeEndpoint = LatLngPoint & {
  name: string
  poiId: string
}

export type NavigationPrototypeStep = {
  /** Tencent `instruction`; absent only when the route response omitted it. */
  instruction?: string
  distanceMeters: number
  roadName?: string
  directionDescription?: string
  actionDescription?: string
  polylineIndexes?: number[]
}

export type NavigationPrototypeRoute = {
  origin: NavigationPrototypeEndpoint
  destination: NavigationPrototypeEndpoint
  distanceMeters: number
  durationMinutes: number
  polyline: LatLngPoint[]
  steps: NavigationPrototypeStep[]
}

export type NavigationPrototypeLocation = LatLngPoint & {
  accuracy: number
  timestamp: number
}

export type NavigationPrototypeProgress = {
  distanceRemainingMeters: number
  distanceToDestinationMeters: number
  durationRemainingMinutes: number
  currentStepIndex: number
  currentInstruction: string
  nextInstruction?: string
  nearestPolylineIndex: number
}

export type NavigationPrototypeMapRuntime = {
  map: any
  TMap: any
  mapInstanceId: number
}
