import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import type { Map3DGuideMapRuntime, ScenicMapPresentation } from '../pages/Map3DGuidePage'
import { restoreMapResumeCamera, saveMapResumeState } from '../lib/mapResumeState'

export function useMapResumeMemory(
  runtime: Map3DGuideMapRuntime | null,
  presentation: ScenicMapPresentation
) {
  const location = useLocation()
  const runtimeRef = useRef(runtime)
  const presentationRef = useRef(presentation)
  const urlRef = useRef(`${location.pathname}${location.search}${location.hash}`)

  runtimeRef.current = runtime
  presentationRef.current = presentation
  urlRef.current = `${location.pathname}${location.search}${location.hash}`

  useEffect(() => {
    if (!runtime) return
    const frame = window.requestAnimationFrame(() => {
      restoreMapResumeCamera(runtime.map, runtime.TMap, urlRef.current)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [runtime])

  useEffect(() => {
    const persist = () => {
      const current = runtimeRef.current
      if (!current) return
      saveMapResumeState({
        url: urlRef.current,
        map: current.map,
        presentation: presentationRef.current
      })
    }
    window.addEventListener('pagehide', persist)
    return () => {
      window.removeEventListener('pagehide', persist)
      persist()
    }
  }, [])
}

