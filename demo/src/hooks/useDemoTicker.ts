import { useEffect, useState } from 'react'
import { toDemoTick } from '../lib/adminDemoTimeline'

export function useDemoTicker(enabled: boolean) {
  const [tick, setTick] = useState(() => toDemoTick())

  useEffect(() => {
    if (!enabled) return

    const sync = () => {
      if (document.visibilityState !== 'hidden') {
        setTick(toDemoTick())
      }
    }
    const timer = window.setInterval(sync, 1000)
    document.addEventListener('visibilitychange', sync)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [enabled])

  return tick
}
