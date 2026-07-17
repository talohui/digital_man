import assert from 'node:assert/strict'
import test from 'node:test'

import { getDefaultSpotId, guideRoutes } from './guideData.ts'

test('all guide routes start from the South Gate', () => {
  for (const route of guideRoutes) {
    assert.equal(route.stops[0]?.spotId, 'south_gate')
    assert.equal(getDefaultSpotId(route.id), 'south_gate')
  }
})
