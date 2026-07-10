import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'

import {
  getMapModelOverlayInspectorId,
  type LingshanMapModelOverlay,
  type MapModelCompanionModel,
  type MapModelFootprintMask
} from '../data/lingshanMapModelOverlays'
import {
  getLandmarkOptimizedModelCandidates,
  type LandmarkModelVariant,
  type LandmarkOptimizedModelCandidate
} from '../data/lingshanOptimizedModelCandidates'
import type { LatLngPoint } from '../data/guideData'
import type { LayerManager } from '../lib/map/LayerManager'
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

export type LandmarkCompanionCalibrationValues = {
  enabled: boolean
  scale: number
  height: number
  rotationY: number
  lngOffset: number
  latOffset: number
}

export type LandmarkCompanionCalibrationDraft = Partial<LandmarkCompanionCalibrationValues> & {
  updatedAt?: string
}

export type LandmarkCompanionCalibrationPatch = LandmarkCompanionCalibrationValues & {
  parentLandmarkId: string
  id: string
}

export type LandmarkCalibrationDraft = Partial<Omit<LandmarkCalibrationValues, 'footprintMask'>> & {
  footprintMask?: Partial<LandmarkFootprintMaskValues>
  companions?: Record<string, LandmarkCompanionCalibrationDraft>
  updatedAt: string
}

export type LandmarkCalibrationPatch = LandmarkCalibrationValues & {
  id: string
  companions?: LandmarkCompanionCalibrationPatch[]
}

export type LandmarkCompanionItem = {
  parentLandmarkId: string
  parentPoiId: string
  id: string
  type: MapModelCompanionModel['type']
  name: string
  modelUrl: string
  fileSizeLabel?: string
  enabled: boolean
  note?: string
  calibration: LandmarkCompanionCalibrationValues
  status: LandmarkInspectorStatus
  durationMs?: number
  error?: string
  loadCount: number
  unloadCount: number
  hasSavedDraft: boolean
  isDirty: boolean
}

export type LandmarkInspectorItem = {
  id: string
  poiId: string
  name: string
  modelUrl?: string
  fileSizeLabel?: string
  selectedVariant: LandmarkModelVariant
  selectedModelUrl?: string
  selectedSizeLabel?: string
  variantCandidates: LandmarkOptimizedModelCandidate[]
  priority: string
  anchorId: string
  status: LandmarkInspectorStatus
  durationMs?: number
  error?: string
  loadCount: number
  unloadCount: number
  calibration: LandmarkCalibrationValues
  supportsFootprintMask: boolean
  companions: LandmarkCompanionItem[]
  hasSavedDraft: boolean
  isDirty: boolean
}

export type LandmarkModelInspector = {
  items: LandmarkInspectorItem[]
  activeCalibrationId?: string
  calibrationDraftCount: number
  usesLocalDraft: boolean
  startCalibration: (id: string) => void
  loadLandmark: (id: string, options?: LandmarkLoadOptions) => void
  unloadLandmark: (id: string) => void
  focusLandmark: (id: string) => void
  updateCalibration: (id: string, patch: Partial<LandmarkCalibrationValues>) => void
  updateFootprintMask: (id: string, patch: Partial<LandmarkFootprintMaskValues>) => void
  resetFootprintMask: (id: string) => void
  loadCompanionModel: (parentId: string, companionId: string) => void
  unloadCompanionModel: (parentId: string, companionId: string) => void
  focusCompanionModel: (parentId: string, companionId: string) => void
  updateCompanionCalibration: (
    parentId: string,
    companionId: string,
    patch: Partial<LandmarkCompanionCalibrationValues>
  ) => void
  saveCompanionCalibrationDraft: (parentId: string, companionId: string) => void
  resetCompanionCalibration: (parentId: string, companionId: string) => void
  getCompanionCalibrationPatch: (
    parentId: string,
    companionId: string
  ) => LandmarkCompanionCalibrationPatch | null
  setModelVariant: (id: string, variant: LandmarkModelVariant) => void
  saveCalibrationDraft: (id: string) => void
  resetCalibration: (id: string) => void
  clearAllCalibrationDrafts: () => void
  getCalibrationPatch: (id: string) => LandmarkCalibrationPatch | null
  getAllCalibrationPatches: () => LandmarkCalibrationPatch[]
}

export type LandmarkLoadOptions = {
  modelUrl?: string
  fileSizeLabel?: string
  runtimeLabel?: string
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

type LandmarkCompanionInspectorState = Record<
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
  layerManager?: LayerManager
  useLocalDrafts?: boolean
  map: any
  mapReady: boolean
  isMapCurrent?: (map: any) => boolean
  overlays: LingshanMapModelOverlay[]
  perfRecorder: Map3DPerfRecorder
  resolveLocation: (overlay: LingshanMapModelOverlay) => LatLngPoint | null
  onFocusLandmark?: (target: { id: string; overlay: LingshanMapModelOverlay; location: LatLngPoint }) => void
}

export function useLandmarkModelInspector({
  active,
  layerManager,
  useLocalDrafts = true,
  map,
  mapReady,
  isMapCurrent,
  overlays,
  perfRecorder,
  resolveLocation,
  onFocusLandmark
}: UseLandmarkModelInspectorOptions): LandmarkModelInspector {
  const modelsRef = useRef<Map<string, any>>(new Map())
  const companionModelsRef = useRef<Map<string, any>>(new Map())
  const loadedModelUrlsRef = useRef<Map<string, string>>(new Map())
  const footprintMaskLayerRef = useRef<any>(null)
  const versionsRef = useRef<Map<string, number>>(new Map())
  const companionVersionsRef = useRef<Map<string, number>>(new Map())
  const calibrationApplyTimersRef = useRef<Map<string, number>>(new Map())
  const companionCalibrationApplyTimersRef = useRef<Map<string, number>>(new Map())
  const overlayLookup = useMemo(() => buildOverlayLookup(overlays), [overlays])
  const [state, setState] = useState<LandmarkInspectorState>(() => buildInitialState(overlays))
  const [companionState, setCompanionState] = useState<LandmarkCompanionInspectorState>(() =>
    buildInitialCompanionState(overlays)
  )
  const [savedDrafts, setSavedDrafts] = useState<Record<string, LandmarkCalibrationDraft>>(() =>
    active && useLocalDrafts ? loadCalibrationDrafts() : {}
  )
  const [calibrationEdits, setCalibrationEdits] = useState<Record<string, LandmarkCalibrationValues>>(() =>
    buildInitialCalibrationEdits(overlays, active && useLocalDrafts ? loadCalibrationDrafts() : {})
  )
  const [companionCalibrationEdits, setCompanionCalibrationEdits] = useState<
    Record<string, LandmarkCompanionCalibrationValues>
  >(() => buildInitialCompanionCalibrationEdits(overlays, active && useLocalDrafts ? loadCalibrationDrafts() : {}))
  const [activeCalibrationId, setActiveCalibrationId] = useState<string | undefined>()
  const [selectedVariants, setSelectedVariants] = useState<Record<string, LandmarkModelVariant>>({})
  const canTouchRuntimeMap = () => Boolean(map && (isMapCurrent ? isMapCurrent(map) : true))
  const detachRuntimeModel = (layerName: string, model: any) => {
    if (!model) {
      return
    }
    const manager = layerManager
    if (manager && manager.getLayer(layerName) === model) {
      manager.removeLayer(layerName, model)
      return
    }
    clearLandmarkModel(model, canTouchRuntimeMap())
  }

  useEffect(() => {
    if (!active) {
      clearLandmarkModels(modelsRef.current, layerManager, getLandmarkModelLayerName, canTouchRuntimeMap())
      modelsRef.current = new Map()
      loadedModelUrlsRef.current = new Map()
      clearLandmarkModels(companionModelsRef.current, layerManager, getCompanionModelLayerName, canTouchRuntimeMap())
      companionModelsRef.current = new Map()
      clearFootprintMaskLayer(footprintMaskLayerRef)
      clearCalibrationTimers(calibrationApplyTimersRef.current)
      clearCalibrationTimers(companionCalibrationApplyTimersRef.current)
      return
    }

    const drafts = useLocalDrafts ? loadCalibrationDrafts() : {}
    setSavedDrafts(drafts)
    setCalibrationEdits(buildInitialCalibrationEdits(overlays, drafts))
    setCompanionCalibrationEdits(buildInitialCompanionCalibrationEdits(overlays, drafts))
    perfRecorder.setLandmarkTotal(overlays.length)
  }, [active, isMapCurrent, layerManager, map, overlays, perfRecorder, useLocalDrafts])

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
    setCompanionState((current) => {
      const next = { ...current }
      overlays.forEach((overlay) => {
        const parentId = getMapModelOverlayInspectorId(overlay)
        overlay.companionModels?.forEach((companion) => {
          const key = getCompanionKey(parentId, companion.id)
          if (!next[key]) {
            next[key] = {
              status: 'idle',
              loadCount: 0,
              unloadCount: 0
            }
          }
        })
      })
      return next
    })
    setCompanionCalibrationEdits((current) => {
      const next = { ...current }
      overlays.forEach((overlay) => {
        const parentId = getMapModelOverlayInspectorId(overlay)
        overlay.companionModels?.forEach((companion) => {
          const key = getCompanionKey(parentId, companion.id)
          if (!next[key]) {
            next[key] = mergeCompanionCalibration(
              buildDefaultCompanionCalibration(companion),
              savedDrafts[parentId]?.companions?.[companion.id]
            )
          }
        })
      })
      return next
    })
  }, [overlays, savedDrafts])

  useEffect(() => {
    if (!active || !activeCalibrationId) {
      clearFootprintMaskLayer(footprintMaskLayerRef, canTouchRuntimeMap())
      return
    }

    const overlay = overlayLookup.get(activeCalibrationId)
    const calibration = calibrationEdits[activeCalibrationId]
    const anchor = overlay ? resolveLocation(overlay) : null

    if (!overlay || !calibration || !anchor) {
      clearFootprintMaskLayer(footprintMaskLayerRef, canTouchRuntimeMap())
      return
    }

    applyFootprintMaskLayer({
      id: activeCalibrationId,
      active,
      map,
      mapReady,
      mapCurrent: canTouchRuntimeMap(),
      overlay,
      anchor,
      calibration,
      layerRef: footprintMaskLayerRef
    })
  }, [active, activeCalibrationId, calibrationEdits, isMapCurrent, map, mapReady, overlayLookup, resolveLocation])

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
      const canTouchMap = canTouchRuntimeMap()
      clearLandmarkModels(modelsRef.current, layerManager, getLandmarkModelLayerName, canTouchMap)
      modelsRef.current = new Map()
      loadedModelUrlsRef.current = new Map()
      clearLandmarkModels(companionModelsRef.current, layerManager, getCompanionModelLayerName, canTouchMap)
      companionModelsRef.current = new Map()
      clearFootprintMaskLayer(footprintMaskLayerRef, canTouchMap)
      clearCalibrationTimers(calibrationApplyTimersRef.current)
      clearCalibrationTimers(companionCalibrationApplyTimersRef.current)
    }
  }, [isMapCurrent, layerManager, map])

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
        const variantInfo = resolveVariantInfo(id, overlay, selectedVariants[id])
        const savedDraft = savedDrafts[id]
        const savedCalibration = savedDraft
          ? mergeCalibration(buildDefaultCalibration(overlay), savedDraft)
          : undefined
        const companions = (overlay.companionModels ?? []).map((companion) => {
          const key = getCompanionKey(id, companion.id)
          const itemState = companionState[key] ?? {
            status: 'idle',
            loadCount: 0,
            unloadCount: 0
          }
          const calibration =
            companionCalibrationEdits[key] ??
            mergeCompanionCalibration(buildDefaultCompanionCalibration(companion), savedDraft?.companions?.[companion.id])
          const savedCompanion = savedDraft?.companions?.[companion.id]
            ? mergeCompanionCalibration(buildDefaultCompanionCalibration(companion), savedDraft.companions[companion.id])
            : undefined

          return {
            parentLandmarkId: id,
            parentPoiId: overlay.poiId,
            id: companion.id,
            type: companion.type,
            name: companion.name,
            modelUrl: companion.modelUrl,
            fileSizeLabel: companion.fileSizeLabel,
            enabled: companion.enabled,
            note: companion.note,
            calibration,
            hasSavedDraft: Boolean(savedCompanion),
            isDirty: savedCompanion
              ? !areCompanionCalibrationValuesEqual(calibration, savedCompanion)
              : !areCompanionCalibrationValuesEqual(calibration, buildDefaultCompanionCalibration(companion)),
            ...itemState
          }
        })

        return {
          id,
          poiId: overlay.poiId,
          name: overlay.name,
          modelUrl: variantInfo.modelUrl,
          fileSizeLabel: variantInfo.sizeLabel,
          selectedVariant: variantInfo.variant,
          selectedModelUrl: variantInfo.modelUrl,
          selectedSizeLabel: variantInfo.sizeLabel,
          variantCandidates: variantInfo.candidates,
          priority: overlay.priority,
          anchorId: overlay.poiId,
          calibration,
          supportsFootprintMask: Boolean(overlay.footprintMask),
          companions,
          hasSavedDraft: Boolean(savedDraft),
          isDirty: savedCalibration
            ? !areCalibrationValuesEqual(calibration, savedCalibration)
            : !areCalibrationValuesEqual(calibration, buildDefaultCalibration(overlay)),
          ...itemState
        }
      }),
    [calibrationEdits, companionCalibrationEdits, companionState, overlays, savedDrafts, selectedVariants, state]
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

  const updateCompanionState = (
    key: string,
    updater: (current: LandmarkCompanionInspectorState[string]) => LandmarkCompanionInspectorState[string]
  ) => {
    setCompanionState((current) => {
      const previous = current[key] ?? {
        status: 'idle',
        loadCount: 0,
        unloadCount: 0
      }

      return {
        ...current,
        [key]: updater(previous)
      }
    })
  }

  const loadLandmark = (id: string, options?: LandmarkLoadOptions) => {
    const overlay = overlayLookup.get(id)
    const calibration = calibrationEdits[id] ?? (overlay ? buildDefaultCalibration(overlay) : undefined)
    void createLandmarkModel(id, { trackLoad: true, calibration, loadOptions: options })
  }

  const setModelVariant = (id: string, variant: LandmarkModelVariant) => {
    const overlay = overlayLookup.get(id)
    const variantInfo = overlay ? resolveVariantInfo(id, overlay, variant) : undefined

    if (!overlay || !variantInfo?.candidates.some((candidate) => candidate.variant === variant)) {
      return
    }

    const hadModel = modelsRef.current.has(id)
    const model = modelsRef.current.get(id)
    if (model) {
      detachRuntimeModel(getLandmarkModelLayerName(id), model)
      modelsRef.current.delete(id)
      loadedModelUrlsRef.current.delete(id)
    }

    versionsRef.current.set(id, (versionsRef.current.get(id) ?? 0) + 1)
    clearCalibrationTimer(calibrationApplyTimersRef.current, id)
    setSelectedVariants((current) => ({
      ...current,
      [id]: variant
    }))
    updateItemState(id, (current) => ({
      ...current,
      status: hadModel || current.status === 'loaded' || current.status === 'loading' ? 'unloaded' : current.status,
      error: undefined,
      durationMs: undefined
    }))
    if (hadModel) {
      perfRecorder.unloadLandmarkAsset(id)
    }
  }

  const unloadLandmark = (id: string) => {
    const model = modelsRef.current.get(id)

    if (model) {
      detachRuntimeModel(getLandmarkModelLayerName(id), model)
      modelsRef.current.delete(id)
      loadedModelUrlsRef.current.delete(id)
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

    if (!active || !mapReady || !window.TMap || !canTouchRuntimeMap() || !overlay || !anchor || !calibration) {
      return
    }

    const targetLocation = {
      lat: anchor.lat + calibration.latOffset,
      lng: anchor.lng + calibration.lngOffset
    }

    if (onFocusLandmark) {
      onFocusLandmark({ id, overlay, location: targetLocation })
      return
    }

    const center = new window.TMap.LatLng(targetLocation.lat, targetLocation.lng)

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

  const loadCompanionModel = async (parentId: string, companionId: string) => {
    const { overlay, companion, key } = resolveCompanion(parentId, companionId)

    if (!overlay || !companion || !key) {
      return
    }

    const calibration =
      companionCalibrationEdits[key] ??
      mergeCompanionCalibration(buildDefaultCompanionCalibration(companion), savedDrafts[parentId]?.companions?.[companionId])

    await createCompanionModel(parentId, companionId, {
      trackLoad: true,
      calibration
    })
  }

  const unloadCompanionModel = (parentId: string, companionId: string) => {
    const key = getCompanionKey(parentId, companionId)
    const model = companionModelsRef.current.get(key)

    if (model) {
      detachRuntimeModel(getCompanionModelLayerName(key), model)
      companionModelsRef.current.delete(key)
    }

    companionVersionsRef.current.set(key, (companionVersionsRef.current.get(key) ?? 0) + 1)
    clearCalibrationTimer(companionCalibrationApplyTimersRef.current, key)
    updateCompanionState(key, (current) => ({
      ...current,
      status: 'unloaded',
      unloadCount: current.unloadCount + 1
    }))
    perfRecorder.recordCompanionModelEvent({
      type: 'companionModelUnloaded',
      parentLandmarkId: parentId,
      companionId,
      status: 'unloaded'
    })
  }

  const focusCompanionModel = (parentId: string, companionId: string) => {
    const { overlay, companion, key } = resolveCompanion(parentId, companionId)
    const anchor = overlay ? resolveLocation(overlay) : null
    const calibration =
      key && companion
        ? companionCalibrationEdits[key] ??
          mergeCompanionCalibration(buildDefaultCompanionCalibration(companion), savedDrafts[parentId]?.companions?.[companionId])
        : undefined

    if (!active || !mapReady || !window.TMap || !canTouchRuntimeMap() || !overlay || !anchor || !calibration) {
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

  const updateCompanionCalibration = (
    parentId: string,
    companionId: string,
    patch: Partial<LandmarkCompanionCalibrationValues>
  ) => {
    const { companion, key } = resolveCompanion(parentId, companionId)

    if (!companion || !key) {
      return
    }

    setActiveCalibrationId(parentId)
    setCompanionCalibrationEdits((current) => {
      const previous =
        current[key] ??
        mergeCompanionCalibration(buildDefaultCompanionCalibration(companion), savedDrafts[parentId]?.companions?.[companionId])
      const next = normalizeCompanionCalibration({
        ...previous,
        ...patch
      })
      scheduleCompanionCalibrationApply(parentId, companionId, next)
      return {
        ...current,
        [key]: next
      }
    })
  }

  const saveCompanionCalibrationDraft = (parentId: string, companionId: string) => {
    const key = getCompanionKey(parentId, companionId)
    const values = companionCalibrationEdits[key]

    if (!values) {
      return
    }

    const nextDrafts = {
      ...savedDrafts,
      [parentId]: {
        ...(savedDrafts[parentId] ?? { updatedAt: new Date().toISOString() }),
        companions: {
          ...(savedDrafts[parentId]?.companions ?? {}),
          [companionId]: {
            ...values,
            updatedAt: new Date().toISOString()
          }
        },
        updatedAt: new Date().toISOString()
      }
    }
    setSavedDrafts(nextDrafts)
    saveCalibrationDrafts(nextDrafts)
    perfRecorder.recordCompanionModelEvent({
      type: 'companionModelCalibrationSaved',
      parentLandmarkId: parentId,
      companionId,
      status: 'loaded',
      ...values
    })
  }

  const resetCompanionCalibration = (parentId: string, companionId: string) => {
    const { companion, key } = resolveCompanion(parentId, companionId)

    if (!companion || !key) {
      return
    }

    const nextDrafts = { ...savedDrafts }
    const currentDraft = nextDrafts[parentId]
    if (currentDraft?.companions?.[companionId]) {
      const nextCompanions = { ...currentDraft.companions }
      delete nextCompanions[companionId]
      nextDrafts[parentId] = {
        ...currentDraft,
        companions: Object.keys(nextCompanions).length ? nextCompanions : undefined,
        updatedAt: new Date().toISOString()
      }
      setSavedDrafts(nextDrafts)
      saveCalibrationDrafts(nextDrafts)
    }

    const nextCalibration = buildDefaultCompanionCalibration(companion)
    setCompanionCalibrationEdits((current) => ({
      ...current,
      [key]: nextCalibration
    }))
    scheduleCompanionCalibrationApply(parentId, companionId, nextCalibration)
  }

  const getCompanionCalibrationPatch = (parentId: string, companionId: string) => {
    const key = getCompanionKey(parentId, companionId)
    const calibration = companionCalibrationEdits[key]

    if (!calibration) {
      return null
    }

    return {
      parentLandmarkId: parentId,
      id: companionId,
      ...calibration
    }
  }

  const getCompanionPatchesForLandmark = (parentId: string) => {
    const overlay = overlayLookup.get(parentId)
    const patches = (overlay?.companionModels ?? [])
      .map((companion) => getCompanionCalibrationPatch(parentId, companion.id))
      .filter((patch): patch is LandmarkCompanionCalibrationPatch => Boolean(patch))

    return patches.length ? patches : undefined
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
        companions: savedDrafts[id]?.companions,
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
    const existingCompanions = savedDrafts[id]?.companions
    if (existingCompanions && Object.keys(existingCompanions).length) {
      nextDrafts[id] = {
        companions: existingCompanions,
        updatedAt: new Date().toISOString()
      }
    }
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
    const nextCompanionEdits = buildInitialCompanionCalibrationEdits(overlays, {})
    setSavedDrafts({})
    saveCalibrationDrafts({})
    setCalibrationEdits(nextEdits)
    setCompanionCalibrationEdits(nextCompanionEdits)
    Object.entries(nextEdits).forEach(([id, calibration]) => {
      scheduleCalibrationApply(id, calibration)
    })
    Object.entries(nextCompanionEdits).forEach(([key, calibration]) => {
      const [parentId, companionId] = splitCompanionKey(key)
      scheduleCompanionCalibrationApply(parentId, companionId, calibration)
    })
  }

  const getCalibrationPatch = (id: string): LandmarkCalibrationPatch | null => {
    const calibration = calibrationEdits[id]

    if (!calibration) {
      return null
    }

    const companions = getCompanionPatchesForLandmark(id)

    return {
      id,
      ...calibration,
      ...(companions ? { companions } : {})
    }
  }

  const getAllCalibrationPatches = (): LandmarkCalibrationPatch[] =>
    Object.entries(savedDrafts)
      .map(([id]) => getCalibrationPatch(id))
      .filter((patch): patch is LandmarkCalibrationPatch => Boolean(patch))

  const createLandmarkModel = async (
    id: string,
    options: {
      trackLoad: boolean
      calibration?: LandmarkCalibrationValues
      loadOptions?: LandmarkLoadOptions
    }
  ) => {
    if (!active || !mapReady || !window.TMap || !canTouchRuntimeMap() || !window.TMap.model?.GLTFModel) {
      updateItemState(id, (current) => ({
        ...current,
        status: 'failed',
        error: '地图或 GLTFModel 尚未就绪'
      }))
      return false
    }

    const overlay = overlayLookup.get(id)
    const variantInfo = overlay ? resolveVariantInfo(id, overlay, selectedVariants[id]) : undefined
    const runtimeModelUrl = options.loadOptions?.modelUrl ?? variantInfo?.modelUrl
    const runtimeSizeLabel = options.loadOptions?.fileSizeLabel ?? variantInfo?.sizeLabel
    const runtimeVariantLabel = options.loadOptions?.runtimeLabel ?? variantInfo?.variant

    if (!overlay || !runtimeModelUrl || !variantInfo) {
      updateItemState(id, (current) => ({
        ...current,
        status: 'failed',
        error: '模型 URL 缺失'
      }))
      return false
    }

    const calibration = options.calibration ?? calibrationEdits[id] ?? mergeCalibration(buildDefaultCalibration(overlay), savedDrafts[id])
    const currentState = state[id]

    if (options.trackLoad && currentState?.status === 'loading') {
      return true
    }

    if (options.trackLoad && modelsRef.current.has(id) && loadedModelUrlsRef.current.get(id) === runtimeModelUrl) {
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
          modelUrl: runtimeModelUrl,
          anchorId: overlay.poiId,
          fileSizeLabel: runtimeSizeLabel,
          priority: overlay.priority,
          variant: variantInfo.variant,
          selectedModelUrl: runtimeModelUrl,
          selectedSizeLabel: runtimeSizeLabel ?? runtimeVariantLabel
        })
      }
      perfRecorder.failLandmarkAsset(id, 'POI / anchor 坐标缺失')
      return false
    }

    detachRuntimeModel(getLandmarkModelLayerName(id), modelsRef.current.get(id))
    modelsRef.current.delete(id)
    loadedModelUrlsRef.current.delete(id)

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
        modelUrl: runtimeModelUrl,
        anchorId: overlay.poiId,
        fileSizeLabel: runtimeSizeLabel,
        priority: overlay.priority,
        variant: variantInfo.variant,
        selectedModelUrl: runtimeModelUrl,
        selectedSizeLabel: runtimeSizeLabel ?? runtimeVariantLabel
      })

      const health = await inspectGlbModelUrl(runtimeModelUrl)
      if (versionsRef.current.get(id) !== version || !canTouchRuntimeMap()) {
        return false
      }
      if (!health.ok) {
        const durationMs = Math.round(performance.now() - startedAt)
        updateItemState(id, (current) => ({
          ...current,
          status: 'failed',
          durationMs,
          error: health.error
        }))
        perfRecorder.failLandmarkAsset(id, health.error)
        return false
      }
    }

    try {
      if (!canTouchRuntimeMap()) {
        return false
      }
      const model = new window.TMap.model.GLTFModel({
        id: `map-3d-guide-landmark-inspector-${id}`,
        map,
        url: runtimeModelUrl,
        position: toTMapPosition(anchor, calibration),
        rotation: toTMapRotation(overlay, calibration),
        scale: calibration.scale
      })

      modelsRef.current.set(id, model)
      loadedModelUrlsRef.current.set(id, runtimeModelUrl)
      if (layerManager && !layerManager.registerLayer(getLandmarkModelLayerName(id), model, map)) {
        clearLandmarkModel(model, canTouchRuntimeMap())
        return false
      }
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
          if (versionsRef.current.get(id) !== version || !canTouchRuntimeMap()) {
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

  const createCompanionModel = async (
    parentId: string,
    companionId: string,
    options: {
      trackLoad: boolean
      calibration?: LandmarkCompanionCalibrationValues
    }
  ) => {
    const { overlay, companion, key } = resolveCompanion(parentId, companionId)

    if (!key || !overlay || !companion) {
      return false
    }

    if (!active || !mapReady || !window.TMap || !canTouchRuntimeMap() || !window.TMap.model?.GLTFModel) {
      updateCompanionState(key, (current) => ({
        ...current,
        status: 'failed',
        error: '地图或 GLTFModel 尚未就绪'
      }))
      return false
    }

    const anchor = resolveLocation(overlay)

    if (!anchor) {
      updateCompanionState(key, (current) => ({
        ...current,
        status: 'failed',
        error: 'POI / anchor 坐标缺失',
        loadCount: options.trackLoad ? current.loadCount + 1 : current.loadCount
      }))
      perfRecorder.recordCompanionModelEvent({
        type: 'companionModelFailed',
        parentLandmarkId: parentId,
        companionId,
        modelUrl: companion.modelUrl,
        status: 'failed',
        error: 'POI / anchor 坐标缺失'
      })
      return false
    }

    const calibration =
      options.calibration ??
      companionCalibrationEdits[key] ??
      mergeCompanionCalibration(buildDefaultCompanionCalibration(companion), savedDrafts[parentId]?.companions?.[companionId])
    const currentState = companionState[key]

    if (options.trackLoad && (currentState?.status === 'loading' || companionModelsRef.current.has(key))) {
      return true
    }

    detachRuntimeModel(getCompanionModelLayerName(key), companionModelsRef.current.get(key))
    companionModelsRef.current.delete(key)

    const version = (companionVersionsRef.current.get(key) ?? 0) + 1
    companionVersionsRef.current.set(key, version)
    const startedAt = performance.now()

    updateCompanionState(key, (current) => ({
      ...current,
      status: 'loading',
      error: undefined,
      durationMs: undefined,
      loadCount: options.trackLoad ? current.loadCount + 1 : current.loadCount
    }))

    if (options.trackLoad) {
      perfRecorder.recordCompanionModelEvent({
        type: 'companionModelLoadStarted',
        parentLandmarkId: parentId,
        companionId,
        modelUrl: companion.modelUrl,
        status: 'loading',
        ...calibration
      })
    }

    if (options.trackLoad) {
      const exists = await modelUrlLooksAvailable(companion.modelUrl)
      if (!canTouchRuntimeMap() || companionVersionsRef.current.get(key) !== version) {
        return false
      }
      if (!exists) {
        const errorMessage = `底座模型文件缺失，待放入 ${companion.modelUrl.replace('/models/lingshan/optimized/', '')}`
        updateCompanionState(key, (current) => ({
          ...current,
          status: 'failed',
          durationMs: Math.round(performance.now() - startedAt),
          error: errorMessage
        }))
        perfRecorder.recordCompanionModelEvent({
          type: 'companionModelFailed',
          parentLandmarkId: parentId,
          companionId,
          modelUrl: companion.modelUrl,
          status: 'failed',
          durationMs: Math.round(performance.now() - startedAt),
          error: errorMessage,
          ...calibration
        })
        return false
      }

      const health = await inspectGlbModelUrl(companion.modelUrl)
      if (companionVersionsRef.current.get(key) !== version || !canTouchRuntimeMap()) {
        return false
      }
      if (!health.ok) {
        const durationMs = Math.round(performance.now() - startedAt)
        updateCompanionState(key, (current) => ({
          ...current,
          status: 'failed',
          durationMs,
          error: health.error
        }))
        perfRecorder.recordCompanionModelEvent({
          type: 'companionModelFailed',
          parentLandmarkId: parentId,
          companionId,
          modelUrl: companion.modelUrl,
          status: 'failed',
          durationMs,
          error: health.error,
          ...calibration
        })
        return false
      }
    }

    try {
      if (!canTouchRuntimeMap()) {
        return false
      }
      const model = new window.TMap.model.GLTFModel({
        id: `map-3d-guide-landmark-inspector-${parentId}-${companionId}`,
        map,
        url: companion.modelUrl,
        position: toTMapCompanionPosition(anchor, calibration),
        rotation: toTMapCompanionRotation(calibration),
        scale: calibration.scale
      })

      companionModelsRef.current.set(key, model)
      if (layerManager && !layerManager.registerLayer(getCompanionModelLayerName(key), model, map)) {
        clearLandmarkModel(model, canTouchRuntimeMap())
        return false
      }
      const durationMs = Math.round(performance.now() - startedAt)
      updateCompanionState(key, (current) => ({
        ...current,
        status: 'loaded',
        durationMs,
        error: undefined
      }))

      if (options.trackLoad) {
        perfRecorder.recordCompanionModelEvent({
          type: 'companionModelLoaded',
          parentLandmarkId: parentId,
          companionId,
          modelUrl: companion.modelUrl,
          status: 'loaded',
          durationMs,
          ...calibration
        })
      }

      if (typeof model.on === 'function') {
        model.on('error', (error: unknown) => {
          if (companionVersionsRef.current.get(key) !== version || !canTouchRuntimeMap()) {
            return
          }
          const errorMessage = normalizeError(error)
          updateCompanionState(key, (current) => ({
            ...current,
            status: 'failed',
            error: errorMessage
          }))
          perfRecorder.recordCompanionModelEvent({
            type: 'companionModelFailed',
            parentLandmarkId: parentId,
            companionId,
            modelUrl: companion.modelUrl,
            status: 'failed',
            error: errorMessage,
            ...calibration
          })
        })
      }
      return true
    } catch (error) {
      const errorMessage = normalizeError(error)
      updateCompanionState(key, (current) => ({
        ...current,
        status: 'failed',
        durationMs: Math.round(performance.now() - startedAt),
        error: errorMessage
      }))
      perfRecorder.recordCompanionModelEvent({
        type: 'companionModelFailed',
        parentLandmarkId: parentId,
        companionId,
        modelUrl: companion.modelUrl,
        status: 'failed',
        durationMs: Math.round(performance.now() - startedAt),
        error: errorMessage,
        ...calibration
      })
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

    void createLandmarkModel(id, {
      trackLoad: false,
      calibration
    })
  }

  const scheduleCompanionCalibrationApply = (
    parentId: string,
    companionId: string,
    calibration: LandmarkCompanionCalibrationValues
  ) => {
    const key = getCompanionKey(parentId, companionId)
    clearCalibrationTimer(companionCalibrationApplyTimersRef.current, key)
    const timer = window.setTimeout(() => {
      applyCompanionCalibrationToModel(parentId, companionId, calibration)
      companionCalibrationApplyTimersRef.current.delete(key)
    }, 300)
    companionCalibrationApplyTimersRef.current.set(key, timer)
  }

  const applyCompanionCalibrationToModel = (
    parentId: string,
    companionId: string,
    calibration: LandmarkCompanionCalibrationValues
  ) => {
    const { overlay, companion, key } = resolveCompanion(parentId, companionId)
    const model = key ? companionModelsRef.current.get(key) : undefined
    const anchor = overlay ? resolveLocation(overlay) : null

    if (!model || !overlay || !companion || !anchor || !window.TMap) {
      return
    }

    const canUpdateDirectly =
      typeof model.setScale === 'function' &&
      typeof model.setRotation === 'function' &&
      typeof model.setPosition === 'function'

    if (canUpdateDirectly) {
      try {
        model.setScale(calibration.scale)
        model.setRotation(toTMapCompanionRotation(calibration))
        model.setPosition(toTMapCompanionPosition(anchor, calibration))
        return
      } catch {
        // Fall back to rebuilding only this companion overlay.
      }
    }

    void createCompanionModel(parentId, companionId, {
      trackLoad: false,
      calibration
    })
  }

  const resolveCompanion = (parentId: string, companionId: string) => {
    const overlay = overlayLookup.get(parentId)
    const companion = overlay?.companionModels?.find((item) => item.id === companionId)
    const key = companion ? getCompanionKey(parentId, companion.id) : undefined

    return {
      overlay,
      companion,
      key
    }
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
    loadCompanionModel,
    unloadCompanionModel,
    focusCompanionModel,
    updateCompanionCalibration,
    saveCompanionCalibrationDraft,
    resetCompanionCalibration,
    getCompanionCalibrationPatch,
    setModelVariant,
    saveCalibrationDraft,
    resetCalibration,
    clearAllCalibrationDrafts,
    getCalibrationPatch,
    getAllCalibrationPatches
  }
}

function resolveVariantInfo(id: string, overlay: LingshanMapModelOverlay, selected?: LandmarkModelVariant) {
  const candidates = getLandmarkOptimizedModelCandidates(id)
  const fallbackRaw: LandmarkOptimizedModelCandidate = {
    variant: 'raw',
    modelUrl: overlay.modelUrl ?? '',
    sizeLabel: overlay.fileSizeLabel ?? 'size ?'
  }
  const allCandidates = candidates.length ? candidates : [fallbackRaw]
  const formalCandidate = allCandidates.find((candidate) => candidate.modelUrl === overlay.modelUrl)
  const variant = selected ?? formalCandidate?.variant ?? 'raw'
  const selectedCandidate = allCandidates.find((candidate) => candidate.variant === variant) ?? formalCandidate ?? allCandidates[0] ?? fallbackRaw

  return {
    variant: selectedCandidate.variant,
    modelUrl: selectedCandidate.modelUrl || overlay.modelUrl,
    sizeLabel: selectedCandidate.sizeLabel || overlay.fileSizeLabel,
    candidates: allCandidates
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

function buildInitialCompanionState(overlays: LingshanMapModelOverlay[]) {
  return overlays.reduce<LandmarkCompanionInspectorState>((result, overlay) => {
    const parentId = getMapModelOverlayInspectorId(overlay)
    overlay.companionModels?.forEach((companion) => {
      result[getCompanionKey(parentId, companion.id)] = {
        status: 'idle',
        loadCount: 0,
        unloadCount: 0
      }
    })
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

function buildInitialCompanionCalibrationEdits(
  overlays: LingshanMapModelOverlay[],
  drafts: Record<string, LandmarkCalibrationDraft>
) {
  return overlays.reduce<Record<string, LandmarkCompanionCalibrationValues>>((result, overlay) => {
    const parentId = getMapModelOverlayInspectorId(overlay)
    overlay.companionModels?.forEach((companion) => {
      result[getCompanionKey(parentId, companion.id)] = mergeCompanionCalibration(
        buildDefaultCompanionCalibration(companion),
        drafts[parentId]?.companions?.[companion.id]
      )
    })
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

function buildDefaultCompanionCalibration(companion: MapModelCompanionModel): LandmarkCompanionCalibrationValues {
  return normalizeCompanionCalibration({
    enabled: companion.enabled,
    scale: companion.scale,
    height: companion.height,
    rotationY: companion.rotationY,
    lngOffset: companion.lngOffset,
    latOffset: companion.latOffset
  })
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

function mergeCompanionCalibration(
  defaultValues: LandmarkCompanionCalibrationValues,
  draft?: LandmarkCompanionCalibrationDraft
): LandmarkCompanionCalibrationValues {
  return normalizeCompanionCalibration({
    enabled: draft?.enabled ?? defaultValues.enabled,
    scale: draft?.scale ?? defaultValues.scale,
    height: draft?.height ?? defaultValues.height,
    rotationY: draft?.rotationY ?? defaultValues.rotationY,
    lngOffset: draft?.lngOffset ?? defaultValues.lngOffset,
    latOffset: draft?.latOffset ?? defaultValues.latOffset
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

function normalizeCompanionCalibration(values: LandmarkCompanionCalibrationValues): LandmarkCompanionCalibrationValues {
  return {
    enabled: Boolean(values.enabled),
    scale: normalizeNumber(values.scale, 1),
    height: normalizeNumber(values.height, 0),
    rotationY: normalizeNumber(values.rotationY, 0),
    lngOffset: normalizeNumber(values.lngOffset, 0),
    latOffset: normalizeNumber(values.latOffset, 0)
  }
}

function normalizeNumber(value: number, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function areCompanionCalibrationValuesEqual(
  a: LandmarkCompanionCalibrationValues,
  b: LandmarkCompanionCalibrationValues
) {
  return (
    a.enabled === b.enabled &&
    a.scale === b.scale &&
    a.height === b.height &&
    a.rotationY === b.rotationY &&
    a.lngOffset === b.lngOffset &&
    a.latOffset === b.latOffset
  )
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

function toTMapCompanionPosition(anchor: LatLngPoint, calibration: LandmarkCompanionCalibrationValues) {
  return new window.TMap.LatLng(anchor.lat + calibration.latOffset, anchor.lng + calibration.lngOffset, calibration.height)
}

function toTMapCompanionRotation(calibration: LandmarkCompanionCalibrationValues): [number, number, number] {
  return [0, calibration.rotationY, 0]
}

function getCompanionKey(parentId: string, companionId: string) {
  return `${parentId}::${companionId}`
}

function splitCompanionKey(key: string): [string, string] {
  const [parentId, companionId] = key.split('::')
  return [parentId, companionId]
}

type GlbModelUrlHealth = { ok: true } | { ok: false; error: string }

const glbModelUrlHealthCache = new Map<string, Promise<GlbModelUrlHealth>>()

async function inspectGlbModelUrl(modelUrl: string): Promise<GlbModelUrlHealth> {
  if (!modelUrl.toLowerCase().endsWith('.glb')) {
    return { ok: true }
  }

  const cached = glbModelUrlHealthCache.get(modelUrl)
  if (cached) {
    return cached
  }

  const check = inspectGlbModelUrlUncached(modelUrl)
  glbModelUrlHealthCache.set(modelUrl, check)
  return check
}

async function inspectGlbModelUrlUncached(modelUrl: string): Promise<GlbModelUrlHealth> {
  try {
    const response = await fetch(modelUrl, {
      headers: {
        Range: 'bytes=0-255'
      }
    })

    if (response.status === 404) {
      return { ok: false, error: `模型文件缺失：${modelUrl}` }
    }
    if (!response.ok && response.status !== 206) {
      return { ok: true }
    }
    if (response.status !== 206) {
      const contentLength = Number(response.headers.get('content-length') ?? 0)
      if (!contentLength || contentLength > 1024) {
        return { ok: true }
      }
    }

    const bytes = new Uint8Array(await response.arrayBuffer())
    const headerText = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 96)))

    if (headerText.startsWith('version https://git-lfs.github.com/spec/v1')) {
      return { ok: false, error: `GLB appears to be Git LFS pointer: ${modelUrl}` }
    }
    if (!headerText.startsWith('glTF')) {
      return { ok: false, error: `GLB header invalid: ${modelUrl}` }
    }

    return { ok: true }
  } catch {
    return { ok: true }
  }
}

async function modelUrlLooksAvailable(modelUrl: string) {
  try {
    const response = await fetch(modelUrl, { method: 'HEAD' })
    if (response.status === 404) {
      return false
    }
    return response.ok || response.status === 405
  } catch {
    return true
  }
}

function applyFootprintMaskLayer(options: {
  id: string
  active: boolean
  map: any
  mapReady: boolean
  mapCurrent: boolean
  overlay: LingshanMapModelOverlay
  anchor: LatLngPoint
  calibration: LandmarkCalibrationValues
  layerRef: MutableRefObject<any>
}) {
  const { active, map, mapReady, mapCurrent, overlay, anchor, calibration, layerRef } = options
  const mask = calibration.footprintMask

  if (!active || !mapReady || !mapCurrent || !map || !window.TMap || !mask?.enabled) {
    clearFootprintMaskLayer(layerRef, mapCurrent)
    return
  }

  const geometries = buildFootprintMaskGeometries(options.id, anchor, calibration, mask)

  if (!geometries.length) {
    clearFootprintMaskLayer(layerRef, mapCurrent)
    return
  }

  if (!overlay.footprintMask || !window.TMap.MultiPolygon || !window.TMap.PolygonStyle) {
    clearFootprintMaskLayer(layerRef, mapCurrent)
    return
  }

  try {
    clearFootprintMaskLayer(layerRef, mapCurrent)
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
    clearFootprintMaskLayer(layerRef, mapCurrent)
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

function clearLandmarkModel(model: any, canTouchMap = true) {
  if (!canTouchMap) {
    return
  }

  try {
    model?.setMap?.(null)
  } catch {
    // Tencent model cleanup can throw after the map has already been destroyed.
  }

  try {
    model?.remove?.()
  } catch {
    // Best-effort cleanup.
  }

  try {
    model?.destroy?.()
  } catch {
    // Best-effort cleanup.
  }
}

function clearFootprintMaskLayer(layerRef: MutableRefObject<any>, canTouchMap = true) {
  const layer = layerRef.current
  if (canTouchMap) {
    try {
      layer?.setMap?.(null)
      layer?.remove?.()
      layer?.destroy?.()
    } catch {
      // A destroyed Tencent map owns its former footprint layer cleanup.
    }
  }
  layerRef.current = null
}

function clearLandmarkModels(
  models: Map<string, any>,
  layerManager?: LayerManager,
  getLayerName: (id: string) => string = getLandmarkModelLayerName,
  canTouchMap = true
) {
  models.forEach((model, id) => {
    if (layerManager) {
      layerManager.removeLayer(getLayerName(id), model)
    } else {
      clearLandmarkModel(model, canTouchMap)
    }
  })
}

function getLandmarkModelLayerName(id: string) {
  return `model_landmark:${id}`
}

function getCompanionModelLayerName(key: string) {
  return `model_landmark_companion:${key}`
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
