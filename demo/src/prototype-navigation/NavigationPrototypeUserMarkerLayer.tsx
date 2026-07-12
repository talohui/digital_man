import { useEffect, useRef } from 'react'

import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import type { NavigationPrototypeMapRuntime } from './types'

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function userLocationSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="16" fill="rgba(36,107,253,.22)"/>
    <circle cx="20" cy="20" r="10" fill="#246BFD" stroke="#fff" stroke-width="4"/>
    <circle cx="20" cy="20" r="3" fill="#fff"/>
  </svg>`
}

export function NavigationPrototypeUserMarkerLayer({ runtime }: { runtime: NavigationPrototypeMapRuntime | null }) {
  const location = useNavigationPrototypeStore((state) => state.location)
  const layerRef = useRef<any>(null)

  useEffect(() => {
    layerRef.current?.setMap?.(null)
    layerRef.current = null

    if (!runtime || !location || !runtime.TMap?.MultiMarker || !runtime.TMap?.MarkerStyle) {
      return undefined
    }

    const { TMap, map } = runtime
    const layer = new TMap.MultiMarker({
      map,
      zIndex: 760,
      styles: {
        navigationPrototypeUser: new TMap.MarkerStyle({
          width: 40,
          height: 40,
          anchor: { x: 20, y: 20 },
          src: createSvgDataUrl(userLocationSvg())
        })
      },
      geometries: [
        {
          id: 'navigation-prototype-user-location',
          styleId: 'navigationPrototypeUser',
          position: new TMap.LatLng(location.lat, location.lng)
        }
      ]
    })
    layer.setZIndex?.(760)
    layerRef.current = layer

    return () => {
      layer.setMap?.(null)
      if (layerRef.current === layer) {
        layerRef.current = null
      }
    }
  }, [location, runtime])

  return null
}
