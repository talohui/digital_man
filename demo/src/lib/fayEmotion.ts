import type { RobotState } from './live2dManager'

export type FayEmotionTone = 'happy' | 'neutral' | 'comfort' | 'thinking'
export type UserEmotionIntent = 'gratitude' | 'confused' | 'anxious' | 'neutral'
export type SpeechRateHint = 'normal' | 'lively' | 'slow'

export interface FayEmotionCue {
  tone: FayEmotionTone
  robotState: RobotState
  shouldEmpathize: boolean
  speechRateHint: SpeechRateHint
  replyStyle: 'warm' | 'normal' | 'comforting' | 'detailed'
}

type EmotionLikeMessage = {
  Sentiment?: unknown
  sentiment?: unknown
  Emotion?: unknown
  emotion?: unknown
  emotionLabel?: unknown
  subLabel?: unknown
  label?: unknown
  Data?: Record<string, unknown>
  data?: Record<string, unknown>
}

const gratitudePattern = /谢谢|感谢|辛苦|不客气|不用谢|很高兴|讲得真好|太好了|真棒|有帮助|很有用/
const confusedPattern =
  /不懂|不太懂|没懂|不明白|看不懂|什么意思|怎么回事|为什么|能详细|详细说|再说一遍|困惑|迷糊/
const anxiousPattern =
  /担心|害怕|焦虑|着急|急死|难过|痛苦|绝望|崩溃|撑不住|想哭|失望|投诉|生气|不开心|找不到|迷路|排队|太慢|太久|太热|太冷|累|麻烦/

const happyLabels = new Set([
  'happy',
  'thankful',
  'optimistic',
  'positive',
  'like',
  'joy',
  'satisfied',
  'grateful'
])

const comfortLabels = new Set([
  'anxious',
  'sad',
  'angry',
  'fear',
  'frustrated',
  'negative',
  'pessimistic',
  'worried',
  'complaint',
  'dissatisfied'
])

function normalizeText(content: string): string {
  return content.trim().toLowerCase()
}

function readNestedValue(message: EmotionLikeMessage, keys: string[]): unknown {
  for (const key of keys) {
    if (message[key as keyof EmotionLikeMessage] !== undefined) {
      return message[key as keyof EmotionLikeMessage]
    }
    if (message.Data?.[key] !== undefined) {
      return message.Data[key]
    }
    if (message.data?.[key] !== undefined) {
      return message.data[key]
    }
  }
  return undefined
}

export function extractFaySentiment(message: EmotionLikeMessage): number | null {
  const raw = readNestedValue(message, ['Sentiment', 'sentiment'])
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function extractFayEmotionLabel(message: EmotionLikeMessage): string | null {
  const raw = readNestedValue(message, [
    'Emotion',
    'emotion',
    'EmotionLabel',
    'emotionLabel',
    'SubLabel',
    'subLabel',
    'label'
  ])
  return typeof raw === 'string' && raw.trim() ? raw.trim().toLowerCase() : null
}

export function detectUserEmotionIntent(content: string): UserEmotionIntent {
  const text = normalizeText(content)
  if (!text) return 'neutral'
  if (gratitudePattern.test(text)) return 'gratitude'
  if (confusedPattern.test(text)) return 'confused'
  if (anxiousPattern.test(text)) return 'anxious'
  return 'neutral'
}

export function getReplyEmotionStateForUserText(content: string): RobotState | null {
  const intent = detectUserEmotionIntent(content)
  if (intent === 'anxious') return 'comfort'
  if (intent === 'confused') return 'thinking'
  if (intent === 'gratitude') return 'happy'
  return null
}

function cueForTone(tone: FayEmotionTone): FayEmotionCue {
  if (tone === 'happy') {
    return {
      tone,
      robotState: 'happy',
      shouldEmpathize: false,
      speechRateHint: 'lively',
      replyStyle: 'warm'
    }
  }

  if (tone === 'comfort') {
    return {
      tone,
      robotState: 'comfort',
      shouldEmpathize: true,
      speechRateHint: 'slow',
      replyStyle: 'comforting'
    }
  }

  if (tone === 'thinking') {
    return {
      tone,
      robotState: 'thinking',
      shouldEmpathize: false,
      speechRateHint: 'normal',
      replyStyle: 'detailed'
    }
  }

  return {
    tone: 'neutral',
    robotState: 'normal',
    shouldEmpathize: false,
    speechRateHint: 'normal',
    replyStyle: 'normal'
  }
}

export function createFayEmotionCue(
  message: EmotionLikeMessage,
  visibleText = ''
): FayEmotionCue {
  const sentiment = extractFaySentiment(message)
  const label = extractFayEmotionLabel(message)
  const intent = detectUserEmotionIntent(visibleText)

  if (intent === 'confused') return cueForTone('thinking')
  if (intent === 'gratitude') return cueForTone('happy')
  if (intent === 'anxious') return cueForTone('comfort')
  if (label && happyLabels.has(label)) return cueForTone('happy')
  if (label && comfortLabels.has(label)) return cueForTone('comfort')
  if (sentiment !== null && sentiment <= 0) return cueForTone('comfort')
  if (sentiment !== null && sentiment >= 2) return cueForTone('happy')
  return cueForTone('neutral')
}

export function resolveReplyRobotState(
  userReplyState: RobotState | null,
  transportState: RobotState | null,
  emotionCue: FayEmotionCue
): RobotState {
  if (userReplyState) return userReplyState
  if (emotionCue.tone !== 'neutral') return emotionCue.robotState
  return transportState ?? 'normal'
}

export function addEmotionInstructionToPrompt(prompt: string, userText: string): string {
  const intent = detectUserEmotionIntent(userText)

  if (intent === 'confused') {
    return [
      '情绪提示：游客当前可能有些困惑。请先简短确认问题，再用更详细、分步骤的方式解释，避免一次性展开无关信息。',
      prompt
    ].join('\n')
  }

  if (intent === 'anxious') {
    return [
      '情绪提示：游客当前可能有些焦虑或不安。请先用一句话安抚，再放慢节奏，用短句给出可执行建议。',
      prompt
    ].join('\n')
  }

  if (intent === 'gratitude') {
    return [
      '情绪提示：游客正在表达感谢。请用轻快、自然的语气简短回应，不要强行展开长篇讲解。',
      prompt
    ].join('\n')
  }

  return prompt
}
