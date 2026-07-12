import { getScenicPoiCatalogItem } from './scenicPoiCatalog'

const LEGACY_POI_ID_ALIASES: Record<string, string> = {
  jiulong_bath: 'jiulong_guanyu',
  lingshan_screen_wall: 'lingshan_wall'
}

export function resolveLegacySpotId(spotId?: string | null) {
  if (!spotId) return undefined
  const candidate = LEGACY_POI_ID_ALIASES[spotId] ?? spotId
  return getScenicPoiCatalogItem(candidate) ? candidate : undefined
}
