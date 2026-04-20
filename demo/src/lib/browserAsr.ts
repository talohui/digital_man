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

export interface BrowserAsr {
  start: () => void
  stop: () => void
}

/**
 * 创建一个一次性识别会话:start() 开始录音,stop() 结束并把最终文本通过 onFinal 回调。
 * 注意:浏览器要求 https 或 localhost 才能授权麦克风。
 */
export function createAsr(opts: {
  onFinal: (text: string) => void
  onError?: (msg: string) => void
}): BrowserAsr {
  if (!Ctor) {
    return {
      start: () => opts.onError?.('当前浏览器不支持语音识别,请使用 Chrome 或 Edge,或直接打字提问。'),
      stop: () => undefined
    }
  }

  let rec: SR | null = null
  let stopped = false

  const start = () => {
    stopped = false
    rec = new Ctor()
    rec.lang = 'zh-CN'
    rec.interimResults = false
    rec.continuous = false
    let finalText = ''
    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) {
          finalText += String(res[0]?.transcript ?? '')
        }
      }
    }
    rec.onerror = (e: any) => {
      const code = e?.error ?? 'unknown'
      if (code === 'no-speech') {
        opts.onError?.('没有识别到语音,请再试一次。')
      } else if (code === 'not-allowed') {
        opts.onError?.('麦克风权限被拒绝,请在浏览器设置中允许。')
      } else {
        opts.onError?.(`语音识别异常: ${code}`)
      }
    }
    rec.onend = () => {
      if (!stopped) return // 自然结束但用户还没松手:忽略
      const text = finalText.trim()
      if (text) opts.onFinal(text)
      rec = null
    }
    try {
      rec.start()
    } catch (e) {
      opts.onError?.(`启动语音识别失败: ${(e as Error).message}`)
    }
  }

  const stop = () => {
    stopped = true
    try {
      rec?.stop()
    } catch {
      // ignore
    }
  }

  return { start, stop }
}
