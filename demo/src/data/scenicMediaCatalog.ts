export interface ScenicMediaEntry {
  cover: string
  thumbnail?: string
  gallery?: string[]
  drawerBackground?: string
  alt: string
  source?: 'c-app-existing' | 'map-existing' | 'fallback'
}

export const SCENIC_MEDIA_FALLBACK = '/assets/lingshan/poi/scenic-cover.svg'

export const SCENIC_MEDIA_POI_IDS = [
  'south_gate',
  'lingshan_wall',
  'shengjing_square',
  'fozu_tan',
  'jiulong_guanyu',
  'puti_avenue',
  'foshou_square',
  'xiangfu_temple',
  'xingtan_square',
  'foqian_square',
  'giant_buddha',
  'baizi_mile',
  'fan_gong',
  'fan_gong_square',
  'wuyin_tancheng',
  'manfeilong_tower',
  'lingshan_jingshe',
  'sansheng_hall',
  'exit'
] as const

export type PoiId = (typeof SCENIC_MEDIA_POI_IDS)[number]

export const SCENIC_MEDIA_ROUTE_IDS = [
  'historical_culture',
  'natural_scenery',
  'family'
] as const

export type ScenicMediaRouteId = (typeof SCENIC_MEDIA_ROUTE_IDS)[number]

function poiMedia(cover: string, alt: string, source: ScenicMediaEntry['source'] = 'c-app-existing'): ScenicMediaEntry {
  return { cover, thumbnail: cover, gallery: [cover], drawerBackground: cover, alt, source }
}

export const poiMediaCatalog: Record<PoiId, ScenicMediaEntry> = {
  south_gate: poiMedia('/scenic/spots/south-gate.jpg', '灵山胜境南门'),
  lingshan_wall: poiMedia('/scenic/spots/lingshan-wall.jpg', '灵山大照壁'),
  shengjing_square: poiMedia('/intro/splash/splash-05.webp', '胜境广场（通用景区图）', 'fallback'),
  fozu_tan: poiMedia('/scenic/spots/fozu-tan.jpg', '佛足坛'),
  jiulong_guanyu: poiMedia('/intro/splash/splash-04.webp', '九龙灌浴（通用景区图）', 'fallback'),
  puti_avenue: poiMedia('/scenic/spots/puti-avenue.jpg', '菩提大道'),
  foshou_square: poiMedia('/scenic/spots/foshou-square.jpg', '佛手广场'),
  xiangfu_temple: poiMedia('/scenic/spots/xiangfu-temple.jpg', '祥符禅寺'),
  xingtan_square: poiMedia('/scenic/spots/xingtan-square.jpg', '杏坛广场'),
  foqian_square: poiMedia('/scenic/spots/foqian-square.jpg', '佛前广场'),
  giant_buddha: poiMedia('/intro/splash/splash-03.webp', '灵山大佛（通用景区图）', 'fallback'),
  baizi_mile: poiMedia('/scenic/spots/baizi-mile.jpg', '百子戏弥勒'),
  fan_gong: poiMedia('/intro/splash/splash-01.webp', '灵山梵宫（通用景区图）', 'fallback'),
  fan_gong_square: poiMedia('/intro/splash/splash-01.webp', '梵宫广场（通用景区图）', 'fallback'),
  wuyin_tancheng: poiMedia('/scenic/spots/wuyin-tancheng.jpg', '五印坛城'),
  manfeilong_tower: poiMedia('/scenic/spots/manfeilong-tower.jpg', '曼飞龙塔'),
  lingshan_jingshe: poiMedia('/scenic/spots/lingshan-jingshe.jpg', '灵山精舍'),
  sansheng_hall: poiMedia('/scenic/spots/sansheng-hall.jpg', '三圣殿'),
  exit: poiMedia('/scenic/spots/exit.jpg', '灵山胜境出口')
}

export const routeMediaCatalog: Record<ScenicMediaRouteId, ScenicMediaEntry> = {
  historical_culture: poiMedia('/intro/splash/splash-01.webp', '历史文化爱好者路线'),
  natural_scenery: poiMedia('/intro/splash/splash-05.webp', '自然风光爱好者路线'),
  family: poiMedia('/intro/splash/splash-04.webp', '亲子家庭路线')
}

const poiAliases: Record<string, PoiId> = {
  jiulong_bath: 'jiulong_guanyu',
  jiulong_square: 'jiulong_guanyu',
  '九龙灌浴': 'jiulong_guanyu',
  '九龙灌浴广场': 'jiulong_guanyu',
  '梵宫': 'fan_gong',
  '灵山梵宫': 'fan_gong',
  lingshan_fan_gong: 'fan_gong',
  '曼飞龙塔': 'manfeilong_tower',
  '曼飞龙佛塔': 'manfeilong_tower',
  '曼龙飞塔': 'manfeilong_tower',
  manlong_flying_tower: 'manfeilong_tower'
}

const routeAliases: Record<string, ScenicMediaRouteId> = {
  '历史文化路线': 'historical_culture',
  'history-culture': 'historical_culture',
  prayer_meditation: 'natural_scenery',
  '祈福静心': 'natural_scenery',
  '祈福静心路线': 'natural_scenery',
  'pray-calm': 'natural_scenery',
  '精华打卡': 'historical_culture',
  '精华打卡路线': 'historical_culture',
  photo: 'historical_culture',
  '自然风光': 'natural_scenery',
  '自然风光路线': 'natural_scenery',
  '自然风光爱好者路线': 'natural_scenery',
  '亲子路线': 'family',
  '亲子轻游路线': 'family',
  '亲子游路线': 'family'
}

function normalizeMediaAlias(value: string) {
  return value.trim().replace(/[\s·•・，,。_－-]/g, '').toLowerCase()
}

const normalizedPoiAliases = new Map<string, PoiId>([
  ...SCENIC_MEDIA_POI_IDS.map((id) => [normalizeMediaAlias(id), id] as const),
  ...Object.entries(poiAliases).map(([alias, id]) => [normalizeMediaAlias(alias), id] as const)
])

const normalizedRouteAliases = new Map<string, ScenicMediaRouteId>([
  ...SCENIC_MEDIA_ROUTE_IDS.map((id) => [normalizeMediaAlias(id), id] as const),
  ...Object.entries(routeAliases).map(([alias, id]) => [normalizeMediaAlias(alias), id] as const)
])

export function resolvePoiMediaId(alias?: string | null): PoiId | undefined {
  return alias ? normalizedPoiAliases.get(normalizeMediaAlias(alias)) : undefined
}

export function resolveRouteMediaId(alias?: string | null): ScenicMediaRouteId | undefined {
  return alias ? normalizedRouteAliases.get(normalizeMediaAlias(alias)) : undefined
}

const fallbackMedia: ScenicMediaEntry = {
  cover: SCENIC_MEDIA_FALLBACK,
  thumbnail: SCENIC_MEDIA_FALLBACK,
  gallery: [SCENIC_MEDIA_FALLBACK],
  drawerBackground: SCENIC_MEDIA_FALLBACK,
  alt: '灵山胜境通用景区图',
  source: 'fallback'
}

export function getPoiMedia(poiId?: string | null): ScenicMediaEntry {
  const resolvedId = resolvePoiMediaId(poiId)
  return resolvedId ? poiMediaCatalog[resolvedId] : fallbackMedia
}

export function getRouteMedia(routeId?: string | null): ScenicMediaEntry {
  const resolvedId = resolveRouteMediaId(routeId)
  return resolvedId ? routeMediaCatalog[resolvedId] : fallbackMedia
}
