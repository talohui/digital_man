import assert from 'node:assert/strict'
import test from 'node:test'

import {
  eventVersion,
  presentationFor,
  shouldAnnounce,
  type PublicEmergencyEvent
} from './emergencyPresentation.ts'

function emergency(severity: PublicEmergencyEvent['severity']): PublicEmergencyEvent {
  return {
    id: 'event-1', type: 'ROAD_CLOSURE', title: '道路封闭', message: '请绕行', severity,
    affectedSpotIds: ['puti_avenue'], affectedRouteIds: ['prayer_meditation'],
    validFrom: '2026-07-13T10:00:00', validUntil: '2026-07-13T12:00:00',
    routePolicy: 'EXCLUDE', updatedAt: '2026-07-13T10:05:00'
  }
}

test('critical event becomes modal and each event version is announced once', () => {
  const value = emergency('CRITICAL')
  assert.equal(presentationFor(value).mode, 'modal')
  assert.equal(shouldAnnounce(value, new Set()), true)
  assert.equal(shouldAnnounce(value, new Set([eventVersion(value)])), false)
})

test('noncritical event uses a compact banner', () => {
  assert.equal(presentationFor(emergency('WARNING')).mode, 'banner')
})
