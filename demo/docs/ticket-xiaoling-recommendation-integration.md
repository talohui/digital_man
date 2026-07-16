# 小灵拟票：Fay 对话与票务推荐接口接入说明

本文说明 `/ticket-v2` 中“小灵拟票”面板如何从本地演示规则迁移到真实的 Fay 对话和票务推荐服务。目标是让小灵能理解游客补充需求、推荐有效票种，并允许游客确认后写入正式票务订单。

## 1. 当前原型边界

当前原型在 `src/mobile/MobileTicketPageV2.tsx` 中使用 `resolveTicketRecommendation` 进行本地关键词匹配，仅用于演示以下交互：

1. 读取同行构成、游览节奏、兴趣偏好。
2. 打开“小灵择票面板”。
3. 输入补充需求后，本地判断是否建议加购观光车。
4. 游客按每位同行人的实际资格，分别增减票笺数量；小灵不会替代资格确认。

该规则不可直接用于正式业务：它不了解在售目录、价格日历、库存、适用条件和优惠资格。

当前演示目录已按提供的票务口径呈现，正式上线前仍须由票务目录服务下发：

| 票种 | 演示价格 | 适用 / 说明 |
| --- | ---: | --- |
| 成人票 | ¥210 | 18 周岁以上成年人 |
| 半价票 | ¥105 | 6–18 周岁、全日制本科及以下学生、60–69 周岁老人 |
| 免费票 | ¥0 | 6 周岁以下或 1.4 米以下儿童、70 周岁以上老人、现役军人、残疾人 |
| 网购联票 | ¥225 | 门票 + 观光车，可不限次乘坐 |
| 观光车单独购票 | ¥40 / 人 | 景区内交通，适合希望减少步行的游客 |

“网购联票”和“观光车单独购票”可能重复；正式规则应由后端明确是否允许同单共存，并将结果返回前端。

现有 `src/api/fay.ts` 只提供文本发送 `sendTextToFay` 与 WebSocket 消息监听 `connectFayWS`。Fay 回传文本和数字人状态的字段不稳定，且没有票务结构化结果契约。因此，前端不应直接从 Fay 文本中解析票价或票种。

## 2. 推荐职责边界

| 层级 | 职责 | 不能承担的职责 |
| --- | --- | --- |
| 小灵 / Fay | 理解自然语言、追问缺失信息、生成可读推荐理由和对白 | 决定价格、库存、资格、支付金额 |
| 票务推荐服务 | 基于当前有效票务目录、日期、人数与规则选取候选 SKU | 直接渲染前端或保存支付结果 |
| 票务目录服务 | 提供在售票种、价格、库存、适用条件、日历与版本号 | 理解游客自然语言 |
| C 端前端 | 呈现对话、推荐票笺、采纳/修改状态和支付入口 | 信任任意 LLM 返回的 SKU、价格或金额 |

原则：**Fay 可以建议；只有票务目录服务可以确认。**

## 3. 真实收集的数据

小灵同行卡收集的是能够影响推荐且与体验直接相关的数据；这些字段应作为行程草稿保存，而不是只留在页面状态中。

```ts
type TicketTravelProfileDraft = {
  partyType: 'solo' | 'partner' | 'family_with_children' | 'family_with_elder' | 'friends'
  travelPace: 'slow' | 'balanced' | 'in_depth'
  interestIds: Array<'buddhist_culture' | 'nature_scenery' | 'photography' | 'leisure_walk'>
  updatedAt: string
}

type TicketJourneyDraft = {
  visitDate: string              // YYYY-MM-DD
  ticketSelections: Array<{
    ticketSku: string
    quantity: number
  }>
  travelProfile: TicketTravelProfileDraft
  conversationId?: string
  visitId?: string               // 支付成功后生成/关联
}
```

不应在这一阶段为“个性化”收集身份证、生日、精确住址等高敏感信息。实名购票所需姓名、证件类型/号码、手机号应由受监管的正式下单步骤单独收集、加密处理，并与小灵对话日志隔离。

## 4. 前端请求与响应契约

建议由业务后端提供统一接口，而不是让浏览器直接向 Fay 发送未校验上下文。

### `POST /api/c-app/ticket-recommendations`

```ts
type TicketRecommendationRequest = {
  requestId: string
  conversationId?: string
  journey: TicketJourneyDraft
  userMessage?: string
  catalogVersion?: string
}
```

```ts
type TicketRecommendationResponse = {
  requestId: string
  conversationId: string
  assistantReply: string
  recommendation: {
    suggestedTicketSkus?: string[]
    suggestShuttle?: boolean
    reason: string
    confidence: 'high' | 'medium' | 'low'
    basedOn: Array<'partyType' | 'travelPace' | 'interests' | 'userMessage'>
  } | null
  candidates: Array<{
    ticketSku: string
    name: string
    description: string
    price: number
    currency: 'CNY'
    pricingUnit: 'per_person' | 'per_group'
    eligibilityText: string
    inventoryStatus: 'available' | 'limited' | 'unavailable'
  }>
  missingFields?: Array<'visitDate' | 'groupSize' | 'partyType'>
  catalogVersion: string
}
```

约束：

- `ticketSku` 必须来自当次 `candidates`，前端不可接受孤立的模型输出。
- `price`、`pricingUnit`、资格说明、库存状态都由目录服务返回，不能由 Fay 文本提供。
- `recommendation` 为 `null` 时，前端展示小灵追问或引导游客自行择票，不得猜测默认价格。
- 前端提交“采纳”时必须携带 `ticketSku + catalogVersion`，下单服务再次校验，防止目录变更后继续使用过期价格。

## 5. 服务端编排流程

```text
C 端择票面板
  → 票务推荐服务
      → 查询当前票务目录、价格日历、库存与资格规则
      → 将最小必要的行旅上下文和游客消息提交给 Fay
      → Fay 返回对话意图 / 推荐偏好 / 追问内容
      → 业务规则从有效目录中筛选候选 SKU
      → 票务推荐服务校验并返回结构化推荐
  ← C 端展示对话与推荐票笺
```

Fay 最好通过后端工具调用或结构化 JSON 返回意图，例如：

```json
{
  "intent": "ticket_recommendation",
  "constraints": {
    "preferPace": "slow",
    "hasChild": true,
    "focus": ["buddhist_culture"]
  },
  "reply": "带孩子慢慢游览的话，我优先为你看看亲子票与轻松路线。"
}
```

该 JSON 只是 Fay 的候选意图，仍须由票务推荐服务匹配实际 `ticketSku`。如果当前 Fay 版本只能返回纯文本，则应由后端采用受控解析器或固定 action schema 处理；解析失败时回退为追问，不能自动采纳票种。

## 6. 前端接入步骤

### 6.1 替换本地规则

`MobileTicketPageV2.tsx` 中的 `resolveTicketRecommendation` 是本地演示逻辑。正式接入后：

1. 输入或点击快捷需求时调用 `POST /api/c-app/ticket-recommendations`。
2. 面板展示 `assistantReply`、`candidates` 与 `recommendation`。
3. 推荐票笺使用服务端返回的票种、价格与适用说明渲染。
4. 点击“采纳建议”只写入小灵建议的 `ticketSku`、`catalogVersion` 和推荐请求 ID；游客仍可增减每一类票笺数量。
5. 在支付前调用正式创建订单接口，重新核验价格、库存和资格。

建议新增一个前端适配层，例如 `src/api/ticketRecommendation.ts`，负责请求、超时、错误映射与响应校验；页面组件不应直接处理 Fay 原始 WebSocket 报文。

### 6.2 面板状态

| 状态 | UI 表现 |
| --- | --- |
| `idle` | 展示当前同行卡摘要、快捷需求与输入框 |
| `loading` | 保留上一轮可用票笺；按钮显示“正在请小灵拟票” |
| `ready` | 展示小灵对白、推荐票笺与候选票种 |
| `need_more_info` | 展示小灵追问，不显示可采纳票笺 |
| `fallback` | 显示“暂由你自行择票”，保留票笺目录 |
| `error` | 显示可重试提示，不清空游客已填写的需求 |

每次请求都使用 `requestId`。只接受仍是当前请求的响应，避免快速连续输入时旧推荐覆盖新推荐。

## 7. 正式下单与 `visitId`

推荐不是订单。建议订单链路如下：

1. 游客采纳候选 `ticketSku`。
2. 前端请求 `POST /api/c-app/ticket-orders/preview`，后端返回最终价格、实名字段要求和支付单号。
3. 完成支付后，后端创建 `visitId` 与正式票务订单。
4. 前端将 `visitId` 用于地图导览、消费订单、小灵后续讲解与个人中心行程记录。

现有 `useTicketStore` 中的 `TicketProfile` 可继续作为前端本地展示状态，但其 `ticketId`、`ticketCost` 不能替代后端订单与 `visitId`。现有 `TicketInput` 仍包含 `ageBand`、`gender`；正式迁移前应与票务实名/优待资格规则重新对齐，不能将小灵同行卡字段硬映射为这些字段。

## 8. 错误、隐私与审计

- 对话请求只发送推荐所需的最小行旅字段；实名字段不得发送给普通 Fay 会话。
- 记录 `requestId`、`conversationId`、目录版本、候选 SKU、采纳 SKU 和失败原因，便于排查推荐与库存不一致。
- 不将完整对话文本作为订单备注长期公开保存；按隐私政策设置脱敏、保留期限和删除能力。
- 当价格、库存或资格在支付前发生变化时，明确提示游客重新确认，不默默替换票种。
- 当 Fay 不可用时，票务目录与自行择票必须仍可工作。

## 9. 联调验收

1. 亲子同行 + 舒缓慢游 → 返回在售亲子/轻松候选，不返回下架 SKU。
2. 输入“想重点看梵宫” → 对话理由体现文化偏好，候选票来自当前目录。
3. 输入“带孩子，想轻松游览”后立即再次输入其他需求 → 旧响应不会覆盖新请求。
4. 推荐票价格与订单预览价格一致；目录版本变化后会要求重新确认。
5. Fay 超时/断连时，游客仍可查看目录并自行择票。
6. 推荐面板与支付请求中不出现身份证号、手机号等敏感字段。
