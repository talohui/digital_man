import { isNavigationDebugEnabled } from './navigationDebug'

export const REAL_NAVIGATION_VALIDATION_PATH = '/map-3d-guide-c/navigation-test'

export function isRealNavigationValidationPage(
  pathname = typeof window === 'undefined' ? '' : window.location.pathname
) {
  return pathname === REAL_NAVIGATION_VALIDATION_PATH
}

/**
 * Enable only the real-location local test on its competition page. Replay
 * and the rest of the development navigation tools keep their DEV gate.
 */
export function isLocalNavigationTestEnabled() {
  return isNavigationDebugEnabled() || isRealNavigationValidationPage()
}
