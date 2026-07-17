import { getAnalyticsApiBase } from '../lib/runtimeConfig'
import { buildEmailReportRequest } from '../lib/emailReportRequest'

const BASE = getAnalyticsApiBase()
const REQUEST_TIMEOUT_MS = 15000
const TEST_EMAIL_TIMEOUT_MS = 90000

export type EmailReportSettings = {
  recipients: string[]
  dailyEnabled: boolean
  dailyTime: string
  weeklyEnabled: boolean
  weeklyDay: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  weeklyTime: string
  smtpConfigured: boolean
  maskedSender: string | null
  senderEmail: string | null
}

export type EmailReportSettingsUpdate = Pick<
  EmailReportSettings,
  'recipients' | 'dailyEnabled' | 'dailyTime' | 'weeklyEnabled' | 'weeklyDay' | 'weeklyTime'
>

export type EmailReportSmtpUpdate = {
  smtpUsername?: string
  smtpAuthCode?: string
}

export type EmailReportDispatch = {
  id: string
  reportType: 'DAILY' | 'WEEKLY' | 'TEST' | string
  periodKey: string
  subject: string | null
  generationSource: 'llm' | 'rules' | 'pending' | string
  status: 'PENDING' | 'SENT' | 'FAILED' | string
  safeErrorCode: string | null
  recipientCount: number
  sentAt: string | null
  createdAt: string
}

async function request<T>(path: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal })
    const body = (await response.json().catch(() => ({}))) as T & { message?: string }
    if (!response.ok) throw new Error(body.message || (response.status === 401 ? '管理员会话已过期，请重新验证' : '运营报告操作未完成'))
    return body
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('运营报告服务响应超时，请确认 analytics-server 已启动')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function fetchEmailReportSettings(token: string): Promise<EmailReportSettings> {
  return request('/admin/email-reports/settings', buildEmailReportRequest('GET', token))
}

export function updateEmailReportSettings(token: string, settings: EmailReportSettingsUpdate): Promise<EmailReportSettings> {
  return request('/admin/email-reports/settings', buildEmailReportRequest('PUT', token, settings))
}

export function updateEmailReportSmtpSettings(token: string, settings: EmailReportSmtpUpdate): Promise<EmailReportSettings> {
  return request('/admin/email-reports/smtp', buildEmailReportRequest('PUT', token, settings))
}

export function fetchEmailReportDispatches(token: string): Promise<EmailReportDispatch[]> {
  return request('/admin/email-reports/dispatches?size=20', buildEmailReportRequest('GET', token))
}

export function sendEmailReportTest(token: string): Promise<EmailReportDispatch> {
  return request('/admin/email-reports/test', buildEmailReportRequest('POST', token), TEST_EMAIL_TIMEOUT_MS)
}
