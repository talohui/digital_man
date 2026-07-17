import assert from 'node:assert/strict'
import test from 'node:test'

import { getJourneyDateKey, recordJourneyStop } from '../lib/journeyTrail.ts'

test('formats the journey date with the local calendar day', () => {
  assert.equal(getJourneyDateKey(new Date(2026, 6, 7, 23, 30)), '2026-07-07')
})

test('journey writes clear stale-day stops and remain deduplicated', () => {
  const today = new Date(2026, 6, 17, 10, 0)
  const stale = {
    journeyDate: '2000-01-01',
    visitedStops: ['old-stop'],
    listenedStops: ['old-stop']
  }
  const visited = recordJourneyStop(stale, 'visitedStops', 'giant_buddha', today)
  const duplicateVisit = recordJourneyStop(visited, 'visitedStops', 'giant_buddha', today)
  const listened = recordJourneyStop(duplicateVisit, 'listenedStops', 'giant_buddha', today)
  const duplicateListen = recordJourneyStop(listened, 'listenedStops', 'giant_buddha', today)

  assert.equal(duplicateListen.journeyDate, '2026-07-17')
  assert.deepEqual(duplicateListen.visitedStops, ['giant_buddha'])
  assert.deepEqual(duplicateListen.listenedStops, ['giant_buddha'])
})
