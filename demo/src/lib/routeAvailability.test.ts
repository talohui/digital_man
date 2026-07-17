import assert from 'node:assert/strict'
import test from 'node:test'
import { availableStopIds, routeAvailability } from './routeAvailability.ts'

const route = { id: 'route-a', stopIds: ['entrance', 'show', 'temple', 'exit'] }
const emergency = (value: Partial<any>) => ({ routePolicy: 'EXCLUDE', affectedSpotIds: [], affectedRouteIds: [], title: '临时通知', ...value })

test('intersects backend-adjusted stops and excludes emergency-closed spots', () => {
  assert.deepEqual(availableStopIds(route, ['entrance', 'show', 'exit'], [emergency({ affectedSpotIds: ['show'] })]), ['entrance', 'exit'])
})

test('route-wide exclusion yields no safe route while penalty keeps stops', () => {
  assert.deepEqual(availableStopIds(route, undefined, [emergency({ affectedRouteIds: ['route-a'] })]), [])
  assert.deepEqual(availableStopIds(route, undefined, [emergency({ routePolicy: 'PENALIZE', affectedSpotIds: ['show'] })]), route.stopIds)
})

test('explains blocked stops without leaking unrelated emergencies', () => {
  const result = routeAvailability(route, undefined, [
    emergency({ title: '九龙灌浴暂停', affectedSpotIds: ['show'] }),
    emergency({ title: '其他路线', affectedRouteIds: ['route-b'] })
  ])
  assert.deepEqual(result.blockedSpotIds, ['show'])
  assert.deepEqual(result.reasons, ['九龙灌浴暂停'])
})
