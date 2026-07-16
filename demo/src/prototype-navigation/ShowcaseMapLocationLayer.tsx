import { useEffect, useRef } from 'react'

import type { Gcj02Position, NavigationPrototypeMapRuntime } from './types'

function createShowcaseLocationIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="19" fill="rgba(36,107,253,.16)" stroke="rgba(36,107,253,.32)" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle cx="22" cy="22" r="10" fill="#246BFD" stroke="#fff" stroke-width="4"/>
    <circle cx="22" cy="22" r="3" fill="#fff"/>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

/**
 * Competition-only logical location marker. It never requests Geolocation and
 * receives GCJ-02 positions already owned by the scenic-route demo.
 */
export function ShowcaseMapLocationLayer({
  runtime,
  position
}: {
  runtime: NavigationPrototypeMapRuntime | null
  position?: Gcj02Position
}) {
  const layerRef = useRef<any>(null)

  useEffect(() => {
    layerRef.current?.setMap?.(null)
    layerRef.current = null

    if (!runtime || !position || !runtime.TMap?.MultiMarker || !runtime.TMap?.MarkerStyle) return undefined
    const { TMap, map } = runtime
    const layer = new TMap.MultiMarker({
      map,
      zIndex: 755,
      styles: {
        showcaseLogicalLocation: new TMap.MarkerStyle({
          width: 44,
          height: 44,
          anchor: { x: 22, y: 22 },
          src: createShowcaseLocationIcon()
        })
      },
      geometries: [{
        id: 'showcase-logical-location',
        styleId: 'showcaseLogicalLocation',
        position: new TMap.LatLng(position.lat, position.lng)
      }]
    })
    layer.setZIndex?.(755)
    layerRef.current = layer

    return () => {
      layer.setMap?.(null)
      if (layerRef.current === layer) layerRef.current = null
    }
  }, [position, runtime])

  return null
}

/** Preserves the current pitch/rotation and only recenters the existing map. */
export function focusShowcaseMapLocation(
  runtime: NavigationPrototypeMapRuntime | null,
  position: Gcj02Position
) {
  if (!runtime?.map || !runtime.TMap?.LatLng) return false
  try {
    const center = new runtime.TMap.LatLng(position.lat, position.lng)
    const currentZoom = Number(runtime.map.getZoom?.())
    const zoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, 18) : 18
    if (typeof runtime.map.easeTo === 'function') {
      runtime.map.easeTo({ center, zoom }, { duration: 520 })
    } else {
      runtime.map.setCenter?.(center)
      runtime.map.setZoom?.(zoom)
    }
    return true
  } catch {
    return false
  }
}
