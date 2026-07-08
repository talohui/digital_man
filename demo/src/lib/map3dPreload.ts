import { getLandmarkLodPreloadEntries } from '../data/lingshanLandmarkLod'
import { loadTMap } from './loadTMap'

type PreloadStatus = 'idle' | 'running' | 'done' | 'skipped'

type NetworkInformationLike = {
  saveData?: boolean
  effectiveType?: string
}

const MAP_3D_PRELOAD_IDLE_DELAY_MS = 1800
const MAP_3D_PRELOAD_BUDGET_MB = 150
const MAP_3D_PRELOAD_CONCURRENCY = 2
const preloadPriority = [
  'shengjing_square',
  'lingshan_dazhaobi',
  'jiulong_guanyu',
  'wuyin_tancheng',
  'giant_buddha',
  'foqian_square',
  'foshou_square',
  'baizi_mile',
  'fan_gong',
  'xiangfu_temple',
  'puti_avenue',
  'sansheng_hall',
  'manlong_flying_tower'
]

let preloadStatus: PreloadStatus = 'idle'
let preloadPromise: Promise<void> | null = null

export function scheduleMap3DGuidePreload() {
  if (typeof window === 'undefined' || preloadStatus !== 'idle') {
    return
  }

  if (shouldSkipAssetPreload()) {
    preloadStatus = 'skipped'
    return
  }

  preloadStatus = 'running'
  const run = () => {
    preloadPromise = preloadMap3DGuideAssets().finally(() => {
      preloadStatus = 'done'
    })
  }

  const requestIdleCallback = window.requestIdleCallback

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: MAP_3D_PRELOAD_IDLE_DELAY_MS + 1200 })
    return
  }

  globalThis.setTimeout(run, MAP_3D_PRELOAD_IDLE_DELAY_MS)
}

export function getMap3DGuidePreloadStatus() {
  return preloadStatus
}

export function preloadMap3DLandmarkAssets(landmarkIds: string[]) {
  if (typeof window === 'undefined' || shouldSkipAssetPreload()) {
    return
  }

  const byId = new Map(getLandmarkLodPreloadEntries().map((entry) => [entry.landmarkId, entry]))
  const urls = landmarkIds
    .map((id) => byId.get(id)?.modelUrl)
    .filter((url): url is string => Boolean(url))

  void Promise.allSettled(urls.map((url) => preloadAsset(url, 'high')))
}

async function preloadMap3DGuideAssets() {
  await Promise.allSettled([preloadMap3DGuideRouteChunk(), preloadTMapScript()])
  await preloadFarLodAssets()
}

async function preloadMap3DGuideRouteChunk() {
  try {
    await import('../pages/Map3DGuidePage')
  } catch (error) {
    console.warn('[map3dPreload] Map3DGuidePage chunk preload failed', error)
  }
}

async function preloadTMapScript() {
  try {
    await loadTMap()
  } catch (error) {
    console.warn('[map3dPreload] TMap script preload failed', error)
  }
}

async function preloadFarLodAssets() {
  const entries = getPreloadCandidateUrls()

  for (let index = 0; index < entries.length; index += MAP_3D_PRELOAD_CONCURRENCY) {
    const batch = entries.slice(index, index + MAP_3D_PRELOAD_CONCURRENCY)
    await Promise.allSettled(batch.map((url) => preloadAsset(url)))
  }
}

function getPreloadCandidateUrls() {
  const byId = new Map(getLandmarkLodPreloadEntries().map((entry) => [entry.landmarkId, entry]))
  const urls: string[] = []
  let usedBudgetMb = 0

  for (const landmarkId of preloadPriority) {
    const entry = byId.get(landmarkId)
    const sizeMb = parseSizeMb(entry?.sizeLabel)

    if (!entry || !entry.modelUrl || usedBudgetMb + sizeMb > MAP_3D_PRELOAD_BUDGET_MB) {
      continue
    }

    urls.push(entry.modelUrl)
    usedBudgetMb += sizeMb
  }

  return urls
}

async function preloadAsset(url: string, priority: 'low' | 'high' = 'low') {
  try {
    const response = await fetch(url, {
      cache: 'force-cache',
      priority
    } as RequestInit)

    if (!response.ok) {
      console.warn('[map3dPreload] asset preload failed', url, response.status)
      return
    }

    await response.arrayBuffer()
  } catch (error) {
    console.warn('[map3dPreload] asset preload failed', url, error)
  }
}

function parseSizeMb(sizeLabel: string | undefined) {
  const value = Number.parseFloat(sizeLabel ?? '')
  return Number.isFinite(value) && value > 0 ? value : 12
}

function shouldSkipAssetPreload() {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  const effectiveType = connection?.effectiveType ?? ''

  return Boolean(connection?.saveData || effectiveType === 'slow-2g' || effectiveType === '2g')
}
