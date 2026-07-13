import assert from 'node:assert/strict'
import test from 'node:test'
import { getAudioPlaybackState, shouldOverrideMouthForm } from './live2dManager.ts'

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
