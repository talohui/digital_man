import { resolveNavigationBetaError, type NavigationBetaErrorKind } from './navigationBetaErrors'
import { formatNavigationActionText } from './prototypeNavigationPrompt'
import type { NavigationHeadingSnapshot, NavigationPrototypeLocationSource, NavigationPrototypeStatus, PrototypeDeviationState, PrototypeNavigationSession, PrototypeNavigationTarget } from './types'

export type NavigationBetaUiState =
  | 'inactive' | 'permission-intro' | 'locating' | 'planning' | 'navigating'
  | 'suspected-off-route' | 'confirmed-off-route' | 'rerouting' | 'paused'
  | 'resume-prompt' | 'arrival-confirm' | 'recoverable-error'

export type NavigationBetaSnapshot = {
  status: NavigationPrototypeStatus
  preparedTarget?: PrototypeNavigationTarget
  session?: PrototypeNavigationSession
  route?: { distanceMeters: number; durationMinutes: number; steps: unknown[] }
  progress?: {
    distanceRemainingMeters: number; durationRemainingMinutes: number; currentStepIndex: number; currentInstruction: string; nextInstruction?: string
    distanceToCurrentStepEndMeters: number; remainingRouteMeters: number
  }
  deviation: { state: PrototypeDeviationState }
  accuracy?: number
  locationSource?: NavigationPrototypeLocationSource
  heading?: NavigationHeadingSnapshot
  error?: string
  errorKind?: NavigationBetaErrorKind
  lastRerouteError?: string
  restoredFromSessionStorage: boolean
  backgroundPaused: boolean
  debugEnabled: boolean
}

export type NavigationBetaViewModel = {
  visible: boolean
  shouldReplaceRouteSheet: boolean
  state: NavigationBetaUiState
  target?: { name: string; poiId: string; mode: PrototypeNavigationTarget['mode'] }
  progress?: {
    /** Legacy aliases retained for the existing card during the visual pass. */
    distanceText: string; durationText: string
    currentActionText: string
    distanceToCurrentStepEndText: string
    nextActionText?: string
    remainingRouteDistanceText: string
    remainingDurationText: string
    stepText: string
    currentInstruction: string
    nextInstruction?: string
    locationQuality: 'good' | 'usable' | 'poor' | 'unavailable'
    locationQualityText: string
  }
  heading: { degrees?: number; source: NavigationHeadingSnapshot['source']; available: boolean }
  location: { source?: NavigationPrototypeLocationSource; isReplay: boolean; statusText: string }
  deviation?: { state: 'on-route' | 'suspected' | 'confirmed' | 'rerouting'; message?: string }
  error?: ReturnType<typeof resolveNavigationBetaError>
  restoredSession?: { targetName: string }
  arrival?: { kind: 'route-arrival' | 'joining-arrival'; targetName: string }
  debugEnabled: boolean
  actions: NavigationBetaActions
}

export type NavigationBetaActions = {
  enterPermissionIntro(): void
  requestPermissionAndStart(): void
  dismissPermissionIntro(): void
  retryLocation(): void
  retryPlanning(): void
  pause(): void
  resume(): void
  cancel(): void
  reroute(): void
  continueCurrentRoute(): void
  confirmArrival(): void
  continueAfterArrivalDetection(): void
  continueRestoredSession(): void
  discardRestoredSession(): void
}

export function resolveNavigationBetaUiState(snapshot: NavigationBetaSnapshot): NavigationBetaUiState {
  if (snapshot.preparedTarget) return 'permission-intro'
  if (snapshot.status === 'arrived') return 'arrival-confirm'
  if (snapshot.status === 'paused') return snapshot.restoredFromSessionStorage || snapshot.backgroundPaused ? 'resume-prompt' : 'paused'
  if (snapshot.status === 'rerouting') return 'rerouting'
  if (snapshot.status === 'locating') return 'locating'
  if (snapshot.status === 'planning') return 'planning'
  if (snapshot.status === 'error') return 'recoverable-error'
  if (snapshot.status === 'navigating') {
    if (snapshot.deviation.state === 'confirmed_off_route') return 'confirmed-off-route'
    if (snapshot.deviation.state === 'suspected_off_route') return 'suspected-off-route'
    return 'navigating'
  }
  return 'inactive'
}

export function createNavigationBetaViewModel(snapshot: NavigationBetaSnapshot, actions: NavigationBetaActions): NavigationBetaViewModel {
  const state = resolveNavigationBetaUiState(snapshot)
  const target = snapshot.session?.target ?? snapshot.preparedTarget
  const quality = snapshot.accuracy === undefined ? 'unavailable' : snapshot.accuracy <= 20 ? 'good' : snapshot.accuracy <= 50 ? 'usable' : 'poor'
  const isReplay = snapshot.locationSource === 'replay-gcj02'
  const qualityText = isReplay ? '模拟导航回放中' : quality === 'good' ? '定位良好' : quality === 'usable' ? '定位可用' : quality === 'poor' ? '定位精度较低，正在继续校准' : '暂时无法获取可靠位置'
  const errorKind = snapshot.lastRerouteError ? 'reroute-failed' : snapshot.errorKind
  return {
    visible: state !== 'inactive',
    shouldReplaceRouteSheet: state !== 'inactive',
    state,
    target: target ? { name: target.name, poiId: target.poiId, mode: target.mode } : undefined,
    progress: snapshot.progress ? {
      distanceText: `${Math.round(snapshot.progress.remainingRouteMeters)} m`,
      durationText: `${snapshot.progress.durationRemainingMinutes}分钟`,
      currentActionText: formatNavigationActionText(snapshot.progress.currentInstruction),
      distanceToCurrentStepEndText: formatDynamicStepDistance(snapshot.progress.distanceToCurrentStepEndMeters, snapshot.progress.currentStepIndex === Math.max(0, (snapshot.route?.steps.length ?? 1) - 1)),
      nextActionText: snapshot.progress.nextInstruction ? `前方${formatNavigationActionText(snapshot.progress.nextInstruction).replace(/^前方/, '')}` : undefined,
      remainingRouteDistanceText: `约 ${Math.round(snapshot.progress.remainingRouteMeters)} 米`,
      remainingDurationText: formatDuration(snapshot.progress.durationRemainingMinutes),
      stepText: `第 ${snapshot.progress.currentStepIndex + 1} 步 / ${snapshot.route?.steps.length ?? 0}`,
      currentInstruction: snapshot.progress.currentInstruction,
      nextInstruction: snapshot.progress.nextInstruction,
      locationQuality: quality,
      locationQualityText: qualityText
    } : undefined,
    heading: { degrees: snapshot.heading?.selectedHeading, source: snapshot.heading?.source ?? 'unavailable', available: snapshot.heading?.selectedHeading !== undefined },
    location: { source: snapshot.locationSource, isReplay, statusText: isReplay ? '模拟导航回放中' : qualityText },
    deviation: snapshot.deviation.state === 'on_route' ? undefined : {
      state: snapshot.deviation.state === 'suspected_off_route' ? 'suspected' : 'confirmed',
      message: snapshot.deviation.state === 'suspected_off_route' ? '当前位置可能偏离路线，正在继续确认。' : '你似乎已偏离当前步行路线。'
    },
    error: errorKind ? resolveNavigationBetaError(errorKind, snapshot.debugEnabled ? snapshot.error : undefined) : undefined,
    restoredSession: snapshot.restoredFromSessionStorage && target ? { targetName: target.name } : undefined,
    arrival: state === 'arrival-confirm' && target ? { kind: target.mode === 'joining' ? 'joining-arrival' : 'route-arrival', targetName: target.name } : undefined,
    debugEnabled: snapshot.debugEnabled,
    actions
  }
}

function formatDynamicStepDistance(distanceMeters: number, isLastStep: boolean) {
  const rounded = Math.max(0, Math.round(distanceMeters))
  if (isLastStep && rounded <= 5) return '即将到达目的地'
  if (rounded <= 5) return '即将进入下一步'
  if (rounded <= 20) return `前方约 ${rounded} 米`
  return `距下一动作约 ${rounded} 米`
}

function formatDuration(minutes: number) {
  return minutes <= 0 ? '即将到达' : `约 ${minutes} 分钟`
}
