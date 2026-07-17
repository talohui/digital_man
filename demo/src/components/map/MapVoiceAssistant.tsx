import { AudioOutlined, LoadingOutlined, ReadOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { getGuideRouteById, guideSpots } from '../../data/guideData'
import { unlockAudio } from '../../lib/audioLipsync'
import { TOUR_GUIDE_SCENE_ID } from '../../lib/guideScene'
import { getMapVoiceStatus } from '../../lib/mapVoiceStatus'
import { createVoiceAsr, isVoiceAsrAvailable } from '../../lib/voiceAsr'
import type { BrowserAsr } from '../../lib/browserAsr'
import { getSession } from '../../store/chatSessions'
import { useChatStore } from '../../store/useChatStore'
import { useGuideStore } from '../../store/useGuideStore'

function MapVoiceAssistant() {
  const navigate = useNavigate()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const isRecording = useChatStore((state) => getSession(state.sessions, TOUR_GUIDE_SCENE_ID).isRecording)
  const isSending = useChatStore((state) => getSession(state.sessions, TOUR_GUIDE_SCENE_ID).isSending)
  const lastError = useChatStore((state) => getSession(state.sessions, TOUR_GUIDE_SCENE_ID).lastError)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const startRecord = useChatStore((state) => state.startRecord)
  const stopRecord = useChatStore((state) => state.stopRecord)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdActiveRef = useRef(false)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const [voiceDraft, setVoiceDraft] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [hasAnswered, setHasAnswered] = useState(false)

  const route = useMemo(() => getGuideRouteById(activeRouteId), [activeRouteId])
  const selectedSpot = useMemo(
    () => guideSpots.find((spot) => spot.id === selectedSpotId) ?? null,
    [selectedSpotId]
  )
  const error = voiceError || lastError
  const status = getMapVoiceStatus({ isRecording, isSending, hasAnswered, error })

  const activateGuideScene = () => {
    setActiveScene(TOUR_GUIDE_SCENE_ID, {
      routeId: route.id,
      routeName: route.name,
      ...(selectedSpot
        ? {
            spotId: selectedSpot.id,
            spotName: selectedSpot.name,
            spotIntro: selectedSpot.intro
          }
        : {})
    })
  }

  const detachGlobalRelease = () => {
    releaseCleanupRef.current?.()
    releaseCleanupRef.current = null
  }

  const finishRecording = () => {
    if (!holdActiveRef.current && !asrRef.current) {
      stopRecord(TOUR_GUIDE_SCENE_ID)
      return
    }

    holdActiveRef.current = false
    detachGlobalRelease()
    if (!asrRef.current) {
      stopRecord(TOUR_GUIDE_SCENE_ID)
      return
    }
    asrRef.current.stop()
  }

  const attachGlobalRelease = () => {
    detachGlobalRelease()
    const onRelease = () => {
      if (holdActiveRef.current) finishRecording()
    }
    window.addEventListener('pointerup', onRelease, true)
    window.addEventListener('mouseup', onRelease, true)
    window.addEventListener('pointercancel', onRelease, true)
    releaseCleanupRef.current = () => {
      window.removeEventListener('pointerup', onRelease, true)
      window.removeEventListener('mouseup', onRelease, true)
      window.removeEventListener('pointercancel', onRelease, true)
    }
  }

  const startRecording = async () => {
    activateGuideScene()
    setVoiceError('')
    setVoiceDraft('')
    setHasAnswered(false)
    void unlockAudio()

    if (!isVoiceAsrAvailable()) {
      setVoiceError('当前浏览器无法使用麦克风，请进入文字对话提问。')
      return
    }
    if (asrRef.current || isSending) return

    startRecord(TOUR_GUIDE_SCENE_ID)
    asrRef.current = createVoiceAsr({
      onInterim: setVoiceDraft,
      onFinal: (text) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(TOUR_GUIDE_SCENE_ID)
        setVoiceDraft('')

        const message = text.trim()
        if (!message) return

        setHasAnswered(true)
        void sendMessage(message, TOUR_GUIDE_SCENE_ID)
      },
      onError: (message) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(TOUR_GUIDE_SCENE_ID)
        setVoiceDraft('')
        setVoiceError(message)
      }
    })
    asrRef.current.start()
    attachGlobalRelease()
  }

  const handlePointerDown = async (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (isRecording || isSending) return
    holdActiveRef.current = true
    await startRecording()
    if (!asrRef.current) holdActiveRef.current = false
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    if (isRecording || isSending) return
    holdActiveRef.current = true
    await startRecording()
    if (!asrRef.current) holdActiveRef.current = false
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    finishRecording()
  }

  useEffect(() => () => {
    detachGlobalRelease()
    asrRef.current?.abort()
    asrRef.current = null
  }, [])

  const statusText = useMemo(() => {
    if (status === 'recording') return voiceDraft ? `正在聆听：${voiceDraft}` : '正在聆听，松手发送'
    if (status === 'answering') return '小灵正在回答'
    if (status === 'answered') return '小灵已回答，点这里查看文字'
    if (status === 'error') return error
    return '按住说话，问问小灵'
  }, [error, status, voiceDraft])

  return (
    <section className={`map-voice-assistant map-voice-assistant--${status}`} aria-label="向小灵语音提问">
      <img className="map-voice-assistant__avatar" src="/icons/lingshan-guide-avatar-real.png" alt="小灵" />
      <div className="map-voice-assistant__copy" aria-live="polite">
        <strong>小灵</strong>
        <span>{statusText}</span>
      </div>
      {status === 'answered' ? (
        <button className="map-voice-assistant__text-link" type="button" onClick={() => navigate('/guide')}>
          <ReadOutlined aria-hidden />
          查看文字
        </button>
      ) : (
        <button
          className="map-voice-assistant__hold"
          type="button"
          disabled={isSending}
          aria-label={isRecording ? '正在录音，松手发送' : '按住说话，松手发送'}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        >
          {isSending ? <LoadingOutlined aria-hidden spin /> : <AudioOutlined aria-hidden />}
          <span>{isRecording ? '松手发送' : '按住说话'}</span>
        </button>
      )}
    </section>
  )
}

export { MapVoiceAssistant }
