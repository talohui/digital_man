import { CompassOutlined, MessageOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGuideRouteById } from '../data/guideData'
import { DEFAULT_SCENE_ID } from '../store/chatSessions'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'

// 景区服务宫格(精美图标入口,放在 public/icons/)
const SERVICES = [
  { icon: 'cat-food', label: '餐饮斋茶', to: '/consume' },
  { icon: 'cat-culture', label: '文创礼品', to: '/consume' },
  { icon: 'cat-show', label: '演艺秀场', to: '/consume' },
  { icon: 'svc-shuttle', label: '交通接驳', to: '/map' },
  { icon: 'cat-spot', label: '灵山景点', to: '/map' },
  { icon: 'cat-museum', label: '博物馆', to: '/map' },
  { icon: 'svc-parking', label: '停车服务', to: '/map' },
  { icon: 'svc-weather', label: '天气资讯', to: '/map' }
]

function MobileHomePage() {
  const navigate = useNavigate()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const route = getGuideRouteById(activeRouteId)

  useEffect(() => {
    ensureUserId()
    setActiveScene(DEFAULT_SCENE_ID, null)
    // 空闲帧预热 Live2D / ChatPanel / TMap,切 tab 秒开
    void import('../lib/prefetch').then((m) => m.prefetchHeavyTabs())
  }, [ensureUserId, setActiveScene])

  return (
    <div className="mobile-home">
      <section className="mobile-home__hero">
        <div>
          <span className="mobile-section-kicker">当前导览状态</span>
          <h2>您好，我是您的数字向导</h2>
          <p>先规划今天的行程，小灵会把路线、地图和景点讲解串成一条连续体验。</p>
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

      <button className="mobile-plan-entry" type="button" onClick={() => navigate('/plan')}>
        <span className="mobile-plan-entry__icon">
          <CompassOutlined />
        </span>
        <span className="mobile-plan-entry__text">
          <strong>规划我的行程</strong>
          <small>选游览期待 · 智能推荐路线</small>
        </span>
        <RightOutlined />
      </button>

      <section className="mobile-panel">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">景区服务</span>
            <h3>常用功能一键直达</h3>
          </div>
        </div>
        <div className="mobile-service-grid">
          {SERVICES.map((s) => (
            <button
              key={s.label}
              type="button"
              className="mobile-service-cell"
              onClick={() => navigate(s.to)}
            >
              <img src={`/icons/${s.icon}.png`} alt="" loading="lazy" />
              <span>{s.label}</span>
            </button>
          ))}
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
