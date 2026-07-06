import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useIsMobileViewport } from './hooks/useIsMobileViewport'

const AppProviders = lazy(() => import('./components/AppProviders'))
const ChatConnectionManager = lazy(() => import('./components/ChatConnectionManager'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminAvatarPage = lazy(() => import('./pages/AdminAvatarPage'))
const GuideMapPage = lazy(() => import('./pages/GuideMapPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const Scenic3DPreviewPage = lazy(() => import('./pages/Scenic3DPreviewPage'))
const Scenic3DMapPage = lazy(() => import('./pages/Scenic3DMapPage'))
const Map3DGuidePage = lazy(() => import('./pages/Map3DGuidePage'))
const Map3DGuidePrototypeAPage = lazy(() => import('./pages/Map3DGuidePrototypeAPage'))
const Map3DGuidePrototypeBPage = lazy(() => import('./pages/Map3DGuidePrototypeBPage'))
const Map3DGuidePrototypeCPage = lazy(() => import('./pages/Map3DGuidePrototypeCPage'))
const Map3DPoiDetailPage = lazy(() => import('./pages/Map3DPoiDetailPage'))
const MobileShell = lazy(() => import('./mobile/MobileShell'))
const SpotGuidePage = lazy(() => import('./pages/SpotGuidePage'))

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
        <ChatConnectionManager />
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

function HomeRoute() {
  return (
    <AppLazyRoute label="正在加载智慧导览...">
      <HomePage />
    </AppLazyRoute>
  )
}

function GuideMapRoute() {
  return (
    <AppLazyRoute label="正在加载地图导览...">
      <GuideMapPage />
    </AppLazyRoute>
  )
}

function SpotGuideRoute() {
  return (
    <AppLazyRoute label="正在加载景点讲解...">
      <SpotGuidePage />
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

function App() {
  const location = useLocation()
  const isMobile = useIsMobileViewport()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isMobile && !isAdminRoute) {
    return (
      <Routes>
        <Route path="/three-preview" element={<ThreePreviewRoute />} />
        <Route path="/scenic-3d-map" element={<Scenic3DMapRoute />} />
        <Route path="/scenic-3d-map-prototype" element={<Scenic3DMapPrototypeRoute />} />
        <Route path="/map-3d-guide" element={<Map3DGuideRoute />} />
        <Route path="/map-3d-guide-a" element={<Map3DGuidePrototypeARoute />} />
        <Route path="/map-3d-guide-b" element={<Map3DGuidePrototypeBRoute />} />
        <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailRoute />} />
        <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCRoute />} />
        <Route path="*" element={<MobileShellRoute />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/map" element={<GuideMapRoute />} />
      <Route path="/spot/:spotId" element={<SpotGuideRoute />} />
      <Route path="/three-preview" element={<ThreePreviewRoute />} />
      <Route path="/scenic-3d-map" element={<Scenic3DMapRoute />} />
      <Route path="/scenic-3d-map-prototype" element={<Scenic3DMapPrototypeRoute />} />
      <Route path="/map-3d-guide" element={<Map3DGuideRoute />} />
      <Route path="/map-3d-guide-a" element={<Map3DGuidePrototypeARoute />} />
      <Route path="/map-3d-guide-b" element={<Map3DGuidePrototypeBRoute />} />
      <Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailRoute />} />
      <Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCRoute />} />
      <Route path="/guide" element={<HomeRoute />} />
      <Route path="/me" element={<HomeRoute />} />
      <Route path="/admin" element={<AdminDashboardRoute />} />
      <Route path="/admin/avatar" element={<AdminAvatarRoute />} />
    </Routes>
  )
}

export default App
