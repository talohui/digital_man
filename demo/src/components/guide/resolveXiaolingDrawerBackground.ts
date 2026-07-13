import {
  getPoiMedia,
  getRouteMedia,
  SCENIC_MEDIA_FALLBACK,
  type ScenicMediaEntry
} from '../../data/scenicMediaCatalog'
import type { GuideContext } from '../../guide'

const DEFAULT_LINGSHAN_BACKGROUND = getRouteMedia('natural_scenery')

export type XiaolingDrawerBackground = {
  key: string
  contextType: 'browse' | 'route-preview' | 'route-joining' | 'route-active' | 'route-arrived' | 'poi' | 'fullscreen'
  candidates: string[]
  alt: string
}

function mediaCandidates(media: ScenicMediaEntry) {
  const contextualCandidates = [media.drawerBackground, media.cover, media.gallery?.[0]]
    .filter((value): value is string => Boolean(value) && value !== SCENIC_MEDIA_FALLBACK)
  return [
    ...contextualCandidates,
    DEFAULT_LINGSHAN_BACKGROUND.drawerBackground,
    DEFAULT_LINGSHAN_BACKGROUND.cover,
    DEFAULT_LINGSHAN_BACKGROUND.gallery?.[0],
    SCENIC_MEDIA_FALLBACK
  ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
}

function createBackground(
  key: string,
  contextType: XiaolingDrawerBackground['contextType'],
  media: ScenicMediaEntry
): XiaolingDrawerBackground {
  return { key, contextType, candidates: mediaCandidates(media), alt: media.alt }
}

export function resolveXiaolingDrawerBackground(context: GuideContext): XiaolingDrawerBackground {
  if (context.page === 'poi') {
    return createBackground(`poi:${context.selectedPoiId ?? 'unknown'}`, 'poi', getPoiMedia(context.selectedPoiId))
  }

  if (context.page === 'route') {
    const routeId = context.routeId ?? 'unknown'
    if (context.stage === 'joining') {
      const poiId = context.currentStopPoiId ?? 'unknown'
      return createBackground(`route:${routeId}:joining:${poiId}`, 'route-joining', getPoiMedia(context.currentStopPoiId))
    }
    if (context.stage === 'active') {
      const poiId = context.nextStopPoiId ?? context.currentStopPoiId ?? 'unknown'
      return createBackground(`route:${routeId}:active:${poiId}`, 'route-active', getPoiMedia(poiId))
    }
    if (context.stage === 'arrived') {
      const poiId = context.currentStopPoiId ?? 'unknown'
      return createBackground(`route:${routeId}:arrived:${poiId}`, 'route-arrived', getPoiMedia(context.currentStopPoiId))
    }
    return createBackground(`route:${routeId}:preview`, 'route-preview', getRouteMedia(context.routeId))
  }

  return createBackground('browse:lingshan', 'browse', DEFAULT_LINGSHAN_BACKGROUND)
}
