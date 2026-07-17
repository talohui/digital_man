import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAdminDemoFrame,
  createSeededRandom,
  toDemoTick,
} from './adminDemoTimeline.ts'

const options = {
  activeWindowMinutes: 5,
  sessionStartedAtMs: 1_000_000,
} as const

test('normalizes milliseconds to an integer demo tick', () => {
  assert.equal(toDemoTick(1_010_999), 1_010)
})

test('returns the same frame for the same tick and options', () => {
  assert.deepEqual(
    buildAdminDemoFrame(1_010, options),
    buildAdminDemoFrame(1_010, options),
  )
})

test('changes a live signal on the next second without reducing cumulative values', () => {
  const first = buildAdminDemoFrame(1_010, options)
  const next = buildAdminDemoFrame(1_011, options)

  assert.notEqual(next.liveSignal, first.liveSignal)
  assert.ok(next.cumulative.totalMessages >= first.cumulative.totalMessages)
  assert.ok(next.cumulative.totalAiReplies >= first.cumulative.totalAiReplies)
  assert.ok(next.recommendation.exposureCount >= first.recommendation.exposureCount)
  assert.ok(next.recommendation.clickCount >= first.recommendation.clickCount)
  assert.ok(next.commerce.ticketCount >= first.commerce.ticketCount)
  assert.ok(next.commerce.purchaseCount >= first.commerce.purchaseCount)
  assert.ok(next.commerce.totalAmount >= first.commerce.totalAmount)
})

test('keeps recommendation, latency, ratio and commerce relationships valid', () => {
  for (let tick = 1_000; tick < 1_180; tick += 1) {
    const frame = buildAdminDemoFrame(tick, options)
    const costMixTotal = frame.commerce.costMix.reduce((sum, item) => sum + item.amount, 0)

    assert.ok(frame.recommendation.clickCount <= frame.recommendation.exposureCount)
    assert.equal(frame.recommendation.ctr, frame.recommendation.clickCount / frame.recommendation.exposureCount)
    assert.ok(frame.quality.p90LatencyMs >= frame.quality.avgLatencyMs)
    assert.ok(frame.quality.maxLatencyMs >= frame.quality.p90LatencyMs)
    assert.ok(frame.quality.positiveRatio >= 0 && frame.quality.positiveRatio <= 1)
    assert.equal(costMixTotal, frame.commerce.totalAmount)
  }
})

test('keeps official history mode fixed across ticks', () => {
  assert.deepEqual(
    buildAdminDemoFrame(1_010, { ...options, mode: 'history' }),
    buildAdminDemoFrame(1_110, { ...options, mode: 'history' }),
  )
})

test('creates a repeatable seeded random sequence', () => {
  const first = createSeededRandom(42)
  const second = createSeededRandom(42)

  assert.deepEqual(
    [first(), first(), first()],
    [second(), second(), second()],
  )
})

test('keeps hotspot rankings deterministic and within the heat scale', () => {
  const first = buildAdminDemoFrame(1_010, options)
  const repeated = buildAdminDemoFrame(1_010, options)
  const next = buildAdminDemoFrame(1_011, options)

  assert.deepEqual(first.spotLoads, repeated.spotLoads)
  assert.ok(first.spotLoads.every((spot) => spot.level >= 0 && spot.level <= 100))
  assert.ok(next.spotLoads.some((spot) => {
    const previous = first.spotLoads.find((candidate) => candidate.id === spot.id)
    return previous?.level !== spot.level
  }))
})
