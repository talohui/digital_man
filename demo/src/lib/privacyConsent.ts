export type CachedVisitorConsent = { personalizationEnabled: boolean; analyticsEnabled: boolean }
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const KEY = 'lingshan-visitor-consent'
const DEFAULT_CONSENT: CachedVisitorConsent = { personalizationEnabled: true, analyticsEnabled: true }

function browserStorage(): StorageLike | undefined {
  try { return typeof localStorage === 'undefined' ? undefined : localStorage } catch { return undefined }
}

export function readCachedConsent(userId: string, storage: StorageLike | undefined = browserStorage()): CachedVisitorConsent {
  if (!storage || !userId) return DEFAULT_CONSENT
  try {
    const saved = JSON.parse(storage.getItem(KEY) ?? '{}') as { userId?: string; personalizationEnabled?: boolean; analyticsEnabled?: boolean }
    if (saved.userId !== userId) return DEFAULT_CONSENT
    return {
      personalizationEnabled: saved.personalizationEnabled !== false,
      analyticsEnabled: saved.analyticsEnabled !== false
    }
  } catch { return DEFAULT_CONSENT }
}

export function writeCachedConsent(userId: string, consent: CachedVisitorConsent, storage: StorageLike | undefined = browserStorage()): void {
  if (!storage || !userId) return
  try { storage.setItem(KEY, JSON.stringify({ userId, ...consent })) } catch { /* storage unavailable */ }
}

export function clearCachedConsent(storage: StorageLike | undefined = browserStorage()): void {
  try { storage?.removeItem(KEY) } catch { /* storage unavailable */ }
}
