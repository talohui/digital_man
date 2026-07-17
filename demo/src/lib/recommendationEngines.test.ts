import assert from 'node:assert/strict'
import test from 'node:test'
import { visibleRecommendationEngines } from './recommendationEngines.ts'

test('removes Gorse collaborative filtering from recommendation monitoring', () => {
  const visible = visibleRecommendationEngines([
    { engine: '规则推荐', count: 1024 },
    { engine: 'Gorse 协同过滤', count: 856 },
    { engine: 'RAG 场景召回', count: 506 },
  ])

  assert.deepEqual(visible, [
    { engine: '规则推荐', count: 1024 },
    { engine: 'RAG 场景召回', count: 506 },
  ])
})

test('also removes collaborative filtering labels returned by live APIs', () => {
  const visible = visibleRecommendationEngines([
    { engine: '协同过滤', count: 20 },
    { engine: 'gorse', count: 10 },
    { engine: '规则推荐', count: 30 },
  ])

  assert.deepEqual(visible, [{ engine: '规则推荐', count: 30 }])
})
