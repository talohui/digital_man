import { LINGSHAN_INK_MAP_BOUNDS } from '../data/lingshanInkMapBounds'
import {
  getScenicPoiCatalogItem,
  normalizeScenicPoiName,
  type ScenicPoiCatalogItem
} from '../data/scenicPoiCatalog'

export type TencentPoiCoordinateCandidate = {
  id: string
  title: string
  address?: string
  category?: string
  lat: number
  lng: number
  score: number
  match: 'exact' | 'alias' | 'partial' | 'weak'
}

const cachePrefix = 'lingshan-poi-coordinate-search:'

function getCandidateLocation(candidate: any) {
  const location = candidate?.location
  const lat = typeof location?.getLat === 'function' ? Number(location.getLat()) : Number(location?.lat)
  const lng = typeof location?.getLng === 'function' ? Number(location.getLng()) : Number(location?.lng)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined
}

function scoreCandidate(item: ScenicPoiCatalogItem, candidate: any): TencentPoiCoordinateCandidate | undefined {
  const location = getCandidateLocation(candidate)
  if (!location) {
    return undefined
  }
  const normalizedTitle = normalizeScenicPoiName(String(candidate?.title ?? ''))
  const normalizedName = normalizeScenicPoiName(item.name)
  const normalizedAliases = item.aliases.map(normalizeScenicPoiName)
  const match: TencentPoiCoordinateCandidate['match'] =
    normalizedTitle === normalizedName
      ? 'exact'
      : normalizedAliases.includes(normalizedTitle)
        ? 'alias'
        : [normalizedName, ...normalizedAliases].some((name) => normalizedTitle.includes(name) || name.includes(normalizedTitle))
          ? 'partial'
          : 'weak'
  const address = `${candidate?.address ?? ''} ${candidate?.ad_info?.district ?? ''} ${candidate?.ad_info?.city ?? ''}`
  const category = String(candidate?.category ?? '')
  const nameScore = match === 'exact' ? 60 : match === 'alias' ? 52 : match === 'partial' ? 28 : 0
  const contextualScore = /灵山|马山|无锡/.test(address) ? 20 : 0
  const categoryScore = /风景|景点|名胜|宗教|建筑|博物馆/.test(category) ? 10 : 0
  return {
    id: String(candidate?.id ?? ''),
    title: String(candidate?.title ?? ''),
    address: candidate?.address,
    category: candidate?.category,
    ...location,
    score: nameScore + contextualScore + categoryScore + 10,
    match
  }
}

/** Development-only bounded Tencent Search helper. No key is stored here: the
 * loaded TMap SDK uses the current page's configured Web key. */
export async function resolveLingshanPoiCoordinates(poiId: string, options: { bypassCache?: boolean } = {}) {
  const item = getScenicPoiCatalogItem(poiId)
  const TMap = window.TMap
  if (!item || item.scenicAreaId !== 'lingshan') {
    throw new Error(`Unknown Lingshan catalog POI: ${poiId}`)
  }
  if (!TMap?.service?.Search || !TMap?.LatLng || !TMap?.LatLngBounds) {
    throw new Error('Tencent TMap.service.Search is unavailable. Wait until the map SDK is ready.')
  }

  const cacheKey = `${cachePrefix}${poiId}`
  if (!options.bypassCache) {
    const cached = window.localStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached) as TencentPoiCoordinateCandidate[]
      } catch {
        window.localStorage.removeItem(cacheKey)
      }
    }
  }

  const bounds = new TMap.LatLngBounds(
    new TMap.LatLng(LINGSHAN_INK_MAP_BOUNDS.southWest.lat, LINGSHAN_INK_MAP_BOUNDS.southWest.lng),
    new TMap.LatLng(LINGSHAN_INK_MAP_BOUNDS.northEast.lat, LINGSHAN_INK_MAP_BOUNDS.northEast.lng)
  )
  const search = new TMap.service.Search({ pageSize: 10 })
  const resultSets = await Promise.all(
    [item.name, ...item.aliases].map(async (keyword) => ({
      keyword,
      result: await search.searchRectangle({ keyword, bounds })
    }))
  )
  const candidates = resultSets
    .flatMap(({ result }) => (Array.isArray(result?.data) ? result.data : []))
    .map((candidate) => scoreCandidate(item, candidate))
    .filter((candidate): candidate is TencentPoiCoordinateCandidate => Boolean(candidate))
  const deduped = Array.from(new Map(candidates.map((candidate) => [candidate.id, candidate])).values()).sort(
    (left, right) => right.score - left.score
  )
  window.localStorage.setItem(cacheKey, JSON.stringify(deduped))
  return deduped
}

export function getPoiCoordinateResolution(item: ScenicPoiCatalogItem, candidates: TencentPoiCoordinateCandidate[]) {
  const best = candidates[0]
  const second = candidates[1]
  if (best && best.score >= 90 && (!second || best.score - second.score >= 20)) {
    return 'verified' as const
  }
  return best ? ('needs-review' as const) : ('unresolved' as const)
}
