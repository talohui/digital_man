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

/**
 * Tencent instruction stays the factual source. This view-only formatter
 * removes its static step distance so UI can pair the action with the actual
 * projected distance remaining in the current step.
 */
export function formatNavigationAction(step?: NavigationPrototypeStep) {
  return formatNavigationActionText(getPrototypeStepInstruction(step))
}

export function formatNavigationActionText(rawInstruction: string) {
  const withoutLeadingDistance = rawInstruction
    .replace(/^从起点/, '')
    .replace(/^(?:行进|前行|直行|步行|沿[^，。；;]*?行进)\s*\d+(?:\.\d+)?\s*米\s*/, '')
    .replace(/\d+(?:\.\d+)?\s*米后?/, '')
    .trim()
  if (!withoutLeadingDistance || withoutLeadingDistance === rawInstruction) {
    if (/^(直行|前行|继续)/.test(rawInstruction)) return rawInstruction.replace(/^直行/, '继续直行')
    return rawInstruction
  }
  return withoutLeadingDistance.replace(/^直行/, '继续直行')
}

export function formatNavigationInstructionData(input: {
  currentStep?: NavigationPrototypeStep
  nextStep?: NavigationPrototypeStep
  distanceToCurrentStepEndMeters: number
  isLastStep: boolean
}) {
  const currentActionText = formatNavigationAction(input.currentStep)
  const rounded = Math.max(0, Math.round(input.distanceToCurrentStepEndMeters))
  const dynamicDistanceText = input.isLastStep && rounded <= 5
    ? '即将到达目的地'
    : rounded <= 5
      ? '即将进入下一步'
      : rounded <= 20
        ? `前方约 ${rounded} 米`
        : `距下一动作约 ${rounded} 米`
  const nextAction = input.nextStep ? formatNavigationAction(input.nextStep) : undefined
  return {
    currentActionText,
    dynamicDistanceText,
    nextActionText: nextAction ? `前方${nextAction.replace(/^前方/, '')}` : undefined,
    rawCurrentInstruction: getPrototypeStepInstruction(input.currentStep),
    rawNextInstruction: input.nextStep ? getPrototypeStepInstruction(input.nextStep) : undefined
  }
}
