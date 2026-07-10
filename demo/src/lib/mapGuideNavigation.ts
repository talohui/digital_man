import type { NavigateFunction } from 'react-router-dom'

import { formatStopParam, type PoiEntrySource } from '../types/mapGuide'

const MAP_GUIDE_BASE_PATH = '/map-3d-guide-c'

function routePath(routeId: string, params?: URLSearchParams) {
  const query = params?.toString()
  return `${MAP_GUIDE_BASE_PATH}/route/${encodeURIComponent(routeId)}${query ? `?${query}` : ''}`
}

function poiPath(poiId: string, params?: URLSearchParams) {
  const query = params?.toString()
  return `${MAP_GUIDE_BASE_PATH}/poi/${encodeURIComponent(poiId)}${query ? `?${query}` : ''}`
}

export function goToMapBrowse(navigate: NavigateFunction) {
  navigate(MAP_GUIDE_BASE_PATH)
}

export function goToRoutePreview(navigate: NavigateFunction, routeId: string) {
  navigate(routePath(routeId))
}

export function goToRouteActive(navigate: NavigateFunction, routeId: string, stopIndex: number) {
  const params = new URLSearchParams({
    stage: 'active',
    stop: formatStopParam(stopIndex)
  })
  navigate(routePath(routeId, params))
}

export function goToRouteArrived(navigate: NavigateFunction, routeId: string, stopIndex: number) {
  const params = new URLSearchParams({
    stage: 'arrived',
    stop: formatStopParam(stopIndex)
  })
  navigate(routePath(routeId, params))
}

export function goToPoiFromBrowse(navigate: NavigateFunction, poiId: string) {
  const params = new URLSearchParams({ from: 'browse' })
  navigate(poiPath(poiId, params))
}

export function goToPoiFromRoute(navigate: NavigateFunction, poiId: string, routeId: string, stopIndex: number) {
  const params = new URLSearchParams({
    from: 'route',
    routeId,
    stop: formatStopParam(stopIndex)
  })
  navigate(poiPath(poiId, params))
}

export function goBackFromPoi(
  navigate: NavigateFunction,
  params: {
    from?: PoiEntrySource
    routeId?: string
    stopIndex?: number
  }
) {
  if (params.from === 'route' && params.routeId) {
    goToRouteArrived(navigate, params.routeId, params.stopIndex ?? 0)
    return
  }

  goToMapBrowse(navigate)
}

export function goContinueNextStop(navigate: NavigateFunction, routeId: string, nextStopIndex: number) {
  goToRouteActive(navigate, routeId, nextStopIndex)
}
