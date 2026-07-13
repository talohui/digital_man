// 浏览器原生 SpeechRecognition 封装。
// Chrome / Edge 直接支持 webkitSpeechRecognition;Safari/Firefox 不支持时返回 isSupported = false。

type SR = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

const Ctor: { new (): SR } | undefined =
  (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

export const isSupported = !!Ctor

/** 理想环境：HTTPS 或 localhost（仅用于 UI 提示，不阻断尝试） */
export const isSecureContextForMic =
  typeof window !== 'undefined' &&
  (window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

function detectBrowserKind(): 'edge' | 'chrome' | '360' | 'other' {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/Edg\//i.test(ua)) return 'edge'
  if (/360|Qihoo|QIHU|360Browser|360SE|360EE/i.test(ua)) return '360'
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'chrome'
  return 'other'
}

/** 聊天区常驻提示（访问方式 / 浏览器推荐） */
export function getBrowserVoiceHint(): string | null {
  if (typeof window === 'undefined') return null
  const parts: string[] = []
  const kind = detectBrowserKind()

  if (!isSecureContextForMic) {
    const host = window.location.hostname
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      parts.push('当前为局域网 IP 访问，将自动使用云端语音识别')
    } else {
      parts.push('请使用 https 或 localhost 访问以启用语音')
    }
  }

  if (kind === '360') {
    parts.push('当前浏览器将自动使用云端语音识别，也可以换用 Edge')
  } else if (!isSecureContextForMic) {
    parts.push('本页将使用云端语音识别（按住说话，松手自动发送）')
  } else if (kind === 'chrome' && isSecureContextForMic) {
    parts.push('Chrome 依赖在线语音服务，若识别失败可换 Edge 或检查网络')
  } else if (kind === 'edge') {
    return parts.length ? parts.join('；') : null
  }

  return parts.length ? parts.join('；') : null
}

export const voiceEnvironmentHint = (): string | null => {
  return getBrowserVoiceHint()
}

export function formatAsrError(code: string): string {
  if (code === 'no-speech') {
    return '没有识别到语音，请再试一次或打字提问。'
  }
  if (code === 'not-allowed') {
    if (!isSecureContextForMic) {
      return '无法使用麦克风：请在地址栏允许麦克风；局域网访问会使用云端语音识别。'
    }
    return '麦克风权限被拒绝，请在浏览器地址栏允许麦克风。'
  }
  if (code === 'network' || code === 'service-not-available') {
    return '浏览器在线语音识别不可用，将自动改用云端识别，请再按一次麦克风。'
  }
  if (code === 'aborted') {
    return ''
  }
  return `语音识别异常: ${code}`
}

export interface BrowserAsr {
  start: () => void
  stop: () => void
  abort: () => void
}

/**
 * 按住说话：continuous 模式累积识别，仅在 stop() 时通过 onFinal 回传全文。
 */
export function createAsr(opts: {
  onFinal: (text: string) => void
  onInterim?: (text: string) => void
  onError?: (msg: string) => void
}): BrowserAsr {
  if (!Ctor) {
    return {
      start: () =>
        opts.onError?.(
          '当前浏览器不支持语音识别，请使用 Chrome / Edge（推荐 Windows 上的 Edge），或直接打字提问。'
        ),
      stop: () => undefined,
      abort: () => undefined
    }
  }

  let rec: SR | null = null
  let stopped = false
  let finalText = ''
  let interimText = ''
  let delivered = false

  const deliverFinal = () => {
    if (delivered) return
    delivered = true
    const text = `${finalText}${interimText}`.trim()
    if (text) {
      opts.onFinal(text)
    } else if (stopped) {
      opts.onError?.('没有识别到语音，请再试一次或打字提问。')
    }
    interimText = ''
  }

  const start = () => {
    stopped = false
    delivered = false
    finalText = ''
    interimText = ''
    rec = new Ctor()
    rec.lang = 'zh-CN'
    rec.interimResults = true
    rec.continuous = true

    rec.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        const piece = String(res[0]?.transcript ?? '')
        if (res.isFinal) {
          finalText += piece
          interim = ''
        } else {
          interim += piece
        }
      }
      interimText = interim
      const display = `${finalText}${interimText}`.trim()
      if (display) {
        opts.onInterim?.(display)
      }
    }

    rec.onerror = (e: any) => {
      const code = e?.error ?? 'unknown'
      if (code === 'no-speech' && !stopped) {
        return
      }
      const msg = formatAsrError(code)
      if (msg) {
        opts.onError?.(msg)
      }
    }

    rec.onend = () => {
      if (!stopped && rec) {
        try {
          rec.start()
        } catch {
          // ignore
        }
        return
      }
      deliverFinal()
      rec = null
    }

    try {
      rec.start()
    } catch (e) {
      if (!isSecureContextForMic) {
        opts.onError?.(
          '无法启动浏览器语音识别：局域网访问将自动改用云端识别，请再按一次麦克风。'
        )
      } else {
        opts.onError?.(`启动语音识别失败: ${(e as Error).message}`)
      }
      rec = null
    }
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    try {
      rec?.stop()
    } catch {
      deliverFinal()
    }
    if (!rec) {
      deliverFinal()
    }
  }

  const abort = () => {
    stopped = true
    delivered = true
    try {
      rec?.abort()
    } catch {
      // ignore
    }
    rec = null
    finalText = ''
    interimText = ''
  }

  return { start, stop, abort }
}
