import * as PIXI from 'pixi.js'
import { Spin, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
  applyCostumeTexture,
  parseCostumeId,
  type CostumeId
} from '../../lib/live2dCostume'
import type { Live2DLikeModel } from '../../lib/live2dManager'
import { loadCubismCore } from '../../lib/loadCubismCore'
import { destroyAdminLive2DPreview } from '../../lib/live2dPreviewLifecycle'

;(window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI

type Props = {
  modelUrl: string
  costumeId?: CostumeId | string | null
  supportsCostumes?: boolean
  className?: string
}

function measureContainer(el: HTMLElement) {
  const { width, height } = el.getBoundingClientRect()
  return {
    width: Math.max(1, Math.floor(width)),
    height: Math.max(1, Math.floor(height))
  }
}

function AdminLive2DPreview({
  modelUrl,
  costumeId,
  supportsCostumes = false,
  className
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelRef = useRef<Live2DLikeModel | null>(null)
  const fitRef = useRef<(() => void) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    setLoading(true)
    setError('')

    const { width, height } = measureContainer(container)
    const app = new PIXI.Application({
      view: canvas,
      width,
      height,
      autoStart: true,
      backgroundAlpha: 0,
      antialias: true
    })
    appRef.current = app
    modelRef.current = null

    loadCubismCore()
      .then(() => import('pixi-live2d-display/cubism4'))
      .then(async ({ Live2DModel }) => {
        if (cancelled) return
        Live2DModel.registerTicker(PIXI.Ticker)
        const model = await Live2DModel.from(modelUrl, { autoInteract: true })
        if (cancelled) {
          model.destroy()
          return
        }
        app.stage.addChild(model as unknown as PIXI.DisplayObject)
        modelRef.current = model as unknown as Live2DLikeModel

        if (supportsCostumes) {
          const id = parseCostumeId(costumeId)
          await applyCostumeTexture(model as Parameters<typeof applyCostumeTexture>[0], id)
        }

        const fit = () => {
          const el = containerRef.current
          if (!el || !modelRef.current) return
          const m = modelRef.current as Live2DLikeModel & {
            width: number
            height: number
            scale: { set: (v: number) => void }
            x: number
            y: number
            internalModel?: { originalWidth?: number; originalHeight?: number }
          }
          const { width: w, height: h } = measureContainer(el)
          app.renderer.resize(w, h)
          const baseW = m.internalModel?.originalWidth ?? m.width
          const baseH = m.internalModel?.originalHeight ?? m.height
          const scale = Math.min(w / baseW, h / baseH) * 0.85
          m.scale.set(scale)
          m.x = (w - baseW * scale) / 2
          m.y = (h - baseH * scale) / 2
        }
        fitRef.current = fit
        requestAnimationFrame(fit)
        resizeObserver = new ResizeObserver(fit)
        resizeObserver.observe(container)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Admin Live2D 加载失败:', err)
        if (!cancelled) {
          setError('模型加载失败，请选择其他形象重试')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      fitRef.current = null
      modelRef.current = null
      destroyAdminLive2DPreview(app)
      appRef.current = null
    }
  }, [modelUrl, supportsCostumes])

  useEffect(() => {
    const model = modelRef.current
    if (!model || loading || !supportsCostumes) return
    const id = parseCostumeId(costumeId)
    applyCostumeTexture(model as Parameters<typeof applyCostumeTexture>[0], id)
      .then(() => fitRef.current?.())
      .catch((err) => console.error('Admin Live2D 换装失败:', err))
  }, [costumeId, loading, supportsCostumes])

  return (
    <div ref={containerRef} className={`admin-live2d-preview ${className ?? ''}`}>
      {loading && (
        <div className="admin-live2d-preview__overlay">
          <Spin />
        </div>
      )}
      {error && (
        <div className="admin-live2d-preview__overlay">
          <Typography.Text type="secondary">{error}</Typography.Text>
        </div>
      )}
      <canvas ref={canvasRef} className="admin-live2d-preview__canvas" />
    </div>
  )
}

export default AdminLive2DPreview
