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
  setMouthOpen,
  type Live2DLikeModel,
  type RobotState
} from '../lib/live2dManager'
import { loadCubismCore } from '../lib/loadCubismCore'

// pixi-live2d-display 0.4 通过全局 window.PIXI 访问 Pixi,必须在 import 之前注入
;(window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI

// 模型本地化：随包发布到 demo/public/live2d/haru，现场不再依赖公网 CDN，加载稳定。
// 后台 avatar 配置若显式给了 live2dModelUrl 仍会覆盖此默认值。
const DEFAULT_MODEL_URL = '/live2d/haru/haru_greeter_t03.model3.json'

const highlights = [
  { title: '推荐路线', value: '1 日游', icon: <CompassOutlined /> },
  { title: '讲解模式', value: '实时问答', icon: <SoundOutlined /> },
  { title: '场景焦点', value: '灵山大佛', icon: <EnvironmentOutlined /> }
]

const stateLabel: Record<RobotState, string> = {
  normal: '灵山小灵正在待命',
  speaking: '灵山小灵正在讲解',
  listening: '灵山小灵正在倾听',
  thinking: '灵山小灵正在查阅讲解资料'
}

type StageHighlight = {
  title: string
  value: string
  icon: ReactNode
}

type Live2DStageProps = {
  highlightsOverride?: StageHighlight[]
  /** 首页左栏嵌入：隐藏指标区、缩小视口 */
  variant?: 'default' | 'embedded'
  /** 首屏可见时立即加载，不等待 IntersectionObserver */
  eager?: boolean
  sceneId?: string
}

function Live2DStage({
  highlightsOverride,
  variant = 'default',
  eager = false,
  sceneId
}: Live2DStageProps) {
  const isEmbedded = variant === 'embedded'
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelRef = useRef<Live2DLikeModel | null>(null)
  const costumeIdRef = useRef<CostumeId>('default')
  const [isInView, setIsInView] = useState(eager)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const activeSceneId = useChatStore((s) => s.activeSceneId)
  const resolvedSceneId = sceneId ?? activeSceneId
  const session = useChatStore((s) => getSession(s.sessions, resolvedSceneId))
  const robotState = session.robotState
  const mouthOpen = session.mouthOpen
  const visibleHighlights = highlightsOverride ?? highlights

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

    const app = new PIXI.Application({
      view: canvas,
      autoStart: true,
      resizeTo: canvas.parentElement ?? undefined,
      backgroundAlpha: 0,
      antialias: !preferReducedGpu
    })
    appRef.current = app

    loadCubismCore()
      .then(() => import('pixi-live2d-display/cubism4'))
      .then(async ({ Live2DModel }) => {
        if (cancelled) return
        Live2DModel.registerTicker(PIXI.Ticker)
        const cfg = await fetchPublicAvatarConfig()
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
          let w = app.renderer.width
          let h = app.renderer.height
          if ((!w || !h) && parent) {
            const r = parent.getBoundingClientRect()
            w = r.width
            h = r.height
            app.renderer.resize(w, h)
          }
          const baseW = model.internalModel?.originalWidth ?? model.width
          const baseH = model.internalModel?.originalHeight ?? model.height
          const scale = Math.min(w / baseW, h / baseH) * 0.9
          model.scale.set(scale)
          model.x = (w - baseW * scale) / 2
          model.y = (h - baseH * scale) / 2
        }
        requestAnimationFrame(fit)
        resizeObserver = new ResizeObserver(fit)
        if (canvas.parentElement) resizeObserver.observe(canvas.parentElement)

        registerModel(modelRef.current, resolvedSceneId)
        setIsLoading(false)
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
    if (!isInView) return

    const syncCostume = async () => {
      const cfg = await fetchPublicAvatarConfig()
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
    setMouthOpen(mouthOpen, resolvedSceneId)
  }, [mouthOpen, resolvedSceneId])

  useEffect(() => {
    playMotionForState(robotState, resolvedSceneId)
  }, [robotState, resolvedSceneId])

  const showPlaceholder = !isInView || (isLoading && !loadError)
  const placeholderText = !isInView
    ? isEmbedded
      ? '正在唤醒小灵...'
      : '下滑至对话区后将加载数字人'
    : '正在唤醒小灵...'

  return (
    <Card
      className={`stage-card ${isEmbedded ? 'stage-card--embedded' : ''}`}
      bordered={false}
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

      {!isEmbedded ? (
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
