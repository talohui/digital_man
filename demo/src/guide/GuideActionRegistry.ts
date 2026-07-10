import type { NavigateFunction } from 'react-router-dom'
import { lingshanPois } from '../data/lingshanMapData'
import {
  goContinueNextStop,
  goToPoiFromBrowse,
  goToPoiFromRoute,
  goToRouteJoining,
  goToRoutePreview
} from '../lib/mapGuideNavigation'
import type { ScenicMapPresentation } from '../types/mapGuide'
import { isScenicRouteId, type GuideContext, type ScenicRouteId } from './GuideMessageSchema'
import { useGuideSessionStore } from './useGuideSessionStore'

export type GuideAction =
  | { type: 'open_route_preview'; routeId: ScenicRouteId }
  | { type: 'open_poi_detail'; poiId: string }
  | { type: 'start_route'; routeId: ScenicRouteId; joinStopIndex?: number }
  | { type: 'start_navigation'; targetType: 'poi' | 'route_stop'; targetId: string }
  | { type: 'continue_to_next_stop'; routeId: ScenicRouteId; currentStopIndex: number }
  | { type: 'show_route_overview'; routeId: ScenicRouteId }

export type GuideActionDependencies = {
  navigate: NavigateFunction
  presentation?: ScenicMapPresentation
  context?: GuideContext
  onShowRouteOverview?: (routeId: ScenicRouteId) => void
  onNavigationRequested?: (targetType: 'poi' | 'route_stop', targetId: string) => void
}

export type GuideActionResult = { ok: true } | { ok: false; reason: string }

function isKnownPoi(poiId: string) {
  return lingshanPois.some((poi) => poi.id === poiId)
}

export function executeGuideAction(action: GuideAction, dependencies: GuideActionDependencies): GuideActionResult {
  const { navigate, presentation } = dependencies
  if ('routeId' in action && !isScenicRouteId(action.routeId)) return { ok: false, reason: 'unknown-route' }

  switch (action.type) {
    case 'open_route_preview':
      useGuideSessionStore.getState().markRecommendedRouteOpened(action.routeId)
      goToRoutePreview(navigate, action.routeId, presentation)
      return { ok: true }
    case 'open_poi_detail':
      if (!isKnownPoi(action.poiId)) return { ok: false, reason: 'unknown-poi' }
      if (dependencies.context?.page === 'route' && dependencies.context.routeId) {
        const context = dependencies.context
        const routeId = context.routeId as ScenicRouteId
        const poiStopIndex = context.nextStopPoiId === action.poiId
          ? context.nextStopIndex
          : context.currentStopIndex
        goToPoiFromRoute(navigate, action.poiId, {
          routeId,
          poiStopIndex,
          returnStage: context.stage ?? 'preview',
          returnStopIndex: context.currentStopIndex,
          presentation
        })
      } else {
        goToPoiFromBrowse(navigate, action.poiId, presentation)
      }
      return { ok: true }
    case 'start_route':
      goToRouteJoining(navigate, action.routeId, action.joinStopIndex ?? 0, presentation)
      return { ok: true }
    case 'start_navigation':
      if (action.targetType === 'poi' && !isKnownPoi(action.targetId)) return { ok: false, reason: 'unknown-poi' }
      if (!dependencies.onNavigationRequested) return { ok: false, reason: 'navigation-not-implemented' }
      dependencies.onNavigationRequested(action.targetType, action.targetId)
      return { ok: true }
    case 'continue_to_next_stop':
      goContinueNextStop(navigate, action.routeId, action.currentStopIndex + 1, presentation)
      return { ok: true }
    case 'show_route_overview':
      if (!dependencies.onShowRouteOverview) return { ok: false, reason: 'overview-not-implemented' }
      dependencies.onShowRouteOverview(action.routeId)
      return { ok: true }
  }
}
