# 入境仪式票务 V2：正式迁入与接口契约

## 1. 当前迁入结论与真实服务接入时机

**正式 `/ticket` 已复用入境仪式 V2 的页面与流程。** 当前仍是项目内的本地模拟票务：目录、库存、资格规则、支付与核验凭证尚未接入真实服务。`/ticket-v2` 保留为开发环境下的独立预览入口。

本次正式迁入做了以下过渡处理：

- `src/mobile/MobileTicketPage.tsx` 作为稳定正式路由入口，渲染 `MobileTicketPageV2 mode="formal"`。
- 正式 `/ticket` 与开发预览 `/ticket-v2` 共用 `MobileTicketPageV2.tsx` 和 `ticketV2.css`；已确认的字号、票筹数量、观光车说明换行、小灵语音图标、完成页标题与主按钮样式会同步生效，不维护第二套复制样式。
- 继续使用原 `PaymentSheet` 的模拟支付；支付成功后仍通过 `useTicketStore.submitTicket` 写入本地票务状态，并保留 `captureTicketPurchase` 埋点。
- 将 V2 已选票笺、同行卡和总金额保存为 `TicketProfile` 的快照字段，供 `/consume` 与 `/me` 延续读取。
- `visitId` 现仅为本地生成的模拟行程关联键；不能用于真实核验或跨设备业务。

以下四项完成后，才可以把当前“本地模拟票务”替换为真实票务服务：

1. 票务目录、日期库存、优待资格与联票互斥规则已由后端确认并可查询。
2. 下单、支付、出票、退款/关闭与订单查询接口已经过联调；支付结果以服务端订单状态为准。
3. 本次行程的 `visitId` 已在出票后创建，并能供消费、地图、小灵和个人中心使用。
4. 真实核验凭证由服务端生成；前端不再生成或持久化可用于入园的条码、二维码或核验码。

在以上条件缺失时，正式 `/ticket` 可以继续展示当前体验，但不得声称已经完成真实购票、真实库存锁定或真实入园核验。

## 2. 迁入前模型与当前过渡态

| 维度 | 迁入前 `/ticket` | 当前正式 `/ticket` | 真实服务替换目标 |
| --- | --- | --- | --- |
| 票型 | `standard/family/culture/blessing/leisure` 单一 `ticketType` | 成人、半价、免费、网购联票、观光车等多 SKU 票笺，保存为本地快照 | 以服务端 `ticketSku` 取代前端固定目录 |
| 数量 | `groupSize`，上限 5 | 每个 SKU 独立数量；同行人数由入园票数量投影 | 订单行 `ticketSku + quantity` 为唯一真相 |
| 游客画像 | 年龄段、性别、同行人数 | 同行构成、节奏、兴趣偏好，保存为行旅画像快照 | 行旅画像与实名/资格信息分域保存 |
| 支付 | `PaymentSheet` 本地模拟成功 | 继续使用 `PaymentSheet`，支付成功后写入本地状态 | 创建支付意图后跳转/唤起渠道，轮询或回调确认订单 |
| 凭证 | `ticketId` 本地随机 ID | 展示用本地核验码与条码；`visitId` 为本地关联键 | 服务端返回 `visitId`、订单号、票券凭证 |
| 下游关联 | `ticketId` 关联消费订单 | 继续兼容 `ticketId`，同时预留 `visitId` | 所有 C 端服务以 `visitId` 为主关联键 |

涉及的现有文件：

- 正式购票页：`src/mobile/MobileTicketPage.tsx`
- 现有本地状态：`src/store/useTicketStore.ts`
- V2 原型：`src/mobile/MobileTicketPageV2.tsx`
- 消费页预留上下文：`src/mobile/consume-v2/consumeV2Contracts.ts`
- 小灵拟票边界：`docs/ticket-xiaoling-recommendation-integration.md`

## 3. 推荐的领域字段

### 3.1 行旅画像草稿

这组字段只服务路线、小灵与服务推荐；不应替代优待票核验所需的实名资料。

```ts
type TravelProfileDraft = {
  partyType: 'solo' | 'partner' | 'family_with_children' | 'family_with_elder' | 'friends'
  travelPace: 'slow' | 'balanced' | 'in_depth'
  interestIds: Array<'buddhist_culture' | 'nature_scenery' | 'photography' | 'leisure_walk'>
  consentedAt: string
  updatedAt: string
}

type TicketSelection = {
  ticketSku: string
  quantity: number
}
```

### 3.2 票务目录

```ts
type TicketCatalogItem = {
  ticketSku: string
  name: string
  kind: 'entry' | 'transport_add_on'
  description: string
  eligibilityText: string
  price: number
  currency: 'CNY'
  pricingUnit: 'per_person' | 'per_group'
  inventoryStatus: 'available' | 'limited' | 'unavailable'
  requiresEligibilityVerification: boolean
  maxQuantity?: number
  conflictsWithSkuIds?: string[]
  includedSkuIds?: string[]
}

type TicketCatalogResponse = {
  visitDate: string
  catalogVersion: string
  items: TicketCatalogItem[]
}
```

`conflictsWithSkuIds` 与 `includedSkuIds` 用于处理“网购联票已含观光车”等关系。前端只按返回结果展示和限制，不能自行推断规则。

### 3.3 计价、订单与入园凭证

```ts
type TicketQuote = {
  quoteId: string
  catalogVersion: string
  expiresAt: string
  lines: Array<{
    ticketSku: string
    nameSnapshot: string
    quantity: number
    unitPrice: number
    subtotal: number
    eligibilityTextSnapshot: string
  }>
  total: number
  payable: number
  requiredIdentityFields: Array<'name' | 'mobile' | 'id_type' | 'id_number'>
}

type TicketOrder = {
  orderId: string
  orderNo: string
  status: 'pending_payment' | 'paid' | 'issued' | 'closed' | 'cancelled' | 'refunded'
  visitId?: string
  visitDate: string
  lines: TicketQuote['lines']
  payable: number
  paymentDeadline?: string
  credentials?: Array<{
    credentialId: string
    verificationCode: string
    barcodeImageUrl?: string
    qrCodeImageUrl?: string
    status: 'valid' | 'used' | 'expired' | 'refunded'
  }>
}
```

`credentials` 仅在订单状态为 `issued` 后展示。`verificationCode`、`barcodeImageUrl` 和 `qrCodeImageUrl` 都必须来自可信票务服务，不能复用 V2 的演示随机数据。

## 4. 推荐 API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/tickets/catalog?visitDate=YYYY-MM-DD` | 获取票务目录、可售状态和目录版本 |
| `POST` | `/api/v1/tickets/quotes` | 按日期和 `ticketSku + quantity` 重新校验并计价 |
| `POST` | `/api/v1/tickets/orders` | 以幂等键创建待支付订单 |
| `POST` | `/api/v1/tickets/payments` | 创建支付意图，返回渠道参数 |
| `GET` | `/api/v1/tickets/orders/:orderId` | 查询支付、出票与凭证状态 |
| `GET` | `/api/v1/visits/:visitId` | 获取入园行程上下文，供地图、消费和个人中心使用 |
| `POST` | `/api/c-app/ticket-recommendations` | 获取经规则校验的小灵拟票建议 |

所有写操作应携带 `idempotencyKey`。`quoteId` 过期、目录版本变化、库存不足或资格不满足时，服务端必须返回可展示的业务错误码与新的可选目录，而非仅返回通用失败。

## 5. 正式页面的状态与页面迁移

建议新建独立的票务 API 适配层，例如：

```text
src/api/ticketCatalog.ts
src/api/ticketOrders.ts
src/api/ticketRecommendation.ts
src/mobile/ticket/ticketContracts.ts
```

页面层只消费适配后的 `catalog / quote / order` 状态，不直接解析 Fay 文本或支付回调。推荐状态如下：

```text
catalog_loading
  → catalog_ready
  → quote_loading
  → quote_ready
  → payment_pending
  → payment_confirming
  → issued | payment_failed | order_closed
```

正式迁入时，优先将 `/ticket-v2` 拆分出的视觉组件和流程逻辑迁入新的正式页面实现；不要让正式页面 import 原型的本地随机条码、固定目录或 `resolveTicketRecommendation`。

`useTicketStore` 可在过渡期继续保存一个 **只读投影**（例如 `visitId`、`orderId`、`visitDate`、同行人数与摘要金额），以维持 `/consume`、`/me` 的现有读取方式；但订单真相应改为服务端查询，不能继续以其 `ticketId`、`ticketCost` 作为真实订单或票券凭证。

## 6. 分阶段迁入计划

### 阶段 A：契约与假服务联调（当前已完成页面迁入，可立即开始）

- 固化本文字段与错误码；由后端确认票务目录和资格口径。
- 在前端增加 API 适配层和 mock port；不替换 `/ticket`。
- 用固定 mock 覆盖联票冲突、免费票、库存不足、目录变更和支付超时。

### 阶段 B：灰度接入（满足目录与订单接口后）

- 在开发/测试环境以真实接口驱动 `/ticket-v2`。
- 保留 `PaymentSheet` 仅用于测试环境；生产环境使用真实支付意图和订单轮询。
- 输出 `visitId`，验证其能被 `/consume`、`/map`、`/me` 正确读取。

### 阶段 C：真实服务替换（满足第 1 节四项门槛后）

- 保持现有原路由 `/ticket`，仅将 `MobileTicketPageV2` 的本地目录、`resolveTicketRecommendation`、本地随机凭证与 `PaymentSheet` 替换为 API 适配层。
- 新增真实订单查询和凭证恢复；页面刷新后以 `orderId` 或 `visitId` 恢复状态，不能只依赖 Zustand。
- 为旧本地页面保留短期回退开关；回退只改变页面实现，不改变订单数据契约。
- 监控下单、支付、出票、核验凭证加载和小灵拟票失败率后再移除模拟实现。

## 7. 验收清单

- 同一订单中可正确处理入园票、免费票和交通附加票的数量与金额。
- 网购联票和单独观光车的包含/冲突规则由后端正确拦截。
- 价格、库存、资格或目录版本变化后，支付前会要求游客重新确认。
- Fay 不可用时仍可完成自行择票、计价和下单。
- 支付成功但前端中断后，重新进入能通过订单查询恢复 `issued` 状态和票券凭证。
- `visitId` 可串联消费订单、地图导览、小灵会话和个人中心记录。
- 真实姓名、手机号、证件号不进入普通小灵消息、行为埋点或浏览器持久化状态。
