import { useEffect, useRef } from 'react'

export type DynamicInkMistQuality = 512 | 768 | 1024 | 'off'
export type DynamicInkMistRecoveryState = 'stable' | 'monitoring' | 'recovering' | 'disabled'

export type DynamicInkMistStatus = {
  canvasActive: boolean
  quality: DynamicInkMistQuality
  degraded: boolean
  degradeReason?: string
  fpsEstimate?: number
  frameMs?: number
  recoveryState: DynamicInkMistRecoveryState
  speedScale?: number
  contrastScale?: number
}

type MistLayer = {
  x: number
  y: number
  radiusX: number
  radiusY: number
  speedX: number
  speedY: number
  alpha: number
  color: string
}

type DynamicInkMistCanvasProps = {
  enabled: boolean
  visible: boolean
  intro: boolean
  onStatusChange?: (status: DynamicInkMistStatus) => void
}

const DEFAULT_DYNAMIC_MIST_QUALITY = 768
const MIN_DRAW_INTERVAL_MS = 48
const STATUS_INTERVAL_MS = 950
const DEGRADE_FRAME_MS = 72
const RECOVER_FRAME_MS = 38
const RECOVER_STABLE_MS = 4200
export const DYNAMIC_MIST_SPEED_SCALE = 1.35
export const DYNAMIC_MIST_CONTRAST_SCALE = 1.25

const mistLayers: MistLayer[] = [
  { x: -0.12, y: 0.18, radiusX: 0.34, radiusY: 0.22, speedX: 0.004, speedY: 0.001, alpha: 0.16, color: '245,241,226' },
  { x: 0.18, y: 0.08, radiusX: 0.26, radiusY: 0.18, speedX: 0.003, speedY: -0.001, alpha: 0.14, color: '126,157,139' },
  { x: 0.68, y: 0.1, radiusX: 0.32, radiusY: 0.2, speedX: -0.003, speedY: 0.001, alpha: 0.14, color: '45,74,62' },
  { x: 0.92, y: 0.22, radiusX: 0.28, radiusY: 0.2, speedX: -0.004, speedY: 0.001, alpha: 0.13, color: '245,241,226' },
  { x: -0.06, y: 0.74, radiusX: 0.34, radiusY: 0.26, speedX: 0.003, speedY: -0.001, alpha: 0.15, color: '31,59,49' },
  { x: 0.42, y: 0.96, radiusX: 0.36, radiusY: 0.22, speedX: 0.002, speedY: -0.001, alpha: 0.12, color: '126,157,139' },
  { x: 0.98, y: 0.78, radiusX: 0.34, radiusY: 0.24, speedX: -0.003, speedY: -0.001, alpha: 0.15, color: '45,74,62' }
]

export function DynamicInkMistCanvas({ enabled, intro, onStatusChange, visible }: DynamicInkMistCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const statusRef = useRef<DynamicInkMistStatus>({
    canvasActive: false,
    degraded: false,
    quality: 'off',
    recoveryState: 'disabled'
  })
  const reportedSignatureRef = useRef('')

  useEffect(() => {
    const canvas = canvasRef.current

    if (!enabled || !visible || !canvas) {
      const status: DynamicInkMistStatus = {
        canvasActive: false,
        degraded: false,
        quality: 'off',
        recoveryState: enabled ? 'monitoring' : 'disabled',
        speedScale: DYNAMIC_MIST_SPEED_SCALE,
        contrastScale: DYNAMIC_MIST_CONTRAST_SCALE
      }
      statusRef.current = status
      reportDynamicMistStatus(status, reportedSignatureRef, onStatusChange)
      return
    }

    const ctx = canvas.getContext('2d', { alpha: true })

    if (!ctx) {
      const status: DynamicInkMistStatus = {
        canvasActive: false,
        degradeReason: 'canvas-context-unavailable',
        degraded: true,
        quality: 'off',
        recoveryState: 'disabled',
        speedScale: DYNAMIC_MIST_SPEED_SCALE,
        contrastScale: DYNAMIC_MIST_CONTRAST_SCALE
      }
      statusRef.current = status
      reportDynamicMistStatus(status, reportedSignatureRef, onStatusChange)
      return
    }

    let rafId = 0
    let running = true
    let quality: DynamicInkMistQuality = DEFAULT_DYNAMIC_MIST_QUALITY
    let active = true
    let degraded = false
    let degradeReason: string | undefined
    let recoveryState: DynamicInkMistRecoveryState = 'stable'
    let lastFrameAt = performance.now()
    let lastDrawAt = 0
    let lastStatusAt = 0
    let avgFrameMs = 16.7
    let slowFrameCount = 0
    let stableStartedAt = 0
    const phaseSeed = Math.random() * Math.PI * 2

    const updateCanvasSize = () => {
      if (quality === 'off') {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 1
      const width = quality
      const height = Math.max(1, Math.round(quality / Math.max(0.5, aspect)))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    const publishStatus = (now: number) => {
      if (now - lastStatusAt < STATUS_INTERVAL_MS) {
        return
      }

      lastStatusAt = now
      const status: DynamicInkMistStatus = {
        canvasActive: active,
        degraded,
        degradeReason,
        fpsEstimate: Math.round(1000 / Math.max(1, avgFrameMs)),
        frameMs: Math.round(avgFrameMs),
        quality: active ? quality : 'off',
        recoveryState,
        speedScale: DYNAMIC_MIST_SPEED_SCALE,
        contrastScale: DYNAMIC_MIST_CONTRAST_SCALE
      }

      statusRef.current = status
      reportDynamicMistStatus(status, reportedSignatureRef, onStatusChange)
    }

    const degrade = (reason: string) => {
      degraded = true
      degradeReason = reason
      stableStartedAt = 0

      if (quality === 768) {
        quality = 512
        recoveryState = 'monitoring'
        return
      }

      active = false
      quality = 'off'
      recoveryState = 'monitoring'
    }

    const maybeRecover = (now: number) => {
      if (!degraded || avgFrameMs > RECOVER_FRAME_MS) {
        stableStartedAt = 0
        return
      }

      if (!stableStartedAt) {
        stableStartedAt = now
        return
      }

      if (now - stableStartedAt < RECOVER_STABLE_MS) {
        recoveryState = 'monitoring'
        return
      }

      active = true
      quality = DEFAULT_DYNAMIC_MIST_QUALITY
      degraded = false
      degradeReason = undefined
      recoveryState = 'recovering'
      stableStartedAt = 0
    }

    const draw = (now: number) => {
      if (!running) {
        return
      }

      const frameMs = Math.max(1, now - lastFrameAt)
      lastFrameAt = now
      avgFrameMs = avgFrameMs * 0.92 + frameMs * 0.08

      if (frameMs > DEGRADE_FRAME_MS) {
        slowFrameCount += 1
      } else {
        slowFrameCount = Math.max(0, slowFrameCount - 1)
      }

      if (slowFrameCount >= 7 && active) {
        slowFrameCount = 0
        degrade(`slow-frame-${Math.round(frameMs)}ms`)
      }

      maybeRecover(now)

      if (active && quality !== 'off' && now - lastDrawAt >= MIN_DRAW_INTERVAL_MS) {
        lastDrawAt = now
        updateCanvasSize()
        paintMistFrame(ctx, canvas.width, canvas.height, now / 1000, intro, phaseSeed)
      }

      publishStatus(now)
      rafId = window.requestAnimationFrame(draw)
    }

    reportDynamicMistStatus(
      {
        canvasActive: true,
        degraded: false,
        quality,
        recoveryState: 'stable',
        speedScale: DYNAMIC_MIST_SPEED_SCALE,
        contrastScale: DYNAMIC_MIST_CONTRAST_SCALE
      },
      reportedSignatureRef,
      onStatusChange
    )
    rafId = window.requestAnimationFrame(draw)

    return () => {
      running = false
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [enabled, intro, onStatusChange, visible])

  if (!visible) {
    return null
  }

  return <canvas ref={canvasRef} className="map-3d-guide-atmosphere__dynamic-mist" aria-hidden="true" />
}

function paintMistFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  intro: boolean,
  phaseSeed: number
) {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'

  const introBoost = intro ? 1.28 : 1
  const baseAlpha = (intro ? 0.72 : 0.48) * DYNAMIC_MIST_CONTRAST_SCALE
  const horizon = ctx.createLinearGradient(0, 0, 0, height * 0.58)
  horizon.addColorStop(0, `rgba(245, 241, 226, ${0.24 * introBoost * DYNAMIC_MIST_CONTRAST_SCALE})`)
  horizon.addColorStop(0.32, `rgba(126, 157, 139, ${0.12 * introBoost * DYNAMIC_MIST_CONTRAST_SCALE})`)
  horizon.addColorStop(1, 'rgba(245, 241, 226, 0)')
  ctx.fillStyle = horizon
  ctx.fillRect(0, 0, width, height * 0.62)

  for (let index = 0; index < mistLayers.length; index += 1) {
    const layer = mistLayers[index]
    const driftX =
      Math.sin(time * layer.speedX * 18 * DYNAMIC_MIST_SPEED_SCALE + phaseSeed + index) * width * 0.055 +
      time * layer.speedX * DYNAMIC_MIST_SPEED_SCALE * width
    const driftY =
      Math.cos(time * layer.speedY * 20 * DYNAMIC_MIST_SPEED_SCALE + phaseSeed + index * 0.8) * height * 0.024 +
      time * layer.speedY * DYNAMIC_MIST_SPEED_SCALE * height
    const centerX = wrapUnit(layer.x + driftX / width) * width
    const centerY = clampUnit(layer.y + driftY / height) * height
    const radius = Math.max(width * layer.radiusX, height * layer.radiusY)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)

    gradient.addColorStop(0, `rgba(${layer.color}, ${layer.alpha * introBoost * baseAlpha})`)
    gradient.addColorStop(0.46, `rgba(${layer.color}, ${layer.alpha * 0.42 * introBoost * baseAlpha})`)
    gradient.addColorStop(1, `rgba(${layer.color}, 0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  ctx.globalCompositeOperation = 'destination-out'
  const clear = ctx.createRadialGradient(width * 0.52, height * 0.55, 0, width * 0.52, height * 0.55, Math.max(width, height) * 0.34)
  clear.addColorStop(0, 'rgba(0, 0, 0, .72)')
  clear.addColorStop(0.58, 'rgba(0, 0, 0, .44)')
  clear.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = clear
  ctx.fillRect(0, 0, width, height)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 0.16 * introBoost * DYNAMIC_MIST_CONTRAST_SCALE
  ctx.strokeStyle = 'rgba(245, 241, 226, .34)'
  ctx.lineWidth = Math.max(1, width / 360)

  for (let i = 0; i < 7; i += 1) {
    const y = height * (0.12 + i * 0.11) + Math.sin(time * 0.05 * DYNAMIC_MIST_SPEED_SCALE + i) * height * 0.018
    ctx.beginPath()
    ctx.moveTo(-width * 0.08, y)

    for (let x = -width * 0.08; x <= width * 1.08; x += width / 8) {
      ctx.quadraticCurveTo(
        x + width / 16,
        y + Math.sin(time * 0.08 * DYNAMIC_MIST_SPEED_SCALE + i + x * 0.01) * height * 0.018,
        x + width / 8,
        y
      )
    }

    ctx.stroke()
  }

  ctx.restore()
}

function reportDynamicMistStatus(
  status: DynamicInkMistStatus,
  signatureRef: { current: string },
  onStatusChange?: (status: DynamicInkMistStatus) => void
) {
  const signature = JSON.stringify(status)

  if (signatureRef.current === signature) {
    return
  }

  signatureRef.current = signature
  onStatusChange?.(status)
}

function wrapUnit(value: number) {
  return ((value % 1) + 1) % 1
}

function clampUnit(value: number) {
  return Math.max(-0.1, Math.min(1.1, value))
}
