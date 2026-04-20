// 给定一段音频 URL → Web Audio 解码 → 播放 +(每帧)推送振幅 → 完成时 resolve。
// 由 useChatStore 串行调用,保证多段 TTS 顺序播放。

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      throw new Error('当前浏览器不支持 Web Audio API')
    }
    ctx = new Ctor()
  }
  // 用户首次交互前 AudioContext 可能是 suspended,需要 resume
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

export async function playWithLipsync(
  url: string,
  onAmplitude: (v: number) => void
): Promise<void> {
  const audioCtx = getCtx()

  const buffer = await fetch(url)
    .then((r) => {
      if (!r.ok) {
        throw new Error(`音频下载失败 ${r.status}: ${url}`)
      }
      return r.arrayBuffer()
    })
    .then((b) => audioCtx.decodeAudioData(b))

  const source = audioCtx.createBufferSource()
  source.buffer = buffer

  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 1024
  source.connect(analyser)
  analyser.connect(audioCtx.destination)

  const data = new Uint8Array(analyser.fftSize)
  let raf = 0
  let smoothed = 0

  const tick = () => {
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const n = (data[i] - 128) / 128
      sum += n * n
    }
    const rms = Math.sqrt(sum / data.length)
    // 经验放大 + 低通平滑,避免嘴型抖动
    const target = Math.min(1, rms * 3)
    smoothed = smoothed * 0.6 + target * 0.4
    onAmplitude(smoothed)
    raf = requestAnimationFrame(tick)
  }

  return new Promise<void>((resolve, reject) => {
    source.onended = () => {
      cancelAnimationFrame(raf)
      onAmplitude(0)
      resolve()
    }
    try {
      source.start()
      tick()
    } catch (e) {
      cancelAnimationFrame(raf)
      reject(e)
    }
  })
}
