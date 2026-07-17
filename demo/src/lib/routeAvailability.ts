import type { EmergencyEvent } from '../api/emergencies'

type RouteStops = { id: string; stopIds: string[] }

export type RouteAvailability = {
  availableStopIds: string[]
  blockedSpotIds: string[]
  routeExcluded: boolean
  reasons: string[]
}

export function routeAvailability(route: RouteStops, recommendedStopIds: string[] | undefined, events: EmergencyEvent[]): RouteAvailability {
  const baseIds = recommendedStopIds?.length
    ? recommendedStopIds.filter((id) => route.stopIds.includes(id))
    : route.stopIds
  const exclusions = events.filter((event) => event.routePolicy === 'EXCLUDE')
  const routeExcluded = exclusions.some((event) => event.affectedRouteIds.includes(route.id) && event.affectedSpotIds.length === 0)
  const blocked = new Set<string>()
  const reasons: string[] = []

  for (const event of exclusions) {
    const affectsRoute = event.affectedRouteIds.includes(route.id)
    const affectedStops = event.affectedSpotIds.filter((id) => route.stopIds.includes(id))
    if (!affectsRoute && !affectedStops.length) continue
    affectedStops.forEach((id) => blocked.add(id))
    if (!reasons.includes(event.title)) reasons.push(event.title)
  }

  return {
    availableStopIds: routeExcluded ? [] : baseIds.filter((id) => !blocked.has(id)),
    blockedSpotIds: [...blocked],
    routeExcluded,
    reasons
  }
}

export function availableStopIds(route: RouteStops, recommendedStopIds: string[] | undefined, events: EmergencyEvent[]) {
  return routeAvailability(route, recommendedStopIds, events).availableStopIds
}
