export function isNavigationDebugEnabled(
  search = typeof window === 'undefined' ? '' : window.location.search,
  dev = Boolean(import.meta.env?.DEV)
) {
  return dev && new URLSearchParams(search).get('navigationDebug') === '1'
}
