import { CompassOutlined, LoadingOutlined } from '@ant-design/icons'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendGuideFeedback } from '../api/guide'
const ChatPanel = lazy(() => import('../components/ChatPanel'))
const Live2DStage = lazy(() => import('../components/Live2DStage'))
import RouteSkeleton from '../components/RouteSkeleton'
import ProfileBadge from '../components/ProfileBadge'
import QuickAsks from '../components/QuickAsks'
import RouteCard from '../components/RouteCard'
import SceneHeader from '../components/SceneHeader'
import { useGuideStore } from '../store/useGuideStore'
import { useChatStore } from '../store/useChatStore'
import { DEFAULT_SCENE_ID } from '../store/chatSessions'
import { capturePreferenceUpdate, captureRecommendationClick, captureRecommendationExposure, captureRouteClick, captureRouteExpose, captureTagToggle } from '../lib/analytics'


function HomePage() {
  const navigate = useNavigate()
  const selectedTags = useGuideStore((state) => state.selectedTags)
  const candidateRoutes = useGuideStore((state) => state.candidateRoutes)
  const userProfile = useGuideStore((state) => state.userProfile)
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const isLoading = useGuideStore((state) => state.isLoading)
  const lastError = useGuideStore((state) => state.lastError)
  const toggleTag = useGuideStore((state) => state.toggleTag)
  const refreshRecommendations = useGuideStore((state) => state.refreshRecommendations)
  const setActiveRouteId = useGuideStore((state) => state.setActiveRouteId)
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const exposedRecommendationKeyRef = useRef('')
  const sentPreferenceKeyRef = useRef('')

  const selectedTagsKey = selectedTags.join('|')
  const mainRoute = candidateRoutes[0]
  const secondaryRoutes = candidateRoutes.slice(1)

  useEffect(() => {
    ensureUserId()
    setActiveScene(DEFAULT_SCENE_ID, null)
    // 空闲帧预热 SpotGuide / GuideMap / ChatPanel chunk
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
        .map((route, index) => `${route.recommendationRequestId ?? 'local'}:${route.id}:${index + 1}`)
        .join('|')
      if (exposureKey === exposedRecommendationKeyRef.current) {
        return
      }
      exposedRecommendationKeyRef.current = exposureKey
      captureRouteExpose(candidateRoutes.map((r) => r.id))
      captureRecommendationExposure(candidateRoutes)
    }
  }, [candidateRoutes])

  const handleEnterMap = (routeId: string) => {
    const userId = ensureUserId()
    const routeIndex = candidateRoutes.findIndex((route) => route.id === routeId)
    const recommendedRoute = routeIndex >= 0 ? candidateRoutes[routeIndex] : null
    if (recommendedRoute) {
      captureRecommendationClick(recommendedRoute, routeIndex + 1)
    }
    captureRouteClick(routeId)
    setActiveRouteId(routeId)
    void sendGuideFeedback({
      userId,
      routeId,
      action: 'select_route'
    })
    navigate('/map')
  }

  const handleTagToggle = (tag: string) => {
    const isSelected = selectedTags.includes(tag)

    captureTagToggle(tag, !isSelected)
    toggleTag(tag)
  }

  return (
    <div className="app-shell">
      <SceneHeader />

      <main className="app-content">
        <section className="guide-home-hero">
          <div className="guide-home-greeting">
            <span className="guide-home-greeting__eyebrow">LINGSHAN SMART TOUR</span>
            <h2 className="guide-home-greeting__title">
              现有数字人主界面里，直接开始一场地图导览
            </h2>
            <p className="guide-home-greeting__desc">
              保留 Live2D、聊天和 Fay 通信链路，在首页先感知游客偏好，再把路线推荐、地图导览和景点讲解串成一条连续体验。
            </p>
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
                    onClick={() => handleTagToggle(tag)}
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

            <div className="guide-home-panel__profile-slot">
              <ProfileBadge profile={userProfile} />
            </div>

            {mainRoute ? (
              <RouteCard
                route={mainRoute}
                isMain
                isActive={activeRouteId === mainRoute.id}
                onSelect={() => handleEnterMap(mainRoute.id)}
                onSwitchLight={
                  mainRoute.lightAlternativeId
                    ? () => handleEnterMap(mainRoute.lightAlternativeId as string)
                    : undefined
                }
              />
            ) : null}

            <div className="guide-secondary-list">
              <p className="guide-secondary-list__title">其他候选路线</p>
              <div className="guide-secondary-scroll">
                {secondaryRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isActive={activeRouteId === route.id}
                    onSelect={() => handleEnterMap(route.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="home-grid">
          <div className="home-grid__main">
            <Suspense fallback={<RouteSkeleton variant="inline" />}>
              <Live2DStage sceneId={DEFAULT_SCENE_ID} />
            </Suspense>
          </div>

          <div className="home-grid__side">
            <div className="home-grid__stack">
              <QuickAsks sceneId={DEFAULT_SCENE_ID} />
              <Suspense fallback={<RouteSkeleton variant="inline" />}>
                <ChatPanel sceneId={DEFAULT_SCENE_ID} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage
