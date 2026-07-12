import { useEffect, useRef } from 'react'

import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import type { NavigationPrototypeMapRuntime } from './types'

export function NavigationPrototypeMapLayer({ runtime }: { runtime: NavigationPrototypeMapRuntime | null }) {
  const route = useNavigationPrototypeStore((state) => state.route)
  const status = useNavigationPrototypeStore((state) => state.status)
  const layerRef = useRef<any>(null)

  useEffect(() => {
    layerRef.current?.setMap?.(null)
    layerRef.current = null

    if (!runtime || !route || (status !== 'locating' && status !== 'navigating' && status !== 'arrived')) {
      return undefined
    }

    const { TMap, map } = runtime
    if (!TMap?.MultiPolyline || !TMap?.PolylineStyle || !map || route.polyline.length < 2) {
      return undefined
    }

    const layer = new TMap.MultiPolyline({
      map,
      // Keep the prototype route visibly independent from the existing scenic
      // route geometry without changing that route's own layer or styles.
      zIndex: 650,
      styles: {
        navigationPrototypeHalo: new TMap.PolylineStyle({
          color: 'rgba(33, 92, 255, 0.28)',
          width: 15,
          borderWidth: 0,
          lineCap: 'round'
        }),
        navigationPrototype: new TMap.PolylineStyle({
          color: '#246BFD',
          width: 7,
          borderWidth: 1,
          borderColor: '#FFFFFF',
          lineCap: 'round'
        })
      },
      geometries: [
        {
          id: 'navigation-prototype-halo',
          styleId: 'navigationPrototypeHalo',
          paths: route.polyline.map((point) => new TMap.LatLng(point.lat, point.lng))
        },
        {
          id: 'navigation-prototype-line',
          styleId: 'navigationPrototype',
          paths: route.polyline.map((point) => new TMap.LatLng(point.lat, point.lng))
        }
      ]
    })

    layer.setZIndex?.(650)

    layerRef.current = layer

    return () => {
      layer.setMap?.(null)
      if (layerRef.current === layer) {
        layerRef.current = null
      }
    }
  }, [route, runtime, status])

  return null
}
