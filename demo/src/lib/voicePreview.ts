/** 管理端试听：音色 ID 与样例文件一一硬编码，避免表单/路径推断错误 */
const VOICE_SAMPLE_BY_ID: Record<string, string> = {
  zhimiao_emo: '/admin/voice-samples/zhimiao_emo.wav',
  zhimi_emo: '/admin/voice-samples/zhimi_emo.wav',
  zhiyan_emo: '/admin/voice-samples/zhiyan_emo.wav',
  zhitian_emo: '/admin/voice-samples/zhitian_emo.wav'
}

let currentAudio: HTMLAudioElement | null = null

export function resolveVoiceSampleUrl(voiceId: string): string | null {
  if (!voiceId) return null
  return VOICE_SAMPLE_BY_ID[voiceId] ?? null
}

export function getVoiceSampleUrl(voiceId: string): string | null {
  return resolveVoiceSampleUrl(voiceId)
}

function withCacheBust(baseUrl: string, voiceId: string): string {
  return `${baseUrl}?v=${encodeURIComponent(voiceId)}`
}

function waitForPlayable(audio: HTMLAudioElement, url: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('error', onError)
      resolve(ok)
    }
    const onReady = () => finish(audio.duration > 0 && !Number.isNaN(audio.duration))
    const onError = () => finish(false)
    const timer = window.setTimeout(() => finish(false), timeoutMs)
    audio.addEventListener('canplaythrough', onReady, { once: true })
    audio.addEventListener('error', onError, { once: true })
    audio.src = url
    audio.load()
  })
}

async function playUrl(url: string): Promise<boolean> {
  const audio = new Audio()
  currentAudio = audio
  const playable = await waitForPlayable(audio, url)
  if (!playable) {
    if (currentAudio === audio) currentAudio = null
    return false
  }
  try {
    await audio.play()
    return true
  } catch {
    if (currentAudio === audio) currentAudio = null
    return false
  }
}

/** 播放管理端音色样例；仅当对应 wav/mp3 可播时返回 played */
export async function playVoiceSample(voiceId: string): Promise<'played' | 'missing'> {
  stopVoiceSample()
  const base = resolveVoiceSampleUrl(voiceId)
  if (!base) return 'missing'

  const wavUrl = withCacheBust(base, voiceId)
  if (await playUrl(wavUrl)) return 'played'

  const mp3Url = withCacheBust(base.replace(/\.wav$/i, '.mp3'), voiceId)
  if (await playUrl(mp3Url)) return 'played'

  return 'missing'
}

export function stopVoiceSample() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio.src = ''
    currentAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
