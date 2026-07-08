/**
 * analytics.ts — 统一埋点层
 *
 * 双通道 fire-and-forget：
 *   1. PostHog Cloud（行为漏斗分析；Key 留空时静默跳过）
 *   2. 本地 analytics-server:5002（Java Spring Boot，供 DataEase 大屏使用）
 *
 * 情感分析在 analytics-server 后端完成，前端只需把 content_text 一并发过去。
 */

import type { PostHog } from 'posthog-js'
import { useGuideStore } from '../store/useGuideStore'
import type { GuideRecommendationCard } from '../data/guideData'
import { getAnalyticsApiBase } from './runtimeConfig'
import type { PurchaseRecord, TicketProfile } from '../store/useTicketStore'

// ---- 配置 ----
// 注册 https://app.posthog.com 后在 .env.local 里设置 VITE_POSTHOG_KEY=phc_xxx
// 不设置时 PostHog 通道自动跳过，analytics-server 通道仍正常工作
export const POSTHOG_KEY: string = (import.meta.env.VITE_POSTHOG_KEY as string) ?? ''
export const POSTHOG_HOST = 'https://app.posthog.com'
const ANALYTICS_URL = `${getAnalyticsApiBase()}/events`

// ---- PostHog 懒加载:首屏不背 180kB 包,空闲帧再加载;期间事件先入队后回放 ----
let _phInstance: PostHog | null = null
let _phLoading = false
const _phQueue: Array<[string, Record<string, unknown>]> = []

/** 在浏览器空闲帧动态 import posthog-js 并 init,完成后回放队列 */
export function initPostHogIdle(): void {
  if (!POSTHOG_KEY || _phLoading || _phInstance) return
  _phLoading = true
  const schedule =
    typeof (globalThis as any).requestIdleCallback === 'function'
      ? (cb: () => void) => (globalThis as any).requestIdleCallback(cb, { timeout: 4000 })
      : (cb: () => void) => setTimeout(cb, 1500)
  schedule(async () => {
    try {
      const mod = await import('posthog-js')
      const ph = (mod as any).default ?? (mod as any).posthog ?? mod
      ph.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false,
        persistence: 'localStorage'
      })
      _phInstance = ph
      for (const [name, props] of _phQueue.splice(0)) {
        try { ph.capture(name, props) } catch { /* noop */ }
      }
    } catch {
      _phLoading = false
    }
  })
}

// ---- 事件名常量 ----
export const EVENT = {
  SESSION_START:    'session_start',
  SESSION_END:      'session_end',
  USER_MESSAGE:     'user_message',
  AI_REPLY:         'ai_reply',
  QUICK_ASK:        'quick_ask',
  VOICE_START:      'voice_start',
  VOICE_END:        'voice_end',
  AUDIO_PLAY_START: 'audio_play_start',
  AUDIO_PLAY_END:   'audio_play_end',
  ROUTE_EXPOSE:     'route_expose',
  ROUTE_CLICK:      'route_click',
  SPOT_ENTER:       'spot_enter',
  SPOT_LEAVE:       'spot_leave',
  RATE_ROUTE:       'rate_route',
  RATE_SPOT:        'rate_spot',
  TAG_TOGGLE:       'tag_toggle',
  PREFERENCE_UPDATE:'preference_update',
  RECOMMEND_EXPOSURE:'recommend_exposure',
  RECOMMEND_CLICK:   'recommend_click',
  TICKET_PURCHASE:   'ticket_purchase',
  PURCHASE:          'purchase',
} as const

// ---- 内部：推送到 analytics-server ----
function pushToServer(eventName: string, properties: Record<string, unknown>): void {
  const store = useGuideStore.getState()
  const session_id = store.ensureSessionId()
  const user_id    = store.ensureUserId()
  fetch(ANALYTICS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      properties: { session_id, user_id, ...properties },
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {/* analytics-server 未启动时静默忽略 */})
}

export function initPosthog(): void {
  initPostHogIdle()
}

// ---- 公开：capture ----
export function capture(eventName: string, properties: Record<string, unknown> = {}): void {
  // PostHog(Key 非空时才启用,SDK 未就绪先入队)
  if (POSTHOG_KEY) {
    if (_phInstance) {
      try { _phInstance.capture(eventName, properties) } catch { /* noop */ }
    } else {
      _phQueue.push([eventName, properties])
      if (!_phLoading) initPostHogIdle()
    }
  }
  // 本地 analytics-server
  pushToServer(eventName, properties)
}

// ---- 业务快捷方法 ----

/** 用户发消息：把原文发给后端，由后端做情感分析 */
export function captureUserMessage(content: string, isVoice = false): void {
  capture(EVENT.USER_MESSAGE, {
    content_text:    content,          // 后端 KeywordSentimentAnalyzer 分析这个字段
    content_length:  content.length,
    is_voice:        isVoice,
    content_preview: content.slice(0, 30),
  })
}

/** AI 回复到达：计算从发消息到收到回复的时长 */
export function captureAiReply(replyText: string, requestStartTime: number): void {
  const now = Date.now()
  const latencyMs = Number.isFinite(requestStartTime) && requestStartTime > 0
    ? now - requestStartTime
    : undefined
  capture(EVENT.AI_REPLY, {
    ...(latencyMs !== undefined && latencyMs >= 0 && latencyMs <= 120_000
      ? { latency_ms: latencyMs }
      : {}),
    reply_length:    replyText.length,
    content_preview: replyText.slice(0, 30),
  })
}

/** 快捷问题点击 */
export function captureQuickAsk(question: string): void {
  capture(EVENT.QUICK_ASK, { question })
}

/** WS 会话开始 */
export function captureSessionStart(): void {
  capture(EVENT.SESSION_START, {})
}

/** WS 会话结束 */
export function captureSessionEnd(reason?: string): void {
  capture(EVENT.SESSION_END, reason ? { reason } : {})
}

/** 录音开始 */
export function captureVoiceStart(): void {
  capture(EVENT.VOICE_START, {})
}

/** 录音结束 */
export function captureVoiceEnd(): void {
  capture(EVENT.VOICE_END, {})
}

export function captureRouteExpose(routeIds: string[]): void {
  capture(EVENT.ROUTE_EXPOSE, { route_ids: routeIds })
}

export function captureRouteClick(routeId: string): void {
  capture(EVENT.ROUTE_CLICK, { target_id: routeId })
}

export function captureSpotEnter(spotId: string, routeId?: string): void {
  capture(EVENT.SPOT_ENTER, { target_id: spotId, route_id: routeId })
}

export function captureSpotLeave(spotId: string, dwellMs: number): void {
  capture(EVENT.SPOT_LEAVE, { target_id: spotId, dwell_ms: dwellMs })
}

export function captureRateRoute(routeId: string, stars: number): void {
  capture(EVENT.RATE_ROUTE, { target_id: routeId, value: stars })
}

export function captureRateSpot(spotId: string, thumb: 1 | -1): void {
  capture(EVENT.RATE_SPOT, { target_id: spotId, value: thumb })
}

export function captureTagToggle(tag: string, on: boolean): void {
  capture(EVENT.TAG_TOGGLE, { tag, on })
}

export function capturePreferenceUpdate(selectedTags: string[]): void {
  capture(EVENT.PREFERENCE_UPDATE, { selectedTags })
}

export function captureTicketPurchase(ticket: TicketProfile): void {
  capture(EVENT.TICKET_PURCHASE, {
    ticket_id: ticket.ticketId,
    age_band: ticket.ageBand,
    gender: ticket.gender,
    group_size: ticket.groupSize,
    visit_date: ticket.visitDate,
    ticket_type: ticket.ticketType,
    ticket_cost: ticket.ticketCost,
  })
}

export function capturePurchase(record: PurchaseRecord): void {
  capture(EVENT.PURCHASE, {
    target_id: record.spotId ?? record.routeId ?? record.ticketId ?? '',
    category: record.category,
    amount: record.amount,
    spot_id: record.spotId,
    route_id: record.routeId,
    ticket_id: record.ticketId,
  })
}


function recommendationProps(route: GuideRecommendationCard, rank: number): Record<string, unknown> {
  const debugEngine = typeof route.debug?.engine === 'string' ? route.debug.engine : undefined
  return {
    target_id: route.id,
    route_id: route.id,
    rank,
    request_id: route.recommendationRequestId ?? '',
    engine: route.recommendationEngine ?? debugEngine ?? 'local-score-v1',
    reason_codes: route.reasonCodes ?? []
  }
}

export function captureRecommendationExposure(routes: GuideRecommendationCard[]): void {
  routes.forEach((route, index) => {
    capture(EVENT.RECOMMEND_EXPOSURE, recommendationProps(route, index + 1))
  })
}

export function captureRecommendationClick(route: GuideRecommendationCard, rank: number): void {
  capture(EVENT.RECOMMEND_CLICK, recommendationProps(route, rank))
}
