import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { getServiceHealth, type ServiceHealthResponse } from '../../api/serviceHealth'
import OperationsCopilotFloat from '../admin/OperationsCopilotFloat'
import AdminOpsSidebar from './AdminOpsSidebar'
import AdminOpsTopbar from './AdminOpsTopbar'
import { AdminOpsPageActionsContext, type AdminOpsActions } from './AdminOpsPageActions'

export default function AdminOpsShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [serviceHealth, setServiceHealth] = useState<ServiceHealthResponse | null>(null)
  const [serviceHealthError, setServiceHealthError] = useState('')
  const [actions, setActions] = useState<AdminOpsActions>({})
  const healthControllerRef = useRef<AbortController | null>(null)

  const checkHealth = useCallback(async () => {
    healthControllerRef.current?.abort()
    const controller = new AbortController()
    healthControllerRef.current = controller
    try {
      const response = await getServiceHealth(controller.signal)
      setServiceHealth(response)
      setServiceHealthError('')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setServiceHealthError('服务状态不可用')
      }
    }
  }, [])

  useEffect(() => {
    void checkHealth()
    const timer = window.setInterval(() => void checkHealth(), 30_000)
    return () => {
      healthControllerRef.current?.abort()
      window.clearInterval(timer)
    }
  }, [checkHealth])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <AdminOpsPageActionsContext.Provider value={setActions}>
      <div className={`admin-ops-shell${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' has-mobile-nav' : ''}`}>
        <button type="button" className="admin-ops-nav-backdrop" onClick={() => setMobileOpen(false)} aria-label="关闭导航" />
        <AdminOpsSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setCollapsed((value) => !value)}
          onNavigate={() => setMobileOpen(false)}
        />
        <div className="admin-ops-workspace">
          <AdminOpsTopbar
            actions={actions}
            serviceHealth={serviceHealth}
            serviceHealthError={serviceHealthError}
            onOpenMenu={() => setMobileOpen(true)}
          />
          <main className="admin-ops-main"><Outlet /></main>
        </div>
        <OperationsCopilotFloat />
      </div>
    </AdminOpsPageActionsContext.Provider>
  )
}
