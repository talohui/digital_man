import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { CompassOutlined, EnvironmentOutlined, SoundOutlined } from '@ant-design/icons'
import { Card, Col, Row, Space, Spin, Statistic, Tag, Typography } from 'antd'
import * as PIXI from 'pixi.js'
import { useChatStore } from '../store/useChatStore'
import { getSession } from '../store/chatSessions'
import { fetchPublicAvatarConfig } from '../api/admin'
import {
  applyCostumeTexture,
  parseCostumeId,
  type CostumeId
} from '../lib/live2dCostume'
import {
  playMotionForState,
  registerModel,
  setMouthForm,
  setMouthFormActive,
  setMouthOpen,
  shouldOverrideMouthForm,
  type Live2DLikeModel,
  type RobotState
} from '../lib/live2dManager'
import { loadCubismCore } from '../lib/loadCubismCore'
import type { XiaolingPresentationMode } from './guide/xiaolingPortrait'

// pixi-live2d-display 0.4 通过全局 window.PIXI 访问 Pixi,必须在 import 之前注入
;(window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI

// 模型本地化：随包发布到 demo/public/live2d/haru，现场不再依赖公网 CDN，加载稳定。
// 后台 avatar 配置若显式给了 live2dModelUrl 仍会覆盖此默认值。
const DEFAULT_MODEL_URL = '/live2d/haru/haru_greeter_t03.model3.json'
let live2dInstanceSequence = 0

const highlights = [
  { title: '推荐路线', value: '1 日游', icon: <CompassOutlined /> },
  { title: '讲解模式', value: '实时问答', icon: <SoundOutlined /> },
  { title: '场景焦点', value: '灵山大佛', icon: <EnvironmentOutlined /> }
]

const stateLabel: Record<RobotState, string> = {
  normal: '灵山小灵正在待命',
  speaking: '灵山小灵正在讲解',
  listening: '灵山小灵正在倾听',
  thinking: '灵山小灵正在查阅讲解资料',
  happy: '灵山小灵正在微笑回应',
  comfort: '灵山小灵正在安抚讲解'
}

type StageHighlight = {
  title: string
  value: string
  icon: ReactNode
}

type Live2DStageProps = {
  highlightsOverride?: StageHighlight[]
  /** 首页左栏嵌入：隐藏指标区、缩小视口 */
  variant?: 'default' | 'embedded' | 'immersive'
  /** 首屏可见时立即加载，不等待 IntersectionObserver */
  eager?: boolean
  sceneId?: string
  robotStateOverride?: RobotState
  mouthOpenOverride?: number
  mouthFormOverride?: number
  presentationMode?: XiaolingPresentationMode
  presentationFraming?: 'full-body' | 'upper-body'
  onPresentationReady?: (detail: {
    canvas: HTMLCanvasElement
    instanceId: string
    mode: XiaolingPresentationMode
  }) => void
}

function Live2DStage({
  highlightsOverride,
  variant = 'default',
  eager = false,
  sceneId,
  robotStateOverride,
  mouthOpenOverride,
  mouthFormOverride,
  presentationMode = 'fullscreen',
  presentationFraming = 'full-body',
  onPresentationReady
}: Live2DStageProps) {
  const isEmbedded = variant === 'embedded'
  const isImmersive = variant === 'immersive'
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelRef = useRef<Live2DLikeModel | null>(null)
  const fitRef = useRef<(() => void) | null>(null)
  const presentationModeRef = useRef(presentationMode)
  const presentationFramingRef = useRef(presentationFraming)
  const onPresentationReadyRef = useRef(onPresentationReady)
  const instanceIdRef = useRef('')
  if (!instanceIdRef.current) instanceIdRef.current = `xiaoling-live2d-${++live2dInstanceSequence}`
  const costumeIdRef = useRef<CostumeId>('default')
  const [isInView, setIsInView] = useState(eager)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const activeSceneId = useChatStore((s) => s.activeSceneId)
  const resolvedSceneId = sceneId ?? activeSceneId
  // 只订阅低频的 robotState;mouthOpen(口型)TTS 播放时每帧都变,
  // 走下面的 transient subscription 直接驱动模型,不触发 React 重渲
  const legacyRobotState = useChatStore((s) => s.sessions[resolvedSceneId]?.robotState ?? 'normal')
  const robotState = robotStateOverride ?? legacyRobotState
  const visibleHighlights = highlightsOverride ?? highlights

  useEffect(() => {
    presentationModeRef.current = presentationMode
    presentationFramingRef.current = presentationFraming
    onPresentationReadyRef.current = onPresentationReady
  }, [onPresentationReady, presentationFraming, presentationMode])

  useEffect(() => {
    if (eager) {
      setIsInView(true)
      return
    }
    const el = viewportRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true)
        }
      },
      { rootMargin: '120px 0px', threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager])

  useEffect(() => {
    if (!isInView) return

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    const canvas = canvasRef.current
    if (!canvas) return

    const preferReducedGpu = window.matchMedia('(max-width: 768px)').matches
    setIsLoading(true)
    setLoadError('')

    // 按设备像素比渲染,否则 retina 屏上 1x 渲染被 CSS 拉伸会糊。
    // 手机限 2x、桌面限 3x,兼顾清晰度与 GPU 开销。
    const renderResolution = Math.min(window.devicePixelRatio || 1, preferReducedGpu ? 2 : 3)

    const app = new PIXI.Application({
      view: canvas,
      autoStart: true,
      resizeTo: canvas.parentElement ?? undefined,
      backgroundAlpha: 0,
      preserveDrawingBuffer: true,
      antialias: !preferReducedGpu,
      resolution: renderResolution,
      autoDensity: true
    })
    appRef.current = app

    loadCubismCore()
      .then(() => import('pixi-live2d-display/cubism4'))
      .then(async ({ Live2DModel }) => {
        if (cancelled) return
        Live2DModel.registerTicker(PIXI.Ticker)
        const cfg = await fetchPublicAvatarConfig().catch(() => null)
        const configuredUrl =
          typeof cfg?.live2dModelUrl === 'string' ? cfg.live2dModelUrl.trim() : ''
        // 历史配置可能仍指向公网 CDN（jsdelivr / githubusercontent），现场易超时白脸；
        // 这类不可靠远程一律回退到本地随包模型，保证加载稳定。
        const isUnreliableRemote = /jsdelivr\.net|githubusercontent\.com/i.test(configuredUrl)
        const modelUrl = configuredUrl && !isUnreliableRemote ? configuredUrl : DEFAULT_MODEL_URL
        const costumeId = parseCostumeId(cfg?.costumeId)
        costumeIdRef.current = costumeId

        const model = await Live2DModel.from(modelUrl, { autoInteract: false })
        if (cancelled) {
          model.destroy()
          return
        }

        app.stage.addChild(model as unknown as PIXI.DisplayObject)
        modelRef.current = model as unknown as Live2DLikeModel
        await applyCostumeTexture(model as unknown as Parameters<typeof applyCostumeTexture>[0], costumeId)

        const fit = () => {
          const parent = canvas.parentElement
          // 用逻辑尺寸(app.screen),不是 renderer.width(autoDensity+resolution 下是物理像素,
          // 会让模型放大数倍并按物理尺寸算居中而偏到右下)
          let w = app.screen.width
          let h = app.screen.height
          if (parent) {
            const r = parent.getBoundingClientRect()
            if (r.width > 0 && r.height > 0) {
              w = r.width
              h = r.height
              if (Math.abs(app.screen.width - w) > 0.5 || Math.abs(app.screen.height - h) > 0.5) {
                app.renderer.resize(w, h)
              }
            }
          }
          const baseW = model.internalModel?.originalWidth ?? model.width
          const baseH = model.internalModel?.originalHeight ?? model.height
          const mode = presentationModeRef.current
          const framing = presentationFramingRef.current
          const containedScale = Math.min(w / baseW, h / baseH)
          const scale = mode === 'badge'
            ? Math.max(w / baseW, h / baseH) * 1.7
            : containedScale * (isImmersive && framing === 'upper-body' ? 2.08 : isImmersive ? 1.18 : 0.9)
          model.scale.set(scale)
          model.x = (w - baseW * scale) / 2
          model.y = mode === 'badge'
            ? -baseH * scale * 0.08
            : isImmersive && framing === 'upper-body'
              ? -baseH * scale * 0.035
              : (h - baseH * scale) / 2
        }
        fitRef.current = fit
        requestAnimationFrame(fit)
        resizeObserver = new ResizeObserver(fit)
        if (canvas.parentElement) resizeObserver.observe(canvas.parentElement)

        registerModel(modelRef.current, resolvedSceneId)
        app.ticker.maxFPS = presentationModeRef.current === 'badge' ? 20 : 60
        playMotionForState(
          robotState,
          resolvedSceneId
        )
        setIsLoading(false)
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            onPresentationReadyRef.current?.({
              canvas,
              instanceId: instanceIdRef.current,
              mode: presentationModeRef.current
            })
          })
        })
      })
      .catch((err) => {
        console.error('Live2D 加载失败:', err)
        if (!cancelled) {
          setLoadError('数字人模型加载失败,稍后将以默认形象呈现。')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      registerModel(null, resolvedSceneId)
      fitRef.current = null
      modelRef.current = null
      try {
        app.destroy(true, { children: true, texture: true, baseTexture: true })
      } catch {
        // ignore
      }
      appRef.current = null
    }
  }, [isInView, resolvedSceneId])

  useEffect(() => {
    presentationModeRef.current = presentationMode
    presentationFramingRef.current = presentationFraming
    const app = appRef.current
    if (!app) return

    if (presentationMode === 'hidden') {
      app.ticker.stop()
      return
    }

    app.ticker.maxFPS = presentationMode === 'badge' ? 20 : 60
    app.ticker.start()
    fitRef.current?.()
    let frame = 0
    const notify = () => {
      frame = window.requestAnimationFrame(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        onPresentationReadyRef.current?.({
          canvas,
          instanceId: instanceIdRef.current,
          mode: presentationModeRef.current
        })
      })
    }
    const timer = presentationMode === 'badge' ? window.setTimeout(notify, 240) : 0
    if (presentationMode !== 'badge') notify()
    return () => {
      if (timer) window.clearTimeout(timer)
      window.cancelAnimationFrame(frame)
    }
  }, [presentationFraming, presentationMode])

  useEffect(() => {
    if (!isInView) return

    const syncCostume = async () => {
      const cfg = await fetchPublicAvatarConfig().catch(() => null)
      const nextId = parseCostumeId(cfg?.costumeId)
      if (nextId === costumeIdRef.current) return
      costumeIdRef.current = nextId
      if (modelRef.current) {
        await applyCostumeTexture(
          modelRef.current as Parameters<typeof applyCostumeTexture>[0],
          nextId
        )
      }
    }

    syncCostume()
    const timer = window.setInterval(syncCostume, 30000)
    return () => window.clearInterval(timer)
  }, [isInView])

  useEffect(() => {
    if (mouthOpenOverride !== undefined || mouthFormOverride !== undefined) {
      setMouthOpen(mouthOpenOverride ?? 0, resolvedSceneId)
      setMouthForm(mouthFormOverride ?? 0, resolvedSceneId)
      return undefined
    }
    const init = getSession(useChatStore.getState().sessions, resolvedSceneId)
    let lastOpen = init.mouthOpen
    let lastForm = init.mouthForm
    setMouthOpen(lastOpen, resolvedSceneId)
    setMouthForm(lastForm, resolvedSceneId)
    // transient subscription:口型(张开度+嘴形)每帧更新直接驱动模型,绕过 React 重渲
    return useChatStore.subscribe((state) => {
      const session = getSession(state.sessions, resolvedSceneId)
      if (session.mouthOpen !== lastOpen) {
        lastOpen = session.mouthOpen
        setMouthOpen(lastOpen, resolvedSceneId)
      }
      if (session.mouthForm !== lastForm) {
        lastForm = session.mouthForm
        setMouthForm(lastForm, resolvedSceneId)
      }
    })
  }, [mouthFormOverride, mouthOpenOverride, resolvedSceneId])

  useEffect(() => {
    playMotionForState(robotState, resolvedSceneId)
    // 仅普通讲解时接管嘴形;微笑/担忧状态交还给表情,避免抹平语义嘴形
    setMouthFormActive(shouldOverrideMouthForm(robotState), resolvedSceneId)
  }, [robotState, resolvedSceneId])

  // 切后台暂停渲染循环(省电省发热),回前台恢复。
  // PIXI.Ticker.shared 驱动模型参数,app.ticker 驱动渲染,两个都停
  useEffect(() => {
    const onVisibility = () => {
      const app = appRef.current
      if (document.hidden) {
        app?.ticker?.stop()
        PIXI.Ticker.shared.stop()
      } else if (presentationModeRef.current !== 'hidden') {
        app?.ticker?.start()
        PIXI.Ticker.shared.start()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const showPlaceholder = !isInView || (isLoading && !loadError)
  const placeholderText = !isInView
    ? isEmbedded || isImmersive
      ? '正在唤醒小灵...'
      : '下滑至对话区后将加载数字人'
    : '正在唤醒小灵...'

  return (
    <Card
      className={`stage-card ${isEmbedded ? 'stage-card--embedded' : ''} ${isImmersive ? 'stage-card--immersive' : ''}`}
      bordered={false}
      data-xiaoling-live2d-instance={instanceIdRef.current}
      data-xiaoling-live2d-mode={presentationMode}
    >
      <div className="stage-card__topline">
        {!isEmbedded ? <Tag color="gold">Live2D Stage</Tag> : <span />}
        <Typography.Text className="stage-card__status">
          {stateLabel[robotState]}
        </Typography.Text>
      </div>

      <div className="stage-card__viewport" ref={viewportRef}>
        <div className="stage-card__halo" />
        <canvas ref={canvasRef} className="live2d-canvas" />

        {showPlaceholder ? (
          <div className="stage-card__loading">
            <Spin size={isEmbedded ? 'default' : 'large'} />
            <Typography.Text>{placeholderText}</Typography.Text>
          </div>
        ) : null}

        {loadError ? (
          <div className="stage-card__loading">
            <Typography.Text type="warning">{loadError}</Typography.Text>
          </div>
        ) : null}
      </div>

      {!isEmbedded && !isImmersive ? (
        <Row gutter={[12, 12]}>
          {visibleHighlights.map((item) => (
            <Col span={8} key={item.title}>
              <div className="stage-card__metric">
                <Space size={8}>
                  <span className="stage-card__metric-icon">{item.icon}</span>
                  <Statistic
                    title={item.title}
                    value={item.value}
                    className="stage-card__stat"
                  />
                </Space>
              </div>
            </Col>
          ))}
        </Row>
      ) : null}
    </Card>
  )
}

export default Live2DStage
