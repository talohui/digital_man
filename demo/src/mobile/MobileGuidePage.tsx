import {
  ArrowLeftOutlined,
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
  const currentSpotId = hasSpotScene
    ? spotId as string
    : selectedSpotId || getDefaultSpotId(route.id)
  const spot = getGuideSpotById(currentSpotId)
  const { stop, stopIndex, nextStop } = getRouteStop(route.id, currentSpotId)
  const nextSpot = nextStop ? getGuideSpotById(nextStop.spotId) : null
  const sceneId = hasSpotScene ? `spot:${route.id}:${spot.id}` : `map:${route.id}`
  const narrative = stop?.narrative ?? spot.intro
  const hasLikedSpot = Boolean(likedSpots[spot.id])
  const hasListened = listenedStops.includes(spot.id)

  const questions = useMemo(() => {
    if (hasSpotScene) return buildSpotQuestions(route.id, spot.id)
    return [
      `${route.name}最适合从哪一站开始？`,
      `这条路线有哪些不能错过的点？`,
      `按我当前偏好怎么逛更舒服？`
    ]
  }, [hasSpotScene, route.id, route.name, spot.id])

  useEffect(() => {
    if (hasSpotScene) {
      setSelectedSpotId(spot.id)
      setActiveScene(sceneId, {
        routeName: route.name,
        spotName: spot.name,
        spotIntro: spot.intro,
        spotNarrative: narrative
      })
      captureSpotEnter(spot.id, route.id)
      markStopVisited(spot.id)
      const enteredAt = Date.now()
      return () => {
        captureSpotLeave(spot.id, Date.now() - enteredAt)
      }
    }

    setActiveScene(sceneId, {
      routeName: route.name,
      spotName: '',
      spotIntro: '',
      spotNarrative: ''
    })
    return undefined
  }, [
    hasSpotScene,
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
      <section className="mobile-guide-hero">
        <button type="button" className="mobile-round-button" onClick={() => navigate('/map')}>
          <ArrowLeftOutlined />
        </button>
        <div>
          <span className="mobile-section-kicker">
            {hasSpotScene ? `第 ${stopIndex + 1} 站 / 共 ${route.stops.length} 站` : '路线场景'}
          </span>
          <h2>{hasSpotScene ? spot.name : '和小灵聊当前路线'}</h2>
          <p>{hasSpotScene ? spot.intro : route.description}</p>
        </div>
      </section>

      <Suspense fallback={<RouteSkeleton variant="inline" />}>
        <Live2DStage
          sceneId={sceneId}
          variant="embedded"
          eager
          highlightsOverride={[
            { title: '当前路线', value: route.name, icon: <CompassOutlined /> },
            { title: '当前景点', value: hasSpotScene ? spot.name : '路线总览', icon: <EnvironmentOutlined /> },
            { title: '建议停留', value: hasSpotScene ? `${spot.stayMinutes} 分钟` : route.durationLabel, icon: <ClockCircleOutlined /> }
          ]}
        />
      </Suspense>

      <section className="mobile-panel mobile-guide-context">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">当前上下文</span>
            <h3>{hasSpotScene ? '这一站讲解重点' : '路线讲解重点'}</h3>
          </div>
          {hasSpotScene && hasListened ? (
            <span className="mobile-guide-context__listened">
              <CheckCircleFilled /> 已听讲解
            </span>
          ) : (
            <MessageOutlined />
          )}
        </div>
        <p>{hasSpotScene ? narrative : '小灵会围绕当前路线、已选偏好和景区知识回答，聊天记录与其他路线/景点互相隔离。'}</p>
        {hasSpotScene ? (
          <button type="button" className="mobile-guide-narrate" onClick={handleNarrate}>
            <SoundOutlined />
            {hasListened ? '让小灵再讲一遍' : '让小灵讲这一段'}
          </button>
        ) : null}
        <div className="mobile-guide-context__actions">
          {hasSpotScene ? (
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
          ) : null}
          <button type="button" onClick={handleNext}>
            {hasSpotScene ? (nextSpot ? `下一站：${nextSpot.name}` : '回到地图') : '回到地图'}
            <RightOutlined />
          </button>
        </div>
      </section>

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
  )
}

export default MobileGuidePage
