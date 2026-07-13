import {
  createAsr,
  isSecureContextForMic,
  isSupported as isBrowserSpeechSupported
} from './browserAsr'
import { createCloudAsr } from './cloudAsr'
import type { BrowserAsr } from './browserAsr'

export type VoiceAsrMode = 'auto' | 'browser' | 'cloud'

const PREFER_CLOUD_KEY = 'voiceAsrPreferCloud'
const envMode = (import.meta.env.VITE_VOICE_ASR_MODE as VoiceAsrMode | undefined) ?? 'auto'

function is360Browser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /360|Qihoo|QIHU|360Browser|360SE|360EE/i.test(navigator.userAgent)
}

function isEdgeOnLocalhost(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const host = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  return isLocal && /Edg\//i.test(navigator.userAgent) && !is360Browser()
}

export function markPreferCloudAsr(): void {
  try {
    sessionStorage.setItem(PREFER_CLOUD_KEY, '1')
  } catch {
    /* ignore */
  }
}

function hasPreferCloudAsr(): boolean {
  try {
    return sessionStorage.getItem(PREFER_CLOUD_KEY) === '1'
  } catch {
    return false
  }
}

/** 是否走 Fay 阿里云上传识别（非浏览器 Web Speech） */
export function shouldUseCloudAsr(): boolean {
  if (envMode === 'cloud') return true
  if (envMode === 'browser') return false
  if (hasPreferCloudAsr()) return true
  if (!isBrowserSpeechSupported) return true
  if (is360Browser()) return true
  if (!isSecureContextForMic) return true
  // auto：仅 Edge + 127.0.0.1/localhost 用浏览器识别，其余（360/Chrome/局域网 IP）走云端
  if (envMode === 'auto' && !isEdgeOnLocalhost()) return true
  return false
}

export function isVoiceAsrAvailable(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
}

export function getVoiceAsrModeLabel(): string {
  if (shouldUseCloudAsr()) {
    return '按住说话，松手自动发送（云端语音识别）'
  }
  return '按住下方麦克风说话，松手自动发送（电脑可在按钮外松手）'
}

export function createVoiceAsr(opts: {
  onFinal: (text: string) => void
  onInterim?: (text: string) => void
  onError?: (msg: string) => void
}): BrowserAsr {
  if (shouldUseCloudAsr()) {
    return createCloudAsr(opts)
  }

  const browser = createAsr({
    onFinal: opts.onFinal,
    onInterim: opts.onInterim,
    onError: (msg) => {
      const isNetwork =
        msg.includes('语音识别服务不可用') ||
        msg.includes('network') ||
        msg.includes('service-not-available')
      if (isNetwork && envMode === 'auto') {
        markPreferCloudAsr()
        opts.onError?.(
          `${msg} 已切换为阿里云识别，请再按住麦克风说一次。`
        )
        return
      }
      opts.onError?.(msg)
    }
  })

  return browser
}
