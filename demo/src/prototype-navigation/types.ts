export type NavigationPrototypeStatus = 'idle' | 'locating' | 'navigating' | 'rerouting' | 'arrived' | 'error'

/** Browser Geolocation's original, unshifted GPS coordinate. */
export type Wgs84Position = {
  lat: number
  lng: number
  coordinateSystem: 'WGS84'
}

/** Tencent map, POI and walking-route coordinate in the GCJ-02 frame. */
export type Gcj02Position = {
  lat: number
  lng: number
  coordinateSystem: 'GCJ-02'
}

export type BrowserWgs84Location = Wgs84Position & {
  accuracy: number
  timestamp: number
}

export type ConvertedGcj02Location = Gcj02Position & {
  accuracy: number
  timestamp: number
}

export type CoordinateConversionStatus = 'idle' | 'converting' | 'ready' | 'failed'

export type NavigationPrototypeTraceRecord = {
  timestamp: number
  rawWgs84: BrowserWgs84Location
  convertedGcj02: ConvertedGcj02Location
  accuracy: number
  offsetMeters: number
  distanceToRouteMeters?: number
  deviationState: PrototypeDeviationState
  currentStepIndex?: number
}

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

export type NavigationPrototypeEndpoint = Gcj02Position & {
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
  polyline: Gcj02Position[]
  steps: NavigationPrototypeStep[]
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
