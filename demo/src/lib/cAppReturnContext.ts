export type CAppReturnSource =
  | 'home-crowd'
  | 'home-xiaoling'
  | 'map-browse'
  | 'map-route'
  | 'map-poi'

export interface CAppReturnContext {
  version: 1
  source: CAppReturnSource
  returnTo: string
  returnScrollY?: number
  returnAnchor?: string
  conversationKey?: string
  contextType?: 'browse' | 'route' | 'poi'
  routeId?: string
  poiId?: string
  reopenDrawer?: boolean
  createdAt: number
}

const STORAGE_KEY = 'lingshan:c-app:return-context:v1'
const MAX_AGE_MS = 2 * 60 * 60 * 1000
const VALID_SOURCES: CAppReturnSource[] = ['home-crowd', 'home-xiaoling', 'map-browse', 'map-route', 'map-poi']

export function normalizeInternalReturnTo(value: string | null | undefined): string | undefined {
  if (!value || typeof window === 'undefined') return undefined
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/') || url.pathname.startsWith('//')) {
      return undefined
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

export function resolveCAppReturnTarget(input: {
  context?: CAppReturnContext
  queryReturnTo?: string | null
  fallback: string
}) {
  return input.context?.returnTo ?? normalizeInternalReturnTo(input.queryReturnTo) ?? input.fallback
}

export function resolveHomeCrowdPoiReturn(context: CAppReturnContext | undefined, poiId?: string) {
  if (context?.source !== 'home-crowd') return undefined
  return !context.poiId || context.poiId === poiId ? context.returnTo : undefined
}

export function saveCAppReturnContext(
  context: Omit<CAppReturnContext, 'version' | 'createdAt'> & Partial<Pick<CAppReturnContext, 'createdAt'>>
): CAppReturnContext | undefined {
  const returnTo = normalizeInternalReturnTo(context.returnTo)
  if (!returnTo || typeof window === 'undefined') return undefined
  const saved: CAppReturnContext = {
    ...context,
    version: 1,
    returnTo,
    createdAt: context.createdAt ?? Date.now()
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    return saved
  } catch {
    return undefined
  }
}

export function readCAppReturnContext(): CAppReturnContext | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '') as CAppReturnContext
    const returnTo = normalizeInternalReturnTo(parsed?.returnTo)
    if (
      parsed?.version !== 1 ||
      !VALID_SOURCES.includes(parsed?.source) ||
      !returnTo ||
      !Number.isFinite(parsed.createdAt) ||
      Date.now() - parsed.createdAt > MAX_AGE_MS
    ) {
      clearCAppReturnContext()
      return undefined
    }
    return { ...parsed, returnTo }
  } catch {
    clearCAppReturnContext()
    return undefined
  }
}

export function consumeCAppReturnContext(): CAppReturnContext | undefined {
  const context = readCAppReturnContext()
  clearCAppReturnContext()
  return context
}

export function clearCAppReturnContext() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage can be unavailable in private browsing modes.
  }
}
