import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GUIDE_GPS_CONFIDENCE_THRESHOLD,
  TOUR_GUIDE_SCENE_ID,
  resolveGuideSpotContext
} from './guideScene.ts'

test('uses one stable scene for the full guide conversation', () => {
  assert.equal(TOUR_GUIDE_SCENE_ID, 'tour-guide')
})

test('prefers an explicit spot page over map and GPS state', () => {
  assert.deepEqual(
    resolveGuideSpotContext({
      spotPageId: 'giant-buddha',
      mapSelectedId: 'fan-gong',
      gpsSpotId: 'jiulong',
      gpsConfidence: 0.9,
      defaultSpotId: 'screen-wall'
    }),
    { spotId: 'giant-buddha', source: 'spot-page', confidence: 1 }
  )
})

test('prefers map selection and route progress over GPS', () => {
  assert.equal(
    resolveGuideSpotContext({
      mapSelectedId: 'fan-gong',
      routeProgressId: 'jiulong',
      gpsSpotId: 'giant-buddha',
      gpsConfidence: 0.95,
      defaultSpotId: 'screen-wall'
    }).source,
    'map-selection'
  )

  assert.equal(
    resolveGuideSpotContext({
      routeProgressId: 'jiulong',
      gpsSpotId: 'giant-buddha',
      gpsConfidence: 0.95,
      defaultSpotId: 'screen-wall'
    }).source,
    'route-progress'
  )
})

test('rejects low-confidence GPS and falls back to the route default', () => {
  assert.equal(GUIDE_GPS_CONFIDENCE_THRESHOLD, 0.65)
  assert.deepEqual(
    resolveGuideSpotContext({
      gpsSpotId: 'giant-buddha',
      gpsConfidence: 0.3,
      defaultSpotId: 'screen-wall'
    }),
    { spotId: 'screen-wall', source: 'route-default', confidence: 1 }
  )
})

test('uses GPS only when its confidence reaches the threshold', () => {
  assert.deepEqual(
    resolveGuideSpotContext({
      gpsSpotId: 'giant-buddha',
      gpsConfidence: GUIDE_GPS_CONFIDENCE_THRESHOLD,
      defaultSpotId: 'screen-wall'
    }),
    {
      spotId: 'giant-buddha',
      source: 'gps',
      confidence: GUIDE_GPS_CONFIDENCE_THRESHOLD
    }
  )
})
