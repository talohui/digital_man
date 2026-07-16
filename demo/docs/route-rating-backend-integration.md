# 路线完成评价后端对接说明

## 1. 范围与现状

目标组件是 C 端路线完成态 `RouteCompletedCard`，入口位于：

- `src/pages/Map3DRouteGuidePage.tsx`
- 正式路由：`/map-3d-guide-c/route/:routeId?stage=completed`

当前五星选择、提交和“已提交”反馈只保存在组件本地状态，用于确认交互与视觉；不会写入服务端、管理端满意度指标或游客历史。接入后端时，必须用本接口返回状态替换本地 `rating` / `submittedRating` 状态，不得把演示结果与真实统计混用。

本接口只处理“完成一次路线后的路线体验评价”，不替代景点评价。景点评价接口与数据约束见 `docs/poi-review-backend-integration.md`。

## 2. 业务约束

- 评价对象是 `route_id`，不是当前景点 `poi_id`。
- 仅已完成路线的游客可以提交；服务端依据路线完成记录判断，不信任前端 `stage=completed` 参数。
- 每个 `visit_id + route_id + completion_id` 最多保留一条有效评价。重复提交同一完成记录应返回已存在的评价，不应重复累计统计。
- 评分为必填整数，范围 `1`–`5`。
- 评价可选择附加文本与标签；当前 UI 尚未展示，接口应预留。
- 提交成功后前端锁定五星控件并显示服务端确认的评分；失败时允许用户重新提交。
- 未登录或身份过期时，前端应引导登录；不能用匿名本地评分伪装为已提交。
- 如引入内容审核，只有 `published` 的评价可进入管理端公开满意度统计；用户本人提交后的状态可为 `pending`。

## 3. 资源模型

### 3.1 RouteRating

```ts
type RouteRatingStatus = 'published' | 'pending' | 'rejected'

type RouteRating = {
  id: string
  visitId: string
  routeId: string
  completionId: string
  userId: string
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  tags?: string[]
  status: RouteRatingStatus
  createdAt: string
  updatedAt: string
}
```

### 3.2 RouteRatingSummary

```ts
type RouteRatingSummary = {
  routeId: string
  averageRating: number
  ratingCount: number
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>
  updatedAt: string
}
```

### 3.3 前端完成上下文

路线页在完成时需要提供下列可信上下文：

```ts
type RouteCompletionContext = {
  routeId: string
  completionId: string
  visitId: string
}
```

`completionId` 应由服务端在路线完成或到达确认完成时生成，并与游客、路线、完成时间绑定。若当前路线完成流程尚未服务端化，应先完成该完成记录能力；不能仅以 URL query 或浏览器 localStorage 充当提交凭据。

## 4. API 契约

建议统一前缀：`/api/v1/route-ratings`。

| 方法 | 路径 | 鉴权 | 作用 |
| --- | --- | --- | --- |
| `GET` | `/eligibility?route_id={routeId}&completion_id={completionId}` | 是 | 查询当前游客能否评价，以及是否已评价 |
| `POST` | `/` | 是 | 创建或幂等返回一条路线评价 |
| `GET` | `/summary?route_id={routeId}` | 否 | 获取已发布的路线评分汇总，供管理端或公开展示 |

### 4.1 查询资格

```http
GET /api/v1/route-ratings/eligibility?route_id=historical_culture&completion_id=cmp_20260716_001
Authorization: Bearer <token>
```

```json
{
  "eligible": true,
  "completion_id": "cmp_20260716_001",
  "existing_rating": null
}
```

若已评价：

```json
{
  "eligible": false,
  "completion_id": "cmp_20260716_001",
  "existing_rating": {
    "id": "rr_01",
    "rating": 5,
    "status": "published",
    "created_at": "2026-07-16T08:30:00Z"
  }
}
```

### 4.2 提交评价

```http
POST /api/v1/route-ratings
Authorization: Bearer <token>
Idempotency-Key: <uuid>
Content-Type: application/json
```

```json
{
  "route_id": "historical_culture",
  "completion_id": "cmp_20260716_001",
  "rating": 5,
  "comment": "路线节奏舒适，讲解清楚。",
  "tags": ["讲解清晰", "路线顺畅"]
}
```

成功使用 `201 Created`；相同 `Idempotency-Key` 重试可返回 `200 OK`，但必须返回同一条评价。

```json
{
  "id": "rr_01",
  "route_id": "historical_culture",
  "completion_id": "cmp_20260716_001",
  "rating": 5,
  "status": "published",
  "created_at": "2026-07-16T08:30:00Z"
}
```

### 4.3 错误语义

| 状态 | code | 前端处理 |
| --- | --- | --- |
| `400` | `INVALID_RATING` | 保持可编辑，提示评分范围错误 |
| `401` | `UNAUTHENTICATED` | 保留已选星级，提示登录后提交 |
| `403` | `ROUTE_NOT_COMPLETED` | 隐藏或禁用评分区，提示需完成路线 |
| `404` | `COMPLETION_NOT_FOUND` | 不显示“已提交”，记录诊断日志 |
| `409` | `RATING_ALREADY_EXISTS` | 使用响应中的已有评价锁定 UI |
| `429` | `RATE_LIMITED` | 提示稍后重试，不清空已选星级 |
| `5xx` | `SERVER_ERROR` | 显示提交失败，允许重试 |

## 5. 前端接入

建议新增独立 API 模块，例如 `src/api/routeRatings.ts`：

```ts
export type RouteRatingEligibility = {
  eligible: boolean
  completionId: string
  existingRating: { id: string; rating: 1 | 2 | 3 | 4 | 5; status: RouteRatingStatus } | null
}

export async function getRouteRatingEligibility(
  context: RouteCompletionContext
): Promise<RouteRatingEligibility>

export async function submitRouteRating(input: {
  routeId: string
  completionId: string
  rating: 1 | 2 | 3 | 4 | 5
  idempotencyKey: string
}): Promise<RouteRating>
```

`RouteCompletedCard` 需要改为接收服务端完成上下文与提交回调，避免组件直接拼接 URL：

```ts
type RouteCompletedCardProps = {
  route: ScenicRouteConfig
  completionContext?: RouteCompletionContext
  ratingState: 'loading' | 'eligible' | 'submitting' | 'submitted' | 'unavailable'
  existingRating?: 1 | 2 | 3 | 4 | 5
  onSubmitRating: (rating: 1 | 2 | 3 | 4 | 5) => Promise<void>
  onBack: () => void
}
```

UI 状态约定：

- `loading`：评分区显示简短“正在读取评价状态”，五星不可点击。
- `eligible`：可选择并提交 1–5 星。
- `submitting`：保留选择结果，禁用星级与提交按钮，避免重复请求。
- `submitted`：显示服务端确认的评分和感谢提示，锁定控件。
- `unavailable`：不显示虚构的已提交状态；保留“评价暂不可用”说明与“返回地图”。

当前完成卡片仅有五星选择和提交，不展示评论输入。若后续加入评论、标签或照片，应在 `POST` 契约已有字段上扩展，且必须增加长度、敏感词、图片审核及上传凭证约束。

## 6. 管理端与统计

- 管理端路线满意度应只读取 `GET /summary` 或由服务端聚合表提供的数据，不能读取 C 端本地状态。
- 平均分计算只统计 `published` 且未删除的记录。
- 路线低分预警的阈值、样本量门槛和时间窗口应由管理端配置；默认不得只凭少量 1 星评分触发公开告警。
- 评分分布、平均分、样本量和近期趋势需按 `route_id` 聚合；如需按日期、渠道、游客类型分析，应在服务端带受控筛选条件。

## 7. 安全与风控

- 从认证 token 获取 `user_id` 与 `visit_id`，禁止由客户端传入他人身份。
- `completion_id` 必须校验归属、路线匹配和完成状态。
- `Idempotency-Key` 应至少保留 24 小时，防止网络重试造成重复评价。
- 对同一账户、设备与路线设置合理频率限制；不要用前端禁用按钮替代服务端限制。
- 评论和标签需要内容审核、审计日志与删除策略；评分记录应支持软删除。

## 8. 验收清单

- 已完成路线的登录用户可提交 1–5 星，服务端仅新增一条评价。
- 重复点击、刷新重试和网络超时重试不会增加评分数量。
- 已评价用户重新进入完成卡片时，看到服务端返回的评分且不能重复提交。
- 未完成路线、完成记录无效和未登录用户均不能伪造成功状态。
- `409`、`429`、网络断开和 `5xx` 都能恢复可重试状态，不丢失已选星级。
- 管理端聚合分数与 `published` 评价数据一致，且不含本地演示提交。
