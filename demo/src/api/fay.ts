// src/api/fay.ts
export const FAY_HTTP = import.meta.env.VITE_FAY_HTTP?.trim() || 'http://127.0.0.1:5000'
export const FAY_WS = import.meta.env.VITE_FAY_WS?.trim() || 'ws://127.0.0.1:10003'

export interface FayMessage {
  // 根据实际抓包结构调整
  type?: string
  text?: string
  message?: string
  content?: string
  answer?: string
  msg?: string
  audio?: string
  audioUrl?: string
  url?: string
  robot?: string
  panelReply?: {
    type?: string
    content?: string
    audio?: string
    [k: string]: any
  }
  [key: string]: any
}

/**
 * 从 Fay 消息里抽出音频 URL。
 * Fay 推送的音频字段位置在不同版本里不太稳定:
 *   - 顶层 audio / audioUrl
 *   - panelReply.audio
 *   - 形如 "samples/sample-xxx.wav" 的相对路径(需要拼到 /audio/ 下)
 */
export function extractAudioUrl(message: FayMessage): string | null {
  const candidates: Array<string | undefined> = [
    message.audioUrl,
    message.audio,
    message.url,
    message.panelReply?.audio,
    typeof message.panelReply?.content === 'string' && /\.(wav|mp3)$/i.test(message.panelReply.content)
      ? message.panelReply.content
      : undefined
  ]

  const raw = candidates.find(
    (c): c is string => typeof c === 'string' && c.trim().length > 0
  )
  if (!raw) return null

  if (/^https?:\/\//i.test(raw)) return raw

  // 处理相对路径:统一走 Fay 的 /audio/ 静态服务
  const filename = raw.replace(/^.*[\\/]/, '')
  return `${FAY_HTTP}/audio/${filename}`
}

/**
 * 把 Fay 推送的 robot 字段(图片名 或 URL)映射成 4 种状态枚举。
 */
export function extractRobotState(
  message: FayMessage
): 'normal' | 'speaking' | 'listening' | 'thinking' | null {
  const raw = message.robot
  if (typeof raw !== 'string') return null
  const lower = raw.toLowerCase()
  if (lower.includes('speak')) return 'speaking'
  if (lower.includes('listen')) return 'listening'
  if (lower.includes('think')) return 'thinking'
  if (lower.includes('normal')) return 'normal'
  return null
}

/**
 * 发送用户文本消息
 */
// Fay /api/send 要求 x-www-form-urlencoded，body 格式: data=<JSON字符串>
// 参考 Fay 自带前端 gui/static/js/index.js:550:
//   xhr.send('data=' + encodeURIComponent(JSON.stringify(send_data)))
export async function sendTextToFay(msg: string, username = 'User') {
  const body = 'data=' + encodeURIComponent(JSON.stringify({ username, msg }))

  return fetch(`${FAY_HTTP}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

/**
 * 建立 WebSocket 监听 Fay 推送
 */
interface ConnectOptions {
  onOpen?: () => void
  onClose?: () => void
  onError?: (event: Event) => void
}

export function connectFayWS(
  onMessage: (msg: FayMessage) => void,
  options: ConnectOptions = {}
) {
  const ws = new WebSocket(FAY_WS)
  
  ws.onopen = () => {
    console.log('Fay WS Connected')
    // Fay 通过 Username 把 panelReply 路由给对应 socket(参考 Fay 自带 gui/static/js/index.js:777)
    // 不发这一帧的话,Fay 只会广播全局 panelMsg,聊天的 panelReply 永远收不到
    try {
      ws.send(JSON.stringify({ Username: 'User' }))
      console.log('[Fay WS →] register Username=User')
    } catch (err) {
      console.error('Fay WS register failed:', err)
    }
    options.onOpen?.()
  }
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      console.log('[Fay WS ←]', JSON.stringify(data)) // 调试期临时打印,定位字段后可移除
      onMessage(data)
    } catch (err) {
      console.error('Fay WS parse error:', err, e.data)
    }
  }
  ws.onerror = (err) => {
    console.error('Fay WS Error:', err)
    options.onError?.(err)
  }
  ws.onclose = () => {
    console.log('Fay WS Closed')
    options.onClose?.()
  }
  
  return ws
}
