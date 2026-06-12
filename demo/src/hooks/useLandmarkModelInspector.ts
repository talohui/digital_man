import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'

import {
  getMapModelOverlayInspectorId,
  type LingshanMapModelOverlay,
  type MapModelFootprintMask
} from '../data/lingshanMapModelOverlays'
import type { LatLngPoint } from '../data/guideData'
import type { Map3DPerfRecorder } from '../lib/map3dPerf'

export const LANDMARK_CALIBRATION_DRAFT_STORAGE_KEY = 'lingshan_landmark_calibration_draft_v1'

export type LandmarkInspectorStatus = 'idle' | 'loading' | 'loaded' | 'failed' | 'unloaded'

export type LandmarkCalibrationValues = {
  scale: number
  height: number
  rotationY: number
  lngOffset: number
  latOffset: number
  footprintMask?: LandmarkFootprintMaskValues
}

export type LandmarkFootprintMaskValues = MapModelFootprintMask

export type LandmarkCalibrationDraft = Partial<Omit<LandmarkCalibrationValues, 'footprintMask'>> & {
  footprintMask?: Partial<LandmarkFootprintMaskValues>
  updatedAt: string
}

export type LandmarkCalibrationPatch = LandmarkCalibrationValues & {
  id: string
}

export type LandmarkInspectorItem = {
  id: string
  poiId: string
  name: string
  modelUrl?: string
  fileSizeLabel?: string
  priority: string
  anchorId: string
  status: LandmarkInspectorStatus
  durationMs?: number
  error?: string
  loadCount: number
  unloadCount: number
  calibration: LandmarkCalibrationValues
  supportsFootprintMask: boolean
  hasSavedDraft: boolean
  isDirty: boolean
}

export type LandmarkModelInspector = {
  items: LandmarkInspectorItem[]
  activeCalibrationId?: string
  calibrationDraftCount: number
  usesLocalDraft: boolean
  startCalibration: (id: string) => void
  loadLandmark: (id: string) => void
  unloadLandmark: (id: string) => void
  focusLandmark: (id: string) => void
  updateCalibration: (id: string, patch: Partial<LandmarkCalibrationValues>) => void
  updateFootprintMask: (id: string, patch: Partial<LandmarkFootprintMaskValues>) => void
  resetFootprintMask: (id: string) => void
  saveCalibrationDraft: (id: string) => void
  resetCalibration: (id: string) => void
  clearAllCalibrationDrafts: () => void
  getCalibrationPatch: (id: string) => LandmarkCalibrationPatch | null
  getAllCalibrationPatches: () => LandmarkCalibrationPatch[]
}

type LandmarkInspectorState = Record<
  string,
  {
    status: LandmarkInspectorStatus
    durationMs?: number
    error?: string
    loadCount: number
    unloadCount: number
  }
>

type UseLandmarkModelInspectorOptions = {
  active: boolean
  map: any
  mapReady: boolean
  overlays: LingshanMapModelOverlay[]
  perfRecorder: Map3DPerfRecorder
  resolveLocation: (overlay: LingshanMapModelOverlay) => LatLngPoint | null
}

export function useLandmarkModelInspector({
  active,
  map,
  mapReady,
  overlays,
  perfRecorder,
  resolveLocation
}: UseLandmarkModelInspectorOptions): LandmarkModelInspector {
  const modelsRef = useRef<Map<string, any>>(new Map())
  const footprintMaskLayerRef = useRef<any>(null)
  const versionsRef = useRef<Map<string, number>>(new Map())
  const calibrationApplyTimersRef = useRef<Map<string, number>>(new Map())
  const overlayLookup = useMemo(() => buildOverlayLookup(overlays), [overlays])
  const [state, setState] = useState<LandmarkInspectorState>(() => buildInitialState(overlays))
  const [savedDrafts, setSavedDrafts] = useState<Record<string, LandmarkCalibrationDraft>>(() =>
    active ? loadCalibrationDrafts() : {}
  )
  const [calibrationEdits, setCalibrationEdits] = useState<Record<string, LandmarkCalibrationValues>>(() =>
    buildInitialCalibrationEdits(overlays, active ? loadCalibrationDrafts() : {})
  )
  const [activeCalibrationId, setActiveCalibrationId] = useState<string | undefined>()

  useEffect(() => {
    if (!active) {
      clearLandmarkModels(modelsRef.current)
      modelsRef.current = new Map()
      clearFootprintMaskLayer(footprintMaskLayerRef)
      clearCalibrationTimers(calibrationApplyTimersRef.current)
      return
    }

    const drafts = loadCalibrationDrafts()
    setSavedDrafts(drafts)
    setCalibrationEdits(buildInitialCalibrationEdits(overlays, drafts))
    perfRecorder.setLandmarkTotal(overlays.length)
  }, [active, overlays, perfRecorder])

  useEffect(() => {
    setState((current) => {
      const next = { ...current }
      overlays.forEach((overlay) => {
        const id = getMapModelOverlayInspectorId(overlay)
        if (!next[id]) {
          next[id] = {
            status: 'idle',
            loadCount: 0,
            unloadCount: 0
          }
        }
      })
      return next
    })
    setCalibrationEdits((current) => {
      const next = { ...current }
      overlays.forEach((overlay) => {
        const id = getMapModelOverlayInspectorId(overlay)
        if (!next[id]) {
          next[id] = mergeCalibration(buildDefaultCalibration(overlay), savedDrafts[id])
        }
      })
      return next
    })
  }, [overlays, savedDrafts])

  useEffect(() => {
    if (!active || !activeCalibrationId) {
      clearFootprintMaskLayer(footprintMaskLayerRef)
      return
    }

    const overlay = overlayLookup.get(activeCalibrationId)
    const calibration = calibrationEdits[activeCalibrationId]
    const anchor = overlay ? resolveLocation(overlay) : null

    if (!overlay || !calibration || !anchor) {
      clearFootprintMaskLayer(footprintMaskLayerRef)
      return
    }

    applyFootprintMaskLayer({
      id: activeCalibrationId,
      active,
      map,
      mapReady,
      overlay,
      anchor,
      calibration,
      layerRef: footprintMaskLayerRef
    })
  }, [active, activeCalibrationId, calibrationEdits, map, mapReady, overlayLookup, resolveLocation])

  useEffect(() => {
    const activeValues = activeCalibrationId ? calibrationEdits[activeCalibrationId] : undefined
    perfRecorder.updateLandmarkCalibration({
      draftCount: Object.keys(savedDrafts).length,
      activeId: activeCalibrationId,
      values: activeValues
    })
  }, [activeCalibrationId, calibrationEdits, perfRecorder, savedDrafts])

  useEffect(() => {
    return () => {
      clearLandmarkModels(modelsRef.current)
      modelsRef.current = new Map()
      clearFootprintMaskLayer(footprintMaskLayerRef)
      clearCalibrationTimers(calibrationApplyTimersRef.current)
    }
  }, [])

  const items = useMemo(
    () =>
      overlays.map((overlay) => {
        const id = getMapModelOverlayInspectorId(overlay)
        const itemState = state[id] ?? {
          status: 'idle',
          loadCount: 0,
          unloadCount: 0
        }
        const calibration = calibrationEdits[id] ?? buildDefaultCalibration(overlay)
        const savedDraft = savedDrafts[id]
        const savedCalibration = savedDraft
          ? mergeCalibration(buildDefaultCalibration(overlay), savedDraft)
          : undefined

        return {
          id,
          poiId: overlay.poiId,
          name: overlay.name,
          modelUrl: overlay.modelUrl,
          fileSizeLabel: overlay.fileSizeLabel,
          priority: overlay.priority,
          anchorId: overlay.poiId,
          calibration,
          supportsFootprintMask: Boolean(overlay.footprintMask),
          hasSavedDraft: Boolean(savedDraft),
          isDirty: savedCalibration
            ? !areCalibrationValuesEqual(calibration, savedCalibration)
            : !areCalibrationValuesEqual(calibration, buildDefaultCalibration(overlay)),
          ...itemState
        }
      }),
    [calibrationEdits, overlays, savedDrafts, state]
  )

  const updateItemState = (
    id: string,
    updater: (current: LandmarkInspectorState[string]) => LandmarkInspectorState[string]
  ) => {
    setState((current) => {
      const previous = current[id] ?? {
        status: 'idle',
        loadCount: 0,
        unloadCount: 0
      }

      return {
        ...current,
        [id]: updater(previous)
      }
    })
  }

  const loadLandmark = (id: string) => {
    const overlay = overlayLookup.get(id)
    const calibration = calibrationEdits[id] ?? (overlay ? buildDefaultCalibration(overlay) : undefined)
    createLandmarkModel(id, { trackLoad: true, calibration })
  }

  const unloadLandmark = (id: string) => {
    const model = modelsRef.current.get(id)

    if (model) {
      clearLandmarkModel(model)
      modelsRef.current.delete(id)
    }

    versionsRef.current.set(id, (versionsRef.current.get(id) ?? 0) + 1)
    clearCalibrationTimer(calibrationApplyTimersRef.current, id)
    updateItemState(id, (current) => ({
      ...current,
      status: 'unloaded',
      unloadCount: current.unloadCount + 1
    }))
    perfRecorder.unloadLandmarkAsset(id)
  }

  const focusLandmark = (id: string) => {
    const overlay = overlayLookup.get(id)
    const anchor = overlay ? resolveLocation(overlay) : null
    const calibration = calibrationEdits[id] ?? (overlay ? buildDefaultCalibration(overlay) : undefined)

    if (!active || !mapReady || !window.TMap || !map || !anchor || !calibration) {
      return
    }

    const center = new window.TMap.LatLng(anchor.lat + calibration.latOffset, anchor.lng + calibration.lngOffset)

    if (typeof map.easeTo === 'function') {
      map.easeTo({ center, zoom: 18.8, pitch: 65, rotation: -28 }, { duration: 500 })
      return
    }

    map.setCenter?.(center)
    map.setZoom?.(18.8)
    map.setPitch?.(65)
    map.setRotation?.(-28)
  }

  const startCalibration = (id: string) => {
    setActiveCalibrationId(id)
    focusLandmark(id)
    const currentState = state[id]
    if (currentState?.status !== 'loaded' && currentState?.status !== 'loading') {
      loadLandmark(id)
    }
  }

  const updateCalibration = (id: string, patch: Partial<LandmarkCalibrationValues>) => {
    const overlay = overlayLookup.get(id)

    if (!overlay) {
      return
    }

    setActiveCalibrationId(id)
    setCalibrationEdits((current) => {
      const previous = current[id] ?? mergeCalibration(buildDefaultCalibration(overlay), savedDrafts[id])
      const next = normalizeCalibration({
        ...previous,
        ...patch
      })
      scheduleCalibrationApply(id, next)
      return {
        ...current,
        [id]: next
      }
    })
  }

  const updateFootprintMask = (id: string, patch: Partial<LandmarkFootprintMaskValues>) => {
    const overlay = overlayLookup.get(id)

    if (!overlay?.footprintMask) {
      return
    }

    const defaultFootprintMask = buildDefaultFootprintMask(overlay)
    if (!defaultFootprintMask) {
      return
    }

    const current = calibrationEdits[id] ?? mergeCalibration(buildDefaultCalibration(overlay), savedDrafts[id])
    updateCalibration(id, {
      footprintMask: normalizeFootprintMask({
        ...defaultFootprintMask,
        ...current.footprintMask,
        ...patch
      })
    })
  }

  const resetFootprintMask = (id: string) => {
    const overlay = overlayLookup.get(id)

    if (!overlay?.footprintMask) {
      return
    }

    const currentDraft = savedDrafts[id]
    if (currentDraft?.footprintMask) {
      const nextDrafts = {
        ...savedDrafts,
        [id]: {
          ...currentDraft,
          footprintMask: undefined,
          updatedAt: new Date().toISOString()
        }
      }
      setSavedDrafts(nextDrafts)
      saveCalibrationDrafts(nextDrafts)
    }

    updateCalibration(id, {
      footprintMask: buildDefaultFootprintMask(overlay)
    })
  }

  const saveCalibrationDraft = (id: string) => {
    const values = calibrationEdits[id]

    if (!values) {
      return
    }

    const nextDrafts = {
      ...savedDrafts,
      [id]: {
        ...values,
        updatedAt: new Date().toISOString()
      }
    }
    setSavedDrafts(nextDrafts)
    saveCalibrationDrafts(nextDrafts)
  }

  const resetCalibration = (id: string) => {
    const overlay = overlayLookup.get(id)

    if (!overlay) {
      return
    }

    const nextDrafts = { ...savedDrafts }
    delete nextDrafts[id]
    const nextCalibration = buildDefaultCalibration(overlay)
    setSavedDrafts(nextDrafts)
    saveCalibrationDrafts(nextDrafts)
    setCalibrationEdits((current) => ({
      ...current,
      [id]: nextCalibration
    }))
    scheduleCalibrationApply(id, nextCalibration)
  }

  const clearAllCalibrationDrafts = () => {
    const nextEdits = buildInitialCalibrationEdits(overlays, {})
    setSavedDrafts({})
    saveCalibrationDrafts({})
    setCalibrationEdits(nextEdits)
    Object.entries(nextEdits).forEach(([id, calibration]) => {
      scheduleCalibrationApply(id, calibration)
    })
  }

  const getCalibrationPatch = (id: string) => {
    const calibration = calibrationEdits[id]

    if (!calibration) {
      return null
    }

    return {
      id,
      ...calibration
    }
  }

  const getAllCalibrationPatches = () =>
    Object.entries(savedDrafts)
      .map(([id]) => getCalibrationPatch(id))
      .filter((patch): patch is LandmarkCalibrationPatch => Boolean(patch))

  const createLandmarkModel = (
    id: string,
    options: {
      trackLoad: boolean
      calibration?: LandmarkCalibrationValues
    }
  ) => {
    if (!active || !mapReady || !window.TMap || !map || !window.TMap.model?.GLTFModel) {
      updateItemState(id, (current) => ({
        ...current,
        status: 'failed',
        error: '地图或 GLTFModel 尚未就绪'
      }))
      return false
    }

    const overlay = overlayLookup.get(id)

    if (!overlay?.modelUrl) {
      updateItemState(id, (current) => ({
        ...current,
        status: 'failed',
        error: '模型 URL 缺失'
      }))
      return false
    }

    const calibration = options.calibration ?? calibrationEdits[id] ?? mergeCalibration(buildDefaultCalibration(overlay), savedDrafts[id])
    const currentState = state[id]

    if (options.trackLoad && (currentState?.status === 'loading' || modelsRef.current.has(id))) {
      return true
    }

    const anchor = resolveLocation(overlay)

    if (!anchor) {
      updateItemState(id, (current) => ({
        ...current,
        status: 'failed',
        error: 'POI / anchor 坐标缺失',
        loadCount: options.trackLoad ? current.loadCount + 1 : current.loadCount
      }))
      if (options.trackLoad) {
        perfRecorder.startLandmarkAsset({
          id,
          name: overlay.name,
          modelUrl: overlay.modelUrl,
          anchorId: overlay.poiId,
          fileSizeLabel: overlay.fileSizeLabel,
          priority: overlay.priority
        })
      }
      perfRecorder.failLandmarkAsset(id, 'POI / anchor 坐标缺失')
      return false
    }

    clearLandmarkModel(modelsRef.current.get(id))
    modelsRef.current.delete(id)

    const version = (versionsRef.current.get(id) ?? 0) + 1
    versionsRef.current.set(id, version)
    const startedAt = performance.now()

    updateItemState(id, (current) => ({
      ...current,
      status: 'loading',
      error: undefined,
      durationMs: undefined,
      loadCount: options.trackLoad ? current.loadCount + 1 : current.loadCount
    }))

    if (options.trackLoad) {
      perfRecorder.startLandmarkAsset({
        id,
        name: overlay.name,
        modelUrl: overlay.modelUrl,
        anchorId: overlay.poiId,
        fileSizeLabel: overlay.fileSizeLabel,
        priority: overlay.priority
      })
    }

    try {
      const model = new window.TMap.model.GLTFModel({
        id: `map-3d-guide-landmark-inspector-${id}`,
        map,
        url: overlay.modelUrl,
        position: toTMapPosition(anchor, calibration),
        rotation: toTMapRotation(overlay, calibration),
        scale: calibration.scale
      })

      modelsRef.current.set(id, model)
      const durationMs = Math.round(performance.now() - startedAt)
      updateItemState(id, (current) => ({
        ...current,
        status: 'loaded',
        durationMs,
        error: undefined
      }))

      if (options.trackLoad) {
        perfRecorder.finishLandmarkAsset(id)
      }

      if (typeof model.on === 'function') {
        model.on('error', (error: unknown) => {
          if (versionsRef.current.get(id) !== version) {
            return
          }
          const errorMessage = normalizeError(error)
          updateItemState(id, (current) => ({
            ...current,
            status: 'failed',
            error: errorMessage
          }))
          perfRecorder.failLandmarkAsset(id, errorMessage)
        })
      }
      return true
    } catch (error) {
      const errorMessage = normalizeError(error)
      updateItemState(id, (current) => ({
        ...current,
        status: 'failed',
        durationMs: Math.round(performance.now() - startedAt),
        error: errorMessage
      }))
      perfRecorder.failLandmarkAsset(id, errorMessage)
      return false
    }
  }

  const scheduleCalibrationApply = (id: string, calibration: LandmarkCalibrationValues) => {
    clearCalibrationTimer(calibrationApplyTimersRef.current, id)
    const timer = window.setTimeout(() => {
      applyCalibrationToModel(id, calibration)
      calibrationApplyTimersRef.current.delete(id)
    }, 300)
    calibrationApplyTimersRef.current.set(id, timer)
  }

  const applyCalibrationToModel = (id: string, calibration: LandmarkCalibrationValues) => {
    const model = modelsRef.current.get(id)
    const overlay = overlayLookup.get(id)
    const anchor = overlay ? resolveLocation(overlay) : null

    if (!model || !overlay || !anchor || !window.TMap) {
      return
    }

    const canUpdateDirectly =
      typeof model.setScale === 'function' &&
      typeof model.setRotation === 'function' &&
      typeof model.setPosition === 'function'

    if (canUpdateDirectly) {
      try {
        model.setScale(calibration.scale)
        model.setRotation(toTMapRotation(overlay, calibration))
        model.setPosition(toTMapPosition(anchor, calibration))
        perfRecorder.updateLandmarkCalibration({
          draftCount: Object.keys(savedDrafts).length,
          activeId: id,
          values: calibration
        })
        return
      } catch {
        // Fall back to rebuilding only this landmark overlay.
      }
    }

    createLandmarkModel(id, {
      trackLoad: false,
      calibration
    })
  }

  return {
    items,
    activeCalibrationId,
    calibrationDraftCount: Object.keys(savedDrafts).length,
    usesLocalDraft: Object.keys(savedDrafts).length > 0,
    startCalibration,
    loadLandmark,
    unloadLandmark,
    focusLandmark,
    updateCalibration,
    updateFootprintMask,
    resetFootprintMask,
    saveCalibrationDraft,
    resetCalibration,
    clearAllCalibrationDrafts,
    getCalibrationPatch,
    getAllCalibrationPatches
  }
}

function buildOverlayLookup(overlays: LingshanMapModelOverlay[]) {
  const lookup = new Map<string, LingshanMapModelOverlay>()
  overlays.forEach((overlay) => lookup.set(getMapModelOverlayInspectorId(overlay), overlay))
  return lookup
}

function buildInitialState(overlays: LingshanMapModelOverlay[]) {
  return overlays.reduce<LandmarkInspectorState>((result, overlay) => {
    result[getMapModelOverlayInspectorId(overlay)] = {
      status: 'idle',
      loadCount: 0,
      unloadCount: 0
    }
    return result
  }, {})
}

function buildInitialCalibrationEdits(
  overlays: LingshanMapModelOverlay[],
  drafts: Record<string, LandmarkCalibrationDraft>
) {
  return overlays.reduce<Record<string, LandmarkCalibrationValues>>((result, overlay) => {
    const id = getMapModelOverlayInspectorId(overlay)
    result[id] = mergeCalibration(buildDefaultCalibration(overlay), drafts[id])
    return result
  }, {})
}

function buildDefaultCalibration(overlay: LingshanMapModelOverlay): LandmarkCalibrationValues {
  const footprintMask = buildDefaultFootprintMask(overlay)

  return {
    scale: overlay.scale,
    height: overlay.height,
    rotationY: overlay.rotation[1] ?? 0,
    lngOffset: overlay.lngOffset ?? 0,
    latOffset: overlay.latOffset ?? 0,
    ...(footprintMask ? { footprintMask } : {})
  }
}

function mergeCalibration(
  defaultValues: LandmarkCalibrationValues,
  draft?: LandmarkCalibrationDraft
): LandmarkCalibrationValues {
  return normalizeCalibration({
    scale: draft?.scale ?? defaultValues.scale,
    height: draft?.height ?? defaultValues.height,
    rotationY: draft?.rotationY ?? defaultValues.rotationY,
    lngOffset: draft?.lngOffset ?? defaultValues.lngOffset,
    latOffset: draft?.latOffset ?? defaultValues.latOffset,
    footprintMask: mergeFootprintMask(defaultValues.footprintMask, draft?.footprintMask)
  })
}

function normalizeCalibration(values: LandmarkCalibrationValues): LandmarkCalibrationValues {
  const footprintMask = values.footprintMask ? normalizeFootprintMask(values.footprintMask) : undefined

  return {
    scale: normalizeNumber(values.scale, 1),
    height: normalizeNumber(values.height, 0),
    rotationY: normalizeNumber(values.rotationY, 0),
    lngOffset: normalizeNumber(values.lngOffset, 0),
    latOffset: normalizeNumber(values.latOffset, 0),
    ...(footprintMask ? { footprintMask } : {})
  }
}

function normalizeNumber(value: number, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function areCalibrationValuesEqual(a: LandmarkCalibrationValues, b: LandmarkCalibrationValues) {
  return (
    a.scale === b.scale &&
    a.height === b.height &&
    a.rotationY === b.rotationY &&
    a.lngOffset === b.lngOffset &&
    a.latOffset === b.latOffset &&
    areFootprintMasksEqual(a.footprintMask, b.footprintMask)
  )
}

function buildDefaultFootprintMask(overlay: LingshanMapModelOverlay) {
  return overlay.footprintMask ? normalizeFootprintMask(overlay.footprintMask) : undefined
}

function mergeFootprintMask(
  defaultMask?: LandmarkFootprintMaskValues,
  draft?: Partial<LandmarkFootprintMaskValues>
) {
  if (!defaultMask && !draft) {
    return undefined
  }

  return normalizeFootprintMask({
    ...(defaultMask ?? {
      enabled: false,
      mode: 'ring',
      width: 80,
      depth: 60,
      innerWidth: 52,
      innerDepth: 34,
      height: 0,
      rotationY: 0,
      lngOffset: 0,
      latOffset: 0,
      color: '#ded4bd',
      opacity: 0.65
    }),
    ...(draft ?? {})
  })
}

function normalizeFootprintMask(values: LandmarkFootprintMaskValues): LandmarkFootprintMaskValues {
  const width = Math.max(1, normalizeNumber(values.width, 80))
  const depth = Math.max(1, normalizeNumber(values.depth, 60))
  const mode = values.mode === 'none' || values.mode === 'solid' || values.mode === 'ring'
    ? values.mode
    : 'ring'

  return {
    enabled: Boolean(values.enabled),
    mode,
    width,
    depth,
    innerWidth: Math.max(1, Math.min(width - 1, normalizeNumber(values.innerWidth ?? width * 0.65, width * 0.65))),
    innerDepth: Math.max(1, Math.min(depth - 1, normalizeNumber(values.innerDepth ?? depth * 0.58, depth * 0.58))),
    height: normalizeNumber(values.height, 0),
    rotationY: normalizeNumber(values.rotationY, 0),
    lngOffset: normalizeNumber(values.lngOffset, 0),
    latOffset: normalizeNumber(values.latOffset, 0),
    color: values.color || '#ded4bd',
    opacity: Math.max(0, Math.min(1, normalizeNumber(values.opacity, 0.65)))
  }
}

function areFootprintMasksEqual(a?: LandmarkFootprintMaskValues, b?: LandmarkFootprintMaskValues) {
  if (!a && !b) {
    return true
  }
  if (!a || !b) {
    return false
  }

  return (
    a.enabled === b.enabled &&
    a.mode === b.mode &&
    a.width === b.width &&
    a.depth === b.depth &&
    a.innerWidth === b.innerWidth &&
    a.innerDepth === b.innerDepth &&
    a.height === b.height &&
    a.rotationY === b.rotationY &&
    a.lngOffset === b.lngOffset &&
    a.latOffset === b.latOffset &&
    a.color === b.color &&
    a.opacity === b.opacity
  )
}

function toTMapPosition(anchor: LatLngPoint, calibration: LandmarkCalibrationValues) {
  return new window.TMap.LatLng(anchor.lat + calibration.latOffset, anchor.lng + calibration.lngOffset, calibration.height)
}

function toTMapRotation(overlay: LingshanMapModelOverlay, calibration: LandmarkCalibrationValues): [number, number, number] {
  return [overlay.rotation[0] ?? 0, calibration.rotationY, overlay.rotation[2] ?? 0]
}

function applyFootprintMaskLayer(options: {
  id: string
  active: boolean
  map: any
  mapReady: boolean
  overlay: LingshanMapModelOverlay
  anchor: LatLngPoint
  calibration: LandmarkCalibrationValues
  layerRef: MutableRefObject<any>
}) {
  const { active, map, mapReady, overlay, anchor, calibration, layerRef } = options
  const mask = calibration.footprintMask

  if (!active || !mapReady || !map || !window.TMap || !mask?.enabled) {
    clearFootprintMaskLayer(layerRef)
    return
  }

  const geometries = buildFootprintMaskGeometries(options.id, anchor, calibration, mask)

  if (!geometries.length) {
    clearFootprintMaskLayer(layerRef)
    return
  }

  if (!overlay.footprintMask || !window.TMap.MultiPolygon || !window.TMap.PolygonStyle) {
    clearFootprintMaskLayer(layerRef)
    return
  }

  try {
    clearFootprintMaskLayer(layerRef)
    // TMap.MultiPolygon is a ground footprint. `height` is retained in the draft
    // for a future thin-base implementation, but it does not remove Tencent 3D buildings.
    layerRef.current = new window.TMap.MultiPolygon({
      map,
      styles: {
        footprintMask: new window.TMap.PolygonStyle({
          color: colorWithOpacity(mask.color, mask.opacity),
          showBorder: true,
          borderColor: colorWithOpacity('#8f7d5d', Math.min(0.95, mask.opacity + 0.15)),
          borderWidth: 1
        })
      },
      geometries
    })
  } catch {
    clearFootprintMaskLayer(layerRef)
  }
}

function buildFootprintMaskGeometries(
  id: string,
  anchor: LatLngPoint,
  calibration: LandmarkCalibrationValues,
  mask: LandmarkFootprintMaskValues
) {
  if (mask.mode === 'none') {
    return []
  }

  if (mask.mode === 'solid') {
    return [
      {
        id: `${id}-footprint-mask-solid`,
        styleId: 'footprintMask',
        paths: buildFootprintRectanglePath(anchor, calibration, mask, 0, 0, mask.width, mask.depth)
      }
    ]
  }

  const innerWidth = mask.innerWidth ?? mask.width * 0.65
  const innerDepth = mask.innerDepth ?? mask.depth * 0.58

  if (innerWidth <= 0 || innerDepth <= 0 || innerWidth >= mask.width || innerDepth >= mask.depth) {
    return []
  }

  const sideWidth = (mask.width - innerWidth) / 2
  const sideDepth = (mask.depth - innerDepth) / 2

  return [
    {
      id: `${id}-footprint-mask-top`,
      styleId: 'footprintMask',
      paths: buildFootprintRectanglePath(anchor, calibration, mask, 0, (innerDepth + sideDepth) / 2, mask.width, sideDepth)
    },
    {
      id: `${id}-footprint-mask-bottom`,
      styleId: 'footprintMask',
      paths: buildFootprintRectanglePath(anchor, calibration, mask, 0, -(innerDepth + sideDepth) / 2, mask.width, sideDepth)
    },
    {
      id: `${id}-footprint-mask-left`,
      styleId: 'footprintMask',
      paths: buildFootprintRectanglePath(anchor, calibration, mask, -(innerWidth + sideWidth) / 2, 0, sideWidth, innerDepth)
    },
    {
      id: `${id}-footprint-mask-right`,
      styleId: 'footprintMask',
      paths: buildFootprintRectanglePath(anchor, calibration, mask, (innerWidth + sideWidth) / 2, 0, sideWidth, innerDepth)
    }
  ]
}

function buildFootprintRectanglePath(
  anchor: LatLngPoint,
  calibration: LandmarkCalibrationValues,
  mask: LandmarkFootprintMaskValues,
  centerEastMeters: number,
  centerNorthMeters: number,
  widthMeters: number,
  depthMeters: number
) {
  const center = {
    lat: anchor.lat + calibration.latOffset + mask.latOffset,
    lng: anchor.lng + calibration.lngOffset + mask.lngOffset
  }
  const halfWidth = widthMeters / 2
  const halfDepth = depthMeters / 2
  const rotation = (mask.rotationY * Math.PI) / 180
  const corners: Array<[number, number]> = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth]
  ]

  return corners.map(([eastMeters, northMeters]) => {
    const localEast = centerEastMeters + eastMeters
    const localNorth = centerNorthMeters + northMeters
    const rotatedEast = localEast * Math.cos(rotation) - localNorth * Math.sin(rotation)
    const rotatedNorth = localEast * Math.sin(rotation) + localNorth * Math.cos(rotation)
    const point = offsetLatLngMeters(center, rotatedEast, rotatedNorth)
    return new window.TMap.LatLng(point.lat, point.lng)
  })
}

function offsetLatLngMeters(point: LatLngPoint, eastMeters: number, northMeters: number): LatLngPoint {
  const latOffset = northMeters / 111320
  const lngMeters = 111320 * Math.cos((point.lat * Math.PI) / 180)
  const lngOffset = lngMeters === 0 ? 0 : eastMeters / lngMeters

  return {
    lat: point.lat + latOffset,
    lng: point.lng + lngOffset
  }
}

function colorWithOpacity(color: string, opacity: number) {
  const alpha = Math.max(0, Math.min(1, opacity))
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const normalized = hex.length === 3
      ? hex.split('').map((part) => `${part}${part}`).join('')
      : hex.padEnd(6, '0').slice(0, 6)
    const red = parseInt(normalized.slice(0, 2), 16)
    const green = parseInt(normalized.slice(2, 4), 16)
    const blue = parseInt(normalized.slice(4, 6), 16)
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
  }
  return color
}

function clearLandmarkModel(model: any) {
  model?.setMap?.(null)
  model?.remove?.()
  model?.destroy?.()
}

function clearFootprintMaskLayer(layerRef: MutableRefObject<any>) {
  const layer = layerRef.current
  layer?.setMap?.(null)
  layer?.remove?.()
  layer?.destroy?.()
  layerRef.current = null
}

function clearLandmarkModels(models: Map<string, any>) {
  models.forEach((model) => clearLandmarkModel(model))
}

function clearCalibrationTimer(timers: Map<string, number>, id: string) {
  const timer = timers.get(id)

  if (timer !== undefined) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
}

function clearCalibrationTimers(timers: Map<string, number>) {
  Array.from(timers.keys()).forEach((id) => clearCalibrationTimer(timers, id))
}

function loadCalibrationDrafts(): Record<string, LandmarkCalibrationDraft> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(LANDMARK_CALIBRATION_DRAFT_STORAGE_KEY)
    if (!rawValue) {
      return {}
    }
    const parsed = JSON.parse(rawValue)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function saveCalibrationDrafts(drafts: Record<string, LandmarkCalibrationDraft>) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (Object.keys(drafts).length === 0) {
      window.localStorage.removeItem(LANDMARK_CALIBRATION_DRAFT_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(LANDMARK_CALIBRATION_DRAFT_STORAGE_KEY, JSON.stringify(drafts, null, 2))
  } catch {
    // Local storage is optional in debug tooling.
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    return JSON.stringify(error)
  } catch {
    return '未知错误'
  }
}
