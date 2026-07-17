export type JourneyTrailState = {
  journeyDate: string
  visitedStops: string[]
  listenedStops: string[]
}

export function getJourneyDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function recordJourneyStop(
  state: JourneyTrailState,
  field: 'visitedStops' | 'listenedStops',
  spotId: string,
  date = new Date()
): JourneyTrailState {
  const journeyDate = getJourneyDateKey(date)
  const isCurrentDay = state.journeyDate === journeyDate
  const visitedStops = isCurrentDay ? state.visitedStops : []
  const listenedStops = isCurrentDay ? state.listenedStops : []
  const targetStops = field === 'visitedStops' ? visitedStops : listenedStops

  if (!spotId || targetStops.includes(spotId)) {
    return { journeyDate, visitedStops, listenedStops }
  }

  return field === 'visitedStops'
    ? { journeyDate, visitedStops: [...visitedStops, spotId], listenedStops }
    : { journeyDate, visitedStops, listenedStops: [...listenedStops, spotId] }
}
