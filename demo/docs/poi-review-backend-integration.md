# 景点评价后端对接说明

## 1. 目标与当前状态

本文档用于对接 C 端景点详情页的游客评价功能。首个联调页面为：

- 路由：`/map-3d-guide-c/poi/giant_buddha`
- 景点 ID：`giant_buddha`
- 前端页面：`src/pages/Map3DPoiDetailPage.tsx`

当前页面已实现评价卡片、评价抽屉、星级、印象标签、文字评价、评价列表和删除本人评价。现阶段数据保存在浏览器 `localStorage`，只用于交互演示，不是正式数据源。

正式接入后，应以服务端返回的评分统计和评价列表为准；未登录用户可以查看评价，发布和删除评价需要登录。

## 2. 建议接口

统一前缀：`/api/v1/scenic-spots`

| 方法 | 路径 | 鉴权 | 用途 |
| --- | --- | --- | --- |
| `GET` | `/:spotId/reviews/summary` | 否 | 查询评分、数量与标签统计 |
| `GET` | `/:spotId/reviews` | 否 | 分页查询已发布评价 |
| `POST` | `/:spotId/reviews` | 是 | 发布评价 |
| `DELETE` | `/:spotId/reviews/:reviewId` | 是 | 删除本人评价 |
| `POST` | `/:spotId/reviews/:reviewId/like` | 是 | 点赞，可作为后续能力 |
| `DELETE` | `/:spotId/reviews/:reviewId/like` | 是 | 取消点赞，可作为后续能力 |

请求头：

```http
Content-Type: application/json
Authorization: Bearer <access_token>
X-Request-Id: <uuid>
```

`GET` 接口不强制登录，但如果携带令牌，服务端应返回 `isMine`、`likedByMe` 等用户态字段。

## 3. 数据结构

### 3.1 评分统计 `ReviewSummary`

```ts
type ReviewSummary = {
  spotId: string
  averageRating: number       // 0.0 - 5.0，保留一位小数
  reviewCount: number         // 已发布且参与统计的评价数量
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>
  tagStats: Array<{
    tag: string
    count: number
  }>
  updatedAt: string           // ISO 8601
}
```

### 3.2 评价 `SpotReview`

```ts
type SpotReview = {
  id: string
  spotId: string
  rating: 1 | 2 | 3 | 4 | 5
  tags: string[]
  content: string
  status: 'pending' | 'published' | 'rejected'
  author: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
  isMine: boolean
  likeCount: number
  likedByMe: boolean
  visitedAt: string | null
  createdAt: string
  updatedAt: string
}
```

隐私要求：C 端不得返回手机号、证件号、微信 openId 等敏感标识。`author.id` 应使用不可反推真实身份的业务 ID。

## 4. 接口示例

### 4.1 查询评分统计

```http
GET /api/v1/scenic-spots/giant_buddha/reviews/summary
```

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "spotId": "giant_buddha",
    "averageRating": 4.8,
    "reviewCount": 128,
    "ratingDistribution": { "1": 1, "2": 2, "3": 5, "4": 18, "5": 102 },
    "tagStats": [
      { "tag": "庄严震撼", "count": 86 },
      { "tag": "视野开阔", "count": 63 }
    ],
    "updatedAt": "2026-07-16T10:20:30+08:00"
  }
}
```

### 4.2 分页查询评价

```http
GET /api/v1/scenic-spots/giant_buddha/reviews?sort=recommended&cursor=xxx&pageSize=10
```

查询参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `sort` | 否 | `recommended`、`newest`、`highest`、`lowest` |
| `rating` | 否 | 按 1–5 星筛选 |
| `tag` | 否 | 按印象标签筛选 |
| `cursor` | 否 | 游标分页位置，第一页不传 |
| `pageSize` | 否 | 默认 10，最大 30 |

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "items": [
      {
        "id": "rvw_01JZ8M8T4F",
        "spotId": "giant_buddha",
        "rating": 5,
        "tags": ["庄严震撼", "视野开阔"],
        "content": "建议先在佛前广场看整体，再慢慢上行。",
        "status": "published",
        "author": {
          "id": "usr_public_8G2K",
          "displayName": "灵山游客",
          "avatarUrl": null
        },
        "isMine": false,
        "likeCount": 12,
        "likedByMe": false,
        "visitedAt": "2026-07-12T09:30:00+08:00",
        "createdAt": "2026-07-12T16:20:00+08:00",
        "updatedAt": "2026-07-12T16:20:00+08:00"
      }
    ],
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2...",
    "hasMore": true
  }
}
```

### 4.3 发布评价

```http
POST /api/v1/scenic-spots/giant_buddha/reviews
Idempotency-Key: 018f72d3-7f6c-7b5d-a650-9b6b9c7b151f
```

```json
{
  "rating": 5,
  "tags": ["庄严震撼", "值得登临"],
  "content": "登临后的视野很好，建议预留充足时间。",
  "visitId": "visit_20260716_001"
}
```

校验规则：

- `rating` 必填，只允许整数 1–5。
- `tags` 最多 5 个，只允许后台配置的有效标签。
- `content` 去除首尾空格后最多 160 个 Unicode 字符。
- `content` 与 `tags` 至少填写一项。
- `Idempotency-Key` 必填，防止重复点击产生多条评价。
- 建议同一用户、同一景点、同一次 `visitId` 只允许一条主评价；再次提交可返回 `409 REVIEW_ALREADY_EXISTS`，或另行提供编辑接口。

发布成功返回 `201`。如果需要内容审核，返回的 `status` 可以是 `pending`，此时不得立即计入公开评分。

```json
{
  "code": "OK",
  "message": "评价已提交",
  "data": {
    "review": {
      "id": "rvw_01JZ9A1P7K",
      "spotId": "giant_buddha",
      "rating": 5,
      "tags": ["庄严震撼", "值得登临"],
      "content": "登临后的视野很好，建议预留充足时间。",
      "status": "pending",
      "author": {
        "id": "usr_public_A92Q",
        "displayName": "我",
        "avatarUrl": null
      },
      "isMine": true,
      "likeCount": 0,
      "likedByMe": false,
      "visitedAt": null,
      "createdAt": "2026-07-16T14:20:00+08:00",
      "updatedAt": "2026-07-16T14:20:00+08:00"
    }
  }
}
```

### 4.4 删除本人评价

```http
DELETE /api/v1/scenic-spots/giant_buddha/reviews/rvw_01JZ9A1P7K
```

成功返回 `204 No Content`。建议服务端使用软删除并保留审核日志。非本人操作返回 `403 REVIEW_FORBIDDEN`，记录不存在返回 `404 REVIEW_NOT_FOUND`。

## 5. 统一响应与错误码

普通响应：

```ts
type ApiResponse<T> = {
  code: string
  message: string
  data: T
  requestId?: string
}
```

| HTTP | code | 前端处理 |
| --- | --- | --- |
| 400 | `REVIEW_INVALID_ARGUMENT` | 保留输入并提示具体字段错误 |
| 401 | `UNAUTHORIZED` | 拉起登录，登录后恢复未提交内容 |
| 403 | `REVIEW_FORBIDDEN` | 提示无权操作，不从列表移除 |
| 404 | `SPOT_NOT_FOUND` | 隐藏评价入口并记录异常 |
| 404 | `REVIEW_NOT_FOUND` | 刷新评价列表 |
| 409 | `REVIEW_ALREADY_EXISTS` | 提示已评价并定位到本人评价 |
| 409 | `IDEMPOTENCY_CONFLICT` | 查询提交结果，禁止盲目重试 |
| 422 | `REVIEW_CONTENT_REJECTED` | 提示调整内容，不展示敏感审核细节 |
| 429 | `RATE_LIMITED` | 禁用提交按钮并按 `Retry-After` 恢复 |
| 500 | `INTERNAL_ERROR` | 保留草稿，提供重试 |

## 6. 前端接入约定

建议新增 `src/api/poiReviews.ts`，只负责接口调用和 DTO，不把网络请求直接写在页面组件中。

页面加载顺序：

1. 进入景点详情后并行请求 `summary` 和第一页 `reviews`。
2. 评价卡展示真实 `averageRating`、`reviewCount` 和前两条评价摘要。
3. 点击评价跳转时只滚动到卡片；点击卡片入口再打开评价抽屉。
4. 抽屉打开后复用已加载的第一页数据；继续滚动时用 `nextCursor` 加载下一页。
5. 发布成功后将返回评价插入列表顶部，并重新请求 `summary`；审核中的评价只在“我的评价”区域展示。
6. 删除成功后移除对应评价并重新请求 `summary`。

当前本地字段映射：

| 当前前端字段 | 正式接口字段 |
| --- | --- |
| `PoiVisitorReview.id` | `SpotReview.id` |
| `rating` | `rating` |
| `tags` | `tags` |
| `text` | `content` |
| `createdAt` 展示文本 | `createdAt` ISO 时间，由前端格式化 |

正式联调时应删除示例评分 `4.8`、示例数量 `128` 和 `GIANT_BUDDHA_SAMPLE_REVIEWS` 的业务依赖。接口不可用时显示“评价暂不可用”，不得把演示数据与真实数据混合统计。

## 7. 后端数据与审核建议

评价表至少包含：`id`、`spot_id`、`user_id`、`visit_id`、`rating`、`content`、`status`、`created_at`、`updated_at`、`deleted_at`。标签建议使用关联表，避免将不可检索的拼接文本作为唯一存储。

- 评分汇总只统计 `published` 且未删除的评价。
- 删除、拒绝或恢复评价后需要异步重算或原子更新汇总。
- 接入敏感词、广告、灌水和频率限制；保留审核原因与操作日志。
- 用户提交内容输出到 HTML 前必须转义，图片能力后续接入时需要文件类型、大小、病毒与内容安全检测。
- 按用户、设备、IP 和景点组合限流，但不要将原始 IP 写入普通分析日志长期保存。
- `visitId` 应由服务端验证归属，不能仅凭前端传值认定用户真实到访。

## 8. 联调验收清单

- 未登录可以加载评分统计和评价列表。
- 登录后可提交“仅标签”“仅文字”“标签 + 文字”三种评价。
- 重复点击提交不会产生重复记录。
- 审核中评价不会进入公共列表和平均分。
- 用户只能删除自己的评价。
- 删除后列表、数量和平均分最终一致。
- 翻页没有重复或遗漏，新增评价不破坏游标顺序。
- 401、409、422、429 和网络超时均能保留用户草稿。
- 19 个景点都使用同一接口契约，只通过 `spotId` 区分。
