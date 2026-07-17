import { AudioOutlined, LoadingOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'

import type { ConsumeAssistantRecommendation } from '../../../lib/consumeXiaolingRecommendation'
import { unlockAudio } from '../../../lib/audioLipsync'
import { CONSUME_ASSISTANT_SCENE_ID } from '../../../lib/guideScene'
import { createVoiceAsr, getVoiceAsrModeLabel, isVoiceAsrAvailable } from '../../../lib/voiceAsr'
import type { BrowserAsr } from '../../../lib/browserAsr'
import { useChatStore } from '../../../store/useChatStore'
import type { PurchaseCategory } from '../../../store/useTicketStore'
import { XiaolingAvatar } from '../../guide/XiaolingAvatar'

export type ConsumeAssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

type ConsumeXiaolingAssistantSheetProps = {
  category: PurchaseCategory
  currentSpotName: string
  quickQuestions: readonly string[]
  messages: readonly ConsumeAssistantMessage[]
  recommendations?: readonly ConsumeAssistantRecommendation[]
  isConversationSending: boolean
  conversationError: string
  onAsk: (question: string) => void
  onClose: () => void
  onSelect: (recommendation: ConsumeAssistantRecommendation) => void
  onShuffle: () => void
}

const TASK_LABELS: Record<PurchaseCategory, string> = {
  food: '正在帮你挑选餐饮',
  shopping: '正在帮你挑选文创礼品',
  transport: '正在帮你挑选园内交通',
  entertainment: '正在帮你挑选演艺场次'
}

const CATEGORY_IMAGES: Record<PurchaseCategory, string> = {
  food: '/icons/cat-food.png',
  shopping: '/icons/cat-culture.png',
  transport: '/icons/cat-transport.png',
  entertainment: '/icons/cat-show.png'
}

function actionLabel(category: PurchaseCategory) {
  if (category === 'transport') return '查看路线'
  if (category === 'entertainment') return '查看场次'
  return '查看商品'
}

function greeting(category: PurchaseCategory, spotName: string) {
  return `我会从${TASK_LABELS[category].replace('正在帮你挑选', '')}的真实服务目录中帮你挑选。你现在在${spotName}，可以打字或按住麦克风告诉我预算、同行人和需求。`
}

function ConsumeXiaolingAssistantSheet({
  category,
  currentSpotName,
  quickQuestions,
  messages,
  recommendations,
  isConversationSending,
  conversationError,
  onAsk,
  onClose,
  onSelect,
  onShuffle
}: ConsumeXiaolingAssistantSheetProps) {
  const [draft, setDraft] = useState('')
  const [voiceDraft, setVoiceDraft] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const asrRef = useRef<BrowserAsr | null>(null)
  const holdActiveRef = useRef(false)
  const releaseCleanupRef = useRef<(() => void) | null>(null)
  const startRecord = useChatStore((state) => state.startRecord)
  const stopRecord = useChatStore((state) => state.stopRecord)
  const isRecording = useChatStore((state) => state.sessions[CONSUME_ASSISTANT_SCENE_ID]?.isRecording ?? false)

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    submitQuestion(draft)
  }

  const detachGlobalRelease = () => {
    releaseCleanupRef.current?.()
    releaseCleanupRef.current = null
  }

  const finishRecording = () => {
    holdActiveRef.current = false
    detachGlobalRelease()
    asrRef.current?.stop()
  }

  const submitQuestion = (value: string) => {
    const question = value.trim()
    if (!question || isConversationSending) return
    setDraft('')
    onAsk(question)
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
    startRecord(CONSUME_ASSISTANT_SCENE_ID)
    asrRef.current = createVoiceAsr({
      onInterim: setVoiceDraft,
      onFinal: (text) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(CONSUME_ASSISTANT_SCENE_ID)
        setVoiceDraft('')
        submitQuestion(text)
      },
      onError: (message) => {
        asrRef.current = null
        holdActiveRef.current = false
        detachGlobalRelease()
        stopRecord(CONSUME_ASSISTANT_SCENE_ID)
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
    stopRecord(CONSUME_ASSISTANT_SCENE_ID)
  }, [stopRecord])

  return (
    <section className="consume-xiaoling-layer" role="dialog" aria-modal="true" aria-label="小灵消费推荐">
      <button className="consume-xiaoling-layer__scrim" type="button" aria-label="关闭小灵消费推荐" onClick={onClose} />
      <article className="consume-xiaoling-sheet">
        <header className="consume-xiaoling-sheet__header">
          <button type="button" aria-label="关闭小灵" onClick={onClose}>×</button>
          <span className="consume-xiaoling-sheet__avatar"><XiaolingAvatar size="small" /></span>
          <div><small>小灵消费助手</small><strong>{TASK_LABELS[category]}</strong></div>
          <em>当前位置 · {currentSpotName}</em>
        </header>

        <div className="consume-xiaoling-sheet__context" role="status">
          <span aria-hidden="true" />仅推荐景区真实服务，价格、位置与状态以目录数据为准
        </div>

        <div className="consume-xiaoling-sheet__quick-asks" aria-label="消费快捷提问">
          {quickQuestions.map((question) => (
            <button key={question} type="button" onClick={() => onAsk(question)}>{question}</button>
          ))}
        </div>

        <div ref={messageListRef} className="consume-xiaoling-sheet__messages" aria-live="polite">
          {!messages.length ? (
            <article className="consume-xiaoling-message">
              <small>小灵 · 景区服务助手</small>
              <p>{greeting(category, currentSpotName)}</p>
            </article>
          ) : null}
          {messages.map((message) => (
            <article key={message.id} className={`consume-xiaoling-message is-${message.role}`}>
              {message.role === 'assistant' ? <small>小灵 · 景区服务助手</small> : null}
              <p>{message.text}</p>
            </article>
          ))}
          {isConversationSending ? (
            <article className="consume-xiaoling-message">
              <small>小灵 · 景区服务助手</small>
              <p><LoadingOutlined spin aria-hidden /> 正在结合当前位置与真实服务目录为你梳理…</p>
            </article>
          ) : null}
          {recommendations?.length ? (
            <section className="consume-xiaoling-message__cards" aria-label="小灵推荐的真实服务">
              <small>系统核验后的真实服务</small>
              {recommendations.map((recommendation) => {
                const { product } = recommendation
                return (
                  <article className="consume-xiaoling-product-card" key={product.id}>
                    <img src={CATEGORY_IMAGES[product.category]} alt="" />
                    <div>
                      <span><small>推荐 {recommendation.rank}</small><b>{product.priceLabel}</b></span>
                      <strong>{product.name}</strong>
                      <p>{recommendation.reason}</p>
                      <em>{[product.locationLabel, recommendation.distanceLabel, product.availabilityLabel].filter(Boolean).join(' · ')}</em>
                      <button type="button" onClick={() => onSelect(recommendation)}>{actionLabel(product.category)} <i aria-hidden="true">›</i></button>
                    </div>
                  </article>
                )
              })}
              <button className="consume-xiaoling-message__shuffle" type="button" disabled={isConversationSending} onClick={onShuffle}>换一组真实服务</button>
            </section>
          ) : null}
        </div>

        <form className="consume-xiaoling-sheet__composer" onSubmit={submit}>
          <button
            className={`consume-xiaoling-sheet__voice ${isRecording ? 'is-listening' : ''}`}
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
            rows={1}
            value={isRecording && voiceDraft ? voiceDraft : draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="例如：想找适合带孩子用餐的地方"
            aria-label="输入消费需求"
            readOnly={isRecording}
          />
          <button type="submit" disabled={isConversationSending || !draft.trim()}>{isConversationSending ? '正在询问' : '发送'}</button>
          <p className="consume-xiaoling-sheet__voice-hint" role="status">
            {voiceError || conversationError || (isRecording ? (voiceDraft || '正在聆听，松手后自动发送。') : getVoiceAsrModeLabel())}
          </p>
        </form>
      </article>
    </section>
  )
}

export default ConsumeXiaolingAssistantSheet
