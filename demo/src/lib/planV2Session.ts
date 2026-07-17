export type PlanV2ActiveStep = 1 | 2 | 3

export type PlanV2SessionSnapshot = {
  version: 1
  savedAt: number
  selectedRouteId: string
  hasChosenRoute: boolean
  activeStep: PlanV2ActiveStep
  selectedStopId?: string
  scrollY: number
}

const STORAGE_KEY = 'lingshan:plan:session:v1'
const LEGACY_STORAGE_KEY = 'lingshan:plan-v2:session:v1'
const MAX_AGE_MS = 2 * 60 * 60 * 1000

function isActiveStep(value: unknown): value is PlanV2ActiveStep {
  return value === 1 || value === 2 || value === 3
}

export function savePlanV2Session(
  input: Omit<PlanV2SessionSnapshot, 'version' | 'savedAt'>
): PlanV2SessionSnapshot | undefined {
  if (typeof window === 'undefined' || !input.selectedRouteId) return undefined
  const snapshot: PlanV2SessionSnapshot = {
    ...input,
    version: 1,
    savedAt: Date.now(),
    scrollY: Number.isFinite(input.scrollY) ? Math.max(0, input.scrollY) : 0
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return snapshot
  } catch {
    return undefined
  }
}

export function readPlanV2Session(): PlanV2SessionSnapshot | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const currentSnapshot = window.sessionStorage.getItem(STORAGE_KEY)
    const legacySnapshot = currentSnapshot ? null : window.sessionStorage.getItem(LEGACY_STORAGE_KEY)
    const parsed = JSON.parse(currentSnapshot ?? legacySnapshot ?? '') as PlanV2SessionSnapshot
    if (
      parsed?.version !== 1 ||
      !parsed.selectedRouteId ||
      !isActiveStep(parsed.activeStep) ||
      !Number.isFinite(parsed.scrollY) ||
      !Number.isFinite(parsed.savedAt) ||
      Date.now() - parsed.savedAt > MAX_AGE_MS
    ) {
      clearPlanV2Session()
      return undefined
    }
    const snapshot = {
      ...parsed,
      hasChosenRoute: Boolean(parsed.hasChosenRoute),
      selectedStopId: typeof parsed.selectedStopId === 'string' ? parsed.selectedStopId : undefined,
      scrollY: Math.max(0, parsed.scrollY)
    }
    if (legacySnapshot) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      window.sessionStorage.removeItem(LEGACY_STORAGE_KEY)
    }
    return snapshot
  } catch {
    clearPlanV2Session()
    return undefined
  }
}

export function clearPlanV2Session() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // sessionStorage may be unavailable in private browsing modes.
  }
}
