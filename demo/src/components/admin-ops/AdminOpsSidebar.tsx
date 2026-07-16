import {
  AlertOutlined,
  BulbOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FireOutlined,
  LeftOutlined,
  MailOutlined,
  RightOutlined,
  SettingOutlined,
  SkinOutlined
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ADMIN_NAV_GROUPS, type AdminNavIconKey } from './adminOpsNavigation'

const ADMIN_NAV_ICONS: Record<AdminNavIconKey, ReactNode> = {
  dashboard: <DashboardOutlined />,
  heatmap: <FireOutlined />,
  decision: <BulbOutlined />,
  emergency: <AlertOutlined />,
  knowledge: <DatabaseOutlined />,
  reports: <MailOutlined />,
  avatar: <SkinOutlined />,
  config: <SettingOutlined />,
}

type Props = {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onNavigate: () => void
}

export default function AdminOpsSidebar({ collapsed, mobileOpen, onToggle, onNavigate }: Props) {
  return (
    <aside className={`admin-ops-sidebar${mobileOpen ? ' is-mobile-open' : ''}`} aria-label="B 端主导航">
      <div className="admin-ops-brand">
        <span className="admin-ops-brand__mark" aria-hidden="true">灵</span>
        {!collapsed && (
          <span className="admin-ops-brand__copy">
            <strong>灵山胜境</strong>
            <small>AI 智慧运营中心</small>
          </span>
        )}
      </div>

      <nav className="admin-ops-nav">
        {ADMIN_NAV_GROUPS.map((group) => (
          <section key={group.key} className="admin-ops-nav__group" aria-label={group.label}>
            <p className="admin-ops-nav__group-label" aria-hidden="true">{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => `admin-ops-nav__item${isActive ? ' is-active' : ''}`}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
              >
                <span className="admin-ops-nav__icon">{ADMIN_NAV_ICONS[item.icon]}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </section>
        ))}
      </nav>

      <div className="admin-ops-sidebar__footer">
        <button type="button" className="admin-ops-sidebar__collapse" onClick={onToggle} aria-label={collapsed ? '展开侧栏' : '收起侧栏'}>
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </div>
    </aside>
  )
}
