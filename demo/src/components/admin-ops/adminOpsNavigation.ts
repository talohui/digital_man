export type AdminNavIconKey =
  | 'dashboard'
  | 'heatmap'
  | 'decision'
  | 'emergency'
  | 'knowledge'
  | 'reports'
  | 'avatar'
  | 'config'

export type AdminNavItem = {
  to: string
  label: string
  icon: AdminNavIconKey
  end?: boolean
}

export type AdminNavGroup = {
  key: 'monitor' | 'action' | 'system'
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: 'monitor',
    label: '运营监测',
    items: [
      { to: '/admin', end: true, label: '总览', icon: 'dashboard' },
      { to: '/admin/heatmap', label: '客流热力', icon: 'heatmap' },
    ],
  },
  {
    key: 'action',
    label: '分析与处置',
    items: [
      { to: '/admin/decision', label: '智能决策', icon: 'decision' },
      { to: '/admin/emergency', label: '应急协同', icon: 'emergency' },
      { to: '/admin/kb', label: '知识库', icon: 'knowledge' },
      { to: '/admin/reports', label: '运营报告', icon: 'reports' },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    items: [
      { to: '/admin/avatar', label: '数字人', icon: 'avatar' },
      { to: '/admin/config', label: '服务配置', icon: 'config' },
    ],
  },
]

export type AdminPageHeading = { parent: string; title: string }

const ADMIN_PAGE_HEADINGS: Record<string, AdminPageHeading> = {
  '/admin': { parent: '运营监测', title: '智慧运营中心' },
  '/admin/heatmap': { parent: '运营监测', title: '客流热力' },
  '/admin/decision': { parent: '分析与处置', title: 'AI 决策分析' },
  '/admin/emergency': { parent: '分析与处置', title: '应急事件处置' },
  '/admin/kb': { parent: '分析与处置', title: '知识库管理' },
  '/admin/reports': { parent: '分析与处置', title: 'AI 运营报告' },
  '/admin/avatar': { parent: '系统管理', title: '数字人形象管理' },
  '/admin/config': { parent: '系统管理', title: 'AI 服务配置' },
}

export function getAdminPageHeading(pathname: string): AdminPageHeading {
  return ADMIN_PAGE_HEADINGS[pathname] ?? { parent: '运营中心', title: '管理工作台' }
}
