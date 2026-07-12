import { useEffect, useRef } from 'react'

import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { isNavigationDebugEnabled } from './navigationDebug'
import type { Gcj02Position, NavigationPrototypeMapRuntime, Wgs84Position } from './types'

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function userLocationSvg(color: string, halo: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="16" fill="${halo}"/>
    <circle cx="20" cy="20" r="10" fill="${color}" stroke="#fff" stroke-width="4"/>
    <circle cx="20" cy="20" r="3" fill="#fff"/>
  </svg>`
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
  const markerLayerRef = useRef<any>(null)
  const debugLineLayerRef = useRef<any>(null)

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
          src: createSvgDataUrl(userLocationSvg('#246BFD', 'rgba(36,107,253,.22)'))
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
  }, [converted, locationSource, raw, runtime])

  return null
}
