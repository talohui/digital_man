import { useEffect, useRef, useState } from 'react'
import { CompassOutlined, EnvironmentOutlined, SoundOutlined } from '@ant-design/icons'
import { Card, Col, Row, Space, Spin, Statistic, Tag, Typography } from 'antd'
import * as PIXI from 'pixi.js'
import { useChatStore } from '../store/useChatStore'
import {
  playMotionForState,
  registerModel,
  setMouthOpen,
  type RobotState
} from '../lib/live2dManager'

// pixi-live2d-display 0.4 通过全局 window.PIXI 访问 Pixi,必须在 import 之前注入
;(window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI

// 默认模型:pixi-live2d-display 项目自带的免费 Cubism4 测试模型(Haru)
// 后续替换为定制"灵山小灵"模型时,只需替换这个 URL 与本地资源
// 国内访问 jsdelivr 时不时超时,优先用 fastly 镜像
const DEFAULT_MODEL_URL =
  'https://fastly.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json'

const highlights = [
  { title: '推荐路线', value: '1 日游', icon: <CompassOutlined /> },
  { title: '讲解模式', value: '实时问答', icon: <SoundOutlined /> },
  { title: '场景焦点', value: '灵山大佛', icon: <EnvironmentOutlined /> }
]

const stateLabel: Record<RobotState, string> = {
  normal: '灵山小灵正在待命',
  speaking: '灵山小灵正在讲解',
  listening: '灵山小灵正在倾听',
  thinking: '灵山小灵思考中'
}

function Live2DStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>('')
  const robotState = useChatStore((s) => s.robotState)
  const mouthOpen = useChatStore((s) => s.mouthOpen)

  // 挂载 Pixi + 加载模型
  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    const app = new PIXI.Application({
      view: canvas,
      autoStart: true,
      resizeTo: canvas.parentElement ?? undefined,
      backgroundAlpha: 0,
      antialias: true
    })
    appRef.current = app

    // 动态 import 以避免 SSR/初次加载阻塞
    console.log('[Live2D] 开始加载模型:', DEFAULT_MODEL_URL)
    import('pixi-live2d-display/cubism4')
      .then(async ({ Live2DModel }) => {
        console.log('[Live2D] cubism4 模块就绪,fetch 模型 JSON...')
        // 必须注册 Ticker,否则 Cubism 更新循环不启动,模型在画布上不可见
        Live2DModel.registerTicker(PIXI.Ticker)
        const model = await Live2DModel.from(DEFAULT_MODEL_URL, { autoInteract: false })
        console.log('[Live2D] 模型加载完成:', { width: model.width, height: model.height })
        if (cancelled) {
          model.destroy()
          return
        }

        app.stage.addChild(model as unknown as PIXI.DisplayObject)

        // 居中并按容器自适应缩放(不用 anchor,直接手动算左上角坐标)
        const fit = () => {
          const parent = canvas.parentElement
          // resizeTo 在初始化早于 layout 时可能给 0,这里兜底从 parent clientRect 拿
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
          console.log('[Live2D] fit', { w, h, baseW, baseH, scale, x: model.x, y: model.y })
        }
        // 等一帧让 layout 稳定
        requestAnimationFrame(fit)
        const resizeObserver = new ResizeObserver(fit)
        if (canvas.parentElement) resizeObserver.observe(canvas.parentElement)

        registerModel(model as unknown as Parameters<typeof registerModel>[0])
        setIsLoading(false)

        return () => {
          resizeObserver.disconnect()
        }
      })
      .catch((err) => {
        console.error('Live2D 加载失败:', err)
        setLoadError('数字人模型加载失败,稍后将以默认形象呈现。')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
      registerModel(null)
      try {
        app.destroy(true, { children: true, texture: true, baseTexture: true })
      } catch {
        // ignore
      }
      appRef.current = null
    }
  }, [])

  // 嘴型驱动:store 的 mouthOpen 变化 → 写入模型参数
  useEffect(() => {
    setMouthOpen(mouthOpen)
  }, [mouthOpen])

  // robotState 变化 → 切换 motion
  useEffect(() => {
    playMotionForState(robotState)
  }, [robotState])

  return (
    <Card className="stage-card" bordered={false}>
      <div className="stage-card__topline">
        <Tag color="gold">Live2D Stage</Tag>
        <Typography.Text className="stage-card__status">
          {stateLabel[robotState]}
        </Typography.Text>
      </div>

      <div className="stage-card__viewport">
        <div className="stage-card__halo" />
        <canvas ref={canvasRef} className="live2d-canvas" />

        {isLoading ? (
          <div className="stage-card__loading">
            <Spin size="large" />
            <Typography.Text>正在唤醒小灵...</Typography.Text>
          </div>
        ) : null}

        {loadError ? (
          <div className="stage-card__loading">
            <Typography.Text type="warning">{loadError}</Typography.Text>
          </div>
        ) : null}
      </div>

      <Row gutter={[12, 12]}>
        {highlights.map((item) => (
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
    </Card>
  )
}

export default Live2DStage
