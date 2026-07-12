import type { NavigationPrototypeStep } from './types'

const DEFAULT_STEP_INSTRUCTION = '请沿当前步行路线继续前进'

/**
 * Keeps Tencent's direction, road, distance and action intact while providing
 * a safe display fallback for the occasional step without `instruction`.
 */
export function getPrototypeStepInstruction(step?: NavigationPrototypeStep) {
  const instruction = step?.instruction?.trim()
  if (instruction) return instruction

  if (!step) return DEFAULT_STEP_INSTRUCTION

  const direction = step.directionDescription?.trim()
  const road = step.roadName?.trim()
  const action = step.actionDescription?.trim()
  const distance = step.distanceMeters > 0 ? `前行${step.distanceMeters}米` : ''
  const parts = [direction, road ? `沿${road}` : '', distance, action].filter(Boolean)

  return parts.join('') || DEFAULT_STEP_INSTRUCTION
}

/** Deterministic prototype copy only; it never calls Fay, an LLM, or a Guide API. */
export function formatPrototypeNavigationPrompt(input: {
  currentStep?: NavigationPrototypeStep
  nextStep?: NavigationPrototypeStep
}) {
  const instruction = getPrototypeStepInstruction(input.currentStep ?? input.nextStep)
  const withoutMachinePrefix = instruction.replace(/^从起点(?=朝|沿|向)/, '')
  const withReadableDistance = withoutMachinePrefix.replace(/(^|[^约\d])(\d+(?:\.\d+)?)\s*米/g, '$1约 $2 米')
  const withPunctuation = /[。！？!?]$/.test(withReadableDistance)
    ? withReadableDistance
    : `${withReadableDistance}。`

  return `小灵提醒：${withPunctuation}`
}
