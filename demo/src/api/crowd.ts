import { getAnalyticsApiBase } from '../lib/runtimeConfig'

export type RealtimeCrowdEvent = {
  event?: string
  target?: string
  timestamp?: string
}

export type RealtimeCrowdSnapshot = {
  recentEvents?: RealtimeCrowdEvent[]
}

export async function fetchRealtimeCrowd(signal?: AbortSignal): Promise<RealtimeCrowdSnapshot | null> {
  try {
    const response = await fetch(`${getAnalyticsApiBase()}/dashboard/realtime?activeWindowMinutes=5`, { signal })
    if (!response.ok) return null
    return response.json() as Promise<RealtimeCrowdSnapshot>
  } catch {
    return null
  }
}
