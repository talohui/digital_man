import { AudioOutlined, LoadingOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'

import { getRouteItineraryMeta, type GuideRecommendationCard } from '../../../data/guideData'
import { ROUTE_PLANNER_SCENE_ID } from '../../../lib/guideScene'
import { unlockAudio } from '../../../lib/audioLipsync'
import { createVoiceAsr, getVoiceAsrModeLabel, isVoiceAsrAvailable } from '../../../lib/voiceAsr'
import type { BrowserAsr } from '../../../lib/browserAsr'
import { DEFAULT_ASSISTANT_GREETING, type ChatMessage } from '../../../store/chatSessions'
import { useChatStore } from '../../../store/useChatStore'
import CAppBottomSheet from '../overlays/CAppBottomSheet'
import {
  getRouteIdFromXiaolingReply,
  ROUTE_REQUEST_PRESETS,
  scoreRoute
} from './routePlanPresentation'

const EMPTY_ROUTE_MESSAGES: ChatMessage[] = []

type RoutePlannerAssistantSheetProps = {
  open: boolean
  routeProfileLabels: string[]
  selectedTags: string[]
  recommendation?: GuideRecommendationCard
  isLoading: boolean
  draft: string
  returnFocusRef: RefObject<HTMLButtonElement>
  onClose: () => void
  onAccept: () => void
  onDraftChange: (draft: string) => void
  onSubmit: (request: string) => void
  onRecommendationChange: (routeId: string) => void
}

function RoutePlannerAssistantSheet({
  open,
  routeProfileLabels,
  selectedTags,
  recommendation,
  isLoading,
  draft,
  returnFocusRef,
  onClose,
  onAccept,
  onDraftChange,
  onSubmit,
  onRecommendationChange
}: RoutePlannerAssistantSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdActiveRef = useRef(false)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const [voiceDraft, setVoiceDraft] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const recommendationMeta = recommendation ? getRouteItineraryMeta(recommendation.id) : null
  const planningProfile = useMemo(() => [
    routeProfileLabels.length ? `已选节奏：${routeProfileLabels.join('、')}` : '尚未填写行程节奏',
    selectedTags.length ? `兴趣心愿：${selectedTags.join('、')}` : '尚未选择主题心愿'
  ].join('；'), [routeProfileLabels, selectedTags])
  const messages = useChatStore((state) => state.sessions[ROUTE_PLANNER_SCENE_ID]?.messages ?? EMPTY_ROUTE_MESSAGES)
  const isConversationSending = useChatStore((state) => state.sessions[ROUTE_PLANNER_SCENE_ID]?.isSending ?? false)
  const conversationError = useChatStore((state) => state.sessions[ROUTE_PLANNER_SCENE_ID]?.lastError ?? '')
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const startRecord = useChatStore((state) => state.startRecord)
  const stopRecord = useChatStore((state) => state.stopRecord)
  const isRecording = useChatStore((state) => state.sessions[ROUTE_PLANNER_SCENE_ID]?.isRecording ?? false)
  const liveMessages = useMemo(
    () => messages
      .filter((message) => message.role !== 'system' && message.content !== DEFAULT_ASSISTANT_GREETING)
      .slice(-4),
    [messages]
  )
  const latestAssistantReply = useMemo(
    () => [...liveMessages].reverse().find((message) => message.role === 'assistant')?.content ?? '',
    [liveMessages]
  )

  useEffect(() => {
    const routeId = getRouteIdFromXiaolingReply(latestAssistantReply)
    if (routeId) onRecommendationChange(routeId)
  }, [latestAssistantReply, onRecommendationChange])

  useEffect(() => {
    if (!open) return
    initializeConnection()
    setActiveScene(ROUTE_PLANNER_SCENE_ID, {
      conversationMode: 'route-planning',
      routeName: '灵山路线规划',
      routePlanningProfile: planningProfile
    })
  }, [initializeConnection, open, planningProfile, setActiveScene])

  useEffect(() => {
    if (!open) return
    const backgroundElements = Array.from(document.querySelectorAll<HTMLElement>(
      '.plan-v2-page, .plan-v2-start-dock, .c-app-bottom-nav'
    )).map((element) => ({ element, wasInert: element.hasAttribute('inert') }))
    backgroundElements.forEach(({ element }) => element.setAttribute('inert', ''))
    const focusFrame = window.requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }))
    const keepFocusInsideDialog = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const dialog = document.getElementById('plan-v2-xiaoling-dialog')
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getAttribute('aria-hidden') !== 'true' && element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement
      if (!dialog.contains(activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keepFocusInsideDialog)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', keepFocusInsideDialog)
      backgroundElements.forEach(({ element, wasInert }) => {
        if (!wasInert) element.removeAttribute('inert')
      })
    }
  }, [open])

  const detachGlobalRelease = () => {
    releaseCleanupRef.current?.()
    releaseCleanupRef.current = null
  }

  const finishRecording = () => {
    holdActiveRef.current = false
    detachGlobalRelease()
    asrRef.current?.stop()
  }

  const submitPlanningMessage = (value: string) => {
    const request = value.trim()
    if (!request || isLoading) return
    onSubmit(request)
    void sendMessage(request, ROUTE_PLANNER_SCENE_ID)
  }

  const startRecording = async () => {
    setVoiceError('')
    setVoiceDraft('')
    void unlockAudio()
    if (!isVoiceAsrAvailable()) {
      setVoiceError('当前浏览器无法使用麦克风，请直接打字告诉小灵。')
      return
    }
    if (asrRef.current || isLoading) return
    startRecord(ROUTE_PLANNER_SCENE_ID)
    asrRef.current = createVoiceAsr({
      onInterim: setVoiceDraft,
      onFinal: (text) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(ROUTE_PLANNER_SCENE_ID)
        setVoiceDraft('')
        submitPlanningMessage(text)
      },
      onError: (message) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(ROUTE_PLANNER_SCENE_ID)
        setVoiceDraft('')
        setVoiceError(message)
      }
    })
    asrRef.current.start()
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

  const handleVoicePointerDown = async (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (isRecording || isLoading) return
    holdActiveRef.current = true
    await startRecording()
    if (!asrRef.current) holdActiveRef.current = false
  }

  const handleVoiceKeyDown = async (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    if (isRecording || isLoading) return
    holdActiveRef.current = true
    await startRecording()
    if (!asrRef.current) holdActiveRef.current = false
  }

  const handleVoiceKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    finishRecording()
  }

  useEffect(() => () => {
    detachGlobalRelease()
    asrRef.current?.abort()
    asrRef.current = null
    stopRecord(ROUTE_PLANNER_SCENE_ID)
  }, [stopRecord])

  if (!open) return null

  const closeAndRestoreFocus = () => {
    detachGlobalRelease()
    asrRef.current?.abort()
    asrRef.current = null
    stopRecord(ROUTE_PLANNER_SCENE_ID)
    onClose()
    window.requestAnimationFrame(() => returnFocusRef.current?.focus({ preventScroll: true }))
  }
  const statusText = voiceError || conversationError

  return (
    <CAppBottomSheet
      title="和小灵一起定路线"
      eyebrow="小灵 · 今日行程卷"
      onClose={closeAndRestoreFocus}
      closeLabel="暂合"
      className="plan-v2-xiaoling-panel"
      dialogId="plan-v2-xiaoling-dialog"
    >
      <div className="plan-v2-xiaoling-panel__conversation" aria-live="polite">
        <p className="plan-v2-xiaoling-panel__message plan-v2-xiaoling-panel__message--assistant">
          我已读到你的行旅笺：{planningProfile}。你可以打字，也可以按住麦克风直接告诉我。
        </p>
        {liveMessages.map((message) => (
          <p
            key={message.id}
            className={message.role === 'user'
              ? 'plan-v2-xiaoling-panel__message is-visitor'
              : 'plan-v2-xiaoling-panel__message plan-v2-xiaoling-panel__message--assistant'}
          >
            {message.content}
          </p>
        ))}
        {isConversationSending ? (
          <p className="plan-v2-xiaoling-panel__message plan-v2-xiaoling-panel__message--assistant plan-v2-xiaoling-panel__message--thinking">
            <LoadingOutlined spin aria-hidden /> 小灵正在梳理这趟行程…
          </p>
        ) : null}
      </div>
      {recommendation ? (
        <div className="plan-v2-xiaoling-panel__recommendation">
          <span>小灵的路线建议</span>
          <strong>{recommendation.name}</strong>
          <small>{recommendation.reason || recommendation.description}</small>
          <b>{scoreRoute(recommendation)}<em>{recommendationMeta ? `${recommendationMeta.durationLabel} · ${recommendationMeta.stopCount}站` : '顺路成卷'}</em></b>
          <button type="button" disabled={isLoading} onClick={onAccept}>{isLoading ? '正在重新排卷' : '采用这条路线'} <i>›</i></button>
        </div>
      ) : null}
      <div className="plan-v2-xiaoling-panel__presets" aria-label="快捷补充需求">
        {ROUTE_REQUEST_PRESETS.map((item) => <button key={item} type="button" disabled={isLoading} onClick={() => submitPlanningMessage(item)}>{item}</button>)}
      </div>
      <form className="plan-v2-xiaoling-panel__composer" onSubmit={(event) => { event.preventDefault(); submitPlanningMessage(draft) }}>
        <button
          className={`plan-v2-xiaoling-panel__voice ${isRecording ? 'is-listening' : ''}`}
          type="button"
          disabled={isLoading}
          aria-label={isRecording ? '正在录音，松手发送' : '按住说话，松手发送'}
          onPointerDown={handleVoicePointerDown}
          onKeyDown={handleVoiceKeyDown}
          onKeyUp={handleVoiceKeyUp}
        >
          {isRecording ? <LoadingOutlined spin aria-hidden /> : <AudioOutlined aria-hidden />}
          <small>{isRecording ? '松手发送' : '按住说话'}</small>
        </button>
        <textarea
          ref={textareaRef}
          value={isRecording && voiceDraft ? voiceDraft : draft}
          onChange={(event) => onDraftChange(event.target.value)}
          rows={2}
          placeholder="例如：下午带父母来，想少走路，重点看大佛和梵宫"
          aria-label="告诉小灵你的路线想法"
          readOnly={isRecording}
        />
        <button type="submit" disabled={isLoading || !draft.trim()}>{isLoading ? '正在排卷' : '请小灵重排'}</button>
        <p className="plan-v2-xiaoling-panel__voice-hint" role="status">
          {statusText || (isRecording ? (voiceDraft || '正在聆听，松手后自动发送。') : getVoiceAsrModeLabel())}
        </p>
      </form>
    </CAppBottomSheet>
  )
}

export default RoutePlannerAssistantSheet
export type { RoutePlannerAssistantSheetProps }
