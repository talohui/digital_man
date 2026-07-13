import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin'
import AdminMobileNotice from './pages/AdminMobileNotice'
import HomePage from './pages/HomePage'
import SplashAdPage from './pages/SplashAdPage'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import RouteSkeleton from './components/RouteSkeleton'
import FloatingGuide from './components/FloatingGuide'
import { LegacyMapRedirect, LegacyNavigationNotice, LegacySpotRedirect } from './components/LegacyCAppRedirects'
import { GlobalXiaolingAssistant } from './components/guide'
import MobileShell from './mobile/MobileShell'
import { GuideContextBridge, XiaolingRuntimeProvider } from './guide'
import { isAdminAuthed } from './lib/adminAuth'
import { unlockAudio } from './lib/audioLipsync'
import { markLingshanSplashSeen, shouldShowLingshanSplash } from './lib/introStorage'
import { scheduleMap3DGuidePreload } from './lib/map3dPreload'
import { useIsMobileViewport } from './hooks/useIsMobileViewport'

const AdminAvatarPage = lazy(() => import('./pages/AdminAvatarPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminKnowledgePage = lazy(() => import('./pages/AdminKnowledgePage'))
const AdminMarketingDecisionPage = lazy(() => import('./pages/AdminMarketingDecisionPage'))
const AdminServiceConfigPage = lazy(() => import('./pages/AdminServiceConfigPage'))
const Map3DGuidePage = lazy(() => import('./pages/Map3DGuidePage'))
const Map3DGuidePrototypeAPage = lazy(() => import('./pages/Map3DGuidePrototypeAPage'))
const Map3DGuidePrototypeBPage = lazy(() => import('./pages/Map3DGuidePrototypeBPage'))
const Map3DGuidePrototypeCPage = lazy(() => import('./pages/Map3DGuidePrototypeCPage'))
const Map3DPoiDetailPage = lazy(() => import('./pages/Map3DPoiDetailPage'))
const Map3DRouteGuidePage = lazy(() => import('./pages/Map3DRouteGuidePage'))
const Scenic3DMapPage = lazy(() => import('./pages/Scenic3DMapPage'))
const Scenic3DPreviewPage = lazy(() => import('./pages/Scenic3DPreviewPage'))
const ScenicMapPage = lazy(() => import('./pages/ScenicMapPage'))

function XiaolingFullscreenRoute() {
  return <div className="xiaoling-fullscreen-route" aria-hidden="true" />
}

function AppContent() {
  const location = useLocation()
  const isMobile = useIsMobileViewport()
  const isHomeRoute = location.pathname === '/'
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isMapPoiDetailRoute = location.pathname.startsWith('/map-3d-guide-c/poi')
  const isCanonicalMapRoute = location.pathname.startsWith('/map-3d-guide-c')
  const isXiaolingFullscreenRoute = location.pathname === '/guide'
  const isWideAdminScreen =
    location.pathname === '/admin' || location.pathname.startsWith('/admin/heatmap')
  const [adminAuthed, setAdminAuthed] = useState(() => isAdminAuthed())
  const [forceAdminMobile, setForceAdminMobile] = useState(
    () =>
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('lingshan_admin_force_mobile') === '1'
  )
  const [showSplash, setShowSplash] = useState(() => isHomeRoute && shouldShowLingshanSplash())

  useEffect(() => {
    if (!isAdminRoute) {
      scheduleMap3DGuidePreload({ includeLandmarkAssets: !isMapPoiDetailRoute })
    }
  }, [isAdminRoute, isMapPoiDetailRoute])

  useEffect(() => {
    const unlock = () => {
      void unlockAudio().then((unlocked) => {
        if (!unlocked) return
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('touchend', unlock)
      })
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('touchend', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchend', unlock)
    }
  }, [])

  useEffect(() => {
    if (isHomeRoute) {
      setShowSplash(shouldShowLingshanSplash())
      return
    }
    setShowSplash(false)
  }, [isHomeRoute])

  const finishSplash = useCallback(() => {
    markLingshanSplashSeen()
    setShowSplash(false)
  }, [])

  const continueAdminMobile = useCallback(() => {
    try {
      sessionStorage.setItem('lingshan_admin_force_mobile', '1')
    } catch {
      // 隐私模式等场景下忽略。
    }
    setForceAdminMobile(true)
  }, [])

  if (isHomeRoute && showSplash) return <SplashAdPage onFinish={finishSplash} />

  if (isMobile && !isAdminRoute) {
    return (
      <RouteErrorBoundary>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/guide" element={<XiaolingFullscreenRoute />} />
            <Route path="/guide/classic" element={<HomePage />} />
            <Route path="/map" element={<LegacyMapRedirect />} />
            <Route path="/spot/:spotId" element={<LegacySpotRedirect />} />
            <Route path="/three-preview" element={<Scenic3DPreviewPage />} />
            <Route path="/scenic-3d-map" element={<Map3DGuidePage />} />
            <Route path="/scenic-3d-map-prototype" element={<Scenic3DMapPage />} />
            <Route path="/map-3d-guide" element={<Map3DGuidePage />} />
            <Route path="/map-3d-guide-a" element={<Map3DGuidePrototypeAPage />} />
            <Route path="/map-3d-guide-b" element={<Map3DGuidePrototypeBPage />} />
            <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailPage />} />
            <Route path="/map-3d-guide-c/route/:routeId" element={<Map3DRouteGuidePage />} />
            <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCPage />} />
            <Route path="*" element={<MobileShell />} />
          </Routes>
        </Suspense>
        <GuideContextBridge />
        <LegacyNavigationNotice />
        {isCanonicalMapRoute || isXiaolingFullscreenRoute ? <GlobalXiaolingAssistant /> : <FloatingGuide />}
      </RouteErrorBoundary>
    )
  }

  if (isMobile && isWideAdminScreen && !forceAdminMobile) {
    return (
      <RouteErrorBoundary>
        <AdminMobileNotice onContinue={continueAdminMobile} />
      </RouteErrorBoundary>
    )
  }

  if (isAdminRoute && !adminAuthed) {
    return (
      <RouteErrorBoundary>
        <AdminLogin onSuccess={() => setAdminAuthed(true)} />
      </RouteErrorBoundary>
    )
  }

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<LegacyMapRedirect />} />
          <Route path="/three-preview" element={<Scenic3DPreviewPage />} />
          <Route path="/scenic-3d-map" element={<Map3DGuidePage />} />
          <Route path="/scenic-3d-map-prototype" element={<Scenic3DMapPage />} />
          <Route path="/map-3d-guide" element={<Map3DGuidePage />} />
          <Route path="/map-3d-guide-a" element={<Map3DGuidePrototypeAPage />} />
          <Route path="/map-3d-guide-b" element={<Map3DGuidePrototypeBPage />} />
          <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailPage />} />
          <Route path="/map-3d-guide-c/route/:routeId" element={<Map3DRouteGuidePage />} />
          <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCPage />} />
          <Route path="/spot/:spotId" element={<LegacySpotRedirect />} />
          <Route path="/guide" element={<XiaolingFullscreenRoute />} />
          <Route path="/guide/classic" element={<HomePage />} />
          <Route path="/me" element={<HomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/decision" element={<AdminMarketingDecisionPage />} />
          <Route path="/admin/heatmap" element={<ScenicMapPage />} />
          <Route path="/admin/avatar" element={<AdminAvatarPage />} />
          <Route path="/admin/kb" element={<AdminKnowledgePage />} />
          <Route path="/admin/config" element={<AdminServiceConfigPage />} />
        </Routes>
      </Suspense>
      <GuideContextBridge />
      <LegacyNavigationNotice />
      {isCanonicalMapRoute || isXiaolingFullscreenRoute ? <GlobalXiaolingAssistant /> : null}
    </RouteErrorBoundary>
  )
}

function App() {
  return (
    <XiaolingRuntimeProvider>
      <AppContent />
    </XiaolingRuntimeProvider>
  )
}

export default App
