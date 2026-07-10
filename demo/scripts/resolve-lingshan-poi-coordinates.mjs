#!/usr/bin/env node

/**
 * Development-only Tencent WebService place-search helper.
 *
 * Usage (the key is intentionally supplied by the shell and never written to
 * this repository):
 *   TMAP_WEB_SERVICE_KEY=... node scripts/resolve-lingshan-poi-coordinates.mjs
 *
 * Results are cached under scripts/.cache/ (gitignored). Review candidates in
 * docs/poi-tencent-search-results.md before copying a coordinate into the
 * catalog. This script never modifies application data.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const key = process.env.TMAP_WEB_SERVICE_KEY?.trim() || process.env.VITE_TMAP_WEB_KEY?.trim()
if (!key) {
  console.error('Missing TMAP_WEB_SERVICE_KEY. Supply it through the shell; do not add it to a source file.')
  process.exit(1)
}

const bounds = {
  south: 31.419471,
  west: 120.092302,
  north: 31.431918,
  east: 120.106883
}
const cachePath = resolve(dirname(fileURLToPath(import.meta.url)), '.cache/lingshan-poi-tencent-search-cache.json')
const queryItems = [
  { id: 'wuming_bridge', name: '五明桥', aliases: ['五明桥景区'] },
  { id: 'wuzhi_gate', name: '五智门', aliases: ['五智门牌坊'] },
  { id: 'jiangmo_relief', name: '降魔浮雕', aliases: ['降魔浮雕墙'] },
  { id: 'ashoka_pillar', name: '阿育王柱', aliases: ['阿育王石柱'] },
  { id: 'buddhist_culture_museum', name: '佛教文化博览馆', aliases: ['灵山佛教文化博览馆'] },
  { id: 'wujinyi_zhai', name: '无尽意斋', aliases: ['无尽意斋院'] }
]

function normalize(value = '') {
  return value.replace(/[\s·•・,，。－-]/g, '').toLowerCase()
}

function readLocation(result) {
  const location = result?.location
  const lat = typeof location?.lat === 'number' ? location.lat : Number(location?.getLat?.())
  const lng = typeof location?.lng === 'number' ? location.lng : Number(location?.getLng?.())
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined
}

function scoreCandidate(item, candidate) {
  const title = candidate?.title ?? ''
  const titleNormalized = normalize(title)
  const names = [item.name, ...item.aliases].map(normalize)
  const exactName = names.includes(titleNormalized)
  const partialName = names.some((name) => titleNormalized.includes(name) || name.includes(titleNormalized))
  const address = `${candidate?.address ?? ''} ${candidate?.ad_info?.district ?? ''} ${candidate?.ad_info?.city ?? ''}`
  const lingshanContext = /灵山|马山|无锡/.test(address)
  const category = String(candidate?.category ?? '')
  const scenicCategory = /风景|景点|名胜|宗教|建筑|博物馆/.test(category)
  return (exactName ? 60 : partialName ? 30 : 0) + (lingshanContext ? 20 : 0) + (scenicCategory ? 10 : 0) + (readLocation(candidate) ? 10 : 0)
}

async function loadCache() {
  try {
    return JSON.parse(await readFile(cachePath, 'utf8'))
  } catch {
    return { generatedAt: '', bounds, entries: {} }
  }
}

async function search(keyword) {
  // Tencent WebService place search, bounded to the official Lingshan export rectangle.
  const url = new URL('https://apis.map.qq.com/ws/place/v1/search')
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('boundary', `rectangle(${bounds.south},${bounds.west},${bounds.north},${bounds.east})`)
  url.searchParams.set('page_size', '10')
  url.searchParams.set('key', key)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Tencent place search HTTP ${response.status}`)
  }
  const payload = await response.json()
  if (payload.status !== 0) {
    throw new Error(`Tencent place search status ${payload.status}: ${payload.message ?? 'unknown error'}`)
  }
  return Array.isArray(payload.data) ? payload.data : []
}

const cache = await loadCache()
for (const item of queryItems) {
  if (cache.entries[item.id]) {
    continue
  }
  try {
    const resultSets = await Promise.all(
      [item.name, ...item.aliases].map(async (keyword) => ({ keyword, candidates: await search(keyword) }))
    )
    const candidates = resultSets.flatMap(({ keyword, candidates }) =>
      candidates.map((candidate) => ({
        query: keyword,
        id: candidate.id,
        title: candidate.title,
        address: candidate.address,
        category: candidate.category,
        location: readLocation(candidate),
        adInfo: candidate.ad_info,
        score: scoreCandidate(item, candidate)
      }))
    )
    const deduped = Array.from(new Map(candidates.map((candidate) => [candidate.id, candidate])).values()).sort(
      (left, right) => right.score - left.score
    )
    const best = deduped[0]
    const second = deduped[1]
    const outcome = best && best.score >= 90 && (!second || best.score - second.score >= 20) ? 'verified' : best ? 'needs-review' : 'unresolved'
    cache.entries[item.id] = { item, outcome, candidates: deduped, resolvedAt: new Date().toISOString() }
  } catch (error) {
    cache.entries[item.id] = {
      item,
      outcome: 'unresolved',
      candidates: [],
      error: error instanceof Error ? error.message : 'Tencent place search failed',
      resolvedAt: new Date().toISOString()
    }
  }
}

cache.generatedAt = new Date().toISOString()
await mkdir(dirname(cachePath), { recursive: true })
await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
console.log(`Cached Tencent candidates for ${Object.keys(cache.entries).length} Lingshan POIs at ${cachePath}`)
