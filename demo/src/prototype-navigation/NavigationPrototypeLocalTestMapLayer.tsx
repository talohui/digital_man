import { useEffect, useMemo, useRef, useState } from 'react'

import { haversineDistanceMeters } from '../lib/routeProgress'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { Gcj02Position, LocalNavigationTestState, NavigationPrototypeMapRuntime } from './types'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'

type SavedCamera = {
  center: { lat: number; lng: number }
  zoom: number
  pitch: number
  rotation: number
}

function readCoordinate(value: any): Gcj02Position | undefined {
  const lat = typeof value?.getLat === 'function' ? value.getLat() : value?.lat
  const lng = typeof value?.getLng === 'function' ? value.getLng() : value?.lng
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng, coordinateSystem: 'GCJ-02' }
    : undefined
}

function readCamera(map: any): SavedCamera | undefined {
  const center = readCoordinate(map?.getCenter?.())
  if (!center) return undefined
  return {
    center,
    zoom: Number(map.getZoom?.() ?? 17),
    pitch: Number(map.getPitch?.() ?? 0),
    rotation: Number(map.getRotation?.() ?? 0)
  }
}

function temporaryTargetSvg() {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="42" height="48" viewBox="0 0 42 48">
    <path d="M21 2C10.5 2 3 10 3 20c0 13 18 26 18 26s18-13 18-26C39 10 31.5 2 21 2Z" fill="#D68A00" stroke="#fff" stroke-width="3"/>
    <circle cx="21" cy="20" r="7" fill="#fff"/>
  </svg>`)}`
}

export function NavigationPrototypeLocalTestMapLayer({
  runtime,
  onStateChange,
  onStarted,
  onTargetPreviewChange,
  enabled: enabledOverride,
  showControls = true,
  restoreCameraOnFinish = true
}: {
  runtime: NavigationPrototypeMapRuntime | null
  onStateChange?: (phase?: LocalNavigationTestState['phase']) => void
  onStarted?: () => void
  onTargetPreviewChange?: (preview?: {
    coordinate: Gcj02Position
    name: string
    distanceMeters?: number
  }) => void
  enabled?: boolean
  showControls?: boolean
  restoreCameraOnFinish?: boolean
}) {
  const localTest = useNavigationPrototypeStore((state) => state.localNavigationTest)
  const prepare = useNavigationPrototypeStore((state) => state.prepareLocalNavigationTest)
  const start = useNavigationPrototypeStore((state) => state.startLocalNavigationTest)
  const confirmTarget = useNavigationPrototypeStore((state) => state.setLocalNavigationTestTarget)
  const cancel = useNavigationPrototypeStore((state) => state.cancelLocalNavigationTest)
  const [selectedTarget, setSelectedTarget] = useState<{ coordinate: Gcj02Position; name: string } | undefined>()
  const savedCameraRef = useRef<SavedCamera | undefined>()
  const targetMarkerRef = useRef<any>(null)
  const selectionWasActiveRef = useRef(false)
  const previousPhaseRef = useRef(localTest?.phase)
  const enabled = enabledOverride ?? isNavigationDebugEnabled()
  const displayTarget = selectedTarget ?? localTest?.target
  const markerTarget = localTest?.phase === 'arrived' || localTest?.phase === 'error' ? undefined : displayTarget
  const distanceMeters = useMemo(() => {
    if (!localTest?.origin || !displayTarget) return undefined
    return Math.round(haversineDistanceMeters(localTest.origin, displayTarget.coordinate))
  }, [displayTarget, localTest?.origin])

  useEffect(() => {
    onStateChange?.(localTest?.phase)
  }, [localTest?.phase, onStateChange])

  useEffect(() => {
    onTargetPreviewChange?.(displayTarget
      ? { ...displayTarget, distanceMeters }
      : undefined)
  }, [displayTarget, distanceMeters, onTargetPreviewChange])

  useEffect(() => {
    const phase = localTest?.phase
    if ((phase === 'planning' || phase === 'navigating') && previousPhaseRef.current === 'awaiting-target') {
      onStarted?.()
    }
    previousPhaseRef.current = phase
  }, [localTest?.phase, onStarted])

  useEffect(() => {
    if (!enabled || !runtime || localTest?.phase !== 'awaiting-target' || !localTest.origin) return
    const { map, TMap } = runtime
    if (!savedCameraRef.current) savedCameraRef.current = readCamera(map)
    selectionWasActiveRef.current = true
    map.easeTo?.({
      center: new TMap.LatLng(localTest.origin.lat, localTest.origin.lng),
      zoom: savedCameraRef.current?.zoom ?? map.getZoom?.()
    }, { duration: 320 })

    const handleMapClick = (event: any) => {
      const coordinate = readCoordinate(event?.latLng ?? event?.position ?? event?.detail?.latLng)
      if (!coordinate) return
      const poi = event?.poi ?? event?.poiInfo ?? event?.detail?.poi ?? event?.detail?.poiInfo
      const name = poi?.name ?? poi?.title ?? poi?.properties?.title ?? '地图选点'
      setSelectedTarget({ coordinate, name })
    }
    map.on?.('click', handleMapClick)
    return () => map.off?.('click', handleMapClick)
  }, [enabled, localTest?.origin, localTest?.phase, runtime])

  useEffect(() => {
    targetMarkerRef.current?.setMap?.(null)
    targetMarkerRef.current = null
    if (!enabled || !runtime || !markerTarget || !runtime.TMap?.MultiMarker || !runtime.TMap?.MarkerStyle) return
    const marker = new runtime.TMap.MultiMarker({
      map: runtime.map,
      zIndex: 770,
      styles: {
        localNavigationTarget: new runtime.TMap.MarkerStyle({
          width: 42,
          height: 48,
          anchor: { x: 21, y: 46 },
          src: temporaryTargetSvg()
        })
      },
      geometries: [{
        id: 'local-navigation-test-target',
        styleId: 'localNavigationTarget',
        position: new runtime.TMap.LatLng(markerTarget.coordinate.lat, markerTarget.coordinate.lng)
      }]
    })
    marker.setZIndex?.(770)
    targetMarkerRef.current = marker
    return () => {
      marker.setMap?.(null)
      if (targetMarkerRef.current === marker) targetMarkerRef.current = null
    }
  }, [enabled, markerTarget, runtime])

  useEffect(() => {
    const shouldRestore = selectionWasActiveRef.current
      && (!localTest || localTest.phase === 'arrived' || localTest.phase === 'error')
    if (!shouldRestore) return
    if (!restoreCameraOnFinish) {
      savedCameraRef.current = undefined
      selectionWasActiveRef.current = false
      setSelectedTarget(undefined)
      return
    }
    if (!runtime || !savedCameraRef.current) return
    const camera = savedCameraRef.current
    runtime.map.easeTo?.({
      center: new runtime.TMap.LatLng(camera.center.lat, camera.center.lng),
      zoom: camera.zoom,
      pitch: camera.pitch,
      rotation: camera.rotation
    }, { duration: 320 })
    savedCameraRef.current = undefined
    selectionWasActiveRef.current = false
    setSelectedTarget(undefined)
  }, [localTest, restoreCameraOnFinish, runtime])

  useEffect(() => {
    if (!enabled || !isNavigationDebugEnabled()) return
    ;(window as any).__LINGSHAN_NAVIGATION_MAP_DEBUG__ = {
      ...(window as any).__LINGSHAN_NAVIGATION_MAP_DEBUG__,
      localTestSelectionActive: localTest?.phase === 'awaiting-target',
      selectedTargetCoordinate: displayTarget?.coordinate,
      selectedTargetName: displayTarget?.name,
      selectedTargetDistanceMeters: distanceMeters
    }
  }, [displayTarget, distanceMeters, enabled, localTest?.phase])

  useEffect(() => () => {
    targetMarkerRef.current?.setMap?.(null)
    const camera = savedCameraRef.current
    if (restoreCameraOnFinish && runtime && camera) {
      runtime.map.easeTo?.({
        center: new runtime.TMap.LatLng(camera.center.lat, camera.center.lng),
        zoom: camera.zoom,
        pitch: camera.pitch,
        rotation: camera.rotation
      }, { duration: 0 })
    }
  }, [restoreCameraOnFinish, runtime])

  if (!enabled || !showControls) return null

  return <section className="navigation-prototype-replay navigation-prototype-local-test">
    <strong className="navigation-prototype-local-test__title">测试步骤</strong>
    <div className="navigation-prototype-replay__controls">
      {!localTest ? <button type="button" onClick={prepare}>准备本地测试</button> : null}
      {localTest?.phase === 'permission-intro' ? <button type="button" onClick={start}>申请定位与方向权限</button> : null}
      {localTest?.phase === 'locating' ? <p>正在获取 GCJ-02 真实位置…</p> : null}
      {localTest?.phase === 'awaiting-target' ? <p>请在地图上选择终点，建议选择 200–500 米且包含转弯的位置。</p> : null}
      {displayTarget ? <small>
        终点：{displayTarget.name}<br />
        {displayTarget.coordinate.lat.toFixed(6)}, {displayTarget.coordinate.lng.toFixed(6)}<br />
        直线距离：{distanceMeters ?? '-'} 米
      </small> : null}
      <div className="navigation-prototype-replay__buttons">
        {localTest?.phase === 'awaiting-target' && selectedTarget
          ? <button type="button" onClick={() => confirmTarget(selectedTarget)}>开始真实步行测试</button>
          : null}
        {localTest?.phase === 'awaiting-target' && selectedTarget
          ? <button type="button" onClick={() => setSelectedTarget(undefined)}>重新选择</button>
          : null}
        {localTest ? <button type="button" onClick={cancel}>结束本地测试</button> : null}
      </div>
    </div>
  </section>
}
