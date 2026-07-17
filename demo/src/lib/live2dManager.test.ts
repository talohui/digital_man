import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getAudioPlaybackState,
  getExpressionIdForState,
  getPreferredMotionForState,
  shouldOverrideMouthForm
} from './live2dManager.ts'

test('only generic speaking overrides the expression mouth form', () => {
  assert.equal(shouldOverrideMouthForm('speaking'), true)
  assert.equal(shouldOverrideMouthForm('happy'), false)
  assert.equal(shouldOverrideMouthForm('comfort'), false)
})

test('positive and neutral replies enter speaking state while audio plays', () => {
  assert.equal(getAudioPlaybackState('happy'), 'speaking')
  assert.equal(getAudioPlaybackState('normal'), 'speaking')
  assert.equal(getAudioPlaybackState('comfort'), 'comfort')
  assert.equal(getAudioPlaybackState('thinking'), 'thinking')
})

test('uses restrained guide expressions instead of the extreme stock presets', () => {
  assert.equal(getExpressionIdForState('normal'), 'f00')
  assert.equal(getExpressionIdForState('speaking'), 'mouth_smile')
  assert.equal(getExpressionIdForState('happy'), 'mouth_smile')
  assert.equal(getExpressionIdForState('comfort'), 'f00')

  for (const state of ['normal', 'speaking', 'listening', 'thinking', 'happy', 'comfort'] as const) {
    assert.doesNotMatch(getExpressionIdForState(state), /^(f01|f02|f04|f06)$/)
  }
})

test('keeps idle and happy states on the stable breathing motion', () => {
  assert.deepEqual(getPreferredMotionForState('normal'), { group: 'Idle', index: 0 })
  assert.deepEqual(getPreferredMotionForState('happy'), { group: 'Idle', index: 0 })
  assert.deepEqual(getPreferredMotionForState('comfort'), { group: 'Idle', index: 0 })
  assert.deepEqual(getPreferredMotionForState('speaking'), { group: 'Tap', index: 0 })
})
