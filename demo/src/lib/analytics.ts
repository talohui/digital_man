/**
 * analytics.ts — 统一埋点层
 *
 * 双通道 fire-and-forget：
 *   1. PostHog Cloud（行为漏斗分析；Key 留空时静默跳过）
 *   2. 本地 analytics-server:5002（Java Spring Boot，供 DataEase 大屏使用）
 *
 * 情感分析在 analytics-server 后端完成，前端只需把 content_text 一并发过去。
 */

import posthog from 'posthog-js'

// ---- 配置 ----
// 注册 https://app.posthog.com 后在 .env.local 里设置 VITE_POSTHOG_KEY=phc_xxx
// 不设置时 PostHog 通道自动跳过，analytics-server 通道仍正常工作
export const POSTHOG_KEY: string = (import.meta.env.VITE_POSTHOG_KEY as string) ?? ''
export const POSTHOG_HOST = 'https://app.posthog.com'
const ANALYTICS_URL = 'http://127.0.0.1:5002/api/events'

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
} as const

// ---- 内部：推送到 analytics-server ----
function pushToServer(eventName: string, properties: Record<string, unknown>): void {
  fetch(ANALYTICS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,           // 页面关闭时仍能发出
  }).catch(() => {/* analytics-server 未启动时静默忽略 */})
}

// ---- 公开：capture ----
export function capture(eventName: string, properties: Record<string, unknown> = {}): void {
  // PostHog（Key 非空时才启用）
  if (POSTHOG_KEY) {
    try { posthog.capture(eventName, properties) } catch { /* noop */ }
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
  capture(EVENT.AI_REPLY, {
    latency_ms:      Date.now() - requestStartTime,
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
