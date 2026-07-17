import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  LikeOutlined,
  MessageOutlined,
  RightOutlined,
  SoundOutlined
} from '@ant-design/icons'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
const ChatPanel = lazy(() => import('../components/ChatPanel'))
const Live2DStage = lazy(() => import('../components/Live2DStage'))
import RouteSkeleton from '../components/RouteSkeleton'
import QuickAsks from '../components/QuickAsks'
import {
  buildSpotQuestions,
  getDefaultSpotId,
  getGuideRouteById,
  getGuideSpotById,
  getRouteStop
} from '../data/guideData'
import { captureRateSpot, captureSpotEnter, captureSpotLeave } from '../lib/analytics'
import { resolveGuideSpotContext, TOUR_GUIDE_SCENE_ID } from '../lib/guideScene'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'

type MobileGuidePageProps = {
  spotId?: string
}

function MobileGuidePage({ spotId }: MobileGuidePageProps) {
  const navigate = useNavigate()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const setSelectedSpotId = useGuideStore((state) => state.setSelectedSpotId)
  const markStopVisited = useGuideStore((state) => state.markStopVisited)
  const markStopListened = useGuideStore((state) => state.markStopListened)
  const listenedStops = useGuideStore((state) => state.listenedStops)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const sendQuickAsk = useChatStore((state) => state.sendQuickAsk)
  const [likedSpots, setLikedSpots] = useState<Record<string, boolean>>({})

  const route = getGuideRouteById(activeRouteId)
  const hasSpotScene = Boolean(spotId && route.stops.some((stop) => stop.spotId === spotId))
  const routeHasSelectedSpot = Boolean(
    selectedSpotId && route.stops.some((stop) => stop.spotId === selectedSpotId)
  )
  const guideSpotContext = resolveGuideSpotContext({
    spotPageId: hasSpotScene ? spotId : null,
    mapSelectedId: !hasSpotScene && routeHasSelectedSpot ? selectedSpotId : null,
    defaultSpotId: getDefaultSpotId(route.id)
  })
  const currentSpotId = guideSpotContext.spotId
  const spot = getGuideSpotById(currentSpotId)
  const { stop, stopIndex, nextStop } = getRouteStop(route.id, currentSpotId)
  const nextSpot = nextStop ? getGuideSpotById(nextStop.spotId) : null
  const sceneId = TOUR_GUIDE_SCENE_ID
  const narrative = stop?.narrative ?? spot.intro
  const hasLikedSpot = Boolean(likedSpots[spot.id])
  const hasListened = listenedStops.includes(spot.id)

  const questions = useMemo(() => {
    if (hasSpotScene) return buildSpotQuestions(route.id, spot.id)
    return [
      `${spot.name}现在最值得听什么？`,
      `${route.name}为什么安排到${spot.name}？`,
      `从${spot.name}接下来怎么走更顺？`
    ]
  }, [hasSpotScene, route.id, route.name, spot.id, spot.name])

  useEffect(() => {
    if (hasSpotScene) {
      setSelectedSpotId(spot.id)
      setActiveScene(sceneId, {
        routeId: route.id,
        routeName: route.name,
        spotId: spot.id,
        spotName: spot.name,
        spotIntro: spot.intro,
        spotNarrative: narrative,
        locationSource: guideSpotContext.source,
        locationConfidence: guideSpotContext.confidence,
        visitedSpotIds: [...new Set([...useGuideStore.getState().visitedStops, spot.id])]
      })
      captureSpotEnter(spot.id, route.id)
      markStopVisited(spot.id)
      const enteredAt = Date.now()
      return () => {
        captureSpotLeave(spot.id, Date.now() - enteredAt)
      }
    }

    setActiveScene(sceneId, {
      routeId: route.id,
      routeName: route.name,
      spotId: spot.id,
      spotName: spot.name,
      spotIntro: spot.intro,
      spotNarrative: narrative,
      locationSource: guideSpotContext.source,
      locationConfidence: guideSpotContext.confidence,
      visitedSpotIds: useGuideStore.getState().visitedStops
    })
    return undefined
  }, [
    hasSpotScene,
    guideSpotContext.confidence,
    guideSpotContext.source,
    markStopVisited,
    narrative,
    route.id,
    route.name,
    sceneId,
    setActiveScene,
    setSelectedSpotId,
    spot.id,
    spot.intro,
    spot.name
  ])

  const handleNarrate = () => {
    if (!hasSpotScene) return
    markStopListened(spot.id)
    sendQuickAsk(`请用导览员的语气，为我讲解一下${spot.name}这一站。`, sceneId)
  }

  const handleNext = () => {
    if (!hasSpotScene) {
      navigate('/map')
      return
    }
    if (!nextSpot) {
      navigate('/map')
      return
    }
    setSelectedSpotId(nextSpot.id)
    navigate(`/spot/${nextSpot.id}`)
  }

  const submitSpotLike = () => {
    if (!hasSpotScene || hasLikedSpot) return
    captureRateSpot(spot.id, 1)
    setLikedSpots((current) => ({ ...current, [spot.id]: true }))
  }

  return (
    <div className="mobile-guide-page">
      <div className="mobile-guide-avatar">
        <Suspense fallback={<RouteSkeleton variant="inline" />}>
          <Live2DStage
            sceneId={sceneId}
            variant="embedded"
            eager
            highlightsOverride={[
              { title: '当前路线', value: route.name, icon: <CompassOutlined /> },
              { title: '当前景点', value: spot.name, icon: <EnvironmentOutlined /> },
              { title: '建议停留', value: `${spot.stayMinutes} 分钟`, icon: <ClockCircleOutlined /> }
            ]}
          />
        </Suspense>
      </div>

      <div className="mobile-guide-chat-stack">
        <QuickAsks
          sceneId={sceneId}
          title={hasSpotScene ? '继续追问这一站' : '继续追问这条路线'}
          subtitle="快捷问题"
          questions={questions}
        />

        <Suspense fallback={<RouteSkeleton variant="inline" />}>
          <ChatPanel sceneId={sceneId} />
        </Suspense>
      </div>

      {hasSpotScene ? (
        <section className="mobile-panel mobile-guide-context">
          <div className="mobile-panel__head">
            <div>
              <span className="mobile-section-kicker">当前上下文</span>
              <h3>这一站讲解重点</h3>
            </div>
            {hasListened ? (
              <span className="mobile-guide-context__listened">
                <CheckCircleFilled /> 已听讲解
              </span>
            ) : (
              <MessageOutlined />
            )}
          </div>
          <p>{narrative}</p>
          <button type="button" className="mobile-guide-narrate" onClick={handleNarrate}>
            <SoundOutlined />
            {hasListened ? '让小灵再讲一遍' : '让小灵讲这一段'}
          </button>
          <div className="mobile-guide-context__actions">
            <button
              type="button"
              onClick={submitSpotLike}
              disabled={hasLikedSpot}
              className={hasLikedSpot ? 'is-submitted' : ''}
              aria-label="喜欢这一站"
            >
              <LikeOutlined />
              {hasLikedSpot ? '已反馈' : '喜欢这一站'}
            </button>
            <button type="button" onClick={handleNext}>
              {nextSpot ? `下一站：${nextSpot.name}` : '回到地图'}
              <RightOutlined />
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default MobileGuidePage
