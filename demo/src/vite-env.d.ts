/// <reference types="vite/client" />

interface Window {
  TMap?: any
  __tmapLoader?: Promise<any>
  __tmapScriptLoader?: Promise<any>
  __LINGSHAN_MAP_DEBUG__?: Record<string, unknown>
  LINGSHAN_MAP_DEBUG?: Record<string, unknown>
  __GET_LINGSHAN_MAP_SNAPSHOT__?: () => Record<string, unknown>
}

interface ImportMetaEnv {
  readonly VITE_FAY_HTTP?: string
  readonly VITE_FAY_WS?: string
  readonly VITE_ANALYTICS_HTTP?: string
  readonly VITE_TMAP_WEB_KEY?: string
  readonly VITE_TMAP_ROUTE_KEY?: string
  readonly VITE_VOICE_ASR_MODE?: 'auto' | 'browser' | 'cloud'
}
