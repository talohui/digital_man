import { findNearestRoutePoint, haversineDistanceMeters } from '../lib/routeProgress'
import { getPrototypeStepInstruction } from './prototypeNavigationPrompt'

import type {
  ConvertedGcj02Location,
  NavigationPrototypeProgress,
  NavigationPrototypeRoute,
  NavigationPrototypeStep
} from './types'

type StepRange = {
  stepIndex: number
  startIndex: number
  endIndex: number
}

export function buildNavigationPrototypeProgress(
  route: NavigationPrototypeRoute,
  location: ConvertedGcj02Location,
  confirmedStepIndex?: number
): NavigationPrototypeProgress {
  const nearest = findNearestRoutePoint(location, route.polyline)
  const nearestPolylineIndex = nearest?.nearestIndex ?? 0
  const resolvedStepIndex = resolveStepIndexFromPolylineIndex({
    nearestPolylineIndex,
    steps: route.steps,
    polylinePointCount: route.polyline.length
  })
  const currentStepIndex = clampStepIndex(confirmedStepIndex ?? resolvedStepIndex, route.steps.length)
  const distanceToDestinationMeters = Math.round(haversineDistanceMeters(location, route.destination))
  const metersPerMinute = route.distanceMeters / Math.max(route.durationMinutes, 1)
  const durationRemainingMinutes = distanceToDestinationMeters === 0
    ? 0
    : Math.max(1, Math.ceil(distanceToDestinationMeters / Math.max(metersPerMinute, 1)))

  return {
    distanceRemainingMeters: distanceToDestinationMeters,
    distanceToDestinationMeters,
    durationRemainingMinutes,
    currentStepIndex,
    currentInstruction: getPrototypeStepInstruction(route.steps[currentStepIndex]),
    nextInstruction: route.steps[currentStepIndex + 1]
      ? getPrototypeStepInstruction(route.steps[currentStepIndex + 1])
      : undefined,
    nearestPolylineIndex
  }
}

/**
 * Maps the nearest navigation-polyline point to Tencent's step ranges.
 * This intentionally uses route-point proximity for v3; replacing it with a
 * full segment projection later only changes the input index, not this mapping.
 */
export function resolveStepIndexFromPolylineIndex(input: {
  nearestPolylineIndex: number
  steps: NavigationPrototypeStep[]
  polylinePointCount?: number
}) {
  const { nearestPolylineIndex, steps, polylinePointCount } = input
  if (!steps.length) return 0

  const ranges = getStepRanges(steps)
  if (!ranges.length) {
    return resolveMissingIndexFallback(nearestPolylineIndex, steps.length, polylinePointCount)
  }

  const firstRange = ranges[0]
  const lastRange = ranges[ranges.length - 1]
  if (nearestPolylineIndex <= firstRange.startIndex) return 0
  if (nearestPolylineIndex >= lastRange.endIndex) return steps.length - 1

  for (const range of ranges) {
    if (nearestPolylineIndex >= range.startIndex && nearestPolylineIndex <= range.endIndex) {
      return range.stepIndex
    }
    // An omitted index between two Tencent ranges remains with the preceding
    // step. This is more interpretable than switching early to the next step.
    if (nearestPolylineIndex < range.startIndex) {
      return Math.max(0, range.stepIndex - 1)
    }
  }

  return steps.length - 1
}

function getStepRanges(steps: NavigationPrototypeStep[]): StepRange[] {
  return steps.flatMap((step, stepIndex) => {
    const indexes = step.polylineIndexes?.filter((index) => Number.isInteger(index)) ?? []
    if (!indexes.length) return []

    return [{
      stepIndex,
      startIndex: Math.min(...indexes),
      endIndex: Math.max(...indexes)
    }]
  })
}

function resolveMissingIndexFallback(nearestPolylineIndex: number, stepCount: number, polylinePointCount?: number) {
  // Only used when Tencent omitted every `polyline_idx`. It keeps the previous
  // prototype's explainable point-index ratio rather than inventing distances.
  if (stepCount <= 1) return 0
  const denominator = Math.max((polylinePointCount ?? stepCount) - 1, 1)
  return Math.min(stepCount - 1, Math.max(0, Math.floor((nearestPolylineIndex / denominator) * stepCount)))
}

function clampStepIndex(index: number, stepCount: number) {
  if (!stepCount) return 0
  return Math.min(Math.max(index, 0), stepCount - 1)
}
