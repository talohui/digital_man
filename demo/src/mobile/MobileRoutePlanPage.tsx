import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendGuideFeedback } from '../api/guide'
import {
  GUIDE_TAGS,
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
import { useGuideStore } from '../store/useGuideStore'

function scoreText(route: GuideRecommendationCard) {
  if (typeof route.score === 'number') return `${Math.round(route.score)} 分匹配`
  if (typeof route.matchScore === 'number') return `${Math.round(route.matchScore)}% 匹配`
  return '智能推荐'
}

function MobileRoutePlanPage() {
  const navigate = useNavigate()
  const selectedTags = useGuideStore((state) => state.selectedTags)
  const candidateRoutes = useGuideStore((state) => state.candidateRoutes)
  const isLoading = useGuideStore((state) => state.isLoading)
  const lastError = useGuideStore((state) => state.lastError)
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const toggleTag = useGuideStore((state) => state.toggleTag)
  const refreshRecommendations = useGuideStore((state) => state.refreshRecommendations)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const exposedRecommendationKeyRef = useRef('')
  const sentPreferenceKeyRef = useRef('')

  const selectedTagsKey = selectedTags.join('|')
  const mainRoute = candidateRoutes[0]
  const secondaryRoutes = candidateRoutes.slice(1)

  useEffect(() => {
    ensureUserId()
  }, [ensureUserId])

  useEffect(() => {
    if (selectedTagsKey === sentPreferenceKeyRef.current) return
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
      if (exposureKey === exposedRecommendationKeyRef.current) return
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
      <section className="mobile-guide-hero">
        <button type="button" className="mobile-round-button" onClick={() => navigate('/')}>
          <ArrowLeftOutlined />
        </button>
        <div>
          <span className="mobile-section-kicker">行程规划</span>
          <h2>规划我的行程</h2>
          <p>选今天最想体验的方向，小灵据此为你推荐路线。</p>
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

      {mainRoute
        ? (() => {
            const meta = getRouteItineraryMeta(mainRoute.id)
            return (
              <section className="mobile-route-feature">
                <div
                  className="mobile-route-feature__cover"
                  style={{ backgroundImage: `url(${meta.cover})` }}
                >
                  <div className="mobile-route-feature__cover-scrim" />
                  <div className="mobile-route-feature__cover-top">
                    <span className="mobile-route-feature__badge">主推荐路线</span>
                    <span className="mobile-route-feature__score">{scoreText(mainRoute)}</span>
                  </div>
                  <div className="mobile-route-feature__cover-bottom">
                    <h3>{mainRoute.name}</h3>
                    <span className="mobile-route-feature__cover-meta">
                      <ClockCircleOutlined /> 游玩预计 {meta.durationLabel}
                    </span>
                  </div>
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
          })()
        : null}

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
                className="mobile-route-card mobile-route-card--photo"
                style={{ backgroundImage: `url(${meta.cover})` }}
                onClick={() => enterRoute(item.id)}
              >
                <span className="mobile-route-card__scrim" />
                <span className="mobile-route-card__tags">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
                <span className="mobile-route-card__body">
                  <strong>{item.name}</strong>
                  <span className="mobile-route-card__meta">
                    游玩预计 {item.durationLabel} · {meta.stopCount} 站
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default MobileRoutePlanPage
