export type NavigationPrototypeStatus = 'idle' | 'locating' | 'planning' | 'navigating' | 'paused' | 'rerouting' | 'arrived' | 'cancelled' | 'error'

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

export type PrototypeNavigationTarget = {
  mode: 'route-segment' | 'joining' | 'free-poi' | 'local-test'
  routeId?: string
  fromStopIndex?: number
  targetStopIndex?: number
  poiId: string
  name: string
  coordinate: Gcj02Position
}

export type PrototypeNavigationSession = {
  id: string
  target: PrototypeNavigationTarget
  originStage?: 'joining' | 'active'
  committed: boolean
  targetChangedAt: number
}

export type PrototypeRouteProgressMetadata = {
  routeId?: string
  reachedStopIndices: number[]
  skippedBeforeJoin: number[]
}

export type BrowserWgs84Location = Wgs84Position & {
  accuracy: number
  timestamp: number
  /** Browser Geolocation speed in m/s; may be null on some devices. */
  speedMps?: number
  /** Browser Geolocation course, normalized to north=0 / east=90. */
  headingDegrees?: number
}

export type NavigationPrototypeLocationSource = 'geolocation' | 'replay-gcj02' | 'manual-gcj02'

export type ConvertedGcj02Location = Gcj02Position & {
  accuracy: number
  timestamp: number
  source: NavigationPrototypeLocationSource
  speedMps?: number
  headingDegrees?: number
}

export type NavigationHeadingSource = 'geolocation' | 'device-orientation' | 'route-bearing' | 'unavailable'

export type NavigationHeadingSnapshot = {
  geolocationHeading?: number
  deviceHeading?: number
  routeBearing?: number
  selectedHeading?: number
  source: NavigationHeadingSource
  speedMps?: number
  updatedAt?: number
}

export type LocalNavigationTestTarget = {
  coordinate: Gcj02Position
  name: string
}

export type LocalNavigationTestState = {
  phase: 'permission-intro' | 'locating' | 'awaiting-target' | 'planning' | 'navigating' | 'arrived' | 'error'
  origin?: ConvertedGcj02Location
  target?: LocalNavigationTestTarget
}

export type CoordinateConversionStatus = 'idle' | 'converting' | 'ready' | 'failed'

export type NavigationPrototypeTraceRecord = {
  timestamp: number
  rawWgs84?: BrowserWgs84Location
  convertedGcj02: ConvertedGcj02Location
  accuracy: number
  offsetMeters?: number
  distanceToRouteMeters?: number
  deviationState: PrototypeDeviationState
  currentStepIndex?: number
  locationSource: NavigationPrototypeLocationSource
  replayScenario?: ReplayScenario
  replayProgress?: number
  seed?: number
  speedMps?: number
  geolocationHeading?: number
  deviceHeading?: number
  routeBearing?: number
  selectedHeading?: number
  headingSource?: NavigationHeadingSource
  nearestSegmentIndex?: number
  segmentProgress?: number
  alongRouteMeters?: number
  remainingRouteMeters?: number
  candidateStepIndex?: number
  currentStepEndAlongMeters?: number
  distanceToCurrentStepEndMeters?: number
  currentInstruction?: string
  nextInstruction?: string
}

export type ReplaySpeed = 1 | 4 | 10
export type ReplayNoiseMode = 'clean' | 'normal' | 'poor' | 'rejected'
export type ReplayScenario =
  | 'route'
  | 'brief_drift'
  | 'sustained_off_route'
  | 'recovery'
  | 'low_accuracy_off_route'
  | 'low_accuracy_arrival'
  | 'arrival_jitter'

export type ReplayFix = ConvertedGcj02Location & {
  replayProgress: number
  replayScenario: ReplayScenario
  seed: number
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
  /** Legacy alias kept temporarily for existing consumers; this is route remaining, never a straight line. */
  distanceRemainingMeters: number
  /** Direct distance to the destination, used only by the arrival detector/debug. */
  distanceToDestinationMeters: number
  durationRemainingMinutes: number
  currentStepIndex: number
  currentInstruction: string
  nextInstruction?: string
  nearestPolylineIndex: number
  nearestSegmentIndex: number
  projectedPosition: Gcj02Position
  segmentProgress: number
  alongRouteMeters: number
  totalRouteMeters: number
  remainingRouteMeters: number
  currentStepEndAlongMeters: number
  distanceToCurrentStepEndMeters: number
  routeBearingDegrees?: number
}

export type NavigationPrototypeMapRuntime = {
  map: any
  TMap: any
  mapInstanceId: number
}
