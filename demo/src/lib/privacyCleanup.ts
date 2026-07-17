import type { VisitorDeleteResult } from '../api/privacy'

export type PrivacyCleanupPlan = { remove: string[]; removePrefixes: string[]; rotateGuestIdentity: boolean }

export function buildCleanupPlan(result: Pick<VisitorDeleteResult, 'complete' | 'failedCategories'>): PrivacyCleanupPlan {
  if (!result.complete || result.failedCategories.length > 0) {
    return { remove: [], removePrefixes: [], rotateGuestIdentity: false }
  }
  return {
    remove: ['lingshan-guide-store', 'lingshan-ticket-store', 'lingshan-emergency-cache'],
    removePrefixes: ['ph_', 'posthog_'],
    rotateGuestIdentity: true
  }
}
