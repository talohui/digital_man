import {
  CompassOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  MessageOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getGuideRouteById } from '../data/guideData'
import { useGuideStore } from '../store/useGuideStore'
import MobileHomePage from './MobileHomePage'
import MobileConsumePage from './MobileConsumePage'
import MobileProfilePage from './MobileProfilePage'
import MobileTicketPage from './MobileTicketPage'

type MobileTabKey = 'home' | 'map' | 'guide' | 'profile'

const tabs: Array<{
  key: MobileTabKey
  label: string
  path: string
  icon: ReactNode
}> = [
  { key: 'home', label: '导览', path: '/', icon: <HomeOutlined /> },
  { key: 'map', label: '地图', path: '/map-3d-guide-c', icon: <EnvironmentOutlined /> },
  { key: 'guide', label: '小灵', path: '/guide', icon: <MessageOutlined /> },
  { key: 'profile', label: '我的', path: '/me', icon: <UserOutlined /> }
]

function getActiveTab(pathname: string): MobileTabKey {
  if (pathname.startsWith('/map-3d-guide-c')) return 'map'
  if (pathname === '/me' || pathname === '/consume') return 'profile'
  if (pathname === '/guide' || pathname.startsWith('/spot/')) return 'guide'
  return 'home'
}

function MobileShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const activeTab = getActiveTab(location.pathname)
  const route = getGuideRouteById(activeRouteId)

  const pageTitle = useMemo(() => {
    if (location.pathname === '/ticket') return '购票入园'
    if (location.pathname === '/consume') return '景区消费'
    if (activeTab === 'map') return '地图导览'
    if (activeTab === 'guide') return '灵山小灵'
    if (activeTab === 'profile') return '我的画像'
    return '灵山胜境'
  }, [activeTab, location.pathname])

  const pageSubtitle = useMemo(() => {
    if (location.pathname === '/ticket') return '生成本次游客画像'
    if (location.pathname === '/consume') return '餐饮、文创、交通、演艺'
    if (activeTab === 'home') return '选择期待，生成今日路线'
    if (activeTab === 'map') return `${route.name} · ${route.durationLabel}`
    if (activeTab === 'guide') return `${route.name} · 路线场景`
    return '偏好、推荐与互动记录'
  }, [activeTab, location.pathname, route.durationLabel, route.name])

  const handleTabClick = (tab: (typeof tabs)[number]) => {
    if (tab.key === 'guide') {
      navigate('/guide')
      return
    }
    navigate(tab.path)
  }

  let page = <MobileHomePage />
  if (activeTab === 'profile') page = <MobileProfilePage />
  if (location.pathname === '/ticket') page = <MobileTicketPage />
  if (location.pathname === '/consume') page = <MobileConsumePage />

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

      <main className="mobile-shell__content">{page}</main>

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
