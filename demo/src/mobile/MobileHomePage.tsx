import { ClockCircleOutlined, CompassOutlined, CreditCardOutlined, EnvironmentOutlined, LoadingOutlined, MessageOutlined, RightOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendGuideFeedback } from '../api/guide'
import {
  GUIDE_TAGS,
  getGuideRouteById,
  getRouteItineraryMeta,
  type GuideRecommendationCard
} from '../data/guideData'
import {
  capturePreferenceUpdate,
  captureRecommendationClick,
  captureRecommendationExposure,
  captureRouteClick,
  captureRouteExpose,
  captureTagToggle
} from '../lib/analytics'
import { DEFAULT_SCENE_ID } from '../store/chatSessions'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'
import { useTicketStore } from '../store/useTicketStore'

function scoreText(route: GuideRecommendationCard) {
  if (typeof route.score === 'number') return `${Math.round(route.score)} 分匹配`
  if (typeof route.matchScore === 'number') return `${Math.round(route.matchScore)}% 匹配`
  return '智能推荐'
}

function MobileHomePage() {
  const navigate = useNavigate()
  const selectedTags = useGuideStore((state) => state.selectedTags)
  const candidateRoutes = useGuideStore((state) => state.candidateRoutes)
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const isLoading = useGuideStore((state) => state.isLoading)
  const lastError = useGuideStore((state) => state.lastError)
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const toggleTag = useGuideStore((state) => state.toggleTag)
  const refreshRecommendations = useGuideStore((state) => state.refreshRecommendations)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const ticket = useTicketStore((state) => state.ticketProfile)
  const totalSpend = useTicketStore((state) => state.totalSpend())
  const exposedRecommendationKeyRef = useRef('')
  const sentPreferenceKeyRef = useRef('')

  const selectedTagsKey = selectedTags.join('|')
  const mainRoute = candidateRoutes[0]
  const secondaryRoutes = candidateRoutes.slice(1)
  const route = getGuideRouteById(activeRouteId)

  useEffect(() => {
    ensureUserId()
    setActiveScene(DEFAULT_SCENE_ID, null)
    // 空闲帧预热 Live2D / ChatPanel / TMap,切 tab 秒开
    void import('../lib/prefetch').then((m) => m.prefetchHeavyTabs())
  }, [ensureUserId, setActiveScene])

  useEffect(() => {
    if (selectedTagsKey === sentPreferenceKeyRef.current) {
      return
    }
    sentPreferenceKeyRef.current = selectedTagsKey
    capturePreferenceUpdate(selectedTags)
  }, [selectedTags, selectedTagsKey])

  useEffect(() => {
    void refreshRecommendations()
  }, [refreshRecommendations, selectedTagsKey])

  useEffect(() => {
    if (candidateRoutes.length > 0) {
      const exposureKey = candidateRoutes
        .map((item, index) => `${item.recommendationRequestId ?? 'local'}:${item.id}:${index + 1}`)
        .join('|')
      if (exposureKey === exposedRecommendationKeyRef.current) {
        return
      }
      exposedRecommendationKeyRef.current = exposureKey
      captureRouteExpose(candidateRoutes.map((item) => item.id))
      captureRecommendationExposure(candidateRoutes)
    }
  }, [candidateRoutes])

  const handleTagToggle = (tag: string) => {
    const isSelected = selectedTags.includes(tag)

    captureTagToggle(tag, !isSelected)
    toggleTag(tag)
  }

  const enterRoute = (routeId: string) => {
    const userId = ensureUserId()
    const routeIndex = candidateRoutes.findIndex((item) => item.id === routeId)
    const recommendedRoute = routeIndex >= 0 ? candidateRoutes[routeIndex] : null
    if (recommendedRoute) {
      captureRecommendationClick(recommendedRoute, routeIndex + 1)
    }
    captureRouteClick(routeId)
    setActiveRouteId(routeId)
    void sendGuideFeedback({ userId, routeId, action: 'select_route' })
    navigate('/map')
  }

  return (
    <div className="mobile-home">
      <section className="mobile-home__hero">
        <div>
          <span className="mobile-section-kicker">当前导览状态</span>
          <h2>您好，我是您的数字向导</h2>
          <p>先选今天的游览期待，小灵会把路线、地图和景点讲解串成一条连续体验。</p>
        </div>
        <button
          className="mobile-home__floating-guide"
          type="button"
          onClick={() => navigate('/guide')}
          aria-label="打开灵山小灵"
        >
          <MessageOutlined />
          <span>小灵</span>
        </button>
      </section>

      <section className="mobile-ticket-entry">
        <div className="mobile-ticket-entry__icon">
          <CreditCardOutlined />
        </div>
        <div>
          <span className="mobile-section-kicker">票务入口</span>
          {ticket ? (
            <>
              <h3>{ticket.visitDate} · {ticket.groupSize} 人入园</h3>
              <p>已生成本次游客画像，累计模拟消费 ¥{Math.round(totalSpend)}。</p>
            </>
          ) : (
            <>
              <h3>先购票，后导览</h3>
              <p>填写年龄段、性别和同行人数，实时大屏会生成票务画像。</p>
            </>
          )}
        </div>
        <div className="mobile-ticket-entry__actions">
          <button type="button" onClick={() => navigate('/ticket')}>
            <CreditCardOutlined />
            <span>{ticket ? '改票' : '购票'}</span>
          </button>
          <button type="button" onClick={() => navigate('/consume')} disabled={!ticket}>
            <ShoppingCartOutlined />
            <span>消费</span>
          </button>
        </div>
      </section>

      <section className="mobile-panel mobile-home__tags">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">您的游览期待</span>
            <h3>选几个今天最想体验的方向</h3>
          </div>
          {isLoading ? <LoadingOutlined className="mobile-home__loading" /> : null}
        </div>

        <div className="mobile-tag-list">
          {GUIDE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`mobile-tag ${selectedTags.includes(tag) ? 'is-active' : ''}`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        {lastError ? <p className="mobile-muted">推荐服务暂不可用，已使用本地路线规则。</p> : null}
      </section>

      {mainRoute ? (() => {
        const meta = getRouteItineraryMeta(mainRoute.id)
        return (
          <section className="mobile-route-feature">
            <div className="mobile-route-feature__top">
              <div>
                <span className="mobile-section-kicker">主推荐路线</span>
                <h3>{mainRoute.name}</h3>
              </div>
              <span>{scoreText(mainRoute)}</span>
            </div>
            <div className="mobile-route-feature__facts">
              <div><ClockCircleOutlined /><span>{meta.durationLabel}</span></div>
              <div><EnvironmentOutlined /><span>{meta.stopCount} 个站点</span></div>
              <div><span className="mobile-route-feature__walk">{meta.walkIntensity}</span></div>
            </div>
            <p>{mainRoute.reason || mainRoute.whyRecommended || mainRoute.description}</p>
            {meta.highlights.length ? (
              <ul className="mobile-route-feature__highlights">
                {meta.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            <div className="mobile-route-feature__tags">
              {mainRoute.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button className="mobile-primary-action" type="button" onClick={() => enterRoute(mainRoute.id)}>
              开始导览
              <RightOutlined />
            </button>
          </section>
        )
      })() : null}

      <section className="mobile-home__routes">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">候选路线</span>
            <h3>也可以横向切换其他节奏</h3>
          </div>
          <CompassOutlined />
        </div>
        <div className="mobile-route-scroll">
          {secondaryRoutes.map((item) => {
            const meta = getRouteItineraryMeta(item.id)
            return (
              <button
                key={item.id}
                type="button"
                className="mobile-route-card"
                onClick={() => enterRoute(item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.durationLabel} · {meta.stopCount} 站 · {meta.walkIntensity}</span>
                <p>{item.reason || item.description}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mobile-home__status">
        <span>当前路线</span>
        <strong>{route.name}</strong>
        <small>{route.description}</small>
      </section>
    </div>
  )
}

export default MobileHomePage
