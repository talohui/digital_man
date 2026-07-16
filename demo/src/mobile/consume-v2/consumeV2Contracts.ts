import type { PurchaseCategory } from '../../store/useTicketStore'

/**
 * /consume-v2 的预留后端契约。
 * 当前页面仍使用本地演示数据，不会在浏览器中发起下列请求。
 * 正式接入时由 services 层实现 ConsumeV2BackendPort，视觉组件不直接 fetch。
 */

type ConsumeId = string
type IsoDateTime = string

type ConsumeV2VisitContext = {
  visitId: ConsumeId
  ticketId: ConsumeId
  visitorId?: ConsumeId
  visitDate: string
  groupSize: number
  routeId?: ConsumeId
  currentSpotId?: ConsumeId
}

type ConsumeV2Product = {
  id: ConsumeId
  category: PurchaseCategory
  name: string
  subtitle?: string
  description: string
  imageUrls: string[]
  status: 'draft' | 'scheduled' | 'published' | 'sold_out' | 'offline'
  fulfillmentType: 'pickup' | 'dine_in' | 'ride' | 'admission'
  pickupPointIds: ConsumeId[]
  skuIds: ConsumeId[]
  tags: string[]
  publishedAt?: IsoDateTime
  version: number
}

type ConsumeV2SkuOption = {
  groupId: ConsumeId
  groupName: string
  valueId: ConsumeId
  valueName: string
}

type ConsumeV2Sku = {
  id: ConsumeId
  productId: ConsumeId
  code: string
  options: ConsumeV2SkuOption[]
  price: number
  marketPrice?: number
  stockMode: 'finite' | 'unlimited' | 'session'
  availableStock?: number
  sessionId?: ConsumeId
  status: 'enabled' | 'disabled' | 'sold_out'
  version: number
}

type ConsumeV2Recommendation = {
  requestId: ConsumeId
  productId: ConsumeId
  skuId?: ConsumeId
  reason: string
  reasonSource: 'fay' | 'rule' | 'fallback'
  expiresAt: IsoDateTime
}

type ConsumeV2CartLineInput = {
  productId: ConsumeId
  skuId: ConsumeId
  quantity: number
  pickupPointId?: ConsumeId
  sessionId?: ConsumeId
}

type ConsumeV2PriceQuote = {
  quoteId: ConsumeId
  lines: Array<{
    productId: ConsumeId
    skuId: ConsumeId
    quantity: number
    unitPrice: number
    subtotal: number
    specificationSnapshot: ConsumeV2SkuOption[]
  }>
  promotionLines: Array<{ promotionId: ConsumeId; name: string; discount: number }>
  total: number
  payable: number
  expiresAt: IsoDateTime
}

type ConsumeV2CreateOrderInput = {
  idempotencyKey: string
  quoteId: ConsumeId
  visitContext: ConsumeV2VisitContext
  contact: { name: string; mobile: string }
  lines: ConsumeV2CartLineInput[]
}

type ConsumeV2Order = {
  id: ConsumeId
  orderNo: string
  visitId: ConsumeId
  status: 'pending_payment' | 'paid' | 'ready' | 'fulfilled' | 'cancelled' | 'refunded'
  lines: Array<{
    productId: ConsumeId
    skuId: ConsumeId
    productNameSnapshot: string
    specificationSnapshot: ConsumeV2SkuOption[]
    unitPriceSnapshot: number
    quantity: number
    subtotal: number
    fulfillmentStatus: string
  }>
  total: number
  payable: number
  createdAt: IsoDateTime
}

type ConsumeV2PaymentIntent = {
  paymentId: ConsumeId
  orderId: ConsumeId
  channel: 'wechat' | 'alipay'
  status: 'created' | 'processing' | 'paid' | 'failed' | 'closed'
  clientPayload?: Record<string, unknown>
}

type ConsumeV2ConsumptionSummary = {
  visitId: ConsumeId
  totalSpend: number
  orderCount: number
  spendByCategory: Record<PurchaseCategory, number>
}

interface ConsumeV2BackendPort {
  listProducts(input: {
    category?: PurchaseCategory
    spotId?: ConsumeId
    routeId?: ConsumeId
    cursor?: string
  }): Promise<{ products: ConsumeV2Product[]; skus: ConsumeV2Sku[]; nextCursor?: string }>

  getProductDetail(productId: ConsumeId): Promise<{ product: ConsumeV2Product; skus: ConsumeV2Sku[] }>

  getRecommendation(input: {
    visitContext: ConsumeV2VisitContext
    category: PurchaseCategory
  }): Promise<ConsumeV2Recommendation>

  quoteCart(input: {
    visitContext: ConsumeV2VisitContext
    lines: ConsumeV2CartLineInput[]
    promotionIds?: ConsumeId[]
  }): Promise<ConsumeV2PriceQuote>

  createOrder(input: ConsumeV2CreateOrderInput): Promise<ConsumeV2Order>

  createPaymentIntent(input: {
    orderId: ConsumeId
    channel: ConsumeV2PaymentIntent['channel']
    idempotencyKey: string
  }): Promise<ConsumeV2PaymentIntent>

  getOrder(orderId: ConsumeId): Promise<ConsumeV2Order>
  listVisitOrders(visitId: ConsumeId): Promise<ConsumeV2Order[]>
  getVisitConsumptionSummary(visitId: ConsumeId): Promise<ConsumeV2ConsumptionSummary>
}

export type {
  ConsumeV2BackendPort,
  ConsumeV2CartLineInput,
  ConsumeV2ConsumptionSummary,
  ConsumeV2CreateOrderInput,
  ConsumeV2Order,
  ConsumeV2PaymentIntent,
  ConsumeV2PriceQuote,
  ConsumeV2Product,
  ConsumeV2Recommendation,
  ConsumeV2Sku,
  ConsumeV2SkuOption,
  ConsumeV2VisitContext
}
