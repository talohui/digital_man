import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import AdminAvatarPage from './pages/AdminAvatarPage'
import GuideMapPage from './pages/GuideMapPage'
import HomePage from './pages/HomePage'
import SpotGuidePage from './pages/SpotGuidePage'
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
      <Routes>
        <Route path="*" element={<MobileShell />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<GuideMapPage />} />
      <Route path="/spot/:spotId" element={<SpotGuidePage />} />
      <Route path="/guide" element={<HomePage />} />
      <Route path="/me" element={<HomePage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/avatar" element={<AdminAvatarPage />} />
    </Routes>
  )
}

export default App
