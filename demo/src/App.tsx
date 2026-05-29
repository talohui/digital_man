import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import AdminAvatarPage from './pages/AdminAvatarPage'
import GuideMapPage from './pages/GuideMapPage'
import HomePage from './pages/HomePage'
import SpotGuidePage from './pages/SpotGuidePage'
import { useIsMobileViewport } from './hooks/useIsMobileViewport'
import MobileShell from './mobile/MobileShell'
import { useChatStore } from './store/useChatStore'

const Scenic3DPreviewPage = lazy(() => import('./pages/Scenic3DPreviewPage'))
const Scenic3DMapPage = lazy(() => import('./pages/Scenic3DMapPage'))

function ThreePreviewRoute() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>正在加载 3D 预览...</div>}>
      <Scenic3DPreviewPage />
    </Suspense>
  )
}

function Scenic3DMapRoute() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>正在加载 3D 景区地图...</div>}>
      <Scenic3DMapPage />
    </Suspense>
  )
}

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
      <Routes>
        <Route path="/three-preview" element={<ThreePreviewRoute />} />
        <Route path="/scenic-3d-map" element={<Scenic3DMapRoute />} />
        <Route path="*" element={<MobileShell />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<GuideMapPage />} />
      <Route path="/spot/:spotId" element={<SpotGuidePage />} />
      <Route path="/three-preview" element={<ThreePreviewRoute />} />
      <Route path="/scenic-3d-map" element={<Scenic3DMapRoute />} />
      <Route path="/guide" element={<HomePage />} />
      <Route path="/me" element={<HomePage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/avatar" element={<AdminAvatarPage />} />
    </Routes>
  )
}

export default App
