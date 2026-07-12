export const SPLASH_DURATION_MS = 5000
// Set this to null when you want the splash to stay on screen for visual tuning.
export const SPLASH_AUTO_FINISH_MS: number | null = SPLASH_DURATION_MS
export const SPLASH_IMAGE_COUNT = 3
export const SPLASH_IMAGE_INTERVAL_MS = Math.ceil(SPLASH_DURATION_MS / SPLASH_IMAGE_COUNT)

// Keep this list in sync with public/intro/splash-assets.json when adding or renaming splash images.
export const SPLASH_IMAGE_URLS = [
  '/intro/splash/splash-01.webp',
  '/intro/splash/splash-02.webp',
  '/intro/splash/splash-03.webp',
  '/intro/splash/splash-04.webp',
  '/intro/splash/splash-05.webp',
]

export function pickRandomImages(
  images: string[],
  count = SPLASH_IMAGE_COUNT,
  random: () => number = Math.random,
) {
  if (images.length === 0 || count <= 0) {
    return []
  }

  if (images.length < count) {
    return Array.from({ length: count }, (_, index) => images[index % images.length])
  }

  const shuffled = [...images]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled.slice(0, count)
}

export function getSplashImageIndex(elapsedMs: number, imageCount: number, intervalMs = SPLASH_IMAGE_INTERVAL_MS) {
  if (imageCount <= 0 || intervalMs <= 0) {
    return 0
  }

  return Math.floor(elapsedMs / intervalMs) % imageCount
}
