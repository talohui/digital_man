import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const WEATHER_API = `${getAnalyticsApiBase()}/public/weather`

export type ScenicWeather = {
  weather: string
  temperature: number
  humidity: number
  windDirection: string
  windPower: string
  airPressure?: number
  updateTime: string
  district?: string
  source: string
  cached: boolean
  strategy?: string | null
  routeAdvice?: string | null
}

export async function fetchScenicWeather(): Promise<ScenicWeather | null> {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(WEATHER_API, { signal: controller.signal })
    if (!response.ok) return null
    return (await response.json()) as ScenicWeather
  } catch {
    return null
  } finally {
    globalThis.clearTimeout(timeout)
  }
}
