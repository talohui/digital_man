import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import GuideMapPage from './pages/GuideMapPage'
import HomePage from './pages/HomePage'
import SpotGuidePage from './pages/SpotGuidePage'
import { useChatStore } from './store/useChatStore'

function App() {
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)

  useEffect(() => {
    initializeConnection()

    return () => {
      disconnectConnection()
    }
  }, [disconnectConnection, initializeConnection])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<GuideMapPage />} />
      <Route path="/spot/:spotId" element={<SpotGuidePage />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
