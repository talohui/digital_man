export type CachedEmergency = {
  id: string
  validFrom: string
  validUntil: string
}

export type EmergencyCache<T extends CachedEmergency = CachedEmergency> = { fetchedAt: string; events: T[] }
export type EmergencyLoadResult<T extends CachedEmergency = CachedEmergency> = { events: T[]; stale: boolean; error?: string }

function validAt(event: CachedEmergency, now: Date) {
  const from = new Date(event.validFrom).getTime()
  const until = new Date(event.validUntil).getTime()
  const time = now.getTime()
  return Number.isFinite(from) && Number.isFinite(until) && time >= from && time < until
}

export async function loadEmergencies<T extends CachedEmergency>(options: {
  fetcher: () => Promise<T[]>
  cache?: EmergencyCache<T> | null
  now?: Date
}): Promise<EmergencyLoadResult<T>> {
  const now = options.now ?? new Date()
  try {
    const events = (await options.fetcher()).filter(event => validAt(event, now))
    return { events, stale: false }
  } catch (reason) {
    const events = (options.cache?.events ?? []).filter(event => validAt(event, now))
    return { events, stale: events.length > 0, error: reason instanceof Error ? reason.message : '应急信息读取失败' }
  }
}
