import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import ChatPanel from '../components/ChatPanel'
import { getDefaultSpotId, getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { resolveGuideSpotContext, TOUR_GUIDE_SCENE_ID } from '../lib/guideScene'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'
import '../styles/c-app/guideV2.css'

const QUICK_ASKS = ['第一次来怎么逛？', '想看建筑和拍照', '推荐一条轻松路线']

const TABS = [
  { label: '导览', icon: '/icons/tab-home.png', path: '/' },
  { label: '地图', icon: '/icons/tab-map.png', path: '/map-3d-guide-c' },
  { label: '小灵', icon: '/icons/lingshan-guide-avatar.png', path: '/guide-v2', active: true },
  { label: '消费', icon: '/icons/tab-shop.png', path: '/consume' },
  { label: '我的', icon: '/icons/tab-me.png', path: '/me' }
] as const

/**
 * 开发预览入口也复用正式导览会话，避免录制演示时出现只会本地假回复的第二套小灵。
 */
function MobileGuidePageV2() {
  const navigate = useNavigate()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const sendQuickAsk = useChatStore((state) => state.sendQuickAsk)
  const route = getGuideRouteById(activeRouteId)
  const guideSpotContext = useMemo(
    () => resolveGuideSpotContext({
      mapSelectedId: selectedSpotId,
      defaultSpotId: getDefaultSpotId(route.id)
    }),
    [route.id, selectedSpotId]
  )
  const spot = getGuideSpotById(guideSpotContext.spotId)

  useEffect(() => {
    setActiveScene(TOUR_GUIDE_SCENE_ID, {
      routeId: route.id,
      routeName: route.name,
      spotId: spot.id,
      spotName: spot.name,
      spotIntro: spot.intro,
      locationSource: guideSpotContext.source,
      locationConfidence: guideSpotContext.confidence,
      visitedSpotIds: useGuideStore.getState().visitedStops
    })
  }, [guideSpotContext.confidence, guideSpotContext.source, route.id, route.name, setActiveScene, spot.id, spot.intro, spot.name])

  return (
    <div className="guide-v2-preview c-app-root">
      <div className="guide-v2-device">
        <header className="guide-v2-header">
          <button type="button" className="guide-v2-header__back" onClick={() => navigate('/')} aria-label="返回导览首页">‹</button>
          <div>
            <strong>小灵</strong>
            <span><i /> 灵山智能导游</span>
          </div>
          <button type="button" className="guide-v2-header__map" onClick={() => navigate('/map-3d-guide-c')}>地图</button>
        </header>

        <main className="guide-v2-main">
          <section className="guide-v2-companion" aria-label="小灵陪伴导览">
            <div className="guide-v2-companion__halo" aria-hidden="true" />
            <img src="/icons/lingshan-guide-avatar.png" alt="小灵" />
            <div className="guide-v2-companion__copy">
              <span>一路有我</span>
              <h1>今天想怎么逛？</h1>
              <p>问路线、聊景点，或者让我按你的时间来安排。</p>
            </div>
          </section>

          <section className="guide-v2-conversation" aria-label="与小灵对话">
            <div className="guide-v2-quick-asks" aria-label="推荐提问">
              {QUICK_ASKS.map((question) => (
                <button key={question} type="button" onClick={() => void sendQuickAsk(question, TOUR_GUIDE_SCENE_ID)}>{question}</button>
              ))}
            </div>
            <ChatPanel sceneId={TOUR_GUIDE_SCENE_ID} />
          </section>
        </main>

        <small className="guide-v2-live-note">文字与按住说话都会同步到小灵的当前导览会话。</small>

        <nav className="guide-v2-tabbar" aria-label="C 端主导航">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={tab.path === '/guide-v2' ? 'is-active is-xiaoling' : ''}
              onClick={() => navigate(tab.path)}
            >
              <span><img src={tab.icon} alt="" /></span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default MobileGuidePageV2
