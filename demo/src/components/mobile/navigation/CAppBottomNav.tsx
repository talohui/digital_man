import { useLocation, useNavigate } from 'react-router-dom'
import { getMapResumeUrl } from '../../../lib/mapResumeState'
import { saveCAppReturnContext } from '../../../lib/cAppReturnContext'
import { XiaolingAvatar } from '../../guide/XiaolingAvatar'
import '../../../styles/c-app/cAppBottomNav.css'

type CAppTabKey = 'home' | 'map' | 'guide' | 'consume' | 'profile'

const TABS: Array<{
  key: CAppTabKey
  label: string
  path: string
  icon?: string
}> = [
  { key: 'home', label: '导览', path: '/', icon: 'tab-home' },
  { key: 'map', label: '地图', path: '/map-3d-guide-c', icon: 'tab-map' },
  { key: 'guide', label: '小灵', path: '/guide' },
  { key: 'consume', label: '消费', path: '/consume', icon: 'tab-shop' },
  { key: 'profile', label: '我的', path: '/me', icon: 'tab-me' }
]

function getActiveTab(pathname: string): CAppTabKey {
  if (pathname.startsWith('/map-3d-guide-c')) return 'map'
  if (pathname === '/consume') return 'consume'
  if (pathname === '/me') return 'profile'
  if (pathname === '/guide' || pathname.startsWith('/spot/')) return 'guide'
  return 'home'
}

function CAppBottomNav({
  className = '',
  activeKey
}: {
  className?: string
  activeKey?: CAppTabKey
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = activeKey ?? getActiveTab(location.pathname)

  const handleTabClick = (tab: (typeof TABS)[number]) => {
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

  return (
    <nav className={`c-app-bottom-nav ${className}`.trim()} aria-label="C 端主导航">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`c-app-bottom-nav__tab ${activeTab === tab.key ? 'is-active' : ''} ${tab.key === 'guide' ? 'is-xiaoling' : ''}`.trim()}
          onClick={() => handleTabClick(tab)}
          aria-current={activeTab === tab.key ? 'page' : undefined}
        >
          <span className="c-app-bottom-nav__icon" aria-hidden="true">
            {tab.key === 'guide' ? (
              <XiaolingAvatar size="tab" />
            ) : (
              <img src={`/icons/${tab.icon}.png`} alt="" />
            )}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default CAppBottomNav
export type { CAppTabKey }
