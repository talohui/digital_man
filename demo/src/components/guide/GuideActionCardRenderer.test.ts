import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = readFileSync(new URL('./GuideActionCardRenderer.tsx', import.meta.url), 'utf8')

test('renders every route card supplied by the guide payload', () => {
  assert.match(source, /payload\.items\.map\(\(item\) =>/)
  assert.match(source, /key=\{item\.routeId\}/)
  assert.doesNotMatch(source, /payload\.items\[0\]/)
})

test('routes every supported payload through the generic recommendation card', () => {
  assert.match(source, /import \{ GuideRecommendationCard \}/)
  assert.equal(source.match(/<GuideRecommendationCard/g)?.length, 5)
  assert.match(source, /kind: 'route'/)
  assert.match(source, /kind: 'poi'/)
  assert.match(source, /kind: 'navigation'/)
  assert.match(source, /kind: 'next-stop'/)
  assert.match(source, /kind: 'progress'/)
})
