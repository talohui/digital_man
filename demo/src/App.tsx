import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
// 路由级懒加载:首屏不再为 admin/spot-guide/guide-map 付出包体积代价
// GuideMapPage 仍带 antd(Modal/Rate),延后到桌面用户进 /map 时再下
const GuideMapPage = lazy(() => import('./pages/GuideMapPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminAvatarPage = lazy(() => import('./pages/AdminAvatarPage'))
const SpotGuidePage = lazy(() => import('./pages/SpotGuidePage'))
import RouteErrorBoundary from './components/RouteErrorBoundary'
import RouteSkeleton from './components/RouteSkeleton'
import { useIsMobileViewport } from './hooks/useIsMobileViewport'
import MobileShell from './mobile/MobileShell'
import { useChatStore } from './store/useChatStore'

function App() {
  const location = useLocation()
  const isMobile = useIsMobileViewport()
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    initializeConnection()

    return () => {
      disconnectConnection()
    }
  }, [disconnectConnection, initializeConnection])

  if (isMobile && !isAdminRoute) {
    return (
      <RouteErrorBoundary>
        <Routes>
          <Route path="*" element={<MobileShell />} />
        </Routes>
      </RouteErrorBoundary>
    )
  }

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<GuideMapPage />} />
          <Route path="/spot/:spotId" element={<SpotGuidePage />} />
          <Route path="/guide" element={<HomePage />} />
          <Route path="/me" element={<HomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/avatar" element={<AdminAvatarPage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}

export default App
