import { useLocation, useNavigate } from 'react-router-dom'
import { saveCAppReturnContext } from '../lib/cAppReturnContext'
import { XiaolingAvatar } from './guide/XiaolingAvatar'

function shouldHideOnRoute(pathname: string) {
  return pathname === '/guide' || pathname.startsWith('/spot/')
}

function isFullbleedRoute(pathname: string) {
  return pathname === '/map' || pathname === '/map-3d-guide'
}

function FloatingGuide() {
  const location = useLocation()
  const navigate = useNavigate()

  if (shouldHideOnRoute(location.pathname)) return null

  return (
    <button
      type="button"
      className={`floating-guide__fab ${isFullbleedRoute(location.pathname) ? 'is-fullbleed' : ''}`}
      onClick={() => {
        const returnTo = `${location.pathname}${location.search}${location.hash}`
        saveCAppReturnContext({
          source: 'home-xiaoling',
          returnTo,
          returnScrollY: window.scrollY,
          contextType: 'browse'
        })
        navigate(`/guide?returnTo=${encodeURIComponent(returnTo)}`)
      }}
      aria-label="进入灵山小灵数字人导览"
    >
      <span className="floating-guide__fab-pulse" aria-hidden />
      <span className="floating-guide__fab-avatar" data-xiaoling-live2d-anchor="badge">
        <XiaolingAvatar size="floating" />
      </span>
      <span className="floating-guide__fab-tip">问小灵</span>
    </button>
  )
}

export default FloatingGuide
