export const LINGSHAN_SPLASH_STORAGE_KEY = 'hasSeenLingshanSplash'

export type IntroStorage = Pick<Storage, 'getItem' | 'setItem'>

function getDefaultStorage(): IntroStorage | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}

export function shouldShowLingshanSplash(storage: IntroStorage | undefined = getDefaultStorage()) {
  if (!storage) {
    return true
  }

  try {
    return storage.getItem(LINGSHAN_SPLASH_STORAGE_KEY) !== 'true'
  } catch {
    return true
  }
}

export function markLingshanSplashSeen(storage: IntroStorage | undefined = getDefaultStorage()) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(LINGSHAN_SPLASH_STORAGE_KEY, 'true')
  } catch {
    // Browsers can deny storage in private or restricted contexts.
  }
}
