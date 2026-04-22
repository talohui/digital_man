/// <reference types="vite/client" />

interface Window {
  TMap?: any
  __tmapLoader?: Promise<any>
}

interface ImportMetaEnv {
  readonly VITE_TMAP_WEB_KEY?: string
  readonly VITE_TMAP_ROUTE_KEY?: string
}
