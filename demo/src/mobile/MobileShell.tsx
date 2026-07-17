import { CompassOutlined } from '@ant-design/icons'
import { lazy, Suspense, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDefaultSpotId, getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { useGuideStore } from '../store/useGuideStore'
import RouteSkeleton from '../components/RouteSkeleton'
import MobileHomePage from './MobileHomePage'
import CAppBottomNav from '../components/mobile/navigation/CAppBottomNav'
// 首屏只 eager 默认 tab(导览页),其余 5 页懒加载;
// prefetchHeavyTabs 会在 home 空闲帧预热,切 tab 仍秒开
const MobileGuidePage = lazy(() => import('./MobileGuidePage'))
const MobileConsumePage = lazy(() => import('./MobileConsumePage'))
const MobileProfilePage = lazy(() => import('./MobileProfilePage'))
const MobileTicketPage = lazy(() => import('./MobileTicketPage'))
const MobileScenicSpotsPage = lazy(() => import('./MobileScenicSpotsPage'))

type MobileTabKey = 'home' | 'map' | 'guide' | 'consume' | 'profile'

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
    if (location.pathname === '/ticket') return '购票入园'
    if (location.pathname === '/consume') return '景区消费'
    if (activeTab === 'map') return '地图导览'
    if (activeTab === 'guide') return spot ? `${spot.name}讲解` : '灵山小灵'
    if (activeTab === 'profile') return '我的画像'
    return '灵山胜境'
  }, [activeTab, location.pathname, spot])

  const pageSubtitle = useMemo(() => {
    if (location.pathname === '/ticket') return '生成本次游客画像'
    if (location.pathname === '/consume') return '餐饮、文创、交通、演艺'
    if (activeTab === 'home') return '选择期待，生成今日路线'
    if (activeTab === 'map') return `${route.name} · ${route.durationLabel}`
    if (activeTab === 'guide') return spot ? `${route.name} · 当前景点` : `${route.name} · ${guideSpot.name}`
    return '偏好、推荐与互动记录'
  }, [activeTab, guideSpot.name, location.pathname, route.durationLabel, route.name, spot])

  let page = <MobileHomePage />
  if (activeTab === 'guide') page = <MobileGuidePage spotId={spotId} />
  if (activeTab === 'profile') page = <MobileProfilePage />
  if (location.pathname === '/ticket') page = <MobileTicketPage />
  if (location.pathname === '/consume') page = <MobileConsumePage />
  if (location.pathname === '/spots') page = <MobileScenicSpotsPage />

  // 地图、导览首页、景点列表与正式消费页使用沉浸式全幅布局。
  const immersiveHome = location.pathname === '/'
  const immersiveConsume = location.pathname === '/consume'
  // 正式票务使用“入境仪式”全幅页面，自带阶段内底部导航，避免与壳层重复。
  const immersiveTicket = location.pathname === '/ticket'
  const immersiveSpots = location.pathname === '/spots'
  const fullBleed = activeTab === 'map' || immersiveHome || immersiveConsume || immersiveTicket || immersiveSpots

  return (
    <div className={`mobile-shell ${fullBleed ? 'is-fullbleed' : ''} ${immersiveHome ? 'is-home-immersive' : ''}`.trim()}>
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

      {immersiveConsume || immersiveTicket ? null : <CAppBottomNav />}
    </div>
  )
}

export default MobileShell
