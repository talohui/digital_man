import { createJSONStorage, type StateStorage } from 'zustand/middleware'

const memory = new Map<string, string>()

const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => void memory.set(name, value),
  removeItem: (name) => void memory.delete(name)
}

export const guideSessionStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') return memoryStorage
  try {
    const key = '__lingshan_guide_storage_probe__'
    window.sessionStorage.setItem(key, key)
    window.sessionStorage.removeItem(key)
    return window.sessionStorage
  } catch {
    return memoryStorage
  }
})
