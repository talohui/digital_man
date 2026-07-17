import { DownloadOutlined, MenuOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import type { ServiceHealthResponse } from '../../api/serviceHealth'
import type { AdminOpsActions } from './AdminOpsPageActions'
import AdminOpsHealthPopover from './AdminOpsHealthPopover'
import { getAdminPageHeading } from './adminOpsNavigation'

type Props = {
  actions: AdminOpsActions
  serviceHealth: ServiceHealthResponse | null
  serviceHealthError?: string
  onOpenMenu: () => void
}

export default function AdminOpsTopbar({ actions, serviceHealth, serviceHealthError, onOpenMenu }: Props) {
  const location = useLocation()
  const heading = getAdminPageHeading(location.pathname)

  return (
    <header className="admin-ops-topbar">
      <div className="admin-ops-topbar__identity">
        <button type="button" className="admin-ops-topbar__menu" onClick={onOpenMenu} aria-label="打开导航">
          <MenuOutlined />
        </button>
        <div>
          <p className="admin-ops-topbar__breadcrumb">灵山胜境 · {heading.parent}</p>
          <h1>{heading.title}</h1>
        </div>
      </div>

      <div className="admin-ops-topbar__actions">
        <AdminOpsHealthPopover health={serviceHealth} error={serviceHealthError} />
        {actions.refreshedAt && <span className="admin-ops-topbar__time">更新于 {actions.refreshedAt}</span>}
        {actions.onRefresh && (
          <button type="button" className="admin-ops-action-button" onClick={() => void actions.onRefresh?.()} disabled={actions.refreshing}>
            <ReloadOutlined spin={actions.refreshing} />
            <span>{actions.refreshing ? '更新中' : '刷新'}</span>
          </button>
        )}
        {actions.onExport && (
          <button type="button" className="admin-ops-action-button is-primary" onClick={() => void actions.onExport?.()}>
            <DownloadOutlined />
            <span>导出</span>
          </button>
        )}
        <div className="admin-ops-user" aria-label="当前管理员">
          <span className="admin-ops-user__avatar">管</span>
          <span className="admin-ops-user__copy"><strong>运营管理员</strong><small>灵山胜境</small></span>
        </div>
      </div>
    </header>
  )
}
