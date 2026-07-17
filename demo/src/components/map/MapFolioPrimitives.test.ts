import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const primitives = readFileSync(new URL('./MapFolioPrimitives.tsx', import.meta.url), 'utf8')
const navigationCard = readFileSync(new URL('../../prototype-navigation/NavigationPrototypeCard.tsx', import.meta.url), 'utf8')
const routeFolio = readFileSync(new URL('../mobile/route/RouteItineraryFolio.tsx', import.meta.url), 'utf8')

test('provides semantic shared folio primitives', () => {
  assert.match(primitives, /export function MapFolioSurface/)
  assert.match(primitives, /export function MapFolioHeader/)
  assert.match(primitives, /export function MapFolioMetrics/)
  assert.match(primitives, /export function MapFolioActionPair/)
})

test('reuses the folio surface and metrics across route and navigation experiences', () => {
  assert.match(navigationCard, /<MapFolioSurface/)
  assert.match(navigationCard, /<MapFolioMetrics/)
  assert.match(routeFolio, /<MapFolioSurface/)
  assert.match(routeFolio, /<MapFolioMetrics/)
})
