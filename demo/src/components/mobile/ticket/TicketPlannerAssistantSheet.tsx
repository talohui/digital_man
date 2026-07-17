import { AudioOutlined, LoadingOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

import { unlockAudio } from '../../../lib/audioLipsync'
import { TICKET_PLANNER_SCENE_ID } from '../../../lib/guideScene'
import { createVoiceAsr, getVoiceAsrModeLabel, isVoiceAsrAvailable } from '../../../lib/voiceAsr'
import type { BrowserAsr } from '../../../lib/browserAsr'
import { DEFAULT_ASSISTANT_GREETING, type ChatMessage } from '../../../store/chatSessions'
import { useChatStore } from '../../../store/useChatStore'
import CAppBottomSheet from '../overlays/CAppBottomSheet'

const EMPTY_TICKET_MESSAGES: ChatMessage[] = []
const TICKET_REQUEST_PRESETS = ['一个老人，两个大人，想少走路', '带孩子，想轻松游览', '两位成人，想看梵宫和佛文化']

type TicketPlannerAssistantSheetProps = {
  open: boolean
  profileLabels: string[]
  ticketCatalogPrompt: string
  entryTicketCount: number
  shuttlePrice: number
  draft: string
  onClose: () => void
  onDraftChange: (value: string) => void
  onAddShuttle: (quantity: number) => string
}

function TicketPlannerAssistantSheet({
  open,
  profileLabels,
  ticketCatalogPrompt,
  entryTicketCount,
  shuttlePrice,
  draft,
  onClose,
  onDraftChange,
  onAddShuttle
}: TicketPlannerAssistantSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdActiveRef = useRef(false)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const [voiceDraft, setVoiceDraft] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [cartStatus, setCartStatus] = useState('')
  const messages = useChatStore((state) => state.sessions[TICKET_PLANNER_SCENE_ID]?.messages ?? EMPTY_TICKET_MESSAGES)
  const isConversationSending = useChatStore((state) => state.sessions[TICKET_PLANNER_SCENE_ID]?.isSending ?? false)
  const conversationError = useChatStore((state) => state.sessions[TICKET_PLANNER_SCENE_ID]?.lastError ?? '')
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const startRecord = useChatStore((state) => state.startRecord)
  const stopRecord = useChatStore((state) => state.stopRecord)
  const isRecording = useChatStore((state) => state.sessions[TICKET_PLANNER_SCENE_ID]?.isRecording ?? false)
  const ticketPlanningProfile = useMemo(
    () => profileLabels.length ? profileLabels.join('；') : '尚未填写同行卡，请以游客本次描述为准。',
    [profileLabels]
  )
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
  const recommendsShuttle = latestAssistantReply.includes('观光车单独购票')
  const suggestedShuttleQuantity = Math.max(1, Math.min(9, entryTicketCount))

  useEffect(() => {
    if (!open) return
    initializeConnection()
    setActiveScene(TICKET_PLANNER_SCENE_ID, {
      conversationMode: 'ticket-planning',
      routeName: '灵山入园票笺',
      ticketPlanningProfile,
      ticketCatalogPrompt
    })
  }, [initializeConnection, open, setActiveScene, ticketCatalogPrompt, ticketPlanningProfile])

  useEffect(() => {
    if (!open) return
    const focusFrame = window.requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(focusFrame)
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

  const submitTicketMessage = (value: string) => {
    const request = value.trim()
    if (!request || isConversationSending) return
    setCartStatus('')
    onDraftChange('')
    void sendMessage(request, TICKET_PLANNER_SCENE_ID)
  }

  const startRecording = async () => {
    setVoiceError('')
    setVoiceDraft('')
    void unlockAudio()
    if (!isVoiceAsrAvailable()) {
      setVoiceError('当前浏览器无法使用麦克风，请直接打字告诉小灵。')
      return
    }
    if (asrRef.current || isConversationSending) return
    startRecord(TICKET_PLANNER_SCENE_ID)
    asrRef.current = createVoiceAsr({
      onInterim: setVoiceDraft,
      onFinal: (text) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(TICKET_PLANNER_SCENE_ID)
        setVoiceDraft('')
        submitTicketMessage(text)
      },
      onError: (message) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(TICKET_PLANNER_SCENE_ID)
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
    if (isRecording || isConversationSending) return
    holdActiveRef.current = true
    await startRecording()
    if (!asrRef.current) holdActiveRef.current = false
  }

  const handleVoiceKeyDown = async (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    if (isRecording || isConversationSending) return
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
    stopRecord(TICKET_PLANNER_SCENE_ID)
  }, [stopRecord])

  if (!open) return null

  const statusText = voiceError || conversationError

  return (
    <CAppBottomSheet
      title="和小灵一起择票"
      eyebrow="小灵 · 入园票笺"
      onClose={onClose}
      closeLabel="暂合"
      className="ticket-v2-xiaoling-panel"
      dialogId="ticket-v2-xiaoling-dialog"
    >
      <div className="ticket-v2-xiaoling-panel__conversation" aria-live="polite">
        <p className="ticket-v2-xiaoling-panel__message ticket-v2-xiaoling-panel__message--assistant">
          我会按当前票笺目录说明价格和适用条件。{ticketPlanningProfile}。你可以打字，也可以按住麦克风告诉我同行人与游览需求。
        </p>
        {liveMessages.map((message) => (
          <p
            key={message.id}
            className={message.role === 'user'
              ? 'ticket-v2-xiaoling-panel__message ticket-v2-xiaoling-panel__message--visitor'
              : 'ticket-v2-xiaoling-panel__message ticket-v2-xiaoling-panel__message--assistant'}
          >
            {message.content}
          </p>
        ))}
        {isConversationSending ? (
          <p className="ticket-v2-xiaoling-panel__message ticket-v2-xiaoling-panel__message--assistant ticket-v2-xiaoling-panel__message--thinking">
            <LoadingOutlined spin aria-hidden /> 小灵正在核对这份票笺…
          </p>
        ) : null}
      </div>

      {recommendsShuttle ? (
        <div className="ticket-v2-xiaoling-panel__ticket">
          <span>小灵的择票建议</span>
          <strong>按资格择票 · 加购观光车</strong>
          <small>仅加入园内交通，不替代入园票资格核验。网购联票已含观光车，请勿重复加入。</small>
          <b>{`¥${shuttlePrice}/人`}</b>
          <button
            type="button"
            onClick={() => setCartStatus(onAddShuttle(suggestedShuttleQuantity))}
          >
            将 {suggestedShuttleQuantity} 份观光车加入清单 <i>›</i>
          </button>
          {cartStatus ? <p className="ticket-v2-xiaoling-panel__cart-status" role="status">{cartStatus}</p> : null}
        </div>
      ) : null}

      <div className="ticket-v2-xiaoling-panel__presets" aria-label="快捷补充需求">
        {TICKET_REQUEST_PRESETS.map((item) => (
          <button key={item} type="button" disabled={isConversationSending} onClick={() => submitTicketMessage(item)}>{item}</button>
        ))}
      </div>
      <form className="ticket-v2-xiaoling-panel__composer" onSubmit={(event) => { event.preventDefault(); submitTicketMessage(draft) }}>
        <button
          className={`ticket-v2-xiaoling-panel__voice ${isRecording ? 'is-listening' : ''}`}
          type="button"
          disabled={isConversationSending}
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
          placeholder="例如：一个老人、两个大人，想少走路"
          aria-label="告诉小灵你的购票需求"
          readOnly={isRecording}
        />
        <button type="submit" disabled={isConversationSending || !draft.trim()}>{isConversationSending ? '正在核对' : '请小灵拟票'}</button>
        <p className="ticket-v2-xiaoling-panel__voice-hint" role="status">
          {statusText || (isRecording ? (voiceDraft || '正在聆听，松手后自动发送。') : getVoiceAsrModeLabel())}
        </p>
      </form>
    </CAppBottomSheet>
  )
}

export default TicketPlannerAssistantSheet
