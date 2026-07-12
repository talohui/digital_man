import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SPLASH_AUTO_FINISH_MS,
  SPLASH_DURATION_MS,
  getSplashImageIndex,
  pickRandomImages,
} from './splashImages.ts'

test('splash auto finish uses the production duration', () => {
  assert.equal(SPLASH_DURATION_MS, 5000)
  assert.equal(SPLASH_AUTO_FINISH_MS, SPLASH_DURATION_MS)
})

test('getSplashImageIndex loops through the selected images', () => {
  assert.equal(getSplashImageIndex(0, 3, 1600), 0)
  assert.equal(getSplashImageIndex(1700, 3, 1600), 1)
  assert.equal(getSplashImageIndex(3300, 3, 1600), 2)
  assert.equal(getSplashImageIndex(4900, 3, 1600), 0)
})

test('pickRandomImages returns three unique images when enough images exist', () => {
  const images = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png']
  const selected = pickRandomImages(images, 3, () => 0.42)

  assert.equal(selected.length, 3)
  assert.equal(new Set(selected).size, 3)
  assert.ok(selected.every((image) => images.includes(image)))
})

test('pickRandomImages loops available images when fewer than requested exist', () => {
  assert.deepEqual(pickRandomImages(['a.png', 'b.png'], 5, () => 0.2), [
    'a.png',
    'b.png',
    'a.png',
    'b.png',
    'a.png',
  ])
})

test('pickRandomImages returns an empty list when no images are configured', () => {
  assert.deepEqual(pickRandomImages([], 3, () => 0.2), [])
})
