import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import { ADMIN_NAV_GROUPS, getAdminPageHeading } from '../components/admin-ops/adminOpsNavigation.ts'

function read(relativeUrl: string) {
  const url = new URL(relativeUrl, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

const app = read('../App.tsx')
const shell = read('../components/admin-ops/AdminOpsShell.tsx')
const sidebar = read('../components/admin-ops/AdminOpsSidebar.tsx')
const styles = read('../styles/admin-ops.css')
const dashboard = read('./AdminDashboard.tsx')
const decision = read('./AdminMarketingDecisionPage.tsx')
const emergency = read('./AdminEmergencyPage.tsx')

test('all real admin routes share the new operations shell', () => {
  assert.match(app, /path="\/admin"\s+element=\{<AdminOpsShell\s*\/>\}/)
  for (const child of ['', 'decision', 'emergency', 'reports', 'heatmap', 'kb', 'avatar', 'config']) {
    const route = child ? `path="${child}"` : 'index'
    assert.ok(app.includes(route), `missing admin child route: ${child || 'index'}`)
  }
})

test('sidebar exposes only implemented admin destinations', () => {
  for (const route of ['/admin', '/admin/decision', '/admin/emergency', '/admin/reports', '/admin/heatmap', '/admin/kb', '/admin/avatar', '/admin/config']) {
    assert.ok(ADMIN_NAV_GROUPS.flatMap((group) => group.items).some((item) => item.to === route), `missing sidebar destination ${route}`)
  }
  assert.match(sidebar, /ADMIN_NAV_GROUPS/)
  assert.doesNotMatch(sidebar, /\/insight|PlaceholderPage/)
})

test('groups admin navigation by monitoring action and system work', () => {
  assert.deepEqual(ADMIN_NAV_GROUPS.map((group) => group.label), ['运营监测', '分析与处置', '系统管理'])
  assert.deepEqual(
    ADMIN_NAV_GROUPS.map((group) => group.items.map((item) => item.to)),
    [
      ['/admin', '/admin/heatmap'],
      ['/admin/decision', '/admin/emergency', '/admin/kb', '/admin/reports'],
      ['/admin/avatar', '/admin/config'],
    ],
  )
})

test('uses Chinese workflow headings for every admin destination', () => {
  assert.deepEqual(getAdminPageHeading('/admin/decision'), { parent: '分析与处置', title: 'AI 决策分析' })
  assert.deepEqual(getAdminPageHeading('/admin/reports'), { parent: '分析与处置', title: 'AI 运营报告' })
  assert.deepEqual(getAdminPageHeading('/admin/config'), { parent: '系统管理', title: 'AI 服务配置' })
})

test('new admin styling is scoped away from the visitor app', () => {
  assert.match(shell, /admin-ops-shell/)
  assert.match(styles, /\.admin-ops-shell/)
  assert.doesNotMatch(styles, /(^|\n)\s*(html|body|:root)\s*\{/)
})

test('core pages retain real APIs and reject supplied static demo records', () => {
  assert.match(dashboard, /getAnalyticsApiBase/)
  assert.match(decision, /dashboard\/marketing-decision/)
  assert.match(emergency, /fetchAdminEmergencies/)
  for (const source of [dashboard, decision, emergency]) {
    assert.doesNotMatch(source, /NBA-240713-01|EM-20260713-004|58,742/)
  }
})

test('admin workspace uses the project-owned Lingshan scenic background only', () => {
  const asset = new URL('../../public/images/admin/lingshan-ops-landscape.png', import.meta.url)
  assert.equal(existsSync(asset), true, 'missing project-owned scenic background')
  assert.match(styles, /\.admin-ops-workspace\s*\{[^}]*lingshan-ops-landscape\.png/s)
  assert.match(styles, /linear-gradient\([^}]*lingshan-ops-landscape\.png/s)
  assert.doesNotMatch(styles, /(^|\n)\s*(html|body|:root)[^{]*\{[^}]*lingshan-ops-landscape/s)
})

test('admin data surfaces use the approved translucent jade treatment', () => {
  assert.match(styles, /--ops-jade-surface:\s*rgba\(232,\s*240,\s*226,\s*0\.82\)/)
  assert.match(styles, /\.admin-ops-shell \.ant-card\s*\{[^}]*background-color:\s*var\(--ops-jade-surface\)/s)
  assert.match(styles, /\.admin-ops-page-intro\s*\{[^}]*var\(--ops-jade-surface/s)
  assert.match(styles, /\.admin-ops-topbar\s*\{[^}]*var\(--ops-jade-surface-strong\)/s)
  assert.match(styles, /\.admin-ops-(emergency|knowledge) \.ant-table-tbody[^}]*var\(--ops-jade-surface-strong\)/s)
  for (const source of [dashboard, decision, emergency]) {
    assert.match(source, /panel:\s*'rgba\(232,\s*240,\s*226,\s*0\.82\)'/)
  }
})
