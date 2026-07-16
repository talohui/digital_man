import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TicketAgeBand = '18-24' | '25-34' | '35-44' | '45-59' | '60+'
export type TicketGender = '男' | '女' | '不便透露'
export type TicketType = 'standard' | 'family' | 'culture' | 'blessing' | 'leisure'
export type PurchaseCategory = 'food' | 'shopping' | 'transport' | 'entertainment'

export type TicketSelectionSnapshot = {
  ticketSku: string
  name: string
  quantity: number
  unitPrice: number
  kind: 'entry' | 'transport_add_on'
}

export type TravelProfileSnapshot = {
  partyType?: 'solo' | 'partner' | 'family_with_children' | 'family_with_elder' | 'friends'
  travelPace?: 'slow' | 'balanced' | 'in_depth'
  interestIds?: string[]
}

export type TicketInput = {
  ageBand: TicketAgeBand
  gender: TicketGender
  groupSize: number
  visitDate: string
  ticketType: TicketType
  // V2 入境仪式在本地演示阶段写入的票笺快照；真实票务接入后由订单服务返回。
  ticketSelections?: TicketSelectionSnapshot[]
  travelProfile?: TravelProfileSnapshot
  ticketCost?: number
}

export type TicketProfile = TicketInput & {
  ticketId: string
  ticketCost: number
  // 本地模拟行程关联键。正式环境必须由出票服务返回真实 visitId。
  visitId?: string
  createdAt: string
}

export type PurchaseInput = {
  category: PurchaseCategory
  amount: number
  spotId?: string
  routeId?: string
  ticketId?: string
}

export type PurchaseRecord = PurchaseInput & {
  id: string
  createdAt: string
}

// 商城订单：一次结算生成一张订单，内部仍按行项落 PurchaseRecord，保证大屏消费契约不变。
export type OrderItem = {
  productId: string
  name: string
  category: PurchaseCategory
  price: number
  qty: number
  // 下单时保存已选规格，避免商品配置变化后改写游客的历史雅集单。
  specificationLabel?: string
}

export type OrderRecord = {
  id: string
  items: OrderItem[]
  total: number
  discount?: number
  createdAt: string
  spotId?: string
  routeId?: string
  ticketId?: string
}

export type CheckoutContext = {
  spotId?: string
  routeId?: string
  ticketId?: string
  discount?: number
}

export const ticketTypeOptions: Array<{ id: TicketType; label: string; description: string; price: number }> = [
  { id: 'standard', label: '标准票', description: '适合首次入园，完整导览', price: 210 },
  { id: 'family', label: '亲子套票', description: '同行节奏更轻松', price: 398 },
  { id: 'culture', label: '文化深度票', description: '偏重历史建筑讲解', price: 238 },
  { id: 'blessing', label: '祈福体验票', description: '偏重礼佛与静心路线', price: 268 },
  { id: 'leisure', label: '轻松漫步票', description: '少排队、少折返', price: 198 },
]

export const purchaseCategoryLabels: Record<PurchaseCategory, string> = {
  food: '餐饮',
  shopping: '文创',
  transport: '交通',
  entertainment: '演艺',
}

type TicketState = {
  ticketProfile: TicketProfile | null
  purchases: PurchaseRecord[]
  orders: OrderRecord[]
  submitTicket: (input: TicketInput) => TicketProfile
  addPurchase: (input: PurchaseInput) => PurchaseRecord
  // 结算购物车：生成一张订单，并按行项写入 purchases（保持大屏契约）。
  // 返回订单与对应的 PurchaseRecord 列表，便于调用方逐项埋点 capturePurchase。
  placeOrder: (
    items: OrderItem[],
    context: CheckoutContext
  ) => { order: OrderRecord; records: PurchaseRecord[] }
  totalSpend: () => number
  spendByCategory: () => Record<PurchaseCategory, number>
}

function createId(prefix: string) {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${randomId}`
}

function normalizeGroupSize(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(9, Math.round(value)))
}

function ticketPrice(ticketType: TicketType) {
  return ticketTypeOptions.find((item) => item.id === ticketType)?.price ?? 210
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      ticketProfile: null,
      purchases: [],
      orders: [],
      submitTicket: (input) => {
        const ticket: TicketProfile = {
          ...input,
          groupSize: normalizeGroupSize(input.groupSize),
          ticketId: createId('ticket'),
          visitId: createId('visit'),
          ticketCost: Math.max(0, Math.round((input.ticketCost ?? ticketPrice(input.ticketType)) * 100) / 100),
          ticketSelections: input.ticketSelections?.filter((item) => item.quantity > 0).map((item) => ({
            ...item,
            quantity: Math.max(1, Math.min(9, Math.round(item.quantity))),
            unitPrice: Math.max(0, Math.round(item.unitPrice * 100) / 100),
          })),
          createdAt: new Date().toISOString(),
        }
        set({ ticketProfile: ticket, purchases: [], orders: [] })
        return ticket
      },
      addPurchase: (input) => {
        const record: PurchaseRecord = {
          ...input,
          amount: Math.max(0, Math.round(input.amount * 100) / 100),
          id: createId('purchase'),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ purchases: [record, ...state.purchases].slice(0, 30) }))
        return record
      },
      placeOrder: (items, context) => {
        const createdAt = new Date().toISOString()
        const normalizedItems: OrderItem[] = items
          .filter((item) => item.qty > 0)
          .map((item) => ({
            ...item,
            qty: Math.max(1, Math.round(item.qty)),
            price: Math.max(0, Math.round(item.price * 100) / 100),
          }))
        const grossTotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0)
        const discount = Math.min(grossTotal, Math.max(0, context.discount ?? 0))
        const total = Math.round((grossTotal - discount) * 100) / 100
        const order: OrderRecord = {
          id: createId('order'),
          items: normalizedItems,
          total: Math.round(total * 100) / 100,
          discount: discount || undefined,
          createdAt,
          spotId: context.spotId,
          routeId: context.routeId,
          ticketId: context.ticketId,
        }
        // 每个行项落一条 PurchaseRecord；优惠按金额比例分摊，消费总额与实际支付一致。
        let allocatedTotal = 0
        const records: PurchaseRecord[] = normalizedItems.map((item, index) => {
          const grossAmount = item.price * item.qty
          const isLastItem = index === normalizedItems.length - 1
          const amount = isLastItem
            ? Math.round((total - allocatedTotal) * 100) / 100
            : Math.round((grossTotal > 0 ? grossAmount / grossTotal * total : 0) * 100) / 100
          allocatedTotal += amount
          return {
            id: createId('purchase'),
            category: item.category,
            amount,
            spotId: context.spotId,
            routeId: context.routeId,
            ticketId: context.ticketId,
            createdAt,
          }
        })
        set((state) => ({
          orders: [order, ...state.orders].slice(0, 20),
          purchases: [...records, ...state.purchases].slice(0, 50),
        }))
        return { order, records }
      },
      totalSpend: () => get().purchases.reduce((sum, item) => sum + item.amount, 0),
      spendByCategory: () => get().purchases.reduce<Record<PurchaseCategory, number>>(
        (acc, item) => {
          acc[item.category] += item.amount
          return acc
        },
        { food: 0, shopping: 0, transport: 0, entertainment: 0 }
      ),
    }),
    {
      name: 'lingshan-ticket-store',
      partialize: (state) => ({
        ticketProfile: state.ticketProfile,
        purchases: state.purchases,
        orders: state.orders,
      }),
    }
  )
)
