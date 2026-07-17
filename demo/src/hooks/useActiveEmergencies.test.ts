import assert from 'node:assert/strict'
import test from 'node:test'

import { loadEmergencies, type EmergencyCache } from '../lib/emergencyCache.ts'
import type { EmergencyEvent } from '../api/emergencies.ts'

const event: EmergencyEvent = {
  id: 'event-1', type: 'ROAD_CLOSURE', title: '道路封闭', message: '请绕行', severity: 'WARNING',
  affectedSpotIds: [], affectedRouteIds: [], routePolicy: 'EXCLUDE',
  validFrom: '2026-07-13T09:00:00', validUntil: '2026-07-13T12:00:00'
}

test('uses only unexpired cached events and marks them stale after fetch failure', async () => {
  const cache: EmergencyCache = { fetchedAt: '2026-07-13T09:30:00', events: [event] }
  const result = await loadEmergencies({
    fetcher: async () => { throw new Error('offline') }, cache,
    now: new Date('2026-07-13T10:00:00')
  })
  assert.equal(result.stale, true)
  assert.equal(result.events.length, 1)
})

test('drops expired cached events on fetch failure', async () => {
  const cache: EmergencyCache = { fetchedAt: '2026-07-13T13:00:00', events: [event] }
  const result = await loadEmergencies({
    fetcher: async () => { throw new Error('offline') }, cache,
    now: new Date('2026-07-13T13:00:00')
  })
  assert.deepEqual(result.events, [])
})
