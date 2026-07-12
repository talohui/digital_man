import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom'
import { GlobalXiaolingAssistant } from './components/guide'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import { useIsMobileViewport } from './hooks/useIsMobileViewport'
import { scheduleMap3DGuidePreload } from './lib/map3dPreload'
import { GuideContextBridge, XiaolingRuntimeProvider } from './guide'
import { resolveLegacySpotId } from './data/legacyPoiRoutes'

const AppProviders = lazy(() => import('./components/AppProviders'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminAvatarPage = lazy(() => import('./pages/AdminAvatarPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const Scenic3DPreviewPage = lazy(() => import('./pages/Scenic3DPreviewPage'))
const Scenic3DMapPage = lazy(() => import('./pages/Scenic3DMapPage'))
const Map3DGuidePage = lazy(() => import('./pages/Map3DGuidePage'))
const Map3DGuidePrototypeAPage = lazy(() => import('./pages/Map3DGuidePrototypeAPage'))
const Map3DGuidePrototypeBPage = lazy(() => import('./pages/Map3DGuidePrototypeBPage'))
const Map3DGuidePrototypeCPage = lazy(() => import('./pages/Map3DGuidePrototypeCPage'))
const Map3DPoiDetailPage = lazy(() => import('./pages/Map3DPoiDetailPage'))
const Map3DRouteGuidePage = lazy(() => import('./pages/Map3DRouteGuidePage'))
const MobileShell = lazy(() => import('./mobile/MobileShell'))

type LazyRouteProps = {
  children: ReactNode
  label: string
}

function RouteLoading({ label }: { label: string }) {
  return <div style={{ padding: 24 }}>{label}</div>
}

function PlainLazyRoute({ children, label }: LazyRouteProps) {
  return <Suspense fallback={<RouteLoading label={label} />}>{children}</Suspense>
}

function AppLazyRoute({ children, label }: LazyRouteProps) {
  return (
    <Suspense fallback={<RouteLoading label={label} />}>
      <AppProviders>
        {children}
      </AppProviders>
    </Suspense>
  )
}

function ThreePreviewRoute() {
  return (
    <PlainLazyRoute label="正在加载 3D 预览...">
      <Scenic3DPreviewPage />
    </PlainLazyRoute>
  )
}

function Scenic3DMapRoute() {
  return (
    <PlainLazyRoute label="正在加载真实 3D 地图导览...">
      <Map3DGuidePage />
    </PlainLazyRoute>
  )
}

function Scenic3DMapPrototypeRoute() {
  return (
    <PlainLazyRoute label="正在加载 3D 景区地图原型...">
      <Scenic3DMapPage />
    </PlainLazyRoute>
  )
}

function Map3DGuideRoute() {
  return (
    <PlainLazyRoute label="正在加载真实 3D 地图导览...">
      <Map3DGuidePage />
    </PlainLazyRoute>
  )
}

function Map3DGuidePrototypeARoute() {
  return (
    <PlainLazyRoute label="正在加载 3D 导览视觉原型 A...">
      <Map3DGuidePrototypeAPage />
    </PlainLazyRoute>
  )
}

function Map3DGuidePrototypeBRoute() {
  return (
    <PlainLazyRoute label="正在加载 3D 导览视觉原型 B...">
      <Map3DGuidePrototypeBPage />
    </PlainLazyRoute>
  )
}

function Map3DGuidePrototypeCRoute() {
  return (
    <PlainLazyRoute label="正在加载 3D 导览视觉原型 C...">
      <Map3DGuidePrototypeCPage />
    </PlainLazyRoute>
  )
}

function Map3DPoiDetailRoute() {
  return (
    <PlainLazyRoute label="正在加载景点详情...">
      <Map3DPoiDetailPage />
    </PlainLazyRoute>
  )
}

function Map3DRouteGuideRoute() {
  return (
    <PlainLazyRoute label="正在加载路线游览...">
      <Map3DRouteGuidePage />
    </PlainLazyRoute>
  )
}

function HomeRoute() {
  return (
    <AppLazyRoute label="正在加载智慧导览...">
      <HomePage />
    </AppLazyRoute>
  )
}

function AdminDashboardRoute() {
  return (
    <AppLazyRoute label="正在加载管理后台...">
      <AdminDashboard />
    </AppLazyRoute>
  )
}

function AdminAvatarRoute() {
  return (
    <AppLazyRoute label="正在加载数字人配置...">
      <AdminAvatarPage />
    </AppLazyRoute>
  )
}

function MobileShellRoute() {
  return (
    <AppLazyRoute label="正在加载移动端导览...">
      <MobileShell />
    </AppLazyRoute>
  )
}

function XiaolingFullscreenRoute() {
  return <div className="xiaoling-fullscreen-route" aria-hidden="true" />
}

function LegacyMapRedirect() {
  return <Navigate replace to="/map-3d-guide-c" />
}

/** Legacy C-app route retained as a redirect; the old pages remain available for rollback. */
function LegacySpotRedirect() {
  const { spotId } = useParams()
  const navigate = useNavigate()
  const resolvedPoiId = resolveLegacySpotId(spotId)

  useEffect(() => {
    if (resolvedPoiId) return
    const timer = window.setTimeout(() => navigate('/map-3d-guide-c', { replace: true }), 1600)
    return () => window.clearTimeout(timer)
  }, [navigate, resolvedPoiId])

  if (resolvedPoiId) {
    return <Navigate replace to={`/map-3d-guide-c/poi/${encodeURIComponent(resolvedPoiId)}?from=browse`} />
  }

  return (
    <main className="legacy-spot-redirect" role="status">
      <strong>未找到这个旧景点</strong>
      <span>正在返回新版灵山地图，你可以从地图中重新选择景点。</span>
      <button type="button" onClick={() => navigate('/map-3d-guide-c', { replace: true })}>立即返回地图</button>
    </main>
  )
}

function App() {
  const location = useLocation()
  const isMobile = useIsMobileViewport()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isMapPoiDetailRoute = location.pathname.startsWith('/map-3d-guide-c/poi')

  useEffect(() => {
    if (!isAdminRoute) {
      scheduleMap3DGuidePreload({
        includeLandmarkAssets: !isMapPoiDetailRoute
      })
    }
  }, [isAdminRoute, isMapPoiDetailRoute])

  const routeContent = isMobile && !isAdminRoute ? (
          <Routes>
            <Route path="/three-preview" element={<ThreePreviewRoute />} />
            <Route path="/scenic-3d-map" element={<Scenic3DMapRoute />} />
            <Route path="/scenic-3d-map-prototype" element={<Scenic3DMapPrototypeRoute />} />
            <Route path="/map-3d-guide" element={<Map3DGuideRoute />} />
            <Route path="/map-3d-guide-a" element={<Map3DGuidePrototypeARoute />} />
            <Route path="/map-3d-guide-b" element={<Map3DGuidePrototypeBRoute />} />
            <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailRoute />} />
            <Route path="/map-3d-guide-c/route/:routeId" element={<Map3DRouteGuideRoute />} />
            <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCRoute />} />
            <Route path="/guide" element={<XiaolingFullscreenRoute />} />
            <Route path="/map" element={<LegacyMapRedirect />} />
            <Route path="/spot/:spotId" element={<LegacySpotRedirect />} />
            <Route path="*" element={<MobileShellRoute />} />
          </Routes>
  ) : (
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/map" element={<LegacyMapRedirect />} />
          <Route path="/spot/:spotId" element={<LegacySpotRedirect />} />
          <Route path="/three-preview" element={<ThreePreviewRoute />} />
          <Route path="/scenic-3d-map" element={<Scenic3DMapRoute />} />
          <Route path="/scenic-3d-map-prototype" element={<Scenic3DMapPrototypeRoute />} />
          <Route path="/map-3d-guide" element={<Map3DGuideRoute />} />
          <Route path="/map-3d-guide-a" element={<Map3DGuidePrototypeARoute />} />
          <Route path="/map-3d-guide-b" element={<Map3DGuidePrototypeBRoute />} />
          <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailRoute />} />
          <Route path="/map-3d-guide-c/route/:routeId" element={<Map3DRouteGuideRoute />} />
          <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCRoute />} />
          <Route path="/guide" element={<XiaolingFullscreenRoute />} />
          <Route path="/me" element={<HomeRoute />} />
          <Route path="/admin" element={<AdminDashboardRoute />} />
          <Route path="/admin/avatar" element={<AdminAvatarRoute />} />
        </Routes>
  )

  return (
    <RouteErrorBoundary>
      <XiaolingRuntimeProvider enabled={!isAdminRoute}>
        <GuideContextBridge />
        {routeContent}
        <GlobalXiaolingAssistant />
      </XiaolingRuntimeProvider>
    </RouteErrorBoundary>
  )
}

export default App
