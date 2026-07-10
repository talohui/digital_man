import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteStopByIndex, getScenicRouteById, getRouteStops } from '../data/lingshanScenicRoutes'
import { lingshanPoiDetails } from '../data/lingshanPoiDetails'
import {
  isPoiEntrySource,
  isPoiReturnStage,
  isScenicMapPresentation,
  parseRouteNavigationState,
  parseStopParam
} from '../types/mapGuide'
import type { GuideContext, ScenicRouteId } from './GuideMessageSchema'
import { isScenicRouteId } from './GuideMessageSchema'
import { useGuideSessionStore } from './useGuideSessionStore'

const basePath = '/map-3d-guide-c'

function buildContext(pathname: string, search: string): GuideContext | undefined {
  if (!pathname.startsWith(basePath)) return undefined
  const params = new URLSearchParams(search)
  const requestedPresentation = params.get('presentation')
  const presentation = isScenicMapPresentation(requestedPresentation) ? requestedPresentation : 'ink2d'
  const routeMatch = pathname.match(/^\/map-3d-guide-c\/route\/([^/]+)$/)
  if (routeMatch) {
    const rawRouteId = decodeURIComponent(routeMatch[1])
    if (!isScenicRouteId(rawRouteId)) return { page: 'browse', pathname, presentation, location: { available: false } }
    const routeId: ScenicRouteId = rawRouteId
    const route = getScenicRouteById(routeId)
    const stops = getRouteStops(routeId)
    const parsed = parseRouteNavigationState(params, stops.length)
    const currentIndex = parsed.stopIndex ?? parsed.joinStopIndex
    const current = currentIndex === undefined ? undefined : getRouteStopByIndex(routeId, currentIndex)
    const nextIndex = (parsed.routeStage === 'active' || parsed.routeStage === 'arrived') && parsed.stopIndex !== undefined && parsed.stopIndex + 1 < stops.length
      ? parsed.stopIndex + 1
      : undefined
    const next = nextIndex === undefined ? undefined : getRouteStopByIndex(routeId, nextIndex)
    return {
      page: 'route', pathname, presentation, routeId, routeName: route?.name,
      stage: ['preview', 'joining', 'active', 'arrived'].includes(parsed.routeStage)
        ? (parsed.routeStage as GuideContext['stage'])
        : 'preview',
      currentStopIndex: currentIndex,
      currentStopPoiId: current?.poiId,
      currentStopName: current?.name,
      nextStopIndex: nextIndex,
      nextStopPoiId: next?.poiId,
      nextStopName: next?.name,
      location: { available: false }
    }
  }

  const poiMatch = pathname.match(/^\/map-3d-guide-c\/poi\/([^/]+)$/)
  if (poiMatch) {
    const selectedPoiId = decodeURIComponent(poiMatch[1])
    const detail = lingshanPoiDetails.find((item) => item.id === selectedPoiId)
    const rawRouteId = params.get('routeId')
    const routeId = isScenicRouteId(rawRouteId) ? rawRouteId : undefined
    const source = params.get('from')
    const returnStage = params.get('returnStage')
    return {
      page: 'poi', pathname, presentation, routeId,
      routeName: routeId ? getScenicRouteById(routeId)?.name : undefined,
      selectedPoiId,
      selectedPoiName: detail?.name ?? selectedPoiId,
      poiSource: isPoiEntrySource(source) ? source : 'browse',
      poiReturnStage: isPoiReturnStage(returnStage) ? returnStage : undefined,
      poiReturnStopIndex: parseStopParam(params.get('returnStop'), routeId ? getRouteStops(routeId).length : undefined),
      location: { available: false }
    }
  }

  return { page: 'browse', pathname, presentation, location: { available: false } }
}

export default function GuideContextBridge() {
  const location = useLocation()
  const context = useMemo(() => buildContext(location.pathname, location.search), [location.pathname, location.search])
  const setContext = useGuideSessionStore((state) => state.setContext)
  const ensureSessionId = useGuideSessionStore((state) => state.ensureSessionId)

  useEffect(() => {
    if (!context) return
    ensureSessionId()
    setContext(context)

    const state = useGuideSessionStore.getState()
    if (
      context.page === 'route' &&
      context.stage === 'preview' &&
      context.routeId &&
      state.sourceRouteId === context.routeId &&
      !state.continuedRecommendationRouteIds.includes(context.routeId)
    ) {
      const route = getScenicRouteById(context.routeId)
      state.addMessage({
        role: 'assistant',
        text: `这就是我刚才为你推荐的${route?.name ?? '路线'}。你可以先浏览路线，准备好后我们就出发。`,
        status: 'complete'
      })
      useGuideSessionStore.setState((current) => ({
        continuedRecommendationRouteIds: [...current.continuedRecommendationRouteIds, context.routeId as ScenicRouteId]
      }))
    }
  }, [context, ensureSessionId, setContext])

  return null
}
