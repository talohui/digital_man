export type AdminDemoMode = 'realtime' | 'history'

export type AdminDemoOptions = {
  activeWindowMinutes: number
  sessionStartedAtMs: number
  mode?: AdminDemoMode
}

export type AdminDemoFrame = {
  tick: number
  generatedAtMs: number
  liveSignal: number
  activeSessions: number
  cumulative: {
    totalMessages: number
    totalAiReplies: number
    quickAskCount: number
    voiceUseCount: number
    routeClickCount: number
  }
  quality: {
    positiveRatio: number
    avgLatencyMs: number
    p90LatencyMs: number
    maxLatencyMs: number
  }
  recommendation: {
    exposureCount: number
    clickCount: number
    ctr: number
  }
  commerce: {
    ticketCount: number
    ticketRevenue: number
    purchaseCount: number
    totalAmount: number
    costMix: Array<{ category: string; amount: number }>
  }
  spotLoads: Array<{
    id: string
    name: string
    score: number
    level: number
  }>
  recentEvents: Array<{
    event: string
    label: string
    timestamp: string
    target: string
  }>
}

const SESSION_STARTED_AT_KEY = 'lingshan_admin_demo_session_started_at'
const MAX_SESSION_AGE_MS = 6 * 60 * 60 * 1000

const DEMO_SPOTS = [
  { id: 'giant_buddha', name: '灵山大佛', base: 82, amplitude: 8, phase: 0.2 },
  { id: 'fan_gong', name: '梵宫', base: 75, amplitude: 10, phase: 1.3 },
  { id: 'jiulong_guanyu', name: '九龙灌浴', base: 69, amplitude: 12, phase: 2.2 },
  { id: 'wuyin_tancheng', name: '五印坛城', base: 58, amplitude: 9, phase: 3.1 },
  { id: 'xiangfu_temple', name: '祥符禅寺', base: 52, amplitude: 7, phase: 4.3 },
  { id: 'puti_avenue', name: '菩提大道', base: 46, amplitude: 8, phase: 5.2 },
] as const

const EVENT_TEMPLATES = [
  { event: 'ask', label: '问答', target: '灵山大佛讲解' },
  { event: 'ticket', label: '票务', target: '3 人预约入园' },
  { event: 'purchase', label: '消费', target: '梵宫文创' },
  { event: 'route', label: '路线', target: '祈福静心路线' },
  { event: 'voice', label: '语音', target: '小灵景点讲解' },
  { event: 'feedback', label: '反馈', target: '九龙灌浴' },
] as const

export function toDemoTick(nowMs = Date.now()) {
  return Math.floor(nowMs / 1000)
}

export function createSeededRandom(seed: number) {
  let state = (Math.trunc(seed) >>> 0) || 1

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

export function getAdminDemoSessionStartedAtMs(nowMs = Date.now()) {
  if (typeof window === 'undefined') {
    return nowMs
  }

  try {
    const stored = Number(window.localStorage.getItem(SESSION_STARTED_AT_KEY))
    if (Number.isFinite(stored) && stored <= nowMs && nowMs - stored <= MAX_SESSION_AGE_MS) {
      return stored
    }
    window.localStorage.setItem(SESSION_STARTED_AT_KEY, String(nowMs))
  } catch {
    return nowMs
  }

  return nowMs
}

export function buildAdminDemoFrame(tick: number, options: AdminDemoOptions): AdminDemoFrame {
  const sessionStartedTick = toDemoTick(options.sessionStartedAtMs)
  const effectiveTick = options.mode === 'history' ? sessionStartedTick : Math.max(sessionStartedTick, Math.floor(tick))
  const elapsedSeconds = Math.max(0, effectiveTick - sessionStartedTick)
  const phase = elapsedSeconds / 7
  const activeBase = Math.max(1, Math.round(43 * Math.sqrt(options.activeWindowMinutes / 5)))
  const exposureCount = 2386 + elapsedSeconds
  const clickCount = 286 + Math.floor(elapsedSeconds / 7)
  const ticketDelta = Math.floor(elapsedSeconds / 11)
  const purchaseDelta = Math.floor(elapsedSeconds / 5)
  const totalAmount = 467648 + Math.floor(elapsedSeconds / 4) * 18 + Math.floor(elapsedSeconds / 13) * 32
  const costMix = splitAmount(totalAmount)
  const avgLatencyMs = Math.round(1240 + Math.sin(phase + 0.8) * 110)
  const p90LatencyMs = Math.round(avgLatencyMs + 1420 + Math.sin(phase / 2) * 140)

  return {
    tick: effectiveTick,
    generatedAtMs: effectiveTick * 1000,
    liveSignal: effectiveTick % 60,
    activeSessions: Math.max(1, activeBase + Math.round(Math.sin(phase) * 5 + Math.sin(phase / 2) * 2)),
    cumulative: {
      totalMessages: 1846 + Math.floor(elapsedSeconds / 2) + Math.floor(elapsedSeconds / 7),
      totalAiReplies: 1762 + Math.floor(elapsedSeconds / 2),
      quickAskCount: 624 + Math.floor(elapsedSeconds / 5),
      voiceUseCount: 318 + Math.floor(elapsedSeconds / 8),
      routeClickCount: 276 + Math.floor(elapsedSeconds / 6),
    },
    quality: {
      positiveRatio: roundTo(clamp(0.87 + Math.sin(phase / 3) * 0.018, 0.82, 0.92), 3),
      avgLatencyMs,
      p90LatencyMs,
      maxLatencyMs: p90LatencyMs + 3180 + Math.round(Math.cos(phase / 2) * 180),
    },
    recommendation: {
      exposureCount,
      clickCount,
      ctr: clickCount / exposureCount,
    },
    commerce: {
      ticketCount: 164 + ticketDelta,
      ticketRevenue: 106197 + ticketDelta * 198,
      purchaseCount: 522 + purchaseDelta,
      totalAmount,
      costMix,
    },
    spotLoads: DEMO_SPOTS.map((spot) => {
      const level = clamp(Math.round(spot.base + Math.sin(phase / 2 + spot.phase) * spot.amplitude), 0, 100)
      return {
        id: spot.id,
        name: spot.name,
        score: Math.max(1, Math.round(level / 3.2)),
        level,
      }
    }).sort((a, b) => b.level - a.level),
    recentEvents: buildRecentEvents(effectiveTick, elapsedSeconds),
  }
}

function splitAmount(totalAmount: number) {
  const ticket = Math.round(totalAmount * 0.23)
  const food = Math.round(totalAmount * 0.25)
  const creative = Math.round(totalAmount * 0.26)
  const transport = Math.round(totalAmount * 0.14)
  const show = totalAmount - ticket - food - creative - transport

  return [
    { category: 'ticket', amount: ticket },
    { category: 'food', amount: food },
    { category: 'creative', amount: creative },
    { category: 'transport', amount: transport },
    { category: 'show', amount: show },
  ]
}

function buildRecentEvents(effectiveTick: number, elapsedSeconds: number) {
  const eventIndex = Math.floor(elapsedSeconds / 3)

  return Array.from({ length: 6 }, (_, index) => {
    const templateIndex = modulo(eventIndex - index, EVENT_TEMPLATES.length)
    const template = EVENT_TEMPLATES[templateIndex]
    return {
      ...template,
      timestamp: new Date((effectiveTick - index * 3) * 1000).toISOString(),
    }
  })
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundTo(value: number, precision: number) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}
