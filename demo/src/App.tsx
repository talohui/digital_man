import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
const RealNavigationValidationPage = lazy(() => import('./pages/RealNavigationValidationPage'))
const Scenic3DMapPage = lazy(() => import('./pages/Scenic3DMapPage'))
const Scenic3DPreviewPage = lazy(() => import('./pages/Scenic3DPreviewPage'))
const ScenicMapPage = lazy(() => import('./pages/ScenicMapPage'))
const MobileProfilePage = lazy(() => import('./mobile/MobileProfilePage'))
// LOCAL HOME V2 PREVIEW - REMOVE BEFORE COMMIT
const MobileHomePageV2 = lazy(() => import('./mobile/MobileHomePageV2'))
// LOCAL CONSUME V2 PREVIEW - REMOVE BEFORE COMMIT
const MobileConsumePageV2 = lazy(() => import('./mobile/MobileConsumePageV2'))
// LOCAL CONSUME COMPONENTS PREVIEW - REMOVE BEFORE COMMIT
const MobileConsumeComponentsPreview = lazy(() => import('./mobile/MobileConsumeComponentsPreview'))
// LOCAL TICKET V2 PREVIEW - REMOVE BEFORE COMMIT
const MobileTicketPageV2 = lazy(() => import('./mobile/MobileTicketPageV2'))
// LOCAL XIAOLING GUIDE V2 PREVIEW - REMOVE BEFORE COMMIT
const MobileGuidePageV2 = lazy(() => import('./mobile/MobileGuidePageV2'))
const MobileRoutePlanPage = lazy(() => import('./mobile/MobileRoutePlanPage'))
// LOCAL MAP UI V2 PREVIEW - REMOVE BEFORE COMMIT
const Map3DGuideV2PreviewPage = lazy(() => import('./pages/Map3DGuideV2PreviewPage'))

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
  // 普通 C 端页在桌面也使用 430px 移动端容器，方便本地与运营端同路由预览。
  const isMobileCAppRoute = ['/consume', '/ticket', '/plan', '/me', '/spots'].includes(location.pathname)
  const isFormalStandaloneCAppRoute = ['/consume', '/ticket', '/plan', '/me'].includes(location.pathname)
  // LOCAL C APP V2 PREVIEW - REMOVE BEFORE COMMIT
  const isLocalV2PreviewRoute = import.meta.env.DEV && (
    location.pathname === '/home-v2' ||
    location.pathname === '/guide-v2' ||
    location.pathname === '/consume-v2' ||
    location.pathname === '/consume-components' ||
    location.pathname === '/ticket-v2' ||
    location.pathname === '/map-v2'
  )
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

  if ((isMobile || isMobileCAppRoute) && !isAdminRoute) {
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
            <Route path="/map-3d-guide-c/navigation-test" element={<RealNavigationValidationPage />} />
            <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailPage />} />
            <Route path="/map-3d-guide-c/route/:routeId" element={<Map3DRouteGuidePage />} />
            <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCPage />} />
            {/* LOCAL HOME V2 PREVIEW - REMOVE BEFORE COMMIT */}
            {import.meta.env.DEV ? <Route path="/home-v2" element={<MobileHomePageV2 />} /> : null}
            {/* LOCAL XIAOLING GUIDE V2 PREVIEW - REMOVE BEFORE COMMIT */}
            {import.meta.env.DEV ? <Route path="/guide-v2" element={<MobileGuidePageV2 />} /> : null}
            {/* LOCAL CONSUME V2 PREVIEW - REMOVE BEFORE COMMIT */}
            {import.meta.env.DEV ? <Route path="/consume-v2" element={<MobileConsumePageV2 />} /> : null}
            {/* LOCAL CONSUME COMPONENTS PREVIEW - REMOVE BEFORE COMMIT */}
            {import.meta.env.DEV ? <Route path="/consume-components" element={<MobileConsumeComponentsPreview />} /> : null}
            {/* LOCAL TICKET V2 PREVIEW - REMOVE BEFORE COMMIT */}
            {import.meta.env.DEV ? <Route path="/ticket-v2" element={<MobileTicketPageV2 />} /> : null}
            <Route path="/plan" element={<MobileRoutePlanPage />} />
            {import.meta.env.DEV ? <Route path="/plan-v2" element={<Navigate replace to="/plan" />} /> : null}
            {/* LOCAL MAP UI V2 PREVIEW - REMOVE BEFORE COMMIT */}
            {import.meta.env.DEV ? <Route path="/map-v2" element={<Map3DGuideV2PreviewPage />} /> : null}
            <Route path="/me" element={<MobileProfilePage />} />
            <Route path="*" element={<MobileShell />} />
          </Routes>
        </Suspense>
        {!isLocalV2PreviewRoute && !isFormalStandaloneCAppRoute ? (
          <>
            <GuideContextBridge />
            <LegacyNavigationNotice />
            <GlobalXiaolingAssistant />
            {!isCanonicalMapRoute && !isXiaolingFullscreenRoute ? <FloatingGuide /> : null}
          </>
        ) : null}
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
          {/* LOCAL HOME V2 PREVIEW - REMOVE BEFORE COMMIT */}
          {import.meta.env.DEV ? <Route path="/home-v2" element={<MobileHomePageV2 />} /> : null}
          {/* LOCAL XIAOLING GUIDE V2 PREVIEW - REMOVE BEFORE COMMIT */}
          {import.meta.env.DEV ? <Route path="/guide-v2" element={<MobileGuidePageV2 />} /> : null}
          {/* LOCAL CONSUME V2 PREVIEW - REMOVE BEFORE COMMIT */}
          {import.meta.env.DEV ? <Route path="/consume-v2" element={<MobileConsumePageV2 />} /> : null}
          {/* LOCAL CONSUME COMPONENTS PREVIEW - REMOVE BEFORE COMMIT */}
          {import.meta.env.DEV ? <Route path="/consume-components" element={<MobileConsumeComponentsPreview />} /> : null}
          {/* LOCAL TICKET V2 PREVIEW - REMOVE BEFORE COMMIT */}
          {import.meta.env.DEV ? <Route path="/ticket-v2" element={<MobileTicketPageV2 />} /> : null}
          {import.meta.env.DEV ? <Route path="/plan-v2" element={<Navigate replace to="/plan" />} /> : null}
          {/* LOCAL MAP UI V2 PREVIEW - REMOVE BEFORE COMMIT */}
          {import.meta.env.DEV ? <Route path="/map-v2" element={<Map3DGuideV2PreviewPage />} /> : null}
          <Route path="/map" element={<LegacyMapRedirect />} />
          <Route path="/three-preview" element={<Scenic3DPreviewPage />} />
          <Route path="/scenic-3d-map" element={<Map3DGuidePage />} />
          <Route path="/scenic-3d-map-prototype" element={<Scenic3DMapPage />} />
          <Route path="/map-3d-guide" element={<Map3DGuidePage />} />
          <Route path="/map-3d-guide-a" element={<Map3DGuidePrototypeAPage />} />
          <Route path="/map-3d-guide-b" element={<Map3DGuidePrototypeBPage />} />
          <Route path="/map-3d-guide-c/navigation-test" element={<RealNavigationValidationPage />} />
          <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailPage />} />
          <Route path="/map-3d-guide-c/route/:routeId" element={<Map3DRouteGuidePage />} />
          <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCPage />} />
          <Route path="/spot/:spotId" element={<LegacySpotRedirect />} />
          <Route path="/guide" element={<XiaolingFullscreenRoute />} />
          <Route path="/guide/classic" element={<HomePage />} />
          <Route path="/me" element={<MobileProfilePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/decision" element={<AdminMarketingDecisionPage />} />
          <Route path="/admin/heatmap" element={<ScenicMapPage />} />
          <Route path="/admin/avatar" element={<AdminAvatarPage />} />
          <Route path="/admin/kb" element={<AdminKnowledgePage />} />
          <Route path="/admin/config" element={<AdminServiceConfigPage />} />
        </Routes>
      </Suspense>
      {!isLocalV2PreviewRoute && !isFormalStandaloneCAppRoute ? (
        <>
          <GuideContextBridge />
          <LegacyNavigationNotice />
          {isCanonicalMapRoute || isXiaolingFullscreenRoute ? <GlobalXiaolingAssistant /> : null}
        </>
      ) : null}
    </RouteErrorBoundary>
  )
}

function App() {
  const location = useLocation()
  // LOCAL C APP V2 PREVIEW - REMOVE BEFORE COMMIT
  if (import.meta.env.DEV && (
    location.pathname === '/home-v2' ||
    location.pathname === '/guide-v2' ||
    location.pathname === '/consume-v2' ||
    location.pathname === '/consume-components' ||
    location.pathname === '/ticket-v2' ||
    location.pathname === '/map-v2'
  )) {
    return <AppContent />
  }

  return (
    <XiaolingRuntimeProvider>
      <AppContent />
    </XiaolingRuntimeProvider>
  )
}

export default App
