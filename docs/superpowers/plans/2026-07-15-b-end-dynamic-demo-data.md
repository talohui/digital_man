# B 端动态演示数据实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 B 端实时运营首页和客流热力图基于同一秒级时间轴稳定变化，同时保持历史样本、决策生成和真实后端数据链路不变。

**Architecture:** 新增无副作用的 `adminDemoTimeline` 纯函数模块，以共享会话起点和整数秒 tick 生成业务一致的增量、波动和事件；新增 `useDemoTicker` 负责页面可见时每秒刷新并在卸载时清理。首页把时间轴快照合入现有演示数据构造函数，热力图复用同一 tick 驱动已有热力层更新，不重新初始化腾讯地图。

**Tech Stack:** React 18、TypeScript、Node.js test runner、Vite、腾讯地图热力图层

---

## 文件结构

- 新建 `demo/src/lib/adminDemoTimeline.ts`：纯函数时间轴、稳定随机数、业务约束和共享演示会话起点。
- 新建 `demo/src/lib/adminDemoTimeline.test.ts`：覆盖确定性、单调累计、比例/金额/延迟约束、历史模式静止。
- 新建 `demo/src/hooks/useDemoTicker.ts`：一秒 tick、页面隐藏暂停、重新可见立即同步、卸载清理。
- 新建 `demo/src/hooks/useDemoTicker.test.ts`：以源码契约验证 interval、visibilitychange 和清理逻辑。
- 修改 `demo/src/pages/AdminDashboard.tsx`：把 tick 快照合入现有演示数据，更新动态状态标识。
- 修改 `demo/src/pages/ScenicMapPage.tsx`：改用共享 tick 和稳定随机源更新热力层与排行。
- 修改 `demo/src/pages/AdminDashboard.operations.test.ts`：约束首页标识和决策页不参与秒级生成。

### Task 1：建立可测试的共享演示时间轴

**Files:**
- Create: `demo/src/lib/adminDemoTimeline.test.ts`
- Create: `demo/src/lib/adminDemoTimeline.ts`

- [ ] **Step 1: 写纯函数失败测试**

测试固定 `sessionStartedAtMs` 与相邻 tick，断言：相同输入深度相等；相邻秒至少一个实时值变化；累计值不倒退；点击不超过曝光；P90 不低于平均值、最大值不低于 P90；消费分类金额之和等于消费增量；历史模式的两个 tick 输出相同。

```ts
const options = { activeWindowMinutes: 5, sessionStartedAtMs: 1_000_000 }
const first = buildAdminDemoFrame(1_010, options)
const next = buildAdminDemoFrame(1_011, options)
assert.deepEqual(first, buildAdminDemoFrame(1_010, options))
assert.ok(next.cumulative.totalMessages >= first.cumulative.totalMessages)
assert.ok(next.recommendation.clickCount <= next.recommendation.exposureCount)
assert.equal(next.commerce.costMix.reduce((sum, item) => sum + item.amount, 0), next.commerce.totalAmount)
assert.deepEqual(
  buildAdminDemoFrame(1_010, { ...options, mode: 'history' }),
  buildAdminDemoFrame(1_011, { ...options, mode: 'history' }),
)
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `cd demo && node --test --experimental-strip-types src/lib/adminDemoTimeline.test.ts`

Expected: FAIL，错误指向 `adminDemoTimeline.ts` 尚不存在。

- [ ] **Step 3: 实现最小纯函数生成器**

实现并导出：

```ts
export type AdminDemoMode = 'realtime' | 'history'
export function toDemoTick(nowMs = Date.now()): number
export function createSeededRandom(seed: number): () => number
export function getAdminDemoSessionStartedAtMs(nowMs = Date.now()): number
export function buildAdminDemoFrame(tick: number, options: AdminDemoOptions): AdminDemoFrame
```

规则固定为：累计量由 `elapsedSeconds` 的不同整除脉冲产生；活跃会话、情绪、延迟和热区使用不同相位的正弦波；金额先生成前四类，最后一类用总额减去前四类保证精确相等；最近事件按 `Math.floor(elapsedSeconds / 3)` 轮换且固定六条。

- [ ] **Step 4: 运行纯函数测试并确认通过**

Run: `cd demo && node --test --experimental-strip-types src/lib/adminDemoTimeline.test.ts`

Expected: PASS。

### Task 2：实现可清理的一秒 Hook

**Files:**
- Create: `demo/src/hooks/useDemoTicker.test.ts`
- Create: `demo/src/hooks/useDemoTicker.ts`

- [ ] **Step 1: 写 Hook 源码契约失败测试**

断言 Hook 仅在 `enabled` 时创建 `window.setInterval(..., 1000)`，监听 `visibilitychange`，页面隐藏时不更新，清理阶段同时调用 `window.clearInterval` 和 `removeEventListener`。

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd demo && node --test --experimental-strip-types src/hooks/useDemoTicker.test.ts`

Expected: FAIL，错误指向 Hook 文件不存在。

- [ ] **Step 3: 实现最小 Hook**

```ts
export function useDemoTicker(enabled: boolean) {
  const [tick, setTick] = useState(() => toDemoTick())
  useEffect(() => {
    if (!enabled) return
    const sync = () => {
      if (document.visibilityState !== 'hidden') setTick(toDemoTick())
    }
    const timer = window.setInterval(sync, 1000)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [enabled])
  return tick
}
```

- [ ] **Step 4: 运行 Hook 测试并确认通过**

Run: `cd demo && node --test --experimental-strip-types src/hooks/useDemoTicker.test.ts`

Expected: PASS。

### Task 3：接入运营首页

**Files:**
- Modify: `demo/src/pages/AdminDashboard.tsx`
- Modify: `demo/src/pages/AdminDashboard.operations.test.ts`

- [ ] **Step 1: 扩展首页失败测试**

断言首页导入并调用 `useDemoTicker`、`buildAdminDemoFrame`，显示“演示动态数据”和“每 1 秒更新”，且现有 15 秒后端刷新仍存在，避免把天气与真实接口轮询改成一秒。

- [ ] **Step 2: 运行首页测试并确认失败**

Run: `cd demo && node --test --experimental-strip-types src/pages/AdminDashboard.operations.test.ts`

Expected: FAIL，缺少动态时间轴接入标识。

- [ ] **Step 3: 将时间轴快照合入演示数据**

让 `buildDemoDashboardData` 接收 `tick` 和 `sessionStartedAtMs`。历史模式继续返回固定值；实时模式将 frame 应用于问答累计量、活跃会话、情绪、延迟、推荐曝光/点击/CTR、票务、消费、景点访问和最近事件。`useMemo` 基于 `tick` 生成演示数据，15 秒加载函数只负责真实接口、天气和刷新状态。

- [ ] **Step 4: 更新状态文案但不增加视觉噪声**

沿用现有玉色运营大屏风格，把金色“演示数据”改为绿色脉冲点配“演示动态数据”，旁边显示“每 1 秒更新 · 数据截至 HH:mm:ss”；历史模式显示“官方历史样本”，不播放动态状态。

- [ ] **Step 5: 运行首页测试和 TypeScript 构建**

Run: `cd demo && node --test --experimental-strip-types src/pages/AdminDashboard.operations.test.ts src/lib/adminDemoTimeline.test.ts src/hooks/useDemoTicker.test.ts && npm run build`

Expected: 全部 PASS，Vite 构建成功。

### Task 4：接入热力图并完成回归验证

**Files:**
- Modify: `demo/src/pages/ScenicMapPage.tsx`
- Modify: `demo/src/lib/adminDemoTimeline.test.ts`

- [ ] **Step 1: 增加热区同步失败测试**

对固定 tick 断言 `spotLoads` 顺序、score 和 level 稳定；相邻 tick 的至少一个景点热度变化，所有 level 均在 0 到 100。

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd demo && node --test --experimental-strip-types src/lib/adminDemoTimeline.test.ts`

Expected: FAIL，当前 frame 尚未满足热区断言。

- [ ] **Step 3: 用共享 tick 更新现有热力层**

在 `ScenicMapPage` 调用 `useDemoTicker(true)`；地图初始化仍只执行一次。每个新 tick 使用 `createSeededRandom(tick)` 推进已有 crowd agents，并把 frame 的 `spotLoads` 用于热点排行、在线数和更新时间；继续合并 BroadcastChannel 的真实在线点。移除独立 1200ms interval，避免两套时钟并行。

- [ ] **Step 4: 完成局部与全量验证**

Run: `cd demo && node --test --experimental-strip-types src/lib/adminDemoTimeline.test.ts src/hooks/useDemoTicker.test.ts src/pages/AdminDashboard.operations.test.ts && npm run build && git diff --check`

Expected: 全部测试通过、构建成功、无空白错误。

- [ ] **Step 5: 浏览器验收**

打开 `/admin` 与 `/admin/heatmap`，观察至少 10 秒：关键指标自然变化、累计量不下降、热力层不闪烁、热点排行同步更新。切到 `/admin/decision`，确认网络面板没有每秒发起营销决策或 Copilot 请求；控制台无卸载后更新或重复地图初始化警告。

