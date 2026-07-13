# B-End Visual Shell Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current B-end visual shell with the supplied ink-green and warm-paper design while preserving every real admin route, API call, action, and safety boundary.

**Architecture:** Introduce one nested `AdminOpsShell` for all `/admin/*` routes, then adapt the existing Dashboard, NBA, and Emergency pages to the new light operational theme through scoped classes and targeted markup changes. Keep the existing data/API layers untouched, reuse Ant Design Charts and icons, and apply all new CSS under `.admin-ops-shell` so the visitor app is unaffected.

**Tech Stack:** React 18, TypeScript, React Router 7, Ant Design 5, Ant Design Charts, Node test runner, Vite.

---

## File map

**Create**

- `demo/src/components/admin-ops/AdminOpsShell.tsx`: nested route outlet, navigation state, service-health state, and page-action context.
- `demo/src/components/admin-ops/AdminOpsSidebar.tsx`: real admin navigation only.
- `demo/src/components/admin-ops/AdminOpsTopbar.tsx`: route title, live service state, timestamp, refresh/export actions, and mobile menu.
- `demo/src/components/admin-ops/AdminOpsPageActions.tsx`: typed context used by pages to register optional refresh/export actions.
- `demo/src/styles/admin-ops.css`: scoped shell, tokens, responsive rules, and Ant Design overrides.
- `demo/src/pages/adminOpsShell.test.ts`: route, scope, data-source, and regression contracts.

**Modify**

- `demo/src/App.tsx`: replace flat admin routes with one nested `AdminOpsShell` route.
- `demo/src/main.tsx`: load `admin-ops.css` after existing global styles.
- `demo/src/pages/AdminDashboard.tsx`: register real page actions and adopt warm-light operational classes.
- `demo/src/pages/AdminMarketingDecisionPage.tsx`: keep real NBA calls/actions and adopt ZIP information hierarchy.
- `demo/src/pages/AdminEmergencyPage.tsx`: keep real event calls/form and adopt ZIP information hierarchy.
- `demo/src/pages/AdminMarketingDecisionPage.test.ts`: accept the nested decision route.
- `demo/src/pages/AdminEmergencyPage.test.ts`: verify the nested emergency route and real controls.

---

### Task 1: Record the dirty-worktree baseline and add failing migration contracts

**Files:**
- Create: `demo/src/pages/adminOpsShell.test.ts`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.test.ts`
- Modify: `demo/src/pages/AdminEmergencyPage.test.ts`

- [ ] **Step 1: Record the current workspace without modifying it**

Run:

```bash
git status --short > /tmp/lingshan-b-end-before-status.txt
git diff -- demo/src/App.tsx demo/src/pages/AdminDashboard.tsx demo/src/pages/AdminMarketingDecisionPage.tsx demo/src/pages/AdminEmergencyPage.tsx demo/src/styles/global.css > /tmp/lingshan-b-end-before.patch
```

Expected: both baseline files exist; no working-tree files change.

- [ ] **Step 2: Add the failing shell contract**

Create `demo/src/pages/adminOpsShell.test.ts`:

```ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../components/admin-ops/AdminOpsShell.tsx', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../components/admin-ops/AdminOpsSidebar.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../styles/admin-ops.css', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('./AdminDashboard.tsx', import.meta.url), 'utf8')
const decision = readFileSync(new URL('./AdminMarketingDecisionPage.tsx', import.meta.url), 'utf8')
const emergency = readFileSync(new URL('./AdminEmergencyPage.tsx', import.meta.url), 'utf8')

test('all real admin routes share the new operations shell', () => {
  assert.match(app, /path="\/admin"\s+element=\{<AdminOpsShell\s*\/>\}/)
  for (const child of ['', 'decision', 'emergency', 'heatmap', 'kb', 'avatar', 'config']) {
    const route = child ? `path="${child}"` : 'index'
    assert.ok(app.includes(route), `missing admin child route: ${child || 'index'}`)
  }
})

test('sidebar exposes only implemented admin destinations', () => {
  for (const route of ['/admin', '/admin/decision', '/admin/emergency', '/admin/heatmap', '/admin/kb', '/admin/avatar', '/admin/config']) {
    assert.ok(sidebar.includes(route), `missing sidebar destination ${route}`)
  }
  assert.doesNotMatch(sidebar, /\/insight|PlaceholderPage/)
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
```

- [ ] **Step 3: Run the contract and verify RED**

Run:

```bash
cd demo
node --test src/pages/adminOpsShell.test.ts
```

Expected: FAIL because the `admin-ops` components and stylesheet do not exist.

- [ ] **Step 4: Preserve the existing NBA and emergency tests while preparing nested-route assertions**

Change the route assertions to accept child routes:

```ts
assert.match(app, /path="decision"\s+element=\{<AdminMarketingDecisionPage\s*\/>\}/)
assert.match(appSource, /path="emergency"\s+element=\{<AdminEmergencyPage\s*\/>\}/)
```

Do not remove assertions for real API paths, source labels, refresh behavior, emergency creation, publishing, resolving, or knowledge synchronization.

---

### Task 2: Build the shared admin operations shell

**Files:**
- Create: `demo/src/components/admin-ops/AdminOpsPageActions.tsx`
- Create: `demo/src/components/admin-ops/AdminOpsSidebar.tsx`
- Create: `demo/src/components/admin-ops/AdminOpsTopbar.tsx`
- Create: `demo/src/components/admin-ops/AdminOpsShell.tsx`
- Create: `demo/src/styles/admin-ops.css`
- Modify: `demo/src/main.tsx`

- [ ] **Step 1: Create a typed page-action context**

Use this public contract in `AdminOpsPageActions.tsx`:

```tsx
export type AdminOpsActions = {
  refreshedAt?: string
  refreshing?: boolean
  onRefresh?: () => void | Promise<void>
  onExport?: () => void | Promise<void>
}

export const AdminOpsPageActionsContext = createContext<
  Dispatch<SetStateAction<AdminOpsActions>> | null
>(null)

export function useAdminOpsPageActions(actions: AdminOpsActions) {
  const setActions = useContext(AdminOpsPageActionsContext)
  useEffect(() => {
    if (!setActions) return
    setActions(actions)
    return () => setActions({})
  }, [setActions, actions.onExport, actions.onRefresh, actions.refreshedAt, actions.refreshing])
}
```

The provider stays in `AdminOpsShell`; pages without actions leave the topbar buttons hidden.

- [ ] **Step 2: Create the real-route sidebar**

Use `NavLink` and existing Ant icons. The navigation array must be exactly:

```tsx
const ADMIN_NAV = [
  { to: '/admin', end: true, label: '总览', icon: <DashboardOutlined /> },
  { to: '/admin/decision', label: '智能决策', icon: <BulbOutlined /> },
  { to: '/admin/emergency', label: '应急协同', icon: <AlertOutlined /> },
  { to: '/admin/heatmap', label: '客流热力', icon: <FireOutlined /> },
  { to: '/admin/kb', label: '知识库', icon: <DatabaseOutlined /> },
  { to: '/admin/avatar', label: '数字人', icon: <SkinOutlined /> },
  { to: '/admin/config', label: '服务配置', icon: <SettingOutlined /> },
]
```

The collapse button updates shell state; it must not be a dead visual control.

- [ ] **Step 3: Create the route-aware topbar**

Map current paths to parent/title values and render only registered actions:

```tsx
const TITLES: Record<string, { parent: string; title: string }> = {
  '/admin': { parent: '总览', title: '运营驾驶舱' },
  '/admin/decision': { parent: '智能决策', title: 'Next Best Action' },
  '/admin/emergency': { parent: '应急协同', title: '事件处置' },
  '/admin/heatmap': { parent: '运营分析', title: '客流热力' },
  '/admin/kb': { parent: '内容资产', title: '知识库管理' },
  '/admin/avatar': { parent: '内容资产', title: '数字人形象管理' },
  '/admin/config': { parent: '系统管理', title: 'AI 服务配置' },
}
```

Use `actions.refreshedAt` for the timestamp. Display `服务运行正常` only when the shell health request succeeds; otherwise display `服务连接异常` with a warning tone.

- [ ] **Step 4: Create `AdminOpsShell`**

The shell must:

```tsx
<AdminOpsPageActionsContext.Provider value={setActions}>
  <div className={`admin-ops-shell${collapsed ? ' is-collapsed' : ''}`}>
    <AdminOpsSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
    <div className="admin-ops-workspace">
      <AdminOpsTopbar actions={actions} serviceHealthy={serviceHealthy} onOpenMenu={() => setMobileOpen(true)} />
      <main className="admin-ops-main"><Outlet /></main>
    </div>
  </div>
</AdminOpsPageActionsContext.Provider>
```

Fetch `${getAnalyticsApiBase()}/summary` with an abort controller. `getAnalyticsApiBase()` already includes `/api`. Health failure changes only the status badge and must not block page rendering.

- [ ] **Step 5: Port only scoped ZIP styles**

Create `admin-ops.css` with local variables on `.admin-ops-shell`:

```css
.admin-ops-shell {
  --ops-ink-900: #123a37;
  --ops-ink-700: #275d56;
  --ops-paper-50: #fbfaf6;
  --ops-paper-100: #f7f4ec;
  --ops-gold-500: #c8ad70;
  --ops-line: #e6e0d5;
  --ops-text: #253230;
  --ops-muted: #72807d;
  min-height: 100vh;
  color: var(--ops-text);
  background: var(--ops-paper-100);
  font-family: 'Lingshan Sans SC', 'Noto Sans SC', 'PingFang SC', sans-serif;
}
```

Add desktop sidebar/topbar/workspace rules, collapsed state, mobile drawer, focus-visible state, and scoped Ant card/table/form overrides. Do not copy ZIP rules for `html`, `body`, `:root`, or global `button`.

- [ ] **Step 6: Import the stylesheet last**

In `main.tsx`, add:

```ts
import './styles/admin-ops.css'
```

after the existing global and C-app typography imports.

- [ ] **Step 7: Run the contract**

Expected: the file-existence and style-scope assertions now pass; the route assertion still fails until Task 3.

---

### Task 3: Nest every real admin route under the shell

**Files:**
- Modify: `demo/src/App.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.test.ts`
- Modify: `demo/src/pages/AdminEmergencyPage.test.ts`

- [ ] **Step 1: Lazy-load the shell**

Add:

```ts
const AdminOpsShell = lazy(() => import('./components/admin-ops/AdminOpsShell'))
```

- [ ] **Step 2: Replace only the flat admin route block**

Use nested child paths without changing the auth or mobile guards:

```tsx
<Route path="/admin" element={<AdminOpsShell />}>
  <Route index element={<AdminDashboard />} />
  <Route path="decision" element={<AdminMarketingDecisionPage />} />
  <Route path="emergency" element={<AdminEmergencyPage />} />
  <Route path="heatmap" element={<ScenicMapPage />} />
  <Route path="kb" element={<AdminKnowledgePage />} />
  <Route path="avatar" element={<AdminAvatarPage />} />
  <Route path="config" element={<AdminServiceConfigPage />} />
</Route>
```

Leave all C-end and map routes untouched.

- [ ] **Step 3: Run route tests**

Run:

```bash
node --test src/pages/adminOpsShell.test.ts src/pages/AdminMarketingDecisionPage.test.ts src/pages/AdminEmergencyPage.test.ts
```

Expected: all nested route assertions pass; any remaining failures identify page styling work.

---

### Task 4: Adapt the real Dashboard to the supplied operational hierarchy

**Files:**
- Modify: `demo/src/pages/AdminDashboard.tsx`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: Preserve the full data layer**

Do not change `DashboardData`, `fetchJson`, endpoint paths, visitor mode, active-window persistence, demo fallback labeling, report exports, opportunity rules, or chart data derivations.

- [ ] **Step 2: Register page actions**

Extract the existing load body into a stable `loadDashboard` callback and register:

```tsx
const handleExportExcel = useCallback(
  () => exportDashboardExcel(data, buildReportMeta()),
  [data, visitorMode],
)

useAdminOpsPageActions({
  refreshedAt: lastUpdatedAt,
  onRefresh: loadDashboard,
  onExport: handleExportExcel,
})
```

Add `lastUpdatedAt` state and update it only after a completed dashboard load. Keep the in-page PDF and Excel buttons if both formats must remain directly selectable; the topbar export uses the existing Excel default.

- [ ] **Step 3: Switch from dark full-page ownership to shell ownership**

Replace the outer dark wrapper with:

```tsx
<ConfigProvider theme={{ token: { colorPrimary: '#275d56', colorText: '#253230', colorBgContainer: '#fffef9', borderRadius: 10 } }}>
  <section className="admin-ops-page admin-ops-dashboard">
    {/* existing real dashboard sections */}
  </section>
</ConfigProvider>
```

Add semantic classes to the existing header, KPI row, decision links, alert list, analytics grids, conversion grids, portrait grids, panels, and metric cards. Remove only inline background/text colors that prevent the warm-light theme.

- [ ] **Step 4: Apply the supplied hierarchy through scoped CSS**

Use a 12-column desktop grid, warm cards, ink headings, restrained gold accents, red only for high-risk alerts, and single-column rules below 960px. Existing charts remain Ant Design Charts and retain their real datasets.

- [ ] **Step 5: Verify no static ZIP metrics entered the file**

Run the `core pages retain real APIs` contract. Expected: PASS.

---

### Task 5: Restyle the real NBA workspace without changing behavior

**Files:**
- Modify: `demo/src/pages/AdminMarketingDecisionPage.tsx`
- Modify: `demo/src/styles/admin-ops.css`
- Test: `demo/src/pages/AdminMarketingDecisionPage.test.ts`

- [ ] **Step 1: Keep the real data and interaction functions unchanged**

Preserve `readDecision`, `fetchDecision`, `sourceMeta`, `load`, 60-second refresh, `DecisionActionPanel`, `DecisionEvidenceDrawer`, and `DecisionHistoryDrawer`.

- [ ] **Step 2: Replace the dark page wrapper with the light NBA structure**

Use these stable sections:

```tsx
<section className="admin-ops-page admin-ops-nba">
  <div className="ops-page-intro">...</div>
  <section className="ops-ai-summary">...</section>
  <div className="ops-nba-layout">
    <section className="ops-recommendation-column">...</section>
    <aside className="ops-execution-column">...</aside>
  </div>
</section>
```

Map `decision.cards` to recommendation cards, `decision.actionTodos` to the execution list, and `decision.dataSources` to evidence-source chips. Keep source labels exactly `大模型生成`, `规则兜底`, and `演示样例`.

- [ ] **Step 3: Keep every action wired**

The following must remain clickable and use current handlers: `重新生成`, `历史版本`, `查看证据`, `历史对比`, `转为待办`, and `查看客流热力图`.

- [ ] **Step 4: Register topbar refresh**

```tsx
useAdminOpsPageActions({
  refreshedAt: generatedTime,
  refreshing: loading,
  onRefresh: () => load(true),
})
```

- [ ] **Step 5: Run the NBA tests**

Expected: source labels, fallback paths, loading cleanup, history/evidence/actions, and nested route tests all pass.

---

### Task 6: Restyle the real emergency workspace without weakening safety

**Files:**
- Modify: `demo/src/pages/AdminEmergencyPage.tsx`
- Modify: `demo/src/styles/admin-ops.css`
- Test: `demo/src/pages/AdminEmergencyPage.test.ts`

- [ ] **Step 1: Preserve the API and safety layer**

Keep `createEmergency`, `updateEmergency`, `publishEmergency`, `resolveEmergency`, `retryEmergencyKnowledgeSync`, event-type options, route policies, confirmed-knowledge requirement, and Popconfirm gates unchanged.

- [ ] **Step 2: Replace the dark wrapper with the supplied operational structure**

Use:

```tsx
<section className="admin-ops-page admin-ops-emergency">
  <div className="ops-page-intro">...</div>
  {activeEvent ? <section className="ops-active-incident">...</section> : null}
  <section className="ops-emergency-summary">...</section>
  <section className="ops-event-table">...</section>
  {/* existing real Drawer form */}
</section>
```

Derive `activeEvent` from `events.find(event => effectiveStatus(event) === 'ACTIVE')`; never create the ZIP medical example.

- [ ] **Step 3: Register topbar refresh**

```tsx
useAdminOpsPageActions({ refreshing: loading, onRefresh: load })
```

- [ ] **Step 4: Theme the existing Ant table and drawer**

Use scoped light tokens for table headers, tags, form controls, drawer spacing, and focus states. Do not alter validation rules or the medical/missing-person warning copy.

- [ ] **Step 5: Run emergency tests**

Expected: real route registration, create/edit/publish/resolve/retry controls, and knowledge safety assertions pass.

---

### Task 7: Integrate heatmap, knowledge, avatar, and service configuration

**Files:**
- Modify: `demo/src/pages/AdminKnowledgePage.tsx`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: Remove only Knowledge Page full-viewport ownership**

Replace the dark `main` wrapper in `AdminKnowledgePage.tsx` with:

```tsx
<main className="admin-page admin-ops-content-page admin-ops-knowledge">
  {/* existing upload, quality, search, edit and delete UI */}
</main>
```

Remove its page-level dark `ConfigProvider` algorithm only; preserve every knowledge API call and quality helper.

- [ ] **Step 2: Style the existing page roots without editing their logic**

Target the existing `.heatmap-page`, `.admin-page`, `.admin-avatar-row`, and service-config form classes from `admin-ops.css`. Do not modify `ScenicMapPage.tsx`, `AdminAvatarPage.tsx`, or `AdminServiceConfigPage.tsx`; their current root classes are sufficient. Do not change key masking, password re-verification, knowledge upload, Live2D preview, or map behavior.

- [ ] **Step 3: Add responsive form/table rules**

Below 900px, stack form columns, allow tables to scroll inside their own region, and use the shell mobile menu. Keep the existing wide-screen notice for `/admin` and `/admin/heatmap`.

---

### Task 8: Full verification and browser acceptance

**Files:**
- No production changes unless verification exposes a scoped defect.

- [ ] **Step 1: Run scoped diff checks**

```bash
git diff --check -- demo/src/App.tsx demo/src/main.tsx demo/src/components/admin-ops demo/src/styles/admin-ops.css demo/src/pages/AdminDashboard.tsx demo/src/pages/AdminMarketingDecisionPage.tsx demo/src/pages/AdminEmergencyPage.tsx demo/src/pages/adminOpsShell.test.ts
```

Expected: exit 0.

- [ ] **Step 2: Run the complete frontend test suite**

```bash
cd demo
node --test src/**/*.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run the production build**

```bash
npm run build
```

Expected: TypeScript and Vite build succeed; existing chunk-size warnings are non-blocking.

- [ ] **Step 4: Verify desktop B-end routes in the browser**

At a desktop viewport, inspect:

- `/admin`
- `/admin/decision`
- `/admin/emergency`
- `/admin/heatmap`
- `/admin/kb`
- `/admin/avatar`
- `/admin/config`

Verify active navigation, topbar title/status, real data/fallback labels, actions, no clipped content, and no placeholder pages.

- [ ] **Step 5: Verify narrow-width behavior**

Confirm `/admin/kb`, `/admin/avatar`, and `/admin/config` use the shell mobile navigation and remain usable. Confirm `/admin` and `/admin/heatmap` still show the existing wide-screen notice until the user chooses to continue.

- [ ] **Step 6: Confirm C-end isolation**

Inspect `/`, `/guide`, and `/map-3d-guide-c`. Verify visitor typography, floating Xiaoling, mobile tab bar, and map layout are unchanged.

- [ ] **Step 7: Audit task scope against the baseline**

Compare the final changed-file list with `/tmp/lingshan-b-end-before-status.txt`. Do not stage or commit unrelated Fay, RAG, analytics, Live2D memory, icon, or existing user changes.
