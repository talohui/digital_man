# Admin Health and Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 B 端提供真实依赖健康状态、分组导航和能在十秒内识别重点的运营总览。

**Architecture:** analytics-server 聚合短超时、带缓存的服务探针并始终返回组件状态；前端 Shell 只维护这一份健康数据。总览把演示模式改成显式环境开关，用独立资源状态保留上次成功数据，并将首页重排为态势、优先事项、趋势三层。

**Tech Stack:** Spring Boot、RestClient、React、TypeScript、Ant Design、node:test、JUnit 5。

---

### Task 1: 后端聚合健康接口

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/ServiceHealthStatus.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/ServiceHealthComponent.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/ServiceHealthResponse.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/ServiceHealthService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/controller/DashboardController.java`
- Create: `analytics-server/src/test/java/com/lingshan/analytics/service/ServiceHealthServiceTest.java`

- [ ] **Step 1: 写全正常、未配置、超时和无秘密泄漏测试**

```java
@Test
void returns_component_statuses_without_leaking_urls_or_keys() {
    ServiceHealthResponse response = service.check();
    assertThat(response.components()).extracting(ServiceHealthComponent::key)
            .containsExactly("analytics", "fay", "rag", "weather", "model");
    assertThat(response.toString()).doesNotContain("api_key", "Bearer ", "http://");
}
```

- [ ] **Step 2: 运行测试并确认失败**

```bash
cd analytics-server
mvn -Dtest=ServiceHealthServiceTest test
```

- [ ] **Step 3: 实现 30 秒缓存和 500–1000ms 探针**

状态枚举固定为 `NORMAL/DEGRADED/UNCONFIGURED/OFFLINE/STALE`。接口 `GET /api/dashboard/service-health` 即使依赖失败也返回 HTTP 200；每个组件包含 key、label、status、message、checkedAt、lastSuccessAt、latencyMs、recoveryPath。恢复路径只允许 B 端内部路由。

- [ ] **Step 4: 运行测试并提交**

```bash
mvn -Dtest=ServiceHealthServiceTest test
git add analytics-server/src/main/java/com/lingshan/analytics/dto/ServiceHealthStatus.java analytics-server/src/main/java/com/lingshan/analytics/dto/ServiceHealthComponent.java analytics-server/src/main/java/com/lingshan/analytics/dto/ServiceHealthResponse.java analytics-server/src/main/java/com/lingshan/analytics/service/ServiceHealthService.java analytics-server/src/main/java/com/lingshan/analytics/controller/DashboardController.java analytics-server/src/test/java/com/lingshan/analytics/service/ServiceHealthServiceTest.java
git commit -m "feat: expose admin service health summary"
```

### Task 2: 前端健康 Popover 与真实状态

**Files:**
- Create: `demo/src/api/serviceHealth.ts`
- Create: `demo/src/api/serviceHealth.test.ts`
- Create: `demo/src/components/admin-ops/AdminOpsHealthPopover.tsx`
- Modify: `demo/src/components/admin-ops/AdminOpsShell.tsx`
- Modify: `demo/src/components/admin-ops/AdminOpsTopbar.tsx`
- Modify: `demo/src/components/admin-ops/AdminOpsSidebar.tsx`
- Modify: `demo/src/pages/adminOpsShell.test.ts`

- [ ] **Step 1: 写状态映射和不再硬编码“持续同步”的失败测试**

```ts
test('maps degraded components to an actionable summary', () => {
  assert.equal(summarizeServiceHealth({ overall: 'DEGRADED', components: [], checkedAt: '' }), '服务部分降级')
})
```

- [ ] **Step 2: 运行测试并确认失败**

```bash
cd demo
node --test --experimental-strip-types src/api/serviceHealth.test.ts src/pages/adminOpsShell.test.ts
```

- [ ] **Step 3: Shell 每 30 秒获取聚合状态并传给顶栏和 Copilot**

Popover 展示五项服务、最后检查时间、原因和恢复入口；侧栏删除固定“数据服务持续同步”。初始、取消请求和组件卸载使用 AbortController，不维护第二套健康判断。

- [ ] **Step 4: 运行测试、构建并提交**

```bash
node --test --experimental-strip-types src/api/serviceHealth.test.ts src/pages/adminOpsShell.test.ts
npm run build
git add demo/src/api/serviceHealth.ts demo/src/api/serviceHealth.test.ts demo/src/components/admin-ops/AdminOpsHealthPopover.tsx demo/src/components/admin-ops/AdminOpsShell.tsx demo/src/components/admin-ops/AdminOpsTopbar.tsx demo/src/components/admin-ops/AdminOpsSidebar.tsx demo/src/pages/adminOpsShell.test.ts
git commit -m "feat: show truthful admin service health"
```

### Task 3: 分组导航与中文页面层级

**Files:**
- Create: `demo/src/components/admin-ops/adminOpsNavigation.tsx`
- Modify: `demo/src/components/admin-ops/AdminOpsSidebar.tsx`
- Modify: `demo/src/components/admin-ops/AdminOpsTopbar.tsx`
- Modify: `demo/src/pages/adminOpsShell.test.ts`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: 写三组顺序、reports 路由和中文标题测试**

```ts
test('groups admin navigation by monitoring action and system work', () => {
  assert.deepEqual(ADMIN_NAV_GROUPS.map((group) => group.label), ['运营监测', '分析与处置', '系统管理'])
  assert.ok(ADMIN_NAV_GROUPS.flatMap((group) => group.items).some((item) => item.to === '/admin/reports'))
})
```

- [ ] **Step 2: 运行失败测试，实现分组并再次运行**

Run:

```bash
node --test --experimental-strip-types src/pages/adminOpsShell.test.ts
```

折叠态隐藏可见组名但保留 `aria-label`；决策页顶栏显示“智能决策”，不只显示英文 Next Best Action。

- [ ] **Step 3: 构建并提交**

```bash
npm run build
git add demo/src/components/admin-ops/adminOpsNavigation.tsx demo/src/components/admin-ops/AdminOpsSidebar.tsx demo/src/components/admin-ops/AdminOpsTopbar.tsx demo/src/pages/adminOpsShell.test.ts demo/src/styles/admin-ops.css
git commit -m "refactor: group admin navigation by workflow"
```

### Task 4: 总览资源状态和显式演示开关

**Files:**
- Create: `demo/src/lib/adminDashboardResources.ts`
- Create: `demo/src/lib/adminDashboardResources.test.ts`
- Modify: `demo/src/pages/AdminDashboard.tsx`
- Modify: `demo/src/vite-env.d.ts`
- Modify: `demo/src/pages/AdminDashboard.operations.test.ts`

- [ ] **Step 1: 写默认关闭演示模式和部分失败保留旧数据测试**

```ts
test('demo mode is opt-in only', () => {
  assert.equal(isAdminDemoEnabled({}), false)
  assert.equal(isAdminDemoEnabled({ VITE_ADMIN_DEMO_DATA: 'true' }), true)
})

test('keeps the last successful payload as stale after a refresh error', () => {
  const state = failResource(readyResource({ total: 12 }, '2026-07-16T13:00:00'), '连接失败')
  assert.equal(state.status, 'stale')
  assert.equal(state.data.total, 12)
})
```

- [ ] **Step 2: 运行测试并确认失败**

```bash
node --test --experimental-strip-types src/lib/adminDashboardResources.test.ts src/pages/AdminDashboard.operations.test.ts
```

- [ ] **Step 3: 实现 ResourceState 与 allSettled 加载**

`ResourceState<T>` 使用 `loading/ready/stale/error`；请求新增 ticketing、consumption 和 active emergencies。仅当至少一项真实请求成功时更新 refreshedAt。演示模式持续显示“演示数据”，不得和真实健康状态混用。

- [ ] **Step 4: 运行测试、构建并提交**

```bash
node --test --experimental-strip-types src/lib/adminDashboardResources.test.ts src/pages/AdminDashboard.operations.test.ts
npm run build
git add demo/src/lib/adminDashboardResources.ts demo/src/lib/adminDashboardResources.test.ts demo/src/pages/AdminDashboard.tsx demo/src/vite-env.d.ts demo/src/pages/AdminDashboard.operations.test.ts
git commit -m "fix: separate demo and live dashboard resources"
```

### Task 5: 总览三层布局与优先事项分流

**Files:**
- Create: `demo/src/lib/adminOperationPriorities.ts`
- Create: `demo/src/lib/adminOperationPriorities.test.ts`
- Create: `demo/src/components/admin-ops/AdminSituationStrip.tsx`
- Create: `demo/src/components/admin-ops/AdminPriorityList.tsx`
- Modify: `demo/src/pages/AdminDashboard.tsx`
- Modify: `demo/src/pages/AdminDashboard.operations.test.ts`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: 写优先级、最多五项和路由分流测试**

```ts
test('prioritizes critical emergencies and routes each signal to its workspace', () => {
  const items = buildAdminPriorities(input)
  assert.ok(items.length <= 5)
  assert.equal(items[0].kind, 'emergency')
  assert.equal(items[0].to, '/admin/emergency')
  assert.equal(items.find((item) => item.kind === 'service')?.to, '/admin/config')
})
```

- [ ] **Step 2: 运行失败测试，实现纯函数排序和组件**

```bash
node --test --experimental-strip-types src/lib/adminOperationPriorities.test.ts src/pages/AdminDashboard.operations.test.ts
```

态势带展示活跃应急、客流/会话、购票与预计入园、消费、负面风险、响应延迟和天气影响；优先事项每条只有一个主操作。下方保留趋势与观察模块，删除重复完整决策内容和无必要英文眉题。

- [ ] **Step 3: 运行构建和提交**

```bash
npm run build
git add demo/src/lib/adminOperationPriorities.ts demo/src/lib/adminOperationPriorities.test.ts demo/src/components/admin-ops/AdminSituationStrip.tsx demo/src/components/admin-ops/AdminPriorityList.tsx demo/src/pages/AdminDashboard.tsx demo/src/pages/AdminDashboard.operations.test.ts demo/src/styles/admin-ops.css
git commit -m "feat: focus admin dashboard on operational priorities"
```

### Task 6: 健康与总览验收

**Files:**
- Verify only unless a failing test identifies a scoped defect.

- [ ] **Step 1: 运行定向和全量检查**

```bash
cd analytics-server
mvn -Dtest=ServiceHealthServiceTest test
mvn test
```

```bash
cd ../demo
node --test --experimental-strip-types src/api/serviceHealth.test.ts src/lib/adminDashboardResources.test.ts src/lib/adminOperationPriorities.test.ts src/pages/AdminDashboard.operations.test.ts src/pages/adminOpsShell.test.ts
npm run build
```

- [ ] **Step 2: 浏览器验收**

检查 1440px、1024px 和窄屏；分别停止 Fay、RAG 或天气依赖，确认顶栏状态准确、总览保留旧数据并标记过期、恢复入口可用。确认演示模式默认关闭，开启时持续显示“演示数据”。

- [ ] **Step 3: 检查工作树**

```bash
git diff --check
git status --short
```
