import { useSyncExternalStore } from 'react'

export type XiaolingPresentationMode = 'hidden' | 'badge' | 'drawer' | 'fullscreen'

type PortraitState = {
  url: string
  ready: boolean
  failed: boolean
}

let portraitState: PortraitState = { url: '', ready: false, failed: false }
const listeners = new Set<() => void>()
let warned = false

function emit(next: PortraitState) {
  portraitState = next
  listeners.forEach((listener) => listener())
}

export function captureXiaolingPortrait(source: HTMLCanvasElement) {
  if (portraitState.ready) return portraitState.url
  try {
    const output = document.createElement('canvas')
    const size = 192
    output.width = size
    output.height = size
    const context = output.getContext('2d')
    if (!context) throw new Error('2D canvas context unavailable')

    context.clearRect(0, 0, size, size)
    context.drawImage(source, 0, 0, source.width, source.height, 0, 0, size, size)
    const url = output.toDataURL('image/png')
    emit({ url, ready: true, failed: false })
    return url
  } catch (error) {
    emit({ url: '', ready: false, failed: true })
    if (import.meta.env.DEV && !warned) {
      warned = true
      console.warn('[XiaolingPortrait] Live2D portrait capture failed; using the legacy fallback.', error)
    }
    return ''
  }
}

export function getXiaolingPortraitSnapshot() {
  return portraitState
}

export function subscribeXiaolingPortrait(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useXiaolingPortrait() {
  return useSyncExternalStore(subscribeXiaolingPortrait, getXiaolingPortraitSnapshot, getXiaolingPortraitSnapshot)
}
