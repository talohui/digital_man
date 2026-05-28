import { FAY_HTTP } from '../api/fay'
import { useChatStore } from '../store/useChatStore'
import { getFayUsername } from './fayIdentity'
import type { BrowserAsr } from './browserAsr'

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus'
] as const

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return 'audio/webm'
}

function extensionForMime(mime: string): string {
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

export function createCloudAsr(opts: {
  onFinal: (text: string) => void
  onInterim?: (text: string) => void
  onError?: (msg: string) => void
}): BrowserAsr {
  let mediaStream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let stopped = false
  let mimeType = 'audio/webm'

  const cleanup = () => {
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        /* ignore */
      }
    }
    recorder = null
    mediaStream?.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }

  const start = async () => {
    stopped = false
    chunks = []
    if (typeof MediaRecorder === 'undefined') {
      opts.onError?.('当前浏览器不支持录音，请换 Chrome / Edge 或打字提问。')
      return
    }
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mimeType = pickMimeType()
      recorder = new MediaRecorder(mediaStream, { mimeType })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      recorder.start(250)
      opts.onInterim?.('正在录音…')
    } catch (err) {
      cleanup()
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        opts.onError?.('麦克风权限被拒绝，请在地址栏允许麦克风后重试。')
      } else {
        opts.onError?.('无法使用麦克风，请在浏览器地址栏允许麦克风权限后重试。')
      }
    }
  }

  const uploadAndRecognize = async () => {
    const blobChunks = [...chunks]
    chunks = []
    if (!blobChunks.length) {
      opts.onError?.('没有录到音频，请按住多说 1 秒再松手，或打字提问。')
      return
    }
    opts.onInterim?.('正在云端识别…')
    const blob = new Blob(blobChunks, { type: mimeType })
    const ext = extensionForMime(mimeType)
    const form = new FormData()
    form.append('audio', blob, `recording.${ext}`)
    form.append('username', getFayUsername(useChatStore.getState().activeSceneId))

    try {
      const res = await fetch(`${FAY_HTTP}/api/asr-transcribe`, {
        method: 'POST',
        body: form
      })
      let data: { result?: string; text?: string; message?: string } = {}
      try {
        data = (await res.json()) as typeof data
      } catch {
        throw new Error(`Fay 返回非 JSON（HTTP ${res.status}），请确认 Fay 已启动：${FAY_HTTP}`)
      }
      if (!res.ok || data.result !== 'successful') {
        throw new Error(data.message || `识别失败 HTTP ${res.status}`)
      }
      const text = (data.text ?? '').trim()
      if (!text) {
        opts.onError?.('没有识别到语音，请再试一次或打字提问。')
        return
      }
      opts.onFinal(text)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        opts.onError?.(
          `无法连接 Fay（${FAY_HTTP}）。请确认 Fay 已启动，并确认当前设备能访问这台电脑的 5000 端口。`
        )
        return
      }
      opts.onError?.(
        `云端语音识别失败：${msg}。请确认 Fay 已重启、system.conf 已配置 AliNLS、已安装 ffmpeg，且日志有「AliNLS token刷新成功」。`
      )
    }
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    if (!recorder || recorder.state === 'inactive') {
      cleanup()
      void uploadAndRecognize()
      return
    }
    recorder.onstop = () => {
      cleanup()
      void uploadAndRecognize()
    }
    try {
      recorder.stop()
    } catch {
      cleanup()
      void uploadAndRecognize()
    }
  }

  const abort = () => {
    stopped = true
    chunks = []
    cleanup()
  }

  return { start, stop, abort }
}
