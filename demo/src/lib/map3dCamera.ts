import type { LatLngPoint } from '../data/guideData'

export type Map3DCameraPresetId =
  | 'overviewEstate'
  | 'axisCruise'
  | 'landmarkFocus'
  | 'closeInspect'
  | 'routeOverview'
  | 'guideFollow'

export type Map3DCameraPreset = {
  id: Map3DCameraPresetId
  label: string
  description: string
  zoom: number
  pitch: number
  rotation: number
  durationMs: number
}

export type Map3DCameraEvent = {
  cameraPreset: Map3DCameraPresetId
  targetPoiId?: string
  targetLandmarkId?: string
  durationMs: number
  startedAt: string
  finishedAt: string
}

export type Map3DTourMode = 'buddhaRealmTour' | 'routePreview'

export type Map3DTourStopReason = 'manual' | 'userStop' | 'completed' | 'interrupted' | 'replaced' | 'unmount'

export type Map3DTourSpeedMode = 'cruise' | 'slow' | 'pause'

export type Map3DTourStep = {
  id: string
  label: string
  target: LatLngPoint
  progress?: number
  bearing?: number
  nearbyLandmarkId?: string
  speedMode?: Map3DTourSpeedMode
  activeLandmarkId?: string
  targetPoiId?: string
  targetLandmarkId?: string
  presetId?: Map3DCameraPresetId
  zoom?: number
  pitch?: number
  rotation?: number
  durationMs?: number
  holdMs?: number
  routeProgressIndex?: number
  twoStage?: boolean
}

export type Map3DRouteTourFrame = {
  t: number
  lng: number
  lat: number
  bearing: number
  zoom: number
  pitch: number
  rotation: number
  progress: number
  routeProgressIndex?: number
  nearbyLandmarkId?: string
  smoothingEnabled?: boolean
  lookAheadProgress?: number
  lateralOffsetMeters?: number
}

export type Map3DRouteTourPause = {
  id: string
  label: string
  progress: number
  holdMs: number
  nearbyLandmarkId: string
}

export type Map3DTourPlaybackRef = {
  current: Map3DTourPlayback | null
}

export type Map3DTourPlayback = {
  mode: Map3DTourMode
  sequenceRef: { current: number }
  timerIds: number[]
  frameId?: number
  completedStepCount?: number
  cleanup?: () => void
  onStopped?: (event: Map3DTourStoppedEvent) => void
}

export type Map3DTourStepEvent = {
  mode: Map3DTourMode
  step: Map3DTourStep
  stepIndex: number
  stepCount: number
  preset: Map3DCameraPreset
}

export type Map3DTourStoppedEvent = {
  mode: Map3DTourMode
  reason: Map3DTourStopReason
  completedStepCount: number
}

type StartMap3DTourOptions = {
  mode: Map3DTourMode
  map: any
  TMap: any
  steps: Map3DTourStep[]
  sequenceRef: { current: number }
  playbackRef: Map3DTourPlaybackRef
  defaultPresetId?: Map3DCameraPresetId
  onStarted?: (event: { mode: Map3DTourMode; stepCount: number }) => void
  onStep?: (event: Map3DTourStepEvent) => void
  onCameraComplete?: (event: Map3DCameraEvent) => void
  onStopped?: (event: Map3DTourStoppedEvent) => void
}

type StartSpecificMap3DTourOptions = Omit<StartMap3DTourOptions, 'mode'>

type StartBuddhaRealmTimelineTourOptions = {
  map: any
  TMap: any
  sequenceRef: { current: number }
  playbackRef: Map3DTourPlaybackRef
  durationMs: number
  pauses: Map3DRouteTourPause[]
  getFrame: (
    progress: number,
    context: {
      elapsedMs: number
      isPaused: boolean
      pauseElapsedMs: number
      activeLandmarkId?: string
    }
  ) => Map3DRouteTourFrame
  getSpeedMultiplier?: (progress: number) => number
  minFrameMs?: number
  onStarted?: (event: { mode: 'buddhaRealmTour'; durationMs: number; pauseCount: number }) => void
  onFrame?: (event: { frame: Map3DRouteTourFrame; elapsedMs: number }) => void
  onLandmarkPause?: (event: { pause: Map3DRouteTourPause; frame: Map3DRouteTourFrame; elapsedMs: number }) => void
  onStopped?: (event: Map3DTourStoppedEvent) => void
}

export const BUDDHA_REALM_TOUR_CONFIG = {
  durationPerMeterMs: 17,
  minDurationMs: 28000,
  maxDurationMs: 56000,
  lookAheadProgress: {
    cruise: 0.026,
    slow: 0.012
  },
  centerSmoothing: 0.064,
  rotationSmoothing: 0.036,
  zoomSmoothing: 0.032,
  pitchSmoothing: 0.034,
  lateralOffsetMeters: {
    cruise: 22,
    slow: 11,
    pause: 6
  },
  landmarkSlowRadiusProgress: 0.055,
  landmarkInfluenceProgress: 0.036,
  landmarkPauseMs: {
    entry: 1350,
    foshou: 1420,
    fanGong: 1600,
    wuyin: 1520,
    buddha: 1700
  },
  pauseDriftRotationDeg: 2.2,
  pauseDriftZoom: 0.16,
  pauseDriftCenterMeters: 5,
  bearingWindowProgress: 0.01,
  minFrameMs: 32,
  uiFrameThrottleMs: 180
} as const

export const MAP_3D_GUIDE_CAMERA_PRESETS: Record<Map3DCameraPresetId, Map3DCameraPreset> = {
  overviewEstate: {
    id: 'overviewEstate',
    label: '总览',
    description: '酒庄航拍式斜俯总览',
    zoom: 16.85,
    pitch: 58,
    rotation: -34,
    durationMs: 1600
  },
  axisCruise: {
    id: 'axisCruise',
    label: '主轴漫游',
    description: '沿中轴线慢推游览',
    zoom: 17.85,
    pitch: 66,
    rotation: -24,
    durationMs: 1450
  },
  routeOverview: {
    id: 'routeOverview',
    label: '路线总览',
    description: '回看完整金色游线',
    zoom: 17.18,
    pitch: 56,
    rotation: -30,
    durationMs: 1350
  },
  landmarkFocus: {
    id: 'landmarkFocus',
    label: '地标聚焦',
    description: '无人机慢推靠近地标',
    zoom: 18.75,
    pitch: 66,
    rotation: -20,
    durationMs: 1200
  },
  closeInspect: {
    id: 'closeInspect',
    label: '调试近看',
    description: '近距离检查 GLB 地标',
    zoom: 19.35,
    pitch: 68,
    rotation: -18,
    durationMs: 900
  },
  guideFollow: {
    id: 'guideFollow',
    label: '导览跟随',
    description: '跟随当前位置缓慢移动',
    zoom: 18.25,
    pitch: 64,
    rotation: -26,
    durationMs: 900
  }
}

export type FlyMap3DCameraOptions = {
  map: any
  TMap: any
  target: LatLngPoint
  preset: Map3DCameraPreset
  sequenceRef: { current: number }
  targetPoiId?: string
  targetLandmarkId?: string
  twoStage?: boolean
  onComplete?: (event: Map3DCameraEvent) => void
}

export function flyMap3DCamera({
  map,
  TMap,
  target,
  preset,
  sequenceRef,
  targetPoiId,
  targetLandmarkId,
  twoStage = false,
  onComplete
}: FlyMap3DCameraOptions) {
  if (!map || !TMap) {
    return
  }

  const sequence = sequenceRef.current + 1
  sequenceRef.current = sequence
  const startedAtTime = Date.now()
  const startedAt = new Date(startedAtTime).toISOString()

  const finish = () => {
    if (sequenceRef.current !== sequence) {
      return
    }
    const finishedAtTime = Date.now()
    onComplete?.({
      cameraPreset: preset.id,
      targetPoiId,
      targetLandmarkId,
      durationMs: Math.max(0, finishedAtTime - startedAtTime),
      startedAt,
      finishedAt: new Date(finishedAtTime).toISOString()
    })
  }

  if (twoStage) {
    const pullbackPreset = {
      ...preset,
      zoom: Math.max(15.8, preset.zoom - 0.62),
      pitch: Math.max(52, preset.pitch - 4),
      rotation: preset.rotation - 10,
      durationMs: 560
    }
    applyCameraStep(map, TMap, target, pullbackPreset)
    window.setTimeout(() => {
      if (sequenceRef.current !== sequence) {
        return
      }
      applyCameraStep(map, TMap, target, preset)
      window.setTimeout(finish, preset.durationMs + 80)
    }, pullbackPreset.durationMs + 80)
    return
  }

  applyCameraStep(map, TMap, target, preset)
  window.setTimeout(finish, preset.durationMs + 80)
}

export function startBuddhaRealmTour(options: StartSpecificMap3DTourOptions) {
  return startMap3DTour({
    ...options,
    mode: 'buddhaRealmTour',
    defaultPresetId: 'landmarkFocus'
  })
}

export function stopBuddhaRealmTour(playbackRef: Map3DTourPlaybackRef, reason: Map3DTourStopReason = 'manual') {
  stopMap3DTour(playbackRef, 'buddhaRealmTour', reason)
}

export function startBuddhaRealmTimelineTour({
  map,
  TMap,
  sequenceRef,
  playbackRef,
  durationMs,
  pauses,
  getFrame,
  getSpeedMultiplier,
  minFrameMs = BUDDHA_REALM_TOUR_CONFIG.minFrameMs,
  onStarted,
  onFrame,
  onLandmarkPause,
  onStopped
}: StartBuddhaRealmTimelineTourOptions) {
  if (!map || !TMap || durationMs <= 0) {
    return
  }

  stopMap3DTour(playbackRef, undefined, 'replaced')
  const sequence = sequenceRef.current + 1
  sequenceRef.current = sequence
  const sortedPauses = [...pauses].sort((a, b) => a.progress - b.progress)
  const completedPauseIds = new Set<string>()
  const playback: Map3DTourPlayback = {
    mode: 'buddhaRealmTour',
    sequenceRef,
    timerIds: [],
    completedStepCount: 0,
    onStopped
  }
  playbackRef.current = playback

  let currentProgress = 0
  let startedAt = 0
  let lastTickAt = 0
  let lastAppliedAt = 0
  let cameraState: Map3DRouteTourFrame | null = null
  let paused:
    | {
        pause: Map3DRouteTourPause
        startedAt: number
      }
    | null = null

  onStarted?.({
    mode: 'buddhaRealmTour',
    durationMs,
    pauseCount: sortedPauses.length
  })

  const applyFrame = (timestamp: number) => {
    if (playbackRef.current !== playback || sequenceRef.current !== sequence) {
      return
    }

    const elapsedMs = Math.max(0, timestamp - startedAt)
    const pauseElapsedMs = paused ? Math.max(0, timestamp - paused.startedAt) : 0
    const targetFrame = getFrame(currentProgress, {
      elapsedMs,
      isPaused: Boolean(paused),
      pauseElapsedMs,
      activeLandmarkId: paused?.pause.nearbyLandmarkId
    })
    const frame = smoothRouteTourFrame(cameraState, targetFrame)
    cameraState = frame

    applyCameraFrame(map, TMap, frame)
    onFrame?.({ frame, elapsedMs })
    return frame
  }

  const tick = (timestamp: number) => {
    if (playbackRef.current !== playback || sequenceRef.current !== sequence) {
      return
    }

    if (!startedAt) {
      startedAt = timestamp
      lastTickAt = timestamp
      lastAppliedAt = 0
    }

    const deltaMs = Math.min(96, Math.max(0, timestamp - lastTickAt))
    lastTickAt = timestamp

    if (paused) {
      const pauseElapsedMs = timestamp - paused.startedAt

      if (timestamp - lastAppliedAt >= minFrameMs) {
        applyFrame(timestamp)
        lastAppliedAt = timestamp
      }

      if (pauseElapsedMs >= paused.pause.holdMs) {
        paused = null
      }
    } else {
      const speedMultiplier = clampNumber(getSpeedMultiplier?.(currentProgress) ?? 1, 0.12, 2.4)
      currentProgress = clampNumber(currentProgress + (deltaMs / durationMs) * speedMultiplier, 0, 1)

      const nextPause = sortedPauses.find(
        (pause) => !completedPauseIds.has(pause.id) && currentProgress >= pause.progress
      )

      if (nextPause && currentProgress < 0.995) {
        currentProgress = nextPause.progress
        completedPauseIds.add(nextPause.id)
        paused = {
          pause: nextPause,
          startedAt: timestamp
        }
        playback.completedStepCount = completedPauseIds.size
        const targetFrame = getFrame(currentProgress, {
          elapsedMs: Math.max(0, timestamp - startedAt),
          isPaused: true,
          pauseElapsedMs: 0,
          activeLandmarkId: nextPause.nearbyLandmarkId
        })
        const frame = smoothRouteTourFrame(cameraState, targetFrame)
        cameraState = frame
        applyCameraFrame(map, TMap, frame)
        onFrame?.({ frame, elapsedMs: Math.max(0, timestamp - startedAt) })
        onLandmarkPause?.({
          pause: nextPause,
          frame,
          elapsedMs: Math.max(0, timestamp - startedAt)
        })
        lastAppliedAt = timestamp
      } else if (timestamp - lastAppliedAt >= minFrameMs || currentProgress >= 1) {
        applyFrame(timestamp)
        lastAppliedAt = timestamp
      }

      if (currentProgress >= 1) {
        finishMap3DTour(playbackRef, playback, 'completed', completedPauseIds.size)
        return
      }
    }

    playback.frameId = window.requestAnimationFrame(tick)
  }

  playback.frameId = window.requestAnimationFrame(tick)
}

export function startRoutePreview(options: StartSpecificMap3DTourOptions) {
  return startMap3DTour({
    ...options,
    mode: 'routePreview',
    defaultPresetId: 'guideFollow'
  })
}

export function stopRoutePreview(playbackRef: Map3DTourPlaybackRef, reason: Map3DTourStopReason = 'manual') {
  stopMap3DTour(playbackRef, 'routePreview', reason)
}

export function flyTourStep({
  map,
  TMap,
  step,
  sequenceRef,
  defaultPresetId = 'landmarkFocus',
  onComplete
}: {
  map: any
  TMap: any
  step: Map3DTourStep
  sequenceRef: { current: number }
  defaultPresetId?: Map3DCameraPresetId
  onComplete?: (event: Map3DCameraEvent) => void
}) {
  flyMap3DCamera({
    map,
    TMap,
    target: step.target,
    preset: resolveTourStepPreset(step, defaultPresetId),
    sequenceRef,
    targetPoiId: step.targetPoiId,
    targetLandmarkId: step.targetLandmarkId,
    twoStage: step.twoStage ?? true,
    onComplete
  })
}

function startMap3DTour({
  mode,
  map,
  TMap,
  steps,
  sequenceRef,
  playbackRef,
  defaultPresetId = 'landmarkFocus',
  onStarted,
  onStep,
  onCameraComplete,
  onStopped
}: StartMap3DTourOptions) {
  if (!map || !TMap || !steps.length) {
    return
  }

  stopMap3DTour(playbackRef, undefined, 'replaced')
  const playback: Map3DTourPlayback = {
    mode,
    sequenceRef,
    timerIds: [],
    onStopped
  }
  playbackRef.current = playback
  let completedStepCount = 0
  onStarted?.({ mode, stepCount: steps.length })

  const playStep = (stepIndex: number) => {
    if (playbackRef.current !== playback) {
      return
    }

    if (stepIndex >= steps.length) {
      finishMap3DTour(playbackRef, playback, 'completed', completedStepCount)
      return
    }

    const step = steps[stepIndex]
    const preset = resolveTourStepPreset(step, defaultPresetId)
    onStep?.({
      mode,
      step,
      stepIndex,
      stepCount: steps.length,
      preset
    })

    flyMap3DCamera({
      map,
      TMap,
      target: step.target,
      preset,
      sequenceRef,
      targetPoiId: step.targetPoiId,
      targetLandmarkId: step.targetLandmarkId,
      twoStage: step.twoStage ?? true,
      onComplete: (event) => {
        if (playbackRef.current !== playback) {
          return
        }

        completedStepCount = stepIndex + 1
        playback.completedStepCount = completedStepCount
        onCameraComplete?.(event)
        const timerId = window.setTimeout(() => playStep(stepIndex + 1), step.holdMs ?? 1600)
        playback.timerIds.push(timerId)
      }
    })
  }

  playStep(0)
}

function stopMap3DTour(
  playbackRef: Map3DTourPlaybackRef,
  mode?: Map3DTourMode,
  reason: Map3DTourStopReason = 'manual'
) {
  const playback = playbackRef.current

  if (!playback || (mode && playback.mode !== mode)) {
    return
  }

  finishMap3DTour(playbackRef, playback, reason, playback.completedStepCount ?? 0)
}

function finishMap3DTour(
  playbackRef: Map3DTourPlaybackRef,
  playback: Map3DTourPlayback,
  reason: Map3DTourStopReason,
  completedStepCount: number
) {
  if (playbackRef.current !== playback) {
    return
  }

  playback.timerIds.forEach((timerId) => window.clearTimeout(timerId))
  playback.timerIds = []
  if (playback.frameId !== undefined) {
    window.cancelAnimationFrame(playback.frameId)
    playback.frameId = undefined
  }
  playback.cleanup?.()
  playback.sequenceRef.current += 1
  playbackRef.current = null
  playback.onStopped?.({
    mode: playback.mode,
    reason,
    completedStepCount
  })
}

function resolveTourStepPreset(step: Map3DTourStep, defaultPresetId: Map3DCameraPresetId) {
  const base = MAP_3D_GUIDE_CAMERA_PRESETS[step.presetId ?? defaultPresetId] ?? MAP_3D_GUIDE_CAMERA_PRESETS.landmarkFocus

  return {
    ...base,
    zoom: step.zoom ?? base.zoom,
    pitch: step.pitch ?? base.pitch,
    rotation: step.rotation ?? base.rotation,
    durationMs: step.durationMs ?? base.durationMs
  }
}

function applyCameraStep(map: any, TMap: any, target: LatLngPoint, preset: Map3DCameraPreset) {
  const center = new TMap.LatLng(target.lat, target.lng)

  if (typeof map.easeTo === 'function') {
    map.easeTo(
      {
        center,
        zoom: preset.zoom,
        pitch: preset.pitch,
        rotation: preset.rotation
      },
      { duration: preset.durationMs }
    )
    return
  }

  map.setCenter?.(center)
  if (typeof map.setZoom === 'function') {
    map.setZoom(preset.zoom)
  }
  map.setPitch?.(preset.pitch)
  map.setRotation?.(preset.rotation)
}

function applyCameraFrame(map: any, TMap: any, frame: Map3DRouteTourFrame) {
  const center = new TMap.LatLng(frame.lat, frame.lng)

  if (typeof map.setCenter === 'function') {
    map.setCenter(center)
    if (typeof map.setZoom === 'function') {
      map.setZoom(frame.zoom)
    }
    map.setPitch?.(frame.pitch)
    map.setRotation?.(frame.rotation)
    return
  }

  if (typeof map.easeTo === 'function') {
    map.easeTo(
      {
        center,
        zoom: frame.zoom,
        pitch: frame.pitch,
        rotation: frame.rotation
      },
      { duration: 0 }
    )
  }
}

function smoothRouteTourFrame(previous: Map3DRouteTourFrame | null, target: Map3DRouteTourFrame): Map3DRouteTourFrame {
  if (!previous || !target.smoothingEnabled) {
    return target
  }

  return {
    ...target,
    lat: lerpNumber(previous.lat, target.lat, BUDDHA_REALM_TOUR_CONFIG.centerSmoothing),
    lng: lerpNumber(previous.lng, target.lng, BUDDHA_REALM_TOUR_CONFIG.centerSmoothing),
    bearing: normalizeBearing(
      lerpAngle(previous.bearing, target.bearing, BUDDHA_REALM_TOUR_CONFIG.rotationSmoothing)
    ),
    zoom: lerpNumber(previous.zoom, target.zoom, BUDDHA_REALM_TOUR_CONFIG.zoomSmoothing),
    pitch: lerpNumber(previous.pitch, target.pitch, BUDDHA_REALM_TOUR_CONFIG.pitchSmoothing),
    rotation: normalizeRotation(
      lerpAngle(previous.rotation, target.rotation, BUDDHA_REALM_TOUR_CONFIG.rotationSmoothing)
    )
  }
}

function lerpNumber(current: number, target: number, alpha: number) {
  return current + (target - current) * clampNumber(alpha, 0, 1)
}

function lerpAngle(current: number, target: number, alpha: number) {
  return current + normalizeRotation(target - current) * clampNumber(alpha, 0, 1)
}

function normalizeBearing(value: number) {
  return ((value % 360) + 360) % 360
}

function normalizeRotation(value: number) {
  let rotation = value

  while (rotation > 180) {
    rotation -= 360
  }

  while (rotation < -180) {
    rotation += 360
  }

  return rotation
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
