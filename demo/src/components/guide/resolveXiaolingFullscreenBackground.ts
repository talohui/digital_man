import { getPoiMedia, SCENIC_MEDIA_FALLBACK } from '../../data/scenicMediaCatalog'
import type { XiaolingDrawerBackground } from './resolveXiaolingDrawerBackground'

export function resolveXiaolingFullscreenBackground(): XiaolingDrawerBackground {
  const media = getPoiMedia('fan_gong')
  const candidates = [
    media.drawerBackground,
    media.cover,
    media.gallery?.[0],
    SCENIC_MEDIA_FALLBACK
  ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)

  return {
    key: 'fullscreen:fan_gong',
    contextType: 'fullscreen',
    candidates,
    alt: media.alt
  }
}
