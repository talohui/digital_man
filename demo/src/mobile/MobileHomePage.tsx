import { CompassOutlined, MessageOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGuideRouteById, guideSpots } from '../data/guideData'
import { DEFAULT_SCENE_ID } from '../store/chatSessions'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'

// 景区服务宫格(精美图标入口,放在 public/icons/)
const SERVICES = [
  { icon: 'cat-food', label: '餐饮斋茶', to: '/consume' },
  { icon: 'cat-culture', label: '文创礼品', to: '/consume' },
  { icon: 'cat-show', label: '演艺秀场', to: '/consume' },
  { icon: 'cat-spot', label: '灵山景点', to: '/map-3d-guide-c' }
]

type CrowdTone = 'busy' | 'steady' | 'calm'

type CrowdStatus = {
  level: string
  hint: string
  image: string
  people: 1 | 2 | 3
  tone: CrowdTone
}

const CROWD_STATUS_BY_SPOT_ID: Record<string, CrowdStatus> = {
  south_gate: {
    level: '适中',
    hint: '入园排队平稳，适合按计划进园',
    image: '/scenic/spots/south-gate.jpg',
    people: 2,
    tone: 'steady'
  },
  lingshan_wall: {
    level: '舒适',
    hint: '照壁前停留分散，拍照无需久等',
    image: '/scenic/spots/lingshan-wall.jpg',
    people: 1,
    tone: 'calm'
  },
  shengjing_square: {
    level: '适中',
    hint: '广场通行顺畅，注意结伴同行',
    image: '/intro/splash/splash-05.webp',
    people: 2,
    tone: 'steady'
  },
  fozu_tan: {
    level: '舒适',
    hint: '礼佛开场点位较安静，可从容停留',
    image: '/scenic/spots/fozu-tan.jpg',
    people: 1,
    tone: 'calm'
  },
  jiulong_guanyu: {
    level: '偏拥挤',
    hint: '演出前后人流集中，建议错峰观看',
    image: '/intro/splash/splash-04.webp',
    people: 3,
    tone: 'busy'
  },
  puti_avenue: {
    level: '舒适',
    hint: '步行廊道人流分散，适合慢行观景',
    image: '/scenic/spots/puti-avenue.jpg',
    people: 1,
    tone: 'calm'
  },
  foshou_square: {
    level: '适中',
    hint: '互动打卡有短暂停留，排队可控',
    image: '/scenic/spots/foshou-square.jpg',
    people: 2,
    tone: 'steady'
  },
  xiangfu_temple: {
    level: '舒适',
    hint: '寺院区参观节奏平稳，适合静心游览',
    image: '/scenic/spots/xiangfu-temple.jpg',
    people: 1,
    tone: 'calm'
  },
  xingtan_square: {
    level: '舒适',
    hint: '广场停留较少，可作为短休节点',
    image: '/scenic/spots/xingtan-square.jpg',
    people: 1,
    tone: 'calm'
  },
  foqian_square: {
    level: '偏拥挤',
    hint: '登临大佛前人流较高，注意台阶节奏',
    image: '/scenic/spots/foqian-square.jpg',
    people: 3,
    tone: 'busy'
  },
  giant_buddha: {
    level: '偏拥挤',
    hint: '礼佛区人流偏高，建议稍后再上行',
    image: '/intro/splash/splash-03.webp',
    people: 3,
    tone: 'busy'
  },
  baizi_mile: {
    level: '适中',
    hint: '亲子停留较多，互动区整体顺畅',
    image: '/scenic/spots/baizi-mile.jpg',
    people: 2,
    tone: 'steady'
  },
  fan_gong: {
    level: '适中',
    hint: '室内参观节奏平稳，适合按路线前往',
    image: '/intro/splash/splash-01.webp',
    people: 2,
    tone: 'steady'
  },
  fan_gong_square: {
    level: '舒适',
    hint: '广场空间开阔，适合休息与集合',
    image: '/intro/splash/splash-01.webp',
    people: 1,
    tone: 'calm'
  },
  wuyin_tancheng: {
    level: '适中',
    hint: '转经与拍照点位有停留，通行正常',
    image: '/scenic/spots/wuyin-tancheng.jpg',
    people: 2,
    tone: 'steady'
  },
  manfeilong_tower: {
    level: '舒适',
    hint: '塔区人流较少，适合轻松打卡',
    image: '/scenic/spots/manfeilong-tower.jpg',
    people: 1,
    tone: 'calm'
  },
  lingshan_jingshe: {
    level: '舒适',
    hint: '精舍周边安静，适合放慢节奏',
    image: '/scenic/spots/lingshan-jingshe.jpg',
    people: 1,
    tone: 'calm'
  },
  sansheng_hall: {
    level: '舒适',
    hint: '展陈区客流稳定，适合补充历史讲解',
    image: '/scenic/spots/sansheng-hall.jpg',
    people: 1,
    tone: 'calm'
  },
  exit: {
    level: '适中',
    hint: '离园通道正常，注意返程接驳时间',
    image: '/scenic/spots/exit.jpg',
    people: 2,
    tone: 'steady'
  }
}

const CROWD_SPOTS = guideSpots.map((spot) => ({
  id: spot.id,
  name: spot.name,
  ...CROWD_STATUS_BY_SPOT_ID[spot.id]
}))

function formatCrowdUpdateTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date())
}

function MobileHomePage() {
  const navigate = useNavigate()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const route = getGuideRouteById(activeRouteId)
  const crowdUpdateTime = formatCrowdUpdateTime()

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

      <section className="mobile-crowd-card" aria-label="实时客流">
        <div className="mobile-crowd-card__top">
          <div>
            <span className="mobile-crowd-card__kicker">实时客流</span>
            <h3>当前景区人流量适中</h3>
            <p>更新于 {crowdUpdateTime}</p>
          </div>
          <button type="button" onClick={() => navigate('/map-3d-guide-c')}>
            看地图
            <RightOutlined />
          </button>
        </div>

        <div className="mobile-crowd-card__panel">
          <div className="mobile-crowd-card__panel-head">
            <strong>景点实时客流情况</strong>
            <span>{CROWD_SPOTS.length} 个点位</span>
          </div>
          <div className="mobile-crowd-list">
            {CROWD_SPOTS.map((spot) => (
              <button
                key={spot.id}
                type="button"
                className="mobile-crowd-row"
                onClick={() => navigate(`/map-3d-guide-c/poi/${encodeURIComponent(spot.id)}?from=browse`)}
              >
                <img className="mobile-crowd-row__photo" src={spot.image} alt="" loading="lazy" />
                <span className="mobile-crowd-row__main">
                  <strong>{spot.name}</strong>
                  <small>{spot.hint}</small>
                </span>
                <span
                  className={`mobile-crowd-row__people is-${spot.tone}`}
                  aria-label={`${spot.name}拥挤度：${spot.level}`}
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <span key={index} className={index < spot.people ? 'is-active' : ''} />
                  ))}
                </span>
                <span className={`mobile-crowd-row__level is-${spot.tone}`}>
                  {spot.level}
                </span>
              </button>
            ))}
          </div>
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
