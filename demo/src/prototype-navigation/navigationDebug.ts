export function isNavigationDebugEnabled(search = typeof window === 'undefined' ? '' : window.location.search) {
  return import.meta.env.DEV && new URLSearchParams(search).get('navigationDebug') === '1'
}
