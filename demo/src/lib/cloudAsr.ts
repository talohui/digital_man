import { FAY_HTTP } from '../api/fay'
import { useChatStore } from '../store/useChatStore'
import { getFayUsername } from './fayIdentity'
import type { BrowserAsr } from './browserAsr'
import { getCloudRecordingError } from './cloudRecordingGuard'

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus'
] as const

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return undefined
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
  let recordingStartedAt = 0
  let startPending = false
  let startFailed = false
  let uploadStarted = false
  let aborted = false

  const cleanup = () => {
    const activeRecorder = recorder
    recorder = null
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      try {
        activeRecorder.onstop = null
        activeRecorder.stop()
      } catch {
        /* ignore */
      }
    }
    mediaStream?.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }

  const start = async () => {
    stopped = false
    aborted = false
    startFailed = false
    uploadStarted = false
    chunks = []
    recordingStartedAt = 0
    if (typeof MediaRecorder === 'undefined') {
      startFailed = true
      opts.onError?.('当前浏览器不支持录音，请换 Chrome / Edge 或打字提问。')
      return
    }
    startPending = true
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      startPending = false
      if (stopped || aborted) {
        cleanup()
        if (!aborted) {
          opts.onError?.('录音尚未开始，请按住麦克风直到显示“正在录音”后再松手。')
        }
        return
      }
      const preferredMimeType = pickMimeType()
      recorder = preferredMimeType
        ? new MediaRecorder(mediaStream, { mimeType: preferredMimeType })
        : new MediaRecorder(mediaStream)
      mimeType = recorder.mimeType || preferredMimeType || 'audio/webm'
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      recorder.start(250)
      recordingStartedAt = Date.now()
      opts.onInterim?.('正在录音…')
    } catch (err) {
      startPending = false
      startFailed = true
      cleanup()
      if (aborted) return
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        opts.onError?.('麦克风权限被拒绝，请在地址栏允许麦克风后重试。')
      } else {
        opts.onError?.('无法使用麦克风，请在浏览器地址栏允许麦克风权限后重试。')
      }
    }
  }

  const uploadAndRecognize = async () => {
    if (uploadStarted || aborted) return
    uploadStarted = true
    const blobChunks = [...chunks]
    chunks = []
    const durationMs = recordingStartedAt ? Date.now() - recordingStartedAt : 0
    recordingStartedAt = 0
    const totalBytes = blobChunks.reduce((sum, chunk) => sum + chunk.size, 0)
    const recordingError = getCloudRecordingError(durationMs, totalBytes)
    if (recordingError) {
      opts.onError?.(recordingError)
      return
    }
    opts.onInterim?.('正在云端识别…')
    const blob = new Blob(blobChunks, { type: mimeType })
    const ext = extensionForMime(mimeType)
    const form = new FormData()
    form.append('audio', blob, `recording.${ext}`)
    form.append('username', getFayUsername(useChatStore.getState().activeSceneId))

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 45_000)
    try {
      const res = await fetch(`${FAY_HTTP}/api/asr-transcribe`, {
        method: 'POST',
        body: form,
        signal: controller.signal
      })
      let data: { result?: string; text?: string; message?: string } = {}
      try {
        data = (await res.json()) as typeof data
      } catch {
        throw new Error(`语音识别服务返回异常（HTTP ${res.status}）：${FAY_HTTP}`)
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
      if (e instanceof DOMException && e.name === 'AbortError') {
        opts.onError?.('语音识别等待超时，请检查网络后重试，或改用文字输入。')
        return
      }
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        opts.onError?.(
          `无法连接语音识别服务（${FAY_HTTP}）。请确认服务已启动，并确认当前设备能访问这台电脑的 5000 端口。`
        )
        return
      }
      opts.onError?.(
        `云端语音识别失败：${msg}。请联系工作人员检查语音识别服务。`
      )
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    if (startPending) return
    if (startFailed) {
      cleanup()
      return
    }
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
    aborted = true
    chunks = []
    recordingStartedAt = 0
    cleanup()
  }

  return { start, stop, abort }
}
