import { RightOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { guideSpots } from '../data/guideData'
import { DEFAULT_SCENE_ID } from '../store/chatSessions'
import { useChatStore } from '../store/useChatStore'
import { useGuideStore } from '../store/useGuideStore'
import { getPoiMedia } from '../data/scenicMediaCatalog'
import {
  consumeCAppReturnContext,
  readCAppReturnContext,
  saveCAppReturnContext
} from '../lib/cAppReturnContext'
import PlaqueTitle from '../components/mobile/home/PlaqueTitle'
import MountainGate from '../components/mobile/home/MountainGate'
import '../styles/c-app/mobileHome.css'

// 景区服务宫格(精美图标入口,放在 public/icons/)
const SERVICES = [
  { icon: 'cat-food', label: '餐饮斋茶', to: '/consume' },
  { icon: 'cat-culture', label: '文创礼品', to: '/consume' },
  { icon: 'cat-show', label: '演艺秀场', to: '/consume' },
  { icon: 'cat-spot', label: '灵山景点', to: '/spots' }
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
  ...CROWD_STATUS_BY_SPOT_ID[spot.id],
  image: getPoiMedia(spot.id).thumbnail ?? getPoiMedia(spot.id).cover
}))

function formatCrowdUpdateTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date())
}

function MobileHomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const crowdUpdateTime = formatCrowdUpdateTime()

  useEffect(() => {
    ensureUserId()
    setActiveScene(DEFAULT_SCENE_ID, null)
    // 空闲帧预热 Live2D / ChatPanel / TMap,切 tab 秒开
    void import('../lib/prefetch').then((m) => m.prefetchHeavyTabs())
  }, [ensureUserId, setActiveScene])

  useEffect(() => {
    const context = readCAppReturnContext()
    const currentUrl = `${location.pathname}${location.search}${location.hash}`
    if (!context || !context.source.startsWith('home-') || context.returnTo !== currentUrl) return undefined

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (Number.isFinite(context.returnScrollY)) {
          window.scrollTo({ top: context.returnScrollY, behavior: 'auto' })
        } else if (context.returnAnchor) {
          document.getElementById(context.returnAnchor)?.scrollIntoView({ block: 'start' })
        }
        consumeCAppReturnContext()
      })
    })
    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [location.hash, location.pathname, location.search])

  const saveHomeReturn = (returnAnchor: string, poiId?: string) => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    saveCAppReturnContext({
      source: 'home-crowd',
      returnTo,
      returnScrollY: window.scrollY,
      returnAnchor,
      poiId
    })
    return returnTo
  }

  return (
    <div className="home-v2-preview home-formal-preview c-app-root">
      <div className="home-v2-device home-formal-device">
        <main className="home-v2-page home-formal-page">
          <div className="home-formal-artboard">
            <img
              className="home-formal-artboard__background"
              src="/images/c-app/lingshan-home-scroll.webp"
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <svg className="home-v2-companion-path" viewBox="0 0 430 760" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="home-formal-companion-gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e4cf91" />
                  <stop offset="0.52" stopColor="#c9a86a" />
                  <stop offset="1" stopColor="#8e713b" />
                </linearGradient>
              </defs>
              <path className="home-v2-companion-path__base" pathLength="1" d="M215 4 C104 24 42 82 42 154 C42 236 388 232 388 322 C388 408 42 407 42 500 C42 592 388 588 388 664 C388 713 294 741 215 756" />
              <path className="home-v2-companion-path__light home-formal-companion-path__light" pathLength="1" d="M215 4 C104 24 42 82 42 154 C42 236 388 232 388 322 C388 408 42 407 42 500 C42 592 388 588 388 664 C388 713 294 741 215 756" />
            </svg>

            <section className="home-v2-hero" aria-label="灵山胜境 AI 智能导览首页">
              <header className="home-v2-header">
                <div className="home-v2-brand">
                  <span>灵山胜境</span>
                  <strong>AI 智能导览</strong>
                </div>
                <div className="home-v2-weather" aria-label="天气多云 26 摄氏度，舒适宜游">
                  <span className="home-v2-weather__icon" aria-hidden="true">☁</span>
                  <span><strong>多云 26℃</strong><small>舒适宜游</small></span>
                </div>
              </header>

              <PlaqueTitle title="游览路线" className="home-v2-journey-title" />
              <MountainGate
                variant="route"
                delay={580}
                onClick={() => navigate('/plan')}
                ariaLabel="规划我的游览路线"
              >
                <span className="home-v2-journey-gate__copy">
                  <strong>规划我的游览路线</strong>
                  <small>选择游览偏好，由小灵智能生成</small>
                </span>
                <span className="home-v2-journey-gate__arrow" aria-hidden="true">›</span>
              </MountainGate>
            </section>

            <section className="home-v2-services" aria-labelledby="home-services-title">
              <div className="home-v2-section-heading">
                <PlaqueTitle title="景区服务" id="home-services-title" />
              </div>
              <MountainGate variant="services" delay={1445}>
                <div className="home-v2-service-grid">
                  {SERVICES.map((service) => (
                    <button key={service.label} type="button" onClick={() => navigate(service.to)}>
                      <span className="home-v2-service-icon">
                        <img src={`/icons/${service.icon}.png`} alt="" />
                      </span>
                      <strong>{service.label}</strong>
                    </button>
                  ))}
                </div>
              </MountainGate>
            </section>

            <section className="home-v2-crowd" id="c-app-home-crowd" aria-labelledby="home-crowd-title">
              <div className="home-v2-section-heading">
                <PlaqueTitle title="实时客流" id="home-crowd-title" />
              </div>
              <MountainGate variant="crowd" delay={2215}>
                <div className="home-v2-crowd__panel home-formal-crowd-card">
                  <div className="mobile-crowd-card__top">
                    <div>
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
                      <span>演示数据 · {CROWD_SPOTS.length} 个点位</span>
                    </div>
                    <div className="mobile-crowd-list" tabIndex={0} aria-label="景点客流演示列表，可上下滚动">
                      {CROWD_SPOTS.map((spot) => (
                        <button
                          key={spot.id}
                          type="button"
                          className="mobile-crowd-row"
                          onClick={() => {
                            saveHomeReturn('c-app-home-crowd', spot.id)
                            navigate(`/map-3d-guide-c/poi/${encodeURIComponent(spot.id)}?from=browse`)
                          }}
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
                </div>
              </MountainGate>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MobileHomePage
