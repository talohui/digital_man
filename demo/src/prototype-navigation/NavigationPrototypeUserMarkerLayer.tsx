import { useEffect, useRef, useState } from 'react'

import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { Gcj02Position, NavigationPrototypeMapRuntime, Wgs84Position } from './types'

const REPLAY_POSITION_ANIMATION_MS = 90
const HEADING_STYLE_STEP_DEGREES = 10
const HEADING_SETTLE_DEGREES = 0.8

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function userLocationSvg(color: string, halo: string, heading?: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="16" fill="${halo}"/>
    ${heading === undefined ? '' : `<g transform="rotate(${heading} 20 20)">
      <path d="M20 2.5 27 16 20 12.8 13 16Z" fill="#1459D9" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
    </g>`}
    <circle cx="20" cy="20" r="10" fill="${color}" stroke="#fff" stroke-width="4"/>
    <circle cx="20" cy="20" r="3" fill="#fff"/>
  </svg>`
}

function normalizeHeading(value: number) {
  return (value % 360 + 360) % 360
}

function shortestHeadingDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180
}

function headingStyleId(heading?: number) {
  if (heading === undefined) return 'navigationPrototypeConverted'
  const snapped = Math.round(normalizeHeading(heading) / HEADING_STYLE_STEP_DEGREES)
    * HEADING_STYLE_STEP_DEGREES % 360
  return `navigationPrototypeHeading${snapped}`
}

function createMarkerStyles(TMap: any) {
  const styles: Record<string, any> = {
    navigationPrototypeConverted: new TMap.MarkerStyle({
      width: 40,
      height: 40,
      anchor: { x: 20, y: 20 },
      src: createSvgDataUrl(userLocationSvg('#246BFD', 'rgba(36,107,253,.22)'))
    }),
    navigationPrototypeRawDebug: new TMap.MarkerStyle({
      width: 34,
      height: 34,
      anchor: { x: 17, y: 17 },
      src: createSvgDataUrl(userLocationSvg('#D68A00', 'rgba(214,138,0,.22)'))
    })
  }
  for (let heading = 0; heading < 360; heading += HEADING_STYLE_STEP_DEGREES) {
    styles[`navigationPrototypeHeading${heading}`] = new TMap.MarkerStyle({
      width: 40,
      height: 40,
      anchor: { x: 20, y: 20 },
      src: createSvgDataUrl(userLocationSvg('#246BFD', 'rgba(36,107,253,.22)', heading))
    })
  }
  return styles
}

function toTMapGcj02LatLng(TMap: any, position: Gcj02Position) {
  return new TMap.LatLng(position.lat, position.lng)
}

/** Deliberately debug-only: it visualizes raw GPS in Tencent's map frame. */
function toTMapRawWgs84DebugLatLng(TMap: any, position: Wgs84Position) {
  return new TMap.LatLng(position.lat, position.lng)
}

function interpolatePosition(start: Gcj02Position, target: Gcj02Position, progress: number): Gcj02Position {
  return {
    lat: start.lat + (target.lat - start.lat) * progress,
    lng: start.lng + (target.lng - start.lng) * progress,
    coordinateSystem: 'GCJ-02'
  }
}

function buildMarkerGeometries(input: {
  TMap: any
  position: Gcj02Position
  heading?: number
  raw?: Wgs84Position
  showRawDebug: boolean
}) {
  return [
    {
      id: 'navigation-prototype-user-location-gcj02',
      styleId: headingStyleId(input.heading),
      position: toTMapGcj02LatLng(input.TMap, input.position)
    },
    ...(input.showRawDebug && input.raw ? [{
      id: 'navigation-prototype-user-location-wgs84-debug',
      styleId: 'navigationPrototypeRawDebug',
      position: toTMapRawWgs84DebugLatLng(input.TMap, input.raw)
    }] : [])
  ]
}

function updateMarkerGeometries(layer: any, geometries: any[], replace = false) {
  if (!layer) return
  if (!replace && typeof layer.updateGeometries === 'function') {
    layer.updateGeometries(geometries)
    return
  }
  if (typeof layer.setGeometries === 'function') {
    layer.setGeometries(geometries)
    return
  }
  if (typeof layer.updateGeometries === 'function') layer.updateGeometries(geometries)
}

export function NavigationPrototypeUserMarkerLayer({ runtime }: { runtime: NavigationPrototypeMapRuntime | null }) {
  const converted = useNavigationPrototypeStore((state) => state.convertedGcj02Position)
  const raw = useNavigationPrototypeStore((state) => state.rawWgs84Position)
  const locationSource = useNavigationPrototypeStore((state) => state.locationSource)
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const heading = useNavigationPrototypeStore((state) => state.heading)
  const [renderedHeading, setRenderedHeading] = useState<number | undefined>(undefined)
  const renderedHeadingRef = useRef<number | undefined>(undefined)
  const headingTargetRef = useRef<number | undefined>(undefined)
  const headingAnimationRef = useRef<number | null>(null)
  const lastHeadingPaintAtRef = useRef(0)
  const headingSmoothingRef = useRef(0.32)
  const renderedPositionRef = useRef<Gcj02Position | undefined>(undefined)
  const positionAnimationRef = useRef<number | null>(null)
  const markerLayerRef = useRef<any>(null)
  const debugLineLayerRef = useRef<any>(null)
  const hasConvertedPosition = Boolean(converted)
  const showRawDebug = isNavigationDebugEnabled()
    && locationSource === 'geolocation'
    && Boolean(raw)

  const headingVisible = heading?.selectedHeading !== undefined
    && ['locating', 'planning', 'navigating', 'paused', 'rerouting'].includes(navigationStatus)

  useEffect(() => {
    headingSmoothingRef.current = locationSource === 'replay-gcj02' ? 0.38 : 0.24
    if (!headingVisible || heading?.selectedHeading === undefined) {
      headingTargetRef.current = undefined
      renderedHeadingRef.current = undefined
      if (headingAnimationRef.current !== null) cancelAnimationFrame(headingAnimationRef.current)
      headingAnimationRef.current = null
      setRenderedHeading(undefined)
      return
    }

    const target = normalizeHeading(heading.selectedHeading)
    headingTargetRef.current = target
    if (renderedHeadingRef.current === undefined) {
      renderedHeadingRef.current = target
      setRenderedHeading(target)
      return
    }
    if (headingAnimationRef.current !== null) return

    const animate = (now: number) => {
      const current = renderedHeadingRef.current
      const latestTarget = headingTargetRef.current
      if (current === undefined || latestTarget === undefined) {
        headingAnimationRef.current = null
        return
      }
      const delta = shortestHeadingDelta(current, latestTarget)
      const settled = Math.abs(delta) <= HEADING_SETTLE_DEGREES
      const next = settled
        ? latestTarget
        : normalizeHeading(current + delta * headingSmoothingRef.current)
      renderedHeadingRef.current = next
      if (settled || now - lastHeadingPaintAtRef.current >= 32) {
        setRenderedHeading(next)
        lastHeadingPaintAtRef.current = now
      }
      if (settled) {
        headingAnimationRef.current = null
        return
      }
      headingAnimationRef.current = requestAnimationFrame(animate)
    }
    headingAnimationRef.current = requestAnimationFrame(animate)
  }, [heading?.selectedHeading, headingVisible, locationSource])

  useEffect(() => () => {
    if (headingAnimationRef.current !== null) cancelAnimationFrame(headingAnimationRef.current)
    if (positionAnimationRef.current !== null) cancelAnimationFrame(positionAnimationRef.current)
  }, [])

  useEffect(() => {
    if (!isNavigationDebugEnabled()) return
    ;(window as any).__LINGSHAN_NAVIGATION_MAP_DEBUG__ = {
      ...(window as any).__LINGSHAN_NAVIGATION_MAP_DEBUG__,
      selectedHeading: heading?.selectedHeading,
      headingSource: heading?.source ?? 'unavailable',
      renderedHeading
    }
  }, [heading?.selectedHeading, heading?.source, renderedHeading])

  // Marker styles and the MultiMarker instance are created once per map
  // runtime. Position and heading changes update geometries below instead of
  // detaching and recreating the layer on every replay frame.
  useEffect(() => {
    markerLayerRef.current?.setMap?.(null)
    markerLayerRef.current = null
    if (positionAnimationRef.current !== null) cancelAnimationFrame(positionAnimationRef.current)
    positionAnimationRef.current = null
    renderedPositionRef.current = converted

    if (!runtime || !converted || !runtime.TMap?.MultiMarker || !runtime.TMap?.MarkerStyle) return undefined

    const { TMap, map } = runtime
    const markerLayer = new TMap.MultiMarker({
      map,
      zIndex: 760,
      styles: createMarkerStyles(TMap),
      geometries: buildMarkerGeometries({
        TMap,
        position: converted,
        heading: headingVisible ? renderedHeadingRef.current : undefined,
        raw,
        showRawDebug
      })
    })
    markerLayer.setZIndex?.(760)
    markerLayerRef.current = markerLayer

    return () => {
      markerLayer.setMap?.(null)
      if (markerLayerRef.current === markerLayer) markerLayerRef.current = null
    }
    // `converted` is intentionally represented by the false -> true edge.
    // Subsequent fixes must update the existing layer, never recreate it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConvertedPosition, runtime])

  useEffect(() => {
    if (!runtime || !converted || !markerLayerRef.current) return undefined
    if (positionAnimationRef.current !== null) cancelAnimationFrame(positionAnimationRef.current)
    positionAnimationRef.current = null

    const target = { ...converted, coordinateSystem: 'GCJ-02' } satisfies Gcj02Position
    const start = renderedPositionRef.current ?? target
    const renderPosition = (position: Gcj02Position) => {
      renderedPositionRef.current = position
      updateMarkerGeometries(markerLayerRef.current, buildMarkerGeometries({
        TMap: runtime.TMap,
        position,
        heading: headingVisible ? renderedHeadingRef.current : undefined,
        raw,
        showRawDebug
      }))
    }

    if (locationSource !== 'replay-gcj02' || (start.lat === target.lat && start.lng === target.lng)) {
      renderPosition(target)
      return undefined
    }

    const startedAt = performance.now()
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / REPLAY_POSITION_ANIMATION_MS)
      renderPosition(interpolatePosition(start, target, progress))
      if (progress < 1) positionAnimationRef.current = requestAnimationFrame(animate)
      else positionAnimationRef.current = null
    }
    positionAnimationRef.current = requestAnimationFrame(animate)
    return () => {
      if (positionAnimationRef.current !== null) cancelAnimationFrame(positionAnimationRef.current)
      positionAnimationRef.current = null
    }
  }, [converted, headingVisible, locationSource, raw, runtime, showRawDebug])

  useEffect(() => {
    const position = renderedPositionRef.current
    if (!runtime || !position || !markerLayerRef.current) return
    updateMarkerGeometries(markerLayerRef.current, buildMarkerGeometries({
      TMap: runtime.TMap,
      position,
      heading: headingVisible ? renderedHeading : undefined,
      raw,
      showRawDebug
    }))
  }, [headingVisible, raw, renderedHeading, runtime, showRawDebug])

  // Adding/removing the optional raw WGS84 debug point needs a full geometry
  // replacement. It is separate from the high-frequency replay update path.
  useEffect(() => {
    const position = renderedPositionRef.current
    if (!runtime || !position || !markerLayerRef.current) return
    updateMarkerGeometries(markerLayerRef.current, buildMarkerGeometries({
      TMap: runtime.TMap,
      position,
      heading: headingVisible ? renderedHeadingRef.current : undefined,
      raw,
      showRawDebug
    }), true)
  }, [runtime, showRawDebug])

  useEffect(() => {
    debugLineLayerRef.current?.setMap?.(null)
    debugLineLayerRef.current = null
    const position = renderedPositionRef.current
    if (!showRawDebug || !runtime || !raw || !position || !runtime.TMap?.MultiPolyline || !runtime.TMap?.PolylineStyle) return undefined

    const { TMap, map } = runtime
    const debugLineLayer = new TMap.MultiPolyline({
      map,
      zIndex: 759,
      styles: {
        navigationPrototypeCoordinateOffset: new TMap.PolylineStyle({
          color: '#D68A00',
          width: 2,
          borderWidth: 0,
          lineCap: 'round'
        })
      },
      geometries: [{
        id: 'navigation-prototype-coordinate-offset-debug',
        styleId: 'navigationPrototypeCoordinateOffset',
        paths: [toTMapRawWgs84DebugLatLng(TMap, raw), toTMapGcj02LatLng(TMap, position)]
      }]
    })
    debugLineLayer.setZIndex?.(759)
    debugLineLayerRef.current = debugLineLayer

    return () => {
      debugLineLayer.setMap?.(null)
      if (debugLineLayerRef.current === debugLineLayer) debugLineLayerRef.current = null
    }
  }, [runtime, showRawDebug])

  useEffect(() => {
    const layer = debugLineLayerRef.current
    const position = renderedPositionRef.current
    if (!layer || !runtime || !raw || !position || !showRawDebug) return
    const geometries = [{
      id: 'navigation-prototype-coordinate-offset-debug',
      styleId: 'navigationPrototypeCoordinateOffset',
      paths: [toTMapRawWgs84DebugLatLng(runtime.TMap, raw), toTMapGcj02LatLng(runtime.TMap, position)]
    }]
    if (typeof layer.updateGeometries === 'function') layer.updateGeometries(geometries)
    else layer.setGeometries?.(geometries)
  }, [converted, raw, runtime, showRawDebug])

  return null
}
