# Next Best Action 智能营销决策迁移计划

**目标：** 将旧 B 端的 AI 营销决策分析迁入新版 B 端，提供独立页面、NBA 待办与真实 analytics 事件驱动的决策卡。

**迁移边界：** 前端目标为 `demo`，后端目标为同一 worktree 的 `analytics-server`。不修改 Fay、RAG、知识库、数字人资源或既有 analytics 改动。当前 5002 尚未重启时，前端兼容旧接口 `/api/decision/cards`；新版部署后优先使用 `/api/dashboard/marketing-decision`。

### 任务 1：后端决策规则与新版 API

- [ ] 先新增 `MarketingDecisionEngineTest`，覆盖空事件时的演示回退，以及高频营销主题产生营销机会卡。
- [ ] 将旧版 `DecisionCard`、`DecisionResponse`、`DecisionInput`、`TopicMetric`、`MarketingDecisionEngine` 和 `MarketingDecisionService` 迁入新版 analytics-server。
- [ ] 在新版 `DashboardController` 增加 `GET /api/dashboard/marketing-decision`，不改变已有接口。
- [ ] 运行营销决策单测及 DashboardService 回归测试。

### 任务 2：新版 B 端独立决策页

- [ ] 先新增页面静态测试，要求页面包含 NBA 待办、证据来源与热力图链接，并优先请求新版接口。
- [ ] 新增 `AdminMarketingDecisionPage.tsx`，复用截图中的摘要、决策卡、建议动作、标签、NBA 队列和热力图联动。
- [ ] 页面请求优先 `/dashboard/marketing-decision`；仅在 404 时回退 `/decision/cards`，以兼容当前运行中的旧 analytics-server。
- [ ] 运行页面测试和 TypeScript 检查。

### 任务 3：新 B 端入口

- [ ] 先扩展路由测试，要求 `/admin/decision` 指向新决策页。
- [ ] 在 `App.tsx` 注册懒加载路由，在新版运营驾驶舱头部增加“AI 营销决策”入口。
- [ ] 运行相关前端测试并在已有 5176 页面核查入口和数据加载；不启动第二个前端或重启 5002。
