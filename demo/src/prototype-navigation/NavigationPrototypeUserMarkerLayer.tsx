import { useEffect, useRef, useState } from 'react'

import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { Gcj02Position, NavigationPrototypeMapRuntime, Wgs84Position } from './types'

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

function toTMapGcj02LatLng(TMap: any, position: Gcj02Position) {
  return new TMap.LatLng(position.lat, position.lng)
}

/** Deliberately debug-only: it visualizes raw GPS in Tencent's map frame. */
function toTMapRawWgs84DebugLatLng(TMap: any, position: Wgs84Position) {
  return new TMap.LatLng(position.lat, position.lng)
}

export function NavigationPrototypeUserMarkerLayer({ runtime }: { runtime: NavigationPrototypeMapRuntime | null }) {
  const converted = useNavigationPrototypeStore((state) => state.convertedGcj02Position)
  const raw = useNavigationPrototypeStore((state) => state.rawWgs84Position)
  const locationSource = useNavigationPrototypeStore((state) => state.locationSource)
  const navigationStatus = useNavigationPrototypeStore((state) => state.status)
  const heading = useNavigationPrototypeStore((state) => state.heading)
  const [renderedHeading, setRenderedHeading] = useState<number | undefined>(undefined)
  const renderedHeadingRef = useRef<number | undefined>(undefined)
  const headingAnimationRef = useRef<number | null>(null)
  const markerLayerRef = useRef<any>(null)
  const debugLineLayerRef = useRef<any>(null)

  const headingVisible = heading?.selectedHeading !== undefined
    && ['locating', 'planning', 'navigating', 'paused', 'rerouting'].includes(navigationStatus)

  useEffect(() => {
    if (headingAnimationRef.current !== null) cancelAnimationFrame(headingAnimationRef.current)
    headingAnimationRef.current = null
    if (!headingVisible || heading?.selectedHeading === undefined) {
      renderedHeadingRef.current = undefined
      setRenderedHeading(undefined)
      return
    }
    const target = normalizeHeading(heading.selectedHeading)
    const start = renderedHeadingRef.current
    if (start === undefined) {
      renderedHeadingRef.current = target
      setRenderedHeading(target)
      return
    }
    const delta = shortestHeadingDelta(start, target)
    if (Math.abs(delta) < 1.5) return
    const startedAt = performance.now()
    const duration = locationSource === 'replay-gcj02' ? 140 : 220
    let lastPaintAt = 0
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      if (progress === 1 || now - lastPaintAt >= 32) {
        const next = normalizeHeading(start + delta * (1 - Math.pow(1 - progress, 2)))
        renderedHeadingRef.current = next
        setRenderedHeading(next)
        lastPaintAt = now
      }
      if (progress < 1) headingAnimationRef.current = requestAnimationFrame(animate)
      else headingAnimationRef.current = null
    }
    headingAnimationRef.current = requestAnimationFrame(animate)
    return () => {
      if (headingAnimationRef.current !== null) cancelAnimationFrame(headingAnimationRef.current)
      headingAnimationRef.current = null
    }
  }, [heading?.selectedHeading, headingVisible, locationSource])

  useEffect(() => {
    if (!isNavigationDebugEnabled()) return
    ;(window as any).__LINGSHAN_NAVIGATION_MAP_DEBUG__ = {
      ...(window as any).__LINGSHAN_NAVIGATION_MAP_DEBUG__,
      selectedHeading: heading?.selectedHeading,
      headingSource: heading?.source ?? 'unavailable',
      renderedHeading
    }
  }, [heading?.selectedHeading, heading?.source, renderedHeading])

  useEffect(() => {
    markerLayerRef.current?.setMap?.(null)
    debugLineLayerRef.current?.setMap?.(null)
    markerLayerRef.current = null
    debugLineLayerRef.current = null

    if (!runtime || !converted || !runtime.TMap?.MultiMarker || !runtime.TMap?.MarkerStyle) return undefined

    const { TMap, map } = runtime
    const showRawDebug = isNavigationDebugEnabled() && locationSource === 'geolocation' && Boolean(raw)
    const markerLayer = new TMap.MultiMarker({
      map,
      zIndex: 760,
      styles: {
        navigationPrototypeConverted: new TMap.MarkerStyle({
          width: 40,
          height: 40,
          anchor: { x: 20, y: 20 },
          src: createSvgDataUrl(userLocationSvg('#246BFD', 'rgba(36,107,253,.22)', headingVisible ? renderedHeading : undefined))
        }),
        navigationPrototypeRawDebug: new TMap.MarkerStyle({
          width: 34,
          height: 34,
          anchor: { x: 17, y: 17 },
          src: createSvgDataUrl(userLocationSvg('#D68A00', 'rgba(214,138,0,.22)'))
        })
      },
      geometries: [
        {
          id: 'navigation-prototype-user-location-gcj02',
          styleId: 'navigationPrototypeConverted',
          position: toTMapGcj02LatLng(TMap, converted)
        },
        ...(showRawDebug && raw ? [{
          id: 'navigation-prototype-user-location-wgs84-debug',
          styleId: 'navigationPrototypeRawDebug',
          position: toTMapRawWgs84DebugLatLng(TMap, raw)
        }] : [])
      ]
    })
    markerLayer.setZIndex?.(760)
    markerLayerRef.current = markerLayer

    if (showRawDebug && raw && TMap.MultiPolyline && TMap.PolylineStyle) {
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
          paths: [toTMapRawWgs84DebugLatLng(TMap, raw), toTMapGcj02LatLng(TMap, converted)]
        }]
      })
      debugLineLayer.setZIndex?.(759)
      debugLineLayerRef.current = debugLineLayer
    }

    return () => {
      markerLayer.setMap?.(null)
      debugLineLayerRef.current?.setMap?.(null)
      if (markerLayerRef.current === markerLayer) markerLayerRef.current = null
      debugLineLayerRef.current = null
    }
  }, [converted, headingVisible, locationSource, raw, renderedHeading, runtime])

  return null
}
