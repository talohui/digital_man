import { useCallback, useEffect, useState } from 'react'
import { EMERGENCY_REFRESH_KEY, fetchActiveEmergencies, type EmergencyEvent } from '../api/emergencies'
import { loadEmergencies, type EmergencyCache, type EmergencyLoadResult } from '../lib/emergencyCache'

export const EMERGENCY_CACHE_KEY = 'lingshan-emergency-cache'
const POLL_MS = 10_000

function readCache(): EmergencyCache<EmergencyEvent> | null {
  try {
    const raw = localStorage.getItem(EMERGENCY_CACHE_KEY)
    return raw ? JSON.parse(raw) as EmergencyCache<EmergencyEvent> : null
  } catch { return null }
}

export function useActiveEmergencies() {
  const [state, setState] = useState<EmergencyLoadResult<EmergencyEvent>>({ events: [], stale: false })

  const refresh = useCallback(async () => {
    const result = await loadEmergencies({ fetcher: fetchActiveEmergencies, cache: readCache() })
    setState(result)
    if (!result.stale && !result.error) {
      try {
        localStorage.setItem(EMERGENCY_CACHE_KEY, JSON.stringify({ fetchedAt: new Date().toISOString(), events: result.events }))
      } catch { /* storage may be unavailable */ }
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), POLL_MS)
    const refreshFromOtherTab = (event: StorageEvent) => {
      if (event.key === EMERGENCY_REFRESH_KEY) void refresh()
    }
    window.addEventListener('storage', refreshFromOtherTab)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', refreshFromOtherTab)
    }
  }, [refresh])

  return { ...state, refresh }
}
