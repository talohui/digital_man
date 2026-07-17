// 给定一段音频 URL → Web Audio 解码 → 播放 +(每帧)推送振幅 → 完成时 resolve。
// 由 useChatStore 串行调用,保证多段 TTS 顺序播放。
//
// 健壮性约定(移动端踩坑后加固):
//   1. playWithLipsync 返回的 Promise 必须**最终 settle**,且**一定把口型归零**。
//      否则手机上 source.onended 不触发(autoplay 被拦 / 切后台挂起)会导致
//      调用方的 .finally 永不执行 → 数字人嘴卡在张开状态。
//   2. AudioContext 在无用户手势时为 suspended,需 unlockAudio() 在首次交互时 resume。

let ctx: AudioContext | null = null

function createCtx(): AudioContext {
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) {
    throw new Error('当前浏览器不支持 Web Audio API')
  }
  return new Ctor()
}

async function getCtx(): Promise<AudioContext> {
  if (!ctx) {
    ctx = createCtx()
  }
  // 用户首次交互前 AudioContext 可能是 suspended;尽力 resume(失败不抛,
  // 交给播放兜底处理,避免在这里卡住整条 TTS 队列)。
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      /* 没有用户手势时 resume 会被拒,静默 */
    }
  }
  return ctx
}

/**
 * 在用户首次手势(点击 / 触摸)时调用,解锁移动端的音频自动播放限制。
 * 重复调用安全。
 */
export async function unlockAudio(): Promise<boolean> {
  try {
    if (!ctx) {
      ctx = createCtx()
    }
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    return ctx.state === 'running'
  } catch {
    return false
  }
}

export async function playWithLipsync(
  url: string,
  // open=张开度(0~1,音量驱动),form=嘴形(-1 圆/撮口 ~ +1 展/咧,粗略元音,频谱驱动)
  onMouth: (open: number, form: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const audioCtx = await getCtx()

  const buffer = await fetch(url, { signal })
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
  const freqData = new Uint8Array(analyser.frequencyBinCount)
  // 频域 bin → 频率:聚焦人声元音相关频带(~200Hz~3500Hz)估算频谱质心
  const binHz = audioCtx.sampleRate / analyser.fftSize
  const loBin = Math.max(1, Math.floor(200 / binHz))
  const hiBin = Math.min(analyser.frequencyBinCount - 1, Math.ceil(3500 / binHz))
  let raf = 0
  let smoothedOpen = 0
  let smoothedForm = 0

  const tick = () => {
    // 1) 时域 RMS → 张开度(音量驱动)
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const n = (data[i] - 128) / 128
      sum += n * n
    }
    const rms = Math.sqrt(sum / data.length)
    const targetOpen = Math.min(1, rms * 3)
    // 经验放大 + 低通平滑,避免嘴型抖动
    smoothedOpen = smoothedOpen * 0.6 + targetOpen * 0.4

    // 2) 频域质心 → 嘴形(粗略元音):暗(低质心,圆口 o/u)→ -1;亮(高质心,展唇 i/e)→ +1
    analyser.getByteFrequencyData(freqData)
    let mag = 0
    let weighted = 0
    for (let i = loBin; i <= hiBin; i++) {
      const m = freqData[i]
      mag += m
      weighted += m * i
    }
    let targetForm = 0
    if (mag > 0) {
      const centroidHz = (weighted / mag) * binHz
      // 以 ~1350Hz 为中性,±850Hz 映射到 ±1
      targetForm = Math.max(-1, Math.min(1, (centroidHz - 1350) / 850))
    }
    // 仅在出声时塑形(弱信号收敛到中性,避免静音抖动),并收敛幅度防止过度咧/撮嘴
    targetForm *= Math.min(1, smoothedOpen * 1.5) * 0.7
    smoothedForm = smoothedForm * 0.7 + targetForm * 0.3

    onMouth(smoothedOpen, smoothedForm)
    raf = requestAnimationFrame(tick)
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false
    let failsafe = 0

    // 统一收尾:取消动画、清兜底定时器、口型归零、resolve。幂等。
    const finish = () => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', stop)
      cancelAnimationFrame(raf)
      if (failsafe) window.clearTimeout(failsafe)
      onMouth(0, 0)
      resolve()
    }

    const stop = () => {
      try {
        source.stop()
      } catch {
        // 尚未启动或已经结束时无需额外处理。
      }
      finish()
    }

    source.onended = finish
    signal?.addEventListener('abort', stop, { once: true })

    try {
      if (signal?.aborted) {
        stop()
        return
      }
      source.start()
      tick()
      // 兜底:iOS / 微信 / 切后台挂起时 onended 可能永不触发。
      // 按音频时长 + 0.8s 余量强制收尾,确保口型归零、队列不卡死。
      failsafe = window.setTimeout(finish, (buffer.duration + 0.8) * 1000)
    } catch (e) {
      signal?.removeEventListener('abort', stop)
      cancelAnimationFrame(raf)
      // 启动失败也要归零,否则嘴会停在上一帧的张开值
      onMouth(0, 0)
      settled = true
      reject(e)
    }
  })
}
