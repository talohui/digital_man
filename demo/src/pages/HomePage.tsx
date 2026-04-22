import { ArrowRightOutlined, CompassOutlined, LoadingOutlined } from '@ant-design/icons'
import { Col, Row, Space, Typography } from 'antd'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendGuideFeedback } from '../api/guide'
import ChatPanel from '../components/ChatPanel'
import Live2DStage from '../components/Live2DStage'
import QuickAsks from '../components/QuickAsks'
import SceneHeader from '../components/SceneHeader'
import { useGuideStore } from '../store/useGuideStore'
import { useChatStore } from '../store/useChatStore'

const { Paragraph, Text, Title } = Typography

function HomePage() {
  const navigate = useNavigate()
  const selectedTags = useGuideStore((state) => state.selectedTags)
  const candidateRoutes = useGuideStore((state) => state.candidateRoutes)
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const isLoading = useGuideStore((state) => state.isLoading)
  const lastError = useGuideStore((state) => state.lastError)
  const toggleTag = useGuideStore((state) => state.toggleTag)
  const refreshRecommendations = useGuideStore((state) => state.refreshRecommendations)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const clearGuideContext = useChatStore((state) => state.clearGuideContext)

  const selectedTagsKey = selectedTags.join('|')
  const mainRoute = candidateRoutes[0]
  const secondaryRoutes = candidateRoutes.slice(1)

  useEffect(() => {
    ensureUserId()
    clearGuideContext()
  }, [clearGuideContext, ensureUserId])

  useEffect(() => {
    void refreshRecommendations()
  }, [refreshRecommendations, selectedTagsKey])

  const handleEnterMap = (routeId: string) => {
    const userId = ensureUserId()
    setActiveRouteId(routeId)
    void sendGuideFeedback({
      userId,
      routeId,
      action: 'select_route'
    })
    navigate('/map')
  }

  return (
    <div className="app-shell">
      <SceneHeader />

      <main className="app-content">
        <section className="guide-home-hero">
          <div className="guide-home-greeting">
            <Text className="guide-home-greeting__eyebrow">LINGSHAN SMART TOUR</Text>
            <Title level={2} className="guide-home-greeting__title">
              现有数字人主界面里，直接开始一场地图导览
            </Title>
            <Paragraph className="guide-home-greeting__desc">
              保留 Live2D、聊天和 Fay 通信链路，在首页先感知游客偏好，再把路线推荐、地图导览和景点讲解串成一条连续体验。
            </Paragraph>
          </div>

          <div className="glass-card guide-home-panel">
            <div className="guide-home-panel__intro">
              <h1>灵山胜境</h1>
              <div className="guide-home-panel__bubble">
                您好，我是您的数字向导。今天想在景区体验什么样的旅程？
              </div>
            </div>

            <div className="guide-home-panel__section">
              <p className="guide-home-panel__label">您的游览期待</p>
              <div>
                {['亲子游', '文化探秘', '祈福静心', '轻松漫步', '拍照打卡'].map((tag) => (
                  <span
                    key={tag}
                    className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="guide-home-panel__status">
              <span>
                {isLoading ? (
                  <>
                    <LoadingOutlined /> 正在根据标签刷新路线推荐
                  </>
                ) : (
                  <>
                    <CompassOutlined /> 推荐结果已就绪，可直接进入地图导览
                  </>
                )}
              </span>
              {lastError ? <small>当前已自动回退到本地推荐规则</small> : null}
            </div>

            {mainRoute ? (
              <article className={`glass-card guide-route-card guide-route-card--main ${activeRouteId === mainRoute.id ? 'guide-route-card--active' : ''}`}>
                <div className="guide-route-card__head">
                  <div>
                    <h2>{mainRoute.name}</h2>
                    <p>{mainRoute.durationLabel}</p>
                  </div>
                  <span className="guide-route-card__badge">力荐</span>
                </div>

                <p className="guide-route-card__reason">{mainRoute.reason}</p>
                <p className="guide-route-card__desc">{mainRoute.description}</p>

                <div className="guide-route-card__tags">
                  {mainRoute.tags.map((tag) => (
                    <span key={tag} className="guide-route-card__tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <button className="btn-primary" onClick={() => handleEnterMap(mainRoute.id)}>
                  进入地图导览
                  <ArrowRightOutlined />
                </button>
              </article>
            ) : null}

            <div className="guide-secondary-list">
              <p className="guide-secondary-list__title">其他候选路线</p>
              <div className="guide-secondary-scroll">
                {secondaryRoutes.map((route) => (
                  <article
                    key={route.id}
                    className={`glass-card clickable-card guide-route-card guide-route-card--secondary ${activeRouteId === route.id ? 'guide-route-card--active' : ''}`}
                    onClick={() => handleEnterMap(route.id)}
                  >
                    <div className="guide-route-card__head guide-route-card__head--compact">
                      <h3>{route.name}</h3>
                      <span>进入导览</span>
                    </div>
                    <p className="guide-route-card__reason">{route.reason}</p>
                    <p className="guide-route-card__desc">{route.durationLabel}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} xl={15}>
            <Live2DStage />
          </Col>

          <Col xs={24} xl={9}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <QuickAsks />
              <ChatPanel />
            </Space>
          </Col>
        </Row>
      </main>
    </div>
  )
}

export default HomePage
