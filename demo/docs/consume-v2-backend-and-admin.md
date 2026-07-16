# C 端消费 V2 数据接入与 B 端商品管理设计

## 1. 文档目标

本文档为 `/consume-v2` 的视觉原型补充真实业务边界，用于后续联调 C 端、Fay 小灵、商品中心、订单、支付、票务和 B 端运营后台。

当前 `/consume-v2` 为本地预览，正式 `/consume` 已复用其雅集交互，并接入现有本地票务、订单状态和模拟支付。两者都不会发起真实网络请求，不会创建真实后端订单，不会收集手机号或支付数据。预留 TypeScript 契约位于：

- `src/mobile/consume-v2/consumeV2Contracts.ts`

## 2. 为什么必须保存规格快照

商品与规格是 SPU/SKU 关系。用户购买的不是抽象的“灵山素面”，而是带有用餐方式、取餐时间、场次、票型或领取点的具体 SKU。

因此：

- 首次点击“添入”时，必须先选择 SKU，不得自动加入未知规格。
- 购物车保存 `productId + skuId + quantity`，而不是只保存 `productId`。
- 订单保存商品名称、规格、单价和领取信息的下单时快照。B 端后续改名或改价不能改写历史订单。
- 同一 SPU 的不同 SKU 应作为独立购物车行项，不得只按商品 ID 合并。

## 3. C 端需要的数据

### 3.1 游览上下文

- `visitId`：本次入园游览的核心关联 ID。
- `ticketId`、入园日期、同行人数。
- 当前路线 `routeId` 和当前景点 `currentSpotId`。
- 只有在用户授权且业务必要时才传递 `visitorId`。

### 3.2 商品与 SKU

- 商品基础信息、图片、分类、履约方式和可用点位。
- SKU 规格组合、价格、库存、场次和启停状态。
- 餐饮可以管理取餐方式与时段；交通管理票型与有效期；演艺管理场次与剩余名额；文创管理款式与领取点。

### 3.3 小灵推荐

Fay/LLM 只返回稳定标识与推荐理由：`productId`、可选 `skuId`、`reason`和 `requestId`。前端再从商品中心校验商品、SKU、库存与场次。名称、价格和库存不得直接使用模型自由生成文本。

### 3.4 订单和支付

- 前端先请求计价 `quote`，服务端重新校验价格、库存、优惠和场次。
- 创建订单和创建支付单必须分开，并使用幂等键防止重复下单。
- 支付结果以服务端回调和订单查询结果为准，不能只信任 C 端“支付成功”页面。

## 4. 建议 API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/consume/products` | 按分类、景点和路线查询可售商品 |
| `GET` | `/api/v1/consume/products/:id` | 商品详情和 SKU |
| `POST` | `/api/v1/consume/recommendations` | 获取小灵沿途推荐 |
| `POST` | `/api/v1/consume/quotes` | 校验购物车并计算优惠、应付金额 |
| `POST` | `/api/v1/consume/orders` | 幂等创建订单 |
| `POST` | `/api/v1/consume/payments` | 创建支付意图 |
| `GET` | `/api/v1/consume/orders/:id` | 获取订单最终状态 |
| `GET` | `/api/v1/visits/:visitId/orders` | 本次游览订单 |
| `GET` | `/api/v1/visits/:visitId/consumption-summary` | 累计消费、订单数与分类结构 |

## 5. 建议收集的业务事件

| 事件 | 必要字段 | 说明 |
| --- | --- | --- |
| `consume_category_view` | visitId、category、routeId、spotId | 分类曝光 |
| `consume_product_view` | visitId、productId、source | 商品详情查看 |
| `consume_recommendation_view` | requestId、productId、reasonSource | 推荐曝光 |
| `consume_recommendation_accept` | requestId、productId、skuId | 推荐转化 |
| `consume_cart_change` | productId、skuId、quantity | 购物车变化 |
| `consume_checkout_start` | quoteId、lineCount、payable | 开始结算 |
| `consume_order_created` | orderId、visitId、total | 创建订单 |
| `consume_payment_result` | paymentId、orderId、status | 支付结果 |
| `consume_xiaoling_ask` | visitId、orderId?、questionType | 用户就消费或订单询问小灵 |

数据分析默认使用匿名 ID。手机号、支付标识和精确位置不应写入普通行为埋点。

## 6. B 端商品管理信息架构

### 6.1 商品中心

- 商品列表：分类、状态、门店、标签、上下架时间和最近修改人。
- 商品编辑：名称、副标题、详情、图片、履约方式、可用景点和适用路线。
- SKU 规格：规格组、组合、编码、价格、库存、场次和状态。
- 品类模板：餐饮、文创、交通和演艺使用不同的必填字段和校验规则。

### 6.2 库存与场次

- 库存可按 SKU、取货点、日期和场次管理。
- 订单待支付时短暂锁库存，超时或取消后释放。
- 演艺与交通需要容量、锁定数、已售数和可售数的完整口径。

### 6.3 价格与促销

- 基础价、渠道价、日期价和会员价不直接混在商品表中。
- 优惠券和满减需要使用门槛、适用品类、生效时间、互斥规则和总预算。
- 所有优惠由服务端 quote 计算，C 端只展示计算结果。

### 6.4 订单与履约

- 订单查询、退款、核销、备餐/备货、场次改签和异常订单。
- 按门店或取货点分配履约任务，保留操作日志。
- 历史订单展示商品和 SKU 快照，不追随商品当前名称和价格。

### 6.5 小灵推荐运营

- 推荐候选池：可推荐商品、适用景点、路线、时段和人群。
- 屏蔽规则：售罄、即将开场、不适用当前路线或用户已购买。
- 效果看板：曝光、接受、加购、下单和退款，不将简单点击等同于推荐成功。

## 7. B 端权限与发布流程

建议角色：商品编辑、门店管理员、库存管理员、运营审核员、订单客服、财务和系统管理员。

商品发布建议状态机：

`draft 草稿 → pending_review 待审核 → scheduled/published 待发布/已发布 → offline 已下架`

- 改价、批量下架、退款和库存强制调整必须写审计日志。
- 高风险操作需要二次确认或审核，不使用纯前端权限隐藏代替服务端授权。
- 发布后通过版本号和缓存失效通知 C 端，不让用户长时间看到已下架或错价商品。

## 8. 实施顺序

1. 先完成商品、SKU、取货点和场次数据建模。
2. 再完成 B 端商品编辑、审核发布和库存管理。
3. 接入 C 端目录和商品详情，用后端 quote 替换前端金额计算。
4. 接入订单、支付、履约和退款。
5. 最后接入 Fay 推荐和效果分析，避免在商品、库存和订单口径未稳定前训练错误的推荐逻辑。
