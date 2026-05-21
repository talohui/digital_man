import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  DislikeOutlined,
  EnvironmentOutlined,
  LikeOutlined
} from '@ant-design/icons'
import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel'
import Live2DStage from '../components/Live2DStage'
import QuickAsks from '../components/QuickAsks'
import {
  buildSpotQuestions,
  getDefaultSpotId,
  getGuideRouteById,
  getGuideSpotById,
  getRouteStop
} from '../data/guideData'
import { useGuideStore } from '../store/useGuideStore'
import { useChatStore } from '../store/useChatStore'
import { captureRateSpot, captureSpotEnter, captureSpotLeave } from '../lib/analytics'

function SpotGuidePage() {
  const navigate = useNavigate()
  const { spotId } = useParams()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const setSelectedSpotId = useGuideStore((state) => state.setSelectedSpotId)
  const setGuideContext = useChatStore((state) => state.setGuideContext)
  const clearGuideContext = useChatStore((state) => state.clearGuideContext)

  const route = getGuideRouteById(activeRouteId)
  const currentSpotId =
    spotId && route.stops.some((stop) => stop.spotId === spotId)
      ? spotId
      : getDefaultSpotId(route.id)
  const spot = getGuideSpotById(currentSpotId)
  const { stop, stopIndex, nextStop } = getRouteStop(route.id, currentSpotId)
  const nextSpot = nextStop ? getGuideSpotById(nextStop.spotId) : null

  useEffect(() => {
    setSelectedSpotId(currentSpotId)
    setGuideContext({
      routeName: route.name,
      spotName: spot.name,
      spotIntro: spot.intro,
      spotNarrative: stop?.narrative ?? spot.intro
    })

    captureSpotEnter(currentSpotId, route.id)
    const enteredAt = Date.now()

    return () => {
      captureSpotLeave(currentSpotId, Date.now() - enteredAt)
      clearGuideContext()
    }
  }, [clearGuideContext, currentSpotId, route.id, route.name, setGuideContext, setSelectedSpotId, spot, stop?.narrative])

  const [rateOpen, setRateOpen] = useState(false)

  const submitThumb = (value: 1 | -1) => {
    captureRateSpot(currentSpotId, value)
    setRateOpen(false)
    navigate('/map')
  }

  const handleNext = () => {
    if (!nextSpot) {
      navigate('/map')
      return
    }

    setSelectedSpotId(nextSpot.id)
    navigate(`/spot/${nextSpot.id}`)
  }

  return (
    <div className="spot-guide-page">
      <div className="spot-guide-context">
        <button className="guide-icon-button guide-icon-button--light" onClick={() => setRateOpen(true)}>
          <ArrowLeftOutlined />
        </button>

        <div className="spot-guide-context__meta">
          <span>当前路线：{route.name}</span>
          <span>第 {stopIndex + 1} 站 / 共 {route.stops.length} 站</span>
          <span>{nextSpot ? `下一站：${nextSpot.name}` : '已到本路线终点'}</span>
        </div>
      </div>

      <section className="spot-guide-hero">
        <div>
          <p className="spot-guide-hero__eyebrow">数字人景点讲解</p>
          <h1>{spot.name}</h1>
          <p>{spot.intro}</p>
        </div>

        <div className="spot-guide-hero__stay">
          <span />
          建议停留：{spot.stayMinutes} 分钟
        </div>
      </section>

      <main className="spot-guide-content">
        <div className="spot-guide-narrative glass-card">
          <h2>当前讲解重点</h2>
          <p>{stop?.narrative ?? spot.intro}</p>
        </div>

        <div className="spot-guide-layout">
          <Live2DStage
            highlightsOverride={[
              { title: '当前路线', value: route.name, icon: <CompassOutlined /> },
              { title: '当前景点', value: spot.name, icon: <EnvironmentOutlined /> },
              { title: '建议停留', value: `${spot.stayMinutes} 分钟`, icon: <ClockCircleOutlined /> }
            ]}
          />

          <div className="spot-guide-side">
            <QuickAsks
              title="向数字人继续追问"
              subtitle="这些问题会自动带上当前路线与景点上下文"
              questions={buildSpotQuestions(route.id, spot.id)}
            />
            <ChatPanel />
          </div>
        </div>
      </main>

      <div className="spot-guide-actions">
        <button className="btn-secondary" onClick={() => setRateOpen(true)}>
          回到地图
        </button>
        <button className="btn-primary" onClick={handleNext}>
          {nextSpot ? `去下一站：${nextSpot.name}` : '返回地图继续导览'}
        </button>
      </div>

      <Modal
        open={rateOpen}
        title={null}
        footer={null}
        closable={false}
        centered
        width={420}
        onCancel={() => { setRateOpen(false); navigate('/map') }}
        maskClosable
      >
        <div className="rate-modal">
          <p className="rate-modal__eyebrow">景点反馈</p>
          <h3 className="rate-modal__title">{spot.name} 这一站还不错吗?</h3>
          <p className="rate-modal__sub">一键回流到管理大屏,帮我们持续优化讲解</p>
          <div className="rate-modal__thumbs">
            <button className="rate-modal__thumb rate-modal__thumb--up" onClick={() => submitThumb(1)}>
              <LikeOutlined />
              <span>喜欢</span>
            </button>
            <button className="rate-modal__thumb rate-modal__thumb--down" onClick={() => submitThumb(-1)}>
              <DislikeOutlined />
              <span>一般</span>
            </button>
          </div>
          <button className="rate-modal__skip" onClick={() => { setRateOpen(false); navigate('/map') }}>
            稍后再说
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default SpotGuidePage
