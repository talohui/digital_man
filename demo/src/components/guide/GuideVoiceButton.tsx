import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

import type { BrowserAsr } from '../../lib/browserAsr'
import { unlockAudio } from '../../lib/audioLipsync'
import { createVoiceAsr, isVoiceAsrAvailable } from '../../lib/voiceAsr'

type VoiceState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error'

export function GuideVoiceButton({
  className,
  disabled = false,
  onInterrupt,
  onTranscript
}: {
  className?: string
  disabled?: boolean
  onInterrupt?: () => void | Promise<void>
  onTranscript: (text: string) => void
}) {
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdingRef = useRef(false)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const interruptPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState('')

  const detachGlobalRelease = () => {
    releaseCleanupRef.current?.()
    releaseCleanupRef.current = null
  }

  const finishRecording = () => {
    holdingRef.current = false
    detachGlobalRelease()
    if (!asrRef.current) {
      setState((current) => current === 'requesting' ? 'idle' : current)
      return
    }
    setState('processing')
    asrRef.current.stop()
  }

  const attachGlobalRelease = () => {
    detachGlobalRelease()
    const release = () => {
      if (holdingRef.current) finishRecording()
    }
    window.addEventListener('pointerup', release, true)
    window.addEventListener('mouseup', release, true)
    window.addEventListener('pointercancel', release, true)
    releaseCleanupRef.current = () => {
      window.removeEventListener('pointerup', release, true)
      window.removeEventListener('mouseup', release, true)
      window.removeEventListener('pointercancel', release, true)
    }
  }

  const startRecording = () => {
    setError('')
    if (!isVoiceAsrAvailable()) {
      setError('当前浏览器无法使用麦克风，请改用文字提问。')
      setState('error')
      holdingRef.current = false
      detachGlobalRelease()
      return
    }

    setState('requesting')
    void unlockAudio()

    const asr = createVoiceAsr({
      onInterim: () => setState('recording'),
      onFinal: (text) => {
        asrRef.current = null
        holdingRef.current = false
        detachGlobalRelease()
        const normalized = text.trim()
        setState('idle')
        if (normalized) {
          void interruptPromiseRef.current.then(() => onTranscript(normalized))
        }
      },
      onError: (message) => {
        asrRef.current = null
        holdingRef.current = false
        detachGlobalRelease()
        setError(message)
        setState('error')
      }
    })
    asrRef.current = asr
    setState('recording')
    asr.start()
  }

  const beginHold = () => {
    if (disabled || holdingRef.current || asrRef.current) return
    try {
      interruptPromiseRef.current = Promise.resolve(onInterrupt?.()).catch(() => undefined)
    } catch {
      interruptPromiseRef.current = Promise.resolve()
    }
    holdingRef.current = true
    attachGlobalRelease()
    startRecording()
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    beginHold()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    beginHold()
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    finishRecording()
  }

  useEffect(() => () => {
    holdingRef.current = false
    detachGlobalRelease()
    asrRef.current?.abort()
    asrRef.current = null
  }, [])

  const recording = state === 'recording' || state === 'requesting'
  const label = recording
    ? '正在录音，松手发送'
    : state === 'processing'
      ? '正在识别语音'
      : error || '按住说话，松手发送'

  return (
    <button
      type="button"
      className={`${className ?? ''}${recording ? ' is-recording' : ''}`.trim()}
      disabled={disabled || state === 'processing'}
      aria-label={label}
      title={label}
      data-voice-state={state}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {recording ? '◉' : state === 'processing' ? '…' : '◎'}
    </button>
  )
}
