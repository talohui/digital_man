import { getLandmarkLodPreloadEntries } from '../data/lingshanLandmarkLod'
import { loadTMap } from './loadTMap'

type PreloadStatus = 'idle' | 'running' | 'done' | 'skipped'

type Map3DGuidePreloadOptions = {
  includeLandmarkAssets?: boolean
}

type NetworkInformationLike = {
  saveData?: boolean
  effectiveType?: string
}

const MAP_3D_PRELOAD_IDLE_DELAY_MS = 1800
const MAP_3D_PRELOAD_BUDGET_MB = 150
const MAP_3D_PRELOAD_CONCURRENCY = 2
const MAP_3D_MOBILE_PRELOAD_IDLE_DELAY_MS = 5200
const MAP_3D_MOBILE_PRELOAD_BUDGET_MB = 36
const MAP_3D_MOBILE_PRELOAD_CONCURRENCY = 1
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

let shellPreloadStatus: PreloadStatus = 'idle'
let landmarkAssetPreloadStatus: PreloadStatus = 'idle'
let shellPreloadPromise: Promise<void> | null = null
let landmarkAssetPreloadPromise: Promise<void> | null = null

export function scheduleMap3DGuidePreload(options: Map3DGuidePreloadOptions = {}) {
  if (typeof window === 'undefined') {
    return
  }

  scheduleMap3DGuideShellPreload()

  if (options.includeLandmarkAssets === false) {
    return
  }

  scheduleMap3DLandmarkAssetPreload()
}

function scheduleMap3DGuideShellPreload() {
  if (shellPreloadStatus !== 'idle') {
    return
  }

  shellPreloadStatus = 'running'
  const run = () => {
    shellPreloadPromise = preloadMap3DGuideShellAssets().finally(() => {
      shellPreloadStatus = 'done'
    })
  }
  const requestIdleCallback = window.requestIdleCallback

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: MAP_3D_PRELOAD_IDLE_DELAY_MS + 1200 })
    return
  }

  globalThis.setTimeout(run, MAP_3D_PRELOAD_IDLE_DELAY_MS)
}

function scheduleMap3DLandmarkAssetPreload() {
  if (landmarkAssetPreloadStatus !== 'idle') {
    return
  }

  if (shouldSkipAssetPreload()) {
    landmarkAssetPreloadStatus = 'skipped'
    return
  }

  landmarkAssetPreloadStatus = 'running'
  const settings = getPreloadSettings()
  const run = () => {
    landmarkAssetPreloadPromise = preloadFarLodAssets().finally(() => {
      landmarkAssetPreloadStatus = 'done'
    })
  }
  const requestIdleCallback = window.requestIdleCallback

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: settings.idleDelayMs + 1800 })
    return
  }

  globalThis.setTimeout(run, settings.idleDelayMs)
}

export function getMap3DGuidePreloadStatus() {
  if (shellPreloadStatus === 'running' || landmarkAssetPreloadStatus === 'running') {
    return 'running'
  }

  if (shellPreloadStatus === 'skipped' && landmarkAssetPreloadStatus === 'skipped') {
    return 'skipped'
  }

  if (shellPreloadStatus === 'done' || landmarkAssetPreloadStatus === 'done') {
    return 'done'
  }

  return 'idle'
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

async function preloadMap3DGuideShellAssets() {
  await Promise.allSettled([preloadMap3DGuideRouteChunk(), preloadTMapScript()])
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
  await shellPreloadPromise
  const entries = getPreloadCandidateUrls()
  const settings = getPreloadSettings()

  for (let index = 0; index < entries.length; index += settings.concurrency) {
    const batch = entries.slice(index, index + settings.concurrency)
    await Promise.allSettled(batch.map((url) => preloadAsset(url)))
  }
}

function getPreloadCandidateUrls() {
  const settings = getPreloadSettings()
  const byId = new Map(getLandmarkLodPreloadEntries().map((entry) => [entry.landmarkId, entry]))
  const urls: string[] = []
  let usedBudgetMb = 0

  for (const landmarkId of preloadPriority) {
    const entry = byId.get(landmarkId)
    const sizeMb = parseSizeMb(entry?.sizeLabel)

    if (!entry || !entry.modelUrl || usedBudgetMb + sizeMb > settings.budgetMb) {
      continue
    }

    urls.push(entry.modelUrl)
    usedBudgetMb += sizeMb
  }

  return urls
}

function getPreloadSettings() {
  if (isLikelyMobileClient()) {
    return {
      budgetMb: MAP_3D_MOBILE_PRELOAD_BUDGET_MB,
      concurrency: MAP_3D_MOBILE_PRELOAD_CONCURRENCY,
      idleDelayMs: MAP_3D_MOBILE_PRELOAD_IDLE_DELAY_MS
    }
  }

  return {
    budgetMb: MAP_3D_PRELOAD_BUDGET_MB,
    concurrency: MAP_3D_PRELOAD_CONCURRENCY,
    idleDelayMs: MAP_3D_PRELOAD_IDLE_DELAY_MS
  }
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

function isLikelyMobileClient() {
  if (typeof window === 'undefined') {
    return false
  }

  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches
  const userAgent = navigator.userAgent
  return Boolean(hasCoarsePointer || /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent))
}
