import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminLogin from './pages/AdminLogin'
import AdminMobileNotice from './pages/AdminMobileNotice'
import { isAdminAuthed } from './lib/adminAuth'
import SplashAdPage from './pages/SplashAdPage'
import { markLingshanSplashSeen, shouldShowLingshanSplash } from './lib/introStorage'
// 路由级懒加载:首屏不再为 admin/spot-guide/guide-map 付出包体积代价
// GuideMapPage 仍带 antd(Modal/Rate),延后到桌面用户进 /map 时再下
const GuideMapPage = lazy(() => import('./pages/GuideMapPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminAvatarPage = lazy(() => import('./pages/AdminAvatarPage'))
const AdminKnowledgePage = lazy(() => import('./pages/AdminKnowledgePage'))
const ScenicMapPage = lazy(() => import('./pages/ScenicMapPage'))
const SpotGuidePage = lazy(() => import('./pages/SpotGuidePage'))
const Map3DGuidePage = lazy(() => import('./pages/Map3DGuidePage'))
import RouteErrorBoundary from './components/RouteErrorBoundary'
import RouteSkeleton from './components/RouteSkeleton'
import { useIsMobileViewport } from './hooks/useIsMobileViewport'
import MobileShell from './mobile/MobileShell'
import FloatingGuide from './components/FloatingGuide'
import { useChatStore } from './store/useChatStore'
import { unlockAudio } from './lib/audioLipsync'

function App() {
  const location = useLocation()
  const isMobile = useIsMobileViewport()
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)
  const isHomeRoute = location.pathname === '/'
  const isAdminRoute = location.pathname.startsWith('/admin')
  // 仅多列实时数据大屏(运营驾驶舱 / 热力图)真正需要宽屏;
  // KB 管理、数字人形象配置是表单/表格页,手机窄屏可直接使用,不做拦截。
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
    initializeConnection()

    return () => {
      disconnectConnection()
    }
  }, [disconnectConnection, initializeConnection])

  // 移动端音频自动播放需用户手势解锁:首次 pointerdown/touchend 时 resume
  // AudioContext,否则第一句 TTS 静音、数字人嘴卡张开。解锁一次后即移除监听。
  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchend', unlock)
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

  // 手机强制进入 B 端大屏的选择持久化到本次会话,避免刷新/重进地址后反复弹提示页
  const continueAdminMobile = useCallback(() => {
    try {
      sessionStorage.setItem('lingshan_admin_force_mobile', '1')
    } catch {
      /* 隐私模式等场景下忽略 */
    }
    setForceAdminMobile(true)
  }, [])

  if (isHomeRoute && showSplash) {
    return <SplashAdPage onFinish={finishSplash} />
  }

  if (isMobile && !isAdminRoute) {
    return (
      <RouteErrorBoundary>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/map" element={<Map3DGuidePage />} />
            <Route path="/map-3d-guide" element={<Map3DGuidePage />} />
            <Route path="*" element={<MobileShell />} />
          </Routes>
        </Suspense>
        {/* 全局悬浮小灵:在所有 C 端移动页面(含全屏 3D 地图)右下角常驻,随时呼出对话 */}
        <FloatingGuide />
      </RouteErrorBoundary>
    )
  }

  // 手机访问 B 端宽屏大屏(驾驶舱/热力图):默认提示"建议电脑/横屏查看"(可强制继续,
  // 选择持久化)。KB 管理、形象配置等表单页不在此列,手机直接放行。
  if (isMobile && isWideAdminScreen && !forceAdminMobile) {
    return (
      <RouteErrorBoundary>
        <AdminMobileNotice onContinue={continueAdminMobile} />
      </RouteErrorBoundary>
    )
  }

  // B 端(运营驾驶舱)需登录;C 端游客导览不受影响
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
          <Route path="/map" element={<GuideMapPage />} />
          <Route path="/map-3d-guide" element={<Map3DGuidePage />} />
          <Route path="/spot/:spotId" element={<SpotGuidePage />} />
          <Route path="/guide" element={<HomePage />} />
          <Route path="/me" element={<HomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/heatmap" element={<ScenicMapPage />} />
          <Route path="/admin/avatar" element={<AdminAvatarPage />} />
          <Route path="/admin/kb" element={<AdminKnowledgePage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}

export default App
