import { guideSpots } from './guideData'
import { lingshanPois } from './lingshanMapData'
import { resolveScenicPoiIdByName } from './scenicPoiCatalog'

const LEGACY_POI_ID_ALIASES: Record<string, string> = {
  jiulong_bath: 'jiulong_guanyu',
  jiulong_square: 'jiulong_guanyu',
  jiulong_guanyu_square: 'jiulong_guanyu',
  lingshan_screen_wall: 'lingshan_wall',
  dazhaobi: 'lingshan_wall',
  lingshan_dazhaobi: 'lingshan_wall',
  lingshan_fan_gong: 'fan_gong',
  fan_gong_palace: 'fan_gong',
  wuyin_tancheng_area: 'wuyin_tancheng',
  xiangfu_temple_area: 'xiangfu_temple',
  xiangfu_si: 'xiangfu_temple',
  giant_buddha_area: 'giant_buddha',
  manlong_flying_tower: 'manfeilong_tower'
}

export function resolveLegacyPoiId(legacyPoiId?: string | null) {
  const rawId = legacyPoiId?.trim()
  if (!rawId) return undefined
  const aliasedId = LEGACY_POI_ID_ALIASES[rawId] ?? rawId
  if (lingshanPois.some((poi) => poi.id === aliasedId)) return aliasedId

  const legacySpot = guideSpots.find((spot) => spot.id === rawId)
  return legacySpot ? resolveScenicPoiIdByName(legacySpot.name) : undefined
}
