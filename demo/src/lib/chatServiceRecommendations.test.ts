import assert from 'node:assert/strict'
import test from 'node:test'
import { lingshanProducts } from '../data/shopData.ts'
import { getChatServiceRecommendations } from './chatServiceRecommendations.ts'

test('uses the existing food catalog and nearby spot only when personalization is enabled', () => {
  const personalized = getChatServiceRecommendations({
    question: '我在梵宫附近，有什么好吃的？',
    personalizationEnabled: true,
    selectedSpotId: 'fan_gong'
  }, lingshanProducts)
  const generic = getChatServiceRecommendations({
    question: '我在梵宫附近，有什么好吃的？',
    personalizationEnabled: false,
    selectedSpotId: 'fan_gong'
  }, lingshanProducts)

  assert.equal(personalized[0]?.category, 'food')
  assert.equal(personalized[0]?.product.id, 'p_food_zhai')
  assert.equal(personalized[0]?.personalized, true)
  assert.equal(generic[0]?.product.id, 'p_food_congee')
  assert.equal(generic[0]?.personalized, false)
  assert.ok(personalized.every((item) => lingshanProducts.some((product) => product.id === item.product.id)))
})

test('does not show a service card for an ordinary scenic question', () => {
  assert.deepEqual(
    getChatServiceRecommendations({
      question: '梵宫的建筑有什么特色？',
      personalizationEnabled: true,
      selectedSpotId: 'fan_gong'
    }, lingshanProducts),
    []
  )
})

test('surfaces an actual transport service for a group transport question', () => {
  const recommendations = getChatServiceRecommendations({
    question: '带着四个人，观光电瓶车怎么坐更合适？',
    personalizationEnabled: true,
    selectedSpotId: 'giant_buddha',
    groupSize: 4
  }, lingshanProducts)

  assert.equal(recommendations[0]?.category, 'transport')
  assert.ok(recommendations.some((item) => item.product.id === 'p_trans_pass'))
})
