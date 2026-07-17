import assert from 'node:assert/strict'
import test from 'node:test'

import { getPoiMedia, getRouteMedia, SCENIC_MEDIA_FALLBACK } from './scenicMediaCatalog.ts'

test('three public scenic routes resolve to distinct route media', () => {
  const covers = ['historical_culture', 'natural_scenery', 'family']
    .map((routeId) => getRouteMedia(routeId).cover)
  assert.equal(new Set(covers).size, 3)
})

test('POI aliases share catalog media and unknown POIs use fallback', () => {
  assert.equal(getPoiMedia('jiulong_bath').cover, getPoiMedia('jiulong_guanyu').cover)
  assert.equal(getPoiMedia('unknown-poi').cover, SCENIC_MEDIA_FALLBACK)
})
