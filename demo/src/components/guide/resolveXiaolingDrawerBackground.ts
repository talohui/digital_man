import { getPoiMedia, getRouteMedia, type ScenicMediaEntry } from '../../data/scenicMediaCatalog'
import type { GuideContext } from '../../guide'

const DEFAULT_LINGSHAN_BACKGROUND = getRouteMedia('natural_scenery')

export function resolveXiaolingDrawerBackground(context: GuideContext): ScenicMediaEntry {
  if (context.page === 'poi') {
    return getPoiMedia(context.selectedPoiId)
  }

  if (context.page === 'route') {
    if (context.stage === 'preview') return getRouteMedia(context.routeId)
    if (context.stage === 'joining') return getPoiMedia(context.currentStopPoiId)
    if (context.stage === 'active') return getPoiMedia(context.nextStopPoiId ?? context.currentStopPoiId)
    if (context.stage === 'arrived') return getPoiMedia(context.currentStopPoiId)
    return getRouteMedia(context.routeId)
  }

  return DEFAULT_LINGSHAN_BACKGROUND
}
