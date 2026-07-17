import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { resolveLegacyPoiId } from '../data/legacyPoiRoutes'

type LegacyNavigationState = {
  legacyNavigationNotice?: string
}

export function LegacyMapRedirect() {
  return <Navigate to="/map-3d-guide-c" replace />
}

export function LegacySpotRedirect() {
  const { spotId } = useParams()
  const resolvedPoiId = resolveLegacyPoiId(spotId)
  if (resolvedPoiId) {
    return <Navigate to={`/map-3d-guide-c/poi/${encodeURIComponent(resolvedPoiId)}?from=browse`} replace />
  }
  return (
    <Navigate
      to="/map-3d-guide-c"
      replace
      state={{ legacyNavigationNotice: '没有找到这个旧景点入口，已返回新版地图。' } satisfies LegacyNavigationState}
    />
  )
}

export function LegacyNavigationNotice() {
  const location = useLocation()
  const navigate = useNavigate()
  const notice = (location.state as LegacyNavigationState | null)?.legacyNavigationNotice

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => {
      navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null })
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [location.hash, location.pathname, location.search, navigate, notice])

  return notice ? <div className="legacy-navigation-notice" role="status">{notice}</div> : null
}
