import { CompassOutlined } from '@ant-design/icons'

// 精美彩色图标(东方禅意,切自官方风格九宫格),放在 public/icons/
const tabIcon = (name: string) => (
  <img src={`/icons/${name}.png`} className="mobile-shell__tab-icon" alt="" />
)
import { lazy, Suspense, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDefaultSpotId, getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { useGuideStore } from '../store/useGuideStore'
import RouteSkeleton from '../components/RouteSkeleton'
import MobileHomePage from './MobileHomePage'
import { saveCAppReturnContext } from '../lib/cAppReturnContext'
import { getMapResumeUrl } from '../lib/mapResumeState'
import { XiaolingAvatar } from '../components/guide/XiaolingAvatar'
// 首屏只 eager 默认 tab(导览页),其余 5 页懒加载;
// prefetchHeavyTabs 会在 home 空闲帧预热,切 tab 仍秒开
const MobileGuidePage = lazy(() => import('./MobileGuidePage'))
const MobileConsumePage = lazy(() => import('./MobileConsumePage'))
const MobileProfilePage = lazy(() => import('./MobileProfilePage'))
const MobileTicketPage = lazy(() => import('./MobileTicketPage'))
const MobileRoutePlanPage = lazy(() => import('./MobileRoutePlanPage'))

type MobileTabKey = 'home' | 'map' | 'guide' | 'consume' | 'profile'

const tabs: Array<{
  key: MobileTabKey
  label: string
  path: string
  icon: ReactNode
}> = [
  { key: 'home', label: '导览', path: '/', icon: tabIcon('tab-home') },
  { key: 'map', label: '地图', path: '/map-3d-guide-c', icon: tabIcon('tab-map') },
  { key: 'guide', label: '小灵', path: '/guide', icon: <XiaolingAvatar size="tab" /> },
  { key: 'consume', label: '消费', path: '/consume', icon: tabIcon('tab-shop') },
  { key: 'profile', label: '我的', path: '/me', icon: tabIcon('tab-me') }
]

function getSpotIdFromPath(pathname: string) {
  if (!pathname.startsWith('/spot/')) return undefined
  return decodeURIComponent(pathname.slice('/spot/'.length))
}

function getActiveTab(pathname: string): MobileTabKey {
  if (pathname.startsWith('/map-3d-guide-c')) return 'map'
  if (pathname === '/consume') return 'consume'
  if (pathname === '/me') return 'profile'
  if (pathname === '/guide' || pathname.startsWith('/spot/')) return 'guide'
  return 'home'
}

function MobileShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const activeTab = getActiveTab(location.pathname)
  const route = getGuideRouteById(activeRouteId)
  const spotId = getSpotIdFromPath(location.pathname)
  const spot = spotId ? getGuideSpotById(spotId) : null
  const routeHasSelectedSpot = Boolean(
    selectedSpotId && route.stops.some((stop) => stop.spotId === selectedSpotId)
  )
  const guideSpot = spot ?? getGuideSpotById(
    routeHasSelectedSpot ? selectedSpotId : getDefaultSpotId(route.id)
  )

  const pageTitle = useMemo(() => {
    if (location.pathname === '/plan') return '行程规划'
    if (location.pathname === '/ticket') return '购票入园'
    if (location.pathname === '/consume') return '景区消费'
    if (activeTab === 'map') return '地图导览'
    if (activeTab === 'guide') return spot ? `${spot.name}讲解` : '灵山小灵'
    if (activeTab === 'profile') return '我的画像'
    return '灵山胜境'
  }, [activeTab, location.pathname, spot])

  const pageSubtitle = useMemo(() => {
    if (location.pathname === '/plan') return '选期待 · 智能推荐路线'
    if (location.pathname === '/ticket') return '生成本次游客画像'
    if (location.pathname === '/consume') return '餐饮、文创、交通、演艺'
    if (activeTab === 'home') return '选择期待，生成今日路线'
    if (activeTab === 'map') return `${route.name} · ${route.durationLabel}`
    if (activeTab === 'guide') return spot ? `${route.name} · 当前景点` : `${route.name} · ${guideSpot.name}`
    return '偏好、推荐与互动记录'
  }, [activeTab, guideSpot.name, location.pathname, route.durationLabel, route.name, spot])

  const handleTabClick = (tab: (typeof tabs)[number]) => {
    if (tab.key === 'guide') {
      const returnTo = `${location.pathname}${location.search}${location.hash}`
      saveCAppReturnContext({
        source: 'home-xiaoling',
        returnTo,
        returnScrollY: window.scrollY,
        contextType: 'browse'
      })
      navigate(`/guide?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }
    if (tab.key === 'map') {
      navigate(getMapResumeUrl())
      return
    }
    navigate(tab.path)
  }

  let page = <MobileHomePage />
  if (activeTab === 'guide') page = <MobileGuidePage spotId={spotId} />
  if (activeTab === 'profile') page = <MobileProfilePage />
  if (location.pathname === '/ticket') page = <MobileTicketPage />
  if (location.pathname === '/consume') page = <MobileConsumePage />
  if (location.pathname === '/plan') page = <MobileRoutePlanPage />

  // 地图页让出全部空间给地图本身:隐藏 shell 顶栏 + 内容区零 padding
  // 顶栏冗余信息(路线名、时长)由 MobileMapPage 自己的浮动 header 承担
  const fullBleed = activeTab === 'map'

  return (
    <div className={`mobile-shell ${fullBleed ? 'is-fullbleed' : ''}`}>
      {fullBleed ? null : (
        <header className="mobile-shell__topbar">
          <div>
            <span className="mobile-shell__eyebrow">LINGSHAN MINI TOUR</span>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          <button
            className="mobile-shell__route-chip"
            type="button"
            onClick={() => navigate(`/map-3d-guide-c/route/${encodeURIComponent(route.id)}`)}
            aria-label="查看当前路线"
          >
            <CompassOutlined />
            <span>{route.name.replace('路线', '')}</span>
          </button>
        </header>
      )}

      <main className="mobile-shell__content">
        <Suspense fallback={<RouteSkeleton />}>{page}</Suspense>
      </main>

      <nav className="mobile-shell__tabbar" aria-label="移动端主导航">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`mobile-shell__tab ${activeTab === tab.key ? 'is-active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default MobileShell
