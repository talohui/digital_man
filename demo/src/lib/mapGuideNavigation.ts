import type { NavigateFunction, NavigateOptions } from 'react-router-dom'

import {
  formatStopParam,
  isPoiReturnStage,
  isScenicMapPresentation,
  parseStopParam,
  type PoiEntrySource,
  type PoiReturnStage,
  type PoiRouteReturnContext,
  type ScenicMapPresentation
} from '../types/mapGuide'

const MAP_GUIDE_BASE_PATH = '/map-3d-guide-c'
const ROUTE_QUERY_KEYS = ['stage', 'stop', 'joinStop', 'from', 'routeId', 'returnStage', 'returnStop'] as const
const POI_QUERY_KEYS = ['stage', 'joinStop', 'from', 'routeId', 'stop', 'returnStage', 'returnStop'] as const

export type MapGuideNavigationOptions = Pick<NavigateOptions, 'replace' | 'state'>

export type PoiBackNavigationParams = {
  from?: PoiEntrySource
  routeId?: string
  /** POI stop, zero-based. Kept for callers using the legacy signature. */
  stopIndex?: number
  poiStopIndex?: number
  returnStage?: PoiReturnStage
  returnStopIndex?: number
  presentation?: ScenicMapPresentation
}

function getCurrentSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }

  return new URLSearchParams(window.location.search)
}

function getCurrentPathname(): string {
  return typeof window === 'undefined' ? MAP_GUIDE_BASE_PATH : window.location.pathname
}

function clearParams(params: URLSearchParams, keys: readonly string[]) {
  keys.forEach((key) => params.delete(key))
}

function applyPresentation(params: URLSearchParams, presentation?: ScenicMapPresentation) {
  if (presentation) {
    params.set('presentation', presentation)
    return
  }

  const currentPresentation = params.get('presentation')
  if (currentPresentation && !isScenicMapPresentation(currentPresentation)) {
    params.delete('presentation')
  }
}

function buildPath(pathname: string, params: URLSearchParams) {
  const query = params.toString()
  return `${pathname}${query ? `?${query}` : ''}`
}

function routePath(routeId: string, params: URLSearchParams) {
  return buildPath(`${MAP_GUIDE_BASE_PATH}/route/${encodeURIComponent(routeId)}`, params)
}

function poiPath(poiId: string, params: URLSearchParams) {
  return buildPath(`${MAP_GUIDE_BASE_PATH}/poi/${encodeURIComponent(poiId)}`, params)
}

function isSafeIdentifier(value: string | undefined): value is string {
  return Boolean(value?.trim())
}

function normaliseStopIndex(stopIndex: number | undefined): number {
  return Number.isInteger(stopIndex) && (stopIndex as number) >= 0 ? (stopIndex as number) : 0
}

function getLegacyPoiReturnContext(routeId: string, poiStopIndex: number | undefined, presentation?: ScenicMapPresentation): PoiRouteReturnContext {
  const currentParams = getCurrentSearchParams()
  const currentStage = currentParams.get('stage')
  const currentStopIndex = parseStopParam(currentParams.get('stop'))
  const returnStage: PoiReturnStage = isPoiReturnStage(currentStage) ? currentStage : 'preview'
  const returnStopIndex =
    returnStage === 'preview' ? undefined : returnStage === 'joining' ? parseStopParam(currentParams.get('joinStop')) : currentStopIndex

  return {
    routeId,
    poiStopIndex: normaliseStopIndex(poiStopIndex),
    returnStage,
    returnStopIndex: returnStopIndex ?? normaliseStopIndex(poiStopIndex),
    presentation
  }
}

function routeParams(presentation?: ScenicMapPresentation) {
  const params = getCurrentSearchParams()
  clearParams(params, ROUTE_QUERY_KEYS)
  applyPresentation(params, presentation)
  return params
}

function poiParams(presentation?: ScenicMapPresentation) {
  const params = getCurrentSearchParams()
  clearParams(params, POI_QUERY_KEYS)
  applyPresentation(params, presentation)
  return params
}

function navigateTo(navigate: NavigateFunction, target: string, options?: MapGuideNavigationOptions) {
  navigate(target, options)
}

/** Navigate to the free-browse map while retaining presentation and unrelated query values. */
export function goToMapBrowse(
  navigate: NavigateFunction,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
) {
  const params = getCurrentSearchParams()
  clearParams(params, ROUTE_QUERY_KEYS)
  applyPresentation(params, presentation)
  navigateTo(navigate, buildPath(MAP_GUIDE_BASE_PATH, params), options)
}

/** Route preview intentionally has no `stage` parameter. Use replace when switching previews in a route carousel. */
export function goToRoutePreview(
  navigate: NavigateFunction,
  routeId: string,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
) {
  if (!isSafeIdentifier(routeId)) {
    goToMapBrowse(navigate, presentation, options)
    return
  }

  navigateTo(navigate, routePath(routeId.trim(), routeParams(presentation)), options)
}

/** `joinStop` is one-based in the URL and zero-based at this API boundary. */
export function goToRouteJoining(
  navigate: NavigateFunction,
  routeId: string,
  joinStopIndex: number,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
) {
  if (!isSafeIdentifier(routeId)) {
    goToMapBrowse(navigate, presentation, options)
    return
  }

  const params = routeParams(presentation)
  params.set('stage', 'joining')
  params.set('joinStop', formatStopParam(normaliseStopIndex(joinStopIndex)))
  navigateTo(navigate, routePath(routeId.trim(), params), options)
}

/** `stop` is one-based in the URL and zero-based at this API boundary. */
export function goToRouteActive(
  navigate: NavigateFunction,
  routeId: string,
  stopIndex: number,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
) {
  if (!isSafeIdentifier(routeId)) {
    goToMapBrowse(navigate, presentation, options)
    return
  }

  const params = routeParams(presentation)
  params.set('stage', 'active')
  params.set('stop', formatStopParam(normaliseStopIndex(stopIndex)))
  navigateTo(navigate, routePath(routeId.trim(), params), options)
}

export function goToRouteArrived(
  navigate: NavigateFunction,
  routeId: string,
  stopIndex: number,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
) {
  if (!isSafeIdentifier(routeId)) {
    goToMapBrowse(navigate, presentation, options)
    return
  }

  const params = routeParams(presentation)
  params.set('stage', 'arrived')
  params.set('stop', formatStopParam(normaliseStopIndex(stopIndex)))
  navigateTo(navigate, routePath(routeId.trim(), params), options)
}

export function goToPoiFromBrowse(
  navigate: NavigateFunction,
  poiId: string,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
) {
  if (!isSafeIdentifier(poiId)) {
    goToMapBrowse(navigate, presentation, options)
    return
  }

  const params = poiParams(presentation)
  params.set('from', 'browse')
  navigateTo(navigate, poiPath(poiId.trim(), params), options)
}

/**
 * Preferred route-to-POI signature. `returnStage` and `returnStopIndex` say
 * exactly which route state the Back action must restore.
 */
export function goToPoiFromRoute(
  navigate: NavigateFunction,
  poiId: string,
  context: PoiRouteReturnContext,
  options?: MapGuideNavigationOptions
): void
/** Legacy positional signature, retained until all map overlays move to the context form. */
export function goToPoiFromRoute(
  navigate: NavigateFunction,
  poiId: string,
  routeId: string,
  poiStopIndex: number,
  returnStage?: PoiReturnStage,
  returnStopIndex?: number,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
): void
export function goToPoiFromRoute(
  navigate: NavigateFunction,
  poiId: string,
  contextOrRouteId: PoiRouteReturnContext | string,
  legacyPoiStopIndexOrOptions?: number | MapGuideNavigationOptions,
  legacyReturnStage: PoiReturnStage = 'arrived',
  legacyReturnStopIndex?: number,
  legacyPresentation?: ScenicMapPresentation,
  legacyOptions?: MapGuideNavigationOptions
) {
  if (!isSafeIdentifier(poiId)) {
    goToMapBrowse(navigate)
    return
  }

  const context: PoiRouteReturnContext =
    typeof contextOrRouteId === 'string'
      ? legacyReturnStage === 'arrived' && legacyReturnStopIndex === undefined
        ? getLegacyPoiReturnContext(contextOrRouteId, legacyPoiStopIndexOrOptions as number | undefined, legacyPresentation)
        : {
            routeId: contextOrRouteId,
            poiStopIndex: normaliseStopIndex(legacyPoiStopIndexOrOptions as number | undefined),
            returnStage: isPoiReturnStage(legacyReturnStage) ? legacyReturnStage : 'arrived',
            returnStopIndex: normaliseStopIndex(legacyReturnStopIndex ?? (legacyPoiStopIndexOrOptions as number | undefined)),
            presentation: legacyPresentation
          }
      : contextOrRouteId
  const options =
    typeof contextOrRouteId === 'string' ? legacyOptions : (legacyPoiStopIndexOrOptions as MapGuideNavigationOptions | undefined)

  if (!isSafeIdentifier(context.routeId)) {
    goToMapBrowse(navigate, context.presentation, options)
    return
  }

  const params = poiParams(context.presentation)
  params.set('from', 'route')
  params.set('routeId', context.routeId.trim())
  if (context.poiStopIndex !== undefined) {
    params.set('stop', formatStopParam(normaliseStopIndex(context.poiStopIndex)))
  }
  params.set('returnStage', isPoiReturnStage(context.returnStage) ? context.returnStage : 'preview')
  if (context.returnStopIndex !== undefined) {
    params.set('returnStop', formatStopParam(normaliseStopIndex(context.returnStopIndex)))
  }
  navigateTo(navigate, poiPath(poiId.trim(), params), options)
}

/** Restore the precise state encoded by a route-origin POI URL. */
export function goBackFromPoi(navigate: NavigateFunction, params: PoiBackNavigationParams) {
  if (params.from !== 'route' || !isSafeIdentifier(params.routeId)) {
    goToMapBrowse(navigate, params.presentation)
    return
  }

  const urlParams = getCurrentSearchParams()
  const urlReturnStage = urlParams.get('returnStage')
  const returnStage = isPoiReturnStage(params.returnStage)
    ? params.returnStage
    : isPoiReturnStage(urlReturnStage)
      ? urlReturnStage
      : 'arrived'
  const returnStopIndex = params.returnStopIndex ?? parseStopParam(urlParams.get('returnStop'))
  const fallbackStopIndex = params.poiStopIndex ?? params.stopIndex

  if (returnStage === 'preview') {
    goToRoutePreview(navigate, params.routeId, params.presentation)
    return
  }

  const stopIndex = returnStopIndex ?? fallbackStopIndex
  if (stopIndex === undefined) {
    goToRoutePreview(navigate, params.routeId, params.presentation)
    return
  }

  if (returnStage === 'joining') {
    goToRouteJoining(navigate, params.routeId, stopIndex, params.presentation)
    return
  }

  if (returnStage === 'active') {
    goToRouteActive(navigate, params.routeId, stopIndex, params.presentation)
    return
  }

  goToRouteArrived(navigate, params.routeId, stopIndex, params.presentation)
}

/** Continue after an arrived stop. The next stop becomes active, never arrived. */
export function goContinueNextStop(
  navigate: NavigateFunction,
  routeId: string,
  nextStopIndex: number,
  presentation?: ScenicMapPresentation,
  options?: MapGuideNavigationOptions
) {
  goToRouteActive(navigate, routeId, nextStopIndex, presentation, options)
}

/** Updates only presentation, preserving pathname and every existing query parameter. */
export function setMapPresentation(
  navigate: NavigateFunction,
  presentation: ScenicMapPresentation,
  options: MapGuideNavigationOptions = { replace: true }
) {
  const params = getCurrentSearchParams()
  if (isScenicMapPresentation(presentation)) {
    params.set('presentation', presentation)
  }
  navigateTo(navigate, buildPath(getCurrentPathname(), params), options)
}

export function toggleMapPresentation(navigate: NavigateFunction, options?: MapGuideNavigationOptions) {
  const currentPresentation = getCurrentSearchParams().get('presentation')
  const nextPresentation = currentPresentation === 'scenic3d' ? 'ink2d' : 'scenic3d'
  setMapPresentation(navigate, nextPresentation, options ?? { replace: true })
}
