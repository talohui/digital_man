# B 端新版视觉外壳迁移设计

## 背景

设计源为 `/Users/MR/Downloads/lingshan-ai-ops-react(1).zip`。该项目提供了完整的墨青侧栏、暖白工作区、顶部状态栏和卡片体系，并为运营驾驶舱、Next Best Action、应急协同制作了高保真页面。它没有真实 API 调用，驾驶舱、NBA 和应急数据均为静态常量，其余页面为占位页。

当前真实项目位于 `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo`，已经具备 Analytics、Fay、RAG、NBA、应急事件、知识库、数字人和服务配置闭环。本次采用“方案 B”：迁移视觉外壳与信息层级，保留现有路由、数据和行为。

## 目标

1. 将 ZIP 的侧栏、顶栏、色彩、排版与组件视觉迁入当前 `/admin/*`。
2. 让运营驾驶舱、NBA 和应急协同达到 ZIP 设计稿的布局质量。
3. 所有指标、建议、事件和操作继续来自当前真实接口。
4. 热力图、知识库、数字人、服务配置继续使用现有实现，并纳入统一后台外壳。
5. 保持管理员登录、移动端宽屏提示和现有游客端路由不变。

## 非目标

- 不复制 ZIP 中的模拟 KPI、推荐建议、事件列表或固定时间。
- 不迁入 `/insight` 等没有真实实现的占位页。
- 不更换 Analytics、Fay 或 RAG 后端。
- 不重写 C 端、地图、Live2D 或游客隐私功能。
- 不引入 Recharts 或 Lucide React；继续复用项目已有 Ant Design Charts 和 Ant Design Icons。

## 信息架构

统一侧栏按真实路由排列：

1. 总览：`/admin`
2. 智能决策：`/admin/decision`
3. 应急协同：`/admin/emergency`
4. 客流热力：`/admin/heatmap`
5. 知识库：`/admin/kb`
6. 数字人：`/admin/avatar`
7. 服务配置：`/admin/config`

不增加指向占位页的导航项。当前激活路由使用香槟金弱高亮和左侧状态标记。

## 页面外壳

新增 `AdminOpsShell` 作为 `/admin/*` 的嵌套路由布局：

- 左侧固定墨青导航，包含品牌、运营工作台导航和折叠入口。
- 顶部暖白状态栏显示面包屑、页面标题、数据更新时间、服务状态和管理员身份。
- 主内容区域使用暖白底色和局部黛青、香槟金强调。
- 桌面端固定侧栏；窄屏表单页使用可收起的导航抽屉。
- `/admin` 和 `/admin/heatmap` 继续沿用现有手机宽屏提示，不改变访问策略。

样式全部作用于 `.admin-ops-shell` 命名空间。ZIP 中的 `html`、`body`、`:root` 和全局 `button` 规则不会直接复制，以免影响 C 端。

## 运营驾驶舱

保留 `AdminDashboard` 的所有请求、时间范围、实时/历史游客切换、导出与数据状态；将可视层重新编排为：

- 今日运营状态和核心 KPI。
- 最重要运营事项，数据来自当前 NBA 摘要或现有分析结果。
- 实时告警与服务健康。
- 游客趋势、热门问题、情绪、意图和景点关注度。
- 热力入口、推荐转化、门票与消费。
- 游客画像、满意度和风险人群。

接口失败时保留现有错误提示和演示回退标识，不把静态设计稿数据伪装为真实数据。

## Next Best Action

保留 `AdminMarketingDecisionPage` 当前能力：

- 大模型生成和规则兜底。
- 强制重新生成与缓存来源标识。
- 建议采纳、忽略、转待办和已执行状态。
- 负责人、截止时间、执行备注和效果评估。
- 证据下钻、历史版本和本次/上次对比。

视觉采用 ZIP 的 AI 摘要、建议列表和右侧执行栏布局，但字段必须来自现有 `decisionOps` 和 Analytics API。没有值时显示空状态，不填充 ZIP 示例。

## 应急协同

保留 `AdminEmergencyPage` 的真实创建、解除和联动逻辑。新版页面使用：

- 当前生效事件焦点区。
- 事件列表与影响范围。
- 游客提醒、数字人播报、知识库同步和路线影响状态。
- 真实事件创建表单。

医疗和走失事件继续使用现有安全边界，不让前端设计稿引入自由生成的救援建议。

## 其余管理页

`AdminKnowledgePage`、`AdminAvatarPage`、`AdminServiceConfigPage` 和 `ScenicMapPage` 只接入统一侧栏、顶栏、页面背景和基础表单视觉。它们的 API、验证、密钥脱敏、上传质量检查、Live2D 预览和地图逻辑不重写。

## 数据与操作

- 顶栏服务状态根据真实 Analytics 健康请求决定，不使用固定“正常”。
- 顶栏刷新由当前页面注册的刷新动作驱动；无刷新能力时隐藏。
- 导出能力仅在已有导出实现的页面出现。
- 数据更新时间来自最近一次成功请求。
- 现有错误、加载、空状态和来源标识必须保留。

## 响应式与可访问性

- 1440px 以上展示完整侧栏和多列数据布局。
- 960px 至 1439px 缩窄侧栏和卡片间距。
- 窄屏表单页使用抽屉导航，主内容单列排列。
- 保持按钮键盘访问、可见焦点、语义标题和图表文字说明。
- 不使用远程 Google Fonts；复用当前项目已落地的本地 Noto 字体。

## 文件边界

预计新增：

- `demo/src/components/admin-ops/AdminOpsShell.tsx`
- `demo/src/components/admin-ops/AdminOpsSidebar.tsx`
- `demo/src/components/admin-ops/AdminOpsTopbar.tsx`
- `demo/src/components/admin-ops/AdminOpsPageActions.tsx`
- `demo/src/styles/admin-ops.css`

预计修改：

- `demo/src/App.tsx`
- `demo/src/pages/AdminDashboard.tsx`
- `demo/src/pages/AdminMarketingDecisionPage.tsx`
- `demo/src/pages/AdminEmergencyPage.tsx`
- 必要时为其余管理页补充少量页面级 className。

不整体替换 `demo/src`、`package.json` 或 `global.css`。

## 测试与验收

1. 先添加路由外壳契约测试，确认所有真实 `/admin/*` 路由仍存在。
2. 添加静态扫描测试，拒绝 ZIP 的固定 KPI、固定事件和占位文案进入生产页面。
3. 验证 Dashboard、NBA、Emergency 的真实请求和操作测试继续通过。
4. 运行全部前端 Node 测试与生产构建。
5. 在桌面宽屏检查侧栏、顶栏、三大核心页面和其余管理页。
6. 在窄屏检查表单页抽屉、横向溢出和现有宽屏提示。
7. 验证游客端首页、导览和 3D 地图视觉未受影响。

## 回退

迁移采用新增外壳和定点页面改造，不删除当前 API 层。若视觉验收不通过，可恢复 `App.tsx` 的平铺管理路由并移除 `AdminOpsShell`，业务数据与后端无需回滚。
